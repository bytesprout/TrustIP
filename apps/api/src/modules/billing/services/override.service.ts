import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import type { ExtendSubscriptionDto, OverrideQuotaDto } from '../dto/admin-override.dto';
import { AuditLogService } from '../../tenant/services/audit-log.service';
import { SUBSCRIPTION_STATUS } from '../constants/billing.constants';

@Injectable()
export class OverrideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async activateTenant(tenantId: string, actor: JwtPayload) {
    this.assertSuperAdmin(actor);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'ACTIVE', isActive: true },
    });

    await this.prisma.billingHistory.create({
      data: { tenantId, eventType: 'override.activate_tenant', metadata: { by: actor.sub } },
    });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'billing.override.activate_tenant',
      resource: 'tenant',
      resourceId: tenantId,
    });

    return { success: true };
  }

  async extendSubscription(tenantId: string, dto: ExtendSubscriptionDto, actor: JwtPayload) {
    this.assertSuperAdmin(actor);

    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    const gracePeriodEndsAt = dto.graceDays
      ? new Date(Date.now() + dto.graceDays * 24 * 60 * 60 * 1000)
      : subscription.gracePeriodEndsAt;

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        expiresAt,
        gracePeriodEndsAt,
        manualOverride: true,
      },
    });

    await this.prisma.billingHistory.create({
      data: {
        tenantId,
        eventType: 'override.extend_subscription',
        metadata: { by: actor.sub, expiresAt, gracePeriodEndsAt },
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'billing.override.extend_subscription',
      resource: 'subscription',
      resourceId: subscription.id,
    });

    return updated;
  }

  async overrideQuota(tenantId: string, dto: OverrideQuotaDto, actor: JwtPayload) {
    this.assertSuperAdmin(actor);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        monthlyRequestLimit: dto.monthlyRequestLimit,
        quotaEnabled: dto.quotaEnabled,
      },
    });

    await this.prisma.billingHistory.create({
      data: {
        tenantId,
        eventType: 'override.quota',
        metadata: { by: actor.sub, monthlyRequestLimit: dto.monthlyRequestLimit, quotaEnabled: dto.quotaEnabled },
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'billing.override.quota',
      resource: 'tenant',
      resourceId: tenantId,
    });

    return updated;
  }

  async grantEnterprise(tenantId: string, actor: JwtPayload) {
    this.assertSuperAdmin(actor);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        mode: 'enterprise',
        quotaEnabled: false,
        monthlyRequestLimit: null,
        rateLimitEnabled: false,
        status: 'ACTIVE',
        isActive: true,
      },
    });

    await this.prisma.billingHistory.create({
      data: { tenantId, eventType: 'override.grant_enterprise', metadata: { by: actor.sub } },
    });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'billing.override.grant_enterprise',
      resource: 'tenant',
      resourceId: tenantId,
    });

    return updated;
  }

  private assertSuperAdmin(actor: JwtPayload): void {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN required');
    }
  }
}
