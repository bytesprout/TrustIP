import { GeoCacheService } from './cache.service';
import type { IpLookupResult } from '../interfaces/geo-result.interface';
import { ConnectionType, GeoConfidenceLevel } from '../constants/geo.constants';

const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
};

describe('GeoCacheService', () => {
  let service: GeoCacheService;

  const sampleResult: IpLookupResult = {
    ip: { address: '8.8.8.8', version: 'IPv4' },
    location: {
      continent: 'North America', country: 'United States', countryCode: 'US',
      state: null, district: null, city: null, zip: null, timezone: 'America/Chicago',
      latitude: 37.751, longitude: -97.822, geoAccuracyRadiusKm: 1000,
    },
    network: {
      asn: 15169, isp: 'Google LLC', organization: 'Google LLC',
      network: '8.8.8.0/24', connectionType: ConnectionType.HOSTING,
    },
    reverseDns: 'dns.google',
    geoConfidence: { score: 55, level: GeoConfidenceLevel.MEDIUM },
    metadata: { cacheHit: false, lookupTimeMs: 12 },
  };

  beforeEach(() => {
    service = new GeoCacheService(mockRedis as never);
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return parsed result on cache hit', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(sampleResult));
      const result = await service.get('tenant-1', '8.8.8.8');
      expect(result).toEqual(sampleResult);
      expect(mockRedis.get).toHaveBeenCalledWith(expect.stringContaining('tenant-1'));
    });

    it('should return null on cache miss', async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      const result = await service.get('tenant-1', '8.8.8.8');
      expect(result).toBeNull();
    });

    it('should return null on Redis error', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Connection refused'));
      const result = await service.get('tenant-1', '8.8.8.8');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should call setex with correct TTL', async () => {
      mockRedis.setex.mockResolvedValueOnce('OK');
      await service.set('tenant-1', '8.8.8.8', sampleResult);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('tenant-1'),
        86400,
        JSON.stringify(sampleResult),
      );
    });

    it('should not throw on Redis error', async () => {
      mockRedis.setex.mockRejectedValueOnce(new Error('OOM'));
      await expect(service.set('tenant-1', '8.8.8.8', sampleResult)).resolves.not.toThrow();
    });
  });

  describe('invalidate', () => {
    it('should call del with correct key', async () => {
      mockRedis.del.mockResolvedValueOnce(1);
      await service.invalidate('tenant-1', '8.8.8.8');
      expect(mockRedis.del).toHaveBeenCalledWith(expect.stringContaining('tenant-1'));
    });
  });
});
