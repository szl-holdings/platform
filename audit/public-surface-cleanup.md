# SZL Holdings — Public Surface Cleanup

**Audit date:** 2026-04-21  
**Scope:** Every contradictory or vanity claim, every stale screenshot, and every junk file slated for removal in the next task. This is the hit list.

**Truth Label Key (applies to all audit findings in this document):**
- **VERIFIED** — confirmed from filesystem, grep, or direct file inspection  
- **PARTIALLY VERIFIED** — partially confirmed; runtime or integration behavior not checked  
- **UNVERIFIED** — asserted but not checked in this audit  
- **BROKEN** — claim is contradicted by primary-source evidence

---

## Contradictory Claims — Fix Before Any Public Exposure

These are specific strings/numbers that appear in public-facing surfaces (landing pages, README, dashboards, social profiles) and are contradicted by audit findings. Each row is an action item.

| # | Claim | Appears in | Correct Value | Action | Audit Status |
|---|-------|-----------|---------------|--------|--------------|
| 1 | "906 database tables" | `platform-facts.md` | 915 (direct `pgTable(` definitions) | Update to 915 or replace with qualitative description | **BROKEN** — VERIFIED actual count is 915 via `grep -r "pgTable(" lib/db/src/schema/ --include="*.ts" \| wc -l` |
| 2 | "Active registered artifacts: 2" | `platform-facts.md` | 15 registered | Update to 15 or remove | **BROKEN** — workspace registry has 15; `.replit [[artifacts]]` has 2 — different systems; "2 active" conflates them |
| 3 | "Domain packages: 77" | `platform-facts.md` | 81 package directories (82 ls entries; `packages/proxy-routes.ts` is a standalone file, not a package) | Update | **BROKEN** — VERIFIED: 81 directories in `packages/` |
| 4 | "Total packages: 118" | `platform-facts.md` | 122 (81 package dirs + 41 lib dirs; `packages/proxy-routes.ts` is a non-package file) | Update | **BROKEN** — VERIFIED: 81 + 41 = 122 |
| 5 | "Schema files: 163" | `platform-facts.md` | 165 | Update | **BROKEN** — VERIFIED: `find lib/db/src/schema -name "*.ts" \| wc -l` = 165 |
| 6 | "API route groups: 14" | `platform-facts.md` | 268 route groups / 382 files | Replace — current "14" is a gross understatement | **BROKEN** — VERIFIED: `ls artifacts/api-server/src/routes/ \| wc -l` = 268; route files = 382 |
| 7 | "Route files: 182" | `APP_STATUS.md` | 268/382 | Update | **BROKEN** — VERIFIED: `find artifacts/api-server/src/routes -name "*.ts" \| wc -l` = 382 |
| 8 | "Lyte: Live" | `PRODUCT_MATRIX.md` | Registered, NOT RUNNING | Change to honest lifecycle label | **BROKEN** — VERIFIED: all 18 workflows NOT STARTED (system log) |
| 9 | "Aegis: Live" | `PRODUCT_MATRIX.md` | Registered, NOT RUNNING | Change | **BROKEN** — VERIFIED: workflow NOT STARTED |
| 10 | "Terra: Live" | `PRODUCT_MATRIX.md` | Registered, NOT RUNNING | Change | **BROKEN** — VERIFIED: workflow NOT STARTED |
| 11 | "Vessels: Live" | `PRODUCT_MATRIX.md` | Registered, NOT RUNNING | Change | **BROKEN** — VERIFIED: workflow NOT STARTED |
| 12 | "Carlota Jo: Live" | `PRODUCT_MATRIX.md` | Registered, NOT RUNNING | Change | **BROKEN** — VERIFIED: workflow NOT STARTED |
| 13 | "SZL Holdings: Live" | `PRODUCT_MATRIX.md` | Registered, NOT RUNNING | Change | **BROKEN** — VERIFIED: workflow NOT STARTED |
| 14 | "40+ connector integrations" | `PRODUCT_MATRIX.md` (Lyte) | Unverified | Remove or qualify | **UNVERIFIED** — not confirmed in any audit scan |
| 15 | "RBAC roles: 7 (super_admin, exec, ops...)" | `PLATFORM_CANONICAL.md` | 12 platformRole enum values | Correct to actual enum | **BROKEN** — VERIFIED: enum in `lib/db/src/schema/auth.ts` has 12 values; none of the 7 claimed names match |
| 16 | "RBAC roles: 11" | `platform-facts.md` | 12 platformRole + 4 rolesTable (dual system) | Update and note dual system | **BROKEN** — VERIFIED: 12 enum values confirmed |
| 17 | "Authentication providers: Replit Auth, Clerk" | `platform-facts.md` | Replit Auth only | Remove Clerk | **BROKEN** — PARTIALLY VERIFIED: Clerk library not found wired in auth flow |
| 18 | "Session store: Redis (enterprise production)" | `PLATFORM_CANONICAL.md` | In-memory (all environments) | Correct | **BROKEN** — PARTIALLY VERIFIED: Redis not activated per `OPEN_RISKS_AND_NEXT_10.md` |
| 19 | "FedRAMP readiness track" | `PRODUCT_MATRIX.md` | Unverified / roadmap only | Remove or move to roadmap | **UNVERIFIED** — no FedRAMP certification work found in codebase |
| 20 | "AIS telemetry integration" | `PRODUCT_MATRIX.md` | AIS is simulated, not live | Add honest disclosure | **PARTIALLY VERIFIED** — AIS route present; live feed unconfirmed; `OPEN_RISKS_AND_NEXT_10.md` notes simulated |
| 21 | "MITRE ATT&CK v14 detection coverage" | `PRODUCT_MATRIX.md` | Coverage claim unverified | Qualify | **UNVERIFIED** — routes exist; actual detection coverage not measured in this audit |
| 22 | "Live NYC distress data pipeline" | `PRODUCT_MATRIX.md` | Live polling unverified | Qualify | **UNVERIFIED** — route exists; live-ness not confirmed (server not running) |
| 23 | Lyte/PRISM Counsel marked "Archived" | `APP_STATUS.md` | Both registered but NOT RUNNING (all 18 workflows NOT STARTED) | Correct `APP_STATUS.md` to reflect registered-but-not-running state; remove "Archived" | **BROKEN** — VERIFIED: both registered in workspace registry; all 18 workflows NOT STARTED |

---

## Vanity Language — Remove from Investor / Public Surfaces

These are phrases that constitute marketing hype without verifiable proof in the current codebase state:

| Phrase | Location | Replacement |
|--------|----------|-------------|
| "Command-grade software platforms" | `PLATFORM_OVERVIEW.md` hero | "Governed operational software" or drop |
| "Compounding system" | `PLATFORM_OVERVIEW.md` | Replace with specific proof: "Alloy execution fabric shared across all domains" |
| "Signal-to-action lifecycle" | Marketing copy | Acceptable if backed by a demo; otherwise remove |
| "Intelligence-informed, not intuition-only" | Carlota Jo description | Acceptable claim; ensure it's backed by a data integration |
| "Series A credible" | Internal docs | Remove from any public surface |
| Any count statistic that is not verifiable in a running system | Dashboards, widgets, stats displays | Replace with qualitative statements or remove until verified |

---

## Stale Screenshots — Remove or Regenerate

| Location | Status | Action |
|----------|--------|--------|
| `screenshots/` directory (346 files) | Phase A deferred — likely stale | Review; remove all screenshots from before current design system; regenerate after repositioning |
| `output/` directory (121 files — social kit) | Phase A deferred | Review; archive or remove |
| Any OpenGraph images (`opengraph.jpg`) referencing old branding | Per-artifact `public/` dirs | Regenerate after homepage redesign |

---

## Junk Files / Directories — Delete

| Path | Reason |
|------|--------|
| `artifacts/firestorm/` | Archived artifact; only `ARCHIVED.md` remains; deregistered |
| `artifacts/imperium/` | Orphaned; only `node_modules/`; no `package.json` |
| `artifacts/cortex-mobile/` | Concept stub; no `package.json`; misleads contributors |
| `artifacts/audit/platform-capability-manifest.json` | Competing manifest; superseded |
| `artifacts/internal-audit/capability-manifest.json` | Competing manifest; superseded |
| `deliverables/` | 4 files; ambiguous launch content; review and archive |
| `output/` | 121 social kit files; not source; archive |

---

## Directories to Move (Not Delete)

| Current Path | Move To | Reason |
|-------------|---------|--------|
| `artifacts/audit/` | `ops/audit/` | Operational tooling, not a deployable artifact |
| `artifacts/internal-audit/` | `ops/internal-audit/` | Same reason |

---

## API Endpoints That Serve Vanity/Unverified Data

These route files appear to serve data for dashboard statistics that display unverified counts:

| Route | Issue | Action |
|-------|-------|--------|
| Any route returning "906 tables" or "2 active apps" as a count | Would serve wrong number to dashboard widgets | After correcting `platform-facts.md`, verify no route hard-codes these numbers |
| Any route returning "40+ integrations" count | Unverified claim | Remove or compute dynamically from actual wired connectors |

---

## Navigation / IA Surface Changes

| Current State | Problem | Required Change |
|---------------|---------|-----------------|
| `szl-holdings` nav exposes all sub-products at top level | Fragments attention; signals portfolio sprawl | Collapse to: Platform · How It Works · Proof · Contact (see D-02) |
| `/counsel/` accessible in nav | 14-file skeleton; damages credibility | Remove from nav until scaffolded |
| `/sentra/` as separate preview path | Duplicates Aegis; confuses hierarchy | Merge into Aegis or remove from nav |
| Two separate CORTEX surfaces at `/lyte/` and `/command/` | Navigation duplication | Consolidate (see D-04) |
| `PRISM Counsel` still registered despite being marked Archived | Confuses evaluators | Deregister or consolidate with `counsel` |

---

## Priority Order for Next Task

1. Fix all 23 contradictory claims in docs (low effort, high credibility impact)
2. Delete `artifacts/firestorm/` and `artifacts/imperium/`
3. Remove `/counsel/` from navigation
4. Consolidate navigation on `szl-holdings`
5. Remove stale screenshots
6. Update all lifecycle statuses in `PRODUCT_MATRIX.md`
7. Remove "40+ integrations" and other unverified count claims
8. Move `artifacts/audit/` and `artifacts/internal-audit/`
