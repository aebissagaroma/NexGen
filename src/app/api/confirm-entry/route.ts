import { NextResponse } from 'next/server';
import { queryOne, tx } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canonicalId, hashId } from '@/lib/national-id';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// POST /api/confirm-entry { idNumber } — confirm an entry with a national ID.
//
// This is the ONLY place an ID number enters the system, and it leaves again in
// the same request. The raw value is canonicalised and hashed here; nothing but
// the digest is written, returned or logged. It is never put in an error
// message, because an error carrying the number would end up in the platform's
// log store — the one place we have promised it will not be.
//
// Entries must be confirmed before their group's draw is announced. Unconfirmed
// entries are not included in the draw.

// Same limits as /api/register: this endpoint takes an ID number, so it is the
// one worth probing, and it must not be cheaper to attack than registration.
const ATTEMPTS_PER_10_MIN = 5;
const ATTEMPTS_PER_HOUR = 20;

const COLLISION =
  'This ID has already confirmed a different entry. The earliest registration stands. '
  + 'If you believe this is an error, appeal below.';

export async function POST(req: Request) {
  const session = getSession('user');
  if (!session) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  // Counted before the body is parsed, so a malformed request still costs an
  // attempt and cannot be used to probe for free.
  const ip = clientIp(req);
  const burst = await rateLimit(`confirm:ip:10m:${ip}`, ATTEMPTS_PER_10_MIN, 10 * 60);
  const hourly = await rateLimit(`confirm:ip:1h:${ip}`, ATTEMPTS_PER_HOUR, 60 * 60);
  if (!burst.ok || !hourly.ok) {
    const retryAfter = !burst.ok ? burst.retryAfter : hourly.retryAfter;
    // The IP and the window, never the submitted value.
    console.warn(`[confirm-entry] rate limited ip=${ip} window=${!burst.ok ? '10m' : '1h'}`);
    return NextResponse.json(
      { error: 'Too many attempts from this connection. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const canonical = canonicalId((body as { idNumber?: unknown }).idNumber);
  if (!canonical) {
    // Deliberately generic: naming the accepted length or character set would
    // hand a prober the shape of a valid number.
    return NextResponse.json(
      { error: 'That ID number does not look right. Check it and try again.' },
      { status: 400 },
    );
  }

  const reg = await queryOne<{ id: string; id_status: string; created_at: string }>(
    `SELECT id, id_status, created_at FROM registrations
     WHERE user_id = $1 OR ec_email_canon(email) = ec_email_canon($2) LIMIT 1`,
    [session.sub, session.email],
  );
  if (!reg) {
    return NextResponse.json({ error: 'You do not have an entry to confirm.' }, { status: 404 });
  }
  if (reg.id_status === 'confirmed') {
    return NextResponse.json({ ok: true, already: true, status: 'confirmed' });
  }
  if (reg.id_status === 'void') {
    return NextResponse.json({ error: COLLISION, status: 'void' }, { status: 409 });
  }

  const digest = hashId(canonical);

  // Who else holds this ID. uniq_reg_idnum makes the write itself safe; this
  // read decides WHICH entry stands, which the index cannot express.
  const holder = await queryOne<{ id: string; created_at: string }>(
    `SELECT id, created_at FROM registrations
      WHERE id_hash = $1 AND id <> $2 LIMIT 1`,
    [digest, reg.id],
  );

  if (holder) {
    // Earliest registration by created_at stands. Both entries are real people
    // as far as we know, so the later one is voided with an appeal route rather
    // than deleted, and the earlier one is never touched.
    const theirsIsEarlier = new Date(holder.created_at) <= new Date(reg.created_at);
    if (theirsIsEarlier) {
      await tx(async (run) => {
        await run(`UPDATE registrations SET id_status = 'void' WHERE id = $1`, [reg.id]);
      });
      console.warn(`[confirm-entry] collision: ${reg.id} voided, ${holder.id} stands`);
      return NextResponse.json({ error: COLLISION, status: 'void' }, { status: 409 });
    }

    // This entry registered first, so it takes the ID and the other one is the
    // one that must give way. Both moves happen together or not at all.
    await tx(async (run) => {
      await run(`UPDATE registrations SET id_status = 'void', id_hash = NULL WHERE id = $1`, [holder.id]);
      await run(
        `UPDATE registrations SET id_hash = $1, id_status = 'confirmed', id_confirmed_at = now() WHERE id = $2`,
        [digest, reg.id],
      );
    });
    console.warn(`[confirm-entry] collision: ${holder.id} voided, ${reg.id} stands (earlier)`);
    return NextResponse.json({ ok: true, status: 'confirmed' });
  }

  try {
    await tx(async (run) => {
      await run(
        `UPDATE registrations SET id_hash = $1, id_status = 'confirmed', id_confirmed_at = now() WHERE id = $2`,
        [digest, reg.id],
      );
    });
  } catch (e: unknown) {
    // Lost a race to another entry claiming the same ID between the read above
    // and this write. uniq_reg_idnum is what actually decides it, and the loser
    // of the race is by definition the later confirmation.
    const err = e as { code?: string };
    if (err?.code === '23505') {
      await tx(async (run) => {
        await run(`UPDATE registrations SET id_status = 'void' WHERE id = $1`, [reg.id]);
      });
      return NextResponse.json({ error: COLLISION, status: 'void' }, { status: 409 });
    }
    // Rethrown WITHOUT the submitted value anywhere in the message.
    throw e;
  }

  return NextResponse.json({ ok: true, status: 'confirmed' });
}

// GET /api/confirm-entry — the signed-in entrant's confirmation state.
export async function GET() {
  const session = getSession('user');
  if (!session) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  const reg = await queryOne<{ id_status: string; id_confirmed_at: string | null; club_code: string; gamertag: string | null }>(
    `SELECT id_status, id_confirmed_at, club_code, gamertag FROM registrations
     WHERE user_id = $1 OR ec_email_canon(email) = ec_email_canon($2) LIMIT 1`,
    [session.sub, session.email],
  );
  if (!reg) return NextResponse.json({ entry: null });
  return NextResponse.json({ entry: reg });
}
