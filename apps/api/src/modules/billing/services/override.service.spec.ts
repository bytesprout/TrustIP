import { ForbiddenException } from '@nestjs/common';
import { OverrideService } from './override.service';

describe('OverrideService', () => {
  const mockPrisma = {
    tenant: { findUnique: jest.fn(), update: jest.fn() },
    subscription: { findFirst: jest.fn(), update: jest.fn() },
    billingHistory: { create: jest.fn() },
  } as never;

  const mockAudit = { log: jest.fn() } as never;

  let service: OverrideService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OverrideService(mockPrisma, mockAudit);
  });

  it('requires super admin', async () => {
    await expect(
      service.activateTenant('tenant-1', {
        sub: 'u1',
        email: 'x@x.com',
        role: 'TENANT_ADMIN',
        tenantId: 'tenant-1',
        iat: 1,
        exp: 2,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
