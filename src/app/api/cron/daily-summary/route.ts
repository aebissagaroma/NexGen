import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { notifyOps } from '@/lib/mailer';

// GET /api/cron/daily-summary — one roll-up email of the last 24 hours.
//
// Runs on a schedule (see `crons` in vercel.json — "0 6 * * *", i.e. 06:00 UTC
// = 09:00 EAT). That schedule lives there without an explanatory key because
// Vercel rejects any property it does not recognise in vercel.json. Vercel sends
// `Authorization: Bearer $CRON_SECRET` on scheduled invocations, which is the
// only thing distinguishing a real run from anyone hitting the URL — so a
// missing secret refuses rather than defaults to open.
export const dynamic = 'force-dynamic';

const WINDOW = '24 hours';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron] CRON_SECRET is not set — refusing to run the daily summary.');
    return NextResponse.json({ error: 'Not configured.' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const regs = await query<{
    full_name: string; gamertag: string | null; club_code: string;
    email: string; id_last4: string | null; id_doc_status: string;
  }>(
    `SELECT full_name, gamertag, club_code, email, id_last4, id_doc_status
     FROM registrations
     WHERE created_at > now() - interval '${WINDOW}'
     ORDER BY created_at`,
  );

  const appeals = await query<{ full_name: string; email: string }>(
    `SELECT full_name, email FROM appeals
     WHERE created_at > now() - interval '${WINDOW}' ORDER BY created_at`,
  );

  const totals = await queryOne<{ total: number; missing_doc: number }>(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE id_doc_status <> 'provided')::int AS missing_doc
     FROM registrations`,
  );

  // Per-club counts give ops the one number they actually act on: which brackets
  // are filling and which need pushing.
  const byClub = await query<{ club_code: string; n: number }>(
    `SELECT club_code, count(*)::int AS n FROM registrations
     GROUP BY club_code ORDER BY n DESC, club_code`,
  );

  const lines: string[] = [];
  lines.push(`ELECTROCUP 26 — last ${WINDOW}`, '');
  lines.push(`New entries:  ${regs.length}`);
  lines.push(`New appeals:  ${appeals.length}`);
  lines.push(`Total so far: ${totals?.total ?? 0}  (${totals?.missing_doc ?? 0} still without an ID photo)`, '');

  if (regs.length) {
    lines.push('── New entries ──');
    for (const r of regs) {
      lines.push(
        `  ${r.full_name} · ${r.gamertag || 'no tag'} · ${r.club_code} · ${r.email}` +
        ` · ID ••••${r.id_last4 || '????'}` +
        (r.id_doc_status === 'provided' ? '' : ' · NO ID PHOTO'),
      );
    }
    lines.push('');
  }

  if (appeals.length) {
    lines.push('── New appeals (review these) ──');
    for (const a of appeals) lines.push(`  ${a.full_name} <${a.email}>`);
    lines.push('');
  }

  if (byClub.length) {
    lines.push('── Entries per club ──');
    lines.push('  ' + byClub.map((c) => `${c.club_code}:${c.n}`).join('  '));
  }

  const sent = await notifyOps(
    `ELECTROCUP daily — ${regs.length} new ${regs.length === 1 ? 'entry' : 'entries'}`,
    lines.join('\n'),
  );

  // Report what happened rather than a bare ok: this runs unattended, and the
  // cron dashboard is the only place a silent mail failure would ever show up.
  return NextResponse.json({
    ok: true, emailed: sent, entries: regs.length, appeals: appeals.length,
  });
}
