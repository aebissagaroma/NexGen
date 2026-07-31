// Runs db/schema.sql against DATABASE_URL. Usage: npm run db:migrate
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

  // The duplicate-entry indexes are the one part of this file that can be
  // skipped on an existing database, so confirm they actually landed rather
  // than assuming a clean exit means they did.
  const wanted = ['uniq_reg_email', 'uniq_reg_gamertag', 'uniq_reg_user'];
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
  console.log('✓ one-entry-per-player enforced (3/3 indexes)');
}

main().catch((e) => { console.error(e); process.exit(1); });
