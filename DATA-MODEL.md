# Data Model — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026
**Source:** `lib/db/src/schema/` (132 schema files, 799 tables total)

> The source of truth for the database schema is the Drizzle ORM schema files in `lib/db/src/schema/`. This document describes domain groupings, key tables, relationships, and conventions. For migration history see `lib/db/drizzle/`.

---

## Database

**Engine:** PostgreSQL 16
**ORM:** Drizzle ORM (`@szl-holdings/db`)
**Migration strategy:** Drizzle migrations (`lib/db/drizzle/`)
**Table count:** 799 `pgTable` declarations across 132 schema files
**Counting method:** `grep -rc "= pgTable" lib/db/src/schema/ | awk -F: '{sum += $2} END {print sum}'`

**Connection exports from `@szl-holdings/db`:**
- `.` — db client + pool (default export)
- `./schema` — all schema definitions
- `./schema/canonical` — canonical cross-domain entity types

---

## ORM Conventions

- All tables use snake_case column names.
- Primary keys are typically `id` (UUID or serial depending on domain).
- Timestamps: `created_at`, `updated_at` (auto-managed by Drizzle).
- Soft deletes: `deleted_at` where applicable (not hard deletes).
- All org-scoped tables include `org_id` referencing `organizations.id`.
- Foreign keys are defined with `references()` in Drizzle schema.
- Indexes on `org_id`, `created_at`, and frequently queried fields are declared inline.

---

## Schema Domain Groups

### Authentication & Identity

**Schema files:** `auth.ts`, `api_keys.ts`

| Table | Purpose |
|-------|---------|
| `users` | Platform user accounts (id, email, name, avatar, role, created_at) |
| `sessions` | Server-side sessions (token, user_id, expires_at, ip_hash) |
| `organizations` | Tenant organizations (id, name, plan, settings) |
| `org_members` | User-org membership (user_id, org_id, role: owner/admin/member/viewer) |
| `api_keys` | Service API keys (key_hash, org_id, scopes, expires_at) |

**Key relationships:**
- `users` ← many → `org_members` → `organizations`
- `sessions` → `users`

---

### Audit & Compliance

**Schema files:** `audit_logs.ts`, `audit_chain_events.ts`, `change_events.ts`, `compliance.ts`, `governance.ts`

| Table | Purpose |
|-------|---------|
| `audit_logs` | General audit log (actor_id, action, resource_type, resource_id, org_id, ip_hash, created_at) |
| `audit_chain_events` | Proof-chain events — immutable, append-only audit trail with cryptographic linking |
| `change_events` | Schema/data change events for drift detection |
| `compliance_records` | Compliance framework mappings (SOC 2, ISO 27001, GDPR) |
| `governance_policies` | Policy definitions and enforcement records |

**Key relationships:**
- All audit tables include `org_id` and `actor_id` (references `users.id`)
- `audit_chain_events` links to `audit_logs` for proof-chain verification

---

### Alloy — Execution Fabric

**Schema files:** `alloy.ts`, `alloy_ai_decisions.ts`, `alloy_chat.ts`, `alloy_comms.ts`, `alloy_platform.ts`, `approvals.ts`, `activity.ts`

| Table | Purpose |
|-------|---------|
| `alloy_workflows` | Workflow definitions (id, name, trigger, steps, org_id) |
| `alloy_runs` | Workflow execution instances (workflow_id, status, started_at, completed_at, context) |
| `alloy_run_steps` | Individual step outcomes per run |
| `alloy_approvals` | Pending and completed approval gates (run_id, action, requested_by, approved_by, status) |
| `alloy_ai_decisions` | AI-generated recommendations with confidence scores and reasoning |
| `alloy_chat_sessions` | Alloy AI chat history |
| `alloy_agents` | Registered agent definitions (name, domain, skill_registry) |
| `alloy_skills` | Agent skill definitions |
| `activity_log` | Cross-platform activity feed (actor, action, resource, domain) |

**Key relationships:**
- `alloy_runs` → `alloy_workflows`
- `alloy_run_steps` → `alloy_runs`
- `alloy_approvals` → `alloy_runs`, `users` (requested_by, approved_by)
- `alloy_ai_decisions` → `alloy_runs` or standalone

---

### Aegis / Firestorm — Security Operations

**Schema file:** `firestorm.ts`

~22 tables covering the complete security lifecycle.

| Table | Purpose |
|-------|---------|
| `firestorm_threats` | Detected threats (source, severity, mitre_technique, status, org_id) |
| `firestorm_incidents` | Security incidents (title, severity, status, assigned_to, timeline) |
| `firestorm_incident_events` | Timeline events per incident |
| `firestorm_playbooks` | SOAR playbook definitions |
| `firestorm_playbook_runs` | Playbook execution instances |
| `firestorm_vulnerabilities` | CVE/vulnerability records |
| `firestorm_assets` | Monitored asset inventory |
| `firestorm_indicators` | Threat indicators (IP, hash, domain) |
| `firestorm_intel_feeds` | External intelligence feed subscriptions |
| `firestorm_deception_grids` | Deception/honeypot grid definitions |

**Key relationships:**
- All tables scoped to `org_id`
- `firestorm_incidents` → `firestorm_threats` (N:M via junction)
- `firestorm_playbook_runs` → `firestorm_playbooks`, `firestorm_incidents`

---

### Terra — Real Estate Intelligence

**Schema files:** `terra` (17 tables)

| Table | Purpose |
|-------|---------|
| `terra_properties` | Property records (address, block_lot, borough, distress_score) |
| `terra_distress_signals` | Distress filing records (type, filing_date, source, property_id) |
| `terra_ownership_entities` | Ownership entities (LLC, individual, trust) |
| `terra_ownership_graph` | Ownership graph edges (entity_id, property_id, ownership_pct) |
| `terra_deals` | Deal pipeline records (property_id, stage, value, broker_id) |
| `terra_deal_notes` | Notes and activity per deal |
| `terra_contacts` | Contact CRM (name, type, org_id) |
| `terra_market_signals` | Market intelligence signals |
| `terra_mls_listings` | MLS listing ingestion |
| `terra_lead_scores` | AI-computed lead scores per property |

**Key relationships:**
- `terra_distress_signals` → `terra_properties`
- `terra_ownership_graph` → `terra_ownership_entities`, `terra_properties`
- `terra_deals` → `terra_properties`, `terra_contacts`

---

### Vessels — Maritime Intelligence

**Schema files:** `vessels` (30+ tables)

| Table | Purpose |
|-------|---------|
| `vessels_vessels` | Vessel registry (IMO, name, flag, type, owner_id) |
| `vessels_positions` | AIS position history (vessel_id, lat, lon, speed, heading, timestamp) |
| `vessels_voyages` | Voyage records (vessel_id, origin, destination, status) |
| `vessels_voyage_economics` | P&L per voyage (fuel_cost, cargo_revenue, port_fees) |
| `vessels_anomalies` | Route anomaly and dark activity events |
| `vessels_sanctions_checks` | Sanctions screening results (vessel_id, list, status, checked_at) |
| `vessels_port_calls` | Port call history |
| `vessels_crew` | Crew records |
| `vessels_cargo` | Cargo manifest records |
| `vessels_documents` | Vessel certificate and document store |
| `vessels_insurance` | Marine insurance policies |
| `vessels_commodity_orders` | Commodity trading orders |
| `vessels_commodity_fills` | Order fill records |
| `vessels_commodity_positions` | Open trading positions |
| `vessels_exceptions` | Exception center records (with consequence modeling) |

**Key relationships:**
- `vessels_positions` → `vessels_vessels`
- `vessels_voyages` → `vessels_vessels`
- `vessels_voyage_economics` → `vessels_voyages`
- `vessels_anomalies` → `vessels_vessels`, `vessels_voyages`

---

### PRISM Counsel — Legal Matter Command

**Schema files:** `prism_counsel` (120+ tables across 10 schema modules)

| Module | Tables | Purpose |
|--------|--------|---------|
| Matters | `pc_matters`, `pc_matter_parties`, `pc_matter_events` | Core matter management |
| Documents | `pc_documents`, `pc_document_versions` | Document store and review |
| Recovery | `pc_recovery_ops`, `pc_liens`, `pc_settlements` | Recovery tracking |
| No-Fault | `pc_no_fault_claims`, `pc_no_fault_billings` | NY No-Fault module |
| Playbooks | `pc_playbooks`, `pc_playbook_steps` | Legal playbooks |
| Pressure | `pc_pressure_events`, `pc_friction_boards` | Pressure/friction tracking |
| Proof | `pc_proof_chain_events` | Legal-grade audit trail |
| Court | `pc_court_filings`, `pc_court_events` | Court filing integration |
| Billing | `pc_billing_records`, `pc_expenses` | Matter billing |
| Intelligence | `pc_venue_intel`, `pc_insurer_intel` | Venue and insurer intelligence |

---

### Carlota Jo — Advisory

**Schema files:** `carlota_jo.ts`, `carlota_client.ts` (10 tables)

| Table | Purpose |
|-------|---------|
| `cj_clients` | Client profiles (name, tier, status) |
| `cj_services` | Service catalog |
| `cj_bookings` | Booking records |
| `cj_reservations` | Reservation management |
| `cj_messages` | Secure client messaging |
| `cj_documents` | Document delivery |
| `cj_inquiries` | New inquiry intake |

---

### Alloy / Platform Infrastructure

**Schema files:** `analytics.ts`, `apps_registry.ts`, `billing.ts`, `connectors.ts`, `documents.ts`, `export_jobs.ts`, `feature_flags.ts`, `feedback.ts`, `files.ts`

| Table | Purpose |
|-------|---------|
| `analytics_events` | Platform analytics event store |
| `apps_registry` | Registered application catalog |
| `billing_subscriptions` | Stripe subscription records |
| `billing_invoices` | Invoice history |
| `connectors` | External integration connector configs |
| `documents` | Cross-platform document store |
| `export_jobs` | Async export job queue |
| `feature_flags` | Per-org feature flag overrides |
| `feedback` | User feedback records |
| `files` | Uploaded file metadata |

---

### AI & Agent Infrastructure

**Schema files:** `agent_os.ts`, `agent_skills.ts`, `agent_training.ts`, `alloy_ai_decisions.ts`, `consciousness.ts`, `dreamscape.ts`, `fine_tuning.ts`, `inca_product.ts`

| Table | Purpose |
|-------|---------|
| `agent_definitions` | Registered agent definitions |
| `agent_skills` | Skill registry per agent |
| `agent_training_runs` | Fine-tuning and training run records |
| `ai_decisions` | AI decision records with confidence scores |
| `dreamscape_entities` | Entity scoring engine results |
| `inca_experiments` | INCA model evaluation experiments |
| `inca_models` | Model registry |

---

### Azure / Enterprise Tenancy

**Schema file:** `azure_tenants.ts`

| Table | Purpose |
|-------|---------|
| `azure_tenants` | Enterprise tenant config (Power BI workspace, Row-Level Security, SSO config) |
| `azure_tenant_users` | Tenant user provisioning via SCIM |

---

### Other Domain Tables

**Schema files include:** `capital_readiness.ts`, `certification_readiness.ts`, `cms.ts`, `comments.ts`, `conversations.ts`, `cortex_action_drafts.ts`, `covenant_sim.ts`, `daily_briefings.ts`, `distribution-os.ts`, `entities.ts`, `fund_ops.ts`, `health_checks.ts`, `holdings.ts`

| Table Group | Purpose |
|------------|---------|
| `capital_readiness_*` | Capital readiness assessments |
| `cms_*` | Content management (pages, blocks, media) |
| `comments` | Cross-platform comment threads |
| `conversations` | AI conversation history |
| `daily_briefings` | Automated daily briefing records |
| `entities` | Cross-domain entity registry (companies, people, assets) |
| `fund_ops_*` | Fund operations and LP reporting |
| `holdings_*` | Portfolio and cap table records |

---

## Core Shared Entities

These entities appear across multiple platforms and form the backbone of the data model.

### Organization

The tenant unit. All user data and operational data is scoped to an organization. Defined in `lib/db/src/schema/organizations.ts`.

```
organizations
├── id              SERIAL (PK, integer)
├── name            TEXT NOT NULL
├── slug            TEXT UNIQUE NOT NULL
├── logo_url        TEXT
├── domain          TEXT
├── org_type        TEXT
├── status          TEXT        (active, inactive, suspended)
├── plan            TEXT        (free, starter, professional, enterprise)
├── billing_customer_id TEXT
├── is_active       BOOLEAN
├── created_at      TIMESTAMPTZ
└── updated_at      TIMESTAMPTZ

org_members
├── id              SERIAL (PK)
├── org_id          INTEGER (FK → organizations)
├── user_id         INTEGER (FK → users)
├── role            TEXT        (owner, admin, member, viewer)
└── joined_at       TIMESTAMPTZ

organization_memberships (CMS / content management roles)
├── id              SERIAL (PK)
├── organization_id INTEGER (FK → organizations)
├── user_id         INTEGER (FK → users)
├── role            TEXT        (public, authenticated, member, client, editor, admin, super_admin)
├── status          TEXT        (active, invited, suspended)
├── created_at      TIMESTAMPTZ
└── updated_at      TIMESTAMPTZ
```

### User

Platform users. Defined in `lib/db/src/schema/auth.ts`.

```
users
├── id              SERIAL (PK, integer)
├── replit_id       TEXT UNIQUE     (OIDC subject identifier)
├── email           TEXT UNIQUE
├── display_name    TEXT NOT NULL
├── avatar_url      TEXT
├── bio             TEXT
├── platform_role   TEXT        (anonymous_visitor, founder_admin, platform_admin,
│                               operator, analyst, executive_viewer, ops_manager,
│                               sales_delivery_user, maritime_ops_user,
│                               service_coordinator, pilot_customer_user)
├── team            TEXT
├── password_hash   TEXT        (PBKDF2:salt:hash — set only for email/password users)
├── email_verified_at TIMESTAMPTZ
├── is_active       BOOLEAN
├── last_login_at   TIMESTAMPTZ
├── created_at      TIMESTAMPTZ
└── updated_at      TIMESTAMPTZ

user_roles (join table to roles)
├── id              SERIAL (PK)
├── user_id         INTEGER (FK → users)
└── role_id         INTEGER (FK → roles)

roles
├── id              SERIAL (PK)
├── name            TEXT UNIQUE (super_admin, admin, editor, member, client,
│                               authenticated, exec, ops, compliance, maintenance,
│                               analyst, viewer, operator, seller, client_viewer,
│                               creative_user)
└── description     TEXT
```

### Session

Server-side sessions. The `sid` cookie contains an opaque token that maps to a `sessions` record. Defined in `lib/db/src/schema/auth.ts`.

```
sessions
├── id              SERIAL (PK)
├── token           TEXT UNIQUE (opaque random identifier — stored in sid cookie)
├── user_id         INTEGER (FK → users)
├── expires_at      TIMESTAMPTZ
├── ip_address      TEXT        (stored before hashing for operational logs)
├── user_agent      TEXT
└── created_at      TIMESTAMPTZ
```

### Audit Event

Append-only log. Defined in `lib/db/src/schema/audit_logs.ts`. Source of truth for the actual column shape — not `audit_events`.

```
audit_logs
├── id              SERIAL (PK)
├── organization_id INTEGER | NULL (FK → organizations, ON DELETE SET NULL)
├── site_id         INTEGER | NULL
├── actor_user_id   INTEGER | NULL (FK → users, ON DELETE SET NULL)
├── action_type     TEXT NOT NULL  (structured action string)
├── entity_type     TEXT NOT NULL  (type of entity acted upon)
├── entity_id       TEXT | NULL    (identifier of the entity)
├── payload_json    JSONB | NULL   (before/after state or action context)
└── created_at      TIMESTAMPTZ NOT NULL
```

---

## Cross-Domain Entity Relationships

```
organizations ──── org_members ──── users
   (id: INTEGER)                  (id: INTEGER)
       │                               │
       │ (org_id = INTEGER FK)         │ (actor: INTEGER FK)
       ▼                               ▼
   actions ──────────────────── audit_logs
   platform_signals                    │
       │                               │
       │ (product + entity references) │
       ├──► firestorm incidents         │
       ├──► vessels data                │
       ├──► terra properties            │
       └──► prism_counsel matters       │
                                       │
                               (immutable record)
```

All domain entities reference `org_id` (integer FK) for tenant isolation. Significant mutations produce audit log entries.

---

## Data Integrity Rules

- **Tenant isolation:** Org-scoped tables include an `org_id` foreign key. Isolation is enforced per-route-handler via Drizzle ORM query builders. The `tenantScope` middleware is applied to selected route groups (`/audit`, `/jobs`, `/comments`, `/documents`, `/exports`, `/orgs`). Other route groups (including `/firestorm`, `/vessels`, `/terra`) enforce org scoping within individual route handlers — not via shared middleware. Isolation correctness depends on per-handler implementation discipline. See KNOWN-GAPS.md.
- **Audit immutability:** Audit log tables are append-only. No `UPDATE` or `DELETE` operations are issued on these tables from the application layer.
- **Session integrity:** Sessions expire at `expires_at`. The `authMiddleware` rejects requests with expired sessions before route handlers run.
- **Referential integrity:** Foreign keys are enforced at the database level (Drizzle ORM generates `REFERENCES` constraints with `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate per entity).
- **Note on soft deletes:** Some domain tables include `deleted_at` nullable timestamps for soft deletion; this is not universal across all tables. Verify per-table patterns in `lib/db/src/schema/` before relying on soft-delete semantics.

---

## Migration Strategy

**Development:**
```bash
pnpm --filter @szl-holdings/db run db:push      # Apply schema (no migration file, dev only)
pnpm --filter @szl-holdings/db run db:push --force   # Force push (destructive)
```

**Production:**
```bash
pnpm --filter @szl-holdings/db run db:generate  # Generate migration file
pnpm --filter @szl-holdings/db run db:migrate   # Apply pending migrations
```

**Migration files** live in `lib/db/drizzle/`. They are SQL files generated by Drizzle Kit and applied idempotently.

**Post-merge automation:** The `scripts/post-merge.sh` script runs `pnpm --filter db push` automatically after task branch merges in the development environment.

---

## Seeding

```bash
pnpm --filter scripts run seed         # Full demo data seed
pnpm --filter scripts run seed:domain  # Domain-specific seed (e.g., vessels)
```

Seed scripts live in `scripts/`. Demo data is clearly flagged with `is_demo: true` where applicable. **Never seed demo data into production.**

---

## Backup & Recovery

Daily backups are automated. Backups are stored in `backups/` (development) and Azure Blob Storage (production).

```bash
# Restore from backup (emergency)
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
gunzip -c backups/daily_<timestamp>.sql.gz | psql "$DATABASE_URL"
```

See `docs/disaster-recovery.md` for the full restore playbook and `BACKUP_AND_RECOVERY.md` for the backup strategy.

---

## Related Documents

| Document | Path |
|----------|------|
| Schema source | `lib/db/src/schema/` |
| Migration history | `lib/db/drizzle/` |
| Disaster recovery | `docs/disaster-recovery.md` |
| Backup strategy | `BACKUP_AND_RECOVERY.md` |
| Schema audit | `docs/schema-audit-2025-04.md` |
| Architecture | `ARCHITECTURE.md` |

## Decision Fabric (April 2026 — Phase 1–2)

The Decision Fabric layer adds five tables that unify primitive events into
end-to-end decision memory. See `DECISION_FABRIC.md` and
`OUTCOME_GRAPH_MODEL.md` for the architecture and lifecycle.

### `decision_fabric_correlation_links`

Cross-primitive index. One row per primitive event participating in the
canonical 9-step loop.

| Column | Type | Notes |
|--------|------|-------|
| `id` | serial pk | |
| `org_id` | int → organizations | nullable for platform-scoped events |
| `correlation_id` | text not null | shared across all rows for one decision flow |
| `primitive` | enum | `prism_bus` · `proof_chain` · `outcome_graph` · `covenant_policy` · `workflow_engine` · `monte_carlo` · `approval` · `decision_record` |
| `primitive_id` | text not null | source row id within that primitive |
| `entity_type` / `entity_id` | text | subject of the event |
| `workflow_run_id` | text | when the event happened inside a workflow |
| `domain` | enum | fabric domain |
| `occurred_at` | timestamp | |
| `metadata` | jsonb | |

Indexed on `correlation_id`, `workflow_run_id`, `(entity_type, entity_id)`,
`primitive`, `org_id`.

### `decision_fabric_records`

One row per consequential decision. Carries forward and backward links to
every supporting artifact plus predicted-vs-actual outcome.

Notable columns: `domain`, `entity_type`, `entity_id`, `title`, `rationale`,
`context`, `decided_by_user_id`, `decided_by_role`, `owner_user_id`,
`outcome_graph_id`, `proof_chain_id`, `policy_version_id`,
`simulation_snapshot_id`, `approval_id`, `workflow_run_id`,
`recommendation_id`, `predicted_outcome`, `actual_outcome`,
`prediction_error`, `status` (`draft` · `executed` · `rolled_back` ·
`superseded`), `correlation_id`, `metadata`, `decided_at`.

### `decision_fabric_policy_versions`

Immutable policy bodies frozen at evaluation time so a decision can be
replayed against the exact policy that ran. Columns: `policy_id`, `version`,
`policy_name`, `effect`, `body` (jsonb), `authored_by_user_id`,
`captured_at`.

### `decision_fabric_simulation_snapshots`

Frozen Monte Carlo (or other) simulation runs used as evidence. Columns:
`domain`, `scenario_id`, `scenario_name`, `inputs`, `parameters`, `results`,
`confidence_interval`, `iterations`, `seed`, `captured_at`.

### `decision_fabric_playbook_suggestions`

Auto-generated playbook proposals. Columns: `domain`, `title`, `description`,
`trigger_signature`, `recommended_actions`, `supporting_decision_ids`,
`sample_size`, `success_rate`, `confidence`, `status` (`proposed` ·
`accepted` · `rejected` · `promoted_to_workflow`), `reviewed_by_user_id`,
`reviewed_at`, `promoted_workflow_id`.

---

*Last verified against source code: 2026-04-20. Re-verify against `artifacts/api-server/src/`, `lib/db/src/schema/`, and `lib/auth/src/` after significant code changes. Note: counts above represent committed counts at the cited verification date; current source-of-truth counts may have drifted — see `scripts/qa/check-doc-freshness.cjs` for live drift reporting.*
