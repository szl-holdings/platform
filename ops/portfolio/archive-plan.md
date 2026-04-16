# Archive Plan — SZL Holdings Platform

Generated: 2026-04-16
Authority: Phase 2-3 Product Topology & Portfolio Rationalization

---

## Purpose

This document defines what to deprecate, how to archive it, and what migration or redirect steps must accompany each deprecation. No code is deleted without an explicit decision to do so in a later phase. This plan documents the intent and instructions.

**Scope:** This is a documentation plan. Execution (deregistering artifacts, adding 301 redirects, CI cleanup) is scoped to Phase 4+ operations work.

---

## Archive / Deprecation Registry

### Priority 1 — Deregister Immediately (No code value lost)

These artifacts are either already fully deprecated or are thin redirect wrappers with no unique content.

---

#### `firestorm` (Redirect Wrapper)

| Attribute | Value |
|-----------|-------|
| Directory | `artifacts/firestorm` |
| Source files | 9 ts/tsx |
| Pages | 7 |
| Classification | SECONDARY — thin wrapper |
| Blocks | Nothing — fully contained |

**Why archive:** `firestorm` is a 9-file thin entry point that routes into the Aegis domain. The full application lives in `artifacts/aegis` (164 source files, 158 pages). Running both creates brand ambiguity — investors and enterprise evaluators may not know which is the "real" product.

**Migration instructions:**
1. Add an HTTP 301 redirect: all requests to `/firestorm/*` → `/aegis/`
2. Add `DEPRECATED.md` to `artifacts/firestorm/` with redirect notice
3. Deregister the `firestorm` artifact in `artifact.toml`
4. Remove from any public documentation that lists active products (README Products table, COMPANY_FACT_SHEET.md, PRODUCT_MATRIX.md)
5. Do NOT delete the code directory — keep for historical reference

**User impact:** Zero — `firestorm` had no independent user base. Traffic goes directly to the richer Aegis application.

---

#### `prism-counsel` (Already Deprecated)

| Attribute | Value |
|-----------|-------|
| Directory | `artifacts/prism-counsel` |
| Source files | 138 ts/tsx |
| Pages | 128 |
| Classification | ARCHIVE-DEPRECATE |
| DEPRECATED.md | Exists (task #579) |
| Blocks | CI pipeline (`prism-counsel-ci.yml`) |

**Why archive:** PRISM Counsel was deprecated in task #579. It has a `DEPRECATED.md` file. However, the artifact remains registered and the CI pipeline `prism-counsel-ci.yml` continues to run against deprecated code. The README and `COMPANY_FACT_SHEET.md` still list it as "Functional alpha" — a misleading representation.

**Migration instructions:**
1. Deregister the `prism-counsel` artifact in `artifact.toml`
2. Delete `.github/workflows/prism-counsel-ci.yml` — deprecated app, stale workflow
3. Remove from README Products table
4. Remove from `COMPANY_FACT_SHEET.md` Domain Packs table
5. Remove from `docs/PRODUCT_MATRIX.md` Active Platforms section
6. Add to "Deprecated" or "Archived" note in all public documentation, OR omit entirely
7. Do NOT delete the code directory — substantial codebase (138 files); archive if PRISM Counsel is ever revived
8. Stop running the workflow — do not restart `prism-counsel-ci.yml`

**Revival path:** If a legal vertical design partner is found, PRISM Counsel can be re-entered at Stage 1 with a fresh assessment. See `ops/portfolio/domain-pack-strategy.md` for revival criteria.

**User impact:** The surface was not publicly promoted. Any internal users should be migrated to `command` for workflow management.

---

#### `stephen-site` (Already Deprecated)

| Attribute | Value |
|-----------|-------|
| Directory | `artifacts/stephen-site` |
| Source files | 60 ts/tsx |
| Pages | 37 |
| Classification | ARCHIVE-DEPRECATE |
| DEPRECATED.md | Exists (task #579) |
| Content destination | `/founder` in `szl-holdings` |

**Why archive:** Stephen Site was deprecated in task #579. Content has been migrated to the `/founder` section of `szl-holdings`. However, the artifact remains registered and the README lists it as "Live" — an actively misleading representation that undermines investor trust in the accuracy of other claims.

**Migration instructions:**
1. Deregister the `stephen-site` artifact in `artifact.toml`
2. Verify all content from `stephen-site` is present at `szl-holdings/src/pages/founder/`
3. Add permanent redirect: `/stephen-site/*` → `/founder/` (via `szl-holdings` router or nginx config)
4. Remove "Stephen Lutar — Founder Authority Site" from `docs/PRODUCT_MATRIX.md`
5. Remove from README Products table (if still present — verify)
6. Do NOT delete the code directory

**User impact:** Anyone linking to the Stephen Site should be redirected to `/founder` in `szl-holdings`. The content is richer and better integrated there.

---

### Priority 2 — Deregister After Redirect Configuration

These artifacts have merged functionality and need redirect setup before deregistration.

---

#### `lyte-command-center` (Merged into Command)

| Attribute | Value |
|-----------|-------|
| Directory | `artifacts/lyte-command-center` |
| Source files | 155 ts/tsx |
| Pages | 141 |
| Classification | SECONDARY — merged |
| Merge target | `artifacts/command` |

**Why archive:** Lyte Command Center functionality has been absorbed into `command`. Running both creates operator confusion about which surface is authoritative and wastes compute resources.

**Migration instructions:**
1. Audit `artifacts/lyte-command-center` to confirm all functionality exists in `artifacts/command`:
   - PRISM framework signal timeline → verify in `command`
   - Approval queues → verify in `command`
   - Operations workflow → verify in `command`
2. Add HTTP 301 redirect: `/lyte-command-center/*` → `/command/`
3. Update `e2e.yml` CI workflow to remove `lyte-command-center`; add `command` if not present
4. Add `DEPRECATED.md` to `artifacts/lyte-command-center/`
5. Deregister the artifact in `artifact.toml`
6. Do NOT delete the code directory — 155 source files; significant reference material

**Migration note:** "Lyte" as a brand concept (PRISM framework, the governed decision model) lives on within `command`. The `lyte-command-center` artifact is the surface being deprecated; the Lyte conceptual framework remains part of the platform narrative.

---

#### `imperium` (Merged into Command)

| Attribute | Value |
|-----------|-------|
| Directory | `artifacts/imperium` |
| Source files | 22 ts/tsx |
| Pages | 15 |
| Classification | SECONDARY — merged |
| Merge target | `artifacts/command` (infrastructure mode) |

**Why archive:** IMPERIUM has been merged into `command` as the infrastructure mode (`/command/infrastructure`). The standalone artifact is thin and no longer maintained.

**Migration instructions:**
1. Verify IMPERIUM's 22 source files are accounted for in `command` infrastructure mode
2. Add HTTP 301 redirect: `/imperium/*` → `/command/infrastructure`
3. Add `DEPRECATED.md` to `artifacts/imperium/`
4. Deregister the artifact in `artifact.toml`
5. Do NOT delete the code directory

---

### Priority 3 — Documentation Corrections (No artifact changes)

These are accuracy corrections to existing public documents that must happen before any investor or enterprise presentation.

---

#### README.md Accuracy Corrections

| Claim | Currently Says | Should Say | Priority |
|-------|---------------|------------|---------|
| Apps badge | 22 | 8 canonical web + 2 mobile = 10 (or remove badge) | P1 |
| DB tables badge | 685 | 561 (per truth audit) | P1 |
| Products table includes PRISM Counsel | "Functional alpha" | Remove — deprecated | P1 |
| Products table includes Stephen Site | "Live" | Remove — deprecated | P1 |
| Shared libraries | 37 or 51 | 33 active packages (2 empty shells) | P2 |
| Node badge | 20.x | 24 | P2 |
| "IMPERIUM" listed as "Functional alpha" with 11 components | Separate product | Merged into Command | P2 |
| "51 packages" in stack section | 51 | 48 (33 lib + 15 artifact) | P3 |
| Platform architecture diagram includes "Lyte" as separate surface | "Lyte Operator command" | Update to "Command" | P2 |

#### COMPANY_FACT_SHEET.md Accuracy Corrections

| Claim | Currently Says | Should Say |
|-------|---------------|------------|
| Active artifacts | "15 active artifacts" | "10 canonical artifacts (8 web, 2 mobile) + 1 API + 1 internal" |
| PRISM Counsel in domain packs table | "Functional alpha" | Remove |
| IMPERIUM in domain packs table | "Functional alpha" | Note as merged into Command |
| DB tables badge | 685 | 561 |
| Shared packages | 51 | 48 |

#### docs/PRODUCT_MATRIX.md Accuracy Corrections

| Section | Action |
|---------|--------|
| Stephen Lutar — Founder Authority Site | Remove entirely — deprecated |
| PRISM Counsel as active platform | Remove entirely — deprecated |
| Add Command as canonical operator surface | Add entry for `command` |
| Update all "Live" status claims | Verify against truth audit before next external share |

---

## CI/CD Archive Actions

| Workflow | Action | Priority |
|----------|--------|---------|
| `.github/workflows/prism-counsel-ci.yml` | **Delete** — deprecated app, stale pipeline | P1 |
| `.github/workflows/e2e.yml` | Remove `lyte-command-center` reference; add `command` | P2 |
| `.github/workflows/deploy.yml` | Review — may be legacy duplicate | P2 |
| `.github/workflows/npm-publish.yml` | Review — confirm needed for pnpm workspace | P3 |

---

## Library Archive Evaluation

Two shared libraries have no source files and should be evaluated for deletion:

| Library | Issue | Action |
|---------|-------|--------|
| `lib/api-spec` | No `src/`, no `index.ts` | Either populate with OpenAPI specification or delete before Phase 4 |
| `lib/approvals` | No `src/`, no `index.ts` | Either implement approval workflow primitives or delete before Phase 4 |

---

## Phase Sequencing

| Phase | Actions |
|-------|---------|
| **Now (Phase 2-3)** | Document plan (this file). Correct documentation accuracy (README, COMPANY_FACT_SHEET, PRODUCT_MATRIX). |
| **Phase 4** | Execute deregistrations. Add 301 redirects. Delete `prism-counsel-ci.yml`. Update `e2e.yml`. |
| **Phase 5** | Review `deploy.yml` and `npm-publish.yml`. Evaluate `lib/api-spec` and `lib/approvals` for deletion. |
| **Phase 6+** | Evaluate PRISM Counsel revival with a design partner. Extend CI build matrix to all canonical apps. |

---

## Non-Deletable Assets

The following directories should NEVER be deleted without explicit founder decision and git history review:

| Directory | Reason |
|-----------|--------|
| `artifacts/prism-counsel` | Substantial codebase (138 files); potential revival candidate |
| `artifacts/lyte-command-center` | Substantial codebase (155 files); PRISM framework reference |
| `artifacts/stephen-site` | Founder content; historical reference |
| `artifacts/imperium` | Infrastructure patterns; reference for `command` infrastructure mode |
| `artifacts/firestorm` | Reference for Aegis entry point patterns |

---

## Related Files

- `ops/portfolio/portfolio-architecture.md` — Full canonical topology and rationale
- `ops/portfolio/public-narrative-map.md` — Narrative containment for deprecated surfaces
- `ops/portfolio/domain-pack-strategy.md` — Domain pack revival criteria
- `ops/frontier/disposition-matrix.md` — Source truth audit
- `ops/mobile/mobile-disposition.md` — Mobile archive decisions
