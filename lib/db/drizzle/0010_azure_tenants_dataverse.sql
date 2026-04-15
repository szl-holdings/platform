-- Azure AD Multi-Tenant Provisioning & Dynamics 365 Dataverse Integration
-- Migration: 0007_azure_tenants_dataverse

CREATE TABLE IF NOT EXISTS "azure_tenants" (
  "id" serial PRIMARY KEY NOT NULL,
  "azure_tenant_id" text NOT NULL UNIQUE,
  "display_name" text NOT NULL,
  "domain" text,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'active', 'suspended')),
  "admin_consent_granted" text NOT NULL DEFAULT 'pending' CHECK ("admin_consent_granted" IN ('pending', 'granted', 'revoked')),
  "organization_id" integer REFERENCES organizations(id) ON DELETE SET NULL,
  "config" jsonb DEFAULT '{}',
  "provisioned_at" timestamp,
  "provisioned_by_user_id" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "azure_tenants" ADD COLUMN IF NOT EXISTS "organization_id" integer REFERENCES "organizations"("id") ON DELETE SET NULL;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "azure_tenants_tenant_id_idx" ON "azure_tenants" ("azure_tenant_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "dataverse_connections" (
  "id" serial PRIMARY KEY NOT NULL,
  "azure_tenant_id" text NOT NULL,
  "org_url" text NOT NULL,
  "org_name" text,
  "auth_method" text NOT NULL DEFAULT 'client_credentials' CHECK ("auth_method" IN ('client_credentials', 'delegated')),
  "client_id" text,
  "client_secret" text,
  "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'active', 'error', 'disconnected')),
  "sync_config" jsonb DEFAULT '{}',
  "last_sync_at" timestamp,
  "last_sync_status" text,
  "last_sync_error" text,
  "entity_sync_counts" jsonb DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
