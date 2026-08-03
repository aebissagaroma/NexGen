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
  { code: 'LEI', name: 'Leicester City', city: 'Leicester' },
  { code: 'IPS', name: 'Ipswich Town', city: 'Ipswich' },
  { code: 'SOU', name: 'Southampton', city: 'Southampton' },
];

export interface TimelinePhase {
  phase: string; sub: string; date: string; note: string; state: 'live' | 'upcoming';
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
  { phase: 'Announcement', sub: 'Public Reveal', date: 'AUG 04, 2026', note: 'This page · launch trailer drops', state: 'live' },
  { phase: 'Registration', sub: 'Open Sign-up', date: 'SEP 01, 2026', note: '20 brackets · entry fee TBA', state: 'upcoming', justAnnounced: true },
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
export interface SponsorTier { tier: string; key: string; code: string; seats: number; note: string; focus: string; }
export const SPONSORS_TIERS: SponsorTier[] = [
  { tier: 'Title Partner', key: 'Title', code: 'T01', seats: 1, focus: 'Naming rights', note: "Sole naming-rights position. Co-branded as 'NexGen × ___ presents ELECTROCUP 26'." },
  { tier: 'Platinum', key: 'Platinum', code: 'T02', seats: 3, focus: 'Category exclusive', note: 'Vehicle, telecom or banking category exclusivity.' },
  { tier: 'Gold', key: 'Gold', code: 'T03', seats: 4, focus: 'Brand integration', note: 'Beverage, retail, hospitality, energy.' },
  { tier: 'Broadcast', key: 'Broadcast', code: 'T04', seats: 4, focus: 'Distribution', note: 'Linear and streaming distribution partners.' },
];

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

// Countdown target — the next date the tournament has actually committed to.
// Fixed value so the countdown ticks consistently. Everything after registration
// is announced step by step, so this points at sign-ups opening rather than at a
// phase with no published date. Retarget it when the next phase is announced.
export const REGISTRATION_OPENS = new Date('2026-09-01T09:00:00+03:00').getTime();

// Display forms of the date above. Kept beside it so the copy can never drift
// from the timestamp the countdown and the open/closed state both read.
export const REGISTRATION_OPENS_LABEL = '01 SEP 2026';
export const REGISTRATION_OPENS_SHORT = 'SEP 01';

/**
 * Whether sign-ups have opened. Callers must not use this during render without
 * a mounted guard — see useRegistrationOpen() — because server and client
 * evaluate it at different instants, and a disagreement aborts hydration.
 */
export function registrationHasOpened(now: number = Date.now()): boolean {
  return now >= REGISTRATION_OPENS;
}
