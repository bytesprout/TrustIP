import { Injectable, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import { PrismaService } from '../../../prisma/prisma.service';
import type { AddWhitelistEntryDto } from '../dto/whitelist.dto';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class WhitelistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list(tenantId: string, actor: JwtPayload) {
    this.assertTenantAccess(tenantId, actor);
    return this.prisma.tenantIpWhitelist.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(tenantId: string, dto: AddWhitelistEntryDto, actor: JwtPayload) {
    this.assertTenantAccess(tenantId, actor);

    const created = await this.prisma.tenantIpWhitelist.upsert({
      where: {
        tenantId_ip: {
          tenantId,
          ip: dto.ip,
        },
      },
      update: { type: dto.type },
      create: {
        tenantId,
        ip: dto.ip,
        type: dto.type,
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'tenant.whitelist.upsert',
      resource: 'tenant_ip_whitelist',
      resourceId: created.id,
      metadata: { ip: created.ip, type: created.type },
    });

    return created;
  }

  async remove(tenantId: string, entryId: string, actor: JwtPayload): Promise<void> {
    this.assertTenantAccess(tenantId, actor);

    const entry = await this.prisma.tenantIpWhitelist.findFirst({ where: { id: entryId, tenantId } });
    if (!entry) {
      throw new NotFoundException('Whitelist entry not found');
    }

    await this.prisma.tenantIpWhitelist.delete({ where: { id: entryId } });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'tenant.whitelist.delete',
      resource: 'tenant_ip_whitelist',
      resourceId: entryId,
      metadata: { ip: entry.ip },
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