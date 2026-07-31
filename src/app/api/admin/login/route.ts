import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { setSession, clearSession } from '@/lib/session';
import { email as parseEmail, str } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// POST /api/admin/login  { email, password }
// Bootstrap admin via env (ADMIN_EMAIL / ADMIN_PASSWORD). For multiple staff
// accounts, TODO(dev): add an `admins` table with per-user password hashes.
function safeEqual(a: string, b: string): boolean {
  // Hash first so length is uniform — timingSafeEqual requires equal-length
  // inputs and a raw length check would itself leak the credential's length.
  const ah = crypto.createHash('sha256').update(a).digest();
  const bh = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}

// A single env credential guards the whole dashboard, so throttle guessing
// hard: 5 tries per IP per 15 minutes.
const LIMIT = { limit: 5, windowSec: 15 * 60 };

export async function POST(req: Request) {
  const rl = await rateLimit(`admin-login:ip:${clientIp(req)}`, LIMIT.limit, LIMIT.windowSec);
  if (!rl.ok) {
    const mins = Math.ceil(rl.retryAfter / 60);
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const mail = parseEmail(body.email);
  const pass = str(body.password, { max: 200 });
  const okEmail = process.env.ADMIN_EMAIL || '';
  const okPass = process.env.ADMIN_PASSWORD || '';

  if (!mail || !pass || !okEmail || !okPass || !safeEqual(mail, okEmail.toLowerCase()) || !safeEqual(pass, okPass)) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }
  setSession({ role: 'admin', sub: mail, iat: Date.now() });
  return NextResponse.json({ ok: true });
}

// POST via ?action=logout — simple logout.
export async function DELETE() {
  clearSession('admin');
  return NextResponse.json({ ok: true });
}
