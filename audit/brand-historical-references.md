# Brand Historical References — Preserved Legacy Names

**Established 2026-04-28 as part of Task #3255 (codename rollout).** Companion to `audit/banned-brand-strings.json` and `audit/brand-rollout-inventory.md`.

This document is the explicit "historical-references list" called for by Task #3255. Names listed here are **intentionally preserved** in their existing locations even though the canonical brand has changed. The trademark / availability analysis behind these decisions is not re-litigated here — see `ORIGINALITY_REPORT.md` for the original record.

The brand-strings guard (`pnpm brand:strings`) only scans `.ts` and `.tsx` source. Markdown copy, archived launch posts, and lowercase URL slugs are out of the scanner's scope by design — but they are listed here so the preservation is visible and auditable.

---

## Canonical rename map (from ORIGINALITY_REPORT.md)

| Old name | Canonical name | Notes |
|----------|----------------|-------|
| `TENAX` | `Sentra` | Cyber Resilience Command. |
| `LUMINA` | `Pulse` | AI Executive Briefing. |
| `CORTEX` / `Cortex` | `APEX` | Cross-domain alert correlation; also avoids the Palo Alto Networks "Cortex" trademark. |
| `INCA` | `Counsel` | Legal Matter Command. |
| `NEXUS` / `Nexus` | `PRAXIS` | Unified agentic AI layer; avoids HubSpot / Salesforce "Nexus" trademark. |
| `PRISM Counsel` / `PRISM-Counsel` | `Counsel` | `PRISM` prefix removed (NSA program brand association). |

## Risk-flagged terms (do not re-introduce without re-clearing)

| Term | Status | Notes |
|------|--------|-------|
| `Continuum` | **Banned, risk-flagged.** Any new use surfaces a `[RISK]` warning and the note text in `pnpm brand:strings` failure output. | Trademark / availability concern from the prior originality analysis. Per Task #3255 constraint #2, the analysis is not being redone. Treat as final until brand counsel re-clears the term. |

## Intentionally preserved legacy traces

The following uses of legacy names are **intentional** and should not be modified by future brand-string sweeps. If new occurrences appear that match these patterns, they should be allowlisted (preferred: `lineAllowlist` in `audit/banned-brand-strings.json`) rather than rewritten.

### 1. Lowercase URL / scene-id slugs

The originality audit explicitly preserved lowercase identifiers that exist as URL paths or scene IDs so inbound links do not break. The brand-strings regex requires word boundaries that exclude `-`, `_`, `/`, `:`, and `.`, so these slugs are not flagged by the scanner. Examples (non-exhaustive):

| Slug | Where | Reason preserved |
|------|-------|------------------|
| `/aegis/`, `/cortex/`, `/inca/`, `/nexus/`, `/prism-counsel/` | URL routes in api-server, marketing site, and screenshot filenames | Stable inbound links from social posts, prior emails, investor PDFs. |
| Scene id `cortex` in `artifacts/szl-demo-video/src/.../Scene4.tsx` | Video scene identifier | Renaming the scene id would break the captions JSON, the chapter markers, and the WebVTT cue ids. The visible label was renamed to `APEX Mobile`; the scene id is a stable internal identifier. |

### 2. The `prism-counsel/` Counsel-surface markdown directory

`artifacts/szl-holdings/public/prism-counsel/positioning.md`, `messaging-hierarchy.md`, and `site-map.md` are Counsel positioning artifacts. They are preserved verbatim per the Task #3255 hard constraint that **Counsel stays exactly as it is**. The directory name itself is also a preserved URL slug.

### 3. `tests/api/cortex-inca-smoke.test.ts`

The filename references the legacy codenames `cortex` and `inca`, but the test body targets the URL slugs `/cortex/*` and `/inca/*` (which are also preserved per item 1). The cancelled task #3105 explicitly stopped this rename, so the file stays at this name.

### 4. Published launch-series content (`content/launch-series/**`)

26 launch posts dated April 16 – April 27 across LinkedIn, Substack, and Medium reference legacy names like `PRISM Counsel`, `CORTEX`, `TENAX`, `LUMINA`, `Domaine`, and `Paragon`. These posts were already published. Rewriting them after the fact would falsify the historical record and contradict any externally-quoted excerpts.

Going forward, **new** content in `content/` should use the canonical names from the rename map above. The existing posts are an acknowledged historical-references corpus and are out of scope for the brand-strings guard (markdown is not scanned; the directory is not in `SCAN_ROOTS`).

### 5. Audit and history reports

`ORIGINALITY_REPORT.md`, `audit/A11OY_DOCTRINE_INSTALL_REPORT.md`, `PRODUCT-SURFACES.md`, `SCREENSHOT_REFRESH_REPORT.md`, and similar change-history documents reference the legacy names as part of the audit narrative ("X was renamed to Y"). They are preserved verbatim — rewriting them would falsify the record.

### 6. Archived product surfaces

`Aegis` (the Firestorm SOC product), `Alloy Platform`, `Firestorm`, `Prism` (as a generic), and `Stephen Lutar`'s personal site appear in the archived screenshot directories under `screenshots/archive/` and the X-launch series under `X-LAUNCH-SERIES/`. These are archived directories and are not part of the live marketing surface. The label `Aegis` is also reused in the current artifact catalogue as the **investor pitch deck** label — that reuse is intentional and documented in `audit/screenshot-catalog.md`.

### 7. Internal package and code identifiers

`packages/alloy/`, `lib/services/`, `lib/cognitive-runtime/`, `lib/ai-engine/`, and the rest of the directories listed in the `fileAllowlist` of `audit/banned-brand-strings.json` use legacy code-level identifiers (`TENAX`, `LUMINA`, `Domaine`, etc.) as internal symbol names, type names, or seed-data tag strings. These are not customer-facing brand surfaces and the audit allows them as internal references.

---

## How to add a new historical preservation

1. If the occurrence is at a **single line** in a .ts/.tsx source file, add an entry to the `lineAllowlist` array in `audit/banned-brand-strings.json` with the form `{ "file": "<rel/path>", "line": <n>, "term": "<term>", "reason": "<why preserved>" }`.
2. If the occurrence is **whole-file** (e.g. a generated data table that uses the legacy codename as a tag), add the file (or its enclosing directory with a trailing `/`) to the `fileAllowlist`.
3. Add a one-paragraph note to this document under the appropriate section so the preservation is auditable.
4. Run `pnpm brand:strings` to confirm the entry takes effect.
