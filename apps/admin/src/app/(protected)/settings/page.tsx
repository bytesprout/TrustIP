'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCurrentUser, useTenants, useUpdateTenant } from '@/hooks/use-admin-data';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';

export default function SettingsPage(): JSX.Element {
  const me = useCurrentUser();
  const tenants = useTenants();
  const updateTenant = useUpdateTenant();

  const defaultTenantId = useMemo(() => {
    if (me.data?.tenantId) {
      return me.data.tenantId;
    }
    return tenants.data?.[0]?.id ?? '';
  }, [me.data?.tenantId, tenants.data]);

  const selectedTenant = tenants.data?.find((item) => item.id === defaultTenantId);

  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [quotaEnabled, setQuotaEnabled] = useState(true);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [monthlyRequestLimit, setMonthlyRequestLimit] = useState(100000);
  const [analyticsRetentionDays, setAnalyticsRetentionDays] = useState(90);

  useEffect(() => {
    if (!selectedTenant) {
      return;
    }

    setAnalyticsEnabled(selectedTenant.analyticsEnabled);
    setQuotaEnabled(selectedTenant.quotaEnabled);
    setRateLimitEnabled(selectedTenant.rateLimitEnabled);
    setMonthlyRequestLimit(selectedTenant.monthlyRequestLimit ?? 100000);
    setAnalyticsRetentionDays(selectedTenant.analyticsRetentionDays ?? 90);
  }, [selectedTenant]);

  if (me.isLoading || tenants.isLoading) {
    return <LoadingState message="Loading settings..." />;
  }

  if (me.error || !me.data) {
    return <ErrorState message="Unable to load user profile." />;
  }

  if (!defaultTenantId || !selectedTenant) {
    return <ErrorState message="No tenant selected for settings." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Account and tenant runtime controls.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Current Account</h2>
          <p className="mt-2 text-sm text-muted-foreground">Email: {me.data.email}</p>
          <p className="text-sm text-muted-foreground">Role: {me.data.role}</p>
          <p className="text-sm text-muted-foreground">Tenant: {me.data.tenantId ?? 'N/A'}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Tenant Controls</h2>
          <div className="mt-3 space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={analyticsEnabled} onChange={(e) => setAnalyticsEnabled(e.target.checked)} />
              Analytics enabled
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={quotaEnabled} onChange={(e) => setQuotaEnabled(e.target.checked)} />
              Quota enabled
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={rateLimitEnabled} onChange={(e) => setRateLimitEnabled(e.target.checked)} />
              Rate limit enabled
            </label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              type="number"
              min={1}
              value={monthlyRequestLimit}
              onChange={(e) => setMonthlyRequestLimit(Number(e.target.value))}
              placeholder="Monthly request limit"
            />
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              type="number"
              min={30}
              value={analyticsRetentionDays}
              onChange={(e) => setAnalyticsRetentionDays(Number(e.target.value))}
              placeholder="Analytics retention days"
            />
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground"
              disabled={updateTenant.isPending}
              onClick={() => {
                updateTenant.mutate({
                  tenantId: defaultTenantId,
                  payload: {
                    analyticsEnabled,
                    quotaEnabled,
                    rateLimitEnabled,
                    monthlyRequestLimit,
                    analyticsRetentionDays,
                  },
                });
              }}
            >
              {updateTenant.isPending ? 'Saving...' : 'Save tenant settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
