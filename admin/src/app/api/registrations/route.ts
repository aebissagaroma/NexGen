import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PATCH /api/registrations { id, paymentStatus?, status? }
export async function PATCH(req: Request) {
  const auth = requireAdmin();
  if (!isSession(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const id = String(body.id ?? '');
  if (!UUID.test(id)) return NextResponse.json({ error: 'valid id required' }, { status: 400 });

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
