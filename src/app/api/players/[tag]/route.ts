import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

// GET /api/players/[tag] — a player profile: registration + standing + matches.
export async function GET(_req: Request, { params }: { params: { tag: string } }) {
  const tag = params.tag;
  const player = await queryOne(
    `SELECT r.gamertag, r.full_name, r.club_code, c.name AS club_name, r.city, r.status
     FROM registrations r JOIN clubs c ON c.code = r.club_code
     WHERE lower(r.gamertag) = lower($1) LIMIT 1`,
    [tag],
  );
  if (!player) return NextResponse.json({ error: 'Player not found.' }, { status: 404 });

  const standing = await queryOne(
    `SELECT played, won, drawn, lost, gf, ga, (gf - ga) AS gd, points
     FROM standings WHERE lower(player_tag) = lower($1) LIMIT 1`,
    [tag],
  );
  const matches = await query(
    `SELECT round, player_a, player_b, score_a, score_b, winner
     FROM matches WHERE lower(player_a) = lower($1) OR lower(player_b) = lower($1)
     ORDER BY round`,
    [tag],
  );
  return NextResponse.json({ player, standing, matches });
}
