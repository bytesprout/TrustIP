import { ConcurrentRiskService } from './concurrent-risk.service';

describe('ConcurrentRiskService', () => {
  let service: ConcurrentRiskService;
  let mockRedis: {
    zadd: jest.Mock;
    zremrangebyscore: jest.Mock;
    expire: jest.Mock;
    zcard: jest.Mock;
  };

  beforeEach(() => {
    mockRedis = {
      zadd: jest.fn().mockResolvedValue(1),
      zremrangebyscore: jest.fn().mockResolvedValue(0),
      expire: jest.fn().mockResolvedValue(1),
      zcard: jest.fn(),
    };
    service = new ConcurrentRiskService(mockRedis as never);
  });

  it('returns false when stream count is within limit', async () => {
    mockRedis.zcard.mockResolvedValue(2);
    expect(await service.detect('tenant-1', 'account-1', '1.2.3.4', 2)).toBe(false);
  });

  it('returns true when stream count exceeds limit', async () => {
    mockRedis.zcard.mockResolvedValue(5);
    expect(await service.detect('tenant-1', 'account-1', '1.2.3.4', 2)).toBe(true);
  });

  it('uses IP as fallback when no accountId provided', async () => {
    mockRedis.zcard.mockResolvedValue(1);
    await service.detect('tenant-1', undefined, '1.2.3.4', 2);
    expect(mockRedis.zadd).toHaveBeenCalledWith(
      expect.stringContaining('1.2.3.4'),
      expect.any(Number),
      expect.any(String),
    );
  });

  it('returns false on Redis error', async () => {
    mockRedis.zadd.mockRejectedValue(new Error('redis error'));
    expect(await service.detect('tenant-1', 'account-1', '1.2.3.4', 2)).toBe(false);
  });
});
