// Brings a database up to date. Usage: npm run db:migrate
//
// Two steps, in order:
//
//   1. db/schema.sql — the whole structure, written to be idempotent and safe to
//      re-run. This converges shape: tables, columns, indexes, constraints.
//   2. db/migrations/*.sql — numbered steps applied once each and recorded in
//      schema_migrations.
//
// Structure alone cannot express everything. Changing existing rows — retiring a
// club, backfilling a column — is not something a CREATE TABLE IF NOT EXISTS can
// say, and it must not run twice. That is what the numbered files are for.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Applies any migration in db/migrations that this database has not seen.
 *
 * Each file runs inside its own transaction, so a failure rolls that file back
 * whole and leaves it unrecorded — the next run retries it rather than resuming
 * from the middle of a half-applied change.
 */
async function runMigrations(client) {
  const dir = join(__dirname, '..', 'db', 'migrations');
  if (!existsSync(dir)) return;

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  // Lexical order is the apply order, which is why the files are zero-padded.
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const { rows } = await client.query('SELECT name FROM schema_migrations');
  const done = new Set(rows.map((r) => r.name));
  const pending = files.filter((f) => !done.has(f));

  if (!pending.length) {
    console.log(`✓ migrations up to date (${files.length} applied)`);
    return;
  }

  for (const file of pending) {
    const sql = readFileSync(join(dir, file), 'utf8');
    try {
      await client.query('BEGIN');
      await client.query(sql);
      // Recorded in the same transaction as the change it describes, so the
      // record and the effect can never disagree.
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      console.log(`✓ ${file}`);
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`\n✗ ${file} failed — rolled back, nothing from it was applied.`);
      throw e;
    }
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (copy .env.example to .env.local).');
  const ssl = process.env.PGSSL === 'true' ? true : process.env.PGSSL === 'no-verify' ? { rejectUnauthorized: false } : undefined;
  const client = new pg.Client({ connectionString: url, ssl });
  // schema.sql reports skipped work with RAISE WARNING (see the "one entry per
  // player" block). pg swallows notices unless we listen, and a silent skip is
  // exactly the failure mode that guard exists to avoid.
  client.on('notice', (n) => console.warn(`! ${n.message}`));
  await client.connect();
  const sql = readFileSync(join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await client.query(sql);
  console.log('✓ schema applied');

  // Structure first, then the row-level steps that depend on it existing.
  await runMigrations(client);

  // The duplicate-entry indexes are the one part of this file that can be
  // skipped on an existing database, so confirm they actually landed rather
  // than assuming a clean exit means they did.
  const wanted = ['uniq_reg_email', 'uniq_reg_idnum', 'uniq_reg_tag', 'uniq_reg_user'];
  const { rows } = await client.query(
    `SELECT relname FROM pg_class WHERE relname = ANY($1)`,
    [wanted],
  );
  const missing = wanted.filter((w) => !rows.some((r) => r.relname === w));
  await client.end();

  if (missing.length) {
    console.error(`\n⚠  duplicate registrations are NOT blocked — missing: ${missing.join(', ')}`);
    console.error('   The database already contains duplicates. Inspect them with:');
    console.error('     npm run db:duplicates');
    console.error('   Resolve them, then re-run this migration.');
    process.exit(1);
  }
  console.log(`✓ one-entry-per-player enforced (${wanted.length}/${wanted.length} indexes)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
