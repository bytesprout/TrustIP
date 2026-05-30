import { Injectable } from '@nestjs/common';
import { REDIS_KEY_VPN, HOSTING_ISP_PATTERNS } from '../constants/trust.constants';
import type { TenantTrustConfig } from '../interfaces/trust.interface';
import { ThreatIntelLookupService } from './threat-intel-lookup.service';

const VPN_ISP_PATTERNS = [
  'nordvpn', 'expressvpn', 'surfshark', 'purevpn', 'ipvanish',
  'cyberghost', 'privateinternetaccess', 'pia', 'mullvad', 'protonvpn',
  'hidemyass', 'tunnelbear', 'windscribe', 'torguard', 'vpn',
  ...HOSTING_ISP_PATTERNS,
];

@Injectable()
export class VpnDetectorService {
  constructor(private readonly threatIntelLookup: ThreatIntelLookupService) {}

  async detect(ip: string, isp: string, _config: TenantTrustConfig): Promise<boolean> {
    try {
      const inSet = await this.threatIntelLookup.isListed(REDIS_KEY_VPN, ip);
      if (inSet) return true;
    } catch {
      return false;
    }

    const ispLower = isp.toLowerCase();
    return VPN_ISP_PATTERNS.some((pattern) => ispLower.includes(pattern));
  }
}
