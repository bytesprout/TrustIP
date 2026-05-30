import { VpnDetectorService } from './vpn-detector.service';
import type { TenantTrustConfig } from '../interfaces/trust.interface';
import { DEFAULT_TRUST_CONFIG } from '../constants/trust.constants';

describe('VpnDetectorService', () => {
  let service: VpnDetectorService;
  let threatIntelLookup: { isListed: jest.Mock };

  const config: TenantTrustConfig = { ...DEFAULT_TRUST_CONFIG };

  beforeEach(() => {
    threatIntelLookup = { isListed: jest.fn() };
    service = new VpnDetectorService(threatIntelLookup as never);
  });

  it('returns true when IP is in Redis VPN set', async () => {
    threatIntelLookup.isListed.mockResolvedValue(true);
    expect(await service.detect('1.2.3.4', 'Some ISP', config)).toBe(true);
  });

  it('returns true when ISP matches VPN pattern', async () => {
    threatIntelLookup.isListed.mockResolvedValue(false);
    expect(await service.detect('1.2.3.4', 'NordVPN Services', config)).toBe(true);
  });

  it('returns true when ISP matches hosting pattern (AWS)', async () => {
    threatIntelLookup.isListed.mockResolvedValue(false);
    expect(await service.detect('1.2.3.4', 'Amazon AWS', config)).toBe(true);
  });

  it('returns false when IP not in set and ISP is clean', async () => {
    threatIntelLookup.isListed.mockResolvedValue(false);
    expect(await service.detect('1.2.3.4', 'Comcast Cable', config)).toBe(false);
  });

  it('returns false on lookup error', async () => {
    threatIntelLookup.isListed.mockRejectedValue(new Error('lookup error'));
    expect(await service.detect('1.2.3.4', 'Some ISP', config)).toBe(false);
  });
});
