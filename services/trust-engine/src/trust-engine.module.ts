import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './constants/trust.constants';
import { TrustService } from './services/trust.service';
import { VpnDetectorService } from './services/vpn-detector.service';
import { TorDetectorService } from './services/tor-detector.service';
import { ProxyDetectorService } from './services/proxy-detector.service';
import { HostingDetectorService } from './services/hosting-detector.service';
import { GeoAnomalyService } from './services/geo-anomaly.service';
import { ConcurrentRiskService } from './services/concurrent-risk.service';
import { HistoryRiskService } from './services/history-risk.service';
import { ScoringService } from './services/scoring.service';
import { RuleEngineService } from './services/rule-engine.service';
import { ExplainabilityService } from './services/explainability.service';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis =>
        new Redis({
          host: process.env.REDIS_HOST ?? 'redis',
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD || undefined,
        }),
    },
    TrustService,
    VpnDetectorService,
    TorDetectorService,
    ProxyDetectorService,
    HostingDetectorService,
    GeoAnomalyService,
    ConcurrentRiskService,
    HistoryRiskService,
    ScoringService,
    RuleEngineService,
    ExplainabilityService,
  ],
  exports: [REDIS_CLIENT, TrustService],
})
export class TrustEngineModule {}

export { REDIS_CLIENT };
