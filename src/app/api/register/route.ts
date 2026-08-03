import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/session';
import { str } from '@/lib/validation';
import { hashPassword } from '@/lib/password';
import { canonicalId, hashId, idLast4 } from '@/lib/national-id';
import { notifyOps, notifyEachRegistration } from '@/lib/mailer';

// POST /api/register — create a qualifier registration for the logged-in player.
// Requires a verified email session (see /api/auth/otp/verify).
export async function POST(req: Request) {
  const session = getSession('user');
  if (!session) {
    return NextResponse.json({ error: 'Verify your email first.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const fullName = str(body.fullName, { min: 2, max: 120 });
  const clubCode = str(body.clubCode, { min: 2, max: 4 });
  const password = str(body.password, { min: 8, max: 200 });
  const city = body.city ? str(body.city, { max: 80 }) : null;
  // Chosen from the name-derived options offered by /api/tags/suggest. Not
  // re-derived here on purpose: the player may have picked one, then edited their
  // name slightly, and rejecting their choice for that would be baffling. It only
  // has to be a sane, unused handle.
  const gamertag = str(body.gamertag, { min: 3, max: 20 });
  // Identity document. The raw number is used here and then discarded — only a
  // hash and the last four characters are stored. See src/lib/national-id.ts.
  const idCanon = canonicalId(body.idNumber);

  if (!fullName || !clubCode) {
    return NextResponse.json({ error: 'Name and club are required.' }, { status: 400 });
  }
  if (!gamertag) {
    return NextResponse.json({ error: 'Pick one of the suggested gamertags.' }, { status: 400 });
  }
  if (!idCanon) {
    return NextResponse.json(
      { error: 'Enter your ID number as it appears on your ID.' },
      { status: 400 },
    );
  }
  if (!password) {
    return NextResponse.json({ error: 'Choose a password of at least 8 characters — you sign in with it from now on.' }, { status: 400 });
  }

  const club = await queryOne(`SELECT code FROM clubs WHERE code = $1`, [clubCode.toUpperCase()]);
  if (!club) return NextResponse.json({ error: 'Unknown club.' }, { status: 400 });

  const idHash = hashId(idCanon);

  // One entry per player, for the whole tournament. These lookups exist to give a
  // useful message ("you're already in with ARS"); they are NOT the enforcement —
  // two concurrent submits would both pass them. The unique indexes in
  // db/schema.sql are what make it impossible, and the 23505 handler below turns
  // that into the same answer.
  const existing = await queryOne<{ club_code: string }>(
    `SELECT club_code FROM registrations
     WHERE user_id = $1 OR ec_email_canon(email) = ec_email_canon($2) LIMIT 1`,
    [session.sub, session.email],
  );
  if (existing) {
    return NextResponse.json({ error: alreadyEntered(existing.club_code) }, { status: 409 });
  }

  const idTaken = await queryOne(`SELECT 1 FROM registrations WHERE id_hash = $1 LIMIT 1`, [idHash]);
  if (idTaken) {
    return NextResponse.json({ error: ID_TAKEN }, { status: 409 });
  }

  const tagTaken = await queryOne(
    `SELECT 1 FROM registrations
     WHERE gamertag IS NOT NULL AND ec_tag_canon(gamertag) = ec_tag_canon($1) LIMIT 1`,
    [gamertag],
  );
  if (tagTaken) {
    return NextResponse.json({ error: TAG_TAKEN }, { status: 409 });
  }

  // Set the password before inserting the entry: if the insert loses a race
  // (409 below), the player still ends up able to sign in — the reverse order
  // could leave a registered player with no password at all.
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [
    await hashPassword(password),
    session.sub,
  ]);

  try {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO registrations (user_id, full_name, email, club_code, city, id_hash, id_last4, gamertag)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [session.sub, fullName, session.email, clubCode.toUpperCase(), city, idHash, idLast4(idCanon), gamertag],
    );

    // Staff copy of the entry. Deliberately after the INSERT and never awaited
    // for success: the registration is already saved, so a mail outage must not
    // turn a completed entry into an error the player sees. notifyOps bounds how
    // long this can hold up their response.
    //
    // The ID number itself is not included because it is never stored — only the
    // last four. An emailed record should not be a route around that.
    if (notifyEachRegistration()) await notifyOps(
      `New ELECTROCUP entry — ${fullName} (${clubCode.toUpperCase()})`,
      [
        `Name:      ${fullName}`,
        `Gamertag:  ${gamertag}`,
        `Club:      ${clubCode.toUpperCase()}`,
        `Email:     ${session.email ?? '—'}`,
        `City:      ${city || '—'}`,
        `ID ending: ${idLast4(idCanon)}`,
        `Entry ID:  ${row!.id}`,
      ].join('\n'),
    );

    return NextResponse.json({ ok: true, id: row!.id });
  } catch (e: unknown) {
    const err = e as { code?: string; constraint?: string };
    if (err?.code === '23505') {
      // Lost a race against the player's own duplicate submit (or an alias of
      // their address, or the same ID). Which index fired tells us what to say.
      const msg =
        err.constraint === 'uniq_reg_idnum' ? ID_TAKEN
        : err.constraint === 'uniq_reg_tag' ? TAG_TAKEN
        : alreadyEntered(null);
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    throw e;
  }
}

const TAG_TAKEN =
  'Someone just took that gamertag. Pick another from the list.';

// One entry per player is enforced by disqualification, so these messages have to
// state the consequence plainly — and point at the appeal, since the honest
// mistakes (a shared family email, a mistyped ID) land here too.
const ID_TAKEN =
  'That ID is already registered for ELECTROCUP 26. Registering twice means immediate disqualification. If this is a mistake, appeal below and we will review it.';

function alreadyEntered(clubCode: string | null): string {
  const where = clubCode ? ` You are entered with ${clubCode}.` : '';
  return `You have already registered for ELECTROCUP 26.${where} Registering twice means immediate disqualification — do not submit again. If you need to change club or think this is a mistake, appeal below.`;
}

// GET /api/register — the current player's own registrations (for the confirm page).
export async function GET() {
  const session = getSession('user');
  if (!session) return NextResponse.json({ registrations: [] });
  const rows = await query(
    `SELECT r.id, r.full_name, r.gamertag, r.club_code, c.name AS club_name,
            r.city, r.id_last4,
            r.payment_status, r.status, r.created_at
     FROM registrations r JOIN clubs c ON c.code = r.club_code
     WHERE r.user_id = $1 OR ec_email_canon(r.email) = ec_email_canon($2)
     ORDER BY r.created_at DESC`,
    [session.sub, session.email],
  );
  return NextResponse.json({ registrations: rows });
}
