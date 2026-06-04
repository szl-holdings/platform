-- CMS Content Tables
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sites" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "name" text NOT NULL,
    "brand_label" text,
    "description" text,
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pages" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "slug" text NOT NULL,
    "page_type" text,
    "status" text NOT NULL DEFAULT 'draft',
    "template_key" text,
    "meta_title" text,
    "meta_description" text,
    "og_title" text,
    "og_description" text,
    "canonical_url" text,
    "noindex" boolean NOT NULL DEFAULT false,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sections" (
    "id" serial PRIMARY KEY NOT NULL,
    "page_id" integer NOT NULL REFERENCES "pages"("id") ON DELETE CASCADE,
    "section_key" text NOT NULL,
    "section_type" text,
    "heading" text,
    "subheading" text,
    "body_richtext" text,
    "eyebrow" text,
    "sort_order" integer NOT NULL DEFAULT 0,
    "is_enabled" boolean NOT NULL DEFAULT true,
    "style_variant" text,
    "data_json" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ventures" (
    "id" serial PRIMARY KEY NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "name" text NOT NULL,
    "short_description" text,
    "long_description" text,
    "status_badge" text,
    "stage" text,
    "category" text,
    "primary_cta_label" text,
    "primary_cta_url" text,
    "secondary_cta_label" text,
    "secondary_cta_url" text,
    "accent_token" text,
    "featured_image_url" text,
    "is_featured" boolean NOT NULL DEFAULT false,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "short_description" text,
    "full_description" text,
    "category" text,
    "icon_key" text,
    "is_featured" boolean NOT NULL DEFAULT false,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "features" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "group_key" text,
    "icon_key" text,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "use_cases" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "audience" text,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text,
    "phase_label" text,
    "status" text NOT NULL DEFAULT 'planned',
    "target_quarter" text,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "updates" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "summary" text,
    "body_richtext" text,
    "slug" text NOT NULL,
    "status" text NOT NULL DEFAULT 'draft',
    "published_at" timestamp,
    "featured_image_url" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "testimonials" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "quote" text NOT NULL,
    "attribution_name" text,
    "attribution_title" text,
    "attribution_company" text,
    "is_public" boolean NOT NULL DEFAULT true,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "faqs" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "question" text NOT NULL,
    "answer_richtext" text NOT NULL,
    "category" text,
    "sort_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ctas" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "label" text NOT NULL,
    "url" text NOT NULL,
    "variant" text,
    "helper_text" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "articles" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "excerpt" text,
    "body_richtext_or_mdx" text,
    "author_name" text,
    "status" text NOT NULL DEFAULT 'draft',
    "cover_image_url" text,
    "meta_title" text,
    "meta_description" text,
    "published_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "case_studies" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "summary" text,
    "challenge" text,
    "approach" text,
    "outcome" text,
    "takeaway" text,
    "cover_image_url" text,
    "status" text NOT NULL DEFAULT 'draft',
    "published_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "downloads" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "slug" text NOT NULL,
    "description" text,
    "file_url" text,
    "file_type" text,
    "requires_form" boolean NOT NULL DEFAULT false,
    "status" text NOT NULL DEFAULT 'draft',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "navigation_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "nav_group" text NOT NULL,
    "label" text NOT NULL,
    "url" text NOT NULL,
    "sort_order" integer NOT NULL DEFAULT 0,
    "is_external" boolean NOT NULL DEFAULT false,
    "is_enabled" boolean NOT NULL DEFAULT true,
    "requires_auth" boolean NOT NULL DEFAULT false,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "key" text NOT NULL,
    "value_json" jsonb,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_assets" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer REFERENCES "sites"("id") ON DELETE SET NULL,
    "file_name" text NOT NULL,
    "file_url" text NOT NULL,
    "alt_text" text,
    "mime_type" text,
    "width" integer,
    "height" integer,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "forms" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer NOT NULL REFERENCES "sites"("id") ON DELETE CASCADE,
    "form_key" text NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "success_message" text,
    "notify_email" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contact_submissions" (
    "id" serial PRIMARY KEY NOT NULL,
    "site_id" integer REFERENCES "sites"("id") ON DELETE SET NULL,
    "form_key" text NOT NULL,
    "full_name" text NOT NULL,
    "email" text NOT NULL,
    "company" text,
    "message" text,
    "preferred_timeline" text,
    "metadata_json" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_status" (
    "id" serial PRIMARY KEY NOT NULL,
    "contact_submission_id" integer NOT NULL REFERENCES "contact_submissions"("id") ON DELETE CASCADE,
    "status" text NOT NULL DEFAULT 'new',
    "owner_user_id" integer,
    "notes" text,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "redirects" (
    "id" serial PRIMARY KEY NOT NULL,
    "from_path" text NOT NULL UNIQUE,
    "to_path" text NOT NULL,
    "status_code" integer NOT NULL DEFAULT 301,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Organization enhancements
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "org_type" text;
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active';
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "billing_customer_id" text;
--> statement-breakpoint

-- Organization memberships table (spec role model)
CREATE TABLE IF NOT EXISTS "organization_memberships" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role" text NOT NULL DEFAULT 'member',
    "status" text NOT NULL DEFAULT 'active',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Audit logs (CMS-aware)
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer REFERENCES "organizations"("id") ON DELETE SET NULL,
    "site_id" integer,
    "actor_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
    "action_type" text NOT NULL,
    "entity_type" text NOT NULL,
    "entity_id" text,
    "payload_json" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Vessels product tables (spec-aligned)
CREATE TABLE IF NOT EXISTS "fleets" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "description" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vessels_assets" (
    "id" serial PRIMARY KEY NOT NULL,
    "fleet_id" integer REFERENCES "fleets"("id") ON DELETE SET NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "asset_type" text,
    "imo_or_identifier" text,
    "status" text NOT NULL DEFAULT 'active',
    "latitude" numeric(10, 7),
    "longitude" numeric(10, 7),
    "metadata_json" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "journeys" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "vessel_asset_id" integer REFERENCES "vessels_assets"("id") ON DELETE SET NULL,
    "origin_label" text,
    "destination_label" text,
    "start_time" timestamp,
    "end_time" timestamp,
    "route_geojson" jsonb,
    "status" text NOT NULL DEFAULT 'planned',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vessel_events" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "vessel_asset_id" integer REFERENCES "vessels_assets"("id") ON DELETE SET NULL,
    "event_type" text NOT NULL,
    "severity" text NOT NULL DEFAULT 'medium',
    "title" text NOT NULL,
    "description" text,
    "occurred_at" timestamp DEFAULT now() NOT NULL,
    "metadata_json" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vessel_alerts" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "vessel_asset_id" integer REFERENCES "vessels_assets"("id") ON DELETE SET NULL,
    "journey_id" integer REFERENCES "journeys"("id") ON DELETE SET NULL,
    "alert_type" text NOT NULL,
    "severity" text NOT NULL DEFAULT 'medium',
    "title" text NOT NULL,
    "description" text,
    "status" text NOT NULL DEFAULT 'active',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vessel_reports" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "report_type" text NOT NULL,
    "generated_at" timestamp DEFAULT now() NOT NULL,
    "report_url" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- INCA product tables (spec-aligned)
CREATE TABLE IF NOT EXISTS "signals" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "source_key" text,
    "title" text NOT NULL,
    "description" text,
    "severity" text NOT NULL DEFAULT 'medium',
    "status" text NOT NULL DEFAULT 'new',
    "occurred_at" timestamp DEFAULT now() NOT NULL,
    "metadata_json" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "findings" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "signal_id" integer REFERENCES "signals"("id") ON DELETE SET NULL,
    "title" text NOT NULL,
    "summary" text,
    "confidence_score" numeric(5, 2),
    "severity" text NOT NULL DEFAULT 'medium',
    "status" text NOT NULL DEFAULT 'open',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investigations" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text,
    "status" text NOT NULL DEFAULT 'open',
    "owner_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
    "opened_at" timestamp DEFAULT now() NOT NULL,
    "closed_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "investigation_items" (
    "id" serial PRIMARY KEY NOT NULL,
    "investigation_id" integer NOT NULL REFERENCES "investigations"("id") ON DELETE CASCADE,
    "entity_type" text NOT NULL,
    "entity_id" text NOT NULL,
    "note" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inca_alerts" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "finding_id" integer REFERENCES "findings"("id") ON DELETE SET NULL,
    "title" text NOT NULL,
    "severity" text NOT NULL DEFAULT 'medium',
    "status" text NOT NULL DEFAULT 'active',
    "triggered_at" timestamp DEFAULT now() NOT NULL,
    "metadata_json" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inca_reports" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "report_type" text NOT NULL,
    "generated_at" timestamp DEFAULT now() NOT NULL,
    "report_url" text,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Carlota Jo client portal tables
CREATE TABLE IF NOT EXISTS "client_accounts" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "display_name" text NOT NULL,
    "primary_contact_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
    "status" text NOT NULL DEFAULT 'onboarding',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_documents" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "client_account_id" integer NOT NULL REFERENCES "client_accounts"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text,
    "file_url" text,
    "file_type" text,
    "visibility" text NOT NULL DEFAULT 'client',
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_updates" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "client_account_id" integer NOT NULL REFERENCES "client_accounts"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "summary" text,
    "body_richtext" text,
    "published_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_messages" (
    "id" serial PRIMARY KEY NOT NULL,
    "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "client_account_id" integer NOT NULL REFERENCES "client_accounts"("id") ON DELETE CASCADE,
    "sender_user_id" integer REFERENCES "users"("id") ON DELETE SET NULL,
    "subject" text,
    "body_richtext" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Seed canonical site records
INSERT INTO "sites" ("slug", "name", "brand_label", "description", "is_active")
VALUES
  ('szl-holdings', 'SZL Holdings', 'SZL', 'The parent holding company for the SZL ecosystem of ventures.', true),
  ('vessels', 'Vessels', 'Vessels', 'Maritime intelligence platform for fleet monitoring and route optimization.', true),
  ('inca', 'INCA', 'INCA', 'AI research command center for intelligence, signals, and findings.', true),
  ('carlota-jo', 'Carlota Jo Consulting', 'Carlota Jo', 'Premium consulting services with a private client portal.', true),
  ('stephen-site', 'Stephen Lutar', 'Stephen', 'Personal site — selected work, thesis, and writing.', true)
ON CONFLICT ("slug") DO NOTHING;
