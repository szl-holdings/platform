# AEEP Metrics Audit — Phase 1

**Version:** 1.0 | **Date:** April 2026 | **Scope:** Platform facts inventory, hard-coded numbers, drift analysis, single-source-of-truth gaps

---

## 1. The Platform Facts Problem

Platform facts — counts of apps, packages, endpoints, tables, screens, deployment targets, agent roles, etc. — appear in at least 12 locations across the monorepo with inconsistent values. This creates investor-trust risk, documentation rot, and contributor confusion.

---

## 2. Verified Ground-Truth Counts (April 2026)

The following counts were established by direct filesystem inspection:

| Fact | Verified Count | Method |
|------|---------------|--------|
| Registered artifacts (active) | 15 | `.replit` artifact registrations |
| Archived artifacts | 5 | Disk presence, no workflow |
| `packages/` packages | 67 | `ls packages/ \| wc -l` |
| `lib/` packages | 41 | `ls lib/ \| wc -l` |
| `apps/` applications | 2 | `ls apps/` |
| `workers/` workers | 3 | `ls workers/` |
| `services/` services | 3 | `ls services/` |
| Database schema files | ~132 | Architecture docs (need re-verify) |
| Database tables | ~800 | Architecture docs (need re-verify) |
| API route groups | 14 | `artifacts/api-server` route setup |
| AEEP v1 endpoints (current) | 8 | `apps/alloy-embedding-api` |
| AEEP v1 endpoints (target) | 14 | AEEP brief requirement |
| Agent roles | 8 | AEEP brief requirement |
| Domain packs | 6 | Lyte, Vessels, Terra, Aegis, PRISM, Carlota |
| Cognitive loop phases | 8 | `cognitive-runtime/types.ts` |
| RBAC roles | 11 | `lib/auth` user platform_role enum |
| Workflow starter templates | 10 | AEEP brief requirement |

---

## 3. Document Drift Analysis

### Hard-coded platform fact locations with known drift

| Document | Fact Referenced | Value in Doc | Verified Value | Drift |
|----------|----------------|--------------|----------------|-------|
| `README.md` | Active artifacts | "13 surfaces" | 15 registered | Understated |
| `ARCHITECTURE.md` | Database tables | "799 tables" | ~800 | Close |
| `ARCHITECTURE.md` | lib packages | "37 shared libraries" | 41 | Understated |
| `replit.md` | Active applications | "15 active applications" | 15 registered | Match |
| `replit.md` | RBAC roles | "11-role RBAC" | 11 | Match |
| `FULL_SYSTEM_INVENTORY.md` | Packages | varies | 67 packages | Unstated |
| `API-CATALOGUE.md` | Endpoints | ~50 endpoints | 8 v1 + many REST | Scope unclear |
| `ARCHITECTURE.md` | Database schema files | "132 schema files" | ~132 | Approx |
| `AUDIT_INVESTOR_READINESS.md` | Multiple | Various | Various | Mix |
| `docs/metrics-reference.md` | Platform metrics | Partial | Partial | Partial |
| `packages/config` | Platform registry | Structured | Authoritative | Source |
| `docs/PLATFORM_CANONICAL.md` | Canonical facts | Partial | Partial | Partial |

---

## 4. Existing Registry Mechanisms

### `packages/config`
The `packages/config` package currently functions as the closest existing single source of truth for platform configuration. It contains a platform registry, claims, feature flags, and environment contract.

**Gaps relative to AEEP metrics registry:**
- No structured `platformFacts` export with counts
- No repo-introspection generator (counts are manually maintained)
- No drift validation script
- No build-time generation pipeline
- No docs/UI consumption helpers

### `docs/metrics-reference.md`
Partial metrics document exists. Not machine-readable. Not validated against source.

### `docs/PLATFORM_CANONICAL.md`
Documents canonical facts but is manually maintained with no validation.

---

## 5. Metrics Drift Root Causes

1. **No single source of truth:** Counts live in prose documents updated by hand.
2. **No validation:** No CI check compares documented counts to actual filesystem state.
3. **Copy-paste propagation:** When a new document is written, counts are copied from the last document read, not verified.
4. **Scope ambiguity:** "Active apps" sometimes means registered artifacts, sometimes includes CLI tools, sometimes includes services.
5. **Temporal drift:** Architecture evolves faster than documentation is updated.

---

## 6. Platform Facts Categories

The AEEP platform metrics registry should cover these categories:

### Structural (introspectable from filesystem)
- `artifactCount` — registered artifacts
- `packageCount` — packages/ count
- `libCount` — lib/ count
- `workerCount` — workers/ count
- `serviceCount` — services/ count
- `appCount` — apps/ count

### Schema (introspectable from lib/db)
- `dbTableCount` — database tables
- `dbSchemaFileCount` — schema files
- `dbSchemaDomains` — schema domain count

### API Surface (introspectable from api-server routes)
- `apiRouteGroupCount` — route group count
- `apiEndpointCount` — approximate endpoint count
- `v1EndpointCount` — AEEP v1 endpoints

### Agent / Runtime
- `agentRoleCount` — typed role contracts
- `cognitiveLoopPhaseCount` — loop phases
- `domainPackCount` — domain pack count
- `starterWorkflowCount` — starter workflows

### Security / Auth
- `rbacRoleCount` — RBAC roles
- `authProviders` — auth provider list

### Deployment
- `deploymentTargets` — Reserved VM, Autoscale, external workers

### Curated (manual override — public-facing)
- `teamSize` — team size
- `foundedYear` — founding year
- `platformVersion` — semver
- `lastAuditDate` — last audit date

---

## 7. Consumption Requirements

After Phase 2, the following must consume from the registry:

| Consumer | Current | Target |
|---------|---------|--------|
| `README.md` | Hard-coded | Registry import |
| `docs/platform-facts.md` | Does not exist | Generated from registry |
| `ARCHITECTURE.md` | Hard-coded | Registry import in key sections |
| Investor pitch deck (`artifacts/aegis`) | Hard-coded in slide data | Registry import |
| Admin health surface | Ad-hoc | Registry consumption helper |
| Trust center docs | Partial | Registry consumption helper |
| `packages/config` platform registry | Authoritative but no generator | Merge with metrics registry |

---

## 8. Validation Strategy

### CI validation (new)
- `scripts/validate-platform-facts.ts` — verifies generated registry against filesystem state
- Runs in CI as a non-blocking warning in development, blocking in release gate
- Checks: artifact count matches `.replit` registrations, package count matches `packages/` entries, worker count matches `workers/` entries

### Local validation
- `pnpm validate:platform-facts` — runs `scripts/validate-platform-facts.ts`
- Output: drift report with specific mismatches

---

## 9. Keep / Refactor / Replace / Remove Matrix — Metrics

| Item | Decision | Reason |
|------|----------|--------|
| `packages/config` platform registry | Refactor | Promote to include all platform facts |
| `docs/metrics-reference.md` | Replace | Replace with generated `docs/platform-facts.md` |
| `docs/PLATFORM_CANONICAL.md` | Deprecate | Superseded by registry + platform-facts.md |
| Hard-coded counts in `README.md` | Replace | Registry consumption |
| Hard-coded counts in `ARCHITECTURE.md` | Replace | Registry consumption in key sections |
| Investor deck hard-coded stats | Replace | Registry consumption |
| No drift validation | Add | `scripts/validate-platform-facts.ts` |
| No generation pipeline | Add | `scripts/generate-platform-metrics.ts` |
