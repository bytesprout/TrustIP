import { RuleEngineService } from './rule-engine.service';
import { DEFAULT_TRUST_CONFIG } from '../constants/trust.constants';

describe('RuleEngineService', () => {
  let service: RuleEngineService;

  beforeEach(() => {
    service = new RuleEngineService();
  });

  describe('mergeConfig', () => {
    it('returns default config when no overrides provided', () => {
      expect(service.mergeConfig()).toEqual(DEFAULT_TRUST_CONFIG);
    });

    it('merges tenant overrides with defaults', () => {
      const merged = service.mergeConfig({ vpnPenalty: 50, allowVpn: true });
      expect(merged.vpnPenalty).toBe(50);
      expect(merged.allowVpn).toBe(true);
      expect(merged.torPenalty).toBe(DEFAULT_TRUST_CONFIG.torPenalty);
    });
  });

  describe('applyRules', () => {
    it('returns ALLOW for riskScore < 30', () => {
      expect(service.applyRules(0)).toBe('ALLOW');
      expect(service.applyRules(29)).toBe('ALLOW');
    });

    it('returns WARN for riskScore 30-49', () => {
      expect(service.applyRules(30)).toBe('WARN');
      expect(service.applyRules(49)).toBe('WARN');
    });

    it('returns CHALLENGE for riskScore 50-69', () => {
      expect(service.applyRules(50)).toBe('CHALLENGE');
      expect(service.applyRules(69)).toBe('CHALLENGE');
    });

    it('returns TEMP_BLOCK for riskScore 70-89', () => {
      expect(service.applyRules(70)).toBe('TEMP_BLOCK');
      expect(service.applyRules(89)).toBe('TEMP_BLOCK');
    });

    it('returns BLOCK for riskScore >= 90', () => {
      expect(service.applyRules(90)).toBe('BLOCK');
      expect(service.applyRules(100)).toBe('BLOCK');
    });
  });
});
