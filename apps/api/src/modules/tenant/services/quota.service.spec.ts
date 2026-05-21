import { QuotaService } from './quota.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';

describe('QuotaService', () => {
  const mockRedisClient = {
    incr: jest.fn(),
    expire: jest.fn(),
  };

  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  const mockRedis = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
    get: jest.fn(),
  } as unknown as RedisService;

  let service: QuotaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QuotaService(mockPrisma, mockRedis);
  });

  it('allows when quota disabled', async () => {
    (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue({
      quotaEnabled: false,
      monthlyRequestLimit: 100,
      quotaSoftLimitPercent: 80,
    });
    (mockRedisClient.incr as jest.Mock).mockResolvedValue(50);

    const result = await service.checkAndConsume('tenant-1');

    expect(result.exceeded).toBe(false);
    expect(result.limit).toBeNull();
  });

  it('returns exceeded when usage crosses limit', async () => {
    (mockPrisma.tenant.findUnique as jest.Mock).mockResolvedValue({
      quotaEnabled: true,
      monthlyRequestLimit: 100,
      quotaSoftLimitPercent: 80,
    });
    (mockRedisClient.incr as jest.Mock).mockResolvedValue(101);

    const result = await service.checkAndConsume('tenant-1');

    expect(result.exceeded).toBe(true);
    expect(result.remaining).toBe(0);
  });
});
