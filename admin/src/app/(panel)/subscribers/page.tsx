// Notify list — people who asked to be told when phases are announced.
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Subscribers() {
  const rows = await query<{ email: string; created_at: string }>(
    `SELECT email, created_at FROM notify_subscribers ORDER BY created_at DESC LIMIT 1000`,
  );
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Subscribers <span className="mono" style={{ fontSize: 13, color: 'var(--ink-3)' }}>({rows.length})</span></h1>
        <a className="btn" style={{ padding: '9px 16px' }} href="/api/export/subscribers">EXPORT CSV ↓</a>
      </div>
      <div className="tblwrap" style={{ marginTop: 18, maxWidth: 560 }}>
        <table className="data">
          <thead><tr><th>Email</th><th>Subscribed</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontSize: 12 }}>{r.email}</td>
                <td className="mono" style={{ color: 'var(--ink-4)', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={2} className="mono" style={{ color: 'var(--ink-4)' }}>Nobody yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '.06em' }}>
        Announcement sends go through your email provider — export the CSV and use its audience tools, don&apos;t paste addresses into CC.
      </p>
    </>
  );
}
