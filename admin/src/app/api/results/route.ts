import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Players entering each round — the inverse of the draw generator's table,
// used to find the round a winner advances into.
const LADDER = ['RD256', 'RD128', 'RD64', 'RD32', 'RD16', 'QF', 'SF', 'FINAL'];

// POST /api/results { matchId, scoreA, scoreB } — record a match result and
// advance the winner into the next round's slot.
//
// FC matches cannot draw (knockout ties go to extra time / penalties in-game),
// so equal scores are rejected. A result can be corrected until the match the
// winner feeds has its own result — after that the bracket has moved on.
export async function POST(req: Request) {
  const auth = requireAdmin();
  if (!isSession(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const matchId = String(body.matchId ?? '');
  const scoreA = Number(body.scoreA);
  const scoreB = Number(body.scoreB);
  if (!UUID.test(matchId)) return NextResponse.json({ error: 'valid matchId required' }, { status: 400 });
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0 || scoreA > 99 || scoreB > 99) {
    return NextResponse.json({ error: 'Scores must be whole numbers between 0 and 99.' }, { status: 400 });
  }
  if (scoreA === scoreB) {
    return NextResponse.json({ error: 'Knockout matches cannot end level — enter the score after extra time / penalties.' }, { status: 400 });
  }

  const match = await queryOne<{ id: string; club_code: string; round: string; slot: number; player_a: string | null; player_b: string | null; winner: string | null }>(
    `SELECT id, club_code, round, slot, player_a, player_b, winner FROM matches WHERE id = $1`,
    [matchId],
  );
  if (!match) return NextResponse.json({ error: 'Match not found.' }, { status: 404 });
  if (!match.player_a || !match.player_b) {
    return NextResponse.json({ error: 'Both players must be known before a result can be recorded.' }, { status: 400 });
  }

  const winner = scoreA > scoreB ? 'a' : 'b';
  const winnerName = winner === 'a' ? match.player_a : match.player_b;
  const roundIdx = LADDER.indexOf(match.round);
  const nextRound = roundIdx >= 0 && roundIdx < LADDER.length - 1 ? LADDER[roundIdx + 1] : null;

  // Correction guard: if this match already fed a winner forward and the next
  // match has its own recorded result, rewriting history here would corrupt the
  // bracket downstream.
  if (match.winner && nextRound) {
    const next = await queryOne<{ score_a: number | null }>(
      `SELECT score_a FROM matches WHERE club_code = $1 AND round = $2 AND slot = $3`,
      [match.club_code, nextRound, Math.floor(match.slot / 2)],
    );
    if (next && next.score_a !== null) {
      return NextResponse.json(
        { error: 'The next round already has a recorded result — this one can no longer be changed.' },
        { status: 409 },
      );
    }
  }

  await query(
    `UPDATE matches SET score_a = $1, score_b = $2, winner = $3, played_at = now() WHERE id = $4`,
    [scoreA, scoreB, winner, matchId],
  );

  if (nextRound) {
    const col = match.slot % 2 === 0 ? 'player_a' : 'player_b';
    await query(
      `UPDATE matches SET ${col} = $1 WHERE club_code = $2 AND round = $3 AND slot = $4`,
      [winnerName, match.club_code, nextRound, Math.floor(match.slot / 2)],
    );
  }

  console.log(`[results] ${auth.email}: ${match.club_code} ${match.round}#${match.slot} ${match.player_a} ${scoreA}–${scoreB} ${match.player_b}`);
  return NextResponse.json({ ok: true, winner: winnerName, champion: !nextRound ? winnerName : undefined });
}
