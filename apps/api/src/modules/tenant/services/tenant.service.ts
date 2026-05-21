import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import { DEFAULT_ANALYTICS_RETENTION_DAYS, DEFAULT_MONTHLY_REQUEST_LIMIT } from '../constants/tenant.constants';
import type { CreateTenantDto, UpdateTenantDto } from '../dto/tenant.dto';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateTenantDto, actor: JwtPayload) {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create tenants');
    }

    const slug = await this.generateUniqueSlug(dto.name);

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug,
        companyName: dto.companyName,
        mode: dto.mode,
        rateLimitPerMinute: dto.rateLimitPerMinute ?? 100,
        monthlyRequestLimit: dto.monthlyRequestLimit ?? DEFAULT_MONTHLY_REQUEST_LIMIT,
        analyticsRetentionDays: dto.analyticsRetentionDays ?? DEFAULT_ANALYTICS_RETENTION_DAYS,
      },
    });

    await this.auditLog.log({
      tenantId: tenant.id,
      userId: actor.sub,
      action: 'tenant.create',
      resource: 'tenant',
      resourceId: tenant.id,
      metadata: { slug: tenant.slug },
    });

    return tenant;
  }

  async findAll(actor: JwtPayload) {
    if (actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can list all tenants');
    }

    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, actor: JwtPayload) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (actor.role !== Role.SUPER_ADMIN && actor.tenantId !== id) {
      throw new ForbiddenException('Access denied: tenant mismatch');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto, actor: JwtPayload) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (actor.role !== Role.SUPER_ADMIN && actor.tenantId !== id) {
      throw new ForbiddenException('Access denied: tenant mismatch');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: dto.name,
        companyName: dto.companyName,
        analyticsEnabled: dto.analyticsEnabled,
        quotaEnabled: dto.quotaEnabled,
        rateLimitEnabled: dto.rateLimitEnabled,
        monthlyRequestLimit: dto.monthlyRequestLimit,
        quotaSoftLimitPercent: dto.quotaSoftLimitPercent,
        analyticsRetentionDays: dto.analyticsRetentionDays,
      },
    });

    await this.auditLog.log({
      tenantId: id,
      userId: actor.sub,
      action: 'tenant.update',
      resource: 'tenant',
      resourceId: id,
      metadata: {
        changedFields: Object.keys(dto),
      },
    });

    return updated;
  }

  async ensureInternalEnterpriseTenant(): Promise<void> {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: 'enterprise-internal' } });
    if (existing) {
      return;
    }

    await this.prisma.tenant.create({
      data: {
        name: 'Enterprise Internal',
        slug: 'enterprise-internal',
        mode: 'enterprise',
        monthlyRequestLimit: 2147483647,
        quotaEnabled: false,
        rateLimitEnabled: false,
        analyticsRetentionDays: null,
      },
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const candidate = base || 'tenant';
    const exists = await this.prisma.tenant.findUnique({ where: { slug: candidate } });
    if (!exists) {
      return candidate;
    }

    for (let i = 2; i < 1000; i += 1) {
      const next = `${candidate}-${String(i)}`;
      const collision = await this.prisma.tenant.findUnique({ where: { slug: next } });
      if (!collision) {
        return next;
      }
    }

    throw new ConflictException('Unable to generate tenant slug');
  }
}