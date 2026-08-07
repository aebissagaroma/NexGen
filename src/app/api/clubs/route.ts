import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Registration counts must reflect the database on every request. Without this
// Next prerenders the route at build time and serves a frozen snapshot in prod.
export const dynamic = 'force-dynamic';

// GET /api/clubs — the 20 club brackets, with live registration counts.
export async function GET() {
  // grp is aliased to "group" for the client, which knows the field by that
  // name. The column cannot be called that in SQL — GROUP is reserved.
  const rows = await query(
    `SELECT c.code, c.name, c.city, c.grp AS "group",
            COALESCE(COUNT(r.id), 0)::int AS regs
     FROM clubs c LEFT JOIN registrations r ON r.club_code = c.code
     GROUP BY c.code ORDER BY c.sort`,
  );
  return NextResponse.json({ clubs: rows });
}
