// Runs once when the server starts, before it accepts a request.
//
// Its job is to turn a missing secret into a loud startup failure rather than a
// quiet one discovered by the first person who tries to register. Checking at
// use-time still throws, but by then a real entrant has filled in the form and
// been handed a 500 — and on a launch night nobody is reading logs closely
// enough to catch that quickly.
//
// Deliberately does NOT run at build time: `next build` has no production
// environment, and failing there would block a deploy over a variable that is
// set on the server. The `nodejs` guard keeps it off the Edge runtime too.

/** Environment that must be present and sane before the server serves anything. */
function checkRequiredEnv(): string[] {
  const problems: string[] = [];

  const idSecret = process.env.ID_HASH_SECRET;
  if (!idSecret) {
    problems.push(
      'ID_HASH_SECRET is not set. Registration cannot de-duplicate entries without it. ' +
      'Set it to a long random value and keep it stable for the whole tournament — ' +
      'changing it later orphans every ID hash already stored.',
    );
  } else if (idSecret.length < 16) {
    problems.push('ID_HASH_SECRET is shorter than 16 characters. Use a long random value.');
  }

  if (!process.env.SESSION_SECRET) {
    problems.push('SESSION_SECRET is not set. Sign-in sessions cannot be signed without it.');
  }
  if (!process.env.DATABASE_URL) {
    problems.push('DATABASE_URL is not set. Nothing that reads or writes data will work.');
  }

  return problems;
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const problems = checkRequiredEnv();
  if (problems.length === 0) return;

  const message =
    'ELECTROCUP: required configuration is missing\n' +
    problems.map((p) => `  · ${p}`).join('\n');

  // In production a half-configured server is worse than no server: it accepts
  // registrations it cannot de-duplicate. Refuse to start.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(message);
  }

  // Locally, warn rather than block — the dev server is routinely run against a
  // scratch database while working on unrelated pages.
  console.warn(`\n⚠  ${message}\n`);
}
