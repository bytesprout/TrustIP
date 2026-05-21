import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import { SUBSCRIPTION_STATUS } from '../constants/billing.constants';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminAnalytics(actor: JwtPayload) {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN required');
    }

    const [plans, subscriptions, tenants] = await Promise.all([
      this.prisma.plan.findMany({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.findMany({ include: { plan: true } }),
      this.prisma.tenant.count(),
    ]);

    const mrr = subscriptions
      .filter((s) => s.status === SUBSCRIPTION_STATUS.ACTIVE || s.status === SUBSCRIPTION_STATUS.TRIAL)
      .reduce((acc, s) => acc + Number(s.plan.monthlyPrice), 0);

    const arr = mrr * 12;

    const expiringSoon = subscriptions.filter((s) => {
      if (!s.expiresAt) return false;
      const delta = s.expiresAt.getTime() - Date.now();
      return delta > 0 && delta < 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      mrr,
      arr,
      activeTenants: subscriptions.filter((s) => s.status === SUBSCRIPTION_STATUS.ACTIVE).length,
      expiringTenants: expiringSoon,
      totalTenants: tenants,
      planDistribution: plans.map((p) => ({
        planSlug: p.slug,
        subscribers: subscriptions.filter((s) => s.planId === p.id).length,
      })),
    };
  }
}
