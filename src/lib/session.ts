// Stateless, signed session cookies (HMAC-SHA256). No session table needed.
// Two roles: 'user' (a verified player) and 'admin' (NexGen staff).
// A cookie value is `base64url(payload).signature`. Tampering fails verify.
import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type SessionRole = 'user' | 'admin';
export interface Session {
  role: SessionRole;
  sub: string;      // user id, or admin email
  email?: string;
  iat: number;
}

const COOKIE = { user: 'ec_session', admin: 'ec_admin' } as const;

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
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
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Session;
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
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function getSession(role: SessionRole): Session | null {
  const s = decode(cookies().get(COOKIE[role])?.value);
  return s && s.role === role ? s : null;
}

export function clearSession(role: SessionRole): void {
  cookies().delete(COOKIE[role]);
}
