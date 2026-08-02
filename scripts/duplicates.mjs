// Report players holding more than one entry.
//
//   npm run db:duplicates
//
// Read-only — it never deletes anything, because which entry to keep is an ops
// decision (the player may have paid for one of them).
//
// Run this if `npm run db:migrate` warned that a uniq_reg_* index could not be
// created. That warning means the database already contains duplicates, so the
// index that prevents new ones was skipped. Resolve the rows listed here, then
// re-run the migration and confirm the summary at the bottom reports every index.
import pg from 'pg';
import 'dotenv/config';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (copy .env.example to .env).');

const client = new pg.Client({
  connectionString: url,
  ssl: process.env.PGSSL === 'true' ? true : process.env.PGSSL === 'no-verify' ? { rejectUnauthorized: false } : undefined,
});
await client.connect();

// Same canonicalisation the unique indexes use, so this finds exactly the rows
// that would block them — including +tag and Gmail-dot aliases of one address.
const GROUPS = [
  { label: 'email', expr: 'ec_email_canon(email)' },
  { label: 'ID number', expr: 'id_hash' },
  { label: 'gamertag', expr: 'ec_tag_canon(gamertag)' },
  { label: 'account', expr: 'user_id::text' },
];

let total = 0;
for (const { label, expr } of GROUPS) {
  const { rows } = await client.query(
    `SELECT ${expr} AS key, count(*)::int AS n,
            json_agg(json_build_object(
              'id', id, 'name', full_name, 'email', email, 'tag', coalesce('••••' || id_last4, '—'),
              'club', club_code, 'payment', payment_status, 'created', created_at
            ) ORDER BY created_at) AS entries
     FROM registrations
     WHERE ${expr} IS NOT NULL
     GROUP BY 1 HAVING count(*) > 1
     ORDER BY 2 DESC`,
  );

  if (!rows.length) {
    console.log(`✓ ${label}: no duplicates`);
    continue;
  }

  console.log(`\n✗ ${label}: ${rows.length} duplicated value(s)`);
  for (const r of rows) {
    total += r.n - 1;
    console.log(`\n  ${r.key} — ${r.n} entries`);
    for (const e of r.entries) {
      const kept = e === r.entries[0] ? 'oldest' : '      ';
      console.log(`    [${kept}] ${e.club} ${String(e.tag).padEnd(18)} ${e.email}`);
      console.log(`             ${e.id}  payment=${e.payment}  ${new Date(e.created).toISOString().slice(0, 16)}`);
    }
  }
}

// Keep in step with `wanted` in scripts/migrate.mjs.
const EXPECTED = ['uniq_reg_email', 'uniq_reg_idnum', 'uniq_reg_tag', 'uniq_reg_user'];
const { rows: idx } = await client.query(
  `SELECT relname FROM pg_class WHERE relname = ANY($1) ORDER BY relname`,
  [EXPECTED],
);
console.log(`\n── enforcement ──`);
console.log(`indexes in place: ${idx.length}/${EXPECTED.length}${idx.length ? ' — ' + idx.map((r) => r.relname).join(', ') : ''}`);
if (idx.length < EXPECTED.length) console.log('⚠  duplicates are NOT being blocked. Resolve the rows above, then: npm run db:migrate');
if (total) console.log(`${total} surplus entr${total === 1 ? 'y' : 'ies'} to resolve.`);

await client.end();
