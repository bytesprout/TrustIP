import { Injectable, Logger } from '@nestjs/common';
import { promises as dns } from 'dns';

const RDNS_TIMEOUT_MS = 1000;

@Injectable()
export class RdnsService {
  private readonly logger = new Logger(RdnsService.name);

  async lookup(ip: string): Promise<string | null> {
    try {
      const result = await Promise.race([
        dns.reverse(ip),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), RDNS_TIMEOUT_MS)),
      ]);

      if (!result || !Array.isArray(result) || result.length === 0) {
        return null;
      }

      return result[0] ?? null;
    } catch {
      // Graceful failure — DNS errors are expected (NXDOMAIN, ENOTFOUND, timeout)
      return null;
    }
  }
}
