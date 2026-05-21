'use client';

import { KpiCards } from '@/components/dashboard/kpi-cards';
import { RequestTrendChart } from '@/components/charts/request-trend-chart';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { useCurrentUser, useSystemStats } from '@/hooks/use-admin-data';

export default function DashboardPage(): JSX.Element {
  const me = useCurrentUser();
  const stats = useSystemStats(me.data?.role === 'SUPER_ADMIN');

  if (me.isLoading || stats.isLoading) {
    return <LoadingState message="Loading dashboard metrics..." />;
  }

  if (me.error || stats.error) {
    return <ErrorState message="Unable to load dashboard data." />;
  }

  const safeStats = stats.data ?? { users: 0, tenants: 0, activeApiKeys: 0, timestamp: new Date().toISOString() };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Operational overview for TrustIP control plane.</p>
      </div>

      <KpiCards
        users={safeStats.users}
        tenants={safeStats.tenants}
        activeApiKeys={safeStats.activeApiKeys}
      />

      <RequestTrendChart
        users={safeStats.users}
        tenants={safeStats.tenants}
        activeApiKeys={safeStats.activeApiKeys}
      />
    </div>
  );
}
