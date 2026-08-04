import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/admin/registrations/export — admin-only CSV download.
export async function GET() {
  if (!getSession('admin')) return new Response('Unauthorized', { status: 401 });

  const rows = await query<{
    full_name: string; email: string; gamertag: string | null; club_code: string;
    phone: string | null; city: string | null; payment_status: string;
    status: string; created_at: string;
  }>(
    // No identity document or number is collected at all — see rulebook 3.4.
    // exported. That is deliberate: this file gets emailed around.
    `SELECT full_name, email, gamertag, club_code, phone, city,
            payment_status, status, created_at
     FROM registrations ORDER BY created_at DESC`,
  );

  const headers = ['Full name', 'Email', 'Gamertag', 'Club', 'ID ending', 'City', 'Payment', 'Status', 'Registered'];
  const esc = (v: unknown) => {
    let s = String(v ?? '');
    // Formula-injection guard: these values are player-controlled (name, tag, city)
    // and this file gets opened in Excel/Sheets, where a cell
    // starting with = + - @ (or tab/CR) executes as a formula. Prefix with '
    // so spreadsheets render it as text.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      [r.full_name, r.email, r.gamertag, r.club_code, r.phone, r.city, r.payment_status, r.status, r.created_at]
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
