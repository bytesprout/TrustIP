import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { FeatureFlagKey } from '@trustip/shared-types';
import { REDIS_KEYS, REDIS_TTL } from '@trustip/shared-config';
import type { FeatureFlagResponse } from '@trustip/shared-types';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll(tenantId: string | null): Promise<FeatureFlagResponse[]> {
    const keys = Object.values(FeatureFlagKey);
    const flags = await Promise.all(keys.map((key) => this.getFlag(key, tenantId)));
    return flags;
  }

  async getFlag(key: string, tenantId: string | null): Promise<FeatureFlagResponse> {
    const cacheKey = tenantId
      ? REDIS_KEYS.featureFlag(tenantId, key)
      : `global:feature:${key}`;

    const cached = await this.redis.getJson<FeatureFlagResponse>(cacheKey);
    if (cached !== null) return cached;

    // Tenant-specific flag takes precedence over global
    let flag = tenantId
      ? await this.prisma.featureFlag.findUnique({ where: { key_tenantId: { key, tenantId } } })
      : null;

    // Fallback to global flag
    if (!flag) {
      flag = await this.prisma.featureFlag.findFirst({
        where: { key, tenantId: null },
      });
    }

    const result: FeatureFlagResponse = {
      key,
      value: flag?.value ?? false,
      tenantId: flag?.tenantId ?? null,
    };

    await this.redis.setJson(cacheKey, result, REDIS_TTL.FEATURE_FLAGS);
    return result;
  }

  async updateFlag(
    key: string,
    value: boolean,
    tenantId: string | null,
  ): Promise<FeatureFlagResponse> {
    const flag = await this.prisma.featureFlag.upsert({
      where: { key_tenantId: { key, tenantId: tenantId ?? '' } },
      update: { value },
      create: { key, value, tenantId },
    });

    // Invalidate cache
    const cacheKey = tenantId
      ? REDIS_KEYS.featureFlag(tenantId, key)
      : `global:feature:${key}`;
    await this.redis.del(cacheKey);

    this.logger.log(`Feature flag updated: ${key} = ${String(value)} (tenant: ${tenantId ?? 'global'})`);

    return { key: flag.key, value: flag.value, tenantId: flag.tenantId };
  }
}
