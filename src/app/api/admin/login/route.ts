import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { setSession, clearSession } from '@/lib/session';
import { email as parseEmail, str } from '@/lib/validation';

// POST /api/admin/login  { email, password }
// Bootstrap admin via env (ADMIN_EMAIL / ADMIN_PASSWORD). For multiple staff
// accounts, TODO(dev): add an `admins` table with per-user password hashes.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: Request) {
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
