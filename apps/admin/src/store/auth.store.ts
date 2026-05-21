import { create } from 'zustand';
import { loginRequest, meRequest, type AuthUser } from '@/lib/api-client';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,

  login: async (email: string, password: string): Promise<void> => {
    const tokens = await loginRequest(email, password);
    const user = await meRequest(tokens.accessToken);
    set({ accessToken: tokens.accessToken, user, isAuthenticated: true });

    // Store token in cookie for SSR
    document.cookie = `access_token=${tokens.accessToken}; path=/; max-age=${tokens.expiresIn}; SameSite=Strict`;

    window.location.href = '/dashboard';
  },

  logout: (): void => {
    set({ accessToken: null, user: null, isAuthenticated: false });
    document.cookie = 'access_token=; path=/; max-age=0';
    window.location.href = '/login';
  },
}));
