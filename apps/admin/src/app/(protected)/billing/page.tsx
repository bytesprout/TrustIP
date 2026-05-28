'use client';

import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingState } from '@/components/shared/loading-state';
import {
  useAllPlans,
  useCreatePlan,
  useCurrentUser,
  useInvoices,
  useSubscriptions,
  useTenants,
} from '@/hooks/use-admin-data';
import { formatCurrency, formatDate } from '@/lib/format';

export default function BillingPage(): JSX.Element {
  const me = useCurrentUser();
  const tenants = useTenants();
  const selectedByRole = me.data?.tenantId ?? tenants.data?.[0]?.id;
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const tenantId = selectedTenantId || selectedByRole;

  const subscriptions = useSubscriptions(tenantId);
  const invoices = useInvoices(tenantId);
  const allPlans = useAllPlans(me.data?.role === 'SUPER_ADMIN');
  const createPlan = useCreatePlan();

  const [planName, setPlanName] = useState('Starter');
  const [planSlug, setPlanSlug] = useState('starter');
  const [monthlyPrice, setMonthlyPrice] = useState(29);
  const [annualPrice, setAnnualPrice] = useState(299);
  const [requestLimitMonthly, setRequestLimitMonthly] = useState(100000);
  const [requestsPerMinute, setRequestsPerMinute] = useState(100);

  if (me.isLoading || tenants.isLoading) {
    return <LoadingState message="Loading billing..." />;
  }

  if (!tenantId) {
    return <ErrorState message="Tenant not available for billing view." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">Subscription lifecycle, invoices, and payment status.</p>
      </div>

      <select
        value={tenantId}
        onChange={(event) => {
          setSelectedTenantId(event.target.value);
        }}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        {(tenants.data ?? []).map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>

      {me.data?.role === 'SUPER_ADMIN' ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Plan Management (SUPER_ADMIN)</h2>
          <div className="grid gap-2 rounded-xl border border-border bg-card p-4 shadow-sm md:grid-cols-3">
            <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Plan name" />
            <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" value={planSlug} onChange={(e) => setPlanSlug(e.target.value)} placeholder="plan-slug" />
            <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" value={monthlyPrice} onChange={(e) => setMonthlyPrice(Number(e.target.value))} placeholder="Monthly price" />
            <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" value={annualPrice} onChange={(e) => setAnnualPrice(Number(e.target.value))} placeholder="Annual price" />
            <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" value={requestLimitMonthly} onChange={(e) => setRequestLimitMonthly(Number(e.target.value))} placeholder="Monthly requests" />
            <input className="rounded-md border border-input bg-background px-3 py-2 text-sm" type="number" value={requestsPerMinute} onChange={(e) => setRequestsPerMinute(Number(e.target.value))} placeholder="Requests/minute" />
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
              disabled={createPlan.isPending}
              onClick={() => {
                createPlan.mutate({
                  name: planName,
                  slug: planSlug,
                  monthlyPrice,
                  annualPrice,
                  currency: 'USD',
                  requestLimitMonthly,
                  requestsPerMinute,
                  analyticsRetentionDays: 90,
                  features: {
                    basic_lookup: true,
                    intelligence_lookup: true,
                    trust_lookup: true,
                    analytics: true,
                  },
                });
              }}
            >
              {createPlan.isPending ? 'Creating plan...' : 'Create plan'}
            </button>
          </div>

          <div className="space-y-2">
            {(allPlans.data ?? []).map((plan) => (
              <div key={plan.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <p className="font-medium">{plan.name} ({plan.slug})</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(Number(plan.monthlyPrice), plan.currency)} / month · status: {plan.status}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Subscriptions</h2>
        {subscriptions.isLoading ? <LoadingState /> : null}
        {subscriptions.error ? <ErrorState message="Unable to load subscriptions." /> : null}
        {!subscriptions.data?.length ? (
          <EmptyState message="No subscriptions found." />
        ) : (
          subscriptions.data.map((subscription) => (
            <div key={subscription.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="font-medium">{subscription.plan.name}</p>
              <p className="text-sm text-muted-foreground">Status: {subscription.status}</p>
              <p className="text-sm text-muted-foreground">
                Period end: {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A'}
              </p>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Invoices</h2>
        {invoices.isLoading ? <LoadingState /> : null}
        {invoices.error ? <ErrorState message="Unable to load invoices." /> : null}
        {!invoices.data?.length ? (
          <EmptyState message="No invoices found." />
        ) : (
          invoices.data.map((invoice) => (
            <div key={invoice.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="font-medium">{invoice.invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">{invoice.status}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(Number(invoice.amount), invoice.currency)}</p>
              <p className="text-sm text-muted-foreground">Due: {formatDate(invoice.dueDate)}</p>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
