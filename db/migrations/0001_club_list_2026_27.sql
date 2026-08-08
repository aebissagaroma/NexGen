-- 0001 — move the club list onto the 2026/27 Premier League.
--
-- Coventry City, Ipswich Town and Hull City replace West Ham United,
-- Wolverhampton Wanderers and Burnley. Every other club keeps its slot but has
-- its closing group set, since `grp` was added with a blanket DEFAULT 'B' and
-- the default is not the right value for the ten Group A clubs.
--
-- Why this exists as a migration and not only in db/seed.sql: the seed is a
-- separate manual step, and the deploy does not run it. Between shipping code
-- that knows about Coventry and remembering to seed, the live form offers three
-- clubs the database has never heard of and every one of those entries fails.
-- A migration that runs with the deploy closes that window.
--
-- Safe to run more than once: every statement is idempotent, and the runner
-- records it in schema_migrations so it is applied once per database anyway.

-- The twenty current brackets. ON CONFLICT so a database that already has a
-- club converges on the right name, city, order and group rather than being
-- skipped — this is what fixes the ten Group A clubs left on the 'B' default.
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

-- Retire the clubs that are no longer in the competition.
--
-- Guarded by NOT EXISTS because registrations.club_code is a foreign key to
-- clubs.code: deleting a club somebody has entered would fail on the constraint,
-- and a cascade would silently take their entry with it. If an entry references
-- a retired club the row stays and the check below refuses the migration — who
-- that entrant gets moved to is an ops decision, not one a script should make.
--
-- LEI and SOU were retired in an earlier round and are included so a database
-- seeded before that converges too.
DELETE FROM clubs c
 WHERE c.code IN ('WHU', 'WOL', 'BUR', 'LEI', 'SOU')
   AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.club_code = c.code);

-- Fail loudly rather than leave the list half-migrated. The runner wraps each
-- migration in a transaction, so raising here rolls the whole file back and the
-- migration stays unrecorded — it will be retried once the entries are moved.
DO $do$
DECLARE stuck TEXT;
BEGIN
  SELECT string_agg(c.code, ', ') INTO stuck
    FROM clubs c WHERE c.code IN ('WHU', 'WOL', 'BUR', 'LEI', 'SOU');
  IF stuck IS NOT NULL THEN
    RAISE EXCEPTION
      'Retired clubs still have entries against them: %. Move those entrants to a current club, then re-run: npm run db:migrate', stuck;
  END IF;
END $do$;

-- The site ships a fixed list of twenty brackets and reads entry counts per
-- club, so a database with the wrong number is a bug that shows on the page.
DO $do$
DECLARE n INT;
BEGIN
  SELECT count(*) INTO n FROM clubs;
  IF n <> 20 THEN
    RAISE EXCEPTION 'Expected 20 clubs after migration, found %.', n;
  END IF;
END $do$;
