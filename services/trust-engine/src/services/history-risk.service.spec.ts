import { HistoryRiskService } from './history-risk.service';
import { ConnectionType } from '@trustip/geo-engine';
import type { IpLookupResult } from '@trustip/geo-engine';

const makeGeoResult = (connectionType: string): IpLookupResult =>
  ({
    ip: { address: '1.2.3.4', version: 'IPv4' },
    location: {
      continent: null, country: null, countryCode: 'US', state: null,
      district: null, city: null, zip: null, timezone: null,
      latitude: null, longitude: null, geoAccuracyRadiusKm: null,
    },
    network: {
      asn: null, isp: 'Test ISP', organization: null,
      network: null, connectionType: connectionType as typeof ConnectionType[keyof typeof ConnectionType],
    },
    reverseDns: null,
    geoConfidence: { score: 80, level: 'HIGH' as const },
    metadata: { cacheHit: false, lookupTimeMs: 10 },
  });

describe('HistoryRiskService', () => {
  let service: HistoryRiskService;
  let mockRedis: { get: jest.Mock };

  beforeEach(() => {
    mockRedis = { get: jest.fn() };
    service = new HistoryRiskService(mockRedis as never);
  });

  it('returns all false for new IP with non-residential ISP', async () => {
    mockRedis.get.mockResolvedValue(null);
    const result = await service.evaluate('1.2.3.4', 'tenant-1', makeGeoResult(ConnectionType.HOSTING));
    expect(result).toEqual({ stableIp: false, trustedHistory: false, residentialIsp: false });
  });

  it('returns residentialIsp true for residential connection', async () => {
    mockRedis.get.mockResolvedValue(null);
    const result = await service.evaluate('1.2.3.4', 'tenant-1', makeGeoResult(ConnectionType.RESIDENTIAL));
    expect(result.residentialIsp).toBe(true);
    expect(result.stableIp).toBe(false);
  });

  it('returns stableIp true when history exists', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ trustScore: 80, seenAt: Date.now() }));
    const result = await service.evaluate('1.2.3.4', 'tenant-1', makeGeoResult(ConnectionType.RESIDENTIAL));
    expect(result.stableIp).toBe(true);
    expect(result.trustedHistory).toBe(true);
  });

  it('returns trustedHistory false when previous score < 70', async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ trustScore: 50, seenAt: Date.now() }));
    const result = await service.evaluate('1.2.3.4', 'tenant-1', makeGeoResult(ConnectionType.RESIDENTIAL));
    expect(result.stableIp).toBe(true);
    expect(result.trustedHistory).toBe(false);
  });

  it('returns all false on Redis error', async () => {
    mockRedis.get.mockRejectedValue(new Error('redis error'));
    const result = await service.evaluate('1.2.3.4', 'tenant-1', makeGeoResult(ConnectionType.RESIDENTIAL));
    expect(result).toEqual({ stableIp: false, trustedHistory: false, residentialIsp: false });
  });
});
