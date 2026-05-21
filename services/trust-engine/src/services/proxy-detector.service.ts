import { Injectable, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT, REDIS_KEY_FIREHOL } from '../constants/trust.constants';

@Injectable()
export class ProxyDetectorService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async detect(ip: string): Promise<boolean> {
    try {
      const result = await this.redis.sismember(REDIS_KEY_FIREHOL, ip);
      return result === 1;
    } catch {
      return false;
    }
  }
}
