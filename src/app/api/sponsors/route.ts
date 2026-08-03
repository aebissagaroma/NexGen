import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { str, email } from '@/lib/validation';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { notifyAddress, sponsorAddress } from '@/lib/mailer';

// POST /api/sponsors — capture a sponsor inquiry from the Partners form.
export async function POST(req: Request) {
  // Public unauthenticated insert — throttle so a script can't flood the
  // inquiries table the staff dashboard reads. Real sponsors send one or two.
  const rl = await rateLimit(`sponsor:ip:${clientIp(req)}`, 5, 60 * 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many inquiries from this connection. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const company = str(body.company, { min: 2, max: 160 });
  const contactName = str(body.contactName, { min: 2, max: 120 });
  const mail = email(body.email);
  if (!company || !contactName || !mail) {
    return NextResponse.json({ error: 'Company, contact and a valid email are required.' }, { status: 400 });
  }
  const phone = body.phone ? str(body.phone, { max: 40 }) : null;
  const tier = body.tier ? str(body.tier, { max: 40 }) : null;
  const message = body.message ? str(body.message, { max: 2000 }) : null;

  const row = await queryOne<{ id: string }>(
    `INSERT INTO sponsor_inquiries (company, contact_name, email, phone, tier, message)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [company, contactName, mail, phone, tier, message],
  );

  // Straight to the partnerships inbox (SPONSOR_EMAIL), not the player-ops one.
  // A sponsor inquiry is the highest-value thing this site captures and there is
  // no second chance at it: a partner who hears nothing for a week goes
  // elsewhere. Until now this row was written and never surfaced anywhere.
  //
  // notifyAddress never throws and is capped at 8s, so a mail problem cannot
  // cost us the inquiry itself — it is already committed above.
  await notifyAddress(
    sponsorAddress(),
    `New ${(tier || 'partner').toUpperCase()} inquiry — ${company}`,
    [
      `Company:  ${company}`,
      `Contact:  ${contactName}`,
      `Email:    ${mail}`,
      `Phone:    ${phone || '—'}`,
      `Tier:     ${tier || '—'}`,
      `Message:  ${message || '—'}`,
      ``,
      `Inquiry ID: ${row!.id}`,
      `Reply to the address above, then mark it handled on the staff dashboard.`,
    ].join('\n'),
  );

  return NextResponse.json({ ok: true });
}
