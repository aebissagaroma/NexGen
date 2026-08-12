import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PATCH /api/sponsors { id, handled }
export async function PATCH(req: Request) {
  const auth = requireAdmin();
  if (!isSession(auth)) return auth;
  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? '');
  if (!UUID.test(id)) return NextResponse.json({ error: 'valid id required' }, { status: 400 });
  await query(`UPDATE sponsor_inquiries SET handled = $1 WHERE id = $2`, [body.handled === true, id]);
  return NextResponse.json({ ok: true });
}
