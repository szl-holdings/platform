# Database Schema Audit

**Date:** 2026-04-02  
**Author:** Engineering  
**Status:** Current — reflects all applied migrations through `0021_feedback_tables`

---

## Overview

This document is the authoritative schema audit for all core entities in the SZL Platform. It covers table definitions, column intent, foreign key relationships, index coverage, and tenancy ownership for every significant entity group.

---

## 1. Identity & Access

### `users`
Core user accounts. Supports Replit OIDC and Azure AD sign-in paths via `replit_id`.

| Column | Type | Notes |
|---|---|---|
| id | serial PK | Internal ID |
| replit_id | text UNIQUE | External identity key (also used for `aad:<oid>` from Azure AD) |
| email | text UNIQUE | May be null for some OIDC providers |
| display_name | text NOT NULL | Display name |
| avatar_url | text | Profile image URL |
| bio | text | Optional bio |
| platform_role | text | Canonical role enum (11 values) |
| team | text | Optional team label |
| is_active | boolean DEFAULT true | Soft-disable without deleting |
| last_login_at | timestamp | Updated at auth time |
| created_at / updated_at | timestamp | Standard audit timestamps |

### `roles`
Named system roles. Current enum: `super_admin`, `admin`, `editor`, `member`, `client`, `authenticated`, `exec`, `ops`, `compliance`, `maintenance`, `analyst`, `viewer`, `operator`, `seller`, `client_viewer`, `creative_user`.

### `user_roles`
Many-to-many join between users and roles.

| Column | Type | Notes |
|---|---|---|
| user_id | FK → users | Cascade delete |
| role_id | FK → roles | Cascade delete |
| assigned_at | timestamp | When role was assigned |

Unique constraint: `(user_id, role_id)`.

### `sessions`
Server-side session tokens issued at login. TTL enforced at query time.

| Column | Type | Notes |
|---|---|---|
| user_id | FK → users | Cascade delete |
| token | text UNIQUE | Random 32-byte hex token |
| expires_at | timestamp | Session expiry |
| ip_address | text | Recorded at login |
| user_agent | text | Recorded at login |

### `api_keys`
Long-lived service-to-service keys.

| Column | Type | Notes |
|---|---|---|
| user_id | FK → users | Owner |
| name | text | Human label |
| key_hash | text UNIQUE | SHA-256 hash of raw key |
| key_prefix | text | Display prefix (not secret) |
| scopes | jsonb | Allowed scopes |
| is_active | boolean | Revocable |
| expires_at | timestamp | Optional expiry |

---

## 2. Organizations & Multi-Tenancy

### `organizations`
Root tenant entity. Each organization represents an isolated tenant boundary.

| Column | Type | Notes |
|---|---|---|
| slug | text UNIQUE | URL-safe identifier |
| org_type | text | `internal`, `pilot`, `demo`, etc. |
| status | text enum | `active`, `inactive`, `suspended` |
| plan | text enum | `free`, `starter`, `professional`, `enterprise` |
| billing_customer_id | text | Stripe customer reference |
| domain | text | Email domain for SSO matching |

### `org_members`
User membership in an organization with a local role.

| Column | Type | Notes |
|---|---|---|
| org_id | FK → organizations | Cascade delete |
| user_id | FK → users | Cascade delete |
| role | text enum | `owner`, `admin`, `member`, `viewer` |
| joined_at | timestamp | Membership start date |

### `organization_memberships`
Alternative membership table used by the CMS system with CMS-specific roles (`public`, `authenticated`, `member`, `client`, `editor`, `admin`, `super_admin`).

### `azure_tenants`
Provisioned Microsoft Entra ID (Azure AD) tenants mapped to platform organizations.

| Column | Type | Notes |
|---|---|---|
| azure_tenant_id | text UNIQUE | Microsoft tenant GUID |
| status | text enum | `pending`, `active`, `suspended` |
| admin_consent_granted | text enum | `pending`, `granted`, `revoked` |
| organization_id | FK → organizations | Nullable; set after org is linked |
| provisioned_at | timestamp | Consent grant time |

### `tenant_branding`
Per-tenant white-label configuration (logo, colors, email sender).

### `dataverse_connections`
Microsoft Dataverse integration per Azure tenant.

---

## 3. SCIM Provisioning

### `scim_tokens`
Bearer tokens issued to IdP providers for SCIM 2.0 API access.

| Column | Type | Notes |
|---|---|---|
| tenant_id | FK → azure_tenants | Which tenant this token belongs to |
| token_hash | text UNIQUE | SHA-256 of raw token |
| token_prefix | text | Safe display prefix |
| is_active | boolean | Revocable |
| expires_at | timestamp | Optional expiry |

### `scim_groups`
Azure AD groups synced via SCIM. Mapped to platform roles via `platform_role`.

### `scim_group_members`
User-group membership from SCIM sync.

### `scim_provisioned_users`
Tracks each SCIM-provisioned user with sync state and assigned role.

### `scim_sync_logs`
Full audit trail of every SCIM operation (create/update/delete user or group).

---

## 4. Workflows, Signals & Actions

### `alloy_workflows`
Workflow definitions owned by an organization.

| Key columns | Notes |
|---|---|
| org_id | FK → organizations — tenant isolation |
| trigger_type | `manual`, `signal`, `schedule`, `webhook` |
| status | `active`, `paused`, `draft` |

### `alloy_signals`
Real-time signals generated by monitoring and AI systems.

| Key columns | Notes |
|---|---|
| org_id | FK → organizations — tenant isolation |
| severity | `low`, `medium`, `high`, `critical` |
| status | `new`, `acknowledged`, `resolved`, `dismissed` |
| value_at_risk_cents | bigint — financial impact |

### `alloy_workflow_runs`
Execution records for workflow invocations.

### `alloy_artifacts`
Output artifacts produced by workflow runs.

---

## 5. Approvals & AI Decisions

### `szl_approvals`
Human-in-the-loop approval records linked to signals and actions.

| Key columns | Notes |
|---|---|
| org_id | FK → organizations — tenant isolation |
| status | `pending`, `approved`, `rejected`, `expired` |
| requested_by | FK → users |
| approved_by | FK → users (nullable) |
| approved_at | timestamp |

### `szl_actions`
Executable actions proposed by the AI engine.

| Key columns | Notes |
|---|---|
| org_id | FK → organizations |
| status | `proposed`, `approved`, `rejected`, `executing`, `done`, `failed` |
| impact_level | `low`, `medium`, `high`, `critical` |
| requires_approval | boolean |

---

## 6. Audit Records

### `audit_events`
Platform-wide audit event stream. All sensitive actions write here.

| Column | Type | Notes |
|---|---|---|
| user_id | FK → users (nullable) | Actor; null for system events |
| action | text NOT NULL | Verb: `login`, `create`, `update`, `delete`, etc. |
| entity_type | text NOT NULL | Resource type |
| entity_id | text | Resource identifier |
| ip_address | text | Originating IP |
| user_agent | text | Client user agent |
| old_values | jsonb | Before state (for updates) |
| new_values | jsonb | After state |

### `audit_logs`
CMS-layer audit log linked to `organization_id` and `site_id`.

### `activity_log`
General user activity feed (less sensitive than audit_events).

---

## 7. Subscriptions & Billing

### `billing_plans`
Platform billing plan definitions (`free`, `starter`, `professional`, `enterprise`).

### `subscriptions`
Active subscriptions linking organizations to plans.

| Key columns | Notes |
|---|---|
| org_id | FK → organizations |
| plan_id | FK → billing_plans |
| status | `active`, `trialing`, `past_due`, `canceled` |
| stripe_subscription_id | text |

### `invoices`
Invoice records per org subscription.

### `entitlements`
Feature entitlements per plan (limits, booleans, usage caps).

### `usage_events`
Per-org feature usage events (API calls, webhooks, etc.).

---

## 8. Notifications

### `notifications`
User-facing in-app and push notifications.

| Key columns | Notes |
|---|---|
| user_id | FK → users |
| type | `info`, `success`, `warning`, `error`, `action_required` |
| channel | `in_app`, `email`, `sms`, `push` |
| read_at | timestamp | Nullable until read |

### `notification_preferences`
Per-user channel enable/disable settings.

### `push_tokens`
Mobile push token registration per user/device.

---

## 9. Files & Assets

### `files`
All uploaded files. Tenant-scoped.

| Key columns | Notes |
|---|---|
| user_id | FK → users — uploader |
| org_id | FK → organizations — tenant owner |
| storage_key | text — object storage key |
| category | `document`, `image`, `video`, `audio`, `other` |

### `assets`
Named asset records referencing files, with tags and metadata.

---

## 10. Domain-Specific Entity Groups

### Vessels
Tables: `vessels_fleets`, `vessels`, `vessels_positions`, `vessels_cargo`, `vessels_routes`, `vessels_alert_rules`, `vessels_alerts`, `vessels_weather_snapshots`, `vessels_simulations`, `voyages`, `fleet_exceptions`, `corridors`, `vessel_maintenance`, `ports`.

All fleet tables carry `fleet_id` or are joined through `vessels` → `fleet_id` → `vessels_fleets.org_id`. Tenant isolation flows through org_id on fleet tables.

### Maritime (SZL Canonical)
Tables: `szl_vessels`, `szl_ports`, `szl_routes`, `szl_voyages`, `szl_signals`, `szl_actions`, `szl_workflows`, `szl_workflow_runs`, `szl_approvals`, `szl_exceptions`, `szl_readiness_items`, `szl_feature_flags`.

All carry explicit `org_id` FK → organizations for hard tenant isolation.

### Lyte (AIOps)
Tables: `lyte_workspaces`, `lyte_signals`, `lyte_actions`, `lyte_command_cards`, `lyte_incidents`, `lyte_playbooks`, `lyte_recommendations`, `lyte_saved_views`, `lyte_readiness_items`, `lyte_signal_timeline`, `lyte_dashboards`.

Tenant scope flows through `lyte_workspaces.org_id`.

### Aegis / Firestorm (SOC)
Tables: `firestorm_scenarios`, `firestorm_assessments`, `firestorm_simulation_runs`, `firestorm_findings`, `firestorm_risk_scores`, `firestorm_campaigns`, `firestorm_leads`, `firestorm_analytics`, `firestorm_assets`, `firestorm_workflow_actions`.

### Terra (Real Estate)
Tables: `terra_properties`, `terra_agents`, `terra_brokerages`, `terra_listings`, `terra_inquiries`, `terra_transactions`.

### Carlota Jo (Consulting)
Tables: `carlota_inquiries`, `carlota_reservations`, `carlota_services`, `carlota_client_profiles`.

### Holdings
Tables: `holdings_ventures`, `holdings_milestones`, `holdings_metrics`, `holdings_leadership`, `holdings_inquiries`.

---

## Index Coverage Summary

| Area | Coverage Status |
|---|---|
| users.replit_id | UNIQUE index — covered |
| users.email | UNIQUE index — covered |
| sessions.token | UNIQUE index — covered |
| user_roles.(user_id, role_id) | UNIQUE index — covered |
| organizations.slug | UNIQUE index — covered |
| azure_tenants.azure_tenant_id | UNIQUE index — covered |
| scim_tokens.token_hash | UNIQUE index — covered |
| scim_provisioned_users.(tenant_id, user_id) | UNIQUE index — covered |
| api_keys.key_hash | UNIQUE index — covered |
| firestorm_findings — category/status/priority | Indexes exist |
| platform_job_runs — correlation/domain/status/type | Indexes exist |
| org_members — no composite unique | **Gap: (org_id, user_id) should be unique** |

---

## Known Gaps & Recommendations

| Gap | Severity | Recommendation |
|---|---|---|
| `org_members` has no unique constraint on `(org_id, user_id)` | Medium | Add unique index to prevent duplicate membership rows |
| `sessions` has no index on `expires_at` | Low | Add index to accelerate session cleanup queries |
| `audit_events` has no index on `entity_type` or `user_id` | Medium | Add indexes to support audit log queries by actor and resource |
| `notifications` has no index on `user_id` | Medium | Add index for per-user notification queries |
| `files.org_id` not indexed | Low | Add index for per-tenant file listing |
