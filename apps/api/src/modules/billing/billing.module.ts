import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';
import { TenantModule } from '../tenant/tenant.module';
import { PlansController } from './controllers/plans.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { InvoicesController } from './controllers/invoices.controller';
import { AdminBillingController } from './controllers/admin-billing.controller';
import { BillingService } from './services/billing.service';
import { SubscriptionService } from './services/subscription.service';
import { PlanService } from './services/plan.service';
import { QuotaEnforcementService } from './services/quota-enforcement.service';
import { InvoiceService } from './services/invoice.service';
import { GracePeriodService } from './services/grace-period.service';
import { OverrideService } from './services/override.service';
import { TrialService } from './services/trial.service';
import { PaymentProviderService } from './services/payment-provider.service';
import { SubscriptionGuard } from './guards/subscription.guard';

@Module({
  imports: [PrismaModule, RedisModule, TenantModule],
  controllers: [
    PlansController,
    SubscriptionsController,
    InvoicesController,
    AdminBillingController,
  ],
  providers: [
    BillingService,
    SubscriptionService,
    PlanService,
    QuotaEnforcementService,
    InvoiceService,
    GracePeriodService,
    OverrideService,
    TrialService,
    PaymentProviderService,
    SubscriptionGuard,
  ],
  exports: [
    BillingService,
    SubscriptionService,
    PlanService,
    QuotaEnforcementService,
    InvoiceService,
    GracePeriodService,
    OverrideService,
    TrialService,
    PaymentProviderService,
    SubscriptionGuard,
  ],
})
export class BillingModule {}
