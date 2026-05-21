const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

export interface ApiClientOptions {
  token?: string;
}

export async function apiClient<T>(
  path: string,
  options: RequestInit & ApiClientOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json() as { success: boolean; data?: T; error?: { message: string } };

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message ?? `Request failed: ${response.statusText}`);
  }

  return data.data as T;
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
