import { Injectable } from '@nestjs/common';
import { ConnectionType } from '@trustip/geo-engine';
import { HOSTING_ISP_PATTERNS } from '../constants/trust.constants';

@Injectable()
export class HostingDetectorService {
  detect(isp: string, connectionType: (typeof ConnectionType)[keyof typeof ConnectionType] | undefined): boolean {
    if (connectionType === ConnectionType.HOSTING) return true;
    const ispLower = isp.toLowerCase();
    return HOSTING_ISP_PATTERNS.some((pattern) => ispLower.includes(pattern));
  }
}
