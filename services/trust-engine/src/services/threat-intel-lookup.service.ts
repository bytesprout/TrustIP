import { Injectable, Inject, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT } from '../constants/trust.constants';
import { isIpInCidr } from '../utils/ip-cidr.util';

type CacheValue = { value: boolean; expiresAt: number };

const CIDR_KEY_SUFFIX = ':cidr';
const CIDR_SCAN_COUNT = 1000;
const CIDR_CACHE_TTL_MS = 60_000;

@Injectable()
export class ThreatIntelLookupService {
  private readonly logger = new Logger(ThreatIntelLookupService.name);
  private readonly cache = new Map<string, CacheValue>();

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async isListed(redisKey: string, ip: string): Promise<boolean> {
    const exact = await this.redis.sismember(redisKey, ip).catch((err) => {
      this.logger.warn(`Threat-intel exact lookup failed (${redisKey}, ${ip}): ${String(err)}`);
      return 0;
    });
    if (exact === 1) {
      this.cache.set(`${redisKey}:${ip}`, { value: true, expiresAt: Date.now() + CIDR_CACHE_TTL_MS });
      return true;
    }

    const cacheKey = `${redisKey}:${ip}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const cidrMatch = await this.isInCidrSet(`${redisKey}${CIDR_KEY_SUFFIX}`, ip);
    this.cache.set(cacheKey, { value: cidrMatch, expiresAt: Date.now() + CIDR_CACHE_TTL_MS });
    return cidrMatch;
  }

  private async isInCidrSet(cidrKey: string, ip: string): Promise<boolean> {
    let cursor = '0';

    try {
      do {
        const [next, members] = await this.redis.sscan(cidrKey, cursor, 'COUNT', CIDR_SCAN_COUNT);
        for (const cidr of members) {
          if (isIpInCidr(ip, cidr)) {
            return true;
          }
        }
        cursor = next;
      } while (cursor !== '0');

      return false;
    } catch (err) {
      this.logger.warn(`Threat-intel CIDR lookup failed (${cidrKey}, ${ip}): ${String(err)}`);
      return false;
    }
  }
}
