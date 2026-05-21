import { cookies } from 'next/headers';
import { decodeJwtClaims, type Role } from '@/lib/auth';

export interface Session {
  accessToken: string;
  userId: string;
  role: Role;
  tenantId: string | null;
  email: string;
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) return null;

  const claims = decodeJwtClaims(token);
  if (!claims) {
    return null;
  }

  return {
    accessToken: token,
    userId: claims.sub,
    role: claims.role,
    tenantId: claims.tenantId,
    email: claims.email,
  };
}
