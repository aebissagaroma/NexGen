import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/brackets?club=MCI — matches for a club bracket (empty until drawn).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const club = searchParams.get('club');
  const rows = club
    ? await query(
        `SELECT id, club_code, round, slot, player_a, player_b, score_a, score_b, winner
         FROM matches WHERE club_code = $1 ORDER BY round, slot`,
        [club.toUpperCase()],
      )
    : await query(
        `SELECT id, club_code, round, slot, player_a, player_b, score_a, score_b, winner
         FROM matches ORDER BY club_code, round, slot`,
      );
  return NextResponse.json({ matches: rows });
}
