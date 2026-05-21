import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@trustip/shared-types';
import type { JwtPayload } from '@trustip/shared-types';

function createMockExecutionContext(role: Role, _requiredRoles?: Role[]): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: {
          sub: 'user-id',
          email: 'test@trustip.io',
          role,
          tenantId: 'tenant-id',
        } satisfies Partial<JwtPayload>,
      }),
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockExecutionContext(Role.VIEWER);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow SUPER_ADMIN to access TENANT_ADMIN route (hierarchy)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TENANT_ADMIN]);
    const ctx = createMockExecutionContext(Role.SUPER_ADMIN);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow TENANT_ADMIN to access TENANT_ADMIN route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TENANT_ADMIN]);
    const ctx = createMockExecutionContext(Role.TENANT_ADMIN);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny VIEWER access to TENANT_ADMIN route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.TENANT_ADMIN]);
    const ctx = createMockExecutionContext(Role.VIEWER);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should deny TENANT_MANAGER access to SUPER_ADMIN route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SUPER_ADMIN]);
    const ctx = createMockExecutionContext(Role.TENANT_MANAGER);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow access when user has exact required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VIEWER]);
    const ctx = createMockExecutionContext(Role.VIEWER);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
