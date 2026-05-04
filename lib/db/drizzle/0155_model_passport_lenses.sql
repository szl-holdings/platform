CREATE TABLE IF NOT EXISTS "model_passport_lenses" (
  "lens_id" text PRIMARY KEY,
  "tenant_id" integer NOT NULL,
  "passport_id" text NOT NULL,
  "display_name" text NOT NULL,
  "description" text,
  "envelope" jsonb NOT NULL DEFAULT '{}',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "created_by" text
);

CREATE INDEX IF NOT EXISTS "mpl_tenant_passport_idx" ON "model_passport_lenses" ("tenant_id", "passport_id");
CREATE INDEX IF NOT EXISTS "mpl_passport_idx" ON "model_passport_lenses" ("passport_id");
CREATE INDEX IF NOT EXISTS "mpl_tenant_idx" ON "model_passport_lenses" ("tenant_id");
