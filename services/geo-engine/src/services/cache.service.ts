import { Injectable, Logger, Inject } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_KEYS, REDIS_TTL } from '@trustip/shared-config';
import type { IpLookupResult } from '../interfaces/geo-result.interface';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class GeoCacheService {
  private readonly logger = new Logger(GeoCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(tenantId: string, ip: string): Promise<IpLookupResult | null> {
    const key = REDIS_KEYS.basicLookup(tenantId, ip);
    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;
      return JSON.parse(cached) as IpLookupResult;
    } catch (err) {
      this.logger.warn(`Cache get failed for ${key}: ${String(err)}`);
      return null;
    }
  }

  async set(tenantId: string, ip: string, result: IpLookupResult): Promise<void> {
    const key = REDIS_KEYS.basicLookup(tenantId, ip);
    try {
      await this.redis.setex(key, REDIS_TTL.BASIC_LOOKUP, JSON.stringify(result));
    } catch (err) {
      this.logger.warn(`Cache set failed for ${key}: ${String(err)}`);
    }
  }

  async invalidate(tenantId: string, ip: string): Promise<void> {
    const key = REDIS_KEYS.basicLookup(tenantId, ip);
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Cache invalidate failed for ${key}: ${String(err)}`);
    }
  }
}
