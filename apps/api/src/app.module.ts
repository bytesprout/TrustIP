import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { FeatureFlagsModule } from './modules/feature-flags/feature-flags.module';
import { SystemModule } from './modules/system/system.module';
import { IpModule } from './modules/ip/ip.module';
import { DatasetModule } from './modules/dataset/dataset.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    EventEmitterModule.forRoot({ wildcard: false, maxListeners: 20 }),
    ConfigModule,
    PrismaModule,
    RedisModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.redisHost,
          port: config.redisPort,
          password: config.redisPassword || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => ({
        throttlers: [{ ttl: 60000, limit: 100 }],
      }),
    }),
    AuthModule,
    UsersModule,
    HealthModule,
    FeatureFlagsModule,
    SystemModule,
    IpModule,
    DatasetModule,
  ],
  providers: [LoggingInterceptor, ResponseInterceptor],
})
export class AppModule {}
