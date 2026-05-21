import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../tenant/services/audit-log.service';
import { GracePeriodService } from './grace-period.service';

describe('SubscriptionService', () => {
  const mockPrisma = {
    systemConfig: { findUnique: jest.fn() },
    subscription: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    plan: { findUnique: jest.fn() },
    tenant: { update: jest.fn() },
  };

  const mockAudit = { log: jest.fn() };
  const mockGrace = { reconcileStatus: jest.fn() };

  let service: SubscriptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SubscriptionService(
      mockPrisma as unknown as PrismaService,
      mockAudit as unknown as AuditLogService,
      mockGrace as unknown as GracePeriodService,
    );
  });

  it('allows manual mode without subscription', async () => {
    (mockPrisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({ value: 'MANUAL' });
    (mockPrisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await service.validateAccess('tenant-1');
    expect(result.allowed).toBe(true);
  });

  it('denies when subscription missing in non-manual mode', async () => {
    (mockPrisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({ value: 'SUBSCRIPTION' });
    (mockPrisma.subscription.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await service.validateAccess('tenant-1');
    expect(result.allowed).toBe(false);
  });
});
