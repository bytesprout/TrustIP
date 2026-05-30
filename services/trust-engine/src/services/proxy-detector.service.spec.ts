import { ProxyDetectorService } from './proxy-detector.service';

describe('ProxyDetectorService', () => {
  let service: ProxyDetectorService;
  let threatIntelLookup: { isListed: jest.Mock };

  beforeEach(() => {
    threatIntelLookup = { isListed: jest.fn() };
    service = new ProxyDetectorService(threatIntelLookup as never);
  });

  it('returns true when IP is in FireHOL blocklist', async () => {
    threatIntelLookup.isListed.mockResolvedValue(true);
    expect(await service.detect('1.2.3.4')).toBe(true);
  });

  it('returns false when IP is not in FireHOL blocklist', async () => {
    threatIntelLookup.isListed.mockResolvedValue(false);
    expect(await service.detect('1.2.3.4')).toBe(false);
  });

  it('returns false on lookup error', async () => {
    threatIntelLookup.isListed.mockRejectedValue(new Error('lookup error'));
    expect(await service.detect('1.2.3.4')).toBe(false);
  });
});
