-- Migration: Multi-Tenancy, White-Label Branding & Partner Portal
-- Adds org-level branding, custom domain verification, partner accounts,
-- and partner-to-org relationship tables.

-- ─── Org Branding ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_branding (
  id                  serial PRIMARY KEY,
  org_id              integer NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  app_name            text,
  tagline             text,
  logo_url            text,
  favicon_url         text,
  primary_color       text NOT NULL DEFAULT '#6366f1',
  secondary_color     text NOT NULL DEFAULT '#7c3aed',
  accent_color        text NOT NULL DEFAULT '#06b6d4',
  background_color    text NOT NULL DEFAULT '#0f172a',
  surface_color       text NOT NULL DEFAULT '#1e293b',
  text_color          text NOT NULL DEFAULT '#f8fafc',
  custom_css          text,
  email_from_name     text,
  email_footer_text   text,
  support_email       text,
  support_url         text,
  privacy_url         text,
  terms_url           text,
  is_active           boolean NOT NULL DEFAULT true,
  updated_by_user_id  integer REFERENCES users(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS org_branding_org_id_idx ON org_branding (org_id);

-- ─── Custom Domains ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_custom_domains (
  id                    serial PRIMARY KEY,
  org_id                integer NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain                text NOT NULL,
  status                text NOT NULL DEFAULT 'pending_verification'
                          CHECK (status IN ('pending_verification','verified','active','failed','disabled')),
  verification_method   text NOT NULL DEFAULT 'dns_txt'
                          CHECK (verification_method IN ('dns_txt','dns_cname','http_file')),
  verification_token    text NOT NULL,
  verification_record   text,
  ssl_status            text NOT NULL DEFAULT 'pending'
                          CHECK (ssl_status IN ('pending','provisioning','active','failed','expired')),
  ssl_provider          text,
  ssl_expires_at        timestamptz,
  last_verified_at      timestamptz,
  last_check_at         timestamptz,
  failure_reason        text,
  is_primary            boolean NOT NULL DEFAULT false,
  created_by_user_id    integer REFERENCES users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS org_custom_domains_domain_idx   ON org_custom_domains (domain);
CREATE        INDEX IF NOT EXISTS org_custom_domains_org_id_idx   ON org_custom_domains (org_id);
CREATE        INDEX IF NOT EXISTS org_custom_domains_status_idx   ON org_custom_domains (status);

-- ─── Partner Accounts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_accounts (
  id                    serial PRIMARY KEY,
  name                  text NOT NULL,
  slug                  text NOT NULL,
  owner_user_id         integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  org_id                integer REFERENCES organizations(id) ON DELETE SET NULL,
  status                text NOT NULL DEFAULT 'pending_approval'
                          CHECK (status IN ('active','suspended','pending_approval')),
  tier                  text NOT NULL DEFAULT 'reseller'
                          CHECK (tier IN ('referral','reseller','white_label','oem')),
  commission_rate       text NOT NULL DEFAULT '0.20',
  max_managed_tenants   integer NOT NULL DEFAULT 10,
  contact_email         text,
  contact_name          text,
  website               text,
  notes                 text,
  metadata              jsonb DEFAULT '{}',
  approved_at           timestamptz,
  approved_by_user_id   integer REFERENCES users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_accounts_slug_idx   ON partner_accounts (slug);
CREATE        INDEX IF NOT EXISTS partner_accounts_owner_idx  ON partner_accounts (owner_user_id);
CREATE        INDEX IF NOT EXISTS partner_accounts_status_idx ON partner_accounts (status);

-- ─── Partner ↔ Org Assignments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_org_assignments (
  id                      serial PRIMARY KEY,
  partner_id              integer NOT NULL REFERENCES partner_accounts(id) ON DELETE CASCADE,
  org_id                  integer NOT NULL REFERENCES organizations(id)    ON DELETE CASCADE,
  access_level            text NOT NULL DEFAULT 'manage'
                            CHECK (access_level IN ('view','manage','admin')),
  provisioned_by_user_id  integer REFERENCES users(id) ON DELETE SET NULL,
  notes                   text,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, org_id)
);

CREATE INDEX IF NOT EXISTS partner_org_assignments_partner_idx ON partner_org_assignments (partner_id);
CREATE INDEX IF NOT EXISTS partner_org_assignments_org_idx     ON partner_org_assignments (org_id);

-- ─── Partner Users ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_users (
  id                  serial PRIMARY KEY,
  partner_id          integer NOT NULL REFERENCES partner_accounts(id) ON DELETE CASCADE,
  user_id             integer NOT NULL REFERENCES users(id)            ON DELETE CASCADE,
  role                text NOT NULL DEFAULT 'member'
                        CHECK (role IN ('owner','admin','member')),
  invited_by_user_id  integer REFERENCES users(id) ON DELETE SET NULL,
  joined_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id, user_id)
);

CREATE INDEX IF NOT EXISTS partner_users_partner_idx ON partner_users (partner_id);
CREATE INDEX IF NOT EXISTS partner_users_user_idx    ON partner_users (user_id);

-- ─── Org Branding: secondary_color column (safe if already present) ───────────
ALTER TABLE org_branding ADD COLUMN IF NOT EXISTS secondary_color text NOT NULL DEFAULT '#7c3aed';
