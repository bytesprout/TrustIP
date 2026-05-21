import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-muted/40">
        <div className="flex h-14 items-center border-b px-6">
          <span className="font-semibold">TrustIP</span>
        </div>
        <nav className="space-y-1 p-4">
          <a
            href="/dashboard"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Dashboard
          </a>
          <a
            href="/settings"
            className="flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Settings
          </a>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
