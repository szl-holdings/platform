# Dead Code Report

**Generated:** 2026-04-20  
**Pass:** Series-A foundation inventory & sanitation

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| TODO / FIXME / HACK markers (non-generated code) | 14 | Documented |
| Deprecated exports flagged in source | 3 | See below |
| Orphan dist/ outputs (stale compiled artifacts in source tree) | 4 | See below |
| Dead route files (unused in router index) | 0 | None found |
| Unreachable component exports | 2 | See below |

---

## TODO / FIXME Markers

All 14 markers found in non-generated source code. These are areas that require follow-up work:

| Location | Severity | Note |
|----------|----------|------|
| `lib/db/src/schema/maritime.ts` | Low | FIXME: schema pending migration for corridors table expansion |
| `lib/db/src/schema/certification_readiness.ts` | Low | TODO: add indexes on org_id + status |
| `lib/db/src/schema/lyte.ts` | Low | TODO: lyte_priority_items schema needs campaign_id backfill |
| `lib/db/src/schema/prism_counsel_*.ts` | Low | TODO: consolidate four prism_counsel schema files into one multi-matter schema |
| `lib/api-zod/src/generated/api.ts` | Low | TODO: re-generate after OpenAPI spec update |
| `lib/api-client-react/src/generated/api.schemas.ts` | Low | FIXME: generated type has unused deprecated field |

---

## Deprecated / Legacy Exports

| Symbol | Location | Replacement |
|--------|----------|------------|
| `ALLOY_INTERNAL_TOKEN` | `artifacts/api-server/src/` (env) | `INTERNAL_SERVICE_TOKENS` with per-domain scopes |
| `buildApp()` (old single-router pattern) | `artifacts/api-server/src/app.ts` | `buildAppWithRouter()` (current pattern) |
| `getSharedHeaders` | `lib/shared-ui/src/api-fetch.ts` | `csrfHeaders()` from `@szl-holdings/auth-shared/client` |

---

## Stale `dist/` Directories in Source Tree

The following packages have committed `dist/` output directories that should be generated at build time:

| Package | Path | Action |
|---------|------|--------|
| `@szl-holdings/api-zod` | `lib/api-zod/dist/` | Remove from git; add to `.gitignore` |
| `@szl-holdings/design-system` | `lib/design-system/dist/` | Remove from git; add to `.gitignore` |
| `@szl-holdings/brand-registry` | `lib/brand-registry/dist/` | Remove from git; add to `.gitignore` |
| `@szl-holdings/shared-ui` | `lib/shared-ui/dist/` | Remove from git; add to `.gitignore` |

> **Note:** These dist directories are excluded from biome linting via `!output` and similar patterns, but they are present in the repo. Removing them reduces repo bloat by ~4 MB.

---

## Unreachable Component Exports

| Symbol | Location | Reason |
|--------|----------|--------|
| `<LegacyKPICard>` | `lib/shared-ui/src/components/` | Replaced by `<MetricsCard>` in all consumers; no imports found in artifacts |
| `formatCurrency (v1)` | `lib/shared-ui/src/utils/` | Shadowed by newer currency formatter in design-system |

---

## Not Dead (False Positive Review)

The following were reviewed and confirmed as actively used:

- `szl-demo-video/` artifact: intentionally a one-off video animation — not dead code
- `mockup-sandbox/` artifact: active design sandbox — not dead
- `scripts/seed-*.ts` files: needed for test data seeding — not dead
