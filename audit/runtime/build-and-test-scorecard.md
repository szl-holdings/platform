# Build & Test Scorecard
**Generated:** 2026-04-26  
**Phase:** Rehaul 4/9 — Workspace, Dependency & Build Stabilization

---

## Pipeline Results Summary

| Script | Command | Result | Time | Notes |
|--------|---------|--------|------|-------|
| install | `pnpm install` | **PASS** | ~15s | 2 vitest peer warnings (catalog v3.2.4 vs root v4.1.2); cyclic dep FIXED |
| lint | `pnpm lint` | **FAIL** | ~21s | 22 errors, 14,366 warnings from biome; see failing-checks-and-blockers.md |
| typecheck | `pnpm typecheck` (turbo) | **PARTIAL** | >90s | 168 packages; times out under default CI budget; passes per-package |
| typecheck:libs | `pnpm typecheck:libs` | **PARTIAL** | >120s | Root-level tsc --build; large ref set, times out in this env |
| build | `pnpm build` (turbo) | **PASS** | ~62s | 39 packages in scope; 0 failures after TypeScript fix in alloy-runtime-api |
| test | `pnpm test` (turbo) | **NEAR-PASS** | ~60s | 69/70 packages pass; 1 failure: tool-mesh (2 DB integration tests) |
| test:e2e | `pnpm test:e2e` | **BLOCKER** | N/A | Requires live app; no workflows running in CI context |
| qa:site | `pnpm qa:site` | **BLOCKER** | N/A | Requires live app; smoke-routes.js hits real URLs |
| test:smoke | `pnpm test:smoke` | **BLOCKER** | N/A | Requires live app; same reason as qa:site |

---

## Fixes Applied This Phase

### 1. Cyclic Dependency — `lib/forge-runtime` ↔ `packages/tool-mesh`
- **Root cause:** `lib/forge-runtime/package.json` listed `@workspace/tool-mesh` as a runtime `dependency`; `packages/tool-mesh` listed `@szl-holdings/forge-runtime` as a dependency — creating a build-graph cycle that prevented turbo from running any build or test task.
- **Fix:** Removed `@workspace/tool-mesh` from `lib/forge-runtime` `dependencies` entirely. The only usage was a single dynamic `await import('@workspace/tool-mesh')` in `code-handler.ts`, which resolves at runtime via pnpm hoisting without a static build-time declaration.
- **Verified:** `turbo run build --dry=json` no longer reports a cyclic error.

### 2. TypeScript Error — `apps/alloy-runtime-api/src/routes/v1/search.ts`
- **Root cause:** Code accessed `run.status` and `s.status` (TS2339) but `WorkflowRun` uses `state: WorkflowRunState` and `StepRunRecord` uses `state: StepRunState`.
- **Fix:** Replaced `.status` with `.state` at lines 123, 126, 137.

### 3. Feature Flag `'pilot'` RuntimeMode (TypeScript TS2322)
- **Root cause:** `packages/config/src/feature-flags.ts` used `'pilot'` in `enabledFor` arrays, but `RuntimeMode` union only contained `'local-dev' | 'internal-preview' | 'sandbox' | 'demo' | 'production'`.
- **Fix:** Added `'pilot'` to `RUNTIME_MODES` array and `RUNTIME_MODE_PROFILES` map in `packages/config/src/runtime-mode.ts`.

### 4. `makeClaimResolver` Silent Failures — `lib/domain-claims/src/index.ts`
- **Root cause:** `_modulePrefix` parameter was unused; `resolveClaim` silently returned fallback without emitting `console.warn`. Tests expected warning output.
- **Fix:** Renamed `_modulePrefix` → `modulePrefix` and added `console.warn(...)` on unknown claim ID.

### 5. Stale Test Assertions (4 packages)
- **`packages/verifier`** `routes-ordering.test.ts`: Quote-style mismatch. Test regex used `"` but routes file uses `'`. Fixed with `["'"]` pattern.
- **`packages/forge`** `alloy.test.ts`: `gemini-3-flash-preview` model was added to router with `avgLatencyMs: 300` (cheapest fast option). Expected list updated.
- **`packages/tool-mesh`** `tool-mesh-gateway.test.ts`: MCP protocol version updated from `2024-11-05` to `2025-11-25` in source; `listTools()` now always includes built-in `call_tool` meta-tool (count 2→3 and 1→2 respectively).
- **`lib/monte-carlo`** `distributions.test.ts`: `buildHistogram` had a floating-point boundary bug — last bucket's `hi` could be slightly less than `max` due to accumulated rounding errors, dropping the max sample. Fixed with `Math.max(hiRaw, max)` for the last bucket.

### 6. Packages Without Test Files
- **`packages/aef-sdk`**: Added `--passWithNoTests` to `vitest run` (no test files exist yet).
- **`apps/alloy-runtime-api`**: Added `--passWithNoTests` to `vitest run` (no test files exist yet).

---

## Remaining Pipeline Items

### tool-mesh DB integration tests (2 tests)
- `Finance tool manifests > portfolio-snapshot handler returns expected shape`
- `Finance tool manifests > budget-forecast handler returns expected shape`

Both hit real DB tables (`treasury_accounts`, `treasury_transactions`) that don't exist in the test environment without running full schema migrations. See `failing-checks-and-blockers.md` for details.

### biome lint errors
22 lint errors are primarily `noNonNullAssertion` violations in `workers/alloy-vector-worker`. See `failing-checks-and-blockers.md`.

### typecheck (turbo, full run)
Runs cleanly per-package; the aggregate `turbo run typecheck` across 168 packages requires >90s and exceeds default CI timeout budgets. Not a code failure — an infra sizing issue.
