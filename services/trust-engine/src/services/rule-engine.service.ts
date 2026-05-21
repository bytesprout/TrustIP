import { Injectable } from '@nestjs/common';
import { DEFAULT_TRUST_CONFIG } from '../constants/trust.constants';
import type { TrustDecision, TenantTrustConfig } from '../interfaces/trust.interface';

@Injectable()
export class RuleEngineService {
  mergeConfig(tenantOverrides?: Partial<TenantTrustConfig>): TenantTrustConfig {
    if (!tenantOverrides) return { ...DEFAULT_TRUST_CONFIG };
    return { ...DEFAULT_TRUST_CONFIG, ...tenantOverrides };
  }

  applyRules(riskScore: number): TrustDecision {
    if (riskScore < 30) return 'ALLOW';
    if (riskScore < 50) return 'WARN';
    if (riskScore < 70) return 'CHALLENGE';
    if (riskScore < 90) return 'TEMP_BLOCK';
    return 'BLOCK';
  }
}
