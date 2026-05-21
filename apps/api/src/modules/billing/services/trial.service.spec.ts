import { ConflictException } from '@nestjs/common';
import { TrialService } from './trial.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('TrialService', () => {
  const mockPrisma = {
    systemConfig: { findUnique: jest.fn() },
    tenant: { findUnique: jest.fn() },
    subscription: { findFirst: jest.fn(), create: jest.fn() },
  };

  let service: TrialService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TrialService(mockPrisma as unknown as PrismaService);
    (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'tenant-1' });
  });

  it('uses configured trial days', async () => {
    (mockPrisma.systemConfig.findUnique as jest.Mock).mockResolvedValue({ value: 14 });
    await expect(service.getTrialDays()).resolves.toBe(14);
  });

  it('blocks duplicate active trial', async () => {
    (mockPrisma.subscription.findFirst as jest.Mock)
      .mockResolvedValueOnce({ id: 'trial-1', status: 'TRIAL' });

    await expect(service.startTrial('tenant-1', 'plan-1')).rejects.toBeInstanceOf(ConflictException);
  });
});
