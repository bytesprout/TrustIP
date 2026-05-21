export default function SettingsPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your platform settings</p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Platform Configuration</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Settings will be available in upcoming phases.
        </p>
      </div>
    </div>
  );
}
