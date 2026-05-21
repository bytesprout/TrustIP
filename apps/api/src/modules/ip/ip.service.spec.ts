import { BadRequestException } from '@nestjs/common';
import { IpService } from './ip-legacy.service';
import { ConnectionType, GeoConfidenceLevel } from '@trustip/geo-engine';
import type { IpLookupResult } from '@trustip/geo-engine';

const mockResult: IpLookupResult = {
  ip: { address: '8.8.8.8', version: 'IPv4' },
  location: {
    continent: 'North America', country: 'United States', countryCode: 'US',
    state: null, district: null, city: 'Mountain View', zip: null,
    timezone: 'America/Los_Angeles', latitude: 37.38, longitude: -122.08,
    geoAccuracyRadiusKm: 10,
  },
  network: {
    asn: 15169, isp: 'Google LLC', organization: 'Google LLC',
    network: '8.8.8.0/24', connectionType: ConnectionType.HOSTING,
  },
  reverseDns: 'dns.google',
  geoConfidence: { score: 55, level: GeoConfidenceLevel.MEDIUM },
  metadata: { cacheHit: false, lookupTimeMs: 8 },
};

const mockGeoLookupService = { lookup: jest.fn().mockResolvedValue(mockResult) };
const mockIpValidator = {
  isValid: jest.fn().mockReturnValue(true),
  isPublicRoutable: jest.fn().mockReturnValue(true),
  extractFromHeaders: jest.fn().mockReturnValue('8.8.8.8'),
};
const mockPrisma = { ipLookupLog: { create: jest.fn().mockResolvedValue({}) } };

describe('IpService', () => {
  let service: IpService;

  const req = {
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
  } as never;

  beforeEach(() => {
    service = new IpService(
      mockGeoLookupService as never,
      mockIpValidator as never,
      mockPrisma as never,
    );
    jest.clearAllMocks();
    mockGeoLookupService.lookup.mockResolvedValue(mockResult);
    mockIpValidator.isValid.mockReturnValue(true);
    mockIpValidator.isPublicRoutable.mockReturnValue(true);
    mockIpValidator.extractFromHeaders.mockReturnValue('8.8.8.8');
    mockPrisma.ipLookupLog.create.mockResolvedValue({});
  });

  it('should return result for explicit IP', async () => {
    const result = await service.lookup(req, 'tenant-1', '8.8.8.8');
    expect(mockGeoLookupService.lookup).toHaveBeenCalledWith({ ip: '8.8.8.8', tenantId: 'tenant-1' });
    expect(result.ip.address).toBe('8.8.8.8');
  });

  it('should extract caller IP when no target IP provided', async () => {
    await service.lookup(req, 'tenant-1');
    expect(mockIpValidator.extractFromHeaders).toHaveBeenCalled();
    expect(mockGeoLookupService.lookup).toHaveBeenCalledWith({ ip: '8.8.8.8', tenantId: 'tenant-1' });
  });

  it('should throw BadRequestException for invalid explicit IP', async () => {
    mockIpValidator.isValid.mockReturnValue(false);
    await expect(service.lookup(req, 'tenant-1', 'not-an-ip')).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException for private explicit IP', async () => {
    mockIpValidator.isPublicRoutable.mockReturnValue(false);
    await expect(service.lookup(req, 'tenant-1', '192.168.1.1')).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when caller IP cannot be determined', async () => {
    mockIpValidator.extractFromHeaders.mockReturnValue(null);
    await expect(service.lookup(req, 'tenant-1')).rejects.toThrow(BadRequestException);
  });

  it('should not throw even if IpLookupLog write fails', async () => {
    mockPrisma.ipLookupLog.create.mockRejectedValue(new Error('DB error'));
    await expect(service.lookup(req, 'tenant-1', '8.8.8.8')).resolves.toBeDefined();
  });
});
