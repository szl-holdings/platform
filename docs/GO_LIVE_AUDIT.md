# GO-LIVE AUDIT — Phase 1 census + triage

Captured: 2026-04-23. Companion to `docs/GO_LIVE_BASELINE.md`.

This file is the **honest, prioritised** audit. It identifies what is dead, redundant, risky, or oversized. It does not list things that are merely "old" or "verbose" if they work and are referenced.

---

## A. Real bugs found and fixed in this pass

### A1. `packages/connectors` typecheck broken (FIXED)
- **Severity:** HIGH (compile error, blocked clean `pnpm -r typecheck`).
- **Cause:** `packages/connectors/package.json` did not declare `@workspace/ontology` as a dependency, despite 10 source files importing `@workspace/ontology/signal`. pnpm did not link the package into `node_modules`, so TS could not resolve the module.
- **Fix:** Added `"@workspace/ontology": "workspace:*"` to `dependencies`, ran `pnpm install`, re-typechecked. Now passes.
- **Follow-on:** Phase 2 should add a CI check that every workspace import is declared in the importer's `package.json` (we have `scripts/check-package-boundaries.ts` — verify it covers this case).

### A2. `lib/domain-claims` typecheck broken (FIXED)
- **Severity:** MEDIUM (compile error in dependent project).
- **Cause:** `lib/domain-claims` imports `lib/config` types, but `lib/config` is a composite TS project (`composite: true`). TS6305 fires when the composite project hasn't been built — `dist/public-claims.d.ts` was missing.
- **Fix:** Ran `tsc --build lib/config`. Composite builds should be wired into `pnpm install` post-hook or `prepare` script for new clones; otherwise this will reappear on every fresh checkout.
- **Follow-on:** Add `pnpm tsc --build` to the `prepare` script (currently only runs `setup-hooks.sh`).

---

## B. Duplication — concrete and measurable

### B1. **TWO ontology packages exist**
- `lib/ontology` → `@szl-holdings/ontology` — **3 consumers**
- `packages/ontology` → `@workspace/ontology` — **36 consumers**
- Both define overlapping concepts (entity, evidence, signal). The `@workspace/ontology` package is clearly the canonical one. The `@szl-holdings/ontology` package should be **deprecated and merged**.
- **Action (Phase 8):** migrate the 3 consumers of `@szl-holdings/ontology` to `@workspace/ontology`, delete `lib/ontology/`. ~Saves a package, removes drift risk.

### B2. **Firestorm rebrand leftovers** (already tracked as Task #1438)
- 25 source files and 10 build artifacts still carry the old `firestorm` name across:
  - `artifacts/api-server/src/lib/domain-services/firestorm/`
  - `artifacts/api-server/src/routes/firestorm/`
  - `artifacts/api-server/src/routes/firestorm-{command-surfaces,cognitive,live}.ts`
  - `artifacts/api-server/src/graphql/domains/firestorm.ts`
  - `lib/api-zod/src/generated/types/firestorm{Analytics,Campaign,Lead}.ts`
  - `lib/db/src/schema/firestorm.ts`, plus 3 migration files
  - `lib/observability/src/configs/firestorm.ts`
  - `lib/graphql-client/src/hooks/firestorm.ts`
- The product is now called **Aegis**. Tasks #1437 (route rename), #1438 (directory cleanup), #3419 (API path migration) cover this.
- **Risk if shipped as-is:** customer-visible brand drift in URLs and audit logs.

### B3. Repeated-name files (high-likelihood duplication, requires deeper review)
- A full duplicate-by-content scan is deferred to Phase 8 (Consolidation). Initial sweep:
  - 14 single-file route handlers >1,900 LOC each (see baseline) very likely contain inlined response wrappers, error envelopes, and auth checks that should live in shared middleware.

---

## C. What is risky / blocks midnight

| # | Issue | Severity | Phase |
| --- | --- | --- | --- |
| C1 | API server **DB pool exhaustion** during post-merge storms — recurring crashes | **CRITICAL** | Phase 4 |
| C2 | 4 oxlint **errors** (not warnings) across the codebase | **HIGH** | Phase 5 |
| C3 | Drizzle-kit push times out on every post-merge — schema drift accumulates silently | **HIGH** | Phase 4 |
| C4 | `firestorm` brand still in URLs, DB schema names, audit logs (Tasks #1437/#1438/#3419) | **HIGH (brand)** | Phase 2 |
| C5 | Command artifact port-detection timing — intermittent boot failures | **MEDIUM** | Phase 6 (observability) + platform issue |
| C6 | 114 skipped/`.todo` tests with no triage owner | **MEDIUM** | Phase 7 |
| C7 | 3,892 stale entries in `banned-brand-strings.baseline.json` — masks real violations | **MEDIUM** | Phase 10 |
| C8 | `pnpm -r typecheck` has not been verified clean end-to-end this pass | **MEDIUM** | Phase 7 |
| C9 | `attached_assets/` is 129 MB and contains user uploads — should not be tracked | **LOW** | Phase 2 |

---

## D. What exists and is strong (do NOT touch)

These areas have recently landed work, tests, and rationale documented. Hands off:

- **Tenant isolation** (Tasks #1416, #1417) — recent merge, audit-trace landed.
- **LP portal** (Tasks #1388, #1389, #1390) — uploads, email notifications, isolation tests all green (13/13 + suite passing).
- **Pulse HMR / sub-path proxy** (Task #1423) — 11 unit tests, fixed and verified.
- **Pre-commit docs-drift hook** (Task #1435) — `.husky/pre-commit` canonical source, `setup-hooks.sh` installer.
- **API spec route-path drift detection** (Task #1436) — CHECK 8 in `scripts/docs/check-docs-claims.js`.
- **Mobile OIDC token exchange** (Task #1425) — nonce forwarding fix landed, 8/8 tests.
- **Carlota Jo dashboards** (Task #1420) — DB-backed metrics with safe static fallback.
- **Command artifact telemetry crash** (already fixed earlier in session) — try/catch around `OTLPTraceExporter` and `initTelemetry()`.

---

## E. Performance-sensitive surfaces (warrant deeper Phase 3/4 review)

Top candidates inferred from file size + traffic patterns:

1. `routes/guardian.ts` (3,973 LOC) — Guardian is on every privileged action path
2. `routes/command.ts` (3,591 LOC) — central operator surface
3. `routes/nexus.ts` (3,072 LOC) — agent runtime, likely SSE/streaming
4. `routes/pulse.ts` (2,660 LOC) — briefing dashboards, likely heavy joins
5. `routes/terra-cognitive.ts` (3,555 LOC) — Terra real-estate intelligence layer
6. `lib/scheduled-jobs.ts` (2,014 LOC) — background workers, contention candidate
7. `lib/email.ts` (1,979 LOC) — outbound queue, retry logic candidate

**Phase 4** must inventory query patterns (N+1, missing pagination, repeated identical queries) inside these.

---

## F. What is safe to remove now

- `nohup.out` (zero bytes, already gitignored) — delete
- Empty `.gitkeep` files inside non-empty directories: `artifacts/api-server/src/middlewares/.gitkeep`, `artifacts/api-server/src/lib/.gitkeep` — delete
- `docs/reports/master/logs/env-references.txt` (zero bytes) — delete

These are trivial, low-risk Phase 2 wins.

---

## G. What MUST NOT be touched before launch

- Domain business logic inside route handlers (per the brief — Phase 3 is wiring/instrumentation only)
- The PostgreSQL engine (per the brief)
- Express stack (per the brief — Hono may run alongside; no migration)
- Visual identity / design system (per the brief)
- Mobile (Expo/RN) functional code (per the brief)
- Existing LLM provider adapters (per the brief — no new providers)
- The Drizzle schema for currently-live tables (additive migrations only)

---

## H. Phase scorecard at end of Phase 1

| Phase | Status | Output |
| --- | --- | --- |
| 0 — Baseline | **DONE** | `docs/GO_LIVE_BASELINE.md` |
| 1 — Census + triage | **DONE** | this file |
| 2 — Dead code elimination | not started | `docs/REMOVALS_AND_CONSOLIDATION.md` |
| 3 — Backend hardening | not started | inline + observability doc |
| 4 — DB efficiency | not started | `docs/DATABASE_EFFICIENCY_AUDIT.md` |
| 5 — Frontend perf | not started | `docs/FRONTEND_PERFORMANCE_AUDIT.md` |
| 6 — Observability | not started | `docs/OBSERVABILITY_UPGRADE.md` |
| 7 — Stress tests | not started | `docs/STRESS_TEST_RESULTS.md` |
| 8 — Consolidation | not started | `docs/CONSOLIDATION_DECISIONS.md` |
| 9 — Controlled innovation | not started | inline |
| 10 — Security hardening | not started | `docs/GO_LIVE_SECURITY_HARDENING.md` |
| 11 — Release readiness | not started | exec summary, blockers, runbook, rollback, checklist |

**Real fixes landed this pass:**
- A1: `packages/connectors` typecheck — declared missing workspace dep
- A2: `lib/domain-claims` typecheck — built composite `lib/config`
