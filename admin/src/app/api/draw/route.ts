import { NextResponse } from 'next/server';
import { query, queryOne, pool } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';
import crypto from 'node:crypto';

// Round label by the number of PLAYERS entering it. Must stay in step with
// ROUND_ORDER in the main site's bracket viewer — a label missing there would
// silently not render.
const ROUND_BY_PLAYERS: Record<number, string> = {
  256: 'RD256', 128: 'RD128', 64: 'RD64', 32: 'RD32', 16: 'RD16', 8: 'QF', 4: 'SF', 2: 'FINAL',
};

/** Unbiased Fisher–Yates on crypto randomness — a draw must not be predictable. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// POST /api/draw { clubCode } — generate the knockout bracket for one club from
// its ID-CONFIRMED entries (id_status = 'confirmed'; unconfirmed and void entries
// are not in the draw, by rule). `status` is the ops workflow and only excludes
// rejected entries here.
//
// Writes every round up front: round 1 holds the drawn players (byes resolve
// immediately), later rounds are empty slots that fill as results are entered.
// Refuses to run when the club already has matches — clearing an unwanted draw
// is DELETE below, and only while no result has been recorded.
export async function POST(req: Request) {
  const auth = requireAdmin();
  if (!isSession(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const clubCode = String(body.clubCode ?? '').toUpperCase();
  const club = await queryOne(`SELECT code FROM clubs WHERE code = $1`, [clubCode]);
  if (!club) return NextResponse.json({ error: 'Unknown club.' }, { status: 400 });

  const already = await queryOne(`SELECT 1 FROM matches WHERE club_code = $1 LIMIT 1`, [clubCode]);
  if (already) {
    return NextResponse.json({ error: 'This club already has a bracket. Clear it first (only possible before any result is recorded).' }, { status: 409 });
  }

  const entrants = await query<{ gamertag: string }>(
    `SELECT gamertag FROM registrations
     WHERE club_code = $1 AND id_status = 'confirmed' AND status <> 'rejected' AND gamertag IS NOT NULL
     ORDER BY created_at`,
    [clubCode],
  );
  if (entrants.length < 2) {
    return NextResponse.json(
      { error: `Only ${entrants.length} confirmed ${entrants.length === 1 ? 'entry' : 'entries'} — a draw needs at least 2. Entrants confirm with their ID number on the site before the draw.` },
      { status: 400 },
    );
  }
  if (entrants.length > 256) {
    return NextResponse.json({ error: 'More than 256 confirmed entries — split the bracket before drawing.' }, { status: 400 });
  }

  // Bracket size = next power of two; the difference becomes round-1 byes.
  let size = 2;
  while (size < entrants.length) size *= 2;

  const drawn = shuffle(entrants.map((e) => e.gamertag));
  // Match i pairs drawn[i] with drawn[size-1-i]; out-of-range indices are byes.
  // Because size/2 < N ≤ size, the a-side always has a player, and byes spread
  // one-per-match across the top of the bracket instead of stacking.
  const padded: (string | null)[] = [];
  const byes = size - drawn.length;
  for (let i = 0; i < size / 2; i++) {
    padded.push(drawn[i] ?? null);
    padded.push(drawn[size - 1 - i] ?? null);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // All rounds, outermost first.
    for (let players = size; players >= 2; players /= 2) {
      const round = ROUND_BY_PLAYERS[players];
      const matchCount = players / 2;
      for (let slot = 0; slot < matchCount; slot++) {
        if (players === size) {
          const a = padded[slot * 2];
          const b = padded[slot * 2 + 1];
          // A bye resolves at generation: the present player advances.
          const winner = a && !b ? 'a' : b && !a ? 'b' : null;
          await client.query(
            `INSERT INTO matches (club_code, round, slot, player_a, player_b, winner)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [clubCode, round, slot, a, b, winner],
          );
        } else {
          await client.query(
            `INSERT INTO matches (club_code, round, slot) VALUES ($1, $2, $3)`,
            [clubCode, round, slot],
          );
        }
      }
    }
    // Advance round-1 byes into round 2 immediately.
    const firstRound = ROUND_BY_PLAYERS[size];
    const byeWinners = await client.query(
      `SELECT slot, CASE WHEN winner = 'a' THEN player_a ELSE player_b END AS name
       FROM matches WHERE club_code = $1 AND round = $2 AND winner IS NOT NULL`,
      [clubCode, firstRound],
    );
    const nextRound = ROUND_BY_PLAYERS[size / 2];
    for (const w of byeWinners.rows) {
      const col = w.slot % 2 === 0 ? 'player_a' : 'player_b';
      await client.query(
        `UPDATE matches SET ${col} = $1 WHERE club_code = $2 AND round = $3 AND slot = $4`,
        [w.name, clubCode, nextRound, Math.floor(w.slot / 2)],
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }

  console.log(`[draw] ${auth.email} drew ${clubCode}: ${entrants.length} players, bracket of ${size}, ${byes} byes`);
  return NextResponse.json({ ok: true, players: entrants.length, bracketSize: size, byes });
}

// DELETE /api/draw { clubCode } — clear a bracket, allowed ONLY while no result
// has been recorded (byes don't count; they were never played).
export async function DELETE(req: Request) {
  const auth = requireAdmin();
  if (!isSession(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const clubCode = String(body.clubCode ?? '').toUpperCase();

  const played = await queryOne(
    `SELECT 1 FROM matches WHERE club_code = $1 AND score_a IS NOT NULL LIMIT 1`,
    [clubCode],
  );
  if (played) {
    return NextResponse.json({ error: 'Results have been recorded — this bracket can no longer be cleared.' }, { status: 409 });
  }
  await query(`DELETE FROM matches WHERE club_code = $1`, [clubCode]);
  console.log(`[draw] ${auth.email} cleared bracket for ${clubCode}`);
  return NextResponse.json({ ok: true });
}
