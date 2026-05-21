// ============================================================
// ENUMS
// ============================================================

export enum AppMode {
  SAAS = 'saas',
  ENTERPRISE = 'enterprise',
}

export enum AppEnv {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

// Use const + type pattern for Prisma compatibility (avoids nominal enum mismatch)
export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  TENANT_MANAGER: 'TENANT_MANAGER',
  VIEWER: 'VIEWER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export enum ApiScope {
  BASIC_LOOKUP = 'basic_lookup',
  INTELLIGENCE_LOOKUP = 'intelligence_lookup',
  TRUST_LOOKUP = 'trust_lookup',
  ADMIN_LOOKUP = 'admin_lookup',
  ANALYTICS_LOOKUP = 'analytics_lookup',
}

export enum TrustDecision {
  ALLOW = 'ALLOW',
  WARN = 'WARN',
  CHALLENGE = 'CHALLENGE',
  TEMP_BLOCK = 'TEMP_BLOCK',
  BLOCK = 'BLOCK',
}

export enum FeatureFlagKey {
  TRUST_ENGINE = 'trustEngine',
  BILLING = 'billing',
  GEO_ANOMALY = 'geoAnomaly',
  ANALYTICS = 'analytics',
  VPN_DETECTION = 'vpnDetection',
}

export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
}
