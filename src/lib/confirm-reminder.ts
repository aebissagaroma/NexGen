// Reminder that an entry still needs confirming before its draw.
//
// The rule this enforces is unforgiving — an unconfirmed entry is left out of
// the draw — so the reminder has to be unambiguous about the consequence and
// about what confirming actually involves. Someone who reads it and decides not
// to hand over an ID number should be able to make that choice knowingly, not
// discover it on draw day.
//
// Deliberately plain text and free of urgency devices. This message asks about
// an identity document, which is exactly the shape a scam takes, so it names
// the only address the site is served from and repeats what we never ask for.
// See src/app/official-channels/page.tsx.

export const CONFIRM_URL = 'https://www.nexgentournaments.com/confirm-entry';

export interface ReminderInput {
  fullName: string;
  clubCode: string;
  /** Set once that group's draw date is announced; omitted while it is not. */
  drawLabel?: string;
}

export function confirmReminderSubject(clubCode: string): string {
  return `Confirm your ELECTROCUP 26 entry (${clubCode}) before the draw`;
}

export function confirmReminderBody({ fullName, clubCode, drawLabel }: ReminderInput): string {
  return [
    `${fullName},`,
    '',
    `Your ELECTROCUP 26 entry for ${clubCode} is registered but NOT yet confirmed.`,
    '',
    drawLabel
      ? `Confirm it before the draw on ${drawLabel}. Entries that are not confirmed`
      : 'Confirm it before your bracket draw is announced. Entries that are not confirmed',
    'by then are not included in the draw.',
    '',
    'Confirm here:',
    CONFIRM_URL,
    '',
    'It takes one step: you enter your national ID number once. We convert it',
    'immediately into an irreversible code and store only that code — we never',
    'store, log or share the number itself. Photo ID is checked in person at the',
    'Qualifier Center and no copy or image is kept.',
    '',
    'HOW TO KNOW THIS IS REALLY US',
    `Confirmation happens only at ${CONFIRM_URL}`,
    'We will never ask for your ID number by direct message or phone call.',
    'We will never ask for your password, a verification code, or a bank or',
    'mobile money PIN. We will never ask you to pay through a personal account.',
    '',
    '— NexGen PLC, Addis Ababa',
  ].join('\n');
}
