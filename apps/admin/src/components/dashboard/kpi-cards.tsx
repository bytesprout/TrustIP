import { formatNumber } from '@/lib/format';

interface KpiCardsProps {
  users: number;
  tenants: number;
  activeApiKeys: number;
}

export function KpiCards({ users, tenants, activeApiKeys }: KpiCardsProps): JSX.Element {
  const cards = [
    { label: 'Users', value: users },
    { label: 'Tenants', value: tenants },
    { label: 'Active API Keys', value: activeApiKeys },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</div>
          <div className="mt-2 text-2xl font-semibold">{formatNumber(card.value)}</div>
        </div>
      ))}
    </div>
  );
}
