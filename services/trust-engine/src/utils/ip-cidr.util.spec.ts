import { isIpInCidr } from './ip-cidr.util';

describe('isIpInCidr', () => {
  it('matches IPv4 CIDR ranges', () => {
    expect(isIpInCidr('8.8.8.8', '8.8.8.0/24')).toBe(true);
    expect(isIpInCidr('8.8.9.8', '8.8.8.0/24')).toBe(false);
  });

  it('matches IPv6 CIDR ranges', () => {
    expect(isIpInCidr('2001:db8::1', '2001:db8::/32')).toBe(true);
    expect(isIpInCidr('2001:db9::1', '2001:db8::/32')).toBe(false);
  });
});
