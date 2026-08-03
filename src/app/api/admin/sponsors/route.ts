import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/admin/sponsors — admin-only list of partner inquiries.
//
// Unhandled first, then newest: this is a work queue, not an archive. Staff open
// it to answer what has not been answered, so the ordering does the triage.
export async function GET() {
  if (!getSession('admin')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query(
    `SELECT id, company, contact_name, email, phone, tier, message, handled, created_at
     FROM sponsor_inquiries
     ORDER BY handled ASC, created_at DESC`,
  );
  return NextResponse.json({ sponsors: rows });
}

// PATCH /api/admin/sponsors  { id, handled }
export async function PATCH(req: Request) {
  if (!getSession('admin')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? '');
  // Same guard as the registrations PATCH: a non-UUID would make Postgres throw.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'valid id required' }, { status: 400 });
  }
  if (typeof body.handled !== 'boolean') {
    return NextResponse.json({ error: 'handled must be true or false' }, { status: 400 });
  }

  await query(`UPDATE sponsor_inquiries SET handled = $1 WHERE id = $2`, [body.handled, id]);
  return NextResponse.json({ ok: true });
}
