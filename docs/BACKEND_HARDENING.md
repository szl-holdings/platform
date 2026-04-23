# BACKEND HARDENING — Phase 3

Captured: 2026-04-23.

## Real fix shipped this pass

### `DB_POOL_MAX` default 100 → 12

**File:** `packages/env/src/index.ts`. **Why:** prevents the recurring `sorry, too many clients already` crash under post-merge storms on Replit's shared Postgres budget. Production with a dedicated DB tier should override via env. Documented in detail in `DATABASE_EFFICIENCY_AUDIT.md`.

This is the most impactful single backend change in this pass.

### Connectors typecheck restored

**File:** `packages/connectors/package.json`. **Why:** missing workspace dep meant 10 source files were not type-checked. Fix restores compile-time safety on a package that integrates with external systems — the worst place to skip type checks.

### `lib/config` composite project built

**Why:** TS6305 was masking type errors in `lib/domain-claims`. Built; resolved. Recommended follow-up: add `pnpm tsc --build` to `prepare` script so this can't recur on `pnpm install`.

## Existing strengths (catalogued — DO NOT undo)

These were already in place before this pass and meet or exceed what the brief asks for:

- **Dedicated `healthPool`** in `lib/db/src/index.ts` (max=2, 1s connect, 2s statement timeout). Pinned by `health-pool-saturation.test.ts`.
- **OBS-007 long-checkout detection** with caller-stack capture before await. Pinned by `db-pool-instrumentation.test.ts`.
- **Slow-query telemetry** wraps every `pool.query`, records into `serverTelemetry.recordDbQueryLatency`.
- **Statement-level timeout** at 60s prevents weaponised long-running queries.
- **Sweeper with `unref()`** — background warning loop never keeps process alive.
- **Boot orchestration test** (`boot-orchestrator.test.ts`) guards startup ordering at `DB_POOL_MAX=10`.
- **Rate limiting** — confirmed in `routes/alloy-chat.ts` (`max: 100`) and other routes.
- **Global auth enforcer** with explicit allowlist; new routes default to private.
- **CSRF middleware** with explicit allowlist (mobile token-exchange correctly exempted).
- **Tenant isolation tests** — public-route data isolation regression pinned (Task #1420).

## Audit findings (NOT shipped — names follow-up)

| Finding | Evidence | Risk | Recommended action |
| --- | --- | --- | --- |
| Two pagination clamps under different names | `routes/consciousness.ts: safeLimit`, `routes/ai-ops-dashboard.ts: parsePaginationInt` | Drift if behaviour diverges | Extract `safePaginationLimit` helper post-launch |
| Two ad-hoc OBS-007 fallback `import()` blocks in `lib/db/src/index.ts` | Lines 70–76 and 80–86 of `lib/db/src/index.ts` | Maintenance friction | Extract `recordQueryLatencySafe(durationMs, queryText)` helper |
| Middleware-order audit not yet performed | api-server `index.ts` registers middlewares in a specific order — not enumerated against the canonical CSRF/auth/rate-limit ordering | Medium — wrong order is a common regression vector | Single sweep with manual verification |
| Concurrent-promise audit not yet performed | Some background workers fan out without explicit concurrency caps | Low — `DB_POOL_MAX=12` cap mitigates worst case | Map worker concurrency vs pool size |
| Express + Hono coexistence not formally documented | Brief explicitly allows coexistence; current state is "Express only" plus exploratory Hono routes | Low | Document the rule (new routes only for Hono) |

## Audit findings already mitigated by code in tree

- **Listener leaks:** `process.on(...)` calls in entry points use named functions; not many wildcards. Sweep was light but no flagrant violations.
- **Sync work on request paths:** `routes/guardian.ts` and `routes/pulse.ts` use awaits; no obvious blocking sync I/O on hot paths.
- **Unhandled rejections:** root entry has `process.on("unhandledRejection")` per the boot orchestrator pattern.

## What this pass deliberately did NOT do

- Did not rewrite any of the 14 oversized route handlers.
- Did not change middleware order (left for explicit owner review).
- Did not introduce a new abstraction layer (brief warns against framework sprawl).
- Did not migrate any routes from Express to Hono.
- Did not add new telemetry providers.

## Definition of done

| Goal | Status |
| --- | --- |
| C1 reliability fix (DB pool exhaustion crash) | DONE — needs 5+ post-merge observation to verify |
| Typecheck blockers cleared (connectors, domain-claims) | DONE |
| OBS-007 + healthPool + slow-query intact and verified | DONE (existing) |
| Middleware-order audit | DEFERRED — single sweep recommended |
| Duplicate-helper consolidation | DEFERRED — named with file pointers |
