# SZL Holdings — Reconciliation Audit Report

**Date:** 2026-04-19
**Status:** Reference report — no fixes applied
**Scope:** Every registered artifact + the in-flight project task list
**Author:** Reconciliation pass (Task #2279)

---

## 1. Executive Summary

The SZL platform has 15 registered artifacts (14 web/mobile/video + 1 internal mockup sandbox) plus 5 archived directories still on disk and 1 unscaffolded concept (`cortex-mobile`). Of the active set: 2 are GA (Carlota Jo, API Server), 4 Beta (SZL Holdings, Aegis, Terra, SZL Holdings Mobile), 2 Partial (Vessels, Command), and several artifacts (Pulse, Lyte, Sentra, Counsel, PRISM Counsel, SZL Demo Video) are functional but were not yet captured in the prior `docs/APP_STATUS.md` revision and need their status formalised.

The codebase shows three structural drifts that matter for any platform-registry migration:

1. **No single artifact registry of record.** Live state is spread across `.replit`, the workspace registration system, `docs/APP_STATUS.md`, `launch/01_ability_matrix.json`, and several `*capability-manifest*.json` files. They disagree.
2. **API surface is centralised but un-scoped per artifact.** All 256 route files live in `artifacts/api-server`. There is no machine-readable mapping from artifact → owned routes → claimed capabilities, which makes per-artifact health, RBAC, and observability decisions impossible to enforce automatically.
3. **Auth / data-source posture is inconsistent.** Some artifacts use the shared `@szl-holdings/replit-auth-web` (Carlota Jo, PRISM Counsel), some hand-roll a local `useAuth` (Pulse), and one (SZL Holdings) installs a redirect helper directly. Live-vs-mock data status is documented per artifact in prose but not asserted in CI for most surfaces.

Most of these gaps are **already covered by in-flight tasks** (#2068 Series A launch readiness, #2306 codebase consolidation, #2307 exhaustive consolidation sweep, #2302 operational audit, #2308 platform cohesion). The genuinely uncovered gaps are: a typed artifact registry, per-artifact route ownership, and CI-enforced lifecycle status. The recommended #1 proof-point migration is **Pulse**, with **Counsel** and **Sentra** as #2 and #3 — small enough to migrate end-to-end in one task, representative enough to surface every required pattern, and currently healthy.

---

## 2. Artifact Inventory

Sources reconciled: `.replit`, registered-artifact list (workspace registry), `docs/APP_STATUS.md`, on-disk `artifacts/` directories, per-artifact `package.json`, source-file counts, and currently-running workflows.

| # | Artifact (id) | Kind | Title / Purpose | Preview Path | Lifecycle | Stack | Auth Posture | Data Sources | CI Coverage |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `artifacts/szl-holdings` | web | SZL Holdings corporate site + dashboards | `/` | Beta | React + Vite, 469 src files | Replit OIDC (shared helper) | Mixed: live integrations + seeded KPIs | E2E `tests/e2e/szl-holdings.spec.ts` |
| 2 | `artifacts/aegis` | web | Cyber Resilience Command + Investor Pitch Deck | `/aegis/` | Beta | React + Vite, 212 src files | Replit OIDC | CISA KEV / NVD / MITRE / AbuseIPDB live; scenarios seeded | E2E `aegis.spec.ts` |
| 3 | `artifacts/vessels` | web | Maritime Intelligence | `/vessels/` | Partial | React + Vite, 130 src files | Replit OIDC | NOAA, Open-Meteo, GDELT live; AIS simulated | E2E `vessels.spec.ts` |
| 4 | `artifacts/terra` | web | Real Estate Intelligence | `/terra/` | Beta | React + Vite, 116 src files | Replit OIDC | NYC Open Data / Census / BLS / FEMA / SEC live; Mapbox needs token | E2E `terra.spec.ts` |
| 5 | `artifacts/carlota-jo` | web | Private Advisory portal | `/carlota-jo/` | GA | React + Vite, 89 src files | `@szl-holdings/replit-auth-web` | World Bank / BLS / HBR / Outlook live | E2E `carlota-jo.spec.ts` |
| 6 | `artifacts/command` | web | Unified Command (CORTEX) | `/command/` | Partial | React + Vite, 281 src files | Replit OIDC | Mostly seeded; alerts now persisted (Task #1899) | E2E `command.spec.ts`, `governed-decision-loop.spec.ts` |
| 7 | `artifacts/pulse` | web | AI Executive Briefing | `/pulse/` | Beta (status not in APP_STATUS) | React + Vite, 23 src files | Local `useAuth()` hook | Live AI generation via gateway (#1023); mock fallback | None (no e2e file) |
| 8 | `artifacts/sentra` | web | Cyber Resilience Command (Agent Mesh Defense) | `/sentra/` | Beta (new — Task #2299) | React + Vite, 22 src files | Replit OIDC | Seeded mesh data; intended live agent telemetry (proposed #2309) | None |
| 9 | `artifacts/counsel` | web | Legal Matter Command | `/counsel/` | Concept/Skeleton | React + Vite, 14 src files | Replit OIDC | None — placeholder | None |
| 10 | `artifacts/prism-counsel` | web | PRISM Counsel | `/prism-counsel/` | Listed Archived in APP_STATUS but **still registered + running** | React + Vite, 16 src files | `@szl-holdings/replit-auth-web` | None | None |
| 11 | `artifacts/lyte-command-center` | web | Lyte Decision Intelligence | `/lyte/` | Listed Archived in APP_STATUS but **still registered + running**; live data wired (#1040 merged) | React + Vite, 23 src files | Replit OIDC | Live overlay endpoints `/api/lyte/*` (#1040) | None |
| 12 | `artifacts/szl-demo-video` | video | SZL Holdings — Governed Autonomy Demo | `/szl-demo-video/` | Beta | React + Vite (video runtime), 14 src files | None (public demo) | Static script | None |
| 13 | `artifacts/szl-holdings-mobile` | mobile | SZL Holdings Mobile Command | Expo dev domain | Beta | Expo / React Native | Replit OIDC | Re-uses API server | `__tests__/` Jest suite present |
| 14 | `artifacts/api-server` | web | Central Express backend | `/api/` | GA | Node 24, Express, Drizzle, PG | Authoritative (multi-mode: session, internal token) | All product data + 5 AI gateways | 851 vitest tests, `audit:route-security:strict` CI gate |
| 15 | `artifacts/mockup-sandbox` (id `XegfDyZt7HqfW2Bb8Ghoy`) | design | NEXUS — Unified Agentic AI Layer (component preview) | `/nexus/` | Internal | React + Vite, 19 src files | None | None | None |

**On-disk but not registered (drift candidates):**

| Path | Reason exists | Disposition |
|---|---|---|
| `artifacts/audit/` | Holds `platform-capability-manifest.json`, `evidence/` — operational tooling output | Keep as ops artefact storage; rename out of `artifacts/` to clarify |
| `artifacts/internal-audit/` | 12 ops markdown files + capability manifest | Same — move to `ops/` |
| `artifacts/cortex-mobile/` | Concept; Expo `app/` directory but no `package.json` | Either scaffold or delete — currently misleading |
| `artifacts/firestorm/` | `ARCHIVED.md` only | Delete — already deregistered |
| `artifacts/imperium/` | `node_modules/` only | Delete — orphan |

---

## 3. Drift & Duplication Findings

Grouped by theme. Each finding is a fact about the current tree, not a proposed fix.

### Theme A — Registry inconsistencies

- **A1.** The live workspace registry lists 15 artifacts but `docs/APP_STATUS.md` says "Total 15" while marking PRISM Counsel and Lyte Command Center as Archived — both are still registered, have running workflows, and (in Lyte's case) just had live API data wired in (Task #1040 merged). The doc and reality have drifted in opposite directions.
- **A2.** `launch/01_ability_matrix.json` lists 33 capabilities across 9 products but every entry's `live_state`/`health` field is `undefined` in the parsed output — the file was extended without populating the lifecycle column.
- **A3.** `.replit` only references `api-server` and `mockup-sandbox` under `[[artifacts]]` — the other 13 artifacts are managed via the workspace registry, which is invisible to anyone reading `.replit`. There is no single file a new contributor can read to learn what artifacts exist.
- **A4.** Three competing capability files coexist: `artifacts/audit/platform-capability-manifest.json`, `artifacts/internal-audit/capability-manifest.json`, `docs/audit/capability-inventory.json`. None are referenced by CI.

### Theme B — Auth posture inconsistency

- **B1.** Carlota Jo and PRISM Counsel use the shared `@szl-holdings/replit-auth-web` hook (the canonical pattern).
- **B2.** Pulse hand-rolls a local `useAuth()` hook in `App.tsx` with a `DEMO_USER` fallback path.
- **B3.** SZL Holdings calls `installAuthClearedRedirect("/api/login")` in `main.tsx` — a different shared helper.
- **B4.** Result: three different "what does logged-out look like?" experiences across the suite. There is no shared `RequireAuth` primitive in use across all artifacts.

### Theme C — API server is monolithic and un-attributed

- **C1.** All 256 route files live in `artifacts/api-server/src/routes/`. There is no per-artifact route ownership map (`pulse.ts`, `lyte-intel.ts`, `lyte-surfaces.ts`, `command.ts` are recognisable but `analytics-engine-public.ts`, `admin/funnel.ts`, `terra-cognitive.ts` cross artifact boundaries).
- **C2.** `docs/APP_STATUS.md` claims "182 route files" — actual count is 256. Doc is stale.
- **C3.** Validation coverage is claimed at 21/170 in APP_STATUS but Task #1902 (merged) has since backfilled and added a strict CI gate for missing `validateBody`/`validateQuery`. The known-gaps doc was not updated.

### Theme D — Data-source posture is documented only in prose

- **D1.** Only Aegis, Terra, Vessels, and Carlota Jo have explicit "live data sources" lists in APP_STATUS. Pulse, Sentra, Lyte, Command, Counsel, PRISM Counsel are silent.
- **D2.** The `verify:claims` script exists (`scripts/qa/verify-claims.js`) and is now strict-gated (Task #2068) but the underlying claims file (`launch/01_ability_matrix.json`) is sparsely populated.
- **D3.** No artifact emits a per-route "is this live or mocked?" telemetry signal that the dashboard can consume.

### Theme E — Design-system / shared-UI duplication

- **E1.** `lib/shared-ui/` is being used (e.g. policy-appeal client extracted in #1022) but each artifact still ships its own Tailwind config, its own theme tokens, and in several cases its own copy of `Card`/`Button` wrappers.
- **E2.** Confirmed via the recent `mockup-extract`/`mockup-graduate` skills existing — the team is aware design drift is a problem.

### Theme F — Stale orphans

- **F1.** `artifacts/firestorm` and `artifacts/imperium` are deregistered but the directories survive (only `ARCHIVED.md` and `node_modules/` respectively).
- **F2.** `artifacts/audit/` and `artifacts/internal-audit/` are operational outputs masquerading as artifacts.
- **F3.** `artifacts/cortex-mobile/` is a Concept stub explicitly listed as "do not deploy" but still consumes a directory slot.

---

## 4. Coverage vs. In-Flight Work

Mapping each finding to the project task list (PROPOSED / PENDING / IN_PROGRESS / IMPLEMENTED / MERGING / MERGED) as of this report. "GAP" = no covering task exists today.

| Finding | Covering task(s) | Status |
|---|---|---|
| A1 — APP_STATUS marks Lyte/PRISM as archived but they are live | Task #2302 (Operational audit & smoke test across every artifact) | Covers — re-baseline expected |
| A2 — `01_ability_matrix.json` has empty live_state column | Task #2068 (P0 Series A launch readiness, includes `verify-claims` CI gate); Task #2306 (codebase consolidation) | Covers, partial — gate is strict but matrix still under-populated |
| A3 — No single registry file for artifacts | **GAP** — none of #2306 / #2307 / #2308 explicitly proposes a typed artifact registry as a single source of truth |
| A4 — Three competing capability manifests | Task #2307 (Exhaustive consolidation sweep — dedupe DB tables, packages, seeds, docs, and backlog) | Covers — included in "docs" sweep |
| B1–B4 — Inconsistent auth primitives | Task #2306 (codebase efficiency consolidation — dedupe API clients, claims, UI primitives) | Covers — UI primitives explicitly named |
| C1 — No per-artifact route ownership map | **GAP** — closest is #2306 but it does not call out route attribution |
| C2 — Route count drift in docs | Task #2302 + #2307 | Covers |
| C3 — Validation coverage doc stale | Task #1902 (MERGED) auto-fixes the underlying state; doc cleanup falls under #2307 | Covers (doc cleanup) |
| D1 — Live-vs-mock not documented per artifact | Task #2287 (PROPOSED — Show a freshness indicator when Lyte data lacks live signals); Task #2308 (One-of-One platform cohesion & investor-ready pass) | Partial — Lyte-only coverage; needs platform-wide hook |
| D2 — Claims file sparsely populated | Task #2068 (live); ongoing | Covers operationally; data backfill is the actual GAP |
| D3 — No per-route live-vs-mock telemetry signal | **GAP** — no proposed task surfaces a `liveDataSource: true` runtime header / dashboard hook |
| E1 — Tailwind / theme / Card duplication | Task #2306 (UI primitives); Task #2308 (cohesion) | Covers |
| E2 — Design drift awareness | Mockup-sandbox skill + Task #2303 (Professional demo videos & on-brand screenshot kit) | Covers |
| F1 — Orphan directories `firestorm`, `imperium` | Task #2307 (consolidation sweep) | Covers |
| F2 — `artifacts/audit/` and `artifacts/internal-audit/` as artefact storage | **GAP** — no task proposes moving these out of `artifacts/` |
| F3 — `cortex-mobile` Concept stub | Task #2302 (smoke test) will surface; no explicit cleanup task | **GAP** for cleanup |

**Real GAPs (no covering task):** A3, C1, D3, F2, F3-cleanup.

---

## 5. Platform-Registry Proof-Point Shortlist

Criteria used (each scored 1–5, higher = better proof-point):

- **Size** — small enough that a registry migration can be done end-to-end without a multi-week diff.
- **Blast radius** — low risk if the migration regresses (fewer downstream dependencies).
- **Representativeness** — exercises the patterns a registry must support (auth, API routes, data sources, AI gateway, mobile client, scheduled jobs).
- **Owner availability** — recent commits show active maintenance.
- **Current health** — currently runs, has tests, no known P0 bugs.

| Candidate | Size | Blast | Repr. | Owner | Health | Total | Notes |
|---|---|---|---|---|---|---|---|
| **Pulse** | 5 | 4 | 5 | 5 | 4 | **23** | 23 src files; uses AI gateway, scheduled jobs, email subscriptions, PDF export, public unsubscribe, durable queue — most patterns the registry must support |
| **Counsel** | 5 | 5 | 3 | 3 | 3 | 19 | Skeleton (14 src files) — almost greenfield, perfect for "what does the registry require?" but won't surface AI/data-source patterns |
| **Sentra** | 4 | 4 | 4 | 5 | 4 | 21 | Newest artifact (Task #2299 just merged) — fresh enough that adopting a registry doesn't break legacy patterns |
| Carlota Jo | 4 | 3 | 4 | 4 | 5 | 20 | GA, healthy; good but is the most-business-critical artifact — risky proof-point |
| Lyte Command Center | 4 | 4 | 4 | 4 | 4 | 20 | Just got live API wiring; momentum is good but APP_STATUS lifecycle inconsistency adds noise |

### Recommended #1: Pulse

Pulse is the right proof-point because it is **small enough to migrate in one task** (23 source files, one page of routes) yet **representative enough to validate every required registry primitive**: it has session auth + a public unsubscribe surface (auth modes), a real AI generation path with mock fallback (data-source posture), a daily scheduled job (worker integration), an email pipeline behind a durable queue (background work), a PDF export with a CSRF-exempt demo variant (special-case route policy), and a Settings page that subscribes/un-subscribes (CRUD UX). If the registry can describe Pulse end-to-end, it can describe anything else in the suite. Risk is low — Pulse has no other artifact depending on it, so a regression is contained to one preview path.

---

## 6. Follow-Up Tasks (Appendix)

Each item is a one-line title + short rationale, grouped by theme. Items are checked against the in-flight task list; "NEW" means not currently in flight, "EXTENDS #N" means it builds on an existing task.

### Registry

- **NEW — Define a typed artifact registry as the single source of truth.** Closes GAP A3. A `lib/artifact-registry/` package exporting `{ id, kind, previewPath, lifecycle, owners, ownedRoutes, dataSources, authMode }` with runtime validation.
- **NEW — Attribute every API route to one or more artifacts.** Closes GAP C1. Add a per-route `@artifact(...)` annotation (or a registry-side mapping) and a CI check that fails on un-attributed routes.
- **EXTENDS #2068 — Backfill `launch/01_ability_matrix.json` `live_state` column.** Brings the strict `verify:claims` gate from "wired" to "useful".

### Hardening

- **EXTENDS #2306 — Adopt `@szl-holdings/replit-auth-web` across Pulse and SZL Holdings.** Eliminates the local `useAuth()` and the `installAuthClearedRedirect` divergence (B1–B3).
- **EXTENDS #2307 — Delete `artifacts/firestorm` and `artifacts/imperium` directories.** Closes F1.
- **NEW — Move `artifacts/audit/` and `artifacts/internal-audit/` under `ops/`.** Closes GAP F2; stops the `artifacts/` directory from being a mixed bag.
- **NEW — Decide and act on `artifacts/cortex-mobile/`.** Either scaffold a real Expo project or remove the directory; current Concept stub is misleading. Closes GAP F3.

### Observability

- **NEW — Per-route `liveDataSource` telemetry signal.** Closes GAP D3. Each route handler declares `live | mocked | seeded`; surfaced through `/api/health/data-sources` and consumed by a dashboard widget.
- **EXTENDS #2287 — Generalise the Lyte freshness indicator into a shared `<FreshnessBadge>` primitive** so every artifact can display data-source status consistently (covers D1).

### Demo system

- *(no new follow-ups — Tasks #2303, #2304, #2305 already cover demo videos / screenshots / champions research)*

### CI

- **NEW — CI gate: every registered artifact must have a passing E2E spec.** Pulse, Sentra, Counsel, PRISM Counsel, Lyte Command Center, Mockup Sandbox currently have none. Would have caught the Pulse local-`useAuth` divergence at PR time.
- **EXTENDS #2068 — Add `audit:artifact-status` CI gate** that diff-checks the registry against `docs/APP_STATUS.md` (closes the "Lyte / PRISM marked archived but live" drift in A1).

### Docs

- **EXTENDS #2307 — Rewrite `docs/APP_STATUS.md` to be generated from the registry.** Eliminates the recurring drift that this audit just surfaced.
- **NEW — Single `AGENTS.md` (or `docs/CONTRIBUTING_ARTIFACTS.md`) explaining the registry, route attribution, and lifecycle states.** Today new contributors must triangulate `.replit`, `APP_STATUS.md`, and the workspace registry.

---

*End of report. No code, configuration, schema, or CI changes were made by this task.*
