import { create } from 'zustand';
import { loginRequest } from '@/lib/api-client';

interface AuthState {
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isAuthenticated: false,

  login: async (email: string, password: string): Promise<void> => {
    const tokens = await loginRequest(email, password);
    set({ accessToken: tokens.accessToken, isAuthenticated: true });

    // Store token in cookie for SSR
    document.cookie = `access_token=${tokens.accessToken}; path=/; max-age=${tokens.expiresIn}; SameSite=Strict`;

    window.location.href = '/dashboard';
  },

  logout: (): void => {
    set({ accessToken: null, isAuthenticated: false });
    document.cookie = 'access_token=; path=/; max-age=0';
    window.location.href = '/login';
  },
}));
