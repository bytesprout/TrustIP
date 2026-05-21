'use client';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { useDatasetHealth } from '@/hooks/use-admin-data';
import { formatDate } from '@/lib/format';

export default function DatasetsPage(): JSX.Element {
  const datasetHealth = useDatasetHealth();

  if (datasetHealth.isLoading) {
    return <LoadingState message="Loading dataset health..." />;
  }

  if (datasetHealth.error || !datasetHealth.data) {
    return <ErrorState message="Unable to load dataset health." />;
  }

  if (!datasetHealth.data.datasets.length) {
    return <EmptyState message="No dataset metadata returned." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Datasets</h1>
        <p className="text-muted-foreground">Freshness and ingestion health for core data feeds.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {datasetHealth.data.datasets.map((dataset) => (
          <div key={dataset.key} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="font-medium">{dataset.key}</p>
            <p className="text-sm text-muted-foreground">Source: {dataset.source}</p>
            <p className="text-sm text-muted-foreground">Stale: {dataset.stale ? 'Yes' : 'No'}</p>
            <p className="text-sm text-muted-foreground">
              Last update: {dataset.lastUpdatedAt ? formatDate(dataset.lastUpdatedAt) : 'N/A'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
