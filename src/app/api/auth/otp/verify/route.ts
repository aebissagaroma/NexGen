import { NextResponse } from 'next/server';
import { verifyOtp, normalizePhone } from '@/lib/otp';
import { setSession } from '@/lib/session';
import { queryOne } from '@/lib/db';
import { code6 } from '@/lib/validation';

// POST /api/auth/otp/verify  { phone, code }
// On success: upserts the user, marks phone verified, sets the session cookie.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = normalizePhone(String(body.phone ?? ''));
  const code = code6(body.code);
  if (!phone || !code) {
    return NextResponse.json({ error: 'Phone and 6-digit code required.' }, { status: 400 });
  }

  const result = await verifyOtp(phone, code);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 400 });

  const user = await queryOne<{ id: string }>(
    `INSERT INTO users (phone, phone_verified) VALUES ($1, TRUE)
     ON CONFLICT (phone) DO UPDATE SET phone_verified = TRUE
     RETURNING id`,
    [phone],
  );

  setSession({ role: 'user', sub: user!.id, phone, iat: Date.now() });
  return NextResponse.json({ ok: true });
}
