// Privacy notice content.
//
// STATUS: the "Your identity number" section below is the wording supplied by
// NexGen and is reproduced verbatim, with ONE sentence appended — see the note
// on that section. Everything else is a factual description of what the code
// actually does, written from the schema and the API routes, and is marked for
// review. It is NOT legal drafting.
//
// Three things a lawyer must supply before this is complete; they are shown on
// the page as outstanding rather than invented here:
//   · the lawful basis for each purpose under Proclamation No. 1321/2024
//   · retention periods
//   · the controller's registered address and a data-protection contact
//
// Keep in step with db/schema.sql. If a column is added that holds personal
// data, it belongs in WHAT_WE_COLLECT in the same edit.

export interface PrivacySection { id: string; title: string; body: string[]; bullets?: string[]; note?: string }

export const PRIVACY_UPDATED = '05 August 2026';

export const PRIVACY_INTRO =
  'NexGen PLC ("we") runs ELECTROCUP 26. This notice explains what we collect when you ' +
  'register or contact us, why we collect it, and who can see it. It covers this website ' +
  'and the qualifier and season events we run.';

/** Shown prominently: parts of this notice are not settled yet. */
export const PRIVACY_INCOMPLETE =
  'This notice is published in part. The sections below describe accurately what we collect ' +
  'today and what we do with it. Retention periods, the legal basis for each purpose, and our ' +
  'formal data-protection contact are still being settled with our lawyers and will be added ' +
  'here. If you want any of that before you register, contact us and we will answer directly.';

export const PRIVACY: PrivacySection[] = [
  {
    id: 'identity',
    title: 'Your identity number',
    body: [
      'When you register we ask for your national identity number. We use it only to make sure the same person cannot enter more than once. We convert it immediately into an irreversible code and store only that code — we never store, log or share the number itself. At the Qualifier Center we check your photo ID in person and keep no copy or image of it.',
      'Alongside that code we keep the final four characters of the number, and nothing else from it. Officials use those four characters to tell two entries apart when someone speaks to us in person. The rest of the number is discarded the moment the code is produced, and the code cannot be turned back into it.',
    ],
    note: 'The first paragraph is the wording supplied by NexGen. The second was added so the notice matches what the system actually stores.',
  },
  {
    id: 'collect',
    title: 'What we collect',
    body: ['When you register for a qualifier we collect:'],
    bullets: [
      'your full name',
      'your email address',
      'your phone number',
      'your date of birth — used to apply the minimum age of 16, and to identify entrants aged 16 or 17 who need a guardian consent form',
      'the club you choose to represent, and the gamertag you pick from the options we offer',
      'your city, if you choose to give it',
      'the irreversible code and final four characters described above',
      'the date and time you accepted the competition rules and this notice',
      'a password, which is stored only in scrambled (hashed) form and cannot be read back',
    ],
  },
  {
    id: 'other',
    title: 'Other things we collect',
    body: ['Separately from registration:'],
    bullets: [
      'if you ask to be told when a phase is announced, we store your email address and nothing else',
      'if you submit an appeal, we store your name, email address and what you tell us',
      'if you make a partner enquiry, we store your company, contact name, email, phone and message',
      'when you sign in we email a one-time code; we store a scrambled version of that code, never the code itself, and delete it once used or expired',
      'we count requests against a short-lived key derived from your connection, to stop automated abuse of the sign-in form',
    ],
  },
  {
    id: 'why',
    title: 'Why we use it',
    body: ['We use what we collect to:'],
    bullets: [
      'run the competition — brackets, fixtures, standings and results',
      'confirm you are eligible to enter, and that you have entered only once',
      'contact you about your entry, your sessions and the tournament',
      'apply the rules, including investigating a protest or an appeal',
    ],
  },
  {
    id: 'who',
    title: 'Who can see it',
    body: [
      'NexGen staff running the competition can see your registration. Officials at a Qualifier Center see what they need in order to check you in and run your matches.',
      'We do not sell your information, and we do not share it with partners or sponsors for their own marketing.',
      'Two suppliers necessarily handle it in order for the site to work: the company that hosts the website and its database, and the email provider that delivers our messages to you. They act on our instructions.',
    ],
  },
  {
    id: 'broadcast',
    title: 'Filming and broadcast',
    body: [
      'Matches are streamed and recorded. If you take part, your name, gamertag, gameplay, voice and results may appear on broadcast and in coverage of the competition. Entrants aged 16 or 17 need a parent or guardian to consent to this before playing.',
    ],
  },
  {
    id: 'rights',
    title: 'Your choices',
    body: [
      'You can ask us what we hold about you, ask us to correct it, or ask us to delete it. Contact us and we will respond.',
      'Deleting your registration withdraws you from the competition — we cannot run a bracket without knowing who is in it.',
      'You can unsubscribe from announcement emails at any time without affecting your entry.',
    ],
  },
  {
    id: 'retention',
    title: 'How long we keep it',
    body: [
      'Not yet settled. Retention periods are being set with our lawyers and will be published here. Until then, we keep registration data for as long as it is needed to run ELECTROCUP 26.',
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    body: [
      'NexGen PLC, Addis Ababa, Ethiopia. Our formal data-protection contact details will be published here once confirmed. In the meantime, reply to any email we have sent you and it will reach the team.',
    ],
  },
];
