-- ELECTROCUP 26 — schema
-- Run with: npm run db:migrate  (executes this file top-to-bottom)
-- Idempotent: safe to run repeatedly.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- gen_random_uuid()

-- ── Players / accounts (phone-OTP auth) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        TEXT UNIQUE NOT NULL,          -- E.164, e.g. +2519xxxxxxxx
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  display_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-time passwords. We store only a hash of the code, never the plaintext.
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes (phone, created_at DESC);

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
  phone        TEXT NOT NULL,
  gamertag     TEXT NOT NULL,
  club_code    TEXT NOT NULL REFERENCES clubs (code),
  -- TODO(dev): replace free-text with an enum/lookup once platforms are fixed.
  platform     TEXT,                          -- 'PS5' | 'PC' | 'XBOX' | ...
  city         TEXT,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',  -- 'unpaid' | 'paid' | 'waived'
  status       TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'confirmed' | 'rejected'
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- one entry per phone per club
  UNIQUE (phone, club_code)
);
CREATE INDEX IF NOT EXISTS idx_reg_club ON registrations (club_code);
CREATE INDEX IF NOT EXISTS idx_reg_created ON registrations (created_at DESC);

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

-- ── Brackets / matches (drawn live on 05 Jul 2026; empty until then) ─────────
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
