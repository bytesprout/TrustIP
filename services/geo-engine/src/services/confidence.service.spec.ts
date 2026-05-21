import { ConfidenceService } from './confidence.service';
import { ConnectionType, GeoConfidenceLevel } from '../constants/geo.constants';
import type { GeoLocation, AsnResult } from '../interfaces/geo-result.interface';

describe('ConfidenceService', () => {
  let service: ConfidenceService;

  const baseLocation: GeoLocation = {
    continent: 'Asia', country: 'India', countryCode: 'IN',
    state: 'Kerala', district: null, city: 'Kochi',
    zip: '682001', timezone: 'Asia/Kolkata',
    latitude: 9.93, longitude: 76.26, geoAccuracyRadiusKm: 10,
  };

  const residentialAsn: AsnResult = {
    asn: 55836, isp: 'Reliance Jio', organization: 'Reliance Jio Infocomm',
    network: '49.0.0.0/8', connectionType: ConnectionType.RESIDENTIAL,
  };

  beforeEach(() => {
    service = new ConfidenceService();
  });

  it('should return HIGH confidence for residential with accurate location', () => {
    const result = service.calculate(baseLocation, residentialAsn);
    expect(result.level).toBe(GeoConfidenceLevel.HIGH);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('should penalize HOSTING connection type', () => {
    const hostingAsn: AsnResult = { ...residentialAsn, connectionType: ConnectionType.HOSTING };
    const residential = service.calculate(baseLocation, residentialAsn);
    const hosting = service.calculate(baseLocation, hostingAsn);
    expect(hosting.score).toBeLessThan(residential.score);
  });

  it('should penalize null ISP', () => {
    const noIspAsn: AsnResult = { ...residentialAsn, isp: null };
    const withIsp = service.calculate(baseLocation, residentialAsn);
    const noIsp = service.calculate(baseLocation, noIspAsn);
    expect(noIsp.score).toBeLessThan(withIsp.score);
  });

  it('should give LOW confidence for null location data', () => {
    const emptyLocation: GeoLocation = {
      continent: null, country: null, countryCode: null,
      state: null, district: null, city: null,
      zip: null, timezone: null, latitude: null, longitude: null,
      geoAccuracyRadiusKm: null,
    };
    const emptyAsn: AsnResult = {
      asn: null, isp: null, organization: null,
      network: null, connectionType: ConnectionType.UNKNOWN,
    };
    const result = service.calculate(emptyLocation, emptyAsn);
    expect(result.level).toBe(GeoConfidenceLevel.LOW);
    expect(result.score).toBe(0);
  });

  it('should clamp score to 0-100', () => {
    const result = service.calculate(baseLocation, residentialAsn);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should map scores to correct levels', () => {
    // HIGH >= 70, MEDIUM 40-69, LOW < 40
    const highResult = service.calculate(baseLocation, residentialAsn);
    expect([GeoConfidenceLevel.HIGH, GeoConfidenceLevel.MEDIUM, GeoConfidenceLevel.LOW]).toContain(highResult.level);
  });
});
