'use client';

import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import {
  useCreateTenantApiKey,
  useCurrentUser,
  useRevokeTenantApiKey,
  useTenantApiKeys,
  useTenants,
} from '@/hooks/use-admin-data';
import { formatDate } from '@/lib/format';

export default function ApiKeysPage(): JSX.Element {
  const me = useCurrentUser();
  const tenants = useTenants();
  const defaultTenantId = useMemo(() => {
    if (me.data?.tenantId) {
      return me.data.tenantId;
    }
    return tenants.data?.[0]?.id;
  }, [me.data?.tenantId, tenants.data]);

  const [tenantId, setTenantId] = useState<string>('');
  const [name, setName] = useState('default-key');
  const [latestPlainKey, setLatestPlainKey] = useState('');
  const selectedTenantId = tenantId || defaultTenantId;

  const keysQuery = useTenantApiKeys(selectedTenantId);
  const createKey = useCreateTenantApiKey(selectedTenantId ?? '');
  const revokeKey = useRevokeTenantApiKey(selectedTenantId ?? '');

  if (me.isLoading || tenants.isLoading) {
    return <LoadingState message="Loading API keys..." />;
  }

  if (!selectedTenantId) {
    return <ErrorState message="No tenant selected for API key operations." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
        <p className="text-muted-foreground">Create and revoke tenant API keys.</p>
      </div>

      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-3">
        <select
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedTenantId}
          onChange={(event) => {
            setTenantId(event.target.value);
          }}
        >
          {(tenants.data ?? []).map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>

        <input
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          placeholder="API key name"
        />

        <button
          type="button"
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          onClick={() => {
            createKey.mutate(
              {
                name,
                scopes: ['basic_lookup'],
              },
              {
                onSuccess: (result) => {
                  setLatestPlainKey(result.plainKey);
                },
              },
            );
          }}
        >
          Create key
        </button>
      </div>

      {latestPlainKey ? (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
          <p className="text-sm font-semibold">New API key (shown once)</p>
          <p className="mt-2 break-all rounded border border-emerald-200 bg-white px-3 py-2 font-mono text-xs">
            {latestPlainKey}
          </p>
          <button
            type="button"
            className="mt-2 rounded-md border border-emerald-400 px-3 py-2 text-sm"
            onClick={async () => {
              await navigator.clipboard.writeText(latestPlainKey);
            }}
          >
            Copy key
          </button>
        </div>
      ) : null}

      {keysQuery.isLoading ? <LoadingState message="Loading key inventory..." /> : null}
      {keysQuery.error ? <ErrorState message="Unable to load keys." /> : null}

      {!keysQuery.data?.length ? (
        <EmptyState message="No API keys available." />
      ) : (
        <div className="space-y-3">
          {keysQuery.data.map((key) => (
            <div key={key.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="text-xs text-muted-foreground">
                  {key.keyPrefix}... · created {formatDate(key.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive"
                onClick={() => {
                  revokeKey.mutate(key.id);
                }}
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
