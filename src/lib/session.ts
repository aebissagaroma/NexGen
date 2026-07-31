// Stateless, signed session cookies (HMAC-SHA256). No session table needed.
// Two roles: 'user' (a verified player) and 'admin' (NexGen staff).
// A cookie value is `base64url(payload).signature`. Tampering fails verify.
//
// Expiry is enforced SERVER-SIDE from the signed `iat` claim, not just via
// cookie maxAge — a leaked token (e.g. from a lost phone, where the native app
// stores the raw value) goes stale on schedule no matter what the client does.
import crypto from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Signing secret. In production a real value is mandatory — the dev fallback
 * would let anyone mint valid sessions, so we hard-fail instead of degrading.
 */
export function sessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  const isPlaceholder = !s || s === 'change-me-to-a-long-random-string';
  if (isPlaceholder) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set to a strong random value in production.');
    }
    return 'dev-insecure-secret-change-me';
  }
  return s;
}

export type SessionRole = 'user' | 'admin';
export interface Session {
  role: SessionRole;
  sub: string;      // user id, or admin email
  email?: string;
  iat: number;
}

// Admin sessions are short-lived: that cookie can edit registrations and export
// player PII, and staff sign in rarely enough that re-auth is cheap insurance.
const MAX_AGE_SEC: Record<SessionRole, number> = {
  user: 60 * 60 * 24 * 30, // 30 days
  admin: 60 * 60 * 12,     // 12 hours
};

const COOKIE = { user: 'ec_session', admin: 'ec_admin' } as const;

function sign(payload: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function encode(session: Session): string {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${body}.${sign(body)}`;
}

function decode(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Session;
    if (typeof s.iat !== 'number' || !(s.role in MAX_AGE_SEC)) return null;
    // Server-side expiry — reject tokens older than their role allows.
    if (Date.now() - s.iat > MAX_AGE_SEC[s.role] * 1000) return null;
    return s;
  } catch {
    return null;
  }
}

/**
 * Produce the raw signed token for a session — identical to the cookie value.
 * Native clients (React Native) can't read httpOnly cookies, so the mobile app
 * stores this token and sends it back as a `Cookie: ec_session=<token>` header,
 * which getSession() reads transparently. Web keeps using the cookie set below.
 */
export function issueSessionToken(session: Session): string {
  return encode(session);
}

export function setSession(session: Session): void {
  const name = COOKIE[session.role];
  cookies().set(name, encode(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Admin gets 'strict' (no cross-site sends at all); players keep 'lax' so
    // e.g. an emailed link into the site still carries their session.
    sameSite: session.role === 'admin' ? 'strict' : 'lax',
    path: '/',
    maxAge: MAX_AGE_SEC[session.role],
  });
}

export function getSession(role: SessionRole): Session | null {
  const s = decode(cookies().get(COOKIE[role])?.value);
  return s && s.role === role ? s : null;
}

export function clearSession(role: SessionRole): void {
  cookies().delete(COOKIE[role]);
}
