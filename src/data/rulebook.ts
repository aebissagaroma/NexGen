// The competition rules that are safe to publish today.
//
// This is a SUBSET of the full rulebook draft, which is a contract with every
// entrant and is still with counsel. Only the operational sections are here —
// how the competition is run — and every clause carrying a [LEGAL] marker in the
// draft is deliberately absent:
//
//   published : 5 Qualifiers · 6 Match rules · 8 Season · 9 Conduct
//   withheld  : 1 About · 2 Definitions · 3 Eligibility · 4 Registration and
//               fees · 7 Draft Day · 10 Disputes · 11 Prizes · 12 Filming, kit
//               and media · 13 Personal data · 14 Changes and cancellation
//
// Clause numbers are kept exactly as they are in the full draft. They must not
// be renumbered to close the gaps: an entrant reading "9.7" here and "9.7" in
// the finished rulebook has to find the same rule, and the site already cites
// specific numbers elsewhere.
//
// Keep this in step with the draft by hand. If a published clause is amended
// there, amend it here in the same edit.

export interface RuleClause { n: string; title?: string; body: string; bullets?: string[] }
export interface RuleSection { n: string; title: string; blurb: string; clauses: RuleClause[] }

export const RULEBOOK_EDITION = 'Edition 01 · Season 2026/27';

/** Shown at the top of /rulebook, so nobody mistakes a subset for the whole. */
export const RULEBOOK_STATUS =
  'These are the competition rules — how qualifiers, matches, the season and conduct are run. ' +
  'The remaining sections of the rulebook, covering eligibility, registration and fees, prizes, ' +
  'image rights and data protection, are with our lawyers and are published here once settled. ' +
  'Anything published on this page applies from the moment it appears.';

export const RULEBOOK: RuleSection[] = [
  {
    n: '5',
    title: 'Phase One — Qualifiers',
    blurb: 'Twenty single-elimination brackets, one per club slot.',
    clauses: [
      { n: '5.1', title: 'Format', body: 'Each of the twenty Brackets is a single-elimination knockout. Every Tie is best of three.' },
      { n: '5.2', title: 'Best of three', body: 'The winner of a Tie is the first entrant to win two matches. If each entrant wins one of the first two matches, a third match is played. If one entrant wins the first two matches, the Tie ends 2–0 and no third match is played.' },
      { n: '5.3', title: 'Preliminary round and byes', body: 'Byes are never allocated at random. Where the number of entrants in a Bracket is not a power of two, a preliminary round is played to reduce the field. The entrants who registered latest, by recorded registration time, play the preliminary Ties; earlier registrants advance directly to round one. Every entrant plays at least one Tie.' },
      { n: '5.4', title: 'The draw', body: 'Once registration closes, all twenty Brackets are drawn at random on a single live broadcast. The draw is not seeded.' },
      { n: '5.5', title: 'Venue', body: 'All matches are played in person at an official venue on tournament-supplied hardware. Remote or online play does not count at any stage.' },
      { n: '5.6', title: 'Attendance', body: 'Entrants must be present and signed in by the reporting time published for their round. An entrant who is not signed in within ten minutes of that time forfeits the Tie.' },
      { n: '5.7', title: 'Streaming', body: 'All matches may be streamed or recorded. The final three rounds of each Bracket are played on-site under Official supervision with recording enabled.' },
      { n: '5.8', title: 'Outcome', body: 'The winner of each Bracket wins the Club Slot for that club and progresses to Draft Day.' },
      { n: '5.9', title: 'Withdrawal', body: 'An entrant who withdraws after the draw forfeits their Tie. Where a Bracket winner withdraws before Draft Day, the Club Slot passes to the beaten finalist of that Bracket.' },
    ],
  },
  {
    n: '6',
    title: 'Match rules',
    blurb: 'Identical hardware and identical conditions, every match.',
    clauses: [
      { n: '6.1', title: 'Game and platform', body: 'EA SPORTS FC 26 on PlayStation 5, on hardware supplied by the Organiser.' },
      { n: '6.2', title: 'Game mode', body: 'Kick Off.' },
      { n: '6.3', title: 'Match settings', body: 'Half length, difficulty, game speed, extra time and penalties, squad and formation restrictions and custom tactics rules are published in full before qualifiers begin and are fixed for the duration of the Competition.' },
      { n: '6.4', title: 'Controllers', body: 'Tournament-supplied controllers are provided at every station. Entrants may instead use their own controller, subject to inspection and approval by an Official before the Tie begins. Controllers with macro, turbo or programmable functions are not permitted. An entrant whose own controller fails during a match continues on tournament-supplied hardware; the match is not restarted.' },
      { n: '6.5', title: 'Interruptions', body: 'If a match is interrupted by hardware or connection failure, it resumes from the recorded score and match time at the point of interruption. Matches are not restarted.' },
      { n: '6.6', title: 'Pausing', body: 'Each side may pause three times per half, only when the ball is out of play. One additional pause per half is allowed to the side that has received a red card in that match.' },
      { n: '6.7', title: 'Officials', body: "An Official's decision on the field of play is final and takes effect immediately. Challenges are made afterwards under section 9." },
    ],
  },
  {
    n: '8',
    title: 'Phase Three — Season',
    blurb: 'Twenty players, 380 fixtures, 38 gameweeks.',
    clauses: [
      { n: '8.1', title: 'Format', body: 'Twenty Players play each other home and away: 38 fixtures per Player, 380 fixtures in total, across 38 gameweeks of ten fixtures each.' },
      { n: '8.2', title: 'Points', body: 'Three points for a win, one for a draw, none for a defeat.' },
      { n: '8.3', title: 'Table order', body: 'Where two or more Players are level on points, position is decided in this order: goal difference; goals scored; head-to-head record between the Players concerned; fewest disciplinary points. Where the title or a prize-bearing position is still level after all four, a one-off decider match is played.' },
      { n: '8.4', title: 'Schedule and venue', body: 'All Season fixtures are played in person at an official venue on tournament-supplied hardware, under Official supervision. Online play does not count towards the table. Fixtures, venues and reporting times are published in advance.' },
      { n: '8.5', title: 'Availability', body: 'Players must be available for all 38 gameweeks. A Player who cannot attend must notify the Organiser at least 48 hours in advance. Shorter notice is accepted only in an emergency arising within that window, supported by evidence. All evidence is checked.' },
      { n: '8.6', title: 'No-shows', body: 'A Player who fails to appear without accepted notice forfeits the fixture, recorded as a 3–0 defeat.' },
      { n: '8.7', title: 'Withdrawal or removal mid-Season', body: 'A Player is treated as having left the Competition if they withdraw, are removed for a disciplinary reason, or forfeit three fixtures in the Season.' },
      { n: '8.7.1', body: 'Results already played always stand. They are never expunged from the table, the goal record or the top scorer race.' },
      { n: '8.7.2', body: 'Remaining fixtures are never awarded automatically. A vacant Club Slot is filled by a Replacement Play-Off.' },
      { n: '8.7.3', title: 'Replacement Play-Off', body: 'The beaten finalist and the two beaten semi-finalists of the Bracket that produced the vacant Club Slot are invited to a knockout play-off, best of three throughout, played on-site. The beaten finalist receives a bye to the play-off final. The winner takes the Club Slot.' },
      { n: '8.7.4', body: 'Where none of those three is available or willing, the Organiser invites the remaining quarter-finalists of that Bracket in the order they were eliminated.' },
      { n: '8.7.5', body: "The Replacement Player inherits the Club Slot's record — points, goals and disciplinary points to date — and plays all remaining fixtures. Fixtures falling due before the play-off concludes are rescheduled, not awarded." },
      { n: '8.7.6', body: 'A Replacement Player must play at least 19 Season fixtures to be eligible for the top scorer award.' },
      { n: '8.7.7', body: 'A Player who leaves without a reason accepted by the Organiser forfeits any prize or award and is excluded from the following edition of the Competition.' },
      { n: '8.8', title: 'Champion', body: 'The champion of ELECTROCUP 26 is the Player who finishes first in the league table after all 38 gameweeks. There is no play-off, final match or decider for the title.' },
      { n: '8.9', title: 'Cup Final event', body: 'The Cup Final is the closing live-audience event at which the final gameweek is played, the table is confirmed and prizes are presented. It is a showcase and presentation event and does not decide the title.' },
    ],
  },
  {
    n: '9',
    title: 'Conduct, integrity and anti-cheat',
    blurb: 'Improper conduct draws a warning, then disqualification. Cheating and double entry do not get a warning.',
    clauses: [
      { n: '9.1', body: 'Entrants and Players must not: use unauthorised hardware or software; exploit game defects; manipulate a result; agree a result in advance; play under another person’s identity; permit another person to play in their place; or place any bet on any Competition match.' },
      { n: '9.2', body: 'Abusive, discriminatory, threatening or harassing behaviour towards any person is prohibited, in venue and online.' },
      { n: '9.3', body: 'All matches may be recorded. Recordings are the basis of any review.' },
      { n: '9.4', title: 'Protests', body: 'A protest against a result must be submitted in writing within two hours of the match ending, by the entrant or Player concerned. The Organiser reviews the recording and issues a written decision.' },
      { n: '9.5', title: 'Sanctions', body: 'Depending on severity: warning, disciplinary points, forfeit of a match, deduction of league points, disqualification, forfeiture of prize, and exclusion from future editions.' },
      {
        n: '9.6',
        title: 'Improper conduct — warning, then disqualification',
        body: 'Improper conduct means behaviour that disrupts, delays or degrades the Competition for other people, without being an integrity breach under 9.7. It includes:',
        bullets: [
          'deliberate time-wasting, or misuse of the pause allowance in 6.6',
          'refusing or ignoring a reasonable instruction from an Official',
          "interfering with tournament hardware, another person's station, or the venue",
          'disruptive behaviour at a venue, on broadcast, or in Competition channels',
          'conduct under 9.2 that falls short of serious abuse',
        ],
      },
      { n: '9.6.1', body: 'On a first instance the Organiser issues a formal warning. On any subsequent instance of improper conduct, whether or not of the same kind, the entrant or Player is disqualified.' },
      { n: '9.6.2', body: 'A warning is recorded and given in writing, with the date and what it was for, and is sent to the person warned. A warning that was not recorded and communicated cannot be relied on to disqualify anyone.' },
      { n: '9.6.3', body: 'Warnings run for the whole Competition. A warning given during qualifiers still counts during the Season.' },
      { n: '9.6.4', body: 'Disqualification under 9.6.1 may be appealed. Where a Player is disqualified mid-Season, 8.7 applies: results already played stand, and the Club Slot is filled by a Replacement Play-Off.' },
      {
        n: '9.7',
        title: 'Immediate disqualification',
        body: 'The following are not subject to the warning stage in 9.6.1 and result in disqualification on a first instance:',
        bullets: [
          'anything prohibited by 9.1 — unauthorised hardware or software, exploiting game defects, manipulating or pre-agreeing a result, playing under another identity, letting someone else play in your place, or betting on a Competition match',
          'entering more than once, or under more than one identity',
          'serious abusive, discriminatory, threatening or harassing behaviour under 9.2',
          'providing false information in registration or at identity verification',
        ],
      },
      { n: '9.7.1', body: 'The reason for the distinction is that a warning only works where the person can correct their behaviour. Cheating, fixing and double entry are not lapses to be corrected — they are attempts to take something the rules exist to protect, and the first one is the offence.' },
    ],
  },
];
