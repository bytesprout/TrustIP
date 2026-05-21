import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { QuotaService } from '../../tenant/services/quota.service';
import { SUBSCRIPTION_STATUS } from '../constants/billing.constants';

@Injectable()
export class QuotaEnforcementService {
  constructor(
    private readonly quotaService: QuotaService,
    private readonly prisma: PrismaService,
  ) {}

  async checkAndConsume(tenantId: string, req?: Request) {
    const quota = await this.quotaService.checkAndConsume(tenantId);

    const now = new Date();
    const month = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const path = req?.path ?? '';

    await this.prisma.quotaUsage.upsert({
      where: { tenantId_month: { tenantId, month } },
      create: {
        tenantId,
        month,
        requestsUsed: 1,
        trustRequests: path.includes('/trust-score') ? 1 : 0,
        intelligenceRequests: path.includes('/intelligence') ? 1 : 0,
        blockedRequests: quota.exceeded ? 1 : 0,
      },
      update: {
        requestsUsed: { increment: 1 },
        trustRequests: { increment: path.includes('/trust-score') ? 1 : 0 },
        intelligenceRequests: { increment: path.includes('/intelligence') ? 1 : 0 },
        blockedRequests: { increment: quota.exceeded ? 1 : 0 },
      },
    });

    return quota;
  }

  async validateSubscriptionAndQuota(tenantId: string, req?: Request): Promise<{
    quota: Awaited<ReturnType<QuotaService['checkAndConsume']>>;
    subscriptionStatus: string;
  }> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const subscriptionStatus = subscription?.status ?? SUBSCRIPTION_STATUS.ACTIVE;
    const quota = await this.checkAndConsume(tenantId, req);

    return { quota, subscriptionStatus };
  }
}
