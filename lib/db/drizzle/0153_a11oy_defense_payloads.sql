-- A11oy Defense — slug-keyed JSONB payload store backing the six
-- /api/internal/a11oy/defense/<slug> read endpoints. Missing this table
-- caused a 500 ("Failed to load defense payload") because the route
-- reads-then-seeds via INSERT on first hit. Mirrors
-- lib/db/src/schema/a11oy_defense.ts. Idempotent.

CREATE TABLE IF NOT EXISTS "a11oy_defense_payloads" (
    "slug" text PRIMARY KEY NOT NULL,
    "payload" jsonb NOT NULL,
    "updated_at" timestamp NOT NULL DEFAULT now()
);
