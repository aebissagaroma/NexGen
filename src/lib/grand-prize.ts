// The grand-prize vehicle — server-side only.
//
// This module must never be imported by a client component. Anything reachable
// from `'use client'` code is compiled into the JS bundle the browser
// downloads, so a make and model "hidden" behind a client-side date check would
// still be sitting in plain text for anyone who opened devtools. A reveal that
// can be read early is not a reveal.
//
// The only way out of here is /api/prize, which withholds these fields until
// the reveal date. See data/static.ts for the sealed copy the page shows in the
// meantime.
import { REGISTRATION_OPENS } from '@/data/static';

/**
 * When the vehicle is named publicly. Tied to sign-ups opening, so the reveal is
 * a reason to be there on the day. Point it at its own timestamp to decouple.
 */
export const GRAND_PRIZE_REVEALED_AT = REGISTRATION_OPENS;

export function grandPrizeRevealed(now: number = Date.now()): boolean {
  return now >= GRAND_PRIZE_REVEALED_AT;
}

/** Released by /api/prize only once grandPrizeRevealed() is true. */
export const GRAND_PRIZE_DETAILS = {
  headline: 'A SEAGULL.',
  name: '2025 BYD Seagull 405KM',
  teaser: 'a brand-new 2025 BYD Seagull 405KM',
  plate: '[ 2025 BYD SEAGULL 405KM ]',
  watermark: 'SEAGULL',
  short: '2025 BYD Seagull',
  specs: [
    { k: 'MAKE', v: 'BYD' },
    { k: 'MODEL', v: 'SEAGULL 405KM' },
    { k: 'YEAR', v: '2025' },
    { k: 'RANGE', v: '405 KM' },
    { k: 'POWERTRAIN', v: '100% EV' },
  ],
  teaserSpecs: [
    { k: 'RANGE', v: '405 KM' },
    { k: 'TYPE', v: '100% EV' },
    { k: 'MODEL', v: '2025 MY' },
  ],
};
