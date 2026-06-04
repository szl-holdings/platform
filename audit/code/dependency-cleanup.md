# Dependency Cleanup Report

**Generated:** 2026-04-20  
**Pass:** Series-A foundation inventory & sanitation

---

## Canonicalization Actions Taken This Pass

| Action | Before | After |
|--------|--------|-------|
| Lockfile enforcement | Mixed (potential yarn.lock remnants) | pnpm-lock.yaml only; preinstall script blocks non-pnpm installs |
| Biome formatting | Inconsistent quotes/spacing across 4,397+ files | Uniform (single quotes, 2-space indent) after biome auto-fix |
| tsconfig references | Root tsconfig missing 7 package references | Added: env, auth-shared, brand-registry, design-system, db, contracts, shared-contracts |
| `packages/env/tsconfig.json` | Missing `composite: true` | Fixed |
| `lib/db/tsconfig.json` | Missing `references` array | Fixed |
| Workspace packages not symlinked | `@szl-holdings/contracts`, `@szl-holdings/auth-shared`, `@szl-holdings/env` not in artifact node_modules | Manually symlinked into all 16 artifact node_modules directories |
| Vite alias builder | `buildWorkspaceAliases()` only scanned `lib/`, missing `packages/` | Fixed in szl-holdings and pulse vite.config.ts |

---

## Dependency Health by Category

### Root-Level Workspace Packages (pnpm-workspace.yaml)

All four glob patterns are present and correct:

```yaml
packages:
  - artifacts/*
  - lib/*
  - packages/*
  - apps/*
  - workers/*
  - services/*
  - scripts
```

### Package Version Pinning

| Package | Current | Notes |
|---------|---------|-------|
| React | 19.1.0 | Latest stable; consistent across all artifacts |
| TypeScript | 5.9.2 | Consistent across workspace |
| Vite | 7.3.2 | Consistent across web artifacts |
| Drizzle ORM | 0.45.2 | Consistent |
| Biome | 2.4.12 | Enforced in root biome.json |
| Vitest | 4.1.2 | Consistent |
| Tailwind CSS | 4.x (new engine) | No config file; CSS-first approach |

### Packages with `workspace:*` Dependencies Not Yet Resolved by pnpm

The following packages declared as `workspace:*` deps were not automatically symlinked by pnpm due to `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF`. Manual symlinks were created as a workaround:

| Missing Symlink | Fixed Artifacts |
|-----------------|-----------------|
| `@szl-holdings/contracts` | api-server (and 15 others) |
| `@szl-holdings/auth-shared` | All 16 artifact node_modules |
| `@szl-holdings/env` | All 16 artifact node_modules |

**Root Cause:** The `ERR_PNPM_PUBLIC_HOIST_PATTERN_DIFF` error indicates the modules directory was created with different hoist settings than the current `.npmrc`. Running `pnpm install` in a proper TTY (or CI environment with `CI=true`) will re-hoist all packages correctly. The manual symlinks are a development-environment stop-gap.

---

## Packages to Remove or Migrate

| Package | Action | Rationale |
|---------|--------|-----------|
| `ALLOY_INTERNAL_TOKEN` env var | Remove after migration | Deprecated; replaced by `INTERNAL_SERVICE_TOKENS` |
| `lib/api-zod/dist/` | Remove from git tracking | Generated artifact; should be .gitignore'd |
| Duplicate `prism_counsel_*.ts` schema files | Consolidate | 4 near-identical files (see redundancy report) |

---

## Missing External Dependencies (Pre-existing)

| Dependency | Required By | Status |
|-----------|-------------|--------|
| `structlog` (Python) | `services/lyte-metrics-store` | Not installed in Nix environment; requires nix/pip configuration |
| `pytest` (Python) | `services/lyte-metrics-store`, `services/substrate-py-workers` | Not installed; same environment issue |
| `react-native-worklets-core` | `artifacts/szl-holdings-mobile` | Listed in package.json but not resolvable in Expo Go environment |

---

## Dev Dependency Audit

### Dependencies That Should Be devDependencies

No major misclassifications found. Most heavy packages (TypeScript, Vite, Tailwind, Biome) are correctly in `devDependencies`.

### Unused Direct Dependencies (sampled)

Not fully enumerated in this pass. A `knip` or `depcheck` run is recommended in the next phase.
