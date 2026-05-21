import { GracePeriodService } from './grace-period.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('GracePeriodService', () => {
  const mockPrisma = {
    systemConfig: { findUnique: jest.fn() },
    subscription: { update: jest.fn(), findUnique: jest.fn() },
  };

  let service: GracePeriodService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GracePeriodService(mockPrisma as unknown as PrismaService);
  });

  it('uses default grace days when config missing', async () => {
    (mockPrisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.getGraceDays()).resolves.toBe(7);
  });

  it('applies grace period status update', async () => {
    (mockPrisma.subscription.update as jest.Mock).mockResolvedValue({ id: 'sub-1' });
    const result = await service.applyGracePeriod('sub-1', 5);
    expect(result.id).toBe('sub-1');
    expect(mockPrisma.subscription.update).toHaveBeenCalled();
  });
});
