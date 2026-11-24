import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { setAdminSession, clearAdminSession } from '@/lib/session';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// POST /api/auth/login  { email, password } — staff sign-in against the admins
// table. 5 tries per IP per 15 minutes; generic error either way.
export async function POST(req: Request) {
  const rl = await rateLimit(`adm:login:ip:${clientIp(req)}`, 5, 15 * 60);
  if (!rl.ok) {
    const mins = Math.ceil(rl.retryAfter / 60);
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${mins} minute${mins === 1 ? '' : 's'}.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!email.includes('@') || !password) {
    return NextResponse.json({ error: 'Email and password required.' }, { status: 400 });
  }

  const admin = await queryOne<{ id: string; email: string; password_hash: string; role: 'owner' | 'staff'; disabled: boolean }>(
    `SELECT id, email, password_hash, role, disabled FROM admins WHERE email = $1`,
    [email],
  );

  // verifyPassword always does real scrypt work (dummy hash when no row), and a
  // disabled account fails identically to a wrong password.
  const ok = await verifyPassword(password, admin?.password_hash);
  if (!ok || !admin || admin.disabled) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  await query(`UPDATE admins SET last_login_at = now() WHERE id = $1`, [admin.id]);
  setAdminSession({ sub: admin.id, email: admin.email, role: admin.role, iat: Date.now() });
  return NextResponse.json({ ok: true });
}

// DELETE /api/auth/login — sign out.
export async function DELETE() {
  clearAdminSession();
  return NextResponse.json({ ok: true });
}
