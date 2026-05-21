import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import * as crypto from 'crypto';
import * as net from 'net';
import {
  API_KEY_CACHE_PREFIX,
  API_KEY_CACHE_TTL_SECONDS,
  DOMAIN_LOCK_MODES,
  IP_WHITELIST_MODES,
  RATE_LIMIT_REDIS_KEY_PREFIX,
  RATE_LIMIT_WINDOW_SECONDS,
} from '../constants/ip.constants';
import type { CachedApiKey, ResolvedApiKey, ResolvedTenant } from '../interfaces/ip.interfaces';
import { ApiKeyStatus } from '@prisma/client';

export interface ValidationResult {
  valid: boolean;
  errorCode?: string;
  errorMessage?: string;
  apiKey?: ResolvedApiKey;
  tenant?: ResolvedTenant;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number;
  exceeded: boolean;
}

@Injectable()
export class TenantValidationService {
  private readonly logger = new Logger(TenantValidationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Full tenant resolution and validation pipeline */
  async validate(
    rawApiKey: string,
    requestOrigin: string | undefined,
    requestReferer: string | undefined,
    callerIp: string | undefined,
  ): Promise<ValidationResult> {
    // 1. Resolve API key
    const resolved = await this.resolveApiKey(rawApiKey);
    if (!resolved) {
      return { valid: false, errorCode: 'INVALID_API_KEY', errorMessage: 'Invalid API key' };
    }

    // 2. Check key active + not expired
    if (!resolved.isActive) {
      return { valid: false, errorCode: 'INVALID_API_KEY', errorMessage: 'API key is inactive' };
    }
    if (resolved.status !== ApiKeyStatus.ACTIVE) {
      return { valid: false, errorCode: 'INVALID_API_KEY', errorMessage: 'API key is inactive' };
    }
    if (resolved.expiresAt && resolved.expiresAt < new Date()) {
      return { valid: false, errorCode: 'API_KEY_EXPIRED', errorMessage: 'API key has expired' };
    }

    // 3. Check tenant active
    if (!resolved.tenant.isActive) {
      return { valid: false, errorCode: 'TENANT_DISABLED', errorMessage: 'Tenant access disabled' };
    }
    if (resolved.tenant.status !== 'ACTIVE' && resolved.tenant.status !== 'TRIAL') {
      return { valid: false, errorCode: 'TENANT_DISABLED', errorMessage: 'Tenant access disabled' };
    }

    const allowedDomains = await this.resolveAllowedDomains(resolved.tenant.id, resolved.tenant.allowedDomains);
    const allowedIps = await this.resolveAllowedIps(resolved.tenant.id, resolved.tenant.allowedIps);

    // 4. Domain lock validation
    const domainResult = await this.validateDomainLock(
      resolved.tenant,
      allowedDomains,
      requestOrigin,
      requestReferer,
    );
    if (!domainResult.valid) return domainResult;

    // 5. IP whitelist validation
    const ipResult = await this.validateIpWhitelist(resolved.tenant, allowedIps, callerIp);
    if (!ipResult.valid) return ipResult;

    // Update last used (fire-and-forget)
    this.updateLastUsed(resolved.id).catch((err: unknown) => {
      this.logger.debug(`Failed to update API key last_used_at: ${String(err)}`);
    });

    return {
      valid: true,
      apiKey: {
        id: resolved.id,
        tenantId: resolved.tenantId,
        scopes: resolved.scopes,
        keyPrefix: resolved.keyPrefix,
      },
      tenant: {
        id: resolved.tenant.id,
        name: resolved.tenant.name,
        slug: resolved.tenant.slug,
        isActive: resolved.tenant.isActive,
        status: resolved.tenant.status,
        rateLimitPerMinute: resolved.tenant.rateLimitPerMinute,
        rateLimitEnabled: resolved.tenant.rateLimitEnabled,
        quotaEnabled: resolved.tenant.quotaEnabled,
        monthlyRequestLimit: resolved.tenant.monthlyRequestLimit,
        quotaSoftLimitPercent: resolved.tenant.quotaSoftLimitPercent,
        domainLockMode: resolved.tenant.domainLockMode,
        allowedDomains,
        ipWhitelistMode: resolved.tenant.ipWhitelistMode,
        allowedIps,
      },
    };
  }

  /** Check rate limit and return current window info */
  async checkRateLimit(tenantId: string, limit: number): Promise<RateLimitInfo> {
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % RATE_LIMIT_WINDOW_SECONDS);
    const resetAt = windowStart + RATE_LIMIT_WINDOW_SECONDS;
    const key = `${RATE_LIMIT_REDIS_KEY_PREFIX}:${tenantId}:${windowStart}`;

    const client = this.redis.getClient();
    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, RATE_LIMIT_WINDOW_SECONDS * 2);
    }

    const remaining = Math.max(0, limit - current);
    return {
      limit,
      remaining,
      resetAt,
      exceeded: current > limit,
    };
  }

  // ------------------------------------------------------------------
  // PRIVATE HELPERS
  // ------------------------------------------------------------------

  private async resolveApiKey(rawApiKey: string): Promise<CachedApiKey | null> {
    if (!rawApiKey || rawApiKey.length < 8) return null;

    const prefix = rawApiKey.substring(0, 8);
    const cacheKey = `${API_KEY_CACHE_PREFIX}:${prefix}`;

    // Check Redis cache first
    const cached = await this.redis.getJson<CachedApiKey>(cacheKey);
    if (cached) {
      // Verify hash matches cached record
      if (this.hashKey(rawApiKey) === this.hashKey(rawApiKey)) {
        // Re-verify the actual hash vs stored hash
        const storedHash = await this.getStoredHash(cached.id);
        if (storedHash && this.timingSafeEquals(this.hashApiKey(rawApiKey), storedHash)) {
          return cached;
        }
      }
      // Hash mismatch — invalid key for this prefix
      return null;
    }

    // Database lookup by prefix
    const apiKeys = await this.prisma.apiKey.findMany({
      where: { keyPrefix: prefix, isActive: true, status: ApiKeyStatus.ACTIVE },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            status: true,
            rateLimitEnabled: true,
            rateLimitPerMinute: true,
            quotaEnabled: true,
            monthlyRequestLimit: true,
            quotaSoftLimitPercent: true,
            domainLockMode: true,
            allowedDomains: true,
            ipWhitelistMode: true,
            allowedIps: true,
          },
        },
      },
    });

    const inputHash = this.hashApiKey(rawApiKey);
    const matched = apiKeys.find((k) =>
      this.timingSafeEquals(inputHash, k.keyHash),
    );

    if (!matched) return null;

    const cachePayload: CachedApiKey = {
      id: matched.id,
      tenantId: matched.tenantId,
      scopes: matched.scopes,
      keyPrefix: matched.keyPrefix,
      expiresAt: matched.expiresAt,
      isActive: matched.isActive,
      status: matched.status,
      tenant: matched.tenant,
    };

    // Cache the resolved key
    await this.redis.setJson(cacheKey, cachePayload, API_KEY_CACHE_TTL_SECONDS);

    return cachePayload;
  }

  private async getStoredHash(apiKeyId: string): Promise<string | null> {
    const record = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { keyHash: true },
    });
    return record?.keyHash ?? null;
  }

  private hashApiKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  private timingSafeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
    } catch {
      return false;
    }
  }

  private async validateDomainLock(
    tenant: ResolvedTenant,
    allowedDomains: string[],
    origin: string | undefined,
    referer: string | undefined,
  ): Promise<ValidationResult> {
    if (tenant.domainLockMode === DOMAIN_LOCK_MODES.DISABLED) {
      return { valid: true };
    }

    const requestHost = this.extractHostFromOriginOrReferer(origin, referer);
    if (!requestHost) {
      return {
        valid: false,
        errorCode: 'DOMAIN_NOT_ALLOWED',
        errorMessage: 'Domain validation failed: no Origin or Referer header',
      };
    }

    const allowed = allowedDomains;
    if (!allowed || allowed.length === 0) return { valid: true };

    if (tenant.domainLockMode === DOMAIN_LOCK_MODES.STRICT) {
      if (!allowed.includes(requestHost)) {
        return {
          valid: false,
          errorCode: 'DOMAIN_NOT_ALLOWED',
          errorMessage: 'Domain not allowed',
        };
      }
    } else if (tenant.domainLockMode === DOMAIN_LOCK_MODES.WILDCARD) {
      const matches = allowed.some((pattern) => this.matchWildcard(pattern, requestHost));
      if (!matches) {
        return {
          valid: false,
          errorCode: 'DOMAIN_NOT_ALLOWED',
          errorMessage: 'Domain not allowed',
        };
      }
    }

    return { valid: true };
  }

  private async validateIpWhitelist(
    tenant: ResolvedTenant,
    allowedIps: string[],
    callerIp: string | undefined,
  ): Promise<ValidationResult> {
    if (tenant.ipWhitelistMode === IP_WHITELIST_MODES.DISABLED) {
      return { valid: true };
    }

    if (!callerIp) {
      return {
        valid: false,
        errorCode: 'IP_NOT_WHITELISTED',
        errorMessage: 'Unable to determine caller IP for whitelist check',
      };
    }

    const allowed = allowedIps;
    if (!allowed || allowed.length === 0) return { valid: true };

    const isAllowed = allowed.some((entry) => this.ipMatchesCidrOrExact(callerIp, entry));
    if (!isAllowed) {
      return {
        valid: false,
        errorCode: 'IP_NOT_WHITELISTED',
        errorMessage: 'Caller IP is not whitelisted',
      };
    }

    return { valid: true };
  }

  private async resolveAllowedDomains(tenantId: string, fallback: string[]): Promise<string[]> {
    const rows = await this.prisma.tenantDomain.findMany({
      where: { tenantId },
      select: { domain: true },
    });

    if (rows.length === 0) {
      return fallback;
    }

    return rows.map((row) => row.domain);
  }

  private async resolveAllowedIps(tenantId: string, fallback: string[]): Promise<string[]> {
    const rows = await this.prisma.tenantIpWhitelist.findMany({
      where: { tenantId },
      select: { ip: true },
    });

    if (rows.length === 0) {
      return fallback;
    }

    return rows.map((row) => row.ip);
  }

  private extractHostFromOriginOrReferer(
    origin: string | undefined,
    referer: string | undefined,
  ): string | null {
    try {
      if (origin) return new URL(origin).hostname;
      if (referer) return new URL(referer).hostname;
    } catch {
      // Invalid URL
    }
    return null;
  }

  private matchWildcard(pattern: string, host: string): boolean {
    if (pattern.startsWith('*.')) {
      const suffix = pattern.slice(2);
      return host === suffix || host.endsWith(`.${suffix}`);
    }
    return pattern === host;
  }

  private ipMatchesCidrOrExact(ip: string, entry: string): boolean {
    if (!entry.includes('/')) {
      return ip === entry;
    }
    // CIDR check
    try {
      const [cidrIp, prefixStr] = entry.split('/');
      const prefix = parseInt(prefixStr, 10);
      return this.ipInCidr(ip, cidrIp, prefix);
    } catch {
      return false;
    }
  }

  private ipInCidr(ip: string, cidrBase: string, prefix: number): boolean {
    // Only IPv4 supported for now
    if (!net.isIPv4(ip) || !net.isIPv4(cidrBase)) return false;
    const ipNum = this.ipToNumber(ip);
    const cidrNum = this.ipToNumber(cidrBase);
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    return (ipNum & mask) === (cidrNum & mask);
  }

  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  private async updateLastUsed(apiKeyId: string): Promise<void> {
    await this.prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt: new Date() },
    });
  }
}
