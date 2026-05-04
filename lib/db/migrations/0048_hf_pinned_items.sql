CREATE TABLE IF NOT EXISTS "hf_pinned_items" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "org_id" text,
  "kind" text NOT NULL,
  "hf_id" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "task" text,
  "downloads" integer,
  "likes" integer,
  "pinned_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "hf_pinned_items_user_idx" ON "hf_pinned_items" ("user_id");
CREATE INDEX IF NOT EXISTS "hf_pinned_items_org_idx" ON "hf_pinned_items" ("org_id");
CREATE INDEX IF NOT EXISTS "hf_pinned_items_kind_idx" ON "hf_pinned_items" ("kind");
CREATE INDEX IF NOT EXISTS "hf_pinned_items_user_hfid_idx" ON "hf_pinned_items" ("user_id", "kind", "hf_id");
