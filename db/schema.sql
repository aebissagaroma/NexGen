-- ELECTROCUP 26 — schema
-- Run with: npm run db:migrate  (executes this file top-to-bottom)
-- Idempotent: safe to run repeatedly.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ── Players / accounts (email-OTP auth) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,          -- normalised lowercase, e.g. player@mail.com
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-time passwords. We store only a hash of the code, never the plaintext.
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes (email, created_at DESC);
-- Supports the expiry sweep in scripts/cleanup.mjs.
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_codes (expires_at);

-- ── Rate limiting (fixed window counters) ───────────────────────────────────
-- Guards the unauthenticated OTP endpoint: each send costs money and burns
-- sender reputation, so requests are capped per email and per IP.
-- `key` is e.g. 'otp:email:someone@example.com' or 'otp:ip:1.2.3.4'.
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,
  count        INT NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_window ON rate_limits (window_start);

-- ── Clubs (the 20 EPL qualifier brackets) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS clubs (
  code  TEXT PRIMARY KEY,     -- MCI, ARS, LIV ...
  name  TEXT NOT NULL,
  city  TEXT NOT NULL,
  sort  INT  NOT NULL DEFAULT 0
);

-- ── Registrations (a player entering a club's qualifier) ────────────────────
-- TODO(dev): confirm the full field set with NexGen ops. The columns below are
-- a working minimum. Likely additions: platform (PS5/PC/Xbox), EA/PSN/Xbox id,
-- city/region, date_of_birth, emergency_contact, jersey_name, agrees_to_rules.
-- Mirror any change in src/types/index.ts (RegistrationInput) + the register API.
CREATE TABLE IF NOT EXISTS registrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users (id) ON DELETE SET NULL,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL,
  -- Retired: the tournament supplies the consoles, so neither a gamertag nor a
  -- platform is asked for any more. Kept nullable rather than dropped so entries
  -- taken before the change keep their data. See the migration block below.
  gamertag     TEXT,
  club_code    TEXT NOT NULL REFERENCES clubs (code),
  platform     TEXT,                          -- 'PS5' | 'PC' | 'XBOX' | ...
  -- Identity document. `id_hash` is an HMAC of the canonical number and is what
  -- the uniqueness index keys on; `id_last4` lets ops tell two entries apart.
  -- The raw number is never stored — see src/lib/national-id.ts.
  id_hash      TEXT,
  id_last4     TEXT,
  city         TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',  -- 'unpaid' | 'paid' | 'waived'
  status       TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'confirmed' | 'rejected'
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  -- Uniqueness is NOT declared here: CREATE TABLE IF NOT EXISTS is a no-op on an
  -- existing table, so a constraint added here would silently never reach an
  -- already-deployed database. See the "one entry per player" block below.
);
CREATE INDEX IF NOT EXISTS idx_reg_club ON registrations (club_code);
CREATE INDEX IF NOT EXISTS idx_reg_created ON registrations (created_at DESC);

-- Bring an already-deployed database in line with the table definition above.
-- CREATE TABLE IF NOT EXISTS is a no-op once the table exists, so column changes
-- have to be spelled out or they never reach production.
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS id_hash  TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS id_last4 TEXT;
-- Photo of the identity document, held in Vercel Blob. Only the URL is stored.
-- `id_doc_type` is 'fayda' when supplied at sign-up, or 'kebele'/'other' when a
-- player without a Fayda uploads an alternative afterwards.
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS id_doc_url    TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS id_doc_type   TEXT;
-- 'provided' | 'pending' — pending means they asked to submit another document.
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS id_doc_status TEXT NOT NULL DEFAULT 'pending';
-- Players no longer type a gamertag; they pick one the site builds from their
-- name (src/lib/gamertag.ts). Nullable because entries taken before the change
-- may have none, and because it is a display handle, not an identity key.
ALTER TABLE registrations ALTER COLUMN gamertag DROP NOT NULL;
-- Superseded by the partial uniq_reg_tag below, which tolerates NULLs.
DROP INDEX IF EXISTS uniq_reg_gamertag;

-- ── One entry per player ────────────────────────────────────────────────────
-- A player enters ONE club's qualifier and represents that club. Duplicate
-- entries are blocked in the database, not just in the API, so a double-submit
-- or two concurrent requests can never both land.
--
-- Two people are "the same player" if they share a canonical email or a
-- canonical gamertag. Canonicalisation defeats the cheap ways to look like a
-- new person: casing, +tags, and (on Gmail) dots.

-- 'Me+ec@Gmail.com' and 'm.e@googlemail.com' both canonicalise to 'me@gmail.com'.
-- IMMUTABLE so it can back a unique index. The raw address is still stored in
-- `email` and is what we actually send mail to; this is only an identity key.
CREATE OR REPLACE FUNCTION ec_email_canon(raw TEXT) RETURNS TEXT AS $fn$
  SELECT CASE
    WHEN split_part(lower(btrim(raw)), '@', 2) IN ('gmail.com', 'googlemail.com')
      THEN replace(regexp_replace(split_part(lower(btrim(raw)), '@', 1), '\+.*$', ''), '.', '')
           || '@gmail.com'
    ELSE regexp_replace(split_part(lower(btrim(raw)), '@', 1), '\+.*$', '')
         || '@' || split_part(lower(btrim(raw)), '@', 2)
  END
$fn$ LANGUAGE sql IMMUTABLE;

-- 'Ripper 07' / 'ripper07' / ' RIPPER07 ' → 'ripper07'.
CREATE OR REPLACE FUNCTION ec_tag_canon(raw TEXT) RETURNS TEXT AS $fn$
  SELECT lower(regexp_replace(btrim(raw), '\s+', '', 'g'))
$fn$ LANGUAGE sql IMMUTABLE;

-- Each index is created inside its own guard: on a database that already holds
-- duplicate rows the CREATE fails, and an unguarded failure would abort this
-- whole file mid-way. Warn instead, so the rest of the schema still applies and
-- ops can clean up with `npm run db:duplicates` and re-run the migration.
DO $do$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_reg_email ON registrations (ec_email_canon(email));
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'uniq_reg_email NOT created — duplicate emails exist. Run: npm run db:duplicates';
END $do$;

-- Identity document. This is what now stops one person entering twice — the
-- tournament supplies the hardware, so a gamertag no longer identifies anyone.
-- Partial, because entries taken before this change have no id_hash and many
-- NULLs must stay legal.
DO $do$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_reg_idnum
    ON registrations (id_hash) WHERE id_hash IS NOT NULL;
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'uniq_reg_idnum NOT created — duplicate ID numbers exist. Run: npm run db:duplicates';
END $do$;

-- Gamertag stays unique, but as a DISPLAY handle rather than an identity check:
-- it labels a player on brackets, standings and broadcast, so two players cannot
-- share one. Partial so pre-change rows without a tag remain legal.
DO $do$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_reg_tag
    ON registrations (ec_tag_canon(gamertag)) WHERE gamertag IS NOT NULL;
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'uniq_reg_tag NOT created — duplicate gamertags exist. Run: npm run db:duplicates';
END $do$;

-- Partial: user_id goes NULL when an account is deleted (ON DELETE SET NULL),
-- and many NULLs must stay legal.
DO $do$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_reg_user
    ON registrations (user_id) WHERE user_id IS NOT NULL;
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'uniq_reg_user NOT created — duplicate user_ids exist. Run: npm run db:duplicates';
END $do$;

-- Retire the old per-club rule, which permitted one entry in every club. Only
-- once the stricter index above is actually in place — otherwise a database
-- with existing duplicates would end up with no protection at all.
DO $do$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'uniq_reg_email') THEN
    ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_email_club_code_key;
  END IF;
END $do$;

-- ── Appeals ─────────────────────────────────────────────────────────────────
-- Registering twice means disqualification, so there has to be a route back for
-- anyone caught by mistake — a shared family email, a mistyped ID, a genuine
-- twin. Deliberately NOT tied to a registration row: the whole point is that the
-- person may have been blocked before one ever existed.
CREATE TABLE IF NOT EXISTS appeals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  reason      TEXT NOT NULL,
  handled     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appeals_created ON appeals (created_at DESC);

-- ── Announcement notifications ──────────────────────────────────────────────
-- Anyone can ask to be told when a TBA phase gets a date, WITHOUT entering the
-- tournament — so this is deliberately separate from `registrations`.
-- Keyed on the canonical email (same helper the one-entry-per-player rule uses),
-- so +tag and Gmail-dot aliases cannot pad the list. Declared after
-- ec_email_canon() above, which it depends on.
CREATE TABLE IF NOT EXISTS notify_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
DO $do$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS uniq_notify_email
    ON notify_subscribers (ec_email_canon(email));
EXCEPTION WHEN unique_violation THEN
  RAISE WARNING 'uniq_notify_email NOT created — duplicate emails already exist in notify_subscribers.';
END $do$;

-- ── Sponsor inquiries (from the Partners section form) ──────────────────────
CREATE TABLE IF NOT EXISTS sponsor_inquiries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company      TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email        TEXT NOT NULL,
  phone        TEXT,
  tier         TEXT,                          -- 'Title' | 'Platinum' | 'Gold' | 'Broadcast'
  message      TEXT,
  handled      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Brackets / matches (drawn live; date TBA, so empty until then) ──────────
-- Minimal shape so the /bracket viewer can read real data once it exists.
CREATE TABLE IF NOT EXISTS matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_code   TEXT NOT NULL REFERENCES clubs (code),
  round       TEXT NOT NULL,                  -- 'RD256' | 'RD64' | 'RD16' | 'QF' | 'FINAL'
  slot        INT NOT NULL,                   -- position within the round
  player_a    TEXT,
  player_b    TEXT,
  score_a     INT,
  score_b     INT,
  winner      TEXT,                           -- 'a' | 'b' | NULL
  played_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_match_club ON matches (club_code, round, slot);

-- ── Standings (league table for the 38-gameweek season) ─────────────────────
CREATE TABLE IF NOT EXISTS standings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_code   TEXT NOT NULL REFERENCES clubs (code),
  player_tag  TEXT NOT NULL,
  played      INT NOT NULL DEFAULT 0,
  won         INT NOT NULL DEFAULT 0,
  drawn       INT NOT NULL DEFAULT 0,
  lost        INT NOT NULL DEFAULT 0,
  gf          INT NOT NULL DEFAULT 0,
  ga          INT NOT NULL DEFAULT 0,
  points      INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_standings_points ON standings (points DESC);
