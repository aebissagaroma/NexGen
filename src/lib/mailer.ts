// Shared SMTP transport. Extracted from lib/otp.ts so appeals and OTP codes go
// through one lazily-built, reused connection rather than a pool each.
//
// DEV MODE (no SMTP_HOST): nothing is sent, the message is logged instead. That
// is what lets the whole registration flow be exercised locally without a mail
// server — and what stops tests emailing real people.
import nodemailer from 'nodemailer';

let transport: nodemailer.Transporter | null | undefined;

/** The configured transport, or null when SMTP is not set up (dev). */
export function getTransport(): nodemailer.Transporter | null {
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

export function mailFrom(): string {
  return process.env.SMTP_FROM || 'ELECTROCUP <no-reply@electrocup.com>';
}

/** Where staff notifications go. Falls back to the from-address. */
export function opsAddress(): string {
  return process.env.OPS_EMAIL || process.env.SMTP_FROM || '';
}

/**
 * Whether to email staff on every single registration. The daily summary runs
 * regardless, so this can be turned off if per-entry mail gets noisy during a
 * launch spike (or bumps into the provider's sending limits).
 */
export function notifyEachRegistration(): boolean {
  return process.env.OPS_NOTIFY_EACH !== 'false';
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send a message. Resolves without sending when SMTP is unconfigured.
 * Throws on delivery failure — callers decide whether that is fatal.
 */
export async function sendMail(mail: Mail): Promise<void> {
  const t = getTransport();
  if (!t) {
    console.log(`\n📧 [DEV MAIL] to ${mail.to}: ${mail.subject}\n${mail.text}\n`);
    return;
  }
  await t.sendMail({ from: mailFrom(), ...mail });
}

/** How long a staff notification may hold up the request that triggered it. */
const OPS_TIMEOUT_MS = 8000;

/**
 * Tell staff something happened, without ever letting that failure reach the
 * player. Used for new registrations and appeals.
 *
 * Bounded by a timeout because it runs inside the player's request: a slow or
 * unreachable mail server has been observed taking ~90s per send, and a player
 * must never wait on that — still less lose a registration because of it. The
 * underlying send is left running; it simply stops being awaited.
 *
 * Returns true only if the message was handed to the transport in time.
 */
export async function notifyOps(subject: string, text: string): Promise<boolean> {
  const to = opsAddress();
  if (!to) {
    console.warn('[mailer] no OPS_EMAIL or SMTP_FROM set — staff notification skipped:', subject);
    return false;
  }
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      sendMail({ to, subject, text }),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`timed out after ${OPS_TIMEOUT_MS}ms`)), OPS_TIMEOUT_MS);
      }),
    ]);
    return true;
  } catch (e) {
    console.error(`[mailer] staff notification failed (${subject}):`, e);
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
