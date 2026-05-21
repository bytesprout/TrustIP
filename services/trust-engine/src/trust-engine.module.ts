import { Module } from '@nestjs/common';
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
  exports: [TrustService, REDIS_CLIENT],
})
export class TrustEngineModule {}

export { REDIS_CLIENT };
