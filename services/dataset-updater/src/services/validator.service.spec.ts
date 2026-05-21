import { ValidatorService } from './validator.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ValidatorService', () => {
  let service: ValidatorService;
  let tmpDir: string;

  beforeEach(async () => {
    service = new ValidatorService();
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'validator-test-'));
  });

  afterEach(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  describe('validate IP list — TOR', () => {
    it('should pass validation with sufficient valid IPs', async () => {
      const ips = Array.from({ length: 100 }, (_, i) => `1.2.3.${i % 255}`).join('\n');
      const filePath = path.join(tmpDir, 'tor.txt');
      await fs.promises.writeFile(filePath, ips);

      const result = await service.validate('tor', filePath);
      expect(result.valid).toBe(true);
      expect(result.entryCount).toBeGreaterThanOrEqual(50);
    });

    it('should fail with too few valid IPs', async () => {
      const ips = ['1.2.3.4', '5.6.7.8'].join('\n');
      const filePath = path.join(tmpDir, 'tor.txt');
      await fs.promises.writeFile(filePath, ips);

      const result = await service.validate('tor', filePath);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Too few');
    });

    it('should skip comment lines', async () => {
      const content = ['# This is a comment', '1.2.3.4', '; another comment'].join('\n');
      const filePath = path.join(tmpDir, 'tor.txt');
      await fs.promises.writeFile(filePath, content);

      // Only 1 valid IP, below 50 minimum
      const result = await service.validate('tor', filePath);
      expect(result.valid).toBe(false);
    });

    it('should return invalid for missing file', async () => {
      const result = await service.validate('tor', path.join(tmpDir, 'nonexistent.txt'));
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not found');
    });
  });

  describe('validate IP list — FIREHOL (CIDR allowed)', () => {
    it('should accept CIDR entries', async () => {
      const entries = Array.from({ length: 200 }, (_, i) => `10.${i % 255}.0.0/24`).join('\n');
      const filePath = path.join(tmpDir, 'firehol.txt');
      await fs.promises.writeFile(filePath, entries);

      const result = await service.validate('firehol', filePath);
      expect(result.valid).toBe(true);
    });
  });

  describe('fileExists', () => {
    it('should return false for unknown dataset type', () => {
      expect(service.fileExists('unknown_type')).toBe(false);
    });
  });
});
