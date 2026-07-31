// Sweep expired OTP codes and stale rate-limit counters.
//
//   npm run db:cleanup
//
// Safe to run repeatedly and while the app is serving. Schedule it (cron /
// Vercel Cron / Render job) daily — nothing here is time-critical.
//
// The app already deletes an address's spent codes when it issues a new one
// (src/lib/otp.ts); this catches rows for people who never came back.
import pg from 'pg';
import 'dotenv/config';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set (copy .env.example to .env).');

const client = new pg.Client({
  connectionString: url,
  ssl: process.env.PGSSL === 'true' ? true : process.env.PGSSL === 'no-verify' ? { rejectUnauthorized: false } : undefined,
});
await client.connect();

// Keep a short grace period so a code that just expired can still produce a
// precise "Code expired." message rather than "No code requested."
const otp = await client.query(
  `DELETE FROM otp_codes
   WHERE expires_at < now() - interval '1 day'
      OR consumed_at < now() - interval '1 day'`,
);
console.log(`✓ otp_codes:   removed ${otp.rowCount}`);

// Counters are only meaningful inside their window; the longest is 15 minutes.
const rl = await client.query(
  `DELETE FROM rate_limits WHERE window_start < now() - interval '1 hour'`,
);
console.log(`✓ rate_limits: removed ${rl.rowCount}`);

await client.end();
