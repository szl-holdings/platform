-- Create carlota_team_members table for capacity planning dashboard
CREATE TABLE IF NOT EXISTS carlota_team_members (
  id text PRIMARY KEY,
  name text NOT NULL,
  title text NOT NULL,
  skills jsonb NOT NULL DEFAULT '[]',
  allocations jsonb NOT NULL DEFAULT '[]',
  utilisation integer NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'optimal' CHECK (status IN ('optimal', 'over', 'under', 'bench')),
  day_rate integer NOT NULL DEFAULT 0,
  is_seeded boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
