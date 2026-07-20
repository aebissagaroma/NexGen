import { NextResponse } from 'next/server';
import { requestOtp, normalizeEmail } from '@/lib/otp';

// POST /api/auth/otp/request  { email }
// Sends (or in dev, returns) a 6-digit code.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ''));
  if (!email) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  const { devCode } = await requestOtp(email);
  // devCode is null in production — it's only for local testing.
  return NextResponse.json({ ok: true, email, devCode });
}
