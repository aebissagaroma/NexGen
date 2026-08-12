import { query } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';

// GET /api/export/registrations — CSV. Player-controlled fields are guarded
// against spreadsheet formula injection (leading = + - @ / tab / CR).
export async function GET() {
  const auth = requireAdmin();
  if (!isSession(auth)) return new Response('Unauthorized', { status: 401 });

  const rows = await query<Record<string, unknown>>(
    `SELECT full_name, email, phone, gamertag, club_code, city,
            to_char(date_of_birth, 'YYYY-MM-DD') AS date_of_birth,
            payment_status, status, created_at
     FROM registrations ORDER BY created_at DESC`,
  );

  const headers = ['Full name', 'Email', 'Phone', 'Gamertag', 'Club', 'City', 'Date of birth', 'Payment', 'Status', 'Registered'];
  const esc = (v: unknown) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => [r.full_name, r.email, r.phone, r.gamertag, r.club_code, r.city, r.date_of_birth, r.payment_status, r.status, r.created_at].map(esc).join(',')),
  ].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="electrocup-registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
