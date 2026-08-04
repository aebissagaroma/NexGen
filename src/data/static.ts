// Static content for the landing page (mirrors the original prototype's data.jsx).
// Live counts/brackets/standings come from the API + Postgres; this is the
// editorial copy that doesn't live in the DB.

export interface StaticClub { code: string; name: string; city: string; }

export const CLUBS: StaticClub[] = [
  { code: 'MCI', name: 'Manchester City', city: 'Manchester' },
  { code: 'ARS', name: 'Arsenal', city: 'London' },
  { code: 'LIV', name: 'Liverpool', city: 'Liverpool' },
  { code: 'MUN', name: 'Manchester United', city: 'Manchester' },
  { code: 'CHE', name: 'Chelsea', city: 'London' },
  { code: 'TOT', name: 'Tottenham Hotspur', city: 'London' },
  { code: 'NEW', name: 'Newcastle United', city: 'Newcastle' },
  { code: 'AVL', name: 'Aston Villa', city: 'Birmingham' },
  { code: 'WHU', name: 'West Ham United', city: 'London' },
  { code: 'BHA', name: 'Brighton & Hove Albion', city: 'Brighton' },
  { code: 'CRY', name: 'Crystal Palace', city: 'London' },
  { code: 'FUL', name: 'Fulham', city: 'London' },
  { code: 'BRE', name: 'Brentford', city: 'London' },
  { code: 'EVE', name: 'Everton', city: 'Liverpool' },
  { code: 'WOL', name: 'Wolverhampton', city: 'Wolverhampton' },
  { code: 'NFO', name: 'Nottingham Forest', city: 'Nottingham' },
  { code: 'BOU', name: 'AFC Bournemouth', city: 'Bournemouth' },
  { code: 'LEE', name: 'Leeds United', city: 'Leeds' },
  { code: 'BUR', name: 'Burnley', city: 'Burnley' },
  { code: 'SUN', name: 'Sunderland', city: 'Sunderland' },
];

export interface TimelinePhase {
  phase: string; sub: string; date: string; note: string; state: 'done' | 'live' | 'upcoming';
  /**
   * Set to true when this phase's date is first published. It drives the banner
   * at the top of the page and the highlight in the schedule strip — no other
   * edit is needed. Clear it once the announcement is no longer news; a phase
   * still reading TBA must never carry it.
   */
  justAnnounced?: boolean;
}

/** Phases whose date has just been published — drives the announcement banner. */
export const announcedPhases = (): TimelinePhase[] =>
  TIMELINE.filter((t) => t.justAnnounced && t.date.toUpperCase() !== 'TBA');
// Only committed dates appear here. Every later phase is announced as it
// approaches, so its date reads TBA until ops fixes it — deliberately, not a
// placeholder to fill in. When a phase is announced, set its `date` and move the
// `state: 'live'` marker to it.
export const TIMELINE: TimelinePhase[] = [
  { phase: 'Announcement', sub: 'Public Reveal', date: 'AUG 04, 2026', note: 'Done · this page is live', state: 'done' },
  { phase: 'Registration', sub: 'Open Sign-up', date: 'OPEN — CLOSES 01 SEP 2026', note: '20 brackets · free to register', state: 'live' },
  { phase: 'Bracket Draw', sub: 'Live Broadcast', date: 'TBA', note: 'Random draw · streamed', state: 'upcoming' },
  { phase: 'Qualifiers', sub: 'BO3 Knockouts', date: 'TBA', note: '20 winners surface', state: 'upcoming' },
  { phase: 'Draft Day', sub: 'Live Broadcast', date: 'TBA', note: 'Host venue · Addis Ababa', state: 'upcoming' },
  { phase: 'Gameweek 1', sub: 'Season Kickoff', date: 'TBA', note: '380 fixtures · 38 weeks', state: 'upcoming' },
  { phase: 'Cup Final', sub: 'Live Audience', date: 'TBA', note: 'Host venue · Addis Ababa', state: 'upcoming' },
];

// Partner tiers.
//
// `seats` is deliberately NOT published. Advertising twelve empty seats tells
// every brand that visits that nobody has committed yet, which is the weakest
// possible position to negotiate from — and reads worse the longer it stays up.
// The number is kept here because the staff dashboard uses it to weigh demand
// against inventory (e.g. "3 inquiries for 1 Title seat").
//
// `key` must match the values in the tier dropdown on the inquiry form, since
// that is what gets stored on the inquiry and counted per tier.
export interface SponsorTier { tier: string; key: string; code: string; seats: number; note: string; focus: string;
  /** Set once the position is taken — the tier then reads as filled, not open. */
  filled?: string;
}
export const SPONSORS_TIERS: SponsorTier[] = [
  { tier: 'Lead Partner', key: 'Lead', code: 'T01', seats: 1, focus: 'Official Vehicle Partner', filled: 'Kairos Addis Auto', note: 'Lead partner position with billing across broadcast, venue and site, and the grand prize vehicle. The competition name remains ELECTROCUP 26.' },
  { tier: 'Platinum', key: 'Platinum', code: 'T02', seats: 3, focus: 'Category exclusive', note: 'Telecom or banking category exclusivity.' },
  { tier: 'Gold', key: 'Gold', code: 'T03', seats: 4, focus: 'Brand integration', note: 'Retail, hospitality, logistics, technology.' },
  { tier: 'Broadcast', key: 'Broadcast', code: 'T04', seats: 4, focus: 'Distribution', note: 'Linear and streaming distribution partners.' },
];

// What the site says about the grand prize BEFORE the car is named. Everything
// here is true and none of it identifies the vehicle, so the page is never coy
// about what is being given away — only about which car it is.
//
// The make and model deliberately do NOT live in this file. Everything in
// src/data is imported by client components and therefore shipped to the
// browser, where anyone can read it out of the JS bundle. The real details are
// server-side in src/lib/grand-prize.ts and released by /api/prize on the day.
export const GRAND_PRIZE_SEALED = {
  headline: 'AN ELECTRIC CAR.',
  teaser: 'a brand-new 100% electric car',
  plate: '[ SEALED · REVEAL ON BROADCAST ]',
  note: 'MAKE AND MODEL ANNOUNCED BEFORE QUALIFIERS BEGIN',
  status: 'SEALED · REVEAL ON BROADCAST',
};

// The partner delivering the grand-prize vehicle. Credited on the Prize section
// rather than occupying a tier seat: the seats are sellable inventory and this
// placement is not, so it costs nothing to give it prominence — and the prize
// car is the most-looked-at object on the page.
export const PRIZE_PARTNER = {
  name: 'Kairos Addis Auto',
  role: 'Official Vehicle Partner',
  blurb: 'Electric mobility for Addis Ababa.',
};

// Related parties. Their inquiries stay in the list but are excluded from the
// demand-by-tier counts, so the panel keeps answering the only question it is
// there to answer: what is the outside market actually offering. An internal
// arrangement counted as market demand would flatter the numbers you price off.
// Matched case-insensitively against the company name.
export const INTERNAL_COMPANIES: string[] = ['kairos addis auto', 'kairos addis'];

// Categories the game licence terms do not allow as partners. Shown under the
// tier grid so a brand in one of them does not spend time on a proposal that
// cannot be accepted.
export const EXCLUDED_PARTNER_CATEGORIES =
  'Some categories cannot be accepted under our game licence terms, including alcohol, betting and gambling, energy drinks, tobacco and cryptocurrency.';

// The date partner selection closes, e.g. '30 SEPTEMBER 2026'.
//
// Set this and the partners section states a deadline, which is the whole point
// of the expression-of-interest framing: proposals arrive inside one window and
// get compared against each other, instead of arriving one at a time and each
// being answered on its own. Leave it null and the copy stays deliberately
// open-ended — consistent with every other phase being announced step by step.
export const PARTNER_SELECTION_CLOSES: string | null = null;

export interface Pillar { code: string; name: string; blurb: string; }
export const NEXGEN_PILLARS: Pillar[] = [
  { code: '01', name: 'Competition', blurb: 'National-scale tournaments across FC, Mobile Legends and CS.' },
  { code: '02', name: 'Broadcast', blurb: 'Production-grade livestreams and weekly studio shows.' },
  { code: '03', name: 'Talent', blurb: 'Player development, rep contracts and creator partnerships.' },
  { code: '04', name: 'Stadium', blurb: 'Live-audience finals at flagship venues across Ethiopia.' },
];

// Countdown target. Registration is OPEN, so this is the date it CLOSES — the
// same instant that previously marked sign-ups opening. The countdown counts
// down to the deadline rather than to a launch.
export const REGISTRATION_CLOSES = new Date('2026-09-01T09:00:00+03:00').getTime();

// Display forms of the date above. Kept beside it so the copy can never drift
// from the timestamp the countdown and the open/closed state both read.
export const REGISTRATION_CLOSES_LABEL = '01 SEP 2026';
export const REGISTRATION_CLOSES_TIME = '01 SEP 2026 · 09:00 EAT';

/**
 * Whether sign-ups are still open. Callers must not use this during render
 * without a mounted guard — see useRegistrationOpen() — because server and
 * client evaluate it at different instants, and a disagreement aborts
 * hydration.
 */
export function registrationIsOpen(now: number = Date.now()): boolean {
  return now < REGISTRATION_CLOSES;
}
