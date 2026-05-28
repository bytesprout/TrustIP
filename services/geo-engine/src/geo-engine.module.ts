import { Module } from '@nestjs/common';
import Redis from 'ioredis';
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
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis =>
        new Redis({
          host: process.env.REDIS_HOST ?? 'redis',
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD || undefined,
        }),
    },
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
    REDIS_CLIENT,
    GeoLookupService,
    IpValidatorService,
    GeoService,
    AsnService,
    RdnsService,
    IspClassifierService,
    ConfidenceService,
    GeoCacheService,
  ],
})
export class GeoEngineModule {}

export { REDIS_CLIENT };
