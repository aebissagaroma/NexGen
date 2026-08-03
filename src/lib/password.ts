// Password hashing on Node's built-in scrypt — no native/npm dependency.
// Stored format: scrypt$N$r$p$<salt b64url>$<hash b64url>, so the cost
// parameters travel with each hash and can be raised later without breaking
// existing rows (old hashes still verify with their recorded parameters).
import crypto from 'node:crypto';

const N = 16384, R = 8, P = 1, KEYLEN = 32;

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, { N: n, r, p, maxmem: 128 * 1024 * 1024 },
      (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, N, R, P);
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

/**
 * Verify a password against a stored hash. `stored` may be null/undefined
 * (account that never set a password) — verification runs against a dummy hash
 * so callers don't leak "account exists but has no password" through timing.
 */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  const target = stored || DUMMY;
  const parts = target.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  try {
    const expected = Buffer.from(hashB64, 'base64url');
    const actual = await scrypt(password, Buffer.from(saltB64, 'base64url'), Number(n), Number(r), Number(p));
    const match = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
    return match && Boolean(stored);
  } catch {
    return false;
  }
}

// Real scrypt output for a random unknowable input — keeps the no-account and
// no-password paths doing the same work as a genuine verification.
const DUMMY = `scrypt$${N}$${R}$${P}$${crypto.randomBytes(16).toString('base64url')}$${crypto.randomBytes(KEYLEN).toString('base64url')}`;
