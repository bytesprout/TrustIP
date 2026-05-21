import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@trustip/shared-types';
import { TenantService } from './tenant.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from './audit-log.service';

const buildJwt = (role: Role, tenantId: string | null) => ({
  sub: 'u1',
  email: 'test@trustip.local',
  role,
  tenantId,
  iat: 1,
  exp: 2,
});

describe('TenantService tenant isolation', () => {
  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAuditLog = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  let service: TenantService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TenantService(
      mockPrisma as unknown as PrismaService,
      mockAuditLog as unknown as AuditLogService,
    );
  });

  it('denies non-super users from listing all tenants', async () => {
    await expect(
      service.findAll(buildJwt(Role.TENANT_ADMIN, 'tenant-a')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('denies non-super users from reading another tenant', async () => {
    (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'tenant-b' });

    await expect(
      service.findById('tenant-b', buildJwt(Role.TENANT_ADMIN, 'tenant-a')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when tenant does not exist', async () => {
    (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      service.findById('missing', buildJwt(Role.SUPER_ADMIN, null)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
