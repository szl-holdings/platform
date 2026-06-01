# SZL Holdings — Database Truth Matrix

**Date:** April 22, 2026
**Engine:** PostgreSQL 16 (Replit-managed)

---

## Summary

| Metric | Count |
|--------|-------|
| Live tables (public schema) | 732 |
| Drizzle schema definitions | 1,084 |
| Schema files | 166 |
| Migration SQL files | 121 (consolidated) |
| Applied statements | 1,334 |
| Non-fatal migration warnings | ~12 |
| Connection pool max | 100 |
| Health pool max | 2 |

---

## Table Domain Distribution (Estimated)

| Domain | Table Prefix | Estimated Count | Notes |
|--------|-------------|-----------------|-------|
| Agent/Alloy | `alloy_*`, `agent_*` | ~120 | Agent runtime, mesh, training, federation |
| Security/Aegis | `aegis_*`, `sentra_*`, `security_*` | ~80 | SOC, alerts, incidents, intel |
| Terra/RE | `terra_*` | ~60 | Distress, deals, portfolio, diligence |
| Vessels/Maritime | `vessels_*`, `maritime_*`, `voyage_*` | ~50 | Fleet, voyages, freight |
| Legal/Counsel | `counsel_*`, `prism_*`, `legal_*` | ~40 | Matters, filings, evidence |
| Pulse/Briefing | `pulse_*` | ~20 | Briefings, signals, synthesis |
| Lyte/Decision | `lyte_*`, `action_*` | ~30 | Actions, signals, surfaces |
| Signal/Events | `signal_*`, `domain_events` | ~20 | Signal mesh, chains, fabric |
| AI/Cognitive | `ai_*`, `cognitive_*` | ~30 | Traces, safety, reviews |
| Governance | `guardian_*`, `policy_*`, `approval_*` | ~25 | Policy, approvals, audit |
| Audit/Proof | `audit_*`, `proof_*` | ~15 | Audit trail, proof chain |
| Platform | `users`, `sessions`, `orgs`, `settings_*` | ~30 | Auth, config, notifications |
| Fund/Distribution | `fund_*`, `distribution_*` | ~20 | LP portal, fund operations |
| Atlas/Spatial | `atlas_*`, `spatial_*` | ~15 | Digital twins, spatial runtime |
| Constellation | `constellation_*` | ~15 | Entity graph, relationships |
| Forge/Command | `forge_*` | ~10 | Command portal aggregation |
| Carlota | `carlota_*` | ~15 | Advisory, clients, services |
| Embedding/Knowledge | `embedding_*`, `knowledge_*` | ~15 | Vector search, knowledge store |
| Other | Various | ~42 | Backup, analytics, demo, misc |

---

## Schema vs Live Table Gap

**Gap:** 1,084 schema definitions − 732 live tables = 352 discrepancy

**Explanation:**
- Drizzle definitions include `relations()` calls (not tables)
- Some definitions are views, not tables
- Some tables defined in schema but not yet created by migrations
- Migration ordering issues prevent ~12 table creation statements

**Action:** Low priority. The live table count is authoritative. Schema definitions serve as the ORM contract.

---

## Migration Health

| Aspect | Status |
|--------|--------|
| Migration runner | Custom consolidated runner in `runMigrations()` |
| Idempotency | All statements use `IF NOT EXISTS` or `ON CONFLICT` |
| Non-fatal failures | ~12 — missing relations due to ordering |
| Fatal failures | 0 — migrations complete successfully |
| Retry logic | 5 attempts with exponential backoff |
| Lock management | PostgreSQL advisory locks |

### Known Migration Ordering Issues (Task #2886)

| Statement | Missing Relation | Impact |
|-----------|-----------------|--------|
| INSERT INTO `fund_lp_activity_events` | Table not created yet | Non-fatal skip |
| CREATE INDEX ON `pulse_saved_briefings` | Table not created yet | Non-fatal skip |
| ~10 similar | Various | Non-fatal skip |

---

## Pool Configuration

| Pool | Max | Min | Idle Timeout | Connect Timeout | Statement Timeout |
|------|-----|-----|-------------|-----------------|-------------------|
| Main | 100 | 1 | 60s | 90s | 60s |
| Health | 2 | 0 | 5s | 1s | 2s |

**Checkout warning threshold:** 30s (OBS-007)

---

## Sensitive Tables

| Table | Contains | Access Control |
|-------|----------|---------------|
| `users` | User profiles, auth identifiers | Session + RBAC |
| `sessions` | Session tokens | Server-side only |
| `alloy_ai_audit_log` | AI action audit trail | Admin read |
| `audit_*` | Platform audit events | Admin read |
| `agent_knowledge` | Agent memory/facts | Service-level |
