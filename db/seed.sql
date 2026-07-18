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
  ('LEI', 'Leicester City',         'Leicester',    18),
  ('IPS', 'Ipswich Town',           'Ipswich',      19),
  ('SOU', 'Southampton',            'Southampton',  20)
ON CONFLICT (code) DO UPDATE
  SET name = EXCLUDED.name, city = EXCLUDED.city, sort = EXCLUDED.sort;
