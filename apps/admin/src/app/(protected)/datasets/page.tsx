'use client';

import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { useDatasetHealth } from '@/hooks/use-admin-data';

export default function DatasetsPage(): JSX.Element {
  const datasetHealth = useDatasetHealth();

  if (datasetHealth.isLoading) {
    return <LoadingState message="Loading dataset health..." />;
  }

  if (datasetHealth.error || !datasetHealth.data) {
    return <ErrorState message="Unable to load dataset health." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Datasets</h1>
        <p className="text-muted-foreground">Freshness and ingestion health for core data feeds.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <p className="font-medium">Status: {datasetHealth.data.status}</p>
        <p className="text-sm text-muted-foreground">Latency: {datasetHealth.data.latencyMs}ms</p>
        <p className="text-sm text-muted-foreground">
          Message: {datasetHealth.data.message ?? 'No details provided'}
        </p>
      </div>
    </div>
  );
}
