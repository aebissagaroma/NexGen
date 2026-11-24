// Overview — the launch-traffic control room. Live numbers straight from the
// database on every request; nothing here is cached or estimated (the same
// rule the public site follows for entry counts). Every tile links to the tab
// where that number can be acted on.
import Link from 'next/link';
import { query, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Overview() {
  const totals = await queryOne<{
    regs: number; last24: number; last1h: number; users: number;
    appeals: number; sponsors: number; subscribers: number; minors: number;
  }>(`SELECT
        (SELECT COUNT(*) FROM registrations)::int AS regs,
        (SELECT COUNT(*) FROM registrations WHERE created_at > now() - interval '24 hours')::int AS last24,
        (SELECT COUNT(*) FROM registrations WHERE created_at > now() - interval '1 hour')::int AS last1h,
        (SELECT COUNT(*) FROM users)::int AS users,
        (SELECT COUNT(*) FROM appeals WHERE NOT handled)::int AS appeals,
        (SELECT COUNT(*) FROM sponsor_inquiries WHERE NOT handled)::int AS sponsors,
        (SELECT COUNT(*) FROM notify_subscribers)::int AS subscribers,
        (SELECT COUNT(*) FROM registrations
          WHERE date_of_birth IS NOT NULL
            AND date_of_birth > (now() - interval '18 years')::date)::int AS minors`);

  const clubs = await query<{ code: string; name: string; grp: string; regs: number; confirmed: number }>(
    `SELECT c.code, c.name, c.grp,
            COUNT(r.id)::int AS regs,
            COUNT(r.id) FILTER (WHERE r.id_status = 'confirmed' AND r.status <> 'rejected')::int AS confirmed
     FROM clubs c LEFT JOIN registrations r ON r.club_code = c.code
     GROUP BY c.code, c.name, c.grp, c.sort ORDER BY c.grp, c.sort`);

  const days = await query<{ day: string; n: number }>(
    `SELECT to_char(created_at::date, 'DD Mon') AS day, COUNT(*)::int AS n
     FROM registrations WHERE created_at > now() - interval '14 days'
     GROUP BY created_at::date ORDER BY created_at::date DESC`);

  const t = totals!;
  const groupA = clubs.filter((c) => c.grp === 'A');
  const groupB = clubs.filter((c) => c.grp === 'B');

  return (
    <>
      <h1 className="page-title">Overview</h1>
      <div className="tiles">
        <Link href="/registrations" className="tile"><div className="k">ENTRIES TOTAL</div><div className="v">{t.regs}</div><div className="s">{t.users} accounts</div></Link>
        <Link href="/registrations" className="tile"><div className="k">LAST 24 HOURS</div><div className="v">{t.last24}</div><div className="s">{t.last1h} in the last hour</div></Link>
        <Link href="/appeals" className="tile"><div className="k">OPEN APPEALS</div><div className="v" style={{ color: t.appeals ? 'var(--err)' : undefined }}>{t.appeals}</div><div className="s">need a decision</div></Link>
        <Link href="/partners" className="tile"><div className="k">PARTNER INQUIRIES</div><div className="v" style={{ color: t.sponsors ? 'var(--accent-glow)' : undefined }}>{t.sponsors}</div><div className="s">unanswered</div></Link>
        <Link href="/registrations?minors=1" className="tile"><div className="k">GUARDIAN CONSENT</div><div className="v">{t.minors}</div><div className="s">entrants aged 16–17</div></Link>
        <Link href="/subscribers" className="tile"><div className="k">NOTIFY LIST</div><div className="v">{t.subscribers}</div><div className="s">subscribers</div></Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {[['GROUP A — TOP TEN (closes at its draw)', groupA] as const, ['GROUP B — STAYS OPEN LONGER', groupB] as const].map(([label, rows]) => (
          <div key={label}>
            <div className="marker" style={{ marginBottom: 8 }}>{label}</div>
            <div className="tblwrap">
              <table className="data">
                <thead><tr><th>Club</th><th>Entries</th><th>Confirmed</th></tr></thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.code}>
                      <td><span className="mono" style={{ color: 'var(--ink-3)', marginRight: 8 }}>{c.code}</span>{c.name}</td>
                      <td className="mono">{c.regs}</td>
                      <td className="mono" style={{ color: c.confirmed ? 'var(--ok)' : 'var(--ink-4)' }}>{c.confirmed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 26, maxWidth: 420 }}>
        <div className="marker" style={{ marginBottom: 8 }}>ENTRIES PER DAY — LAST 14 DAYS</div>
        <div className="tblwrap">
          <table className="data">
            <tbody>
              {days.length === 0 && <tr><td className="mono" style={{ color: 'var(--ink-4)' }}>No entries yet.</td></tr>}
              {days.map((d) => (
                <tr key={d.day}>
                  <td className="mono" style={{ width: 90, color: 'var(--ink-3)' }}>{d.day}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ height: 10, width: Math.min(260, d.n * 6), minWidth: 2, background: 'var(--accent)' }} />
                      <span className="mono" style={{ fontSize: 12 }}>{d.n}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
