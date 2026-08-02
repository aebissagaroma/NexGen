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
  { phase: 'Bracket Draw', sub: 'Live Broadcast', date: 'TBA', note: 'Seeded by ELO · streamed', state: 'upcoming' },
  { phase: 'Qualifiers', sub: 'BO3 Knockouts', date: 'TBA', note: '20 winners surface', state: 'upcoming' },
  { phase: 'Draft Day', sub: 'Live Broadcast', date: 'TBA', note: 'Host venue · Addis Ababa', state: 'upcoming' },
  { phase: 'Gameweek 1', sub: 'Season Kickoff', date: 'TBA', note: '190 fixtures · 38 weeks', state: 'upcoming' },
  { phase: 'Cup Final', sub: 'Live Audience', date: 'TBA', note: 'Host venue · Addis Ababa', state: 'upcoming' },
];

export interface SponsorItem { name: string; sub: string; open: boolean; }
export interface SponsorTier { tier: string; code: string; seats: number; note: string; items: SponsorItem[]; }
export const SPONSORS_TIERS: SponsorTier[] = [
  { tier: 'Title Partner', code: 'T01', seats: 1, note: "Single naming-rights seat. Co-branded as 'NexGen × ___ presents ELECTROCUP 26'.", items: [{ name: 'TITLE SLOT OPEN', sub: 'Naming Rights · 1 Seat', open: true }] },
  { tier: 'Platinum', code: 'T02', seats: 3, note: 'Vehicle, telecom or banking category exclusivity.', items: [
    { name: 'PLATINUM SEAT 01', sub: 'Category Exclusive', open: true },
    { name: 'PLATINUM SEAT 02', sub: 'Category Exclusive', open: true },
    { name: 'PLATINUM SEAT 03', sub: 'Category Exclusive', open: true },
  ] },
  { tier: 'Gold', code: 'T03', seats: 4, note: 'Beverage, retail, hospitality, energy.', items: [
    { name: 'GOLD SEAT 01', sub: 'Open', open: true },
    { name: 'GOLD SEAT 02', sub: 'Open', open: true },
    { name: 'GOLD SEAT 03', sub: 'Open', open: true },
    { name: 'GOLD SEAT 04', sub: 'Open', open: true },
  ] },
  { tier: 'Broadcast', code: 'T04', seats: 4, note: 'Linear and streaming distribution partners.', items: [
    { name: 'BROADCAST SEAT 01', sub: 'Open', open: true },
    { name: 'BROADCAST SEAT 02', sub: 'Open', open: true },
    { name: 'BROADCAST SEAT 03', sub: 'Open', open: true },
    { name: 'BROADCAST SEAT 04', sub: 'Open', open: true },
  ] },
];

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
