import { HealthStatus, Role } from './enums';

// ============================================================
// API RESPONSE WRAPPER
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  version: string;
}

// ============================================================
// PAGINATION
// ============================================================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================
// AUTH
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  tenantId: string | null;
  iat: number;
  exp: number;
}

// ============================================================
// HEALTH
// ============================================================

export interface HealthResponse {
  healthy: boolean;
  database: HealthStatus;
  redis: HealthStatus;
  version: string;
  uptime: number;
}

export interface ServiceHealth {
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
}

// ============================================================
// FEATURE FLAGS
// ============================================================

export interface FeatureFlagResponse {
  key: string;
  value: boolean;
  tenantId: string | null;
}

// ============================================================
// TENANT
// ============================================================

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}
