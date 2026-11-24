// Staff sessions: stateless signed cookies (HMAC-SHA256), 12-hour expiry
// enforced server-side from the signed `iat`. Same construction as the main
// site's sessions, but a different cookie name and an independent secret, so
// neither app can mint sessions for the other.
import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export function adminSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  const placeholder = !s || s === 'change-me-to-a-long-random-string';
  if (placeholder) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_SESSION_SECRET must be set to a strong random value in production.');
    }
    return 'dev-insecure-admin-secret';
  }
  return s;
}

export interface AdminSession {
  sub: string;        // admins.id
  email: string;
  role: 'owner' | 'staff';
  iat: number;
}

const COOKIE = 'eca_session';
const MAX_AGE_SEC = 60 * 60 * 12; // staff re-auth daily; the panel edits live data

function sign(payload: string): string {
  return crypto.createHmac('sha256', adminSecret()).update(payload).digest('base64url');
}

export function setAdminSession(session: AdminSession): void {
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  cookies().set(COOKIE, `${body}.${sign(body)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: MAX_AGE_SEC,
  });
}

export function getAdminSession(): AdminSession | null {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AdminSession;
    if (typeof s.iat !== 'number') return null;
    if (Date.now() - s.iat > MAX_AGE_SEC * 1000) return null;
    return s;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  cookies().delete(COOKIE);
}
