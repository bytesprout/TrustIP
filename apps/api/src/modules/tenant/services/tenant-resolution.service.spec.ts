import { TenantResolutionService } from './tenant-resolution.service';

describe('TenantResolutionService', () => {
  const service = new TenantResolutionService();

  it('resolves tenant from API-key guard context', () => {
    const tenantId = service.resolveFromRequest({ tenant: { id: 'tenant-1' } } as never);
    expect(tenantId).toBe('tenant-1');
  });

  it('resolves tenant from jwt user context', () => {
    const tenantId = service.resolveFromRequest({
      user: { tenantId: 'tenant-2' },
    } as never);
    expect(tenantId).toBe('tenant-2');
  });

  it('returns null when no tenant context exists', () => {
    const tenantId = service.resolveFromRequest({} as never);
    expect(tenantId).toBeNull();
  });
});
