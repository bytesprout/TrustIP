import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { ObservabilityMetricsService } from './observability-metrics.service';
import { TracingService } from './tracing.service';
import { AlertingService } from './alerting.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [MetricsController],
  providers: [ObservabilityMetricsService, TracingService, AlertingService],
  exports: [ObservabilityMetricsService, TracingService, AlertingService],
})
export class ObservabilityModule {}
