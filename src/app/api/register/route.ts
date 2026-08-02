import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/session';
import { str } from '@/lib/validation';
import { hashPassword } from '@/lib/password';

// POST /api/register — create a qualifier registration for the logged-in player.
// Requires a verified email session (see /api/auth/otp/verify).
export async function POST(req: Request) {
  const session = getSession('user');
  if (!session) {
    return NextResponse.json({ error: 'Verify your email first.' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const fullName = str(body.fullName, { min: 2, max: 120 });
  const gamertag = str(body.gamertag, { min: 2, max: 60 });
  const clubCode = str(body.clubCode, { min: 2, max: 4 });
  const password = str(body.password, { min: 8, max: 200 });
  // Optional / TODO(dev) fields — see src/types RegistrationInput.
  const platform = body.platform ? str(body.platform, { max: 20 }) : null;
  const city = body.city ? str(body.city, { max: 80 }) : null;

  if (!fullName || !gamertag || !clubCode) {
    return NextResponse.json({ error: 'Name, gamertag and club are required.' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Choose a password of at least 8 characters — you sign in with it from now on.' }, { status: 400 });
  }

  const club = await queryOne(`SELECT code FROM clubs WHERE code = $1`, [clubCode.toUpperCase()]);
  if (!club) return NextResponse.json({ error: 'Unknown club.' }, { status: 400 });

  // One entry per player, for the whole tournament. These two lookups exist to
  // give a useful message ("you're already in with ARS"); they are NOT the
  // enforcement — two concurrent submits would both pass them. The unique
  // indexes in db/schema.sql are what actually make it impossible, and the
  // 23505 handler below turns that into the same answer.
  const existing = await queryOne<{ club_code: string }>(
    `SELECT club_code FROM registrations
     WHERE user_id = $1 OR ec_email_canon(email) = ec_email_canon($2) LIMIT 1`,
    [session.sub, session.email],
  );
  if (existing) {
    return NextResponse.json({ error: alreadyEntered(existing.club_code) }, { status: 409 });
  }

  const tagTaken = await queryOne(
    `SELECT 1 FROM registrations WHERE ec_tag_canon(gamertag) = ec_tag_canon($1) LIMIT 1`,
    [gamertag],
  );
  if (tagTaken) {
    return NextResponse.json({ error: GAMERTAG_TAKEN }, { status: 409 });
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
      `INSERT INTO registrations (user_id, full_name, email, gamertag, club_code, platform, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [session.sub, fullName, session.email, gamertag, clubCode.toUpperCase(), platform, city],
    );
    return NextResponse.json({ ok: true, id: row!.id });
  } catch (e: unknown) {
    const err = e as { code?: string; constraint?: string };
    if (err?.code === '23505') {
      // Lost a race against the player's own duplicate submit (or an alias of
      // their address). Which index fired tells us what to say.
      const msg =
        err.constraint === 'uniq_reg_gamertag' ? GAMERTAG_TAKEN : alreadyEntered(null);
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    throw e;
  }
}

const GAMERTAG_TAKEN =
  'That gamertag is already entered. If it is yours, you are registered — pick a different tag only if you are a different player.';

function alreadyEntered(clubCode: string | null): string {
  const where = clubCode ? ` You are entered with ${clubCode}.` : '';
  return `You have already registered for ELECTROCUP 26.${where} One entry per player — contact us if you need to change club.`;
}

// GET /api/register — the current player's own registrations (for the confirm page).
export async function GET() {
  const session = getSession('user');
  if (!session) return NextResponse.json({ registrations: [] });
  const rows = await query(
    `SELECT r.id, r.full_name, r.gamertag, r.club_code, c.name AS club_name,
            r.platform, r.city, r.payment_status, r.status, r.created_at
     FROM registrations r JOIN clubs c ON c.code = r.club_code
     WHERE r.user_id = $1 OR ec_email_canon(r.email) = ec_email_canon($2)
     ORDER BY r.created_at DESC`,
    [session.sub, session.email],
  );
  return NextResponse.json({ registrations: rows });
}
