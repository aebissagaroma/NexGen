import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { str } from '@/lib/validation';
import { tagCandidates } from '@/lib/gamertag';
import { rateLimit, clientIp } from '@/lib/rate-limit';

const WANTED = 6;

// POST /api/tags/suggest { fullName } — available gamertags built from a name.
// Session-gated: it is only reached from the details step, after email
// verification, and that keeps this DB-touching endpoint off the open internet.
export async function POST(req: Request) {
  const session = getSession('user');
  if (!session) {
    return NextResponse.json({ error: 'Verify your email first.' }, { status: 401 });
  }
  // Cheap per-request, but it runs a query and the form calls it on every name
  // edit, so cap a stuck client rather than let it spin.
  const rl = await rateLimit(`tags:ip:${clientIp(req)}`, 120, 15 * 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many requests. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const fullName = str(body.fullName, { min: 1, max: 120 });
  if (!fullName) return NextResponse.json({ options: [] });

  const candidates = tagCandidates(fullName);
  if (candidates.length === 0) return NextResponse.json({ options: [] });

  // One query for the whole batch: ask which of these are already taken, then
  // offer the first few that are not. Comparing on ec_tag_canon means a tag
  // differing only by case or spacing still counts as taken.
  const taken = await query<{ t: string }>(
    `SELECT ec_tag_canon(gamertag) AS t FROM registrations
     WHERE gamertag IS NOT NULL AND ec_tag_canon(gamertag) = ANY($1)`,
    [candidates.map((c) => c.toLowerCase())],
  );
  const used = new Set(taken.map((r) => r.t));
  const options = candidates.filter((c) => !used.has(c.toLowerCase())).slice(0, WANTED);

  return NextResponse.json({ options });
}
