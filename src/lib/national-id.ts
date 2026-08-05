// Identity document handling for registration.
//
// The ID number is what stops one person entering twice, but it is also the most
// sensitive thing we collect. So the raw number is NEVER stored: we keep an HMAC
// of it (for the uniqueness check) plus the last four characters (so ops can tell
// two entries apart at a Qualifier Center without us holding the full number).
//
// A leak of the registrations table therefore leaks neither ID numbers nor
// anything that can be reversed into one.
import crypto from 'node:crypto';

/**
 * Secret for the ID HMAC. Required — there is deliberately NO fallback.
 *
 * It previously fell back to SESSION_SECRET so that no new variable was needed
 * to deploy. That was worse than it looked: rotating SESSION_SECRET, which is
 * exactly what you do after a leak, would silently orphan every existing hash
 * and let already-registered people enter a second time. The failure was silent
 * and looked like nothing at all.
 *
 * So a missing value throws. A registration that cannot be de-duplicated is not
 * a registration worth taking, and an outage on the first request is a problem
 * someone fixes in minutes — a broken uniqueness guarantee is one nobody
 * notices until the disqualifications start.
 *
 * IMPORTANT: once entries exist, changing this value orphans every hash already
 * stored. Set it once, keep it stable for the whole tournament.
 */
function idSecret(): string {
  const s = process.env.ID_HASH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'ID_HASH_SECRET is not set (or is shorter than 16 characters). Registration ' +
      'cannot de-duplicate entries without it. Set it to a long random value and ' +
      'keep it stable for the whole tournament — changing it later orphans every ' +
      'ID hash already stored.',
    );
  }
  return s;
}

/**
 * Hash scheme version, stored as a prefix on every digest.
 *
 * Lets a future algorithm change coexist with rows already written: new entries
 * get v2$, old rows keep v1$, and a lookup can try both without a rewrite of the
 * table. The separator is '$' because it never occurs in hex.
 */
export const ID_HASH_SCHEME = 'v1';

/**
 * Canonical form of an ID number: uppercase, with spaces, dashes, dots and every
 * other non-alphanumeric character stripped — so "MN 1234-5678", "mn12345678"
 * and "MN-1234 5678" are one person.
 *
 * Returns null if it cannot plausibly be an ID. Kept deliberately loose on
 * format — Ethiopian registrants may present a Fayda national ID, a Kebele card
 * or a passport, and rejecting an unfamiliar but valid document would lock a
 * real player out of the tournament. The checks below only reject input that
 * cannot be any of those.
 */
export function canonicalId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (t.length < 6 || t.length > 30) return null;
  // Every real document number carries digits; a purely alphabetic string is a
  // name or a typed word, not an ID.
  if (!/[0-9]/.test(t)) return null;
  // '000000', 'AAAAAAAA', '11111111' — a filled-in field, not a document.
  if (/^(.)\1+$/.test(t)) return null;
  return t;
}

/**
 * Irreversible, stable key for the uniqueness index.
 *
 * HMAC-SHA256 with ID_HASH_SECRET as the KEY — not a plain digest, and not the
 * secret concatenated onto the input. Keying it means an attacker holding the
 * table still cannot test candidate ID numbers offline without also holding the
 * secret, which concatenation would not achieve against length-extension and
 * offline guessing.
 *
 * Returns 'v1$<hex>'. Always pass a value from canonicalId() — hashing a raw
 * string would key on formatting and let the same person enter twice.
 */
export function hashId(canonical: string): string {
  const digest = crypto.createHmac('sha256', idSecret()).update(`id:${canonical}`).digest('hex');
  return `${ID_HASH_SCHEME}$${digest}`;
}

/** Last four characters, shown to admins to distinguish two entries. */
export function idLast4(canonical: string): string {
  return canonical.slice(-4);
}
