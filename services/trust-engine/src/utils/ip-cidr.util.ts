import * as net from 'net';

function ipv4ToBigInt(ip: string): bigint {
  return ip.split('.').reduce((acc, part) => (acc << 8n) + BigInt(parseInt(part, 10)), 0n);
}

function expandIpv6(ip: string): string[] {
  const normalized = ip.toLowerCase();
  const hasIpv4 = normalized.includes('.');

  let ipv6Part = normalized;
  let ipv4Tail = '';
  if (hasIpv4) {
    const lastColon = normalized.lastIndexOf(':');
    ipv6Part = normalized.slice(0, lastColon);
    ipv4Tail = normalized.slice(lastColon + 1);
  }

  const [leftRaw, rightRaw] = ipv6Part.split('::');
  const left = leftRaw ? leftRaw.split(':').filter(Boolean) : [];
  const right = rightRaw ? rightRaw.split(':').filter(Boolean) : [];

  const ipv4Hextets = ipv4Tail
    ? (() => {
        const asBigInt = ipv4ToBigInt(ipv4Tail);
        return [
          ((asBigInt >> 16n) & 0xffffn).toString(16),
          (asBigInt & 0xffffn).toString(16),
        ];
      })()
    : [];

  const missing = 8 - (left.length + right.length + ipv4Hextets.length);
  const middle = Array.from({ length: Math.max(0, missing) }, () => '0');
  return [...left, ...middle, ...right, ...ipv4Hextets].slice(0, 8);
}

function ipv6ToBigInt(ip: string): bigint {
  const hextets = expandIpv6(ip);
  return hextets.reduce((acc, hex) => (acc << 16n) + BigInt(parseInt(hex || '0', 16)), 0n);
}

export function isIpInCidr(ip: string, cidr: string): boolean {
  const [base, prefixRaw] = cidr.split('/');
  const prefix = Number(prefixRaw);

  if (!base || !Number.isInteger(prefix)) {
    return false;
  }

  const ipVersion = net.isIP(ip);
  const baseVersion = net.isIP(base);
  if (ipVersion === 0 || baseVersion === 0 || ipVersion !== baseVersion) {
    return false;
  }

  if (ipVersion === 4) {
    if (prefix < 0 || prefix > 32) return false;
    const ipInt = ipv4ToBigInt(ip);
    const baseInt = ipv4ToBigInt(base);
    const hostBits = BigInt(32 - prefix);
    const mask = prefix === 0 ? 0n : ((1n << 32n) - 1n) ^ ((1n << hostBits) - 1n);
    return (ipInt & mask) === (baseInt & mask);
  }

  if (prefix < 0 || prefix > 128) return false;
  const ipInt = ipv6ToBigInt(ip);
  const baseInt = ipv6ToBigInt(base);
  const hostBits = BigInt(128 - prefix);
  const mask = prefix === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << hostBits) - 1n);
  return (ipInt & mask) === (baseInt & mask);
}
