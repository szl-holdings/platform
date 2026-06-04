# Debug Fixes Applied

**Generated:** 2026-04-20  
**Pass:** Series-A foundation inventory & sanitation

This document catalogs every targeted code change made during this reset pass, with root-cause analysis, fix description, and verification status.

---

## Fix #1 — Biome Auto-Fix (4,397 files)

**Root Cause:** Inconsistent formatting across the monorepo. Mixed quote styles, trailing commas, whitespace, and semicolon usage across files.

**Fix Applied:**  
```
pnpm biome check --write .
```

**Files Affected:** 4,397 TypeScript/TSX/JSON files  
**Verification:** Biome reports zero auto-fixable issues after the run. Remaining issues are diagnostics requiring manual intervention (unfixable by biome auto-fix).

**Side Effect:** Biome reformatted all TypeScript strings from double quotes to single quotes. This broke two downstream regex parsers:
- `scripts/shared-proxy.mjs` — proxy-routes.ts route parser regex (Fix #2)  
- `artifacts/szl-holdings-mobile/scripts/health-proxy.js` — same parser (Fix #3)
- `artifacts/api-server/src/routes/__tests__/group-protected-attestation.test.ts` — GROUP_PROTECTED_BASENAMES parser regex (Fix #7)

---

## Fix #2 — shared-proxy.mjs Route Regex

**Root Cause:** `scripts/shared-proxy.mjs` parsed `packages/proxy-routes.ts` with a regex that only matched double-quoted port numbers. After biome reformatting the proxy-routes.ts file to use single quotes, the regex extracted 0 routes (all 13 routes silent-dropped).

**Symptom:** shared-proxy loaded but showed `0 proxy routes` in its startup log; all artifact paths returned `502 Bad Gateway`.

**Fix Applied:**  
Changed regex from:
```
/"port":\s*(\d+)/g
```
To:
```
/['"]port['"]:\s*(\d+)/g
```

**File:** `scripts/shared-proxy.mjs`  
**Verification:** Workflow log shows `Loaded 13 proxy routes` after fix. shared-proxy is running and routing correctly.

---

## Fix #3 — health-proxy.js Route Regex (Mobile)

**Root Cause:** Same issue as Fix #2 but in the mobile app's health proxy.

**Fix Applied:** Same regex update to handle both `'` and `"`.

**File:** `artifacts/szl-holdings-mobile/scripts/health-proxy.js`  
**Verification:** Applied; mobile proxy route parsing restored.

---

## Fix #4 — Root tsconfig.json Missing Package References

**Root Cause:** Root `tsconfig.json` didn't include references for 7 packages added to the monorepo after the tsconfig was initially configured. TypeScript `--build` would miss these packages and they'd fail to typecheck.

**Fix Applied:** Added 7 references to root `tsconfig.json`:
- `packages/env`
- `packages/auth-shared`
- `packages/brand-registry`
- `packages/design-system`
- `packages/db`
- `packages/contracts`
- `packages/shared-contracts`

**Files:** `tsconfig.json`  
**Verification:** `tsc --build` no longer reports "cannot find package" for these references.

---

## Fix #5 — packages/env/tsconfig.json Missing `composite: true`

**Root Cause:** TypeScript project references require all referenced projects to have `composite: true`. The `packages/env` tsconfig was missing this flag.

**Fix Applied:** Added `"composite": true` to `packages/env/tsconfig.json`.

**File:** `packages/env/tsconfig.json`  
**Verification:** Package now compiles correctly as a TypeScript project reference.

---

## Fix #6 — lib/db/tsconfig.json Missing `references` Array

**Root Cause:** `lib/db/tsconfig.json` lacked a `references` array, preventing TypeScript from knowing about its workspace dependencies (notably `@szl-holdings/env`).

**Fix Applied:** Added `references: [{ path: "../../packages/env" }]` to `lib/db/tsconfig.json`.

**File:** `lib/db/tsconfig.json`  
**Verification:** lib/db now compiles correctly with proper dependency chain.

---

## Fix #7 — group-protected-attestation.test.ts Quote Regex

**Root Cause:** The test reads `GROUP_PROTECTED_BASENAMES` from `route-security-matrix.ts` using a regex `/\"([^\"]+)\"/g` that only matches double-quoted strings. Biome reformatted the source file to use single quotes, causing the regex to match 0 entries (empty set). The test then reported all 27 attested basenames as stale.

**Symptom:** Test failure: "Attestation entries no longer present in GROUP_PROTECTED_BASENAMES: changelog.ts, privacy.ts, analytics.ts, ..."

**Fix Applied:** Updated regex to match both single and double quotes:
```
/["']([^'"]+)["']/g  →  /['"]([^'"]+)['"]/g
```

**File:** `artifacts/api-server/src/routes/__tests__/group-protected-attestation.test.ts:51`  
**Verification:** Running with updated regex, all 27 entries correctly parsed from GROUP_PROTECTED_BASENAMES.

---

## Fix #8 — vite.config.ts buildWorkspaceAliases (packages/ scan)

**Root Cause:** The `buildWorkspaceAliases()` function in two vite configs only scanned `lib/` for workspace package aliases. Packages in `packages/` (including `@szl-holdings/auth-shared`, `@szl-holdings/env`, `@szl-holdings/contracts`) were not aliased, causing Vite pre-transform errors when web artifacts tried to resolve them.

**Fix Applied:** Refactored both vite configs to use a shared `scanDirForAliases(rootDir, aliases)` helper that is called for both `lib/` and `packages/`.

**Files:** `artifacts/szl-holdings/vite.config.ts`, `artifacts/pulse/vite.config.ts`  
**Verification:** Vite no longer logs pre-transform errors for `@szl-holdings/auth-shared/client` in szl-holdings and pulse artifacts.

---

## Fix #9 — Manual Workspace Package Symlinks

**Root Cause:** After biome auto-fix caused the `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF` error (pnpm's hoist settings mismatch), `pnpm install` refused to recreate the modules directory in non-TTY mode. Three workspace packages that should have been symlinked were missing:
- `@szl-holdings/contracts` — missing from `artifacts/api-server/node_modules/@szl-holdings/`
- `@szl-holdings/auth-shared` — missing from all 16 artifact node_modules
- `@szl-holdings/env` — missing from all 16 artifact node_modules

**Symptom:** `api-test` failed with "Cannot find package '@szl-holdings/contracts/common'" (180 failures). Web artifacts showed "Failed to resolve import '@szl-holdings/auth-shared/client'" in Vite logs.

**Fix Applied:** Created manual symlinks:
```
ln -sfn /home/runner/workspace/packages/{contracts,auth-shared,env} \
  artifacts/*/node_modules/@szl-holdings/
```

**Files:** All 16 `artifacts/*/node_modules/@szl-holdings/` directories  
**Verification:** api-test reduced from 180 failures → 12 failures after contracts was linked. auth-shared Vite errors resolved for all artifacts.

---

## Fixes Not Applied This Pass (Documented)

| Issue | Reason Not Fixed |
|-------|-----------------|
| `lib/services` adapter `override` modifiers | ~15+ files need manual override keyword additions; would require thorough class hierarchy review to avoid regressions |
| Python `structlog`/`pytest` missing | Requires Nix environment configuration; outside scope of JS/TS cleanup pass |
| `tenantScope` middleware 500 vs 403 | Pre-existing bug requiring security-sensitive middleware review |
| Drizzle DB migrations not run | Requires DBA coordination; development DB needs migration for new tables |
| `tsx` spawn ENOENT in test | The binary exists at root node_modules/.bin/tsx but fails to spawn in test context; likely a PATH issue in the test environment |
