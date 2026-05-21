'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface RequestTrendChartProps {
  tenants: number;
  users: number;
  activeApiKeys: number;
}

export function RequestTrendChart({ tenants, users, activeApiKeys }: RequestTrendChartProps): JSX.Element {
  const data = [
    { name: 'Mon', requests: tenants * 120 },
    { name: 'Tue', requests: tenants * 140 },
    { name: 'Wed', requests: users * 12 },
    { name: 'Thu', requests: users * 15 },
    { name: 'Fri', requests: activeApiKeys * 280 },
    { name: 'Sat', requests: activeApiKeys * 220 },
    { name: 'Sun', requests: activeApiKeys * 260 },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold">Request Trend (estimated)</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip />
            <Line type="monotone" dataKey="requests" stroke="hsl(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
