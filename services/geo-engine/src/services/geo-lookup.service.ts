import { Injectable, Logger } from '@nestjs/common';
import { GeoService } from './geo.service';
import { AsnService } from './asn.service';
import { RdnsService } from './rdns.service';
import { ConfidenceService } from './confidence.service';
import { GeoCacheService } from './cache.service';
import { IpValidatorService } from './ip-validator.service';
import type { IpLookupResult, LookupRequest } from '../interfaces/geo-result.interface';

@Injectable()
export class GeoLookupService {
  private readonly logger = new Logger(GeoLookupService.name);

  constructor(
    private readonly geoService: GeoService,
    private readonly asnService: AsnService,
    private readonly rdnsService: RdnsService,
    private readonly confidenceService: ConfidenceService,
    private readonly cacheService: GeoCacheService,
    private readonly ipValidator: IpValidatorService,
  ) {}

  async lookup(request: LookupRequest): Promise<IpLookupResult> {
    const startTime = Date.now();
    const { ip, tenantId } = request;

    // 1. Check cache
    const cached = await this.cacheService.get(tenantId, ip);
    if (cached) {
      return {
        ...cached,
        metadata: {
          cacheHit: true,
          lookupTimeMs: Date.now() - startTime,
        },
      };
    }

    // 2. Parallel lookups: geo + asn + rdns
    const [location, asnResult, reverseDns] = await Promise.all([
      Promise.resolve(this.geoService.lookup(ip)),
      Promise.resolve(this.asnService.lookup(ip)),
      this.rdnsService.lookup(ip),
    ]);

    // 3. Confidence score
    const geoConfidence = this.confidenceService.calculate(location, asnResult);

    // 4. Build result
    const result: IpLookupResult = {
      ip: {
        address: ip,
        version: this.ipValidator.getVersion(ip),
      },
      location,
      network: asnResult,
      reverseDns,
      geoConfidence,
      metadata: {
        cacheHit: false,
        lookupTimeMs: Date.now() - startTime,
      },
    };

    // 5. Cache result (fire-and-forget)
    this.cacheService.set(tenantId, ip, result).catch((err: unknown) => {
      this.logger.warn(`Cache write failed: ${String(err)}`);
    });

    return result;
  }
}
