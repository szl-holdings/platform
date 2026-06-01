CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" serial PRIMARY KEY NOT NULL,
  "ticket_ref" text NOT NULL UNIQUE,
  "org_id" integer REFERENCES "organizations"("id") ON DELETE SET NULL,
  "user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "submitter_name" text NOT NULL,
  "submitter_email" text NOT NULL,
  "subject" text NOT NULL,
  "description" text NOT NULL,
  "category" text NOT NULL DEFAULT 'other',
  "priority" text NOT NULL DEFAULT 'medium',
  "status" text NOT NULL DEFAULT 'open',
  "assigned_to_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "assigned_to_name" text,
  "resolved_at" timestamp,
  "closed_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_ticket_comments" (
  "id" serial PRIMARY KEY NOT NULL,
  "ticket_id" integer NOT NULL REFERENCES "support_tickets"("id") ON DELETE CASCADE,
  "author_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
  "author_name" text NOT NULL,
  "author_role" text NOT NULL DEFAULT 'customer',
  "body" text NOT NULL,
  "is_internal" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_knowledge_articles" (
  "id" serial PRIMARY KEY NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "summary" text NOT NULL,
  "body" text NOT NULL,
  "tags" text[] NOT NULL DEFAULT '{}',
  "is_published" boolean NOT NULL DEFAULT true,
  "view_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
