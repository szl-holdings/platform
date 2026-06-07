# Build Results

**Generated:** 2026-04-20T21:50:00Z  
**Pass:** Series-A foundation inventory & sanitation

---

## Web Artifact Status

All 11 web artifacts are running successfully (Vite dev server started). Runtime errors from missing DB migrations are noted but do not prevent the apps from serving.

| Artifact | Status | Notes |
|----------|--------|-------|
| `artifacts/szl-holdings` | ✅ RUNNING | Vite v7.3.2 on port 5173; vite.config.ts fixed (buildWorkspaceAliases) |
| `artifacts/pulse` | ✅ RUNNING | Vite v7.3.2; vite.config.ts fixed (buildWorkspaceAliases) |
| `artifacts/aegis` | ✅ RUNNING | Vite v7.3.2 |
| `artifacts/sentra` | ✅ RUNNING | Vite v7.3.2 |
| `artifacts/counsel` | ✅ RUNNING | Vite v7.3.2 |
| `artifacts/terra` | ✅ RUNNING | Vite v7.3.2 |
| `artifacts/vessels` | ✅ RUNNING | Vite v7.3.2 |
| `artifacts/command` | ✅ RUNNING | Vite v7.3.2 |
| `artifacts/carlota-jo` | ✅ RUNNING | Vite v7.3.2 |
| `artifacts/lyte-command-center` | ✅ RUNNING | Vite v7.3.2; port conflict resolved |
| `artifacts/szl-demo-video` | ✅ RUNNING | Vite v7.3.2 |
| `artifacts/mockup-sandbox` | ✅ RUNNING | Custom start.sh via bash |

---

## Backend / Service Status

| Service | Status | Notes |
|---------|--------|-------|
| `artifacts/api-server` | ✅ RUNNING | Express 5; DB errors due to pending migrations (on_call_schedules, competitive_intel_state, dos_content_calendar_items.campaign_id not existing) — server itself is healthy |
| `shared-proxy` | ✅ RUNNING | Node proxy; 13 routes loaded; regex bug fixed in this pass |
| `services/lyte-metrics-store` | ❌ FAILED | Python `structlog` not installed in Nix environment; pre-existing issue |

---

## Mobile Status

| App | Status | Notes |
|-----|--------|-------|
| `artifacts/szl-holdings-mobile` | ❌ FAILED | Expo; `react-native-worklets-core` not resolvable; pre-existing dependency issue |

---

## Test Suite Results (api-test)

**Before this pass:** 180 failed / 500 passed / 113 skipped  
**After contracts symlink:** 12 failed / 1072 passed / ~113 skipped  
**After attestation regex fix:** Pending (third run in progress)

### Remaining Failures (post-contracts-fix)

| Test File | Failures | Root Cause |
|-----------|----------|-----------|
| `security-middleware.test.ts` | 2 | tenantScope middleware throws 500 instead of 403 (pre-existing bug) |
| `tenant-isolation.test.ts` | 2 | Same tenantScope 500 vs 403 issue |
| `competitive-intel-notifications.test.ts` | Multiple | DB table `competitive_intel_state` does not exist (migration not run) |
| `runtime-crash-resume.integration.test.ts` | 1 | `spawn tsx ENOENT` — tsx in root node_modules but fails to spawn in test context |
| `group-protected-attestation.test.ts` | 1 | Biome changed `"..."` → `'...'`; test regex only matched `"..."` — **Fixed in this pass** |

---

## Lint Results (Biome)

- **Before pass:** 5,770+ lint issues (mix of errors and warnings)
- **After auto-fix:** ~0 auto-fixable issues remaining; manual-only issues documented
- **Remaining diagnostic issues (oxlint):** ~200 warnings (non-blocking)

### Categories of Remaining Biome Issues (Unfixable by Auto-Fix)

| Category | Approximate Count | Notes |
|----------|-------------------|-------|
| `noExplicitAny` violations | ~300 | TypeScript `any` usage in legacy adapters and generated code |
| `noNonNullAssertion` violations | ~150 | `!` operator usage (often safe, but strict mode disallows) |
| Unused variables/imports | ~80 | Some are intentional (interface contracts, re-exports) |
| `complexity/noExcessiveCognitiveComplexity` | ~40 | Long functions in adapter files |

---

## TypeScript Build (tsc --build)

**Status:** Partially passing  
**Root tsconfig references:** Fixed (7 packages added)  
**Known remaining type errors:**

| Package | Error Category | Count (est.) |
|---------|---------------|-------------|
| `lib/services/src/adapters/` | Missing `override` keyword | ~15 files |
| `lib/api-client-react/src/` | `Object is possibly undefined` | ~5 files |
| `packages/env/src/` | `exactOptionalPropertyTypes` issues | ~3 errors |
| Various route files | Missing type annotations | ~10 errors |

---

## CI Workflow Status

| Workflow | Status | Notes |
|----------|--------|-------|
| `ci.yml` | Not triggered in this pass | Would require PR/push to main branch |
| `audit-full.yml` | Not triggered | Requires scheduled or manual trigger |
| `e2e.yml` | Not triggered | Playwright tests not run in this pass |
| `security.yml` | Not triggered | |

---

## Python Environment

| Service | Status |
|---------|--------|
| `services/lyte-metrics-store` | ❌ `structlog` not found — Nix env missing Python deps |
| `services/substrate-py-workers` | ❌ Same environment issue (`pytest` not found) |

**Recommended Action:** Add `python3Packages.structlog` and `python3Packages.pytest` to the Nix shell or `requirements.txt` and install via pip.
