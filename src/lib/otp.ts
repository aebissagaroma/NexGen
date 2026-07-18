// Phone OTP: generate → store hashed → verify. SMS delivery is stubbed.
//
// DEV MODE (no SMS_PROVIDER env set): the code is NOT sent by SMS. Instead it is
// logged to the server console and returned in the API response so you can test
// the whole flow locally. This is disabled automatically in production.
//
// TODO(dev): implement sendSms() against a real provider (Afromessage / GeezSMS /
// Twilio). Ethiopian numbers → an Ethiopian gateway is cheapest & most reliable.
import crypto from 'node:crypto';
import { query, queryOne } from './db';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

function hashCode(phone: string, code: string): string {
  return crypto
    .createHmac('sha256', process.env.SESSION_SECRET || 'dev')
    .update(`${phone}:${code}`)
    .digest('hex');
}

/** Normalise Ethiopian numbers to E.164 (+251…). Adjust for other regions. */
export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/[^\d+]/g, '');
  if (/^\+251\d{9}$/.test(d)) return d;
  if (/^251\d{9}$/.test(d)) return `+${d}`;
  if (/^0\d{9}$/.test(d)) return `+251${d.slice(1)}`;
  if (/^9\d{8}$/.test(d)) return `+251${d}`;
  return null;
}

async function sendSms(phone: string, message: string): Promise<void> {
  if (!process.env.SMS_PROVIDER) {
    // DEV: no provider configured — just log.
    console.log(`\n📱 [DEV OTP] to ${phone}: ${message}\n`);
    return;
  }
  // TODO(dev): real SMS integration, e.g.:
  //   await fetch('https://api.afromessage.com/api/send', { ... SMS_API_KEY ... });
  throw new Error('SMS_PROVIDER set but sendSms() not implemented — see src/lib/otp.ts');
}

const isDev = () => !process.env.SMS_PROVIDER && process.env.NODE_ENV !== 'production';

/** Create + "send" a code. Returns the code only in dev mode (else null). */
export async function requestOtp(phone: string): Promise<{ devCode: string | null }> {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const expires = new Date(Date.now() + OTP_TTL_MS);
  await query(
    `INSERT INTO otp_codes (phone, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [phone, hashCode(phone, code), expires],
  );
  await sendSms(phone, `Your ELECTROCUP code is ${code}. Valid 5 minutes.`);
  return { devCode: isDev() ? code : null };
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

/** Verify the most recent unconsumed code for a phone. */
export async function verifyOtp(phone: string, code: string): Promise<VerifyResult> {
  const row = await queryOne<{ id: string; code_hash: string; expires_at: string; attempts: number }>(
    `SELECT id, code_hash, expires_at, attempts FROM otp_codes
     WHERE phone = $1 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [phone],
  );
  if (!row) return { ok: false, reason: 'No code requested. Request a new one.' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'Code expired.' };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'Too many attempts. Request a new code.' };

  const match = crypto.timingSafeEqual(
    Buffer.from(row.code_hash),
    Buffer.from(hashCode(phone, code)),
  );
  if (!match) {
    await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
    return { ok: false, reason: 'Incorrect code.' };
  }
  await query(`UPDATE otp_codes SET consumed_at = now() WHERE id = $1`, [row.id]);
  return { ok: true };
}
