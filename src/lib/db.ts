// Postgres connection pool. Reused across hot-reloads in dev (globalThis cache)
// so we don't exhaust connections. Import { query } for one-off SQL.
import { Pool, type QueryResultRow } from 'pg';

/**
 * PGSSL modes:
 *   'true'      → TLS with certificate verification (Neon and other managed
 *                 providers present publicly-trusted certs — use this in prod;
 *                 unverified TLS would accept a man-in-the-middle).
 *   'no-verify' → TLS without verification, for providers with self-signed
 *                 chains (e.g. Render internal URLs).
 *   unset/other → plain TCP (local dev).
 */
export function pgSsl(): boolean | { rejectUnauthorized: boolean } | undefined {
  const mode = process.env.PGSSL;
  if (mode === 'true') return true;
  if (mode === 'no-verify') return { rejectUnauthorized: false };
  return undefined;
}

const globalForPg = globalThis as unknown as { __pgPool?: Pool };

export const pool: Pool =
  globalForPg.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: pgSsl(),
    // Serverless: every concurrent function instance builds its own pool, so a
    // traffic spike multiplies this number by the instance count. Keep it small
    // and let the platform pooler (e.g. Neon's) do the real multiplexing.
    max: Number(process.env.PGPOOL_MAX || 3),
  });

if (process.env.NODE_ENV !== 'production') globalForPg.__pgPool = pool;

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const res = await pool.query<T>(text, params as never);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Run several statements on one connection, inside a transaction.
 *
 * Needed wherever a single change spans tables that must agree afterwards — a
 * gamertag rename touches registrations, matches and standings, and a partial
 * rename would leave a bracket pointing at a handle nobody holds. Rolls back on
 * any throw and always returns the connection to the pool.
 */
export async function tx<T>(
  fn: (run: <R extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) => Promise<R[]>) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(async (text, params) => {
      const res = await client.query(text, params as never);
      return res.rows as never;
    });
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}
