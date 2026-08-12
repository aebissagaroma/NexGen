'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const TABS: Array<[href: string, label: string]> = [
  ['/', 'OVERVIEW'],
  ['/registrations', 'REGISTRATIONS'],
  ['/draw', 'DRAW & RESULTS'],
  ['/appeals', 'APPEALS'],
  ['/partners', 'PARTNERS'],
  ['/subscribers', 'SUBSCRIBERS'],
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      <div className="wrap" style={{ display: 'flex', gap: 2 }}>
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} className={path === href || (href !== '/' && path.startsWith(href)) ? 'on' : ''}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      className="btn-ghost"
      style={{ padding: '6px 12px' }}
      onClick={async () => { await fetch('/api/auth/login', { method: 'DELETE' }); router.replace('/login'); router.refresh(); }}
    >
      LOG OUT
    </button>
  );
}
