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

export interface GrandPrizeDetails {
  /** Closes the headline: "THE WINNER DRIVES HOME …" */
  headline: string;
  /** Full name, e.g. '2026 Volkswagen ID.3 Pro'. */
  name: string;
  /** Reads after "The grand prize for ELECTROCUP 26 is …". */
  teaser: string;
  /** Image plate label, e.g. '[ 2026 VOLKSWAGEN ID.3 PRO ]'. */
  plate: string;
  /** Single word behind the photo, e.g. 'ID.3'. */
  watermark: string;
  /** Short form for the hero metric strip, e.g. '2026 VW ID.3'. */
  short: string;
  /** The five cells in the prize spec strip. */
  specs: { k: string; v: string }[];
  /** The three cells on the hero teaser card. */
  teaserSpecs: { k: string; v: string }[];
}

/**
 * When the vehicle is named publicly. Tied to sign-ups opening, so the reveal is
 * a reason to be there on the day. Point it at its own timestamp to decouple.
 */
export const GRAND_PRIZE_REVEALED_AT = REGISTRATION_OPENS;

/**
 * The vehicle, or null while it is undecided.
 *
 * NOT SET: the prize is no longer the BYD Seagull and the replacement has not
 * been confirmed. Fill this in and the reveal happens on the date above; leave
 * it null and the prize simply stays sealed.
 *
 * Template — every field below is shown somewhere on the page, so all of them
 * need real values:
 *
 *   export const GRAND_PRIZE_DETAILS: GrandPrizeDetails | null = {
 *     headline: 'AN ID.3.',
 *     name: '2026 Volkswagen ID.3 Pro',
 *     teaser: 'a brand-new 2026 Volkswagen ID.3 Pro',
 *     plate: '[ 2026 VOLKSWAGEN ID.3 PRO ]',
 *     watermark: 'ID.3',
 *     short: '2026 VW ID.3',
 *     specs: [
 *       { k: 'MAKE', v: 'VOLKSWAGEN' }, { k: 'MODEL', v: 'ID.3 PRO' },
 *       { k: 'YEAR', v: '2026' }, { k: 'RANGE', v: '426 KM' },
 *       { k: 'POWERTRAIN', v: '100% EV' },
 *     ],
 *     teaserSpecs: [
 *       { k: 'RANGE', v: '426 KM' }, { k: 'TYPE', v: '100% EV' },
 *       { k: 'MODEL', v: '2026 MY' },
 *     ],
 *   };
 */
export const GRAND_PRIZE_DETAILS: GrandPrizeDetails | null = null;

/**
 * Whether the vehicle may be named publicly.
 *
 * Fails closed on BOTH conditions. A dated reveal fires whether or not the data
 * behind it is still correct, so a stale entry here would announce the wrong car
 * on launch morning with nobody having to act. Requiring the details to be
 * present as well makes the failure mode "still sealed" — visible and
 * recoverable — instead of "confidently wrong".
 */
export function grandPrizeRevealed(now: number = Date.now()): boolean {
  return GRAND_PRIZE_DETAILS !== null && now >= GRAND_PRIZE_REVEALED_AT;
}

/** The date has passed but there is still nothing to announce. */
export function grandPrizeOverdue(now: number = Date.now()): boolean {
  return GRAND_PRIZE_DETAILS === null && now >= GRAND_PRIZE_REVEALED_AT;
}
