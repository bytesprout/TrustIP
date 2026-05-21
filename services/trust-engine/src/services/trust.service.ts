import { Injectable, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import {
  REDIS_CLIENT,
  TRUST_CACHE_KEY_PREFIX,
  TRUST_CACHE_TTL_SECONDS,
  TRUST_HISTORY_KEY_PREFIX,
} from '../constants/trust.constants';
import type { TrustInput, TrustOutput, TrustSignals } from '../interfaces/trust.interface';
import { VpnDetectorService } from './vpn-detector.service';
import { TorDetectorService } from './tor-detector.service';
import { ProxyDetectorService } from './proxy-detector.service';
import { HostingDetectorService } from './hosting-detector.service';
import { GeoAnomalyService } from './geo-anomaly.service';
import { ConcurrentRiskService } from './concurrent-risk.service';
import { HistoryRiskService } from './history-risk.service';
import { ScoringService } from './scoring.service';
import { RuleEngineService } from './rule-engine.service';
import { ExplainabilityService } from './explainability.service';

@Injectable()
export class TrustService {
  constructor(
    private readonly vpnDetector: VpnDetectorService,
    private readonly torDetector: TorDetectorService,
    private readonly proxyDetector: ProxyDetectorService,
    private readonly hostingDetector: HostingDetectorService,
    private readonly geoAnomaly: GeoAnomalyService,
    private readonly concurrentRisk: ConcurrentRiskService,
    private readonly historyRisk: HistoryRiskService,
    private readonly scoring: ScoringService,
    private readonly ruleEngine: RuleEngineService,
    private readonly explainability: ExplainabilityService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async evaluate(input: TrustInput): Promise<TrustOutput> {
    const config = this.ruleEngine.mergeConfig(input.tenantConfig);
    const { ip, tenantId, geoResult, privacyFlags } = input;

    const cacheKey = `tenant:${tenantId}:${TRUST_CACHE_KEY_PREFIX}:${ip}`;
    const cached = await this.redis.get(cacheKey).catch(() => null);
    if (cached) {
      return JSON.parse(cached) as TrustOutput;
    }

    const [isVpn, isTor, isProxy, isGeoAnomaly, isConcurrent, history] = await Promise.all([
      this.vpnDetector.detect(ip, geoResult.network?.isp ?? '', config),
      this.torDetector.detect(ip),
      this.proxyDetector.detect(ip),
      config.enableGeoAnomaly
        ? this.geoAnomaly.detect(ip, tenantId, geoResult.location?.countryCode ?? null)
        : Promise.resolve(false),
      config.enableConcurrentChecks
        ? this.concurrentRisk.detect(tenantId, input.accountId, ip, config.maxConcurrentStreams)
        : Promise.resolve(false),
      this.historyRisk.evaluate(ip, tenantId, geoResult),
    ]);

    const finalVpn = isVpn || privacyFlags.vpn;
    const finalTor = isTor || privacyFlags.tor;
    const finalProxy = isProxy || privacyFlags.proxy;
    const isHosting = this.hostingDetector.detect(
      geoResult.network?.isp ?? '',
      geoResult.network?.connectionType,
    );

    const signals: TrustSignals = {
      vpn: finalVpn,
      proxy: finalProxy,
      tor: finalTor,
      hosting: isHosting,
      geoVelocityRisk: isGeoAnomaly,
      concurrentRisk: isConcurrent,
    };

    const { riskScore, reasons } = this.scoring.compute(
      signals,
      history,
      geoResult.geoConfidence?.score ?? 50,
      config,
    );

    const trustScore = Math.max(0, 100 - riskScore);
    const decision = this.ruleEngine.applyRules(riskScore);
    const confidence = this.explainability.buildConfidence(
      geoResult.geoConfidence?.score ?? 50,
      Object.values(signals).filter(Boolean).length,
    );

    const result: TrustOutput = {
      trustScore,
      riskScore,
      decision,
      confidence,
      signals,
      reasons,
    };

    this.redis
      .setex(cacheKey, TRUST_CACHE_TTL_SECONDS, JSON.stringify(result))
      .catch(() => undefined);

    // Update history for next evaluation
    const historyKey = `tenant:${tenantId}:${TRUST_HISTORY_KEY_PREFIX}:${ip}`;
    this.redis
      .set(historyKey, JSON.stringify({ trustScore, seenAt: Date.now() }), 'EX', 86400 * 30)
      .catch(() => undefined);

    return result;
  }
}
