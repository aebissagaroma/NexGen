import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canonicalTag, TAG_MIN, TAG_MAX } from '@/lib/gamertag';
import { isBlockedTag } from '@/lib/tag-blocklist';
import { gamertagsEditable } from '@/data/static';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// POST /api/tags/claim { gamertag } — change the signed-in player's gamertag.
//
// Players pick their own handle and may keep changing it until the qualifiers
// begin. After that it is fixed, because it is what appears on the bracket, the
// standings table and the broadcast.

/** Said the same way whoever asks, so nobody can use this to enumerate tags. */
const TAKEN = 'That gamertag is taken. Try another.';

const SHAPE =
  `Use ${TAG_MIN}–${TAG_MAX} letters and numbers, no spaces or punctuation, and at least one letter.`;

// Deliberately does not say which word tripped it: repeating a slur back at
// someone is worse than being vague, and naming the match turns the filter into
// a game. A player caught by a false positive contacts ops, who can set any tag.
const NOT_ALLOWED = 'That gamertag is not allowed. Please choose another.';

// GET /api/tags/claim?tag=XYZ — is this handle free? Drives the live
// available/taken hint as someone types, so they find out before submitting.
//
// Session-gated and rate limited. Tags themselves are not secret — every one in
// use is printed on a bracket and has a public profile page — so answering this
// reveals nothing that /players/<tag> does not.
export async function GET(req: Request) {
  const session = getSession('user');
  if (!session) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  const rl = await rateLimit(`tag:check:${clientIp(req)}`, 120, 10 * 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many checks. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const tag = canonicalTag(new URL(req.url).searchParams.get('tag'));
  if (!tag) return NextResponse.json({ ok: false, reason: SHAPE });
  if (isBlockedTag(tag)) return NextResponse.json({ ok: false, reason: NOT_ALLOWED });

  const mine = await queryOne<{ gamertag: string | null }>(
    `SELECT gamertag FROM registrations
     WHERE user_id = $1 OR ec_email_canon(email) = ec_email_canon($2) LIMIT 1`,
    [session.sub, session.email],
  );
  // Their current handle must read as available to them, or the form tells a
  // player their own tag is taken.
  if (mine?.gamertag && mine.gamertag.toUpperCase() === tag) {
    return NextResponse.json({ ok: true, tag, available: true, mine: true });
  }

  const taken = await queryOne(
    `SELECT 1 FROM registrations
      WHERE gamertag IS NOT NULL AND ec_tag_canon(gamertag) = ec_tag_canon($1) LIMIT 1`,
    [tag],
  );
  return NextResponse.json({ ok: true, tag, available: !taken });
}

export async function POST(req: Request) {
  const session = getSession('user');
  if (!session) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }

  // A tag change is a cheap write, but it is also the one thing here a bored
  // person can do over and over. Generous enough that genuinely trying a few
  // handles never trips it.
  const rl = await rateLimit(`tag:claim:${clientIp(req)}`, 20, 10 * 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many changes. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  if (!gamertagsEditable()) {
    return NextResponse.json(
      { error: 'Gamertags are locked now that the qualifiers have begun.' },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const tag = canonicalTag((body as { gamertag?: unknown }).gamertag);
  if (!tag) {
    return NextResponse.json({ error: SHAPE }, { status: 400 });
  }
  if (isBlockedTag(tag)) {
    return NextResponse.json({ error: NOT_ALLOWED }, { status: 400 });
  }

  const reg = await queryOne<{ id: string; gamertag: string | null }>(
    `SELECT id, gamertag FROM registrations
     WHERE user_id = $1 OR ec_email_canon(email) = ec_email_canon($2) LIMIT 1`,
    [session.sub, session.email],
  );
  if (!reg) {
    return NextResponse.json({ error: 'You do not have an entry yet.' }, { status: 404 });
  }

  // Re-submitting the tag they already have is a no-op, not a clash with
  // themselves. Compared canonically so changing only the case is allowed
  // through to the UPDATE below and actually takes effect.
  const unchanged =
    reg.gamertag != null && reg.gamertag.toUpperCase() === tag;
  if (unchanged) {
    return NextResponse.json({ ok: true, gamertag: reg.gamertag });
  }

  // Once a tag has been drawn into a bracket or has a standings row, renaming it
  // would orphan those rows — they store the tag as text, not a reference. This
  // is the guard that does not depend on anyone having set QUALIFIERS_BEGIN.
  const inPlay = await queryOne(
    `SELECT 1 FROM standings WHERE ec_tag_canon(player_tag) = ec_tag_canon($1)
     UNION ALL
     SELECT 1 FROM matches
      WHERE ec_tag_canon(coalesce(player_a,'')) = ec_tag_canon($1)
         OR ec_tag_canon(coalesce(player_b,'')) = ec_tag_canon($1)
     LIMIT 1`,
    [reg.gamertag ?? ''],
  );
  if (inPlay) {
    return NextResponse.json(
      { error: 'Your gamertag is already published on a bracket, so it can no longer be changed. Contact NexGen ops if it is wrong.' },
      { status: 409 },
    );
  }

  const taken = await queryOne(
    `SELECT 1 FROM registrations
      WHERE gamertag IS NOT NULL
        AND ec_tag_canon(gamertag) = ec_tag_canon($1)
        AND id <> $2
      LIMIT 1`,
    [tag, reg.id],
  );
  if (taken) {
    return NextResponse.json({ error: TAKEN }, { status: 409 });
  }

  try {
    await query(`UPDATE registrations SET gamertag = $1 WHERE id = $2`, [tag, reg.id]);
  } catch (e: unknown) {
    // Lost a race to another player claiming the same handle between the check
    // above and this write. uniq_reg_tag is what actually decides it.
    const err = e as { code?: string };
    if (err?.code === '23505') {
      return NextResponse.json({ error: TAKEN }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true, gamertag: tag });
}
