import { NextResponse } from 'next/server';
import { verifyOtp, normalizeEmail } from '@/lib/otp';
import { hashPassword } from '@/lib/password';
import { setSession, issueSessionToken, type Session } from '@/lib/session';
import { queryOne } from '@/lib/db';
import { code6, str } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// POST /api/auth/password/reset  { email, code, newPassword }
// Forgot-password (and first-password for accounts that pre-date passwords):
// step 1 is the existing /api/auth/otp/request; this is step 2 — prove the
// emailed code, set the new password, and sign the player in.
export async function POST(req: Request) {
  const rl = await rateLimit(`pw-reset:ip:${clientIp(req)}`, 20, 15 * 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ''));
  const code = code6(body.code);
  const password = str(body.newPassword, { min: 8, max: 200 });
  if (!email || !code) {
    return NextResponse.json({ error: 'Email and 6-digit code required.' }, { status: 400 });
  }
  if (!password) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  // Guess-proofing lives in verifyOtp: 5 attempts per code, 5-min TTL, single use.
  const result = await verifyOtp(email, code);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });

  const hash = await hashPassword(password);
  // Upsert like otp/verify does — the code proved address ownership, so an
  // account that somehow lacks a row (or holds an alias) still ends up usable.
  const user = await queryOne<{ id: string; email: string }>(
    `INSERT INTO users (email, email_verified, password_hash) VALUES ($1, TRUE, $2)
     ON CONFLICT (email) DO UPDATE SET email_verified = TRUE, password_hash = $2
     RETURNING id, email`,
    [email, hash],
  );

  const session: Session = { role: 'user', sub: user!.id, email: user!.email, iat: Date.now() };
  setSession(session);
  return NextResponse.json({ ok: true, token: issueSessionToken(session) });
}
