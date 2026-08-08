// Runs migrations during a Vercel PRODUCTION build, and only then.
//
// Wired into vercel.json as part of buildCommand, ahead of `next build`, so the
// database is up to date before the deployment that needs it can serve traffic.
// The failure this closes is not hypothetical: #21 shipped a club list the
// database did not have, and every entry into one of the three new clubs failed
// until the migration was run by hand.
//
// WHY THE GATE IS THE IMPORTANT PART
//
// A Vercel build runs for previews and branch deploys too, and this project has
// one database — DATABASE_URL points at production in every environment. An
// ungated migration in buildCommand would mean every preview build, on every
// pull request, migrates production. So: production builds only, and nothing
// else even connects.
//
// Local `npm run build` sets no VERCEL_ENV and therefore skips as well, which is
// what you want — building the site should never touch a live database.
import { migrateDatabase } from './migrate.mjs';

const env = process.env.VERCEL_ENV; // 'production' | 'preview' | 'development'

if (env !== 'production') {
  console.log(`· migrations skipped (VERCEL_ENV=${env ?? 'unset'}, production only)`);
  process.exit(0);
}

console.log('· production build — bringing the database up to date');

try {
  await migrateDatabase();
  console.log('✓ database ready');
} catch (e) {
  // Fail the build rather than deploy against a database that is not ready.
  //
  // This does mean a database outage blocks deploys. That is the intended
  // trade: a build that fails is visible and costs a retry, whereas code
  // serving traffic against a schema it does not match fails silently, in
  // public, on whichever request happens to hit the missing column.
  console.error('\n✗ migration failed — the build is stopped so nothing deploys against a stale database.');
  console.error(e);
  process.exit(1);
}
