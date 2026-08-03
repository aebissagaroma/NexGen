import { NextResponse } from 'next/server';
import { GRAND_PRIZE_DETAILS, grandPrizeRevealed, GRAND_PRIZE_REVEALED_AT } from '@/lib/grand-prize';

// GET /api/prize — the grand-prize vehicle, once it is allowed to be known.
//
// This is the only route by which the make and model reach a browser. Before the
// reveal date the response contains nothing identifying, so there is no early
// copy to find in the page source, the bundle, or a cached response.
//
// force-dynamic because the answer changes with the clock: a build-time snapshot
// would keep serving "sealed" after the reveal, or worse, be built after it and
// serve the details early.
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!grandPrizeRevealed()) {
    return NextResponse.json(
      { revealed: false, revealedAt: GRAND_PRIZE_REVEALED_AT },
      // Never cache the sealed answer past the reveal instant.
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return NextResponse.json(
    { revealed: true, revealedAt: GRAND_PRIZE_REVEALED_AT, prize: GRAND_PRIZE_DETAILS },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
