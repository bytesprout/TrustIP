export type Role = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_MANAGER' | 'VIEWER';

export interface JwtClaims {
  sub: string;
  email: string;
  role: Role;
  tenantId: string | null;
  iat?: number;
  exp?: number;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  if (typeof atob === 'function') {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(padded), (char: string) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
  }

  return Buffer.from(padded, 'base64').toString('utf8');
}

export function decodeJwtClaims(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = decodeBase64Url(parts[1]);
    return JSON.parse(payload) as JwtClaims;
  } catch {
    return null;
  }
}

export function isEnterpriseMode(): boolean {
  return process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'enterprise';
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  if (pathname.startsWith('/tenants')) {
    return role === 'SUPER_ADMIN';
  }

  if (pathname.startsWith('/billing') || pathname.startsWith('/api-keys')) {
    return role !== 'VIEWER';
  }

  if (pathname.startsWith('/settings')) {
    return role !== 'VIEWER';
  }

  return true;
}
