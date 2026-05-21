import { ChecksumService } from './checksum.service';
import * as crypto from 'crypto';

describe('ChecksumService', () => {
  let service: ChecksumService;

  beforeEach(() => {
    service = new ChecksumService();
  });

  describe('computeForBuffer', () => {
    it('should compute SHA256 and MD5 for a buffer', () => {
      const buf = Buffer.from('hello world');
      const result = service.computeForBuffer(buf);
      expect(result.sha256).toBe(crypto.createHash('sha256').update(buf).digest('hex'));
      expect(result.md5).toBe(crypto.createHash('md5').update(buf).digest('hex'));
    });

    it('should produce different checksums for different data', () => {
      const r1 = service.computeForBuffer(Buffer.from('data1'));
      const r2 = service.computeForBuffer(Buffer.from('data2'));
      expect(r1.sha256).not.toBe(r2.sha256);
    });
  });

  describe('verify', () => {
    it('should return true for matching checksums', () => {
      const data = Buffer.from('test data');
      const expected = crypto.createHash('sha256').update(data).digest('hex');
      expect(service.verify(expected, expected)).toBe(true);
    });

    it('should return false for mismatched checksums', () => {
      const a = crypto.createHash('sha256').update('data-a').digest('hex');
      const b = crypto.createHash('sha256').update('data-b').digest('hex');
      expect(service.verify(a, b)).toBe(false);
    });

    it('should return false for empty inputs', () => {
      expect(service.verify('', 'abc')).toBe(false);
      expect(service.verify('abc', '')).toBe(false);
      expect(service.verify('', '')).toBe(false);
    });

    it('should be case-insensitive', () => {
      const hash = crypto.createHash('sha256').update('data').digest('hex');
      expect(service.verify(hash.toUpperCase(), hash.toLowerCase())).toBe(true);
    });
  });
});
