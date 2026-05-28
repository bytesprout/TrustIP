import { Injectable, Logger } from '@nestjs/common';
import { GeoService } from './geo.service';
import { AsnService } from './asn.service';
import { RdnsService } from './rdns.service';
import { ConfidenceService } from './confidence.service';
import { GeoCacheService } from './cache.service';
import { IpValidatorService } from './ip-validator.service';
import { ConnectionType, GeoConfidenceLevel, IP_VERSION } from '../constants/geo.constants';
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

    // 1. Check cache (defensive: cache layer can be unavailable during startup)
    const cached = this.cacheService ? await this.cacheService.get(tenantId, ip) : null;
    if (cached) {
      return {
        ...cached,
        metadata: {
          cacheHit: true,
          lookupTimeMs: Date.now() - startTime,
        },
      };
    }

    const locationFallback = {
      continent: null,
      country: null,
      countryCode: null,
      state: null,
      district: null,
      city: null,
      zip: null,
      timezone: null,
      latitude: null,
      longitude: null,
      geoAccuracyRadiusKm: null,
    };

    const asnFallback = {
      asn: null,
      isp: null,
      organization: null,
      network: null,
      connectionType: ConnectionType.UNKNOWN,
    };

    // 2. Parallel lookups: geo + asn + rdns (defensive fallbacks for partial DI failures)
    const [location, asnResult, reverseDns] = await Promise.all([
      Promise.resolve(this.geoService?.lookup(ip) ?? locationFallback),
      Promise.resolve(this.asnService?.lookup(ip) ?? asnFallback),
      this.rdnsService ? this.rdnsService.lookup(ip) : Promise.resolve(null),
    ]);

    // 3. Confidence score
    const geoConfidence = this.confidenceService
      ? this.confidenceService.calculate(location, asnResult)
      : { score: 0, level: GeoConfidenceLevel.LOW };

    // 4. Build result
    const result: IpLookupResult = {
      ip: {
        address: ip,
        version: this.ipValidator?.getVersion(ip) ?? (ip.includes(':') ? IP_VERSION.V6 : IP_VERSION.V4),
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
    if (this.cacheService) {
      this.cacheService.set(tenantId, ip, result).catch((err: unknown) => {
        this.logger.warn(`Cache write failed: ${String(err)}`);
      });
    }

    return result;
  }
}
