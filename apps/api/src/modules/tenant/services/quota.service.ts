import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { QUOTA_REDIS_KEY_PREFIX } from '../constants/tenant.constants';
import type { QuotaCheckResult } from '../interfaces/tenant.interfaces';

@Injectable()
export class QuotaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async checkAndConsume(tenantId: string): Promise<QuotaCheckResult> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        quotaEnabled: true,
        monthlyRequestLimit: true,
        quotaSoftLimitPercent: true,
      },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found');
    }

    const now = new Date();
    const monthToken = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const key = `${QUOTA_REDIS_KEY_PREFIX}:${tenantId}:${monthToken}`;
    const client = this.redis.getClient();

    const used = await client.incr(key);

    // Keep quota counter until next UTC month boundary + 1 day safety
    if (used === 1) {
      const resetAtDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
      const ttlSeconds = Math.max(1, Math.floor((resetAtDate.getTime() - now.getTime()) / 1000) + 86400);
      await client.expire(key, ttlSeconds);
    }

    const resetAt = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0) / 1000);

    if (!tenant.quotaEnabled || tenant.monthlyRequestLimit === null) {
      return {
        exceeded: false,
        softLimitReached: false,
        limit: null,
        used,
        remaining: null,
        resetAt,
      };
    }

    const limit = tenant.monthlyRequestLimit;
    const remaining = Math.max(0, limit - used);
    const softLimit = Math.floor((limit * tenant.quotaSoftLimitPercent) / 100);

    return {
      exceeded: used > limit,
      softLimitReached: used >= softLimit,
      limit,
      used,
      remaining,
      resetAt,
    };
  }

  async getQuotaSnapshot(tenantId: string): Promise<QuotaCheckResult> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        quotaEnabled: true,
        monthlyRequestLimit: true,
        quotaSoftLimitPercent: true,
      },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant not found');
    }

    const now = new Date();
    const monthToken = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const key = `${QUOTA_REDIS_KEY_PREFIX}:${tenantId}:${monthToken}`;
    const rawUsed = await this.redis.get(key);
    const used = rawUsed ? parseInt(rawUsed, 10) : 0;
    const resetAt = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0) / 1000);

    if (!tenant.quotaEnabled || tenant.monthlyRequestLimit === null) {
      return {
        exceeded: false,
        softLimitReached: false,
        limit: null,
        used,
        remaining: null,
        resetAt,
      };
    }

    const limit = tenant.monthlyRequestLimit;
    const softLimit = Math.floor((limit * tenant.quotaSoftLimitPercent) / 100);

    return {
      exceeded: used > limit,
      softLimitReached: used >= softLimit,
      limit,
      used,
      remaining: Math.max(0, limit - used),
      resetAt,
    };
  }
}