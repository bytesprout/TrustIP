import { RdnsService } from './rdns.service';
import * as dns from 'dns';

jest.mock('dns', () => ({
  promises: {
    reverse: jest.fn(),
  },
}));

describe('RdnsService', () => {
  let service: RdnsService;
  const mockDnsReverse = dns.promises.reverse as jest.Mock;

  beforeEach(() => {
    service = new RdnsService();
    jest.clearAllMocks();
  });

  it('should return the first hostname on success', async () => {
    mockDnsReverse.mockResolvedValueOnce(['dns.google']);
    const result = await service.lookup('8.8.8.8');
    expect(result).toBe('dns.google');
  });

  it('should return null when DNS returns empty array', async () => {
    mockDnsReverse.mockResolvedValueOnce([]);
    const result = await service.lookup('8.8.8.8');
    expect(result).toBeNull();
  });

  it('should return null on DNS error (NXDOMAIN)', async () => {
    mockDnsReverse.mockRejectedValueOnce(new Error('ENOTFOUND'));
    const result = await service.lookup('1.2.3.4');
    expect(result).toBeNull();
  });

  it('should return null on timeout (1000ms)', async () => {
    jest.useFakeTimers();
    mockDnsReverse.mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve(['late.host']), 2000)));

    const lookupPromise = service.lookup('8.8.8.8');
    jest.advanceTimersByTime(1100);
    const result = await lookupPromise;
    expect(result).toBeNull();
    jest.useRealTimers();
  });
});
