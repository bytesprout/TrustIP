export const TENANT_API_PREFIX = 'tenants';

export const QUOTA_REDIS_KEY_PREFIX = 'tenant:quota';

export const AUDIT_SEVERITY = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const;

export type AuditSeverity = (typeof AUDIT_SEVERITY)[keyof typeof AUDIT_SEVERITY];

export const TENANT_STATUS = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  SUSPENDED: 'SUSPENDED',
  TRIAL: 'TRIAL',
} as const;

export const API_KEY_STATUS = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;

export const DOMAIN_MODE = {
  DISABLED: 'DISABLED',
  STRICT: 'STRICT',
  WILDCARD: 'WILDCARD',
} as const;

export const WHITELIST_ENTRY_TYPE = {
  SINGLE: 'SINGLE',
  CIDR: 'CIDR',
} as const;

export const DEFAULT_ANALYTICS_RETENTION_DAYS = 90;

export const DEFAULT_MONTHLY_REQUEST_LIMIT = 100000;

export const API_KEY_PREFIX = {
  LIVE: 'tip_live_',
  TEST: 'tip_test_',
} as const;
