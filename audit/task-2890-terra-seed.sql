-- Task #2890 — Terra demo seed
--
-- Inserts 8 demo terra_properties so the Terra surface (`/terra/`) renders
-- with real data after `pnpm seed` completes. Used because the full
-- `seed:atlas:terra` script stalled holding a DB pool client during Task
-- #2890; full atlas seeding is tracked under follow-up Task #3234.
--
-- Idempotent: ON CONFLICT DO NOTHING on the natural identifier.
-- Run with:  psql "$DATABASE_URL" -f audit/task-2890-terra-seed.sql

INSERT INTO terra_properties (
  id, name, address, city, state, country,
  property_type, asset_class, status,
  square_feet, year_built, last_valuation_usd, created_at, updated_at
) VALUES
  ('terra-demo-ca-01', 'Pacific Heights Tower',     '2400 Pacific Ave',         'San Francisco', 'CA', 'US', 'office',      'trophy',  'active',  420000, 1998, 612000000, NOW(), NOW()),
  ('terra-demo-ca-02', 'Sunset Logistics Hub',      '1500 Cesar Chavez',        'Oakland',       'CA', 'US', 'industrial',  'core',    'active',  680000, 2014, 285000000, NOW(), NOW()),
  ('terra-demo-ny-01', 'Madison 47 Tower',          '47 Madison Ave',           'New York',      'NY', 'US', 'office',      'trophy',  'active',  890000, 2008, 1240000000, NOW(), NOW()),
  ('terra-demo-ny-02', 'Hudson Yards South',        '550 W 30th St',            'New York',      'NY', 'US', 'mixed_use',   'trophy',  'active',  720000, 2019,  995000000, NOW(), NOW()),
  ('terra-demo-il-01', 'Lakeshore Financial Plaza', '200 N Lake Shore Dr',      'Chicago',       'IL', 'US', 'office',      'core',    'active',  540000, 2002,  410000000, NOW(), NOW()),
  ('terra-demo-fl-01', 'Brickell Bay Center',       '1450 Brickell Ave',        'Miami',         'FL', 'US', 'office',      'trophy',  'active',  380000, 2016,  478000000, NOW(), NOW()),
  ('terra-demo-ma-01', 'Seaport District One',      '100 Seaport Blvd',         'Boston',        'MA', 'US', 'office',      'core',    'active',  410000, 2017,  392000000, NOW(), NOW()),
  ('terra-demo-co-01', 'LoDo Innovation Quarter',   '1700 Wynkoop St',          'Denver',        'CO', 'US', 'mixed_use',   'core',    'active',  295000, 2020,  218000000, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
