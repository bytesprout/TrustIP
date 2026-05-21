'use client';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { useFeatureFlags } from '@/hooks/use-admin-data';

export default function FeatureFlagsPage(): JSX.Element {
  const featureFlags = useFeatureFlags();

  if (featureFlags.isLoading) {
    return <LoadingState message="Loading feature flags..." />;
  }

  if (featureFlags.error) {
    return <ErrorState message="Unable to load feature flags." />;
  }

  if (!featureFlags.data?.length) {
    return <EmptyState message="No feature flags available." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Feature Flags</h1>
        <p className="text-muted-foreground">Runtime feature controls scoped per tenant.</p>
      </div>

      <div className="grid gap-3">
        {featureFlags.data.map((flag) => (
          <div key={flag.key} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="font-medium">{flag.key}</p>
            <p className="text-sm text-muted-foreground">Value: {flag.value ? 'Enabled' : 'Disabled'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
