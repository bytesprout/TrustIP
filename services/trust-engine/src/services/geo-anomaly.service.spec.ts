import { GeoAnomalyService } from './geo-anomaly.service';

describe('GeoAnomalyService', () => {
  let service: GeoAnomalyService;
  let mockRedis: { get: jest.Mock; set: jest.Mock };

  beforeEach(() => {
    mockRedis = { get: jest.fn(), set: jest.fn().mockResolvedValue('OK') };
    service = new GeoAnomalyService(mockRedis as never);
  });

  it('returns false when no country provided', async () => {
    expect(await service.detect('1.2.3.4', 'tenant-1', null)).toBe(false);
  });

  it('returns false when IP has no previous geo record', async () => {
    mockRedis.get.mockResolvedValue(null);
    expect(await service.detect('1.2.3.4', 'tenant-1', 'US')).toBe(false);
  });

  it('returns false when country is unchanged', async () => {
    const now = Math.floor(Date.now() / 1000) - 60;
    mockRedis.get.mockResolvedValue(JSON.stringify({ country: 'US', seenAt: now }));
    expect(await service.detect('1.2.3.4', 'tenant-1', 'US')).toBe(false);
  });

  it('returns true when country changed within velocity window', async () => {
    const now = Math.floor(Date.now() / 1000) - 60;
    mockRedis.get.mockResolvedValue(JSON.stringify({ country: 'US', seenAt: now }));
    expect(await service.detect('1.2.3.4', 'tenant-1', 'CN')).toBe(true);
  });

  it('returns false when country changed outside velocity window', async () => {
    const oldTime = Math.floor(Date.now() / 1000) - 600;
    mockRedis.get.mockResolvedValue(JSON.stringify({ country: 'US', seenAt: oldTime }));
    expect(await service.detect('1.2.3.4', 'tenant-1', 'CN')).toBe(false);
  });

  it('returns false on Redis error', async () => {
    mockRedis.get.mockRejectedValue(new Error('redis error'));
    expect(await service.detect('1.2.3.4', 'tenant-1', 'US')).toBe(false);
  });
});
