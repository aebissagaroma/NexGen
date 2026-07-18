import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/clubs — the 20 club brackets, with live registration counts.
export async function GET() {
  const rows = await query(
    `SELECT c.code, c.name, c.city,
            COALESCE(COUNT(r.id), 0)::int AS regs
     FROM clubs c LEFT JOIN registrations r ON r.club_code = c.code
     GROUP BY c.code ORDER BY c.sort`,
  );
  return NextResponse.json({ clubs: rows });
}
