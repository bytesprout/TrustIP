import { Injectable } from '@nestjs/common';
import { REDIS_KEY_TOR } from '../constants/trust.constants';
import { ThreatIntelLookupService } from './threat-intel-lookup.service';

@Injectable()
export class TorDetectorService {
  constructor(private readonly threatIntelLookup: ThreatIntelLookupService) {}

  async detect(ip: string): Promise<boolean> {
    try {
      return await this.threatIntelLookup.isListed(REDIS_KEY_TOR, ip);
    } catch {
      return false;
    }
  }
}
