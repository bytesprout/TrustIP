import { ResponseBuilderService } from './response-builder.service';
import { ConnectionType, GeoConfidenceLevel } from '@trustip/geo-engine';
import type { EnrichedIpResult } from '../interfaces/ip.interfaces';

const baseResult: EnrichedIpResult = {
  ip: { address: '8.8.8.8', version: 'IPv4' },
  location: {
    continent: 'North America',
    country: 'United States',
    countryCode: 'US',
    state: 'California',
    district: null,
    city: 'Mountain View',
    zip: '94035',
    timezone: 'America/Los_Angeles',
    latitude: 37.3861,
    longitude: -122.0839,
    geoAccuracyRadiusKm: 10,
  },
  network: {
    asn: 15169,
    isp: 'Google LLC',
    organization: 'Google LLC',
    network: '8.8.8.0/24',
    connectionType: ConnectionType.HOSTING,
  },
  reverseDns: 'dns.google',
  geoConfidence: { score: 85, level: GeoConfidenceLevel.HIGH },
  metadata: { cacheHit: false, lookupTimeMs: 12 },
  privacy: { vpn: false, proxy: false, tor: false },
};

describe('ResponseBuilderService', () => {
  let service: ResponseBuilderService;

  beforeEach(() => {
    service = new ResponseBuilderService();
  });

  describe('buildBasic', () => {
    it('should build a valid frozen BasicIpResponse', () => {
      const result = service.buildBasic(baseResult, 12);
      expect(result.success).toBe(true);
      expect(result.ip.address).toBe('8.8.8.8');
      expect(result.ip.version).toBe('IPv4');
      expect(result.location.countryCode).toBe('US');
      expect(result.network.asn).toBe(15169);
      expect(result.metadata.cacheHit).toBe(false);
      expect(result.metadata.lookupTimeMs).toBe(12);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle null location fields', () => {
      const nullResult: EnrichedIpResult = {
        ...baseResult,
        location: {
          continent: null, country: null, countryCode: null,
          state: null, district: null, city: null, zip: null,
          timezone: null, latitude: null, longitude: null, geoAccuracyRadiusKm: null,
        },
      };
      const response = service.buildBasic(nullResult, 5);
      expect(response.location.country).toBeNull();
      expect(response.location.latitude).toBeNull();
    });
  });

  describe('buildIntelligence', () => {
    it('should build intelligence response with privacy flags', () => {
      const result = service.buildIntelligence(baseResult, 'tenant1', true, 15);
      expect(result.success).toBe(true);
      expect(result.request.tenantId).toBe('tenant1');
      expect(result.request.lookupType).toBe('custom_ip');
      expect(result.privacy.vpn).toBe(false);
      expect(result.privacy.tor).toBe(false);
      expect(result.privacy.hosting).toBe(true); // HOSTING type
      expect(result.security.threatLevel).toBe('LOW');
    });

    it('should mark threat level CRITICAL for Tor exit node', () => {
      const torResult: EnrichedIpResult = {
        ...baseResult,
        privacy: { vpn: false, proxy: false, tor: true },
      };
      const response = service.buildIntelligence(torResult, 'tenant1', false, 10);
      expect(response.security.threatLevel).toBe('CRITICAL');
      expect(response.security.blacklisted).toBe(true);
      expect(response.security.abuseConfidence).toBe(60);
    });

    it('should set caller_ip lookupType for non-custom IP', () => {
      const response = service.buildIntelligence(baseResult, 'tenant1', false, 10);
      expect(response.request.lookupType).toBe('caller_ip');
    });
  });

  describe('buildTrustScore', () => {
    it('should return score 80 for hosting (HOSTING -20, base 100)', () => {
      const response = service.buildTrustScore(baseResult, 10);
      expect(response.success).toBe(true);
      expect(response.ip).toBe('8.8.8.8');
      expect(response.trust.trustScore).toBe(80);
      expect(response.trust.riskScore).toBe(20);
      expect(response.trust.decision).toBe('ALLOW');
      expect(response.trust.reasons).toContain('Hosting provider');
    });

    it('should return score 0 for Tor + VPN + Proxy', () => {
      const threatResult: EnrichedIpResult = {
        ...baseResult,
        privacy: { vpn: true, proxy: true, tor: true },
        network: { ...baseResult.network, connectionType: ConnectionType.HOSTING },
      };
      const response = service.buildTrustScore(threatResult, 10);
      expect(response.trust.trustScore).toBe(0);
      expect(response.trust.decision).toBe('BLOCK');
    });

    it('should give residential bonus', () => {
      const residentialResult: EnrichedIpResult = {
        ...baseResult,
        network: { ...baseResult.network, connectionType: ConnectionType.RESIDENTIAL },
        privacy: { vpn: false, proxy: false, tor: false },
      };
      const response = service.buildTrustScore(residentialResult, 10);
      // 100 + 5 = 105, clamped to 100
      expect(response.trust.trustScore).toBe(100);
    });
  });
});
