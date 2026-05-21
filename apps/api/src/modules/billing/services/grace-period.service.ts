import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BILLING_SYSTEM_CONFIG_KEYS, DEFAULT_GRACE_DAYS, SUBSCRIPTION_STATUS } from '../constants/billing.constants';

@Injectable()
export class GracePeriodService {
  constructor(private readonly prisma: PrismaService) {}

  async getGraceDays(): Promise<number> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: BILLING_SYSTEM_CONFIG_KEYS.GRACE_DAYS },
    });
    const value = Number(config?.value ?? DEFAULT_GRACE_DAYS);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_GRACE_DAYS;
  }

  async applyGracePeriod(subscriptionId: string, graceDays?: number) {
    const days = graceDays ?? (await this.getGraceDays());
    const graceEndsAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SUBSCRIPTION_STATUS.GRACE_PERIOD,
        gracePeriodEndsAt: graceEndsAt,
      },
    });
  }

  async reconcileStatus(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { id: subscriptionId } });
    if (!subscription) {
      return null;
    }

    const now = new Date();

    if (subscription.status === SUBSCRIPTION_STATUS.GRACE_PERIOD) {
      if (subscription.gracePeriodEndsAt && now > subscription.gracePeriodEndsAt) {
        return this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: SUBSCRIPTION_STATUS.SUSPENDED },
        });
      }
      return subscription;
    }

    if (subscription.expiresAt && now > subscription.expiresAt) {
      return this.applyGracePeriod(subscription.id);
    }

    return subscription;
  }
}
