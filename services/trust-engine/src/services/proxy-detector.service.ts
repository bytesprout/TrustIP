import { Injectable } from '@nestjs/common';
import { REDIS_KEY_FIREHOL } from '../constants/trust.constants';
import { ThreatIntelLookupService } from './threat-intel-lookup.service';

@Injectable()
export class ProxyDetectorService {
  constructor(private readonly threatIntelLookup: ThreatIntelLookupService) {}

  async detect(ip: string): Promise<boolean> {
    try {
      return await this.threatIntelLookup.isListed(REDIS_KEY_FIREHOL, ip);
    } catch {
      return false;
    }
  }
}
