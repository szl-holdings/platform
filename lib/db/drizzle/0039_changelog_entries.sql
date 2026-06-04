CREATE TABLE IF NOT EXISTS "changelog_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "version" text NOT NULL,
  "title" text NOT NULL,
  "date" timestamp DEFAULT now() NOT NULL,
  "category" text DEFAULT 'feature' NOT NULL,
  "body" text NOT NULL,
  "tags" jsonb DEFAULT '[]'::jsonb,
  "published" text DEFAULT 'true' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "changelog_date_idx" ON "changelog_entries" USING btree ("date");
CREATE INDEX IF NOT EXISTS "changelog_category_idx" ON "changelog_entries" USING btree ("category");
