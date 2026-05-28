'use client';

import { useState } from 'react';
import { useCreateTenant } from '@/hooks/use-admin-data';

export function CreateTenantForm(): JSX.Element {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const createTenant = useCreateTenant();

  return (
    <form
      className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        createTenant.mutate({ name, companyName: companyName || undefined });
        setName('');
        setCompanyName('');
      }}
    >
      <input
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder="Tenant name"
      />
      <input
        value={companyName}
        onChange={(event) => {
          setCompanyName(event.target.value);
        }}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder="Company name (optional)"
      />
      <button
        type="submit"
        disabled={createTenant.isPending || !name}
        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {createTenant.isPending ? 'Creating...' : 'Create Tenant'}
      </button>
    </form>
  );
}
