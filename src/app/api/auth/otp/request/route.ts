import { NextResponse } from 'next/server';
import { requestOtp, normalizePhone } from '@/lib/otp';

// POST /api/auth/otp/request  { phone }
// Sends (or in dev, returns) a 6-digit code.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = normalizePhone(String(body.phone ?? ''));
  if (!phone) {
    return NextResponse.json({ error: 'Enter a valid Ethiopian phone number.' }, { status: 400 });
  }
  const { devCode } = await requestOtp(phone);
  // devCode is null in production — it's only for local testing.
  return NextResponse.json({ ok: true, phone, devCode });
}
