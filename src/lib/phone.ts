// Phone canonicalisation.
//
// MUST stay in step with ec_phone_canon() in db/schema.sql — that function backs
// the uniq_reg_phone index, and this one only exists so the API can give a
// useful message before the database refuses the insert. If the two disagree,
// the pre-check waves through an entry the index then rejects with a raw
// constraint error.
//
// With the ID number no longer collected (rulebook 3.4), phone and email are
// what stand behind "one entry per player".

/**
 * '0911 234 567', '+251911234567', '251-911-234-567' and '(0911) 234567' all
 * reduce to '911234567'.
 *
 * Ethiopian mobile numbers are 9 digits after the country code, so a leading
 * '251' or '0' is dropped once digits are isolated. Anything else keeps all its
 * digits — that leaves a foreign number comparable to itself without pretending
 * to normalise a dialling plan we do not know.
 */
export function canonicalPhone(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('251')) return digits.slice(-9);
  if (digits.length === 10 && digits.startsWith('0')) return digits.slice(-9);
  return digits;
}

/** Enough digits to be a real number. Deliberately loose on format. */
export function isPlausiblePhone(raw: unknown): boolean {
  const c = canonicalPhone(raw);
  return c.length >= 9 && c.length <= 15;
}
