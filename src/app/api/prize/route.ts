import { NextResponse } from 'next/server';
import { GRAND_PRIZE_DETAILS, grandPrizeRevealed } from '@/lib/grand-prize';

// GET /api/prize — the grand-prize vehicle, once it is allowed to be known.
//
// This is the only route by which the make and model reach a browser. While the
// prize is sealed the response contains nothing identifying, so there is no
// early copy to find in the page source, the bundle, or a cached response.
//
// force-dynamic and no-store because the answer changes the moment the vehicle
// is set: a cached "sealed" response would outlive the reveal.
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!grandPrizeRevealed()) {
    return NextResponse.json(
      { revealed: false },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
  return NextResponse.json(
    { revealed: true, prize: GRAND_PRIZE_DETAILS },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
