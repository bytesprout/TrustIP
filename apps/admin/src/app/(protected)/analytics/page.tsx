'use client';

import { RequestTrendChart } from '@/components/charts/request-trend-chart';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { useSystemStats } from '@/hooks/use-admin-data';

export default function AnalyticsPage(): JSX.Element {
  const stats = useSystemStats();

  if (stats.isLoading) {
    return <LoadingState message="Loading analytics..." />;
  }

  if (stats.error || !stats.data) {
    return <ErrorState message="Unable to load analytics." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Live usage and request activity trend.</p>
      </div>
      <RequestTrendChart
        users={stats.data.users}
        tenants={stats.data.tenants}
        activeApiKeys={stats.data.activeApiKeys}
      />
    </div>
  );
}
