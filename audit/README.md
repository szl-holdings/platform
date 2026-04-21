# Audit — Zero-Gap Track 1

**Completed:** 2026-04-21  
**Track:** Zero-Gap Track 1 — Audit, Truth Map & Root Cleanup

This directory contains all artifacts produced by the Zero-Gap Track 1 audit. Downstream tracks (Design System v2, Backend Hardening, Database, Infra/CI) should consume these documents as their baseline.

---

## Documents Produced by This Track

| Document | Purpose | Key Output |
|---------|---------|-----------|
| [`workspace-inventory.md`](./workspace-inventory.md) | Complete workspace walk — all artifacts, packages, libs, apps, services, workers, routes, schemas, CI, env vars | Ground-truth list of everything that exists |
| [`runtime-matrix.md`](./runtime-matrix.md) | Per-artifact and per-service operational status (Boots / Partial / Unverified / Mock-only / Archived) | Tells you what actually runs |
| [`auth-surface.md`](./auth-surface.md) | Auth providers, per-artifact posture, RBAC model, sign-in paths, known auth gaps | Auth surface as-is |
| [`database-surface.md`](./database-surface.md) | Schema files, table count, migration inventory, external data sources, seeding | DB surface as-is |
| [`deployment-surface.md`](./deployment-surface.md) | Environments, CI/CD pipelines, IaC, deployment readiness per artifact | Deployment state |
| [`public-claims-reconciliation.md`](./public-claims-reconciliation.md) | Diff of every numeric claim across all public docs vs. verified reality | What was wrong, what was corrected |
| [`source-of-truth.json`](./source-of-truth.json) | Machine-readable canonical counts with the exact command used to compute each | Single source of truth — use this for downstream automation |
| [`root-cleanup-report.md`](./root-cleanup-report.md) | What was deleted, archived, or relocated from the root directory, and why | Root hygiene record |

---

## Canonical Numbers (Quick Reference)

| Metric | Verified Count | Source |
|--------|---------------|--------|
| Registered artifacts (with artifact.toml) | 14 | `find artifacts -name artifact.toml \| wc -l` |
| Total artifact directories on disk | 20 | `ls artifacts/ \| wc -l` |
| Domain packs | 6 | Inventory |
| Platform primitives | 6 | Inventory |
| RBAC roles | 11 | README / trust docs |
| Domain packages (`packages/`) | 82 | `ls packages/ \| wc -l` |
| Shared library packages (`lib/`) | 41 | `ls lib/ \| wc -l` |
| Apps (`apps/`) | 3 | `ls apps/ \| wc -l` |
| Services (`services/`) | 5 | `ls services/ \| wc -l` |
| Workers (`workers/`) | 5 | `ls workers/ \| wc -l` |
| DB schema files | 165 | `find lib/db/src/schema -name '*.ts' \| wc -l` |
| DB tables (canonical, from metrics registry) | 906 | `pnpm metrics:generate` (2026-04-20) |
| DB migrations (SQL files) | 115 | `ls lib/db/drizzle/ \| grep -v meta \| wc -l` |
| API route files | 347 | `find artifacts/api-server/src/routes -name '*.ts' \| wc -l` |
| API route groups (top-level, excl. __tests__) | 12 | `find artifacts/api-server/src/routes -mindepth 1 -maxdepth 1 -type d \| grep -v '__tests__' \| wc -l` |
| CI workflows | 18 | `ls .github/workflows/ \| wc -l` |
| Environment variables (in .env.example) | 212 | `grep -E '^[A-Z_]+=' .env.example \| wc -l` |

---

## Corrections Applied

| Document | Fix |
|---------|-----|
| `docs/platform-facts.md` | Active artifacts 2→14; packages 77→82; total packages 118→123; schema files 163→165; API route groups 14→12 |
| `replit.md` | "15 active applications" → "14 registered artifacts" with complete non-duplicate list |
| `README.md` | Repository map: added `apps/`, `services/`, `workers/` entries |
| `docs/investor/investor-overview.md` | Artifacts 15→14; domain packs list corrected; DB tables/schema/packages figures updated |
| `.gitignore` | Added patterns for archived build scripts and social/media dirs |
| `.replitignore` | Added `archive/` subdirs to exclude from deploy image |

## Validation

Run `node scripts/audit/validate-source-of-truth.js` from the workspace root to verify all key counts match the current filesystem state. Exit 0 = all checks pass; exit 1 = drift detected. The script re-runs every command in `source-of-truth.json` and fails if any count diverges.

---

## Pre-existing Audit Artifacts (Not This Track)

The `audit/` directory also contains older reports from prior audit passes:

| Directory / File | Origin |
|-----------------|--------|
| `audit/ai/` | Prior AI audit |
| `audit/artifacts/` | Prior artifact audit |
| `audit/auth/` | Prior auth audit |
| `audit/code/` | Dead-code, redundancy, dependency cleanup reports |
| `audit/db/` | Prior DB audit |
| `audit/design/` | Prior design audit |
| `audit/docs/` | Prior docs audit |
| `audit/github/` | Prior GitHub audit |
| `audit/inventory/` | Series-A reset inventory (7 JSON files + stack.md) |
| `audit/investor/` | Phase D public-readiness scorecard |
| `audit/media/` | Prior media audit |
| `audit/operations/` | Prior operations audit |
| `audit/security/` | Prior security audit |
| `audit/tasks/` | Prior task audit |
| `audit/tests/` | Build results, debug fixes, static verification |
| `audit/phase-a-report.md` | Phase A audit report |
| `audit/phase-b-report.md` | Phase B audit report |
| `audit/phase-d-report.md` | Phase D audit report |

---

## For Downstream Tracks

- **Track 2 (Design System):** Use `runtime-matrix.md` to know which artifacts are active and need the design system applied.
- **Track 3 (Backend/Auth):** Use `auth-surface.md` and `database-surface.md`. Pay attention to the migration branching issue flagged in `database-surface.md`.
- **Track 4 (DB/Migrations):** Use `database-surface.md` as the baseline. Run `pnpm metrics:generate` after any schema changes to keep `docs/platform-facts.md` current.
- **Track 5 (Infra/CI):** Use `deployment-surface.md`. Note the stale `prism-counsel-ci.yml` workflow flagged there.
