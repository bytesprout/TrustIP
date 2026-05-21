export default function TrustPage(): JSX.Element {
  const signals = [
    { name: 'VPN Detection', status: 'Enabled', confidence: '0.98' },
    { name: 'Proxy Detection', status: 'Enabled', confidence: '0.96' },
    { name: 'TOR Detection', status: 'Enabled', confidence: '0.99' },
    { name: 'Hosting Detection', status: 'Enabled', confidence: '0.94' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trust Engine</h1>
        <p className="text-muted-foreground">Deterministic scoring signals and confidence weights.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {signals.map((signal) => (
          <div key={signal.name} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="font-medium">{signal.name}</p>
            <p className="text-sm text-muted-foreground">Status: {signal.status}</p>
            <p className="text-sm text-muted-foreground">Confidence: {signal.confidence}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
