import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { FeatureFlagsModule } from '../feature-flags/feature-flags.module';
import { TenantController } from './controllers/tenant.controller';
import { ApiKeyController } from './controllers/api-key.controller';
import { DomainController } from './controllers/domain.controller';
import { WhitelistController } from './controllers/whitelist.controller';
import { QuotaController } from './controllers/quota.controller';
import { TenantService } from './services/tenant.service';
import { ApiKeyService } from './services/api-key.service';
import { TenantResolutionService } from './services/tenant-resolution.service';
import { QuotaService } from './services/quota.service';
import { DomainLockService } from './services/domain-lock.service';
import { WhitelistService } from './services/whitelist.service';
import { RetentionService } from './services/retention.service';
import { TenantFeatureFlagService } from './services/feature-flag.service';
import { AuditLogService } from './services/audit-log.service';
import { TenantAccessGuard } from './guards/tenant-access.guard';
import { EnterpriseInitializerService } from './services/enterprise-initializer.service';
import { RetentionRunnerService } from './services/retention-runner.service';

@Module({
  imports: [PrismaModule, RedisModule, FeatureFlagsModule],
  controllers: [
    TenantController,
    ApiKeyController,
    DomainController,
    WhitelistController,
    QuotaController,
  ],
  providers: [
    TenantService,
    ApiKeyService,
    TenantResolutionService,
    QuotaService,
    DomainLockService,
    WhitelistService,
    RetentionService,
    TenantFeatureFlagService,
    AuditLogService,
    TenantAccessGuard,
    EnterpriseInitializerService,
    RetentionRunnerService,
  ],
  exports: [
    TenantService,
    ApiKeyService,
    TenantResolutionService,
    QuotaService,
    DomainLockService,
    WhitelistService,
    RetentionService,
    TenantFeatureFlagService,
    AuditLogService,
  ],
})
export class TenantModule {}
