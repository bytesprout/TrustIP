import { DownloaderService } from './downloader.service';
import { ChecksumService } from './checksum.service';

describe('DownloaderService', () => {
  let service: DownloaderService;
  const checksumService = new ChecksumService();

  beforeEach(() => {
    service = new DownloaderService(checksumService);
  });

  describe('validateUrl (via download)', () => {
    it('should reject non-HTTPS URLs', async () => {
      await expect(service.download('http://example.com/file.txt', '/tmp/test')).rejects.toThrow(
        'Only HTTPS downloads allowed',
      );
    });

    it('should reject non-allowlisted domains', async () => {
      await expect(service.download('https://evil.com/malware.db', '/tmp/test')).rejects.toThrow(
        'not allowlisted',
      );
    });

    it('should reject invalid URLs', async () => {
      await expect(service.download('not-a-url', '/tmp/test')).rejects.toThrow('Invalid download URL');
    });
  });
});
