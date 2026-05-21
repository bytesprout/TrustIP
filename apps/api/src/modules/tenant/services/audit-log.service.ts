import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AUDIT_SEVERITY } from '../constants/tenant.constants';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    tenantId?: string | null;
    userId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown>;
    severity?: (typeof AUDIT_SEVERITY)[keyof typeof AUDIT_SEVERITY];
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId ?? null,
        userId: params.userId ?? null,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId ?? null,
        metadata: {
          ...(params.metadata ?? {}),
          severity: params.severity ?? AUDIT_SEVERITY.INFO,
        },
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  }
}