'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { canAccessRoute, isEnterpriseMode, type Role } from '@/lib/auth';

interface SideNavProps {
  role: Role;
}

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tenants', label: 'Tenants' },
  { href: '/api-keys', label: 'API Keys' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/billing', label: 'Billing' },
  { href: '/trust', label: 'Trust Engine' },
  { href: '/datasets', label: 'Datasets' },
  { href: '/audit-logs', label: 'Audit Logs' },
  { href: '/feature-flags', label: 'Feature Flags' },
  { href: '/settings', label: 'Settings' },
];

export function SideNav({ role }: SideNavProps): JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="space-y-1 p-4">
      {links
        .filter((item) => canAccessRoute(role, item.href))
        .filter((item) => !isEnterpriseMode() || (item.href !== '/tenants' && item.href !== '/billing'))
        .map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}
