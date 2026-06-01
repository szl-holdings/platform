# Schema Audit
**Phase:** 4  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Database Technology

| Attribute | Value |
|---|---|
| Database | PostgreSQL 16 (Replit-managed) |
| ORM | Drizzle ORM |
| Schema domains | 10+ domain areas |
| Estimated table count | ~700 (replit.md: "569 tables" — revised upward by subsequent domain pack additions) |
| Migration tool | Drizzle push + migration files in `lib/db/migrations/` |
| Tenant isolation | `tenant_id` on all tenant-scoped tables |

---

## Schema Domain Inventory

| Domain | Key Tables | Status |
|---|---|---|
| Users / Auth | `users`, `sessions`, `roles`, `role_assignments`, `permissions`, `tenant_users` | ✅ Healthy |
| Tenancy | `tenants`, `tenant_settings`, `tenant_configs` | ✅ Healthy |
| Decisions / Lyte | `decisions`, `signals`, `recommendations`, `simulations`, `entities`, `entity_relationships` | ✅ Healthy |
| Workflow / Alloy | `workflows`, `workflow_steps`, `workflow_runs`, `workflow_events`, `approvals`, `actions` | ✅ Healthy |
| Policy | `policies`, `policy_versions`, `policy_checks`, `covenants`, `policy_simulations` | ✅ Healthy |
| Proof Chain | `proof_entries`, `trust_receipts`, `audit_events`, `correlation_log` | ✅ Healthy |
| Vessels / Maritime | `vessels`, `voyages`, `ais_positions`, `vessel_risks`, `sanctions_hits`, `port_calls` | ✅ Healthy |
| Terra / Real Estate | `properties`, `deals`, `ownership_records`, `distress_scores`, `pro_formas`, `avm_scores` | ✅ Healthy |
| Aegis / Security | `threats`, `incidents`, `vulnerabilities`, `mitre_techniques`, `alerts`, `soar_runs` | ✅ Healthy |
| Carlota Jo | `clients`, `cases`, `service_requests`, `invoices`, `preferences` | ✅ Healthy |
| Counsel / Legal | `matters`, `documents`, `evidence`, `legal_contacts`, `court_events` | ✅ Healthy |
| AI / Agents | `agent_runs`, `agent_tools`, `memory_records`, `eval_runs`, `eval_suites` | ✅ Healthy (some eval tables pending migration) |
| Analytics | `events`, `analytics_sessions`, `metrics`, `funnels`, `conversion_events` | ✅ Healthy |
| Billing | `subscriptions`, `invoices`, `usage_events`, `stripe_customers`, `entitlements` | ✅ Healthy |
| RAG / Knowledge | `rag_knowledge_chunks` (with `tenant_id` — fixed Apr-2026) | ✅ Fixed |
| Platform Settings | `platform_settings` | ⚠️ Missing — pending migration run |
| Eval Forge | `eval_forge_suites`, `eval_forge_runs` | ⚠️ Missing — pending migration run |

---

## Missing Tables (Non-Fatal)

These tables are referenced in code but not yet created in the current dev environment. They produce non-fatal WARN logs on startup. None of these block investor demo flows.

| Table | Impact | Fix |
|---|---|---|
| `platform_settings` | Self-healing runtime seed skipped | Run `pnpm seed:all` after `pnpm db:migrate` |
| `eval_forge_suites` | Eval Forge init skipped; eval pages show empty | Run `pnpm db:migrate` then `pnpm seed:all` |
| `eval_forge_runs` | Same as above | Same fix |

---

## Foreign Key Integrity

| Check | Status |
|---|---|
| `tenant_id` FK references on all tenant-scoped tables | ✅ Enforced |
| `user_id` FK on audit/event tables | ✅ Enforced |
| `decision_id` FK on proof chain entries | ✅ Enforced |
| `workflow_id` FK on workflow runs | ✅ Enforced |
| `policy_id` FK on policy checks | ✅ Enforced |
| Soft-delete patterns (deleted_at nullable timestamps) | ✅ Applied on user-owned records |
| Orphaned RAG chunks (pre-fix) | ✅ Resolved Apr-2026 |

---

## Index Health (Hot Paths)

| Table | Index | Status |
|---|---|---|
| `signals` | `(tenant_id, created_at DESC)` | ✅ Present |
| `decisions` | `(tenant_id, status, created_at DESC)` | ✅ Present |
| `proof_entries` | `(correlation_id, created_at)` | ✅ Present |
| `agent_runs` | `(tenant_id, created_at DESC)` | ✅ Present |
| `rag_knowledge_chunks` | `(tenant_id)` | ✅ Added Apr-2026 |
| `workflows` | `(tenant_id, status)` | ✅ Present |
| `vessels` | `(tenant_id, mmsi)` | ✅ Present |
| `properties` | `(tenant_id, borough, status)` | ✅ Present |

---

## Soft-Delete Semantics

| Pattern | Applied To |
|---|---|
| `deleted_at IS NULL` | Users, clients, cases, documents, properties, vessels |
| Append-only | `proof_entries`, `audit_events`, `trust_receipts` (immutable) |
| Hard delete | `sessions`, `analytics_events` (no retention need) |

---

## Schema Audit Verdict

| Dimension | Status |
|---|---|
| Table count vs expected | ✅ All domain tables present except 3 missing tables |
| FK integrity | ✅ Confirmed |
| Tenant isolation at DB layer | ✅ Confirmed (post Apr-2026 fixes) |
| Hot-path indexes | ✅ Present |
| Soft-delete semantics | ✅ Applied correctly |
| Missing tables (non-fatal) | ⚠️ 3 tables — resolve with `pnpm db:migrate && pnpm seed:all` |
