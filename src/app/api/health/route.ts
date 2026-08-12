import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

// GET /api/health — liveness + database reachability, for external uptime
// monitors. Returns 200 with a DB round-trip time, or 503 when the database
// cannot be reached (the page may still render, but registration would fail —
// that state must page someone).
//
// Deliberately unauthenticated and cheap: one SELECT 1. It exposes nothing but
// up/down and a latency number.
export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  try {
    await queryOne(`SELECT 1 AS ok`);
    return NextResponse.json({
      ok: true,
      db: 'up',
      dbMs: Date.now() - started,
    });
  } catch (e) {
    console.error('[health] database check failed:', e);
    return NextResponse.json(
      { ok: false, db: 'down', dbMs: Date.now() - started },
      { status: 503 },
    );
  }
}
