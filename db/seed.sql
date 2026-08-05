-- ELECTROCUP 26 — seed data
-- Run with: npm run db:seed  (after db:migrate). Idempotent via ON CONFLICT.
-- The 20 Premier League clubs = the 20 qualifier brackets.

INSERT INTO clubs (code, name, city, sort) VALUES
  ('MCI', 'Manchester City',        'Manchester',    1),
  ('ARS', 'Arsenal',                'London',        2),
  ('LIV', 'Liverpool',              'Liverpool',     3),
  ('MUN', 'Manchester United',      'Manchester',    4),
  ('CHE', 'Chelsea',                'London',        5),
  ('TOT', 'Tottenham Hotspur',      'London',        6),
  ('NEW', 'Newcastle United',       'Newcastle',     7),
  ('AVL', 'Aston Villa',            'Birmingham',    8),
  ('WHU', 'West Ham United',        'London',        9),
  ('BHA', 'Brighton & Hove Albion', 'Brighton',     10),
  ('CRY', 'Crystal Palace',         'London',       11),
  ('FUL', 'Fulham',                 'London',       12),
  ('BRE', 'Brentford',              'London',       13),
  ('EVE', 'Everton',                'Liverpool',    14),
  ('WOL', 'Wolverhampton',          'Wolverhampton',15),
  ('NFO', 'Nottingham Forest',      'Nottingham',   16),
  ('BOU', 'AFC Bournemouth',        'Bournemouth',  17),
  ('LEE', 'Leeds United',            'Leeds',        18),
  ('BUR', 'Burnley',                 'Burnley',      19),
  ('SUN', 'Sunderland',              'Sunderland',   20)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, city = EXCLUDED.city, sort = EXCLUDED.sort;

-- Retire clubs that are no longer in the competition. Leicester, Ipswich and
-- Southampton were replaced by Leeds, Burnley and Sunderland; without this an
-- already-seeded database keeps all six, and the three retired ones linger in
-- the API response and the admin filters.
--
-- Guarded by NOT EXISTS: registrations reference clubs (code), so deleting a
-- club that someone has entered would either fail on the foreign key or, worse,
-- take their entry with it. If anyone has entered a retired club, it is left in
-- place and reported below — that is an ops decision, not something a seed
-- script should make.
DELETE FROM clubs c
 WHERE c.code IN ('LEI', 'IPS', 'SOU')
   AND NOT EXISTS (SELECT 1 FROM registrations r WHERE r.club_code = c.code);

DO $do$
DECLARE stuck TEXT;
BEGIN
  SELECT string_agg(c.code, ', ') INTO stuck
    FROM clubs c WHERE c.code IN ('LEI', 'IPS', 'SOU');
  IF stuck IS NOT NULL THEN
    RAISE WARNING 'Retired clubs still present because entries reference them: %. Move those entrants to a current club, then re-run: npm run db:seed', stuck;
  END IF;
END $do$;
