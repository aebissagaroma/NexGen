// Email OTP: generate → store hashed → verify. Delivery via SMTP (nodemailer).
//
// DEV MODE (no SMTP_HOST env set): the code is NOT emailed. Instead it is logged
// to the server console and returned in the API response so you can test the
// whole flow locally. This is disabled automatically in production.
//
// To send real email, set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS /
// SMTP_FROM (e.g. a Gmail app password or a Brevo SMTP key) — see .env.example.
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { query, queryOne } from './db';

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

function hashCode(email: string, code: string): string {
  return crypto
    .createHmac('sha256', process.env.SESSION_SECRET || 'dev')
    .update(`${email}:${code}`)
    .digest('hex');
}

/** Normalise an email to a canonical lowercase form, or null if invalid. */
export function normalizeEmail(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (s.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : null;
}

// Lazily-built, reused SMTP transport (undefined in dev / when unconfigured).
let transport: nodemailer.Transporter | null | undefined;
function getTransport(): nodemailer.Transporter | null {
  if (transport !== undefined) return transport;
  const host = process.env.SMTP_HOST;
  if (!host) return (transport = null);
  const port = Number(process.env.SMTP_PORT || 587);
  transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transport;
}

async function sendEmail(to: string, code: string): Promise<void> {
  const t = getTransport();
  if (!t) {
    // DEV: no SMTP configured — just log.
    console.log(`\n📧 [DEV OTP] to ${to}: ${code}\n`);
    return;
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || 'ELECTROCUP <no-reply@electrocup.com>',
    to,
    subject: 'Your ELECTROCUP verification code',
    text: `Your ELECTROCUP code is ${code}. It is valid for 5 minutes.`,
    html: `<p>Your ELECTROCUP code is <strong style="font-size:20px;letter-spacing:2px">${code}</strong>.</p><p>It is valid for 5 minutes.</p>`,
  });
}

const isDev = () => !process.env.SMTP_HOST && process.env.NODE_ENV !== 'production';

/** Create + "send" a code. Returns the code only in dev mode (else null). */
export async function requestOtp(email: string): Promise<{ devCode: string | null }> {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const expires = new Date(Date.now() + OTP_TTL_MS);
  await query(
    `INSERT INTO otp_codes (email, code_hash, expires_at) VALUES ($1, $2, $3)`,
    [email, hashCode(email, code), expires],
  );
  await sendEmail(email, code);
  return { devCode: isDev() ? code : null };
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

/** Verify the most recent unconsumed code for an email. */
export async function verifyOtp(email: string, code: string): Promise<VerifyResult> {
  const row = await queryOne<{ id: string; code_hash: string; expires_at: string; attempts: number }>(
    `SELECT id, code_hash, expires_at, attempts FROM otp_codes
     WHERE email = $1 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [email],
  );
  if (!row) return { ok: false, reason: 'No code requested. Request a new one.' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'Code expired.' };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'Too many attempts. Request a new code.' };

  const match = crypto.timingSafeEqual(
    Buffer.from(row.code_hash),
    Buffer.from(hashCode(email, code)),
  );
  if (!match) {
    await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [row.id]);
    return { ok: false, reason: 'Incorrect code.' };
  }
  await query(`UPDATE otp_codes SET consumed_at = now() WHERE id = $1`, [row.id]);
  return { ok: true };
}
