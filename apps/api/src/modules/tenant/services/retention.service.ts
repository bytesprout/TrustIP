import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async cleanup(): Promise<{ deleted: number }> {
    const tenants = await this.prisma.tenant.findMany({
      select: {
        id: true,
        analyticsEnabled: true,
        analyticsRetentionDays: true,
      },
    });

    let deleted = 0;

    for (const tenant of tenants) {
      if (!tenant.analyticsEnabled) {
        continue;
      }
      if (tenant.analyticsRetentionDays === null) {
        continue;
      }

      const cutoff = new Date(Date.now() - tenant.analyticsRetentionDays * 24 * 60 * 60 * 1000);
      const result = await this.prisma.apiUsageLog.deleteMany({
        where: {
          tenantId: tenant.id,
          createdAt: { lt: cutoff },
        },
      });
      deleted += result.count;
    }

    if (deleted > 0) {
      this.logger.log(`Retention cleanup removed ${String(deleted)} usage records`);
    }

    return { deleted };
  }
}