// ============================================================
// ENRICHED RESULT (IpLookupResult + privacy from threat intel)
// ============================================================

import type { IpLookupResult } from '@trustip/geo-engine';

export interface PrivacyFlags {
  vpn: boolean;
  proxy: boolean;
  tor: boolean;
}

export interface EnrichedIpResult extends IpLookupResult {
  privacy: PrivacyFlags;
}

export interface ResolvedApiKey {
  id: string;
  tenantId: string;
  scopes: string[];
  keyPrefix: string;
}

export interface ResolvedTenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  status: string;
  rateLimitPerMinute: number;
  rateLimitEnabled: boolean;
  quotaEnabled: boolean;
  monthlyRequestLimit: number | null;
  quotaSoftLimitPercent: number;
  domainLockMode: string;
  allowedDomains: string[];
  ipWhitelistMode: string;
  allowedIps: string[];
}

// ============================================================
// REQUEST AUGMENTATION
// ============================================================

export interface AuthenticatedRequest extends Request {
  tenant: ResolvedTenant;
  apiKey: ResolvedApiKey;
  requestedIp: string;
  requestStartTime: number;
}

// ============================================================
// FROZEN RESPONSE CONTRACTS
// ============================================================

export interface BasicIpResponse {
  success: true;
  timestamp: string;
  ip: {
    address: string;
    version: string;
  };
  location: {
    continent: string | null;
    country: string | null;
    countryCode: string | null;
    state: string | null;
    district: string | null;
    city: string | null;
    zip: string | null;
    timezone: string | null;
    latitude: number | null;
    longitude: number | null;
    geoAccuracyRadiusKm: number | null;
  };
  network: {
    isp: string | null;
    organization: string | null;
    asn: number | null;
    connectionType: string | null;
  };
  metadata: {
    cacheHit: boolean;
    lookupTimeMs: number;
  };
}

export interface IntelligenceIpResponse {
  success: true;
  timestamp: string;
  request: {
    queryIp: string;
    lookupType: 'caller_ip' | 'custom_ip';
    tenantId: string;
  };
  ip: {
    address: string;
    version: string;
    network: string | null;
    reverseDns: string | null;
  };
  location: {
    continent: string | null;
    country: string | null;
    countryCode: string | null;
    state: string | null;
    district: string | null;
    city: string | null;
    zip: string | null;
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    geoAccuracyRadiusKm: number | null;
    confidenceScore: number | null;
  };
  network: {
    isp: string | null;
    organization: string | null;
    asn: number | null;
    connectionType: string | null;
    isHostingProvider: boolean;
  };
  privacy: {
    vpn: boolean;
    proxy: boolean;
    tor: boolean;
    hosting: boolean;
  };
  security: {
    threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    blacklisted: boolean;
    abuseConfidence: number;
  };
  metadata: {
    cacheHit: boolean;
    lookupTimeMs: number;
  };
}

export interface TrustScoreResponse {
  success: true;
  ip: string;
  trust: {
    trustScore: number;
    riskScore: number;
    decision: string;
    confidence: string;
    signals: {
      vpn: boolean;
      proxy: boolean;
      hosting: boolean;
      tor: boolean;
      geoVelocityRisk: boolean;
      concurrentRisk: boolean;
    };
    reasons: string[];
  };
}

// ============================================================
// ERROR RESPONSE CONTRACT — FROZEN
// ============================================================

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// ============================================================
// ANALYTICS TRACKING
// ============================================================

export interface AnalyticsTrackPayload {
  tenantId: string;
  apiKeyId?: string;
  endpoint: string;
  queryIp: string;
  country?: string;
  statusCode: number;
  latencyMs: number;
  cacheHit: boolean;
  scope?: string;
  userAgent?: string;
}

import type { ApiKey, Tenant } from '@prisma/client';

// Cached API key (stored in Redis)
export type CachedApiKey = Pick<ApiKey, 'id' | 'tenantId' | 'scopes' | 'keyPrefix' | 'expiresAt' | 'isActive' | 'status'> & {
  tenant: Pick<Tenant, 'id' | 'name' | 'slug' | 'isActive' | 'status' | 'rateLimitEnabled' | 'rateLimitPerMinute' | 'quotaEnabled' | 'monthlyRequestLimit' | 'quotaSoftLimitPercent' | 'domainLockMode' | 'allowedDomains' | 'ipWhitelistMode' | 'allowedIps'>;
};
