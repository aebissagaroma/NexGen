// Verifies scrypt hashes in the shared format written by scripts/create-admin.mjs
// (and the main app's src/lib/password.ts): scrypt$N$r$p$<salt>$<hash>.
// Verify-only on purpose — admin accounts are created/reset by the script, so
// this app never needs to produce a hash.
import crypto from 'node:crypto';

const KEYLEN = 32;

function scrypt(password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEYLEN, { N: n, r, p, maxmem: 128 * 1024 * 1024 },
      (err, key) => (err ? reject(err) : resolve(key)));
  });
}

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

// Keeps unknown-email and no-password logins doing the same scrypt work as a
// real verification, so timing reveals nothing.
const DUMMY = `scrypt$16384$8$1$${crypto.randomBytes(16).toString('base64url')}$${crypto.randomBytes(KEYLEN).toString('base64url')}`;
