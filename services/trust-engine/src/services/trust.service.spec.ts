import { TrustService } from './trust.service';
import { VpnDetectorService } from './vpn-detector.service';
import { TorDetectorService } from './tor-detector.service';
import { ProxyDetectorService } from './proxy-detector.service';
import { HostingDetectorService } from './hosting-detector.service';
import { GeoAnomalyService } from './geo-anomaly.service';
import { ConcurrentRiskService } from './concurrent-risk.service';
import { HistoryRiskService } from './history-risk.service';
import { ScoringService } from './scoring.service';
import { RuleEngineService } from './rule-engine.service';
import { ExplainabilityService } from './explainability.service';
import { ConnectionType } from '@trustip/geo-engine';
import type { IpLookupResult } from '@trustip/geo-engine';
import type { TrustInput } from '../interfaces/trust.interface';

const makeGeoResult = (): IpLookupResult => ({
  ip: { address: '1.2.3.4', version: 'IPv4' },
  location: {
    continent: 'North America', country: 'United States', countryCode: 'US',
    state: 'California', district: null, city: 'Los Angeles', zip: '90001',
    timezone: 'America/Los_Angeles', latitude: 34.05, longitude: -118.24,
    geoAccuracyRadiusKm: 5,
  },
  network: {
    asn: 12345, isp: 'Comcast Cable', organization: 'Comcast',
    network: '1.2.3.0/24', connectionType: ConnectionType.RESIDENTIAL,
  },
  reverseDns: null,
  geoConfidence: { score: 80, level: 'HIGH' as const },
  metadata: { cacheHit: false, lookupTimeMs: 10 },
});

describe('TrustService', () => {
  let service: TrustService;
  let mockRedis: { get: jest.Mock; setex: jest.Mock; set: jest.Mock };

  const makeTrustInput = (overrides: Partial<TrustInput> = {}): TrustInput => ({
    ip: '1.2.3.4',
    tenantId: 'tenant-1',
    geoResult: makeGeoResult(),
    privacyFlags: { vpn: false, proxy: false, tor: false },
    ...overrides,
  });

  beforeEach(() => {
    mockRedis = {
      get: jest.fn().mockResolvedValue(null),
      setex: jest.fn().mockResolvedValue('OK'),
      set: jest.fn().mockResolvedValue('OK'),
    };

    const vpnDetector = { detect: jest.fn().mockResolvedValue(false) } as unknown as VpnDetectorService;
    const torDetector = { detect: jest.fn().mockResolvedValue(false) } as unknown as TorDetectorService;
    const proxyDetector = { detect: jest.fn().mockResolvedValue(false) } as unknown as ProxyDetectorService;
    const hostingDetector = { detect: jest.fn().mockReturnValue(false) } as unknown as HostingDetectorService;
    const geoAnomaly = { detect: jest.fn().mockResolvedValue(false) } as unknown as GeoAnomalyService;
    const concurrentRisk = { detect: jest.fn().mockResolvedValue(false) } as unknown as ConcurrentRiskService;
    const historyRisk = {
      evaluate: jest.fn().mockResolvedValue({ stableIp: false, trustedHistory: false, residentialIsp: false }),
    } as unknown as HistoryRiskService;

    service = new TrustService(
      vpnDetector,
      torDetector,
      proxyDetector,
      hostingDetector,
      geoAnomaly,
      concurrentRisk,
      historyRisk,
      new ScoringService(),
      new RuleEngineService(),
      new ExplainabilityService(),
      mockRedis as never,
    );
  });

  it('returns a valid TrustOutput for a clean IP', async () => {
    const result = await service.evaluate(makeTrustInput());
    expect(result.trustScore).toBeGreaterThanOrEqual(0);
    expect(result.trustScore).toBeLessThanOrEqual(100);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(['ALLOW', 'WARN', 'CHALLENGE', 'TEMP_BLOCK', 'BLOCK']).toContain(result.decision);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.confidence);
    expect(result.signals).toBeDefined();
    expect(result.reasons).toBeInstanceOf(Array);
  });

  it('returns cached result when cache is populated', async () => {
    const cached = {
      trustScore: 90, riskScore: 10, decision: 'ALLOW',
      confidence: 'HIGH', signals: {}, reasons: ['cached'],
    };
    mockRedis.get.mockResolvedValue(JSON.stringify(cached));
    const result = await service.evaluate(makeTrustInput());
    expect(result.reasons).toContain('cached');
  });

  it('uses privacyFlags vpn override', async () => {
    const result = await service.evaluate(makeTrustInput({ privacyFlags: { vpn: true, proxy: false, tor: false } }));
    expect(result.signals.vpn).toBe(true);
    expect(result.riskScore).toBeGreaterThan(0);
  });

  it('applies tor privacy flag', async () => {
    const result = await service.evaluate(makeTrustInput({ privacyFlags: { vpn: false, proxy: false, tor: true } }));
    expect(result.signals.tor).toBe(true);
    expect(result.decision).not.toBe('ALLOW');
  });

  it('trustScore equals 100 - riskScore', async () => {
    const result = await service.evaluate(makeTrustInput());
    expect(result.trustScore + result.riskScore).toBeLessThanOrEqual(100);
  });
});
