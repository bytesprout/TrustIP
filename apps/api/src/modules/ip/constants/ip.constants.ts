// ============================================================
// API SCOPES
// ============================================================

export const API_SCOPES = {
  BASIC_LOOKUP: 'basic_lookup',
  INTELLIGENCE_LOOKUP: 'intelligence_lookup',
  TRUST_LOOKUP: 'trust_lookup',
  ADMIN_LOOKUP: 'admin_lookup',
  ANALYTICS_LOOKUP: 'analytics_lookup',
} as const;

export type ApiScope = (typeof API_SCOPES)[keyof typeof API_SCOPES];

// ============================================================
// ERROR CODES — FROZEN
// ============================================================

export const API_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  API_KEY_EXPIRED: 'API_KEY_EXPIRED',
  SCOPE_DENIED: 'SCOPE_DENIED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TENANT_DISABLED: 'TENANT_DISABLED',
  DOMAIN_NOT_ALLOWED: 'DOMAIN_NOT_ALLOWED',
  IP_NOT_WHITELISTED: 'IP_NOT_WHITELISTED',
  INVALID_IP: 'INVALID_IP',
  LOOKUP_FAILED: 'LOOKUP_FAILED',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// ============================================================
// DOMAIN LOCK MODES
// ============================================================

export const DOMAIN_LOCK_MODES = {
  DISABLED: 'DISABLED',
  STRICT: 'STRICT',
  WILDCARD: 'WILDCARD',
} as const;

// ============================================================
// IP WHITELIST MODES
// ============================================================

export const IP_WHITELIST_MODES = {
  DISABLED: 'DISABLED',
  STRICT: 'STRICT',
} as const;

// ============================================================
// RATE LIMIT
// ============================================================

export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const RATE_LIMIT_REDIS_KEY_PREFIX = 'tenant:ratelimit';

// Redis cache TTL for resolved API keys (5 minutes)
export const API_KEY_CACHE_TTL_SECONDS = 300;
export const API_KEY_CACHE_PREFIX = 'tenant:apikey:cache';

// ============================================================
// DECORATOR METADATA KEYS
// ============================================================

export const REQUIRED_SCOPES_KEY = 'required_scopes';

// ============================================================
// TRUST SCORE THRESHOLDS
// ============================================================

export const TRUST_SCORE = {
  BASE: 100,
  VPN_DEDUCT: 40,
  TOR_DEDUCT: 60,
  PROXY_DEDUCT: 40,
  HOSTING_DEDUCT: 20,
  RESIDENTIAL_BONUS: 5,
  HIGH_THRESHOLD: 75,
  MEDIUM_THRESHOLD: 40,
} as const;
