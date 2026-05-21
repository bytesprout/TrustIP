import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BILLING_CYCLE, BILLING_SYSTEM_CONFIG_KEYS, DEFAULT_TRIAL_DAYS, SUBSCRIPTION_STATUS } from '../constants/billing.constants';

@Injectable()
export class TrialService {
  constructor(private readonly prisma: PrismaService) {}

  async getTrialDays(): Promise<number> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: BILLING_SYSTEM_CONFIG_KEYS.TRIAL_DAYS },
    });
    const value = Number(config?.value ?? DEFAULT_TRIAL_DAYS);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_TRIAL_DAYS;
  }

  async startTrial(tenantId: string, planId: string, customDays?: number) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existingTrial = await this.prisma.subscription.findFirst({
      where: { tenantId, status: SUBSCRIPTION_STATUS.TRIAL },
    });

    if (existingTrial) {
      throw new ConflictException('Active trial already exists for tenant');
    }

    const previousTrial = await this.prisma.subscription.findFirst({
      where: { tenantId, status: { in: [SUBSCRIPTION_STATUS.EXPIRED, SUBSCRIPTION_STATUS.SUSPENDED] } },
      orderBy: { createdAt: 'desc' },
    });

    if (previousTrial && previousTrial.billingCycle === BILLING_CYCLE.MANUAL) {
      throw new ConflictException('Trial already consumed for tenant');
    }

    const days = customDays ?? (await this.getTrialDays());
    const now = new Date();
    const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return this.prisma.subscription.create({
      data: {
        tenantId,
        planId,
        status: SUBSCRIPTION_STATUS.TRIAL,
        billingCycle: BILLING_CYCLE.MANUAL,
        startsAt: now,
        expiresAt,
        autoRenew: false,
      },
    });
  }
}
