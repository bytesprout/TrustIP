export default function ResetPasswordPage(): JSX.Element {
  return (
    <div className="mx-auto mt-24 max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Reset Password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Use secure reset tokens and short expiration windows when wiring this flow.
      </p>
    </div>
  );
}
