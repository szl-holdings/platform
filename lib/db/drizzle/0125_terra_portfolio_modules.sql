CREATE TABLE IF NOT EXISTS "terra_portfolio_modules" (
  "module" text PRIMARY KEY NOT NULL,
  "payload" jsonb NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
