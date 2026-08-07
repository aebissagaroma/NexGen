// Static content for the landing page (mirrors the original prototype's data.jsx).
// Live counts/brackets/standings come from the API + Postgres; this is the
// editorial copy that doesn't live in the DB.

/**
 * Which closing group a club's bracket belongs to.
 *
 * 'A' — last season's top ten. These brackets close first, when their draw is
 *       announced. 'B' — everyone else, including the three clubs promoted this
 *       summer. Stays open after Group A closes.
 */
export type ClubGroup = 'A' | 'B';

export interface StaticClub {
  code: string; name: string; city: string; group: ClubGroup;
  /**
   * The club whose squad stands in during qualifiers.
   *
   * Qualifiers are played on FC 26, where the three clubs promoted this summer
   * are not selectable. Each uses the club it replaced. The player still wins
   * the real club's slot and represents it from Gameweek 1 on FC 27. Undefined
   * for every club that is selectable in FC 26.
   */
  standIn?: string;
}

// Keep in step with db/seed.sql — every club change must update both, plus a
// migration so production data agrees. See CLAUDE.md, "Working conventions".
export const CLUBS: StaticClub[] = [
  { code: 'MCI', name: 'Manchester City', city: 'Manchester', group: 'A' },
  { code: 'ARS', name: 'Arsenal', city: 'London', group: 'A' },
  { code: 'LIV', name: 'Liverpool', city: 'Liverpool', group: 'A' },
  { code: 'MUN', name: 'Manchester United', city: 'Manchester', group: 'A' },
  { code: 'CHE', name: 'Chelsea', city: 'London', group: 'A' },
  { code: 'AVL', name: 'Aston Villa', city: 'Birmingham', group: 'A' },
  { code: 'BHA', name: 'Brighton & Hove Albion', city: 'Brighton', group: 'A' },
  { code: 'BRE', name: 'Brentford', city: 'London', group: 'A' },
  { code: 'BOU', name: 'AFC Bournemouth', city: 'Bournemouth', group: 'A' },
  { code: 'SUN', name: 'Sunderland', city: 'Sunderland', group: 'A' },
  { code: 'TOT', name: 'Tottenham Hotspur', city: 'London', group: 'B' },
  { code: 'NEW', name: 'Newcastle United', city: 'Newcastle', group: 'B' },
  { code: 'CRY', name: 'Crystal Palace', city: 'London', group: 'B' },
  { code: 'FUL', name: 'Fulham', city: 'London', group: 'B' },
  { code: 'EVE', name: 'Everton', city: 'Liverpool', group: 'B' },
  { code: 'NFO', name: 'Nottingham Forest', city: 'Nottingham', group: 'B' },
  { code: 'LEE', name: 'Leeds United', city: 'Leeds', group: 'B' },
  { code: 'COV', name: 'Coventry City', city: 'Coventry', group: 'B', standIn: 'West Ham United' },
  { code: 'IPS', name: 'Ipswich Town', city: 'Ipswich', group: 'B', standIn: 'Burnley' },
  { code: 'HUL', name: 'Hull City', city: 'Hull', group: 'B', standIn: 'Wolverhampton' },
];

export const CLUBS_A = CLUBS.filter((c) => c.group === 'A');
export const CLUBS_B = CLUBS.filter((c) => c.group === 'B');

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
  { phase: 'Registration', sub: 'Open Sign-up', date: 'OPENS 09 AUG 2026 · 20:00', note: 'all twenty clubs · free to register', state: 'upcoming', justAnnounced: true },
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

// Registration has a window: it opens, then it closes. Both ends live here so
// the countdown, every CTA and every status label read the same two instants and
// cannot drift apart.
export const REGISTRATION_OPENS = new Date('2026-08-09T20:00:00+03:00').getTime();

// Display forms of the timestamp above, kept beside it for the same reason.
export const REGISTRATION_OPENS_LABEL = '09 AUG 2026';
export const REGISTRATION_OPENS_SHORT = 'AUG 09';
export const REGISTRATION_OPENS_TIME = '09 AUG 2026 · 20:00 EAT';

// There is deliberately NO closing instant, and no REGISTRATION_CLOSES constant
// to reintroduce one. Brackets close in two groups, each when its own draw is
// announced, and no date is ever published in advance — see CLAUDE.md.
// A countdown to a close, a "places remaining" counter or a published deadline
// would all contradict that, so the value they would read from does not exist.

/**
 * Whether each group's brackets have closed.
 *
 * Flipped by hand when that group's draw is announced, in the same edit that
 * publishes the draw — there is no date to schedule against, which is the point.
 * Group A (last season's top ten) closes first; Group B stays open after it, so
 * anyone knocked out of a Group A bracket can enter one there.
 */
export const GROUP_A_CLOSED = false;
export const GROUP_B_CLOSED = false;

export function groupIsClosed(group: ClubGroup): boolean {
  return group === 'A' ? GROUP_A_CLOSED : GROUP_B_CLOSED;
}

/**
 * Where we are in the registration window.
 *
 * Callers must not derive this during render without a mounted guard — see
 * useRegistrationPhase() — because server and client evaluate it at different
 * instants, and a disagreement across either boundary aborts hydration.
 */
export type RegistrationPhase = 'before' | 'open' | 'closed';

/**
 * Phase for one group's brackets.
 *
 * Time only decides the opening. Closing is a flag, not an instant, because no
 * closing date is ever published — a group closes when its draw is announced.
 */
export function registrationPhase(group: ClubGroup, now: number = Date.now()): RegistrationPhase {
  if (now < REGISTRATION_OPENS) return 'before';
  return groupIsClosed(group) ? 'closed' : 'open';
}

/** True while any bracket can still be entered — drives the site-wide CTAs. */
export function registrationIsOpen(now: number = Date.now()): boolean {
  return registrationPhase('A', now) === 'open' || registrationPhase('B', now) === 'open';
}

/**
 * The page has three states worth distinguishing: not yet open, open with
 * everything available, and open with only Group B left. Callers use this
 * instead of re-deriving the combination.
 */
export type SitePhase = 'before' | 'open' | 'group-b-only' | 'closed';

export function sitePhase(now: number = Date.now()): SitePhase {
  if (now < REGISTRATION_OPENS) return 'before';
  const a = !GROUP_A_CLOSED;
  const b = !GROUP_B_CLOSED;
  if (a && b) return 'open';
  if (b) return 'group-b-only';
  return 'closed';
}

/**
 * When the qualifiers begin, once that date is announced. null = still TBA,
 * matching the 'TBA' row in TIMELINE above — set both in the same edit.
 *
 * This is the deadline for changing a gamertag. It is not a policy preference:
 * matches.player_a / player_b and standings.player_tag hold the tag BY VALUE
 * with no foreign key, so a tag changed after a bracket is drawn leaves those
 * rows pointing at a handle that no longer exists.
 */
export const QUALIFIERS_BEGIN: number | null = null;

/**
 * Whether gamertags can still be changed.
 *
 * While the date is TBA this stays true, so players can settle on a handle
 * during the whole registration period. The API does NOT rely on this alone —
 * it also refuses once a tag appears in a bracket or the standings table, so
 * forgetting to set QUALIFIERS_BEGIN cannot corrupt a published bracket.
 *
 * Same hydration caveat as registrationPhase(): do not derive this during
 * render without a mounted guard once QUALIFIERS_BEGIN is an actual date.
 */
export function gamertagsEditable(now: number = Date.now()): boolean {
  return QUALIFIERS_BEGIN === null || now < QUALIFIERS_BEGIN;
}
