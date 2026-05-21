import { ScoringService } from './scoring.service';
import { DEFAULT_TRUST_CONFIG } from '../constants/trust.constants';
import type { TrustSignals, HistoryResult } from '../interfaces/trust.interface';

describe('ScoringService', () => {
  let service: ScoringService;

  const cleanSignals: TrustSignals = {
    vpn: false,
    proxy: false,
    tor: false,
    hosting: false,
    geoVelocityRisk: false,
    concurrentRisk: false,
  };

  const cleanHistory: HistoryResult = {
    stableIp: false,
    trustedHistory: false,
    residentialIsp: false,
  };

  beforeEach(() => {
    service = new ScoringService();
  });

  it('returns riskScore 0 and "No abuse indicators" for clean IP', () => {
    const result = service.compute(cleanSignals, cleanHistory, 80, DEFAULT_TRUST_CONFIG);
    expect(result.riskScore).toBe(0);
    expect(result.reasons).toContain('No abuse indicators');
  });

  it('adds tor penalty', () => {
    const signals = { ...cleanSignals, tor: true };
    const result = service.compute(signals, cleanHistory, 80, DEFAULT_TRUST_CONFIG);
    expect(result.riskScore).toBe(DEFAULT_TRUST_CONFIG.torPenalty);
    expect(result.reasons).toContain('Tor exit node detected');
  });

  it('adds vpn penalty when allowVpn is false', () => {
    const signals = { ...cleanSignals, vpn: true };
    const result = service.compute(signals, cleanHistory, 80, DEFAULT_TRUST_CONFIG);
    expect(result.riskScore).toBe(DEFAULT_TRUST_CONFIG.vpnPenalty);
  });

  it('skips vpn penalty when allowVpn is true', () => {
    const signals = { ...cleanSignals, vpn: true };
    const config = { ...DEFAULT_TRUST_CONFIG, allowVpn: true };
    const result = service.compute(signals, cleanHistory, 80, config);
    expect(result.riskScore).toBe(0);
  });

  it('adds proxy penalty', () => {
    const signals = { ...cleanSignals, proxy: true };
    const result = service.compute(signals, cleanHistory, 80, DEFAULT_TRUST_CONFIG);
    expect(result.riskScore).toBe(DEFAULT_TRUST_CONFIG.proxyPenalty);
  });

  it('adds hosting penalty', () => {
    const signals = { ...cleanSignals, hosting: true };
    const result = service.compute(signals, cleanHistory, 80, DEFAULT_TRUST_CONFIG);
    expect(result.riskScore).toBe(DEFAULT_TRUST_CONFIG.hostingPenalty);
  });

  it('applies residential ISP bonus', () => {
    const history = { ...cleanHistory, residentialIsp: true };
    const result = service.compute(cleanSignals, history, 80, DEFAULT_TRUST_CONFIG);
    expect(result.riskScore).toBe(0);
    expect(result.reasons).toContain('Residential ISP detected');
  });

  it('applies stable IP and trusted history bonuses', () => {
    const signals = { ...cleanSignals, hosting: true };
    const history = { stableIp: true, trustedHistory: true, residentialIsp: false };
    const result = service.compute(signals, history, 80, DEFAULT_TRUST_CONFIG);
    // hosting(40) - stableIp(10) - trustedHistory(15) = 15
    expect(result.riskScore).toBe(15);
  });

  it('clamps riskScore to 0 minimum', () => {
    const history = { stableIp: true, trustedHistory: true, residentialIsp: true };
    const result = service.compute(cleanSignals, history, 80, DEFAULT_TRUST_CONFIG);
    expect(result.riskScore).toBe(0);
  });

  it('clamps riskScore to 100 maximum', () => {
    const signals: TrustSignals = {
      vpn: true, proxy: true, tor: true, hosting: true,
      geoVelocityRisk: true, concurrentRisk: true,
    };
    const result = service.compute(signals, cleanHistory, 80, DEFAULT_TRUST_CONFIG);
    expect(result.riskScore).toBe(100);
  });
});
