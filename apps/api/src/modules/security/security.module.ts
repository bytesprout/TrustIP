import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { TenantModule } from '../tenant/tenant.module';
import { SecurityAbuseService } from './security-abuse.service';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [RedisModule, TenantModule, ObservabilityModule],
  providers: [SecurityAbuseService],
  exports: [SecurityAbuseService],
})
export class SecurityModule {}
