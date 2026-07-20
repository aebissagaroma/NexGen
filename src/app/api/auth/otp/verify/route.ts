import { NextResponse } from 'next/server';
import { verifyOtp, normalizeEmail } from '@/lib/otp';
import { setSession, issueSessionToken, type Session } from '@/lib/session';
import { queryOne } from '@/lib/db';
import { code6 } from '@/lib/validation';

// POST /api/auth/otp/verify  { email, code }
// On success: upserts the user, marks email verified, sets the session cookie.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ''));
  const code = code6(body.code);
  if (!email || !code) {
    return NextResponse.json({ error: 'Email and 6-digit code required.' }, { status: 400 });
  }

  const result = await verifyOtp(email, code);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });

  const user = await queryOne<{ id: string }>(
    `INSERT INTO users (email, email_verified) VALUES ($1, TRUE)
     ON CONFLICT (email) DO UPDATE SET email_verified = TRUE
     RETURNING id`,
    [email],
  );

  const session: Session = { role: 'user', sub: user!.id, email, iat: Date.now() };
  setSession(session); // web: httpOnly cookie
  // Native clients can't read httpOnly cookies, so also return the token in the
  // body; the mobile client (src/lib/api.ts) stores it and resends it as a
  // Cookie header. Harmless for web, which ignores it and uses the cookie.
  return NextResponse.json({ ok: true, token: issueSessionToken(session) });
}
