import { TorDetectorService } from './tor-detector.service';

describe('TorDetectorService', () => {
  let service: TorDetectorService;
  let mockRedis: { sismember: jest.Mock };

  beforeEach(() => {
    mockRedis = { sismember: jest.fn() };
    service = new TorDetectorService(mockRedis as never);
  });

  it('returns true when IP is a Tor exit node', async () => {
    mockRedis.sismember.mockResolvedValue(1);
    expect(await service.detect('1.2.3.4')).toBe(true);
  });

  it('returns false when IP is not a Tor exit node', async () => {
    mockRedis.sismember.mockResolvedValue(0);
    expect(await service.detect('1.2.3.4')).toBe(false);
  });

  it('returns false on Redis error', async () => {
    mockRedis.sismember.mockRejectedValue(new Error('redis error'));
    expect(await service.detect('1.2.3.4')).toBe(false);
  });
});
