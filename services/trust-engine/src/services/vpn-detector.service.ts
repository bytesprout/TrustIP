import { Injectable, Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { REDIS_CLIENT, REDIS_KEY_VPN, HOSTING_ISP_PATTERNS } from '../constants/trust.constants';
import type { TenantTrustConfig } from '../interfaces/trust.interface';

const VPN_ISP_PATTERNS = [
  'nordvpn', 'expressvpn', 'surfshark', 'purevpn', 'ipvanish',
  'cyberghost', 'privateinternetaccess', 'pia', 'mullvad', 'protonvpn',
  'hidemyass', 'tunnelbear', 'windscribe', 'torguard', 'vpn',
  ...HOSTING_ISP_PATTERNS,
];

@Injectable()
export class VpnDetectorService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async detect(ip: string, isp: string, _config: TenantTrustConfig): Promise<boolean> {
    try {
      const inSet = await this.redis.sismember(REDIS_KEY_VPN, ip);
      if (inSet === 1) return true;

      const ispLower = isp.toLowerCase();
      return VPN_ISP_PATTERNS.some((pattern) => ispLower.includes(pattern));
    } catch {
      return false;
    }
  }
}
