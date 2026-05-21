import { cookies } from 'next/headers';

export interface Session {
  accessToken: string;
  userId: string;
}

export async function getServerSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) return null;

  return { accessToken: token, userId: '' };
}
