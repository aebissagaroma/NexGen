// Registrations — search, filter, inline payment/status editing, CSV export.
import Link from 'next/link';
import { query } from '@/lib/db';
import { InlineSelect } from '../controls';

export const dynamic = 'force-dynamic';

export default async function Registrations({ searchParams }: { searchParams: { q?: string; club?: string; minors?: string } }) {
  const q = (searchParams.q || '').trim();
  const club = (searchParams.club || '').trim().toUpperCase();
  const minorsOnly = searchParams.minors === '1'; // linked from the guardian-consent tile

  const where: string[] = [];
  const args: unknown[] = [];
  if (q) {
    args.push(`%${q}%`);
    where.push(`(r.full_name ILIKE $${args.length} OR r.gamertag ILIKE $${args.length} OR r.email ILIKE $${args.length} OR r.phone ILIKE $${args.length})`);
  }
  if (club) {
    args.push(club);
    where.push(`r.club_code = $${args.length}`);
  }
  if (minorsOnly) {
    where.push(`(r.date_of_birth IS NOT NULL AND r.date_of_birth > (now() - interval '18 years')::date)`);
  }

  const rows = await query<{
    id: string; full_name: string; email: string; phone: string | null; gamertag: string | null;
    club_code: string; city: string | null; minor: boolean;
    payment_status: string; status: string; created_at: string;
  }>(
    `SELECT r.id, r.full_name, r.email, r.phone, r.gamertag, r.club_code, r.city,
            (r.date_of_birth IS NOT NULL AND r.date_of_birth > (now() - interval '18 years')::date) AS minor,
            r.payment_status, r.status, r.created_at
     FROM registrations r
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY r.created_at DESC LIMIT 500`,
    args,
  );
  const clubs = await query<{ code: string; name: string }>(`SELECT code, name FROM clubs ORDER BY sort`);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>Registrations</h1>
        <a className="btn" style={{ padding: '9px 16px' }} href="/api/export/registrations">EXPORT CSV ↓</a>
      </div>

      <form method="get" style={{ display: 'flex', gap: 10, margin: '18px 0', flexWrap: 'wrap' }}>
        <input className="field" name="q" defaultValue={q} placeholder="Search name, gamertag, email, phone…" style={{ width: 300 }} />
        <select className="field" name="club" defaultValue={club}>
          <option value="">All clubs</option>
          {clubs.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <button className="btn-ghost">FILTER</button>
        {minorsOnly && <span className="pill err" style={{ alignSelf: 'center' }}>16–17 ONLY</span>}
        {(q || club || minorsOnly) && <Link href="/registrations" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center' }}>CLEAR</Link>}
        <span className="mono" style={{ alignSelf: 'center', color: 'var(--ink-4)', fontSize: 11 }}>{rows.length} shown</span>
      </form>

      <div className="tblwrap">
        <table className="data">
          <thead><tr><th>Name</th><th>Gamertag</th><th>Club</th><th>Email</th><th>Phone</th><th>Age</th><th>Payment</th><th>Status</th><th>When</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ color: 'var(--ink)' }}>{r.full_name}</td>
                <td className="mono">{r.gamertag || '—'}</td>
                <td className="mono" style={{ color: 'var(--ink-3)' }}>{r.club_code}</td>
                <td className="mono" style={{ fontSize: 12 }}>{r.email}</td>
                <td className="mono" style={{ fontSize: 12 }}>{r.phone || '—'}</td>
                <td>{r.minor ? <span className="pill err">16–17</span> : <span className="pill">18+</span>}</td>
                <td><InlineSelect endpoint="/api/registrations" id={r.id} field="paymentStatus" value={r.payment_status} options={['unpaid', 'paid', 'waived']} /></td>
                <td><InlineSelect endpoint="/api/registrations" id={r.id} field="status" value={r.status} options={['pending', 'confirmed', 'rejected']} /></td>
                <td className="mono" style={{ whiteSpace: 'nowrap', color: 'var(--ink-4)', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={9} className="mono" style={{ color: 'var(--ink-4)' }}>Nothing matches.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '.06em' }}>
        16–17 requires a guardian consent form before play. Status &quot;confirmed&quot; is what makes an entry eligible for the draw.
      </p>
    </>
  );
}
