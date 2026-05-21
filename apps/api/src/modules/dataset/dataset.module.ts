import { Module } from '@nestjs/common';
import { DatasetUpdaterModule, PRISMA_CLIENT, HOT_RELOAD_REDIS_CLIENT } from '@trustip/dataset-updater';
import { GeoEngineModule } from '@trustip/geo-engine';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisModule } from '../../redis/redis.module';
import { RedisService } from '../../redis/redis.service';
import { GeoReloadListenerService } from './geo-reload-listener.service';
import { DatasetHealthController } from './dataset-health.controller';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    GeoEngineModule,
    DatasetUpdaterModule,
  ],
  providers: [
    // Provide PrismaService under the PRISMA_CLIENT injection token for RegistryService
    {
      provide: PRISMA_CLIENT,
      useExisting: PrismaService,
    },
    // Provide raw ioredis client under the HOT_RELOAD_REDIS_CLIENT token for HotReloadService
    {
      provide: HOT_RELOAD_REDIS_CLIENT,
      useFactory: (redisService: RedisService) => redisService.getClient(),
      inject: [RedisService],
    },
    // Also provide REDIS_CLIENT for GeoEngineModule's GeoCacheService
    {
      provide: 'REDIS_CLIENT',
      useFactory: (redisService: RedisService) => redisService.getClient(),
      inject: [RedisService],
    },
    GeoReloadListenerService,
  ],
  controllers: [DatasetHealthController],
})
export class DatasetModule {}
