import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';
import { SideNav } from '@/components/layout/side-nav';
import { TopBar } from '@/components/layout/top-bar';

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
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top,hsl(var(--muted))_0%,hsl(var(--background))_35%)]">
      <aside className="hidden w-72 border-r border-border bg-card/70 backdrop-blur lg:block">
        <div className="flex h-14 items-center border-b border-border px-6">
          <span className="font-semibold tracking-tight">TrustIP</span>
        </div>
        <SideNav role={session.role} />
      </aside>
      <main className="flex-1 overflow-auto">
        <TopBar email={session.email} />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
