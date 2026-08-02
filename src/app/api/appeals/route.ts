import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { str, email } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { notifyOps } from '@/lib/mailer';

// POST /api/appeals — contest a disqualification.
//
// Open to anyone, with no session: someone blocked for a duplicate entry may
// never have completed sign-in, and requiring a login would shut the only door
// left to a player caught by mistake.
export async function POST(req: Request) {
  const rl = await rateLimit(`appeal:ip:${clientIp(req)}`, 10, 60 * 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many appeals from this connection. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const mail = email(body.email);
  const fullName = str(body.fullName, { min: 2, max: 120 });
  const reason = str(body.reason, { min: 10, max: 2000 });
  if (!mail || !fullName || !reason) {
    return NextResponse.json(
      { error: 'Your name, email and a short explanation are all required.' },
      { status: 400 },
    );
  }

  await query(
    `INSERT INTO appeals (email, full_name, reason) VALUES ($1, $2, $3)`,
    [mail, fullName, reason],
  );

  // Notify ops, but never fail the appeal because mail is down — the row is
  // already saved, and telling the player "try again" would be a lie.
  await notifyOps(
    `ELECTROCUP appeal — ${fullName}`,
    `${fullName} <${mail}> has appealed a disqualification.\n\n${reason}\n`,
  );

  return NextResponse.json({ ok: true });
}
