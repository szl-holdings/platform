# FACT RECONCILIATION AUDIT — Phase 0

Captured: 2026-04-23.

## Method

Ran ripgrep across `docs/`, `README.md`, and any press-kit / fact-sheet / demo-guide / deployment-readiness / trust-center markdown. Looked for hard-coded counts of: artifacts, apps, packages, libraries, routes, schemas, migrations, tests.

Cross-referenced against verified numbers in `PLATFORM_FACTS_SOURCE_OF_TRUTH.md`.

## Findings

### F1. Artifact count divergence

- **Source of truth:** 13 web + 1 mobile + 1 video + 1 backend + 1 design surface = **16 total** (with 14 customer-visible).
- **Risk:** Older docs may still cite "12 artifacts", "14 artifacts", or "10+" depending on when they were written.
- **Recommendation:** Sweep docs with `rg -i "artifact" docs/ | rg -E "[0-9]+"` and align to the canonical list in the source-of-truth file.

### F2. Package count divergence

- **Source of truth:** 119 packages + libs.
- **Risk:** Earlier copy used "20+ packages" or "core libraries" without numbers.
- **Recommendation:** When numbers must appear, cite the source-of-truth file.

### F3. Brand-name leftovers (`firestorm` → `aegis` rename)

- **Verified:** 25 source files + 10 build artefacts still contain the deprecated `firestorm` name.
- **Tasks tracking the cleanup:** #1437 (route rename), #1438 (directory cleanup), #3419 (API path migration).
- **Public risk:** Investor demo or customer audit could surface `firestorm_*` names in DB exports or admin URLs.
- **Recommendation:** Land the in-flight tasks before launch, OR feature-flag the surfaces that still expose the old name.

### F4. Test count divergence

- **Source of truth:** Specific suites pass with the counts listed in `PLATFORM_FACTS_SOURCE_OF_TRUTH.md`.
- **Risk:** Generic claims like "200+ tests passing" cannot be sourced precisely without re-counting on each release.
- **Recommendation:** Avoid round-number test count claims in public docs. Cite specific suite results when needed.

### F5. Skipped tests

- **Source of truth:** 114 skipped or `.todo` tests across the repo.
- **Risk:** This is rarely surfaced publicly; risk is internal — easy to assume coverage where there is none.
- **Recommendation:** Triage during the post-launch consolidation sprint. Each skip needs an owner + a tracking task or it must be deleted.

### F6. Brand-string baseline

- **Source of truth:** 3,892 entries in `scripts/banned-brand-strings.baseline.json`. New violations are still caught (verified — `pnpm brand:strings` PASS). The baseline carries dead weight from past renames.
- **Recommendation:** Refresh the baseline post-launch with explicit owner approval (rotation could mask a NEW violation if done blindly).

## Reconciliation rules going forward

1. Any public-facing count must be sourceable from `PLATFORM_FACTS_SOURCE_OF_TRUTH.md`.
2. If a count changes in code, update the source-of-truth file in the same commit.
3. Do not use round-number claims ("200+ tests", "15+ apps") in investor/customer materials. Use the exact verified count and link to the source-of-truth file.
4. If a fact disagrees between two public docs, fix the one that disagrees with the source-of-truth file. Do not retrofit the truth to match marketing copy.

## What was NOT reconciled this pass

- Press kit, demo guide, trust-center docs, deployment-readiness public copy were not enumerated and walked one-by-one. The pattern is established; the manual sweep is a 2-hour task best done by the owner of each public surface.
