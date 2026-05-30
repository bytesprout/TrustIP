import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { DATASET_UPDATE_QUEUE } from './constants/dataset.constants';
import { ChecksumService } from './services/checksum.service';
import { DownloaderService } from './services/downloader.service';
import { ValidatorService } from './services/validator.service';
import { RollbackService } from './services/rollback.service';
import { RegistryService } from './services/registry.service';
import { HotReloadService } from './services/hot-reload.service';
import { UpdaterService } from './services/updater.service';
import { SchedulerService } from './services/scheduler.service';
import { DatasetHealthService } from './services/dataset-health.service';
import { DatasetUpdateProcessor } from './jobs/dataset-update.processor';
import { PRISMA_CLIENT } from './services/registry.service';
import { HOT_RELOAD_REDIS_CLIENT } from './services/hot-reload.service';
import { DatasetBootstrapService } from './services/bootstrap.service';

// Token exports for consuming modules to provide implementations
export { PRISMA_CLIENT, DATASET_PRISMA_CLIENT } from './services/registry.service';
export { HOT_RELOAD_REDIS_CLIENT } from './services/hot-reload.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: DATASET_UPDATE_QUEUE }),
  ],
  providers: [
    {
      provide: PRISMA_CLIENT,
      useFactory: (): PrismaClient =>
        new PrismaClient({
          datasources: {
            db: { url: process.env.DATABASE_URL },
          },
        }),
    },
    {
      provide: HOT_RELOAD_REDIS_CLIENT,
      useFactory: (): Redis =>
        new Redis({
          host: process.env.REDIS_HOST ?? 'redis',
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD || undefined,
        }),
    },
    // Core services
    ChecksumService,
    DownloaderService,
    ValidatorService,
    RollbackService,
    RegistryService,
    HotReloadService,
    UpdaterService,
    SchedulerService,
    DatasetHealthService,
    DatasetBootstrapService,
    // Job processor
    DatasetUpdateProcessor,
  ],
  exports: [
    UpdaterService,
    SchedulerService,
    DatasetHealthService,
    HotReloadService,
    RegistryService,
    ValidatorService,
    ChecksumService,
    DatasetBootstrapService,
  ],
})
export class DatasetUpdaterModule {}
