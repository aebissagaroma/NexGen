// Age gate for registration.
//
// Entry is 16+. Entrants aged 16 or 17 may register but need a signed guardian
// consent form before they play, so the exact age matters at sign-up, not just
// "old enough".

export const MIN_AGE = 16;
export const ADULT_AGE = 18;

/**
 * Whole years between `dob` and `on`, by calendar date.
 *
 * Not derived from milliseconds: a year is not a fixed number of days, and
 * dividing by 365.25 puts people born on a leap day, or within a day of their
 * birthday, on the wrong side of the boundary. This compares month and day
 * directly, so someone turning 16 today is 16 today.
 */
export function ageOn(dob: Date, on: Date = new Date()): number {
  let age = on.getFullYear() - dob.getFullYear();
  const monthDiff = on.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && on.getDate() < dob.getDate())) age -= 1;
  return age;
}

/** Parses a yyyy-mm-dd date input, or null if it is not a real past date. */
export function parseDob(raw: unknown): Date | null {
  if (typeof raw !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  // Rejects 31 February and similar: the constructor rolls those forward, so a
  // valid date is one that survives the round trip unchanged.
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(mo) - 1 ||
    date.getUTCDate() !== Number(d)
  ) return null;
  if (date.getTime() > Date.now()) return null;
  // Nobody registering is 120. Catches a mistyped year rather than trusting it.
  if (ageOn(date) > 120) return null;
  return date;
}

export interface AgeCheck {
  ok: boolean;
  age: number;
  /** 16 or 17: may register, but needs a guardian consent form before playing. */
  needsGuardianConsent: boolean;
}

export function checkAge(dob: Date, on: Date = new Date()): AgeCheck {
  const age = ageOn(dob, on);
  return {
    ok: age >= MIN_AGE,
    age,
    needsGuardianConsent: age >= MIN_AGE && age < ADULT_AGE,
  };
}

export const GUARDIAN_NOTICE =
  "You'll need a parent or guardian consent form signed before you can play. We'll email it to you.";
