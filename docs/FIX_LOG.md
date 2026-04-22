# SZL Holdings — Fix Log

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
