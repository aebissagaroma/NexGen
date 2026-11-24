// Appeals — disqualification-block appeals from the register form. These are
// people the duplicate guards stopped; some are honest mistakes and each one
// needs a human decision.
import { query } from '@/lib/db';
import { HandledToggle } from '../controls';

export const dynamic = 'force-dynamic';

export default async function Appeals() {
  const rows = await query<{ id: string; email: string; full_name: string; reason: string; handled: boolean; created_at: string }>(
    `SELECT id, email, full_name, reason, handled, created_at
     FROM appeals ORDER BY handled ASC, created_at DESC LIMIT 300`,
  );
  const open = rows.filter((r) => !r.handled).length;

  return (
    <>
      <h1 className="page-title">Appeals {open > 0 && <span className="pill err" style={{ verticalAlign: 'middle', marginLeft: 8 }}>{open} OPEN</span>}</h1>
      <div className="tblwrap">
        <table className="data">
          <thead><tr><th>Name</th><th>Email</th><th>Reason</th><th>When</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ opacity: r.handled ? 0.55 : 1 }}>
                <td style={{ color: 'var(--ink)' }}>{r.full_name}</td>
                <td className="mono" style={{ fontSize: 12 }}>{r.email}</td>
                <td style={{ maxWidth: 480, lineHeight: 1.5 }}>{r.reason}</td>
                <td className="mono" style={{ whiteSpace: 'nowrap', color: 'var(--ink-4)', fontSize: 12 }}>{new Date(r.created_at).toLocaleString()}</td>
                <td><HandledToggle endpoint="/api/appeals" id={r.id} handled={r.handled} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="mono" style={{ color: 'var(--ink-4)' }}>No appeals.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '.06em' }}>
        Decisions are communicated by replying to the appellant&apos;s email — marking handled here only tracks the queue.
      </p>
    </>
  );
}
