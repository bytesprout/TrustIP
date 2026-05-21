import { Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AddDomainDto } from '../dto/domain.dto';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class DomainLockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(tenantId: string, actor: JwtPayload) {
    this.assertTenantAccess(tenantId, actor);
    return this.prisma.tenantDomain.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(tenantId: string, dto: AddDomainDto, actor: JwtPayload) {
    this.assertTenantAccess(tenantId, actor);

    const created = await this.prisma.tenantDomain.upsert({
      where: {
        tenantId_domain: {
          tenantId,
          domain: dto.domain.toLowerCase(),
        },
      },
      update: { mode: dto.mode },
      create: {
        tenantId,
        domain: dto.domain.toLowerCase(),
        mode: dto.mode,
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'tenant.domain.upsert',
      resource: 'tenant_domain',
      resourceId: created.id,
      metadata: { domain: created.domain, mode: created.mode },
    });

    return created;
  }

  async remove(tenantId: string, domainId: string, actor: JwtPayload): Promise<void> {
    this.assertTenantAccess(tenantId, actor);

    const entry = await this.prisma.tenantDomain.findFirst({ where: { id: domainId, tenantId } });
    if (!entry) {
      throw new NotFoundException('Domain entry not found');
    }

    await this.prisma.tenantDomain.delete({ where: { id: domainId } });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'tenant.domain.delete',
      resource: 'tenant_domain',
      resourceId: domainId,
      metadata: { domain: entry.domain },
    });
  }

  private assertTenantAccess(tenantId: string, actor: JwtPayload): void {
    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }
    if (actor.tenantId !== tenantId) {
      throw new NotFoundException('Tenant not found');
    }
  }
}