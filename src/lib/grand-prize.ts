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

// No make or model appears in this file, including in examples and templates.
// The vehicle is sealed until it is announced on broadcast, and this repository
// is public — an illustrative example names the car just as effectively as a
// real value does. Placeholders below are written as <ANGLE BRACKETS> so that
// anything left unfilled is obvious on sight rather than plausible.

export interface GrandPrizeDetails {
  /** Closes the headline: "THE WINNER DRIVES HOME …" */
  headline: string;
  /** Full name: year, make, model, trim. */
  name: string;
  /** Reads after "The grand prize for ELECTROCUP 26 is …". */
  teaser: string;
  /** Image plate label — the full name, upper case, in square brackets. */
  plate: string;
  /** Single word behind the photo — the model alone. */
  watermark: string;
  /** Short form for the hero metric strip: year and abbreviated model. */
  short: string;
  /** The five cells in the prize spec strip. */
  specs: { k: string; v: string }[];
  /** The three cells on the hero teaser card. */
  teaserSpecs: { k: string; v: string }[];
}

// The reveal is no longer on a timer. It was tied to sign-ups opening, and
// sign-ups are now open — leaving it that way would have published the vehicle
// the moment registration went live, which is exactly what the reveal is meant
// to hold back. The car is announced on broadcast before qualifiers begin, which
// is an editorial moment rather than a timestamp, so the reveal now happens when
// and only when GRAND_PRIZE_DETAILS below is filled in.

/**
 * The vehicle, or null while it is undecided.
 *
 * NOT SET: the vehicle is not confirmed. Filling this in IS the reveal — the
 * car appears on the site as soon as this ships. Leave it null and the prize
 * stays sealed.
 *
 * Ship this together with the broadcast announcement, not before it. There is
 * no staging step between committing a value here and the site naming the car.
 *
 * Template — every field is shown somewhere on the page, so all of them need
 * real values. Replace every <PLACEHOLDER>; do not ship a partly-filled object:
 *
 *   export const GRAND_PRIZE_DETAILS: GrandPrizeDetails | null = {
 *     headline: 'A <MODEL>.',
 *     name: '<YEAR> <MAKE> <MODEL> <TRIM>',
 *     teaser: 'a brand-new <YEAR> <MAKE> <MODEL> <TRIM>',
 *     plate: '[ <YEAR> <MAKE> <MODEL> <TRIM> ]',
 *     watermark: '<MODEL>',
 *     short: '<YEAR> <MAKE-ABBREVIATED> <MODEL>',
 *     specs: [
 *       { k: 'MAKE', v: '<MAKE>' }, { k: 'MODEL', v: '<MODEL> <TRIM>' },
 *       { k: 'YEAR', v: '<YEAR>' }, { k: 'RANGE', v: '<NNN> KM' },
 *       { k: 'POWERTRAIN', v: '100% EV' },
 *     ],
 *     teaserSpecs: [
 *       { k: 'RANGE', v: '<NNN> KM' }, { k: 'TYPE', v: '100% EV' },
 *       { k: 'MODEL', v: '<YEAR> MY' },
 *     ],
 *   };
 */
export const GRAND_PRIZE_DETAILS: GrandPrizeDetails | null = null;

/**
 * Whether the vehicle may be named publicly.
 *
 * Fails closed: no details, no reveal. Setting the vehicle below is a deliberate
 * act, so the car cannot be announced by a clock running out while nobody is
 * watching.
 */
export function grandPrizeRevealed(): boolean {
  return GRAND_PRIZE_DETAILS !== null;
}
