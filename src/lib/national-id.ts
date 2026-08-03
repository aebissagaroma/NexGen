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
import { sessionSecret } from './session';

/**
 * Secret for the ID HMAC.
 *
 * IMPORTANT: changing this value orphans every existing hash — previously
 * registered IDs would stop matching and the same person could enter a second
 * time. It falls back to SESSION_SECRET so no new environment variable is
 * required to deploy, but that couples the two: rotating SESSION_SECRET (e.g.
 * after a leak) also resets duplicate detection. Set ID_HASH_SECRET to a
 * separate, stable random value to decouple them.
 */
function idSecret(): string {
  return process.env.ID_HASH_SECRET || sessionSecret();
}

/**
 * Canonical form of an ID number: uppercase, punctuation and spaces removed, so
 * "MN 1234-5678", "mn12345678" and "MN-1234 5678" are recognised as one person.
 * Returns null if it cannot plausibly be an ID.
 *
 * Kept deliberately loose on format — Ethiopian registrants may present a Fayda
 * national ID, a Kebele card or a passport, and rejecting an unfamiliar but
 * valid document would lock a real player out of the tournament.
 */
export function canonicalId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const t = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (t.length < 5 || t.length > 30) return null;
  return t;
}

/** Irreversible, stable key for the uniqueness index. */
export function hashId(canonical: string): string {
  return crypto.createHmac('sha256', idSecret()).update(`id:${canonical}`).digest('hex');
}

/** Last four characters, shown to admins to distinguish two entries. */
export function idLast4(canonical: string): string {
  return canonical.slice(-4);
}
