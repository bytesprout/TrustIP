import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import { AuditLogService } from '../../tenant/services/audit-log.service';
import { BILLING_MODE, BILLING_SYSTEM_CONFIG_KEYS, SUBSCRIPTION_STATUS } from '../constants/billing.constants';
import type { SubscriptionAccessResult } from '../interfaces/billing.interfaces';
import type { CreateSubscriptionDto, UpdateSubscriptionDto } from '../dto/subscription.dto';
import { GracePeriodService } from './grace-period.service';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly gracePeriodService: GracePeriodService,
  ) {}

  async getBillingMode(): Promise<string> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: BILLING_SYSTEM_CONFIG_KEYS.BILLING_MODE },
    });

    const value = String(config?.value ?? BILLING_MODE.MANUAL).toUpperCase();
    return value;
  }

  async create(tenantId: string, dto: CreateSubscriptionDto, actor: JwtPayload) {
    this.assertTenantAccess(tenantId, actor);

    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    const now = new Date();
    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId,
        planId: dto.planId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        billingCycle: dto.billingCycle,
        startsAt: now,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        autoRenew: dto.autoRenew ?? true,
      },
    });

    await this.syncTenantPlan(tenantId, plan.id);

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'billing.subscription.create',
      resource: 'subscription',
      resourceId: subscription.id,
      metadata: { planId: dto.planId, billingCycle: dto.billingCycle },
    });

    return subscription;
  }

  async update(tenantId: string, subscriptionId: string, dto: UpdateSubscriptionDto, actor: JwtPayload) {
    this.assertTenantAccess(tenantId, actor);

    const existing = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Subscription not found');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        billingCycle: dto.billingCycle,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        autoRenew: dto.autoRenew,
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'billing.subscription.update',
      resource: 'subscription',
      resourceId: subscriptionId,
      metadata: { changedFields: Object.keys(dto) },
    });

    return updated;
  }

  async list(tenantId: string, actor: JwtPayload) {
    this.assertTenantAccess(tenantId, actor);
    return this.prisma.subscription.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async latestForTenant(tenantId: string) {
    return this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }

  async validateFeatureAccess(tenantId: string, requestPath: string): Promise<boolean> {
    const subscription = await this.latestForTenant(tenantId);

    // In manual mode, tenants can access core API features even without a subscription row.
    if (!subscription) {
      const mode = await this.getBillingMode();
      return mode === BILLING_MODE.MANUAL;
    }

    const features = subscription.plan.features as Record<string, unknown>;
    const featureEnabled = (...keys: string[]): boolean => {
      for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(features, key)) {
          return Boolean(features[key]);
        }
      }
      return false;
    };

    if (requestPath.includes('/ip/basic')) {
      // Keep backward compatibility with mixed key naming styles.
      if (Object.prototype.hasOwnProperty.call(features, 'basic_lookup')) {
        return features.basic_lookup !== false;
      }
      if (Object.prototype.hasOwnProperty.call(features, 'basicLookup')) {
        return features.basicLookup !== false;
      }
      return true;
    }
    if (requestPath.includes('/ip/intelligence')) {
      return featureEnabled('intelligence_lookup', 'intelligenceLookup');
    }
    if (requestPath.includes('/ip/trust-score')) {
      return featureEnabled('trust_lookup', 'trustLookup', 'trustEngine');
    }

    return true;
  }

  async validateAccess(tenantId: string): Promise<SubscriptionAccessResult> {
    const mode = await this.getBillingMode();
    const latest = await this.latestForTenant(tenantId);

    if (mode === BILLING_MODE.MANUAL && !latest) {
      return { allowed: true, status: BILLING_MODE.MANUAL };
    }

    if (!latest) {
      return { allowed: false, status: SUBSCRIPTION_STATUS.SUSPENDED, message: 'No active subscription' };
    }

    const reconciled = await this.gracePeriodService.reconcileStatus(latest.id);
    if (!reconciled) {
      return { allowed: false, status: SUBSCRIPTION_STATUS.SUSPENDED, message: 'Subscription missing' };
    }

    if (reconciled.manualOverride) {
      return { allowed: true, status: reconciled.status, gracePeriodEndsAt: reconciled.gracePeriodEndsAt };
    }

    if (reconciled.status === SUBSCRIPTION_STATUS.ACTIVE || reconciled.status === SUBSCRIPTION_STATUS.TRIAL) {
      return { allowed: true, status: reconciled.status, gracePeriodEndsAt: reconciled.gracePeriodEndsAt };
    }

    if (reconciled.status === SUBSCRIPTION_STATUS.GRACE_PERIOD) {
      const now = Date.now();
      const graceEnd = reconciled.gracePeriodEndsAt?.getTime() ?? 0;
      if (graceEnd > now) {
        return {
          allowed: true,
          status: reconciled.status,
          gracePeriodEndsAt: reconciled.gracePeriodEndsAt,
          message: 'Subscription is in grace period',
        };
      }
    }

    return {
      allowed: false,
      status: reconciled.status,
      gracePeriodEndsAt: reconciled.gracePeriodEndsAt,
      message: 'Subscription inactive',
    };
  }

  async syncTenantPlan(tenantId: string, planId: string): Promise<void> {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        subscriptionPlanId: plan.id,
        monthlyRequestLimit: plan.requestLimitMonthly,
        rateLimitPerMinute: plan.requestsPerMinute,
        analyticsRetentionDays: plan.analyticsRetentionDays,
      },
    });
  }

  private assertTenantAccess(tenantId: string, actor: JwtPayload): void {
    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }
    if (actor.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: tenant mismatch');
    }
  }
}
