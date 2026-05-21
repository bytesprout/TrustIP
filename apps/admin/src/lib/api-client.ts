const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface ApiClientOptions {
  token?: string;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(prefix));

  return cookie ? cookie.slice(prefix.length) : null;
}

export async function apiClient<T>(
  path: string,
  options: RequestInit & ApiClientOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const resolvedToken = token ?? getCookie('access_token') ?? undefined;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  const data = (await response.json()) as { success: boolean; data?: T; error?: { message: string } };

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message ?? `Request failed: ${response.statusText}`);
  }

  return data.data as T;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_MANAGER' | 'VIEWER';
  tenantId: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  return apiClient('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function meRequest(token?: string): Promise<AuthUser> {
  return apiClient<AuthUser>('/api/v1/auth/me', { token, method: 'GET' });
}
