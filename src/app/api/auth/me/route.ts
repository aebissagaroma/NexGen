import { NextResponse } from 'next/server';
import { getSession, clearSession } from '@/lib/session';

// GET /api/auth/me — returns the current player session (or null).
export async function GET() {
  const s = getSession('user');
  return NextResponse.json({ user: s ? { id: s.sub, email: s.email } : null });
}

// POST /api/auth/logout
export async function POST() {
  clearSession('user');
  return NextResponse.json({ ok: true });
}
