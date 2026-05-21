export default function ForgotPasswordPage(): JSX.Element {
  return (
    <div className="mx-auto mt-24 max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Forgot Password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Password reset flow can be connected to email provider in a later security phase.
      </p>
    </div>
  );
}
