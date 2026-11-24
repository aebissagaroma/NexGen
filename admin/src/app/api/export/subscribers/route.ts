import { query } from '@/lib/db';
import { requireAdmin, isSession } from '@/lib/auth';

// GET /api/export/subscribers — the announcement mailing list as CSV.
export async function GET() {
  const auth = requireAdmin();
  if (!isSession(auth)) return new Response('Unauthorized', { status: 401 });

  const rows = await query<{ email: string; created_at: string }>(
    `SELECT email, created_at FROM notify_subscribers ORDER BY created_at DESC`,
  );
  const esc = (v: unknown) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csv = ['Email,Subscribed', ...rows.map((r) => [r.email, r.created_at].map(esc).join(','))].join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="electrocup-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
