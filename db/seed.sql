-- ELECTROCUP 26 — seed data
-- Run with: npm run db:seed  (after db:migrate). Idempotent via ON CONFLICT.
-- The 20 current top-flight English clubs = the 20 qualifier brackets.
--
-- Keep in step with CLUBS in src/data/static.ts — code, name, city and group all
-- have to agree, and every club change must update both files plus this seed.
--
-- This file is the desired state for a NEW database. An existing one is moved by
-- a numbered file in db/migrations, which npm run db:migrate applies once and
-- records. The two overlap on purpose: a fresh database should not have to
-- replay history to arrive at today's list, and a live one must not be reset to
-- get there. So a club change needs BOTH — edit the list here, and add a
-- migration that moves databases already carrying the old one.
--
-- grp: 'A' is last season's top ten, whose brackets close first when their draw
-- is announced. 'B' is everyone else, including the three clubs promoted this
-- summer, and stays open after Group A closes.

INSERT INTO clubs (code, name, city, sort, grp) VALUES
  ('MCI', 'Manchester City',        'Manchester',    1, 'A'),
  ('ARS', 'Arsenal',                'London',        2, 'A'),
  ('LIV', 'Liverpool',              'Liverpool',     3, 'A'),
  ('MUN', 'Manchester United',      'Manchester',    4, 'A'),
  ('CHE', 'Chelsea',                'London',        5, 'A'),
  ('AVL', 'Aston Villa',            'Birmingham',    6, 'A'),
  ('BHA', 'Brighton & Hove Albion', 'Brighton',      7, 'A'),
  ('BRE', 'Brentford',              'London',        8, 'A'),
  ('BOU', 'AFC Bournemouth',        'Bournemouth',   9, 'A'),
  ('SUN', 'Sunderland',             'Sunderland',   10, 'A'),
  ('TOT', 'Tottenham Hotspur',      'London',       11, 'B'),
  ('NEW', 'Newcastle United',       'Newcastle',    12, 'B'),
  ('CRY', 'Crystal Palace',         'London',       13, 'B'),
  ('FUL', 'Fulham',                 'London',       14, 'B'),
  ('EVE', 'Everton',                'Liverpool',    15, 'B'),
  ('NFO', 'Nottingham Forest',      'Nottingham',   16, 'B'),
  ('LEE', 'Leeds United',           'Leeds',        17, 'B'),
  ('COV', 'Coventry City',          'Coventry',     18, 'B'),
  ('IPS', 'Ipswich Town',           'Ipswich',      19, 'B'),
  ('HUL', 'Hull City',              'Hull',         20, 'B')
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, city = EXCLUDED.city, sort = EXCLUDED.sort,
      grp  = EXCLUDED.grp;

-- Retire clubs that are no longer in the competition.
--
-- West Ham, Wolverhampton and Burnley were replaced by Coventry, Ipswich and
-- Hull. Leicester and Southampton were retired in an earlier round of this and
-- are listed again so a database seeded before that still converges.
--
-- NOTE: Ipswich is deliberately NOT in this list any more. It was retired
-- previously and is now a competing club again, so re-adding it above and
-- deleting it here would fight each other on every run.
--
-- Guarded by NOT EXISTS: registrations reference clubs (code), so deleting a
-- club that someone has entered would either fail on the foreign key or, worse,
-- take their entry with it. If anyone has entered a retired club, it is left in
-- place and reported below — that is an ops decision, not something a seed
-- script should make.
DELETE FROM clubs c
 WHERE c.code IN ('WHU', 'WOL', 'BUR', 'LEI', 'SOU')
   AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.club_code = c.code);

DO $do$
DECLARE stuck TEXT;
BEGIN
  SELECT string_agg(c.code, ', ') INTO stuck
    FROM clubs c WHERE c.code IN ('WHU', 'WOL', 'BUR', 'LEI', 'SOU');
  IF stuck IS NOT NULL THEN
    RAISE WARNING 'Retired clubs still present because entries reference them: %. Move those entrants to a current club, then re-run: npm run db:seed', stuck;
  END IF;
END $do$;
