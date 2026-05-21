import { IpValidatorService } from './ip-validator.service';

describe('IpValidatorService', () => {
  let service: IpValidatorService;

  beforeEach(() => {
    service = new IpValidatorService();
  });

  describe('isValid', () => {
    it('should accept valid IPv4', () => {
      expect(service.isValid('8.8.8.8')).toBe(true);
      expect(service.isValid('1.1.1.1')).toBe(true);
      expect(service.isValid('203.0.113.1')).toBe(true);
    });

    it('should accept valid IPv6', () => {
      expect(service.isValid('2001:4860:4860::8888')).toBe(true);
    });

    it('should reject invalid IPs', () => {
      expect(service.isValid('not-an-ip')).toBe(false);
      expect(service.isValid('999.999.999.999')).toBe(false);
      expect(service.isValid('')).toBe(false);
    });
  });

  describe('isPublicRoutable', () => {
    it('should accept public IPv4', () => {
      expect(service.isPublicRoutable('8.8.8.8')).toBe(true);
      expect(service.isPublicRoutable('1.1.1.1')).toBe(true);
    });

    it('should reject private IPv4', () => {
      expect(service.isPublicRoutable('10.0.0.1')).toBe(false);
      expect(service.isPublicRoutable('192.168.1.1')).toBe(false);
      expect(service.isPublicRoutable('172.16.0.1')).toBe(false);
      expect(service.isPublicRoutable('127.0.0.1')).toBe(false);
    });

    it('should reject IPv6 loopback', () => {
      expect(service.isPublicRoutable('::1')).toBe(false);
    });

    it('should reject invalid IP', () => {
      expect(service.isPublicRoutable('invalid')).toBe(false);
    });
  });

  describe('extractFromHeaders', () => {
    it('should prefer cf-connecting-ip', () => {
      const result = service.extractFromHeaders({
        'cf-connecting-ip': '8.8.8.8',
        'x-forwarded-for': '1.1.1.1',
      });
      expect(result).toBe('8.8.8.8');
    });

    it('should fallback to x-forwarded-for first IP', () => {
      const result = service.extractFromHeaders({
        'x-forwarded-for': '8.8.8.8, 10.0.0.1',
      });
      expect(result).toBe('8.8.8.8');
    });

    it('should use x-real-ip', () => {
      const result = service.extractFromHeaders({
        'x-real-ip': '1.1.1.1',
      });
      expect(result).toBe('1.1.1.1');
    });

    it('should fallback to remoteAddress and strip ::ffff:', () => {
      const result = service.extractFromHeaders({}, '::ffff:8.8.8.8');
      expect(result).toBe('8.8.8.8');
    });

    it('should return null when all sources are private', () => {
      const result = service.extractFromHeaders({
        'x-forwarded-for': '192.168.1.1',
      }, '127.0.0.1');
      expect(result).toBeNull();
    });

    it('should skip private cf-connecting-ip and fallback', () => {
      const result = service.extractFromHeaders({
        'cf-connecting-ip': '192.168.1.1',
        'x-forwarded-for': '8.8.8.8',
      });
      expect(result).toBe('8.8.8.8');
    });
  });

  describe('getVersion', () => {
    it('should return IPv4 for IPv4 addresses', () => {
      expect(service.getVersion('8.8.8.8')).toBe('IPv4');
    });

    it('should return IPv6 for IPv6 addresses', () => {
      expect(service.getVersion('2001:4860::8888')).toBe('IPv6');
    });
  });
});
