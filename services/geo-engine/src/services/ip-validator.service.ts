import { Injectable } from '@nestjs/common';
import * as net from 'net';
import { IP_VERSION } from '../constants/geo.constants';
import type { IpVersion } from '../constants/geo.constants';

// Private/reserved IP ranges
const PRIVATE_IPV4_RANGES: Array<{ start: number; end: number }> = [
  { start: ip4ToLong('10.0.0.0'), end: ip4ToLong('10.255.255.255') },
  { start: ip4ToLong('172.16.0.0'), end: ip4ToLong('172.31.255.255') },
  { start: ip4ToLong('192.168.0.0'), end: ip4ToLong('192.168.255.255') },
  { start: ip4ToLong('127.0.0.0'), end: ip4ToLong('127.255.255.255') },
  { start: ip4ToLong('169.254.0.0'), end: ip4ToLong('169.254.255.255') },
  { start: ip4ToLong('100.64.0.0'), end: ip4ToLong('100.127.255.255') },
  { start: ip4ToLong('0.0.0.0'), end: ip4ToLong('0.255.255.255') },
  { start: ip4ToLong('240.0.0.0'), end: ip4ToLong('255.255.255.255') },
];

function ip4ToLong(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

@Injectable()
export class IpValidatorService {
  // --------------------------------------------------------
  // Validate IP from string
  // --------------------------------------------------------
  isValid(ip: string): boolean {
    return net.isIPv4(ip) || net.isIPv6(ip);
  }

  isPublicRoutable(ip: string): boolean {
    if (!this.isValid(ip)) return false;
    if (net.isIPv4(ip)) return this.isPublicIPv4(ip);
    return this.isPublicIPv6(ip);
  }

  getVersion(ip: string): IpVersion {
    return net.isIPv6(ip) ? IP_VERSION.V6 : IP_VERSION.V4;
  }

  // --------------------------------------------------------
  // Extract caller IP from request headers
  // Priority: cf-connecting-ip → x-forwarded-for → x-real-ip → remoteAddress
  // --------------------------------------------------------
  extractFromHeaders(headers: Record<string, string | string[] | undefined>, remoteAddress?: string): string | null {
    // 1. Cloudflare
    const cfIp = this.firstHeader(headers['cf-connecting-ip']);
    if (cfIp && this.isPublicRoutable(cfIp)) return cfIp;

    // 2. X-Forwarded-For (take the first/leftmost — the original client)
    const xff = this.firstHeader(headers['x-forwarded-for']);
    if (xff) {
      const firstIp = xff.split(',')[0]?.trim() ?? '';
      if (this.isPublicRoutable(firstIp)) return firstIp;
    }

    // 3. X-Real-IP
    const xRealIp = this.firstHeader(headers['x-real-ip']);
    if (xRealIp && this.isPublicRoutable(xRealIp)) return xRealIp;

    // 4. Socket remote address (strip IPv6 prefix ::ffff:)
    if (remoteAddress) {
      const cleaned = remoteAddress.replace(/^::ffff:/, '');
      if (this.isPublicRoutable(cleaned)) return cleaned;
    }

    return null;
  }

  // --------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------
  private firstHeader(value: string | string[] | undefined): string | null {
    if (!value) return null;
    return Array.isArray(value) ? (value[0] ?? null) : value;
  }

  private isPublicIPv4(ip: string): boolean {
    const long = ip4ToLong(ip);
    return !PRIVATE_IPV4_RANGES.some((r) => long >= r.start && long <= r.end);
  }

  private isPublicIPv6(ip: string): boolean {
    const lower = ip.toLowerCase();
    if (lower === '::1') return false; // loopback
    if (lower.startsWith('fe80:')) return false; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return false; // unique-local
    return true;
  }
}
