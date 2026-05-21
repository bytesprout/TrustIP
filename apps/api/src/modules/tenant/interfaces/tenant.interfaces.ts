import type { Request } from 'express';
import type { JwtPayload } from '@trustip/shared-types';

export interface TenantScopedRequest extends Request {
  user?: JwtPayload;
  tenant?: {
    id: string;
  };
}

export interface QuotaCheckResult {
  exceeded: boolean;
  softLimitReached: boolean;
  limit: number | null;
  used: number;
  remaining: number | null;
  resetAt: number;
}

export interface GeneratedApiKey {
  id: string;
  prefix: string;
  plainKey: string;
}
