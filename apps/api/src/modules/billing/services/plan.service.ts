import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import type { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';
import { AuditLogService } from '../../tenant/services/audit-log.service';
import { PLAN_STATUS } from '../constants/billing.constants';
import { Prisma } from '@prisma/client';

@Injectable()
export class PlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreatePlanDto, actor: JwtPayload) {
    this.assertSuperAdmin(actor);

    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        monthlyPrice: dto.monthlyPrice,
        annualPrice: dto.annualPrice,
        currency: dto.currency,
        requestLimitMonthly: dto.requestLimitMonthly ?? null,
        requestsPerMinute: dto.requestsPerMinute,
        analyticsRetentionDays: dto.analyticsRetentionDays ?? null,
        features: dto.features as Prisma.InputJsonValue,
        status: PLAN_STATUS.ACTIVE,
      },
    });

    await this.auditLog.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      action: 'billing.plan.create',
      resource: 'plan',
      resourceId: plan.id,
      metadata: { slug: plan.slug },
    });

    return plan;
  }

  async listActive() {
    return this.prisma.plan.findMany({
      where: { status: PLAN_STATUS.ACTIVE },
      orderBy: { monthlyPrice: 'asc' },
    });
  }

  async listAll(actor: JwtPayload) {
    this.assertSuperAdmin(actor);
    return this.prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async update(planId: string, dto: UpdatePlanDto, actor: JwtPayload) {
    this.assertSuperAdmin(actor);

    const existing = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!existing) {
      throw new NotFoundException('Plan not found');
    }

    const updated = await this.prisma.plan.update({
      where: { id: planId },
      data: {
        name: dto.name,
        monthlyPrice: dto.monthlyPrice,
        annualPrice: dto.annualPrice,
        requestLimitMonthly: dto.requestLimitMonthly,
        requestsPerMinute: dto.requestsPerMinute,
        analyticsRetentionDays: dto.analyticsRetentionDays,
        features: dto.features as Prisma.InputJsonValue | undefined,
      },
    });

    await this.auditLog.log({
      tenantId: actor.tenantId,
      userId: actor.sub,
      action: 'billing.plan.update',
      resource: 'plan',
      resourceId: planId,
      metadata: { changedFields: Object.keys(dto) },
    });

    return updated;
  }

  private assertSuperAdmin(actor: JwtPayload): void {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('SUPER_ADMIN required');
    }
  }
}
