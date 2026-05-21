export function ErrorState({ message }: { message: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
      {message}
    </div>
  );
}
