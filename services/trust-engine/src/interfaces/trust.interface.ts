import type { IpLookupResult } from '@trustip/geo-engine';

export interface TrustSignals {
  vpn: boolean;
  proxy: boolean;
  hosting: boolean;
  tor: boolean;
  geoVelocityRisk: boolean;
  concurrentRisk: boolean;
}

export type TrustDecision = 'ALLOW' | 'WARN' | 'CHALLENGE' | 'TEMP_BLOCK' | 'BLOCK';

export interface TrustOutput {
  trustScore: number;
  riskScore: number;
  decision: TrustDecision;
  confidence: string;
  signals: TrustSignals;
  reasons: string[];
}

export interface TenantTrustConfig {
  vpnPenalty: number;
  hostingPenalty: number;
  torPenalty: number;
  proxyPenalty: number;
  geoAnomalyPenalty: number;
  concurrentPenalty: number;
  allowVpn: boolean;
  enableGeoAnomaly: boolean;
  enableConcurrentChecks: boolean;
  maxConcurrentStreams: number;
}

export interface HistoryResult {
  stableIp: boolean;
  trustedHistory: boolean;
  residentialIsp: boolean;
}

export interface TrustInput {
  ip: string;
  tenantId: string;
  geoResult: IpLookupResult;
  privacyFlags: {
    vpn: boolean;
    proxy: boolean;
    tor: boolean;
  };
  accountId?: string;
  tenantConfig?: Partial<TenantTrustConfig>;
}
