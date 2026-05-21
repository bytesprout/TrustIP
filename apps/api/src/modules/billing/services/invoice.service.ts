import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import type { CreateInvoiceDto } from '../dto/invoice.dto';
import { AuditLogService } from '../../tenant/services/audit-log.service';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(tenantId: string, dto: CreateInvoiceDto, actor: JwtPayload) {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN required');
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber: this.generateInvoiceNumber(tenantId),
        amount: dto.amount,
        currency: dto.currency,
        issuedAt: dto.issuedAt ? new Date(dto.issuedAt) : new Date(),
        notes: dto.notes,
      },
    });

    await this.prisma.billingHistory.create({
      data: {
        tenantId,
        eventType: 'invoice.created',
        metadata: { invoiceId: invoice.id, amount: dto.amount },
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'billing.invoice.create',
      resource: 'invoice',
      resourceId: invoice.id,
    });

    return invoice;
  }

  async listForTenant(tenantId: string, actor: JwtPayload) {
    this.assertTenantAccess(tenantId, actor);
    return this.prisma.invoice.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async findOne(tenantId: string, invoiceId: string, actor: JwtPayload) {
    this.assertTenantAccess(tenantId, actor);

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  private generateInvoiceNumber(tenantId: string): string {
    const suffix = tenantId.slice(0, 6).toUpperCase();
    const ts = Date.now();
    return `INV-${suffix}-${String(ts)}`;
  }

  private assertTenantAccess(tenantId: string, actor: JwtPayload): void {
    if (actor.role === Role.SUPER_ADMIN) {
      return;
    }
    if (actor.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied: tenant mismatch');
    }
  }
}
