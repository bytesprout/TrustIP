import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  getSystemInfo(): Record<string, unknown> {
    return {
      name: 'TrustIP',
      version: '1.0.0',
      phase: '01',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  async getStats(): Promise<Record<string, unknown>> {
    const [userCount, tenantCount, apiKeyCount] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.tenant.count(),
      this.prisma.apiKey.count({ where: { isActive: true } }),
    ]);

    return {
      users: userCount,
      tenants: tenantCount,
      activeApiKeys: apiKeyCount,
      timestamp: new Date().toISOString(),
    };
  }
}
