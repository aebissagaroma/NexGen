// Fixed-window rate limiting backed by Postgres (no extra infrastructure).
//
// Used to guard the unauthenticated OTP endpoint: every request there sends an
// email, which costs money and stakes the domain's sending reputation. Without a
// cap, a trivial script can drain the monthly quota and get the domain flagged.
//
// The counter is incremented in a single atomic INSERT ... ON CONFLICT, so
// concurrent requests can't race past the limit (no read-then-write gap).
import { query } from './db';

export interface RateLimitResult {
  ok: boolean;
  /** Requests already made in the current window (including this one). */
  count: number;
  /** Seconds until the window resets — send as Retry-After when blocking. */
  retryAfter: number;
}

/**
 * Count one hit against `key` and report whether it is within `limit` per
 * `windowSec`. Fails open: if the limiter itself errors we allow the request
 * rather than taking registration down with it.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
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
    // Fail open — a limiter outage must not block legitimate registrations.
    console.error('[rate-limit] check failed, allowing request:', e);
    return { ok: true, count: 0, retryAfter: 0 };
  }
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
