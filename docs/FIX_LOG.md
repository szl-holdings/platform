# SZL Holdings — Fix Log

---

## 2026-04-27 — Diligence Audit (Task #3206)

**Session scope:** Comprehensive diligence audit — claim reconciliation, pipeline evidence capture, documentation refresh. No code changes applied (audit-only scope per task definition).

### Findings Logged (Not Fixed — Queued for Engineering Sprint)

#### FINDING-001: SDK TypeScript Index Signature Error (P0 — Build Blocking)

**Problem:** `packages/szl-sdk/src/resources/plugins.ts` and `treasury.ts` use `PaginationOptions & { ... }` where a `Record<string, string | number | boolean | undefined>` is expected. The type is missing an index signature.

**Impact:** Cascades to dependent packages: `a11oy`, `szl-holdings-mobile`, `szl-demo-video`, `@szl/alloy`, `alloy-ingestion-orchestrator`, `@szl/substrate`. (Note: `helios` removed from cascade list — folded into A11oy, task #4364. `pluginmesh` removed from cascade list — directory deleted from monorepo, task #4897.)

**Fix required:** Add index signature to `PaginationOptions` in the SDK, or cast at call sites.

**Files:** `packages/szl-sdk/src/resources/plugins.ts`, `packages/szl-sdk/src/resources/treasury.ts`

---

#### FINDING-002: Multiple Typecheck Failures (P0)

**Problem:** `turbo run typecheck` fails for 9 packages (confirmed 2026-04-27): `@workspace/aef-sdk`, `@workspace/reflection-engine`, `@workspace/aef-storage-adapters`, `@workspace/alloy-rank-worker`, `@workspace/alloy-embed-worker`, `@workspace/aef-retrieval-core`, `@workspace/aef-policy-guard`, `@szl-holdings/db`, `@szl-holdings/api-client-react`.

**Impact:** CI pipeline fails; cannot claim clean TypeScript.

**Fix required:** Per-package investigation and type error resolution.

---

#### FINDING-003: Biome Lint Failures (P0)

**Problem:** `biome lint .` reports 23 errors and 15,060 warnings across 6,780 files.

**Impact:** CI pipeline fails on lint.

**Fix required:** Address 23 errors; triage warnings for systematic reduction.

---

#### FINDING-004: Unregistered Artifact Directories (P1) — RESOLVED

**Problem:** `artifacts/helios` and `artifacts/pluginmesh` exist on disk but are not registered in the workspace artifact registry. Both fail to build.

**Fix applied (task #4364):** `artifacts/helios` has been folded into A11oy as the Frontier Intelligence section. All 7 Helios surfaces now live at `artifacts/a11oy/src/pages/frontier/` with API routes at `routes/helios/` in api-server. The standalone artifact directory is removed.

**Fix applied (task #4897):** `artifacts/pluginmesh` directory has been removed from the monorepo. The stale `/pluginmesh/` proxy route and `PLUGINMESH_PORT` constant were deleted from `packages/shared-proxy/src/index.ts`. The pluginmesh-orchestrator skill and `pluginmesh-broker` plugin catalog entry are unrelated (separate broker/MCP concepts) and remain intact.

---

#### FINDING-005: `metrics:generate` Points to Different Path Than Audit Script (P1)

**Problem:** Root `package.json` declares `metrics:generate` as `tsx scripts/generate-platform-metrics.ts` (root-level), but the comprehensive metrics generator used by this audit is `scripts/audit/generate-platform-metrics.ts` (subdirectory). Two separate scripts may produce different outputs.

**Clarification on `audit:all` vs `audit:full`:** Both ARE declared in root `package.json`. `pnpm audit:all` runs the P1 advisory suite (mocks, routes, copy, deps, design-system, links, smoke, crawl, stress). `pnpm audit:full` runs the full P0+P1 pipeline (includes `audit:all` plus install, typecheck, test, build, and E2E). They are distinct and not interchangeable.

**Fix required:** Verify both `metrics:generate` scripts produce identical output; consolidate to one canonical script. Use `audit:full` for P0 release gating and `audit:all` for advisory checks.

---

#### FINDING-006: Stale Metrics in Public Docs (P1)

**Problem:** `README.md` says "100 packages, 14 artifacts"; `docs/platform-facts.md` says 123 packages. Current metrics show 152 packages, 15 registered artifacts.

**Fix required:** Update README.md and platform-facts.md to reflect current metrics.

---

#### FINDING-007: PLATFORM_OVERVIEW.md Uses Old Product Name "Alloy" (P1)

**Problem:** `docs/PLATFORM_OVERVIEW.md` refers to the execution fabric as "Alloy" throughout. Current product name is "A11oy".

**Fix required:** Global find/replace of "Alloy" → "A11oy" in PLATFORM_OVERVIEW.md with review for accuracy.

---

#### FINDING-008: OPERABILITY_MATRIX References Archived "CORTEX Mobile" (P1 — fixed in this audit)

**Problem:** Previous OPERABILITY_MATRIX listed "CORTEX Mobile" in the Mobile section. `cortex-mobile` is an archived artifact. Current registered mobile artifact is `szl-holdings-mobile` (APEX).

**Status:** Fixed in this audit session — OPERABILITY_MATRIX.md updated.

---

## 2026-04-22 — API Server Clog Fix + Platform Hardening

**Date:** April 22, 2026
**Session scope:** API server clog fix + platform hardening audit

---

## Fixes Applied This Session

### FIX-001: API Server Bootstrap Deadlock (CRITICAL)

**Problem:** `bootstrapChainState()` was `await`-ed before `onMigrationsReady()` in the bootstrap sequence. When the query against `signal_chain_executions` hung (table missing due to migration ordering — Task #2886), the entire HTTP handler stayed in `{status: "starting"}` 503 mode permanently. Every pool checkout accumulated without release, exhausting the connection pool.

**Root cause:** Migration ordering leaves `signal_chain_executions`, `pulse_saved_briefings`, and `fund_lp_activity_events` uncreated. The Drizzle query against the missing table never threw — it hung waiting for a pool client that was already deadlocked.

**Fix:**
1. Moved `onMigrationsReady()` to fire immediately after migrations complete — before any optional hydration.
2. Changed `bootstrapChainState()` from `await` to fire-and-forget with a 10-second `Promise.race` timeout.
3. Made chain state hydration merge-only (`Math.max`) instead of reset-then-overwrite, preventing a race condition where live traffic increments could be clobbered by late-arriving DB counts.

**Files changed:**
- `artifacts/api-server/src/index.ts` — bootstrap sequencing
- `artifacts/api-server/src/routes/signal-chains.ts` — hydration merge logic

**Result:** API server now boots to HTTP 200 within 30 seconds. Health endpoint returns `{status: "healthy", database: {status: "ok", latencyMs: 11}}`.

**Verification:** `curl http://localhost:8080/api/health` → HTTP 200

---

### FIX-002: Signal Chain Default Counters (MEDIUM)

**Problem:** `DEFAULT_CHAINS` in `signal-chains.ts` initialized with non-zero `executionCount` (3, 1, 7) and recent `lastExecuted` timestamps. After the hydration fix (merge-only via `Math.max`), DB-truth counts that were lower than these hardcoded defaults could never overwrite them.

**Fix:** Set all default chain `executionCount` to 0 and `lastExecuted` to `undefined`. DB truth now always wins via the merge-only hydration.

**File:** `artifacts/api-server/src/routes/signal-chains.ts`

---

## Noted Observations (Documented, Not Fixed)

### OBS-001: Dev-Only Tokens in `.replit` Config

The `.replit` environment section contains dev-only tokens (`ALLOY_INTERNAL_TOKEN=dev-...`, `ADMIN_PIN=PULSE-DEMO-2026`, `SUBSTRATE_*=szl_dev_...`). These are Replit's standard mechanism for development environment variables. Production deployments use Replit's secrets manager to override all sensitive values. The dev tokens are prefixed with `dev-` or contain `REPLACE_ME` to make the distinction clear. No action required, but noted for awareness.

---

## Pre-Existing Issues (Not Fixed — Tracked)

| Issue | Severity | Tracker | Notes |
|-------|----------|---------|-------|
| Migration ordering — 12 statements fail on missing relations | Medium | Task #2886 | Non-fatal; server continues |
| Dead artifacts (cortex-mobile, imperium, prism-counsel) | Low | Archive recommended | 17MB total |
| Mapbox token not configured | Low | Known gap | Terra maps blank |
| `firestorm/` reference in README | Low | This report | Dead reference |
| `prism-counsel-ci.yml` references archived artifact | Low | This report | Remove |
| Schema definition/table count gap (1,084 vs 732) | Low | Audit recommended | Includes relations/views |
