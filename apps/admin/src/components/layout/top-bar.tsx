'use client';

import { useAuthStore } from '@/store/auth.store';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export function TopBar({ email }: { email: string }): JSX.Element {
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">TrustIP Control Plane</p>
        <p className="text-sm font-semibold">{email}</p>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={logout}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
