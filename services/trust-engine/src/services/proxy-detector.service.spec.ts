import { ProxyDetectorService } from './proxy-detector.service';

describe('ProxyDetectorService', () => {
  let service: ProxyDetectorService;
  let mockRedis: { sismember: jest.Mock };

  beforeEach(() => {
    mockRedis = { sismember: jest.fn() };
    service = new ProxyDetectorService(mockRedis as never);
  });

  it('returns true when IP is in FireHOL blocklist', async () => {
    mockRedis.sismember.mockResolvedValue(1);
    expect(await service.detect('1.2.3.4')).toBe(true);
  });

  it('returns false when IP is not in FireHOL blocklist', async () => {
    mockRedis.sismember.mockResolvedValue(0);
    expect(await service.detect('1.2.3.4')).toBe(false);
  });

  it('returns false on Redis error', async () => {
    mockRedis.sismember.mockRejectedValue(new Error('redis error'));
    expect(await service.detect('1.2.3.4')).toBe(false);
  });
});
