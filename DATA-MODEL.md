# Data Model — SZL Holdings Platform

**Version:** 4.0 | **Date:** April 2026 | **Audience:** Technical advisors, data engineers, enterprise evaluators

> **Canonical summary.** For the full schema reference, see [`docs/architecture/data-model.md`](docs/architecture/data-model.md).

**Source of truth:** `lib/db/src/schema/` (166 schema files, 917 tables total)

---

## Database

| Attribute | Value |
|-----------|-------|
| Engine | PostgreSQL 16 |
| ORM | Drizzle ORM (`@szl-holdings/db`) |
| Migration strategy | Drizzle migrations (`lib/db/drizzle/`) |
| Schema files | 166 TypeScript schema files in `lib/db/src/schema/` |
| Table count | 917 `pgTable` declarations across 166 schema files |
| Counting method | `grep -r "= pgTable" lib/db/src/schema/ --include="*.ts" \| wc -l` |

---

## ORM Conventions

- All tables use **snake_case** column names.
- Primary keys are `id` (UUID or serial, domain-dependent).
- Timestamps: `created_at`, `updated_at` (auto-managed).
- Soft deletes: `deleted_at` where applicable.
- All org-scoped tables include `org_id` referencing `organizations.id`.
- Indexes on `org_id`, `created_at`, and frequently queried fields are declared inline.

---

## Schema Domain Groups (Summary)

| Domain | Schema Files | Key Tables |
|--------|-------------|------------|
| Authentication & Identity | `auth.ts`, `api_keys.ts` | users, sessions, organizations, org_members, api_keys |
| Audit & Compliance | `audit_logs.ts`, `audit_chain_events.ts`, `compliance.ts`, `governance.ts` | audit_logs, audit_chain_events, compliance_records |
| Alloy — Execution Fabric | `alloy.ts`, `alloy_ai_decisions.ts`, `alloy_chat.ts`, `approvals.ts` | alloy_workflows, alloy_runs, approval_requests |
| Aegis — Security & Defense | `aegis*.ts` | security_incidents, threat_actors, soar_playbooks |
| Vessels — Maritime | `vessels*.ts` | vessels, voyages, vessel_anomalies, sanctions_checks |
| Terra — Real Estate | `terra*.ts` | properties, distress_scores, ownership_entities |
| PRISM Counsel — Legal | `counsel*.ts` | matters, documents, court_filings, recovery_ops |
| IMPERIUM — Cloud | `imperium*.ts` | cloud_resources, governance_policies, cost_allocations |
| Carlota Jo — Advisory | `carlota_jo*.ts` | clients, bookings, service_catalog, inquiries |
| Pulse — Briefing | `pulse*.ts` | briefings, signal_summaries, executive_digests |
| Forge — AI Runtime | `forge.ts` | forge_agents, forge_versions, forge_promotions |
| Outcome Graph | `outcome_graph*.ts` | outcomes, outcome_edges, outcome_annotations |
| Proof Chain | `proof_chain*.ts` | proof_events, proof_links, proof_verifications |
| Covenant Policy | `covenant_policy*.ts` | policies, policy_rules, policy_evaluations |

---

## Connection Exports (`@szl-holdings/db`)

| Export | Purpose |
|--------|---------|
| `.` | DB client + pool (default export) |
| `./schema` | All schema definitions |
| `./schema/canonical` | Canonical cross-domain entity types |

---

*For full schema documentation see [`docs/architecture/data-model.md`](docs/architecture/data-model.md).*
*For domain-level schema audit see [`docs/architecture/schema-audit-2025-04.md`](docs/architecture/schema-audit-2025-04.md).*
