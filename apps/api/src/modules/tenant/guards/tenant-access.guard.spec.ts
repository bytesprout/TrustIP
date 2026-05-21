import { ForbiddenException } from '@nestjs/common';
import { TenantAccessGuard } from './tenant-access.guard';

function createContext(req: unknown) {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
    }),
  } as never;
}

describe('TenantAccessGuard', () => {
  let guard: TenantAccessGuard;

  beforeEach(() => {
    guard = new TenantAccessGuard();
  });

  it('allows SUPER_ADMIN on any tenant', () => {
    const req = {
      user: { role: 'SUPER_ADMIN', tenantId: null },
      params: { tenantId: 'tenant-b' },
    };

    expect(guard.canActivate(createContext(req))).toBe(true);
  });

  it('blocks cross-tenant access for non-super users', () => {
    const req = {
      user: { role: 'TENANT_ADMIN', tenantId: 'tenant-a' },
      params: { tenantId: 'tenant-b' },
    };

    expect(() => guard.canActivate(createContext(req))).toThrow(ForbiddenException);
  });

  it('allows same-tenant access for non-super users', () => {
    const req = {
      user: { role: 'TENANT_ADMIN', tenantId: 'tenant-a' },
      params: { tenantId: 'tenant-a' },
    };

    expect(guard.canActivate(createContext(req))).toBe(true);
  });
});
