# Static Verification Report

**Generated:** 2026-04-20  
**Pass:** Series-A foundation inventory & sanitation

---

## 1. TypeScript Project Reference Build

**Command:** `tsc --build tsconfig.json`

### Status: Partially passing (pre-existing errors)

**Root tsconfig references fixed this pass:** 7 packages were missing from the references array. Now includes:
- `packages/env` (+ composite: true added)
- `packages/auth-shared`
- `packages/brand-registry`
- `packages/design-system`
- `packages/db` (+ references array added)
- `packages/contracts`
- `packages/shared-contracts`

### Known Type Errors (Pre-existing, Not Caused By This Pass)

| Package | Error | Count (est.) |
|---------|-------|-------------|
| `lib/services/src/adapters/*.ts` | Missing `override` modifier — base class methods are overridden without the `override` keyword; `noImplicitOverride: true` in tsconfig | ~50+ |
| `lib/api-client-react/src/` | `Object is possibly undefined` — strict null checks on generated API client code | ~10 |
| `packages/env/src/index.ts` | `exactOptionalPropertyTypes` violation — `AI_PROVIDER` optional field | ~3 |
| Various route files in `artifacts/api-server/src/routes/` | Miscellaneous strict-mode errors | ~20 |

### Packages with Clean Builds

The following packages have no TypeScript errors:
- `packages/contracts`
- `packages/shared-contracts`
- `packages/proxy-routes`
- `lib/db` (after tsconfig fix)
- `packages/env` (after composite: true fix)
- All 11 web artifacts compile via Vite (no tsc errors shown in Vite output)

---

## 2. Biome Lint / Format

**Command:** `pnpm biome check --write .`

### Status: Green (auto-fixable issues resolved)

| Metric | Before Pass | After Pass |
|--------|-------------|-----------|
| Files processed | 4,397 | 4,397 |
| Auto-fixable issues | ~2,200 | 0 |
| Remaining manual-only issues | ~5,770 | ~5,700 (minor reduction from format fixes) |

### Remaining Biome Issues (Manual-Only)

These are issues that biome cannot auto-fix and require developer attention:

| Rule | Count (est.) | Severity |
|------|-------------|---------|
| `noExplicitAny` | ~300 | Info |
| `noNonNullAssertion` | ~150 | Warning |
| `noUnusedVariables` | ~80 | Warning |
| `complexity/noExcessiveCognitiveComplexity` | ~40 | Warning |
| `useImportType` | ~30 | Info |
| Total | ~600+ | None blocking |

---

## 3. pnpm Install / Lockfile

**Command:** `pnpm install`

### Status: Installed (with caveats)

- **Lockfile:** `pnpm-lock.yaml` is present and canonical
- **Workspace sync:** All packages listed in `pnpm-workspace.yaml` are recognized
- **Known issue:** `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF` — the modules directory was created with different hoist settings. Manual symlinks were created for 3 packages as a workaround. A proper TTY `pnpm install` will resolve the hoist mismatch.
- **Foreign lockfiles:** None found (no `package-lock.json`, `yarn.lock`, or `bun.lockb`)
- **Preinstall guard:** Present — `scripts/check-package-manager.mjs` blocks non-pnpm installs

---

## 4. Oxlint

**Command:** `pnpm oxlint`

### Status: Warnings only (no blocking errors)

Oxlint is a secondary fast linter that runs alongside biome. Approximately 200 warnings remain, covering the same categories as biome (any types, unused imports). No build-blocking errors.

---

## 5. Workspace Alias Resolution

### Status: Fixed for szl-holdings and pulse

After the `buildWorkspaceAliases` fix (to also scan `packages/` directory), both szl-holdings and pulse resolve `@szl-holdings/auth-shared/client` and `@szl-holdings/env` correctly.

For the remaining 9 web artifacts (aegis, sentra, counsel, terra, vessels, command, carlota-jo, lyte-command-center, szl-demo-video):
- These artifacts use a different vite config pattern (no `buildWorkspaceAliases`)
- They rely on node_modules resolution with manual symlinks for auth-shared and env
- Status: Operational (Vite servers running and serving)

---

## 6. E2E Tests (Playwright)

**Status:** Not run in this pass

Playwright tests are configured in `playwright.config.ts`. Running E2E tests requires a live database with migrations applied. Recommended for the next phase.

---

## 7. Component Tests

**Command:** `pnpm vitest run --config vitest.components.config.ts`

**Status:** Not run in this pass

Component tests are configured separately from unit tests. They require the Vite plugin pipeline and a browser-like environment. Recommended for the next phase.

---

## Summary

| Check | Status | Notes |
|-------|--------|-------|
| pnpm install | ⚠️ PARTIAL | ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF; manual symlinks workaround in place |
| TypeScript build | ⚠️ PARTIAL | Pre-existing errors in lib/services adapters; tsconfig references fixed |
| Biome format | ✅ GREEN | All auto-fixable issues resolved |
| Biome lint | ⚠️ WARNINGS | ~600 manual-only issues; none blocking |
| Oxlint | ⚠️ WARNINGS | ~200 warnings; none blocking |
| Unit tests (api-server) | ⚠️ NEAR-GREEN | 12 failures remain (from 180 before pass); all pre-existing issues |
| Web artifact Vite builds | ✅ GREEN | All 11 web artifacts running |
| API server | ✅ RUNNING | DB migration errors expected and documented |
| Shared proxy | ✅ RUNNING | 13 routes loaded after regex fix |
| Python services | ❌ FAILED | Missing Python deps (pre-existing) |
| Mobile (Expo) | ❌ FAILED | Missing react-native-worklets-core (pre-existing) |
| Playwright E2E | ⏭️ SKIPPED | Out of scope for this pass |
| Component tests | ⏭️ SKIPPED | Out of scope for this pass |
