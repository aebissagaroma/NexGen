import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { email } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// POST /api/notify — subscribe to announcements ("tell me when a date is set").
// Deliberately open to anyone: the point is to reach people who have NOT entered
// the tournament, so there is no session check here.
export async function POST(req: Request) {
  // Public unauthenticated insert, so throttle it. Generous enough that a shared
  // connection (carrier-grade NAT is common on Ethiopian mobile networks) does
  // not lock out real people — see the note in the OTP request route.
  const rl = await rateLimit(`notify:ip:${clientIp(req)}`, 30, 60 * 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many sign-ups from this connection. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const mail = email(body.email);
  if (!mail) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    await query(`INSERT INTO notify_subscribers (email) VALUES ($1)`, [mail]);
  } catch (e: unknown) {
    // Already on the list (or an alias of an address that is). Answer exactly as
    // we would for a new address: a different response here would let anyone
    // test whether a given email is subscribed.
    if ((e as { code?: string })?.code !== '23505') throw e;
  }
  return NextResponse.json({ ok: true });
}
