import { NextResponse } from 'next/server';
import { query, queryOne, tx } from '@/lib/db';
import { getSession } from '@/lib/session';
import { canonicalTag } from '@/lib/gamertag';

// GET /api/admin/registrations?q=&club=  — admin-only list with search/filter.
export async function GET(req: Request) {
  if (!getSession('admin')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  const club = (searchParams.get('club') || '').trim().toUpperCase();

  const where: string[] = [];
  const args: unknown[] = [];
  if (q) {
    args.push(`%${q}%`);
    where.push(`(r.full_name ILIKE $${args.length} OR r.gamertag ILIKE $${args.length} OR r.email ILIKE $${args.length} OR r.phone ILIKE $${args.length})`);
  }
  if (club) {
    args.push(club);
    where.push(`r.club_code = $${args.length}`);
  }
  const rows = await query(
    `SELECT r.id, r.full_name, r.email, r.gamertag, r.club_code, c.name AS club_name,
            r.phone, r.city, r.payment_status, r.status, r.created_at
     FROM registrations r JOIN clubs c ON c.code = r.club_code
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY r.created_at DESC`,
    args,
  );
  return NextResponse.json({ registrations: rows });
}

// PATCH /api/admin/registrations  { id, paymentStatus?, status? }
export async function PATCH(req: Request) {
  if (!getSession('admin')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? '');
  // Validate shape here — a non-UUID would make Postgres throw (=> 500).
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'valid id required' }, { status: 400 });
  }

  // Ops override on the gamertag. Handled on its own because it is the one
  // field here that other tables copy by value, and because ops must be able to
  // set a tag under conditions the player-facing endpoint refuses: after the
  // qualifier lock, over the blocklist, and on a handle already drawn into a
  // bracket. That is the entire point of an override — it is how an obscenity
  // that got through, or a tag published in error, gets fixed.
  if (body.gamertag !== undefined) {
    const tag = canonicalTag(body.gamertag);
    if (!tag) {
      return NextResponse.json(
        { error: 'Gamertag must be 3–20 letters and numbers, with at least one letter.' },
        { status: 400 },
      );
    }

    const reg = await queryOne<{ gamertag: string | null }>(
      `SELECT gamertag FROM registrations WHERE id = $1`, [id],
    );
    if (!reg) return NextResponse.json({ error: 'No such registration.' }, { status: 404 });

    const clash = await queryOne(
      `SELECT 1 FROM registrations
        WHERE gamertag IS NOT NULL AND ec_tag_canon(gamertag) = ec_tag_canon($1) AND id <> $2
        LIMIT 1`,
      [tag, id],
    );
    if (clash) {
      return NextResponse.json({ error: 'Another entry already holds that gamertag.' }, { status: 409 });
    }

    // The rename and the rows that copied the old value move together, or not
    // at all. Half of this applied would leave a bracket naming a player who no
    // longer exists under that handle.
    const old = reg.gamertag;
    await tx(async (run) => {
      await run(`UPDATE registrations SET gamertag = $1 WHERE id = $2`, [tag, id]);
      if (old) {
        await run(
          `UPDATE matches SET player_a = $1 WHERE ec_tag_canon(coalesce(player_a,'')) = ec_tag_canon($2)`,
          [tag, old],
        );
        await run(
          `UPDATE matches SET player_b = $1 WHERE ec_tag_canon(coalesce(player_b,'')) = ec_tag_canon($2)`,
          [tag, old],
        );
        await run(
          `UPDATE standings SET player_tag = $1 WHERE ec_tag_canon(player_tag) = ec_tag_canon($2)`,
          [tag, old],
        );
      }
    });

    // Logged because an override is a staff member changing how a player is
    // named in public, and there is otherwise no record that it happened.
    console.warn(`[admin] gamertag override id=${id} ${old ?? '(none)'} -> ${tag}`);
    return NextResponse.json({ ok: true, gamertag: tag });
  }

  const sets: string[] = [];
  const args: unknown[] = [];
  if (body.paymentStatus && ['unpaid', 'paid', 'waived'].includes(body.paymentStatus)) {
    args.push(body.paymentStatus);
    sets.push(`payment_status = $${args.length}`);
  }
  if (body.status && ['pending', 'confirmed', 'rejected'].includes(body.status)) {
    args.push(body.status);
    sets.push(`status = $${args.length}`);
  }
  if (!sets.length) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });

  args.push(id);
  await query(`UPDATE registrations SET ${sets.join(', ')} WHERE id = $${args.length}`, args);
  return NextResponse.json({ ok: true });
}
