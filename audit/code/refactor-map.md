# Refactor Map

**Generated:** 2026-04-20  
**Pass:** Series-A foundation inventory & sanitation

This map identifies refactoring candidates prioritized by risk/impact. Items are grouped by theme and approximate effort.

---

## Priority 1 — High Impact, Low Risk

### 1.1 Extract Shared Vite Plugins to a Package

**Effort:** 1-2 days  
**Impact:** Eliminates ~9 copies of duplicated `sharedProxyPlugin()` and `rootRedirectPlugin()` across all artifact vite.config.ts files.  
**Action:** Create `packages/vite-plugins/` with exported `sharedProxyPlugin()` and `rootRedirectPlugin()` helpers. Each artifact imports instead of inlining.

### 1.2 Consolidate `buildWorkspaceAliases` into a Single Shared Module

**Effort:** 0.5 days  
**Impact:** Already partially done (szl-holdings, pulse refactored to `scanDirForAliases`). The remaining ~9 artifacts that don't use this function but also have workspace packages as deps should adopt the same pattern.  
**Action:** Move `buildWorkspaceAliases` + `scanDirForAliases` into `packages/vite-plugins/workspace-aliases.ts`.

### 1.3 Fix pnpm Hoist Configuration

**Effort:** 0.5 days  
**Impact:** Fixes the `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF` root cause so all workspace packages symlink correctly without manual intervention.  
**Action:** Run `pnpm install` in a proper TTY with `CI=true` to reset hoist settings. Add `.npmrc` check to CI to prevent future drift.

---

## Priority 2 — High Impact, Medium Effort

### 2.1 Consolidate Prism Counsel Schema Files

**Effort:** 1 day  
**Impact:** Removes 3 near-identical schema files (`_s31`, `_ny`, `_ops`, `_pilot`) and reduces schema maintenance surface by 75%.  
**Action:** Create a `makePrismCounselSchema(prefix: string)` factory function. One source of truth, four instantiations.

### 2.2 Run Drizzle Migrations

**Effort:** 0.5 days (coordination with DB admin)  
**Impact:** Resolves 8+ runtime DB errors: `relation "on_call_schedules" does not exist`, `column "campaign_id" does not exist`, `relation "competitive_intel_state" does not exist`.  
**Action:** Run `pnpm --filter @workspace/api-server drizzle-kit migrate` against the development DB.

### 2.3 Replace Deprecated `ALLOY_INTERNAL_TOKEN` References

**Effort:** 0.5 days  
**Impact:** Eliminates startup WARN logs; reduces security surface area.  
**Action:** Update all callers of `ALLOY_INTERNAL_TOKEN` to use `INTERNAL_SERVICE_TOKENS` with explicit per-domain scopes. Remove the legacy env var handling after migration.

### 2.4 Remove Stale `dist/` Directories from Git

**Effort:** 0.5 days  
**Impact:** Reduces repo size by ~4 MB; prevents confusion between source and build output.  
**Action:** `git rm -r lib/api-zod/dist lib/design-system/dist lib/brand-registry/dist lib/shared-ui/dist` and add these patterns to `.gitignore`.

---

## Priority 3 — Important but Complex

### 3.1 Merge `@szl-holdings/contracts` and `@szl-holdings/shared-contracts`

**Effort:** 2-3 days  
**Impact:** Eliminates semantic bleed between two packages with overlapping roles.  
**Action:** Decide which package is canonical. Move all unique content to the winner. Update all imports. Deprecate the loser.

### 3.2 Fix `tenantScope` Middleware (500 vs 403)

**Effort:** 1 day  
**Impact:** Fixes 4 test failures where cross-tenant access returns 500 (unhandled error) instead of 403 (expected). This is a security gap in dev-mode middleware.  
**Action:** The `tenantScope` middleware is throwing an unhandled error instead of calling `next(err)` or returning a 403. Add try/catch with explicit 403 return.

### 3.3 Add `@szl-holdings/lib/services` `override` Modifiers

**Effort:** 1 day  
**Impact:** Fixes TypeScript compiler errors in `lib/services/src/adapters/*.ts` (many adapter methods override base class methods but are missing the `override` keyword, required under `noImplicitOverride: true`).  
**Action:** Add `override` keyword to all overriding methods in adapter files. Primarily affects: ai.ts, abuseipdb.ts, alienvault-otx.ts, alpha-vantage.ts, arxiv.ts, and ~15 others.

### 3.4 Python Environment Setup for `lyte-metrics-store`

**Effort:** 0.5 days  
**Impact:** Fixes the lyte-metrics-store service and test failures (structlog and pytest not installed).  
**Action:** Add `structlog`, `pytest`, and related Python deps to the Nix/pip configuration for the workspace. Alternatively, add a `setup.py` or `pyproject.toml` with `pip install -e .` step in the workflow.

---

## TypeScript Type Errors (Sampled)

In addition to missing `override` modifiers, the following pre-existing type errors were observed:

| File | Error | Notes |
|------|-------|-------|
| `lib/api-client-react/src/` | `Object is possibly undefined` | Strict null checks; generated code |
| `packages/env/src/index.ts` | `exactOptionalPropertyTypes` issues | `AI_PROVIDER` optional field |
| Various adapters in `lib/services/src/adapters/` | Missing `override` keyword | ~15+ files |

---

## Completed Refactors This Pass

| Item | What Changed | Files |
|------|-------------|-------|
| `buildWorkspaceAliases` | Refactored to `scanDirForAliases` helper; now scans both `lib/` and `packages/` | `artifacts/szl-holdings/vite.config.ts`, `artifacts/pulse/vite.config.ts` |
| Biome auto-fix | Consistent formatting across 4,397 files | Monorepo-wide |
| tsconfig.json references | 7 missing package references added | Root `tsconfig.json`, `packages/env/tsconfig.json`, `lib/db/tsconfig.json` |
| proxy-routes regex | Fixed quote-matching to work with biome-formatted single quotes | `scripts/shared-proxy.mjs`, `artifacts/szl-holdings-mobile/scripts/health-proxy.js` |
| Manual package symlinks | `@szl-holdings/contracts`, `auth-shared`, `env` symlinked into 16 artifact node_modules | `artifacts/*/node_modules/@szl-holdings/` |
| Test quote-style fix | Regex in `group-protected-attestation.test.ts` updated to match both `'` and `"` | `artifacts/api-server/src/routes/__tests__/group-protected-attestation.test.ts` |
