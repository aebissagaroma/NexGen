// Email OTP: generate → store hashed → verify. Delivery via SMTP (nodemailer).
//
// DEV MODE (no SMTP_HOST env set): the code is NOT emailed. Instead it is logged
// to the server console and returned in the API response so you can test the
// whole flow locally. This is disabled automatically in production.
//
// To send real email, set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS /
// SMTP_FROM (e.g. a Gmail app password or a Brevo SMTP key) — see .env.example.
import crypto from 'node:crypto';
import { query, queryOne } from './db';
import { sessionSecret } from './session';
import { sendMail } from './mailer';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string): string {
  return crypto
    .createHmac('sha256', sessionSecret())
    .update(`${email}:${code}`)
    .digest('hex');
}

/** Normalise an email to a canonical lowercase form, or null if invalid. */
export function normalizeEmail(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (s.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

// Transport lives in lib/mailer.ts so OTP codes and appeal notifications share
// one connection instead of building a pool each.
async function sendEmail(to: string, code: string): Promise<void> {
  await sendMail({
    to,
    subject: 'Your ELECTROCUP verification code',
    text: `Your ELECTROCUP code is ${code}. It is valid for 5 minutes.`,
    html: `<p>Your ELECTROCUP code is <strong style="font-size:20px;letter-spacing:2px">${code}</strong>.</p><p>It is valid for 5 minutes.</p>`,
  });
}

const isDev = () => !process.env.SMTP_HOST && process.env.NODE_ENV !== 'production';

/**
 * The code was stored but could not be delivered (provider down, quota hit, bad
 * credentials). Callers should surface a retryable error, not a generic 500.
 */
export class OtpDeliveryError extends Error {
  constructor(public readonly cause: unknown) {
    super('Failed to deliver the verification code.');
    this.name = 'OtpDeliveryError';
  }
}

/** Create + "send" a code. Returns the code only in dev mode (else null). */
export async function requestOtp(email: string): Promise<{ devCode: string | null }> {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const expires = new Date(Date.now() + OTP_TTL_MS);

  // Drop this address's spent/expired codes so the table doesn't grow one row
  // per attempt forever. Uses idx_otp_email.
  await query(
    `DELETE FROM otp_codes
     WHERE email = $1 AND (expires_at < now() OR consumed_at IS NOT NULL)`,
    [email],
  );

  const row = await queryOne<{ id: string }>(
    `INSERT INTO otp_codes (email, code_hash, expires_at) VALUES ($1, $2, $3) RETURNING id`,
    [email, hashCode(email, code), expires],
  );

  try {
    await sendEmail(email, code);
  } catch (e) {
    // Delivery failed — remove the code rather than leaving one the user can
    // never receive (it would otherwise block/confuse their next attempt).
    await query(`DELETE FROM otp_codes WHERE id = $1`, [row!.id]).catch(() => {});
    console.error('[otp] delivery failed:', e);
    throw new OtpDeliveryError(e);
  }

  return { devCode: isDev() ? code : null };
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

/** Verify the most recent unconsumed code for an email. */
export async function verifyOtp(email: string, code: string): Promise<VerifyResult> {
  const row = await queryOne<{ id: string; code_hash: string; expires_at: string }>(
    `SELECT id, code_hash, expires_at FROM otp_codes
     WHERE email = $1 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [email],
  );
  if (!row) return { ok: false, reason: 'No code requested. Request a new one.' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'Code expired.' };

  // Spend an attempt BEFORE checking the guess. The increment is atomic, so
  // parallel requests can't each read a low counter and exceed the cap
  // (read-then-increment would allow more than MAX_ATTEMPTS guesses).
  const spent = await queryOne<{ attempts: number }>(
    `UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1 RETURNING attempts`,
    [row.id],
  );
  if (!spent || spent.attempts > MAX_ATTEMPTS) {
    return { ok: false, reason: 'Too many attempts. Request a new code.' };
  }

  const match = crypto.timingSafeEqual(
    Buffer.from(row.code_hash),
    Buffer.from(hashCode(email, code)),
  );
  if (!match) return { ok: false, reason: 'Incorrect code.' };

  // Single-use: only the first correct verify wins the consume; a concurrent
  // duplicate sees consumed_at set and is rejected.
  const consumed = await queryOne<{ id: string }>(
    `UPDATE otp_codes SET consumed_at = now()
     WHERE id = $1 AND consumed_at IS NULL RETURNING id`,
    [row.id],
  );
  if (!consumed) return { ok: false, reason: 'Code already used. Request a new one.' };
  return { ok: true };
}
