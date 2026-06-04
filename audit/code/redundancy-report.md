# Redundancy Report

**Generated:** 2026-04-20  
**Pass:** Series-A foundation inventory & sanitation

---

## Summary

This report identifies duplicated patterns, copy-pasted logic, and structural redundancy across the monorepo.

---

## 1. buildWorkspaceAliases — Duplicated Vite Alias Builder

**Severity:** High (causes divergent behavior)

The `buildWorkspaceAliases()` function was copy-pasted into two vite configs with subtle differences:

| File | Status |
|------|--------|
| `artifacts/szl-holdings/vite.config.ts` | **Fixed in this pass** — refactored to `scanDirForAliases()` helper, now also scans `packages/` |
| `artifacts/pulse/vite.config.ts` | **Fixed in this pass** — same refactor applied |

**Remaining:** ~9 other artifacts use a simpler alias approach (no `buildWorkspaceAliases`). When `packages/` workspace packages are needed, they need the same alias pattern. A shared `vite-workspace-aliases` utility in `packages/` would eliminate this entirely.

---

## 2. sharedProxyPlugin — Copy-Pasted Across Every Vite Config

**Severity:** Medium

Every web artifact vite.config.ts contains a copy of the same `sharedProxyPlugin()` function (a mini reverse-proxy). Each copy is ~40-70 lines of inline code. There are ~9 duplicates.

**Fix:** Extract to `packages/vite-plugins/proxy.ts` and import it. Not done in this pass; tracked for Series-A infrastructure phase.

---

## 3. rootRedirectPlugin — Copied Across Multiple Configs

**Severity:** Low

The `rootRedirectPlugin()` (redirects bare `/` to the artifact's basePath) is duplicated in:
- `artifacts/sentra/vite.config.ts`
- `artifacts/counsel/vite.config.ts`
- `artifacts/pulse/vite.config.ts`
- `artifacts/terra/vite.config.ts`
- (and others)

Same fix as above — should be extracted to a shared vite plugin package.

---

## 4. Prism Counsel Schema — 4 Near-Identical Files

**Severity:** Medium

The following schema files are near-identical, varying only by `_s31 / _pilot / _ny / _ops` suffix on table names:

- `lib/db/src/schema/prism_counsel_s31.ts`
- `lib/db/src/schema/prism_counsel_pilot.ts`
- `lib/db/src/schema/prism_counsel_ny.ts`
- `lib/db/src/schema/prism_counsel_ops.ts`

**Fix:** Parameterize table prefix with a factory function. Not done in this pass.

---

## 5. Shared-Contracts vs. Contracts — Semantic Overlap

**Severity:** High

Two packages serve overlapping roles:

| Package | Location | Exports |
|---------|----------|---------|
| `@szl-holdings/contracts` | `packages/contracts/` | Zod schemas + TS types for API I/O |
| `@szl-holdings/shared-contracts` | `packages/shared-contracts/` | Shared domain event types |

There is semantic bleed between these two. `bodyShape()` (from contracts/common) is used by 20+ route files. Consumers should be using `shared-contracts` for inter-service contracts. A consolidation plan is needed.

---

## 6. Duplicate Auth Token Mechanisms

**Severity:** High

Two parallel auth mechanisms exist:

| Mechanism | Source | Status |
|-----------|--------|--------|
| `ALLOY_INTERNAL_TOKEN` | Legacy env var | DEPRECATED (emits WARN at startup) |
| `INTERNAL_SERVICE_TOKENS` | Scoped per-domain tokens | Current |

Both are accepted by the internal token middleware, creating ambiguity. `ALLOY_INTERNAL_TOKEN` should be removed after all callers migrate.

---

## 7. CSRF Headers Duplication

**Severity:** Low

`csrfHeaders()` is imported from `@szl-holdings/auth-shared/client` in `lib/shared-ui/src/api-fetch.ts`. However, several artifacts also inline their own CSRF header logic in their local fetch wrappers. These should all defer to the shared-ui `apiFetch()` helper.

---

## Deduplication Progress This Pass

| Item | Action |
|------|--------|
| `buildWorkspaceAliases` (szl-holdings + pulse) | Refactored to `scanDirForAliases` helper + `packages/` scan added |
| Biome auto-fix across 4,397 files | Applied — consistent formatting now enforced |
| Proxy-routes regex (shared-proxy + health-proxy) | Fixed quote-matching regex to handle both `'` and `"` |
