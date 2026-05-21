import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GeoEngineModule, REDIS_CLIENT as GEO_REDIS_CLIENT } from '@trustip/geo-engine';
import { TrustEngineModule, REDIS_CLIENT as TRUST_REDIS_CLIENT } from '@trustip/trust-engine';
import { RedisModule } from '../../redis/redis.module';
import { RedisService } from '../../redis/redis.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BasicController } from './controllers/basic.controller';
import { IntelligenceController } from './controllers/intelligence.controller';
import { TrustController } from './controllers/trust.controller';
import { IpService } from './services/ip.service';
import { AnalyticsService } from './services/analytics.service';
import { TenantValidationService } from './services/tenant-validation.service';
import { ScopeValidationService } from './services/scope-validation.service';
import { ResponseBuilderService } from './services/response-builder.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ScopeGuard } from './guards/scope.guard';

@Module({
  imports: [
    RedisModule,
    PrismaModule,
    GeoEngineModule,
    TrustEngineModule,
  ],
  providers: [
    {
      provide: GEO_REDIS_CLIENT,
      useFactory: (redisService: RedisService) => redisService.getClient(),
      inject: [RedisService],
    },
    {
      provide: TRUST_REDIS_CLIENT,
      useFactory: (redisService: RedisService) => redisService.getClient(),
      inject: [RedisService],
    },
    TenantValidationService,
    ScopeValidationService,
    AnalyticsService,
    ResponseBuilderService,
    IpService,
    ApiKeyGuard,
    ScopeGuard,
    Reflector,
  ],
  controllers: [
    BasicController,
    IntelligenceController,
    TrustController,
  ],
})
export class IpModule {}
