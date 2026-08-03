import { NextResponse } from 'next/server';
import { normalizeEmail } from '@/lib/otp';
import { verifyPassword } from '@/lib/password';
import { setSession, issueSessionToken, type Session } from '@/lib/session';
import { queryOne } from '@/lib/db';
import { str } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// POST /api/auth/login  { email, password }
// Password sign-in for returning players — costs no OTP email. The response
// mirrors /api/auth/otp/verify (cookie + token in body) so the mobile app can
// persist the session the same way.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ''));
  const password = str(body.password, { max: 200 });
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
  }

  // Two windows: per-address stops targeting one account, per-IP bounds a spray.
  const byEmail = await rateLimit(`login:email:${email}`, 10, 15 * 60);
  const byIp = byEmail.ok ? await rateLimit(`login:ip:${clientIp(req)}`, 30, 15 * 60) : byEmail;
  const blocked = !byEmail.ok ? byEmail : !byIp.ok ? byIp : null;
  if (blocked) {
    const mins = Math.ceil(blocked.retryAfter / 60);
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` },
      { status: 429, headers: { 'Retry-After': String(blocked.retryAfter) } },
    );
  }

  // Canonical match so gmail-alias forms of the registered address still sign
  // in (consistent with how registration dedupes).
  const user = await queryOne<{ id: string; email: string; password_hash: string | null }>(
    `SELECT id, email, password_hash FROM users
     WHERE ec_email_canon(email) = ec_email_canon($1) LIMIT 1`,
    [email],
  );

  // verifyPassword runs a real scrypt round even when the user or hash is
  // missing, and the error below never says which part was wrong.
  const ok = await verifyPassword(password, user?.password_hash);
  if (!ok || !user) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const session: Session = { role: 'user', sub: user.id, email: user.email, iat: Date.now() };
  setSession(session);
  return NextResponse.json({ ok: true, token: issueSessionToken(session) });
}
