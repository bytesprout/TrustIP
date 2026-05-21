'use client';

import { CreateTenantForm } from '@/components/forms/create-tenant-form';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import { DataTable } from '@/components/tables/data-table';
import { useCurrentUser, useTenants } from '@/hooks/use-admin-data';

export default function TenantsPage(): JSX.Element {
  const me = useCurrentUser();
  const tenants = useTenants();

  if (me.isLoading || tenants.isLoading) {
    return <LoadingState message="Loading tenants..." />;
  }

  if (me.data?.role !== 'SUPER_ADMIN') {
    return <ErrorState message="Only SUPER_ADMIN can view tenant management." />;
  }

  if (tenants.error) {
    return <ErrorState message="Unable to load tenants." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
        <p className="text-muted-foreground">Create and monitor tenant accounts.</p>
      </div>

      <CreateTenantForm />

      {!tenants.data?.length ? (
        <EmptyState message="No tenants found." />
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'slug', label: 'Slug' },
            { key: 'status', label: 'Status' },
            { key: 'planType', label: 'Plan' },
          ]}
          rows={tenants.data}
          rowKey={(row) => row.id}
        />
      )}
    </div>
  );
}
