export default function DashboardPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          TrustIP Platform Overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">API Requests</div>
          <div className="mt-2 text-2xl font-bold">—</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Active Tenants</div>
          <div className="mt-2 text-2xl font-bold">—</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">Trust Scores</div>
          <div className="mt-2 text-2xl font-bold">—</div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">System Health</div>
          <div className="mt-2 text-2xl font-bold text-green-600">Healthy</div>
        </div>
      </div>
    </div>
  );
}
