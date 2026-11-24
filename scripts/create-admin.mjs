// Create (or reset the password of) a staff account for the admin panel.
//
//   npm run admin:create -- ops@nexgenplc.com "Abebe Kebede" staff
//   npm run admin:create -- boss@nexgenplc.com "Owner Name" owner
//
// A strong random password is generated and printed ONCE — hand it over on a
// side channel and have them change it… when the panel grows a change-password
// screen; until then re-running this command is the reset path (it updates the
// existing row rather than failing on the unique email).
//
// Hash format matches src/lib/password.ts exactly, so the admin app verifies
// these with the same code players use.
import crypto from 'node:crypto';
import pg from 'pg';
import 'dotenv/config';

const [email, fullName, role = 'staff'] = process.argv.slice(2);
if (!email || !email.includes('@') || !fullName) {
  console.error('\nUsage: npm run admin:create -- <email> "<full name>" [owner|staff]\n');
  process.exit(1);
}
if (!['owner', 'staff'].includes(role)) {
  console.error(`\nRole must be 'owner' or 'staff', got '${role}'.\n`);
  process.exit(1);
}

const N = 16384, R = 8, P = 1, KEYLEN = 32;
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 128 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set.');
const client = new pg.Client({
  connectionString: url,
  ssl: process.env.PGSSL === 'true' ? true : process.env.PGSSL === 'no-verify' ? { rejectUnauthorized: false } : undefined,
});
await client.connect();

// URL-safe alphabet, no ambiguous chars; 20 chars ≈ 119 bits of entropy.
const password = crypto.randomBytes(24).toString('base64url').replace(/[-_]/g, '').slice(0, 20);

const { rows } = await client.query(
  `INSERT INTO admins (email, full_name, password_hash, role)
   VALUES (lower($1), $2, $3, $4)
   ON CONFLICT (email) DO UPDATE
     SET password_hash = $3, full_name = $2, role = $4, disabled = FALSE
   RETURNING id, (xmax = 0) AS created`,
  [email.trim(), fullName.trim(), hashPassword(password), role],
);

const host = new URL(url).host;
console.log(`\n✓ ${rows[0].created ? 'Created' : 'Updated (password reset)'} ${role} account for ${email.toLowerCase()}`);
console.log(`  database: ${host}`);
console.log(`\n  Temporary password (shown once, not stored anywhere else):\n`);
console.log(`      ${password}\n`);
await client.end();
