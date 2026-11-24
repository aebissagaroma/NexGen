// Everything inside this group requires a staff session — the redirect here is
// the page-level gate (API routes carry their own via requireAdmin).
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/session';
import { Nav, LogoutButton } from './nav';

export const dynamic = 'force-dynamic'; // session cookie read on every request

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = getAdminSession();
  if (!session) redirect('/login');

  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-in">
          <div>
            <span className="marker">ELECTROCUP 26 · STAFF PANEL</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {session.email} <span className="pill gold" style={{ marginLeft: 6 }}>{session.role.toUpperCase()}</span>
            </span>
            <LogoutButton />
          </div>
        </div>
      </div>
      <Nav />
      <main className="wrap page">{children}</main>
    </>
  );
}
