# Audit — Zero-Gap Track 1

**Completed:** 2026-04-21  
**Track:** Zero-Gap Track 1 — Audit, Truth Map & Root Cleanup

> **Why this lives at the repo root (not under `docs/audit/`)**
>
> This directory is a frozen, machine-consumable artifact of the Zero-Gap audit pass — not narrative documentation. It is referenced by name from automation in `scripts/audit/`, `scripts/public-mirror/`, and CI scorecards (e.g. `ops/market/market-readiness-scorecard.md`, `audit/inventory/*.json`, `audit/source-of-truth.json`, `audit/verify.sh`). Moving it would break those references and invalidate the historical "as of 2026-04-21" snapshot.
>
> `docs/audit/` is the home for the **Series A GitHub Rehaul** narrative audit (April 2026). The two are intentionally separate: `audit/` = data + scripts produced by the audit, `docs/audit/` = curated reports for investors and contributors.

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
| [`FRONTIER_F1_PROOF.md`](./FRONTIER_F1_PROOF.md) | Frontier F1 regulatory evidence proof packet | EU AI Act mapping, receipt v2, Article 12 export, and ISO gap verification |
| [`FRONTIER_F2_1_PROOF.md`](./FRONTIER_F2_1_PROOF.md) | Frontier F2.1 interoperability proof packet | OpenTelemetry GenAI and MCP boundary verification with explicit claim limits |
| [`FRONTIER_CONFORMANCE_PROOF.md`](./FRONTIER_CONFORMANCE_PROOF.md) | Frontier vertical conformance proof packet | Seven-gate reference fixture and honest 0/3 live-target result |

---

## Canonical Current-Tree Numbers (Quick Reference)

> Updated 2026-07-25 by FRONTIER V2 Wave 1 truth lock. Source:
> `audit/source-of-truth.json` v2.0.0. Historical runtime/database snapshots
> remain in the JSON but are not current public claims.

| Metric | Verified Count | Source |
|--------|---------------|--------|
| Registered artifacts | 6 | Tracked artifact manifests |
| Artifact directories | 7 | Tracked top-level `artifacts/` children |
| Registered product verticals | 5 | Registered domain artifacts; A11oy is separate |
| Domain packages (`packages/`) | 158 | Tracked top-level package directories |
| Shared library packages (`lib/`) | 53 | Tracked top-level library directories |
| Total packages (`packages/` + `lib/`) | 211 | 158 + 53 |
| Apps (`apps/`) | 11 | Tracked top-level `apps/` children |
| Services (`services/`) | 11 | Tracked top-level `services/` children |
| Workers (`workers/`) | 5 | `ls workers/ \| wc -l` |
| DB schema files | 197 | Tracked `lib/db/src/schema/**/*.ts` files |
| DB `pgTable` call sites | 1,067 | Static source call sites; not provisioned-table count |
| DB migrations (SQL files) | 149 | Tracked `lib/db/drizzle/*.sql` files |
| API route source files | 43 | Non-test files with detected Express route declarations across current runtime roots |
| API handler declarations | 306 | Static non-test method declarations on `app`, `router`, and named Express Router receivers |
| CI workflows | 45 | Includes both truth workflows |
| Environment variables (in `.env.example`) | 238 | Lines matching `^[A-Z_]+=` |

---

## Corrections Applied

| Document | Fix |
|---------|-----|
| `SOURCE_OF_TRUTH.md` | Replaced stale April/May metrics with reproducible current-tree, locked-kernel, observed-external, and historical status classes |
| `audit/source-of-truth.json` | Registry v2.0.0: 6 registered artifacts, 5 registered product verticals, current package/DB/API/CI/env counts, labelled Doctrine 749/14/163 definitions |
| `docs/GLOSSARY.md` | Separated holographic state, product vertical, runtime organ, and policy gate module |
| `.github/workflows/source-of-truth.yml` | Added a required drift-detection execution path for canonical files and counted tree roots |
| `docs/platform-facts.md` | Active artifacts 2→14; packages 77→82; total packages 118→123; schema files 163→165; API route groups 14→12 |
| `replit.md` | "15 active applications" → "14 registered artifacts" with complete non-duplicate list |
| `README.md` | Repository map: added `apps/`, `services/`, `workers/` entries |
| `docs/investor/investor-overview.md` | Artifacts 15→14; domain packs list corrected; DB tables/schema/packages figures updated |
| `.gitignore` | Added patterns for archived build scripts and social/media dirs |
| `.replitignore` | Added `archive/` subdirs to exclude from deploy image |

## Validation

Run `node scripts/audit/validate-source-of-truth.js` from the workspace root.
The validator is dependency-free and cross-platform. It recomputes current-tree
metrics from Git's tracked-file index, checks the two Markdown representations,
verifies the locked Doctrine contract, and enforces the canonical vocabulary.
Exit 0 means all checks pass; exit 1 means drift was detected.

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
