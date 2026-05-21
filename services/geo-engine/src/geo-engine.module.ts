import { Module } from '@nestjs/common';
import { GeoService } from './services/geo.service';
import { AsnService } from './services/asn.service';
import { RdnsService } from './services/rdns.service';
import { IspClassifierService } from './services/isp-classifier.service';
import { ConfidenceService } from './services/confidence.service';
import { GeoCacheService, REDIS_CLIENT } from './services/cache.service';
import { IpValidatorService } from './services/ip-validator.service';
import { GeoLookupService } from './services/geo-lookup.service';

@Module({
  providers: [
    // Redis client is expected to be provided by the importing module
    // via: { provide: REDIS_CLIENT, useExisting: RedisService } or similar
    GeoService,
    AsnService,
    RdnsService,
    IspClassifierService,
    ConfidenceService,
    GeoCacheService,
    IpValidatorService,
    GeoLookupService,
  ],
  exports: [
    GeoLookupService,
    IpValidatorService,
    GeoService,
    AsnService,
    RdnsService,
    IspClassifierService,
    ConfidenceService,
    GeoCacheService,
    REDIS_CLIENT,
  ],
})
export class GeoEngineModule {}

export { REDIS_CLIENT };
