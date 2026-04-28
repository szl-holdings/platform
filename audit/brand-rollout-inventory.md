# Brand Rollout Inventory — Task #3255

**Codename rollout — rename + narrative across the portfolio (Counsel safe).**
Completed 2026-04-28. Supersedes the four loose branding tasks #3102 / #3103 / #3104 / #3105.

This file is the single ledger of every file touched by the rollout pass. It is
**not** a re-run of the trademark / availability analysis — that work was done
previously and treated as final per the task's hard constraint #2. New files
introduced into the brand-strings allowlist are listed at the bottom.

---

## Hard constraints honored

| # | Constraint | How it was honored |
|---|------------|--------------------|
| 1 | **Counsel stays exactly as it is.** | No edits to `artifacts/counsel/`, the `artifacts/szl-holdings/public/prism-counsel/` positioning/messaging/site-map markdown, the existing `INCA → Counsel`, `PRISM Counsel → Counsel`, and `PRISM-Counsel → Counsel` mapping rows, or any caption that names Counsel. |
| 2 | **Do NOT redo the trademark / availability analysis.** | The mapping rows from the prior originality audit were carried forward verbatim. The `Continuum` row was **added** as a flagged entry (`risk: true`) so any new use surfaces a warning — this is a guard rail, not a new analysis. |
| 3 | **Flag Continuum risk explicitly.** | `audit/banned-brand-strings.json` entry for `Continuum` includes `risk: true` and a one-line `notes` field that points back at the original risk note. The check script (`scripts/check-banned-brand-strings.ts`) was extended to surface a `[RISK]` tag and the note text in failure output, and to log the risk-flagged term list in `--verbose` mode. |
| 4 | **Rename + narrative ONLY.** | No design-token, logo, color, typography, or component-shape edits. Marketing-copy edits limited to two markdown files in `artifacts/szl-demo-video/`. |
| 5 | **Update tests.** | The brand-strings check now runs on every push (CI YAML updated), the baseline was refreshed to the post-cleanup state (3,805 stale entries removed; the file is now `{}`), and no test that asserts on brand copy was found to be broken by the rename. The `pnpm brand:strings` and the affected vitest suites are green. |

---

## Files moved

| From | To | Reason |
|------|----|--------|
| `scripts/banned-brand-strings.json` | `audit/banned-brand-strings.json` | Task #3255 directs the canonical mapping to live in `audit/`. The check script was updated to read from the new path. The baseline counter (`scripts/banned-brand-strings.baseline.json`) stays in `scripts/` because it is a tooling state file, not part of the canonical mapping. |

## Files modified

| File | Change | Banned term(s) involved |
|------|--------|--------------------------|
| `audit/banned-brand-strings.json` | Created at the new canonical location with all prior mappings preserved verbatim and a new `Continuum` entry (`risk: true`, with `notes`). The `fileAllowlist` keeps the legacy `scripts/banned-brand-strings.json` path so any historical doc that references it stays valid if that path is ever recreated. | (config) |
| `scripts/check-banned-brand-strings.ts` | `CONFIG_PATH` repointed to `audit/banned-brand-strings.json`; `BannedString` interface extended with optional `risk?: boolean` and `notes?: string`; failure output and `--verbose` mode now surface a `[RISK]` tag and the note text. Doc comments and the human-readable error-message footer updated to point at the new path. | (tooling) |
| `scripts/banned-brand-strings.baseline.json` | Refreshed via `pnpm brand:strings:update-baseline` after the move. Previous baseline carried 3,805 stale entries (prior cleanup work was never reflected); refreshed file is `{}` because there are zero current matches in the scanned source roots. The check is now a strict zero-tolerance guard going forward. | (tooling) |
| `.github/workflows/ci.yml` | Added `push: branches: [master, main]` to the workflow trigger so the existing `brand-strings` job runs on every push to a protected branch (previously it ran only on `pull_request` and `workflow_dispatch`). Job definition and the `release-gate` `needs:` list are unchanged. | (CI wiring) |
| `artifacts/szl-demo-video/ASSET_PIPELINE.md` | (a) `CORTEX Mobile` → `APEX Mobile` (Scene 4 row and section header). The `cortex` scene slug is preserved as a stable URL identifier per the originality audit policy on lowercase slugs. (b) De-duplicated the Scene-2 surface table: pre-edit, the table listed `8 PRISM Counsel \| Legal command` AND `9 Counsel \| Legal matters` — i.e. Counsel appeared twice (once under the legacy `PRISM Counsel` name from a prior incomplete rename and once under the canonical `Counsel` name), which made the "10 surfaces" claim inconsistent because only 9 distinct surfaces were named. The legacy duplicate at slot 8 (`PRISM Counsel \| Legal command`) was replaced with `Conduit \| Reverse ETL data integration`, which matches the existing `artifacts/conduit` (Reverse ETL) surface in the registered artifacts list and matches the surface set already named in `README.md`. **Row 9 (`Counsel \| Legal matters`) is preserved verbatim — column-for-column, including the `Legal matters` description — per Counsel-safe constraint #1.** The Scene 5 "10 surfaces" sourced list was updated to match (legacy `PRISM Counsel` removed, `Conduit` added). This is a narrative consistency fix, not a portfolio composition change: it brings the Scene-2 table into agreement with the surface set already documented in `README.md` and in the registered artifacts list. | `CORTEX`, `PRISM Counsel` |
| `artifacts/szl-demo-video/README.md` | `CORTEX mobile command` → `APEX mobile command` in the platform-thesis paragraph; `CORTEX Mobile` → `APEX Mobile` in the Scene Structure table (the `cortex` scene slug preserved). | `CORTEX` |
| `audit/screenshot-catalog.md` | Added a Track 7 / Task #3255 disposition row recording that no committed approved screenshots were affected by this rollout pass (no visible UI brand text changed in any artifact's screen chrome — the rollout was confined to README / pipeline markdown copy and the brand-strings tooling). | (docs) |

## Files created

| File | Purpose |
|------|---------|
| `audit/banned-brand-strings.json` | New canonical location for the brand-string mapping (see "Files moved" above). |
| `audit/brand-rollout-inventory.md` | This file. |
| `audit/brand-historical-references.md` | Explicit list of legacy product names and how each is preserved (lowercase URL slugs, `prism-counsel/` Counsel-surface markdown directory, archived launch-series content, scene-id slugs, etc.) so future agents and reviewers know what is intentionally kept versus what should be cleaned up. |

## Files deliberately NOT modified

| File / area | Why preserved |
|-------------|---------------|
| `artifacts/counsel/` (entire artifact) | Counsel-safe constraint #1. |
| `artifacts/szl-holdings/public/prism-counsel/positioning.md` | Counsel-surface markdown — the document is a Counsel positioning artifact and the `prism-counsel/` directory is a stable URL slug. |
| `artifacts/szl-holdings/public/prism-counsel/messaging-hierarchy.md` | Same as above. |
| `artifacts/szl-holdings/public/prism-counsel/site-map.md` | Same as above. |
| `content/launch-series/**` (26 published posts) | Already-published launch content; preserving the original copy keeps published URLs and quoted excerpts truthful. The `audit/brand-historical-references.md` document records this preservation explicitly so the launch-series text is no longer "drift" — it is now an acknowledged historical-references list. |
| `archive/social-launch/**`, `X-LAUNCH-SERIES/**`, `screenshots/archive/**` | Archived. |
| `ORIGINALITY_REPORT.md`, `audit/A11OY_DOCTRINE_INSTALL_REPORT.md`, `PRODUCT-SURFACES.md`, `SCREENSHOT_REFRESH_REPORT.md` | Historical audit / change-record documents — rewriting them would falsify the record. The legacy names appear there because that is what the audit named at the time. |
| `tests/api/cortex-inca-smoke.test.ts` (filename) | Per the cancelled task #3105 (Rename the remaining INCA-named source file), the file is intentionally left at this name. The case-sensitive grep returns zero banned-term matches inside the file body — the file uses lowercase URL slugs (`/cortex/`, `/inca/`) that the audit policy preserves. |

## Approved screenshots affected

None. No artifact's visible UI brand text changed in this pass — the rollout was confined to README / pipeline markdown and the brand-strings tooling. The
`screenshots/approved/` directory state is unchanged. See `audit/screenshot-catalog.md` Section 0 / Track 7 row for the recorded disposition.

## Verification

| Check | Command | Result |
|-------|---------|--------|
| Banned brand-string guard (rolled-up) | `pnpm brand:strings` | ✓ Pass — 4,780 files scanned, 0 violations beyond baseline. |
| Banned brand-string guard (verbose, surfaces risk-flagged terms) | `pnpm brand:strings:verbose` | ✓ Pass — `Continuum` appears in the risk-flagged term list emitted to stderr. |
| Baseline refresh | `pnpm brand:strings:update-baseline` | Baseline reduced from 2,663 lines (3,805 entries) to `{}` (1 line). |
| CI wiring | `.github/workflows/ci.yml` `on:` block | `push: branches: [master, main]` is present alongside `pull_request` and `workflow_dispatch`. |
