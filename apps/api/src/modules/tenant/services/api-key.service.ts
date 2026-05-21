import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import type { JwtPayload } from '@trustip/shared-types';
import { Role } from '@trustip/shared-types';
import { PrismaService } from '../../../prisma/prisma.service';
import { API_KEY_PREFIX, API_KEY_STATUS } from '../constants/tenant.constants';
import type { CreateApiKeyDto } from '../dto/api-key.dto';
import type { GeneratedApiKey } from '../interfaces/tenant.interfaces';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(tenantId: string, dto: CreateApiKeyDto, actor: JwtPayload): Promise<GeneratedApiKey> {
    this.assertTenantAccess(tenantId, actor);

    const secret = randomBytes(20).toString('hex');
    const prefix = dto.testKey ? API_KEY_PREFIX.TEST : API_KEY_PREFIX.LIVE;
    const plainKey = `${prefix}${secret}`;
    const keyHash = this.hash(plainKey);

    const created = await this.prisma.apiKey.create({
      data: {
        tenantId,
        name: dto.name,
        keyHash,
        keyPrefix: plainKey.slice(0, 8),
        scopes: dto.scopes,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        requestLimit: dto.requestLimit,
        status: API_KEY_STATUS.ACTIVE,
        isActive: true,
      },
      select: { id: true },
    });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'tenant.api_key.create',
      resource: 'api_key',
      resourceId: created.id,
      metadata: { scopes: dto.scopes, name: dto.name },
    });

    return {
      id: created.id,
      prefix: plainKey.slice(0, 8),
      plainKey,
    };
  }

  async list(tenantId: string, actor: JwtPayload) {
    this.assertTenantAccess(tenantId, actor);

    return this.prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        status: true,
        isActive: true,
        requestLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  }

  async revoke(tenantId: string, keyId: string, actor: JwtPayload): Promise<void> {
    this.assertTenantAccess(tenantId, actor);

    const existing = await this.prisma.apiKey.findFirst({ where: { id: keyId, tenantId } });
    if (!existing) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id: keyId },
      data: {
        isActive: false,
        status: API_KEY_STATUS.REVOKED,
      },
    });

    await this.auditLog.log({
      tenantId,
      userId: actor.sub,
      action: 'tenant.api_key.revoke',
      resource: 'api_key',
      resourceId: keyId,
    });
  }

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
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