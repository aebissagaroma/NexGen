import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/standings — league table, sorted by points then goal difference.
export async function GET() {
  const rows = await query(
    `SELECT s.club_code, c.name AS club_name, s.player_tag,
            s.played, s.won, s.drawn, s.lost, s.gf, s.ga,
            (s.gf - s.ga) AS gd, s.points
     FROM standings s JOIN clubs c ON c.code = s.club_code
     ORDER BY s.points DESC, (s.gf - s.ga) DESC, s.gf DESC`,
  );
  return NextResponse.json({ standings: rows });
}
