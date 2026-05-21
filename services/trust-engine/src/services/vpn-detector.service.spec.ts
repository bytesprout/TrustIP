import { VpnDetectorService } from './vpn-detector.service';
import type { TenantTrustConfig } from '../interfaces/trust.interface';
import { DEFAULT_TRUST_CONFIG } from '../constants/trust.constants';

describe('VpnDetectorService', () => {
  let service: VpnDetectorService;
  let mockRedis: { sismember: jest.Mock };

  const config: TenantTrustConfig = { ...DEFAULT_TRUST_CONFIG };

  beforeEach(() => {
    mockRedis = { sismember: jest.fn() };
    service = new VpnDetectorService(mockRedis as never);
  });

  it('returns true when IP is in Redis VPN set', async () => {
    mockRedis.sismember.mockResolvedValue(1);
    expect(await service.detect('1.2.3.4', 'Some ISP', config)).toBe(true);
  });

  it('returns true when ISP matches VPN pattern', async () => {
    mockRedis.sismember.mockResolvedValue(0);
    expect(await service.detect('1.2.3.4', 'NordVPN Services', config)).toBe(true);
  });

  it('returns true when ISP matches hosting pattern (AWS)', async () => {
    mockRedis.sismember.mockResolvedValue(0);
    expect(await service.detect('1.2.3.4', 'Amazon AWS', config)).toBe(true);
  });

  it('returns false when IP not in set and ISP is clean', async () => {
    mockRedis.sismember.mockResolvedValue(0);
    expect(await service.detect('1.2.3.4', 'Comcast Cable', config)).toBe(false);
  });

  it('returns false on Redis error', async () => {
    mockRedis.sismember.mockRejectedValue(new Error('redis error'));
    expect(await service.detect('1.2.3.4', 'Some ISP', config)).toBe(false);
  });
});
