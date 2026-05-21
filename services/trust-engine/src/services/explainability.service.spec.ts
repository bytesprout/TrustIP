import { ExplainabilityService } from './explainability.service';

describe('ExplainabilityService', () => {
  let service: ExplainabilityService;

  beforeEach(() => {
    service = new ExplainabilityService();
  });

  it('returns HIGH for high geo confidence and zero signals', () => {
    expect(service.buildConfidence(70, 0)).toBe('HIGH');
    expect(service.buildConfidence(100, 0)).toBe('HIGH');
  });

  it('returns MEDIUM for high geo confidence with signals present', () => {
    expect(service.buildConfidence(70, 1)).toBe('MEDIUM');
    expect(service.buildConfidence(80, 2)).toBe('MEDIUM');
  });

  it('returns MEDIUM for medium geo confidence regardless of signals', () => {
    expect(service.buildConfidence(50, 0)).toBe('MEDIUM');
    expect(service.buildConfidence(60, 3)).toBe('MEDIUM');
  });

  it('returns LOW for low geo confidence', () => {
    expect(service.buildConfidence(30, 0)).toBe('LOW');
    expect(service.buildConfidence(0, 5)).toBe('LOW');
  });
});
