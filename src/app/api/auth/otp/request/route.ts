import { NextResponse } from 'next/server';
import { requestOtp, normalizeEmail, OtpDeliveryError } from '@/lib/otp';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// This endpoint is unauthenticated and sends an email on every call, so it is
// capped twice: per address (stops hammering one inbox) and per IP (stops a
// script cycling through addresses to drain the sending quota).
//
// The per-IP cap is deliberately loose. Most players reach us over Ethiopian
// mobile networks, where carrier-grade NAT puts very many subscribers behind a
// handful of public addresses — a tight per-IP cap would lock out legitimate
// registrations during a launch spike. The per-address cap is the real abuse
// guard; per-IP is a backstop that still bounds a scripted attack.
const PER_EMAIL = { limit: 3, windowSec: 15 * 60 };
const PER_IP = { limit: 100, windowSec: 15 * 60 };

// POST /api/auth/otp/request  { email }
// Sends (or in dev, returns) a 6-digit code.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normalizeEmail(String(body.email ?? ''));
  if (!email) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  // Checked in order, not in parallel: if the address is already over its own
  // limit we stop there, so one person retrying does not spend the IP budget
  // that everyone else behind the same NAT depends on.
  let blocked = null;
  const byEmail = await rateLimit(`otp:email:${email}`, PER_EMAIL.limit, PER_EMAIL.windowSec);
  if (!byEmail.ok) {
    blocked = byEmail;
  } else {
    const byIp = await rateLimit(`otp:ip:${clientIp(req)}`, PER_IP.limit, PER_IP.windowSec);
    if (!byIp.ok) blocked = byIp;
  }
  if (blocked) {
    const mins = Math.ceil(blocked.retryAfter / 60);
    return NextResponse.json(
      { error: `Too many code requests. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` },
      { status: 429, headers: { 'Retry-After': String(blocked.retryAfter) } },
    );
  }

  try {
    const { devCode } = await requestOtp(email);
    // devCode is null in production — it's only for local testing.
    return NextResponse.json({ ok: true, email, devCode });
  } catch (e) {
    if (e instanceof OtpDeliveryError) {
      // Provider outage / quota / bad credentials — retryable, not a 500.
      return NextResponse.json(
        { error: "We couldn't send the code right now. Please try again in a moment." },
        { status: 503 },
      );
    }
    throw e;
  }
}
