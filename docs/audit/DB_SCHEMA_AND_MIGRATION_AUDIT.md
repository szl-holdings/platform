# Database Schema and Migration Audit

**Date:** April 18, 2026  
**Auditor:** Platform Engineering  
**Database:** PostgreSQL 16 (Replit managed)  
**ORM:** Drizzle ORM  
**Schema location:** `lib/db/src/` (116 schema files, 569 tables)

---

## 1. Schema Overview

| Metric | Value |
|--------|-------|
| Total tables | 569 |
| Schema files | 116 |
| ORM | Drizzle ORM with TypeScript type safety |
| Migration method | `pnpm db:push` (schema-push, not migration files) |
| Seed scripts | 14 idempotent seed scripts |

---

## 2. Migration Strategy

The platform uses Drizzle ORM's **schema-push** approach (`drizzle-kit push`) rather than numbered migration files. This means:

**Advantages:**
- Simple schema evolution in development
- No migration file accumulation
- Automatic diff detection

**Risks and mitigations:**
- No rollback migration files exist — rollback requires re-applying a previous schema definition
- Production schema push should be preceded by a full database backup
- For production: run `pnpm db:push` against production DB only after staging validation

**Migration command:**
```bash
pnpm db:push
# or
pnpm --filter @szl-holdings/db run migrate
```

---

## 3. Domain Schema Coverage

| Domain | Table Count (approx) | Schema Files | Key Tables |
|--------|---------------------|-------------|-----------|
| Platform / Auth | ~40 | `schema-auth.ts`, `schema-users.ts`, `schema-orgs.ts` | users, sessions, organizations, roles |
| Proof Chain | ~15 | `schema-proof-chain.ts` | proof_chain_entries (append-only) |
| Outcome Graph | ~20 | `schema-outcome-graph.ts` | outcomes, decisions, recommendations |
| Alloy Workflows | ~60 | `schema-alloy.ts`, `schema-workflow*.ts` | workflows, workflow_steps, executions |
| Vessels / Maritime | ~50 | `schema-vessels.ts`, `schema-maritime*.ts` | vessels, voyages, positions, incidents |
| Terra / Real Estate | ~45 | `schema-terra.ts`, `schema-realestate*.ts` | properties, deals, valuations |
| Aegis / Security | ~50 | `schema-aegis.ts`, `schema-security*.ts` | threats, incidents, vulnerabilities |
| Carlota Jo / Advisory | ~30 | `schema-carlota.ts` | clients, cases, sessions |
| Lyte / Business Obs | ~40 | `schema-lyte.ts`, `schema-observability*.ts` | metrics, signals, dashboards |
| Command / Operations | ~35 | `schema-command.ts` | approvals, blockers, operations |
| Agent/AI | ~45 | `schema-agent-os.ts`, `schema-alloy-runtime.ts` | agent_runs, traces, evals, reflections |
| Memory Fabric | ~25 | `schema-memory.ts` | memory_records, memory_sessions |
| Replay / Eval | ~20 | `schema-replay.ts`, `schema-evals.ts` | replay_captures, eval_results |
| Forge/Trace Graph | ~20 | `schema-forge.ts`, `schema-trace-graph.ts` | trace_nodes, trace_edges |
| Misc / Platform | ~74 | Various | feature_flags, audit_logs, notifications |

---

## 4. Seed Scripts Audit

| Script | Status | Idempotent? | Domain |
|--------|--------|------------|--------|
| `scripts/seed-demo-data.ts` | ✅ Working | Yes (`onConflictDoNothing`) | General platform |
| `scripts/seed-demo-canonical.sh` | ✅ Working | Yes | Canonical demo orchestrator |
| `scripts/seed-pilot-data.ts` | ✅ Working | Yes | Pilot org |
| `scripts/seed-prism-counsel.ts` | ⚠️ Broken (recovery tables) | Partial | PRISM (deprecated) |
| `scripts/seed-ecosystem.ts` | ✅ Working | Yes | Ecosystem data |
| `scripts/seed-marine-extended.ts` | ✅ Working | Yes | Maritime data |
| `scripts/seed-governance.ts` | ✅ Working | Yes | Governance/audit |
| `scripts/seed-carlota-clients.ts` | ✅ Working | Yes | Advisory clients |
| `scripts/seed-holdings-fundops.ts` | ✅ Working | Yes | Fund operations |
| `scripts/seed-agent-os.ts` | ✅ Working | Yes | Agent OS |
| `scripts/seed-audit-logs.ts` | ✅ Working | Yes | Audit trail |
| `scripts/seed-stephen.ts` | ✅ Working | Yes | Founder identity |
| `scripts/seed-distribution-os.ts` | ✅ Working | Yes | Distribution OS |
| `scripts/seed-pilot-org.ts` | ✅ Working | Yes | Pilot organization |

**Canonical demo seed command:**
```bash
pnpm seed:demo
# or: bash scripts/seed-demo-canonical.sh
```

---

## 5. Data Integrity Checks

### Proof Chain (Append-Only)
- `proof_chain_entries` table: `INSERT` only, no `UPDATE`/`DELETE` exposed in API
- Integrity enforced at ORM layer — no direct mutation endpoints
- Status: ✅ **VERIFIED**

### Session Persistence
- Sessions stored in `sessionsTable` (PostgreSQL via Drizzle)
- Sliding-window refresh; sessions survive server restarts
- Status: ✅ **VERIFIED** (closed GAP-003)

### Org Isolation (Multi-tenancy)
- All org-scoped queries include `WHERE org_id = ?`
- Enforced at ORM query builder level
- Status: ✅ **VERIFIED**

### Soft Delete Behavior
- Most tables use `deletedAt IS NULL` soft-delete pattern
- Status: ✅ Consistent

---

## 6. Known Schema Issues

| ID | Issue | Severity | Notes |
|----|-------|---------|-------|
| DB-001 | `seed-prism-counsel.ts` recovery tables broken | LOW | Counsel is deprecated; not critical |
| DB-002 | No rollback migration scripts | MEDIUM | Schema-push approach; mitigate with pre-push backups |
| DB-003 | No formal DB indexes audit | MEDIUM | 569 tables; index coverage not fully audited |
| DB-004 | ORM↔schema drift possible without CI check | MEDIUM | `pnpm typecheck` catches most; recommend `db:check` in CI |

---

## 7. Access Controls on Database

- `DATABASE_URL` stored only in Replit Secrets
- No direct database access from frontend apps (API-only pattern)
- Admin panel PIN-gated in addition to session auth
- Backup: Replit PostgreSQL automated snapshots

---

## 8. Pre-Launch Database Checklist

- [x] PostgreSQL 16 active and connected
- [x] All migrations applied (`pnpm db:push` run)
- [x] Demo seed works deterministically (`pnpm seed:demo`)
- [x] Sessions table present and functional
- [x] Proof chain append-only enforced
- [x] Org isolation verified
- [ ] Full index audit against 569 tables
- [ ] Formal rollback procedure documented and tested
- [ ] Production DB backup verified restorable

---

*See also: `docs/audit/ENV_AND_SECRETS_REGISTER.md`, `lib/db/AGENTS.md`*
