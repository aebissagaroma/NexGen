# CLAUDE.md — ELECTROCUP 26 site

This file is the single source of truth for competition decisions. It is maintained from planning conversations; do not contradict it, and do not invent alternatives to anything stated here. If a task conflicts with this file, flag the conflict instead of choosing.

## What this is

ELECTROCUP 26 — Ethiopia's first national FC league, organised by NexGen PLC (Addis Ababa). Twenty club slots, open qualifiers, a 38-gameweek round-robin season (380 fixtures), one champion decided by the league table. Grand prize: an electric car supplied by Kairos Addis Auto, currently SEALED — never name the make or model anywhere, including metadata.

## Registration model (current, decided)

- All twenty brackets open together: **09 Aug 2026, 20:00 EAT**. Both instants live in `static.ts`; every label reads from them.
- **No closing date is ever published.** No capacity limits, no places-remaining counters.
- Brackets close in two groups:
  - **GROUP A — closes first, when its draw is announced:** Arsenal, Manchester City, Manchester United, Aston Villa, Liverpool, Bournemouth, Sunderland, Brighton & Hove Albion, Brentford, Chelsea (last season's top ten).
  - **GROUP B — stays open after Group A closes, closes when its own draw is announced:** Fulham, Newcastle United, Everton, Leeds United, Crystal Palace, Nottingham Forest, Tottenham Hotspur, Coventry City, Ipswich Town, Hull City.
- **One entry at a time.** A person may hold one open bracket entry. A second entry is only permitted after elimination from a Group A bracket, into a still-open Group B bracket, with a second session fee. Enforce server-side against phone and ID-hash keys, not just email.
- Registration phase resolves at **request time**, never build time.
- Entry counts shown on club cards are **real database numbers only** — never placeholder, estimated or hard-coded.

## Clubs

- Club list follows the **current (2026/27) Premier League** — includes Coventry City, Ipswich Town, Hull City; excludes West Ham, Wolves, Burnley.
- Qualifiers are played on **EA SPORTS FC 26**; the season on **EA SPORTS FC 27**. The "26" in ELECTROCUP 26 / EC/26 / EDITION 01 is the edition number, not the game — never change those.
- The three promoted clubs are not in FC 26, so their qualifiers use a stand-in (the club each replaced): Coventry → West Ham United, Ipswich → Burnley, Hull → Wolverhampton. Players win the club slot itself and represent the real club from Gameweek 1.
- No club crests, kits, club colours or crest placeholders anywhere. Club names in plain text, site palette only.

## Fees

- Registration is free. A **qualifier session fee** is payable in advance of the session (venue, hardware, officials, production). Amount TBA — published before qualifiers begin. Second Group B entry costs a second fee. Season play is free. Never describe the competition as simply "free".

## Season

- Champion = first in the table after 38 gameweeks. The Cup Final is a live-audience presentation event, streamed — it does not decide the title. Never "televised".
- ELECTROCUP gameweeks follow their own calendar, not real Premier League fixtures.
- Never describe the season as "nine months".

## Legal and identity

- Footer on every page carries: the EA non-affiliation notice, the Premier League non-affiliation line, "Played on EA SPORTS FC 26 and EA SPORTS FC 27.", and "ELECTROCUP® is a registered trade mark of NexGen PLC, Ethiopia."
- Never use EA or EA SPORTS FC logos. Never imply endorsement by EA, the Premier League or any club.
- ID collection is **deferred by design**: nothing is collected at sign-up. Entrants confirm their entry with their national ID number **before the Group A draw**, via an authenticated confirm-your-entry flow. Unconfirmed entries are not included in the draw.
- When collected: hashed server-side only (HMAC-SHA256 keyed with `ID_HASH_SECRET`, via the existing `hashId()` in `src/lib/national-id.ts`), writing `id_hash`. The raw number is never stored, logged, returned, or sent to error reporting.
- Collision policy: if an ID hash matches an existing confirmed entry, the **earliest registration (by created_at) stands**; the later entry is marked void, with an appeal route. Do not disqualify both.
- Site copy must always say: the ID number is collected **before the bracket draw** to confirm the entry (never "at sign-up"); we store only an irreversible code, never the number itself; photo ID is checked in person at the Qualifier Center and no copy is kept.
- Eligibility: Ethiopia residents, 16+, guardian consent for 16–17, under-18 winners receive the prize via a parent/guardian.
- Prohibited sponsor categories: alcohol, betting/gambling, energy drinks, tobacco, cryptocurrency.
- Kairos Addis Auto is **Lead Partner / Official Vehicle Partner** (T01, FILLED). The competition name never includes a sponsor: always exactly "ELECTROCUP 26". NexGen PLC is the organiser and may appear anywhere ("NexGen PLC presents").

## Working conventions

- The club list lives in both `src/data/static.ts` and `db/seed.sql` — every club change must update both, with a migration so production data agrees.
- Never invent legal, rulebook or notice text — use wording provided verbatim, or flag that it's missing.
- Keep the existing visual style (gold #C8A24E on black, mono labels, FILE/xx sections).
- Changes are only done when they're live on **production** (nexgentournaments.com), not localhost — verify there.
- The rulebook draft, privacy notice and compliance checklist are maintained outside this repo; the /rulebook and /privacy pages must stay consistent with the decisions above.
