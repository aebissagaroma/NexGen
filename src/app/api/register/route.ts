import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/session';
import { str } from '@/lib/validation';

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
  // Optional / TODO(dev) fields — see src/types RegistrationInput.
  const platform = body.platform ? str(body.platform, { max: 20 }) : null;
  const city = body.city ? str(body.city, { max: 80 }) : null;

  if (!fullName || !gamertag || !clubCode) {
    return NextResponse.json({ error: 'Name, gamertag and club are required.' }, { status: 400 });
  }

  const club = await queryOne(`SELECT code FROM clubs WHERE code = $1`, [clubCode.toUpperCase()]);
  if (!club) return NextResponse.json({ error: 'Unknown club.' }, { status: 400 });

  try {
    const row = await queryOne<{ id: string }>(
      `INSERT INTO registrations (user_id, full_name, email, gamertag, club_code, platform, city)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [session.sub, fullName, session.email, gamertag, clubCode.toUpperCase(), platform, city],
    );
    return NextResponse.json({ ok: true, id: row!.id });
  } catch (e: unknown) {
    // unique_violation → already registered for this club
    if (typeof e === 'object' && e && 'code' in e && (e as { code: string }).code === '23505') {
      return NextResponse.json({ error: 'You already registered for this club.' }, { status: 409 });
    }
    throw e;
  }
}

// GET /api/register — the current player's own registrations (for the confirm page).
export async function GET() {
  const session = getSession('user');
  if (!session) return NextResponse.json({ registrations: [] });
  const rows = await query(
    `SELECT r.id, r.full_name, r.gamertag, r.club_code, c.name AS club_name,
            r.platform, r.city, r.payment_status, r.status, r.created_at
     FROM registrations r JOIN clubs c ON c.code = r.club_code
     WHERE r.user_id = $1 ORDER BY r.created_at DESC`,
    [session.sub],
  );
  return NextResponse.json({ registrations: rows });
}
