import { Injectable, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { ConnectionType } from '@trustip/geo-engine';
import type { IpLookupResult } from '@trustip/geo-engine';
import { REDIS_CLIENT, TRUST_HISTORY_KEY_PREFIX } from '../constants/trust.constants';
import type { HistoryResult } from '../interfaces/trust.interface';

interface CachedHistory {
  trustScore: number;
  seenAt: number;
}

@Injectable()
export class HistoryRiskService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async evaluate(ip: string, tenantId: string, geoResult: IpLookupResult): Promise<HistoryResult> {
    const key = `tenant:${tenantId}:${TRUST_HISTORY_KEY_PREFIX}:${ip}`;

    try {
      const raw = await this.redis.get(key);

      if (!raw) {
        return {
          stableIp: false,
          trustedHistory: false,
          residentialIsp: geoResult.network?.connectionType === ConnectionType.RESIDENTIAL,
        };
      }

      const history = JSON.parse(raw) as CachedHistory;

      return {
        stableIp: true,
        trustedHistory: history.trustScore >= 70,
        residentialIsp: geoResult.network?.connectionType === ConnectionType.RESIDENTIAL,
      };
    } catch {
      return { stableIp: false, trustedHistory: false, residentialIsp: false };
    }
  }
}
