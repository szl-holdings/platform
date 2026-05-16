# Dependency & Script Drift Catalog

**Date:** 2026-04-27
**Scope:** Drift between declared package.json scripts and actual behavior; unregistered/orphan artifacts; package count drift; stale references
**Evidence:** `generated/platform-metrics.json` (2026-04-27), build outputs, directory inspection

---

## Summary

| Category | Items Found |
|----------|------------|
| Stale metric counts in docs | 3 documents with outdated package/artifact counts (all fixed in this audit) |
| Unregistered on-disk artifacts | 1 (artifacts/audit evidence dir) — conduit registered; helios folded into A11oy (#4364); pluginmesh removed (#4897) |
| Scripts declared but not reliably runnable | 4 (typecheck, lint, build, test — all currently fail) |
| Deprecated artifact references in docs | 2 (CORTEX Mobile, prism-counsel CI workflow) |
| Brand/name drift (Alloy vs A11oy) | 1 document (PLATFORM_OVERVIEW.md — fixed in this audit) |

---

## 1. Package Count Drift

| Source | Value | Date | Notes |
|--------|-------|------|-------|
| `README.md` "Platform Scale" | 100 packages | Stale (no date) | Significantly understates current state |
| `docs/platform-facts.md` | 123 packages (82 standalone + 41 lib) | 2026-04-20 | Stale; does not match current metrics |
| `generated/platform-metrics.json` (prior) | 123 packages | 2026-04-22 | Superseded |
| `generated/platform-metrics.json` (current) | **152 packages** (101 standalone + 51 lib) | **2026-04-27** | Source of truth |

**Action required:** Update README.md and docs/platform-facts.md to reflect 152 packages.

---

## 2. Artifact Count Drift

| Source | Value | Notes |
|--------|-------|-------|
| `README.md` "Platform Scale" (prior) | 14 | Stale — **since updated to 14 registered artifacts (canonical)** |
| `docs/platform-facts.md` | 14 registered / 20 total | Includes archived |
| `generated/platform-metrics.json` (2026-04-27T03:50:50Z) | **19** artifact directories on disk | Includes 4 unregistered |
| Workflow manager | 17 artifact workflows | conduit now registered; pluginmesh removed (#4897) |
| Workspace artifact registry snapshot | **14 registered** | Canonical for deployment purposes |

**Action required:** Only `artifacts/audit` (an evidence directory mistakenly counted as an artifact by the metrics script) remains — update metrics script to exclude it. `conduit` is now formally registered. `helios` was folded into A11oy (task #4364). `pluginmesh` was removed from the monorepo (task #4897). README correctly says 14 registered artifacts.

---

## 3. Unregistered On-Disk Artifact Directories

These directories exist under `artifacts/` but are not in the canonical artifact registry snapshot (14 registered artifacts):

| Directory | Package Name | Kind | Workflow? | Build Status | Disposition Recommendation |
|-----------|-------------|------|-----------|--------------|---------------------------|
| ~~`artifacts/helios`~~ | ~~`@workspace/helios`~~ | web | — | **RESOLVED** | Folded into A11oy Frontier Intelligence section (task #4364). Surfaces at `pages/frontier/`; API routes at `routes/helios/`. |
| ~~`artifacts/pluginmesh`~~ | ~~`@workspace/pluginmesh`~~ | web | — | **RESOLVED** | Directory removed from monorepo and proxy route deleted from `packages/shared-proxy/src/index.ts` (task #4897). |
| ~~`artifacts/conduit`~~ | `@workspace/conduit` | web | Registered | OK | **RESOLVED** — now in the canonical artifact registry. |

---

## 4. Scripts Declared vs. Actual Behavior

### P0 Scripts (Core Pipeline) — Current Status

| Script | Declaration | Actual Result (2026-04-27) | Drift |
|--------|-------------|---------------------------|-------|
| `pnpm run typecheck` | `turbo run typecheck` | **FAIL** — 9 packages fail: `aef-sdk`, `reflection-engine`, `aef-storage-adapters`, `alloy-rank-worker`, `alloy-embed-worker`, `aef-retrieval-core`, `aef-policy-guard`, `@szl-holdings/db`, `api-client-react` (confirmed 2026-04-27) | YES |
| `pnpm run lint` | `biome lint .` | **FAIL** — 23 errors, 15,060 warnings | YES |
| `pnpm run build` | `turbo run build` | **FAIL** — `@szl-holdings/sdk` TS errors cascade to 10 packages | YES |
| `pnpm run test` | `turbo run test` | **FAIL** — api-server governance tests fail (4 failures: `governance-restart-process`, `governance-editor-attribution`, `governance-persistence` ×2); root cause: `billing_audit_log` relation missing | YES |

### SDK Build Failure Detail

`packages/szl-sdk/src/resources/plugins.ts` and `treasury.ts` have TypeScript errors:
- `PaginationOptions & { ... }` not assignable to `Record<string, string | number | boolean | undefined>`
- Missing index signature

This single SDK error cascades to: `@workspace/a11oy`, `@workspace/szl-holdings-mobile`, `@workspace/storybook`, `@workspace/szl-demo-video`, `@szl/alloy`, `@workspace/alloy-ingestion-orchestrator`, `@szl/substrate`. (`@workspace/helios` removed — folded into A11oy, task #4364. `@workspace/pluginmesh` removed from monorepo, task #4897.)

### P1 Scripts (Advisory) — Known Issues

| Script | Declaration | Known Issues |
|--------|-------------|-------------|
| `pnpm run qa:site` | Routes + links + trust + meta + empty-states + og | Not run this audit; references server that may not be running |
| `pnpm run audit:mocks` | Audit mock usage | Not run this audit |
| `pnpm metrics:generate` | Declared in root package.json | Points to `tsx scripts/generate-platform-metrics.ts` (root-level); the diligence audit runner also uses `scripts/audit/generate-platform-metrics.ts` (subdirectory) — see Section 7 for path inconsistency detail |

### Scripts in package.json That Reference Removed/Archived Artifacts

| Script | References | Status |
|--------|-----------|--------|
| `pnpm run audit:operational` | Runs `ops/audit/smoke.mjs`, `url-audit.mjs`, `stress.mjs` | These scripts target live URLs and require a running server; not a CI-safe operation |
| Various `seed:atlas:*` scripts | Reference `@workspace/scripts` filter | Works if scripts package is present |

---

## 5. Deprecated Artifact References in Documentation

| Document | Reference | Issue |
|----------|-----------|-------|
| `docs/OPERABILITY_MATRIX.md` | "CORTEX Mobile" in Mobile table | `cortex-mobile` is an archived artifact; the current mobile artifact is `szl-holdings-mobile` (APEX) |
| Implied by FIX_LOG.md | `prism-counsel-ci.yml` CI workflow references archived artifact | CI workflow should be removed or updated |
| `docs/EXECUTIVE_AUDIT_SUMMARY.md` | "19 on-disk artifact directories; 15 registered" | Updated in this audit; prior version cited 17 (an earlier metrics run that did not pick up conduit) |

---

## 6. Brand/Name Drift

| Document | Stale Name | Current Name | Action |
|----------|-----------|--------------|--------|
| `docs/PLATFORM_OVERVIEW.md` | "Alloy" (execution fabric) | "A11oy" | Update document |
| Some older docs in `docs/` | "FORGE" (unified command) | "Command Portal" or `artifacts/command` | Audit older references |
| `docs/platform-facts.md` | "Counsel" listed as "PRISM" | "Counsel" is current name | Verify all references |

---

## 7. Metrics Script Path Inconsistency

| Script Alias | Declared | Points To | Notes |
|-------------|----------|-----------|-------|
| `pnpm metrics:generate` | YES | `tsx scripts/generate-platform-metrics.ts` (root-level) | Root-level script; potentially diverged from audit subdirectory script |
| `pnpm audit:full` | YES | `node --experimental-vm-modules scripts/audit-full.js` | Full pipeline harness |
| `pnpm audit:full:fast` | YES | Same with `--skip-install --skip-e2e` | Fast variant (skips install and E2E) |
| `pnpm audit:all` | YES | `pnpm audit:mocks && audit:routes && audit:copy && audit:deps && audit:design-system && audit:broken-links && audit:smoke && audit:crawl && audit:stress` | Advisory P1 audits only — not a full P0 pipeline check |
| `pnpm audit:series-a` | YES | brand:check + typecheck + test + audit:mocks + audit:routes + audit:deps + audit:copy + security:audit + smoke:product-mode + build | Investor-grade release check |

**Finding:** `metrics:generate` points to `scripts/generate-platform-metrics.ts` (root) but the diligence audit runs `scripts/audit/generate-platform-metrics.ts` (subdirectory). Both write to `generated/platform-metrics.json`. Verify both scripts produce identical output; consolidate to one canonical script.

**Correction from initial finding:** `pnpm audit:all` IS declared — it runs the P1 advisory audit suite. It is distinct from `pnpm audit:full` which runs the full P0+P1 pipeline. Use `audit:full` or `audit:series-a` for P0 pipeline coverage; use `audit:all` for advisory checks only.

---

## Remediation Priority

| Item | Priority | Effort |
|------|----------|--------|
| Fix `@szl-holdings/sdk` TypeScript errors | **P0** | Low — type annotation fix |
| Fix 9-package typecheck failures (`aef-sdk`, `reflection-engine`, `aef-storage-adapters`, `alloy-rank-worker`, `alloy-embed-worker`, `aef-retrieval-core`, `aef-policy-guard`, `@szl-holdings/db`, `api-client-react`) | **P0** | Medium |
| Consolidate `metrics:generate` script — root `scripts/generate-platform-metrics.ts` and `scripts/audit/generate-platform-metrics.ts` (subdirectory) both exist; verify they produce identical output and consolidate | **P1** | Low |
| ~~Update README package/artifact counts~~ | ~~P1~~ | **Fixed in this audit** |
| ~~Register or archive `conduit`, `helios`, and `pluginmesh`~~; update metrics script to exclude `artifacts/audit` evidence dir from artifact count | **P1** | Low | (artifact dispositions complete: conduit registered, helios folded into A11oy #4364, pluginmesh removed #4897) |
| ~~Update `PLATFORM_OVERVIEW.md` Alloy → A11oy~~ | ~~P1~~ | **Fixed in this audit** |
| ~~Update `OPERABILITY_MATRIX.md` CORTEX Mobile → szl-holdings-mobile~~ | ~~P1~~ | **Fixed in this audit** |

---

*Generated by diligence audit task #3206 — 2026-04-27.*
