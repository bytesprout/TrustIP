'use client';

import { useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { useAuditLogs } from '@/hooks/use-admin-data';
import { formatDate } from '@/lib/format';

export default function AuditLogsPage(): JSX.Element {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const logs = useAuditLogs(page, 20, action || undefined);

  if (logs.isLoading) {
    return <LoadingState message="Loading audit logs..." />;
  }

  if (logs.error || !logs.data) {
    return <ErrorState message="Unable to load audit logs." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">Immutable events across tenant and admin actions.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
          }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Filter action"
        />
        <button
          type="button"
          className="rounded-md border border-border px-3 py-2 text-sm"
          onClick={() => {
            setPage(1);
          }}
        >
          Apply
        </button>
      </div>

      {!logs.data.items.length ? (
        <EmptyState message="No audit logs matched this filter." />
      ) : (
        <div className="space-y-3">
          {logs.data.items.map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="font-medium">{item.action}</p>
              <p className="text-xs text-muted-foreground">{item.user?.email ?? 'system'} · {formatDate(item.createdAt)}</p>
              <p className="mt-2 text-xs text-muted-foreground">Tenant: {item.tenantId}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={page <= 1}
          className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
          onClick={() => {
            setPage((previous) => Math.max(1, previous - 1));
          }}
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {logs.data.page} of {logs.data.totalPages}
        </span>
        <button
          type="button"
          disabled={logs.data.page >= logs.data.totalPages}
          className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-50"
          onClick={() => {
            setPage((previous) => previous + 1);
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
