import { Injectable, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import {
  REDIS_CLIENT,
  CONCURRENT_SESSION_KEY_PREFIX,
  CONCURRENT_SESSION_WINDOW_SECONDS,
} from '../constants/trust.constants';

@Injectable()
export class ConcurrentRiskService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async detect(
    tenantId: string,
    accountId: string | undefined,
    ip: string,
    maxStreams: number,
  ): Promise<boolean> {
    const sessionKey = accountId ?? ip;
    const key = `tenant:${tenantId}:${CONCURRENT_SESSION_KEY_PREFIX}:${sessionKey}`;
    const now = Date.now();
    const windowStart = now - CONCURRENT_SESSION_WINDOW_SECONDS * 1000;

    try {
      await this.redis.zadd(key, now, `${ip}:${now}`);
      await this.redis.zremrangebyscore(key, '-inf', windowStart);
      await this.redis.expire(key, CONCURRENT_SESSION_WINDOW_SECONDS);
      const count = await this.redis.zcard(key);
      return count > maxStreams;
    } catch {
      return false;
    }
  }
}
