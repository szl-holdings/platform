# SZL Holdings — Redundancy Cleanup Register

**Date:** April 22, 2026

---

## Dead Artifacts (Archive/Delete)

| Path | Size | Reason | Action |
|------|------|--------|--------|
| `artifacts/cortex-mobile/` | 260K | Superseded by `szl-holdings-mobile` | Archive |
| `artifacts/imperium/` | 7.5M | Cloud sovereignty — archived per Task #920 | Archive |
| `artifacts/prism-counsel/` | 9.2M | Superseded by `counsel` — legacy API routes retained in api-server | Archive |

## Dead CI Workflows

| File | Reason | Action |
|------|--------|--------|
| `.github/workflows/prism-counsel-ci.yml` | References archived artifact | Remove |

## Root File Clutter

| File | Issue | Action |
|------|-------|--------|
| `ARCHITECTURE.md` | Superseded by `docs/architecture/architecture.md` | Remove |
| `PRODUCT-SURFACES.md` | Superseded by `docs/PRODUCT_MATRIX.md` | Remove |
| `uv.lock` | No Python runtime services (Python used only in build/marketing scripts) | Remove |

## Duplicate Documentation Patterns

| Original | Duplicate/Superseded | Action |
|----------|---------------------|--------|
| `docs/architecture/architecture.md` | `ARCHITECTURE.md` (root) | Remove root copy |
| `docs/trust/trust-center.md` | Various trust references | Canonical is `docs/trust/` |
| `docs/APP_STATUS.md` | `docs/audit/app-maturity-matrix.md` | Verify consistency |
| `docs/platform-facts.md` | Various metric claims | platform-facts is authoritative |

## Dead README References

| Reference | Location | Issue | Action |
|-----------|----------|-------|--------|
| `artifacts/firestorm/` | README.md portfolio table | Directory does not exist | Remove reference |
| PARAGON brand name | README.md portfolio table | Maps to Aegis artifact — verify intentional | Clarify or update |

## Stale Environment Variables

Of 261 unique env vars referenced in api-server, the following patterns suggest dead references:

| Pattern | Concern |
|---------|---------|
| `FIRESTORM_*` | No firestorm artifact |
| `PRISM_*` (some) | PRISM superseded by Counsel — check if still needed |

## Schema/Table Orphans

| Concern | Count | Action |
|---------|-------|--------|
| Schema definitions without live tables | ~352 | Audit — many are Drizzle `relations()`, not real tables |
| Migration statements that always fail | ~12 | Fix ordering in Task #2886 |

## Unused Packages (Candidates — Verify Before Removing)

Further analysis needed on these `packages/` directories for actual import usage:

| Package | Concern |
|---------|---------|
| `packages/openusd-export` | Niche — verify usage |
| `packages/nvidia-adapters` | Verify active integration |
| `packages/atlassian-connect` | Verify active integration |

---

## Priority Actions

1. **Remove dead artifacts** (cortex-mobile, imperium, prism-counsel) — 17MB recovered
2. **Remove `prism-counsel-ci.yml`** — dead workflow
3. **Remove root `ARCHITECTURE.md`** — superseded
4. **Fix README `firestorm/` reference** — broken link
5. **Run `pnpm metrics:generate`** — refresh platform facts from current state
