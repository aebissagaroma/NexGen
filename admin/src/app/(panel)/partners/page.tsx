// Partner / sponsorship inquiries — the highest-value inbound the site takes.
import { query } from '@/lib/db';
import { HandledToggle } from '../controls';

export const dynamic = 'force-dynamic';

export default async function Partners() {
  const rows = await query<{ id: string; company: string; contact_name: string; email: string; phone: string | null; tier: string | null; message: string | null; handled: boolean; created_at: string }>(
    `SELECT id, company, contact_name, email, phone, tier, message, handled, created_at
     FROM sponsor_inquiries ORDER BY handled ASC, created_at DESC LIMIT 300`,
  );
  const open = rows.filter((r) => !r.handled).length;

  return (
    <>
      <h1 className="page-title">Partner inquiries {open > 0 && <span className="pill gold" style={{ verticalAlign: 'middle', marginLeft: 8 }}>{open} WAITING</span>}</h1>
      <div className="tblwrap">
        <table className="data">
          <thead><tr><th>Company</th><th>Contact</th><th>Tier</th><th>Message</th><th>When</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ opacity: r.handled ? 0.55 : 1 }}>
                <td style={{ color: 'var(--ink)' }}>{r.company}</td>
                <td>
                  {r.contact_name}
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{r.email}{r.phone ? ` · ${r.phone}` : ''}</div>
                </td>
                <td>{r.tier ? <span className="pill gold">{r.tier.toUpperCase()}</span> : '—'}</td>
                <td style={{ maxWidth: 380, lineHeight: 1.5, fontSize: 13 }}>{r.message || '—'}</td>
                <td className="mono" style={{ whiteSpace: 'nowrap', color: 'var(--ink-4)', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td><HandledToggle endpoint="/api/sponsors" id={r.id} handled={r.handled} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="mono" style={{ color: 'var(--ink-4)' }}>No inquiries.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
