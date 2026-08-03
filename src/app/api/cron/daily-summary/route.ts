import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { notifyOps, notifyAddress, sponsorAddress, sponsorInboxIsSeparate } from '@/lib/mailer';

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

  const sponsors = await query<{
    company: string; contact_name: string; email: string;
    phone: string | null; tier: string | null;
  }>(
    `SELECT company, contact_name, email, phone, tier FROM sponsor_inquiries
     WHERE created_at > now() - interval '${WINDOW}' ORDER BY created_at`,
  );

  // Unanswered inquiries are counted across all time, not just the window: a
  // lead that came in four days ago and is still untouched is exactly the thing
  // this email exists to stop, and it would fall out of a 24-hour view.
  const openSponsors = await queryOne<{ n: number }>(
    `SELECT count(*)::int AS n FROM sponsor_inquiries WHERE NOT handled`,
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

  // Two audiences. When SPONSOR_EMAIL names a separate inbox, partner leads go
  // only to that inbox and the player-ops roll-up does not mention them —
  // otherwise the same lead lands twice and each side assumes the other replied.
  // With SPONSOR_EMAIL unset the two collapse into one email, as before.
  const split = sponsorInboxIsSeparate();

  const lines: string[] = [];
  lines.push(`ELECTROCUP 26 — last ${WINDOW}`, '');
  lines.push(`New entries:   ${regs.length}`);
  lines.push(`New appeals:   ${appeals.length}`);
  if (!split) lines.push(`New inquiries: ${sponsors.length}`);
  lines.push(`Total so far:  ${totals?.total ?? 0}  (${totals?.missing_doc ?? 0} still without an ID photo)`);
  if (!split && openSponsors?.n) lines.push(`⚠ ${openSponsors.n} partner ${openSponsors.n === 1 ? 'inquiry is' : 'inquiries are'} still unanswered`);
  lines.push('');

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

  if (!split && sponsors.length) {
    lines.push('── New partner inquiries (reply to these) ──');
    for (const s of sponsors) {
      lines.push(`  ${s.tier || 'no tier'} · ${s.company} · ${s.contact_name} <${s.email}>${s.phone ? ' · ' + s.phone : ''}`);
    }
    lines.push('');
  }

  if (byClub.length) {
    lines.push('── Entries per club ──');
    lines.push('  ' + byClub.map((c) => `${c.club_code}:${c.n}`).join('  '));
  }

  // Partner inquiries go in the subject when they share the email: it is the one
  // item here that is time-critical, and it should be visible without opening it.
  const subject = `ELECTROCUP daily — ${regs.length} new ${regs.length === 1 ? 'entry' : 'entries'}`
    + (!split && sponsors.length ? `, ${sponsors.length} partner ${sponsors.length === 1 ? 'inquiry' : 'inquiries'}` : '');
  const sent = await notifyOps(subject, lines.join('\n'));

  // The partnerships roll-up. Sent even on a day with no new inquiries, as long
  // as something is still unanswered — a lead going stale is precisely the thing
  // a daily reminder should keep in front of someone.
  let sponsorSent: boolean | null = null;
  if (split && (sponsors.length || openSponsors?.n)) {
    const sl: string[] = [];
    sl.push(`ELECTROCUP 26 — partnerships, last ${WINDOW}`, '');
    sl.push(`New inquiries:      ${sponsors.length}`);
    sl.push(`Awaiting a reply:   ${openSponsors?.n ?? 0}`, '');

    if (sponsors.length) {
      sl.push('── New inquiries ──');
      for (const s of sponsors) {
        sl.push(`  ${s.tier || 'no tier'} · ${s.company} · ${s.contact_name} <${s.email}>${s.phone ? ' · ' + s.phone : ''}`);
      }
      sl.push('');
    }
    if (openSponsors?.n) {
      sl.push(`⚠ ${openSponsors.n} ${openSponsors.n === 1 ? 'inquiry has' : 'inquiries have'} not been marked handled.`);
      sl.push('  Staff dashboard → PARTNER INQUIRIES.');
    }

    sponsorSent = await notifyAddress(
      sponsorAddress(),
      sponsors.length
        ? `ELECTROCUP partnerships — ${sponsors.length} new ${sponsors.length === 1 ? 'inquiry' : 'inquiries'}`
        : `ELECTROCUP partnerships — ${openSponsors!.n} awaiting a reply`,
      sl.join('\n'),
    );
  }

  // Report what happened rather than a bare ok: this runs unattended, and the
  // cron dashboard is the only place a silent mail failure would ever show up.
  return NextResponse.json({
    ok: true, emailed: sent, entries: regs.length, appeals: appeals.length,
    sponsors: sponsors.length, openSponsors: openSponsors?.n ?? 0,
    sponsorInboxSeparate: split, sponsorEmailed: sponsorSent,
  });
}
