import { TorDetectorService } from './tor-detector.service';

describe('TorDetectorService', () => {
  let service: TorDetectorService;
  let threatIntelLookup: { isListed: jest.Mock };

  beforeEach(() => {
    threatIntelLookup = { isListed: jest.fn() };
    service = new TorDetectorService(threatIntelLookup as never);
  });

  it('returns true when IP is a Tor exit node', async () => {
    threatIntelLookup.isListed.mockResolvedValue(true);
    expect(await service.detect('1.2.3.4')).toBe(true);
  });

  it('returns false when IP is not a Tor exit node', async () => {
    threatIntelLookup.isListed.mockResolvedValue(false);
    expect(await service.detect('1.2.3.4')).toBe(false);
  });

  it('returns false on lookup error', async () => {
    threatIntelLookup.isListed.mockRejectedValue(new Error('lookup error'));
    expect(await service.detect('1.2.3.4')).toBe(false);
  });
});
