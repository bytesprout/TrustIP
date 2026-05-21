import { Injectable, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import {
  REDIS_CLIENT,
  GEO_LAST_SEEN_KEY_PREFIX,
  GEO_VELOCITY_WINDOW_SECONDS,
} from '../constants/trust.constants';

interface GeoLastSeen {
  country: string;
  seenAt: number;
}

@Injectable()
export class GeoAnomalyService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async detect(ip: string, tenantId: string, currentCountry: string | null): Promise<boolean> {
    if (!currentCountry) return false;

    const key = `tenant:${tenantId}:${GEO_LAST_SEEN_KEY_PREFIX}:${ip}`;

    try {
      const raw = await this.redis.get(key);
      const now = Math.floor(Date.now() / 1000);

      let isAnomaly = false;

      if (raw) {
        const lastSeen = JSON.parse(raw) as GeoLastSeen;
        const timeDiff = now - lastSeen.seenAt;
        if (lastSeen.country !== currentCountry && timeDiff < GEO_VELOCITY_WINDOW_SECONDS) {
          isAnomaly = true;
        }
      }

      const updated: GeoLastSeen = { country: currentCountry, seenAt: now };
      await this.redis.set(key, JSON.stringify(updated), 'EX', GEO_VELOCITY_WINDOW_SECONDS * 2);

      return isAnomaly;
    } catch {
      return false;
    }
  }
}
