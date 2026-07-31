// Runs db/seed.sql against DATABASE_URL. Usage: npm run db:seed
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set.');
  const ssl = process.env.PGSSL === 'true' ? true : process.env.PGSSL === 'no-verify' ? { rejectUnauthorized: false } : undefined;
  const client = new pg.Client({ connectionString: url, ssl });
  await client.connect();
  const sql = readFileSync(join(__dirname, '..', 'db', 'seed.sql'), 'utf8');
  await client.query(sql);
  await client.end();
  console.log('✓ seed applied');
}

main().catch((e) => { console.error(e); process.exit(1); });
