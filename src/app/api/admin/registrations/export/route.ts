import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/admin/registrations/export — admin-only CSV download.
export async function GET() {
  if (!getSession('admin')) return new Response('Unauthorized', { status: 401 });

  const rows = await query<{
    full_name: string; phone: string; gamertag: string; club_code: string;
    platform: string | null; city: string | null; payment_status: string;
    status: string; created_at: string;
  }>(
    `SELECT full_name, phone, gamertag, club_code, platform, city,
            payment_status, status, created_at
     FROM registrations ORDER BY created_at DESC`,
  );

  const headers = ['Full name', 'Phone', 'Gamertag', 'Club', 'Platform', 'City', 'Payment', 'Status', 'Registered'];
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      [r.full_name, r.phone, r.gamertag, r.club_code, r.platform, r.city, r.payment_status, r.status, r.created_at]
        .map(esc)
        .join(','),
    ),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="electrocup-registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
