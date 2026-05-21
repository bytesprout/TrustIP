'use client';

import { useCurrentUser } from '@/hooks/use-admin-data';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';

export default function SettingsPage(): JSX.Element {
  const me = useCurrentUser();

  if (me.isLoading) {
    return <LoadingState message="Loading settings..." />;
  }

  if (me.error || !me.data) {
    return <ErrorState message="Unable to load user profile." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Account and platform controls.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Current Account</h2>
          <p className="mt-2 text-sm text-muted-foreground">Email: {me.data.email}</p>
          <p className="text-sm text-muted-foreground">Role: {me.data.role}</p>
          <p className="text-sm text-muted-foreground">Tenant: {me.data.tenantId ?? 'N/A'}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Security</h2>
          <p className="mt-2 text-sm text-muted-foreground">JWT session is managed by secure cookies.</p>
          <p className="text-sm text-muted-foreground">Enable SSO and MFA policies in security phases.</p>
        </div>
      </div>
    </div>
  );
}
