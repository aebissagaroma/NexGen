// Guards for API routes. Pages are guarded by the (panel) layout redirect;
// routes return JSON errors instead.
import { NextResponse } from 'next/server';
import { getAdminSession, type AdminSession } from './session';

export function requireAdmin(): AdminSession | NextResponse {
  const s = getAdminSession();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return s;
}

export function isSession(x: AdminSession | NextResponse): x is AdminSession {
  return !(x instanceof NextResponse);
}
