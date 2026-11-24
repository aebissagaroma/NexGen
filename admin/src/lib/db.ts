// Postgres pool — same database as the main site, same conventions
// (see the main app's src/lib/db.ts, which this mirrors).
import { Pool, type QueryResultRow } from 'pg';

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
