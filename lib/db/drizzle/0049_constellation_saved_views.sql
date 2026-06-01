CREATE TABLE IF NOT EXISTS "constellation_saved_views" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "domain" text NOT NULL,
  "name" text NOT NULL,
  "filters" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "constellation_saved_views_user_domain_name_uq"
  ON "constellation_saved_views" ("user_id", "domain", "name");

CREATE INDEX IF NOT EXISTS "constellation_saved_views_user_domain_idx"
  ON "constellation_saved_views" ("user_id", "domain");
