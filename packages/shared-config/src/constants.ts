// Redis TTLs (in seconds)
export const REDIS_TTL = {
  BASIC_LOOKUP: 24 * 60 * 60, // 24 hours
  TRUST_LOOKUP: 30 * 60, // 30 minutes
  FEATURE_FLAGS: 5 * 60, // 5 minutes
  RATE_LIMIT_WINDOW: 60, // 1 minute
  SESSION: 30 * 24 * 60 * 60, // 30 days
} as const;

// Redis key patterns (tenant-scoped)
export const REDIS_KEYS = {
  basicLookup: (tenantId: string, ip: string): string =>
    `tenant:${tenantId}:ip:basic:${ip}`,
  trustLookup: (tenantId: string, ip: string): string =>
    `tenant:${tenantId}:ip:trust:${ip}`,
  featureFlag: (tenantId: string, key: string): string =>
    `tenant:${tenantId}:feature:${key}`,
  rateLimit: (tenantId: string, identifier: string): string =>
    `tenant:${tenantId}:rate:${identifier}`,
  session: (userId: string): string => `session:${userId}`,
  refreshToken: (tokenHash: string): string => `refresh:${tokenHash}`,
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// API versioning
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Queue names (BullMQ)
export const QUEUE_NAMES = {
  DATASET_UPDATER: 'dataset-updater',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
  NOTIFICATIONS: 'notifications',
} as const;
