import { describe, expect, it } from 'vitest';
import { canAccessRoute } from './auth';

describe('canAccessRoute', () => {
  it('denies tenant route for non-super-admin roles', () => {
    expect(canAccessRoute('TENANT_ADMIN', '/tenants')).toBe(false);
    expect(canAccessRoute('VIEWER', '/tenants')).toBe(false);
  });

  it('allows super admin access to tenant route', () => {
    expect(canAccessRoute('SUPER_ADMIN', '/tenants')).toBe(true);
  });

  it('denies billing route for viewer', () => {
    expect(canAccessRoute('VIEWER', '/billing')).toBe(false);
  });

  it('allows manager route for analytics', () => {
    expect(canAccessRoute('TENANT_MANAGER', '/analytics')).toBe(true);
  });
});
