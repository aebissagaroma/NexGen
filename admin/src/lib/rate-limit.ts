// Fixed-window rate limiting on the shared rate_limits table (same mechanism
// as the main app — atomic upsert, fails open). Keys here are prefixed 'adm:'
// so the two apps can never collide on a counter.
import { query } from './db';

export interface RateLimitResult {
  ok: boolean;
  count: number;
  retryAfter: number;
}

export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  try {
    const rows = await query<{ count: number; age_sec: number }>(
      `INSERT INTO rate_limits (key, count, window_start)
       VALUES ($1, 1, now())
       ON CONFLICT (key) DO UPDATE SET
         count = CASE
           WHEN rate_limits.window_start < now() - make_interval(secs => $2::double precision)
           THEN 1 ELSE rate_limits.count + 1 END,
         window_start = CASE
           WHEN rate_limits.window_start < now() - make_interval(secs => $2::double precision)
           THEN now() ELSE rate_limits.window_start END
       RETURNING count, EXTRACT(EPOCH FROM (now() - window_start))::int AS age_sec`,
      [key, windowSec],
    );
    const row = rows[0];
    if (!row) return { ok: true, count: 0, retryAfter: 0 };
    return {
      ok: row.count <= limit,
      count: row.count,
      retryAfter: Math.max(1, windowSec - row.age_sec),
    };
  } catch (e) {
    console.error('[admin rate-limit] check failed, allowing request:', e);
    return { ok: true, count: 0, retryAfter: 0 };
  }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
