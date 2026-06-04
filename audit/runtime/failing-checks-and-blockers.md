# Failing Checks & Blockers
**Generated:** 2026-04-26  
**Phase:** Rehaul 4/9 — Workspace, Dependency & Build Stabilization

---

## Active Failures After This Phase

### 1. `pnpm test` — `@workspace/tool-mesh` (2 DB integration tests)

**Status:** FAIL  
**Tests:**
- `Finance tool manifests > portfolio-snapshot handler returns expected shape`
- `Finance tool manifests > budget-forecast handler returns expected shape`

**Root cause:** Tests call real tool handlers (`portfolioSnapshotHandler`, `budgetForecastHandler`) that execute live SQL queries against `treasury_accounts` and `treasury_transactions` tables. These tables don't exist in the test environment without running full schema migrations first.

**Error:** `error: relation "treasury_accounts" does not exist` (PostgreSQL error code 42P01)

**What would unblock it:**
1. Run `pnpm migrate` (or `pnpm --filter @szl-holdings/db run push-non-interactive`) to apply the full schema to the local Postgres instance before running tests.
2. Or: mock the `db` import in those specific tests using `vi.mock()` / `vi.spyOn()` so they don't require a live database.

**Impact:** 2/107 tool-mesh tests fail. All 105 other tool-mesh tests (and all 69 other packages) pass.

---

### 2. `pnpm lint` — biome errors (22 errors, 14,366 warnings)

**Status:** FAIL (exit 1)  
**Time:** ~21s

**Root cause:** biome's default lint rules flag:
- `noNonNullAssertion` violations (the dominant source of warnings — workers use `array[i]!` extensively in tight hot paths)
- 22 actual errors (severity `error` in biome config) in workers and packages that were not addressed this phase

**Key error locations:**
- `workers/alloy-vector-worker/src/batcher.ts` — multiple `!` non-null assertions in array indexing loops
- Other worker files in `workers/alloy-*`

**What would unblock it:**
- For warnings: Add `// biome-ignore lint/style/noNonNullAssertion: hot path` suppressions where the non-null is provably safe, or restructure loops to avoid indexed access.
- For errors: Triage the 22 errors specifically (run `biome lint --max-diagnostics=1000 .` and filter for `severity: error`).
- Note: `pnpm lint:ci` uses `oxlint` + biome in CI mode — this should be used instead of bare `pnpm lint` to get actionable signal from both linters.

**Impact:** Does not block build or test. Blocks `pnpm lint:ci` (CI gate).

---

### 3. `pnpm typecheck` (turbo, full graph) — Timeout

**Status:** PARTIAL / TIMEOUT  
**Time:** >90s (168 packages)

**Root cause:** Running `turbo run typecheck` across 168 packages cold exceeds 90s wall-clock time in this environment. This is an infra sizing issue, not a code failure. Individual packages typecheck correctly.

**Confirmed passing packages (sampled):**
- `@szl-holdings/platform-registry` (config) — fixed this phase
- `@workspace/alloy-runtime-api` — fixed this phase
- `@szl-holdings/lib-domain-claims` — passes
- `@workspace/tool-mesh` — passes
- `@workspace/forge` — passes
- `@szl-holdings/monte-carlo` — passes

**What would unblock it:**
- Run `pnpm typecheck` against affected packages only using `--filter` in CI.
- Or: set up turbo remote caching so unchanged packages skip typecheck.
- Or: increase CI timeout budget to 5+ minutes for the typecheck step.

---

### 4. `pnpm typecheck:libs` (`tsc --build`) — Timeout

**Status:** FAIL / TIMEOUT  
**Time:** >120s

**Root cause:** The root-level `tsc --build` compiles all project references listed in `tsconfig.json` (26 lib/ and packages/ entries). Cold compilation of this graph exceeds the 2-minute timeout in this environment.

**What would unblock it:**
- Enable `tsc --build --incremental` with persistent cache (`.tsbuildinfo` files).
- Or: run per-package typechecks in parallel (which turbo already does).

---

### 5. `pnpm test:e2e` — No live app

**Status:** BLOCKER (expected in CI without workflows running)  
**Time:** N/A

**Root cause:** Playwright tests require a live app server. No workflows were running during this audit pass.

**What would unblock it:**
- Start the app workflows (`pnpm dev` or via Replit workflow manager) before running `pnpm test:e2e`.
- Or: run only in the deployed (preview) environment where all services are live.

---

### 6. `pnpm qa:site` / `pnpm test:smoke` — No live app

**Status:** BLOCKER (expected in CI without workflows running)  
**Time:** N/A

**Root cause:** `smoke-routes.js` makes HTTP requests to artifact URLs (via `scripts/lib/artifact-ports.js`). Without live servers, all checks return connection errors.

**What would unblock it:**
- Same as test:e2e — start all artifact workflows before running.
- Or: add a `--dry-run` flag to `smoke-routes.js` that validates routes structurally without HTTP calls, for static CI validation.

---

## vitest Peer Dependency Warning (Non-Blocking)

```
workers/alloy-embed-worker
└─┬ vitest 3.2.4
  └── ✕ unmet peer @vitest/ui@3.2.4: found 4.1.2
workers/alloy-rerank-worker  
└─┬ vitest 3.2.4
  └── ✕ unmet peer @vitest/ui@3.2.4: found 4.1.2
```

**Status:** WARNING only — does not block tests.

**Root cause:** The workspace catalog pins `vitest: 3.2.4` but the root devDependency uses `vitest: ^4.1.2`. Workers pull `3.2.4` from the catalog; the root's `@vitest/ui@4.1.2` (installed for root vitest) creates a version mismatch warning.

**What would unblock it:**
- Update `vitest` in the catalog to `^4.1.2` (or a specific 4.x version) and bump worker dependencies accordingly.
- Or: remove `@vitest/ui` from root devDependencies since it's not needed by workers.

---

## Summary Table

| Check | Status | Blocking? | Unblocked By |
|-------|--------|-----------|--------------|
| pnpm install | PASS | — | — |
| pnpm lint | FAIL | CI lint gate | Fix biome noNonNullAssertion in workers |
| pnpm typecheck (turbo) | PARTIAL | Infra timeout | Turbo remote cache or per-package CI filter |
| pnpm typecheck:libs (tsc) | PARTIAL | Infra timeout | Incremental build cache |
| pnpm build (turbo) | PASS | — | — |
| pnpm test (turbo) | NEAR-PASS | tool-mesh DB tests | Run migrations before test or mock DB |
| pnpm test:e2e | BLOCKER | No live app | Start workflows before running |
| pnpm qa:site | BLOCKER | No live app | Start workflows before running |
| pnpm test:smoke | BLOCKER | No live app | Start workflows before running |
