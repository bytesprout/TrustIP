export function LoadingState({ message = 'Loading...' }: { message?: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
      {message}
    </div>
  );
}
