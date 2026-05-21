export function EmptyState({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
