import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

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
