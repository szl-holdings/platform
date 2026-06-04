# Public Copy Rationalization

**Phase:** Rehaul 8/9 — Copy Tightening & Screenshot Refresh  
**Date:** 2026-04-26  
**Author:** Platform rehaul process  
**Scope:** README, profile-readme, buyer docs, demo docs, sales docs

---

## Summary

This document records the before/after state of all public-facing copy changes made during Phase 8. The primary driver was product name rationalization: legacy artifact-based names (Lyte, Alloy, Aegis, Vessels, Terra, Sentra, Pulse) had drifted into buyer and demo docs while the README and trust center had already adopted canonical names. This pass aligned all public surfaces to the canonical naming system.

---

## Naming Canon (Source of Truth: README.md)

| Canonical Name | Domain | Artifact Path | Old Names Found in Docs |
|----------------|--------|--------------|------------------------|
| **KORA** | Decision Intelligence | `/lyte/` | Lyte, Lyte Command Center |
| **A11oy** | Execution Fabric | *(platform-level)* | Alloy |
| **TENAX** | Cyber Resilience | `/sentra/` | Sentra |
| **PARAGON** | Defense & Intelligence | `/aegis/` | Aegis |
| **SEXTANT** | Maritime Intelligence | `/vessels/` | Vessels |
| **DOMAINE** | Real Estate Intelligence | `/terra/` | Terra |
| **LUMINA** | Executive Briefing | `/pulse/` | Pulse |
| **Counsel** | Legal Matter Command | `/counsel/` | PRISM Counsel |
| **FORGE** | Unified Command | `/command/` | Command Portal |
| **APEX** | Mobile Command | `/szl-holdings-mobile/` | CORTEX |

---

## Files Changed

### `docs/buyer/executive-overview.md`

**Before:** Product names used legacy artifact labels — "Lyte — Business Observability", "Alloy — Execution Fabric", "Aegis — Defense & Intelligence", "Vessels — Maritime Intelligence", "Terra — Real Estate Intelligence". Date: Q1 2026.

**After:** All products renamed to canonical names — "KORA — Decision Intelligence", "A11oy — Execution Fabric", "PARAGON — Defense & Intelligence", "SEXTANT — Maritime Intelligence", "DOMAINE — Real Estate Intelligence". Date: Q2 2026.

**Rationale:** Buyer-facing document must use the same product names as the README. The legacy names were artifact-level names that predate the canonical naming scheme.

---

### `docs/buyer/solution-brief.md`

**Before:** Table and section headers used "Lyte", "Alloy", "Aegis", "Vessels", "Terra" as product names. Intelligence Workspace labeled "INCA".

**After:** All products renamed to canonical names. "INCA" label removed from the Intelligence Workspace (internal codename, not a public product name).

**Rationale:** Solution brief is sent to enterprise buyers who cross-reference with the README and trust center. Naming inconsistency creates confusion and undermines credibility.

---

### `docs/buyer/use-cases.md`

**Before:** Use case headers and body text used "Lyte", "Aegis", "Vessels", "Terra". References to "Alloy" for workflow routing.

**After:** All renamed to KORA, PARAGON, SEXTANT, DOMAINE, A11oy. Date updated to Q2 2026.

**Rationale:** Same consistency requirement as other buyer docs.

---

### `docs/buyer/canonical-demo.md`

**Before:** Title "Lyte + Alloy — Canonical Demo Flow". All scene narrations and section headers referenced "Lyte" and "Alloy".

**After:** Title "KORA + A11oy — Canonical Demo Flow". All narrations updated. Version 2.0 → 2.1.

**Rationale:** This is the canonical buyer demo document. It must use canonical names or it confuses presenters who also read the README.

---

### `docs/demo/demo-day-guide.md`

**Before:** Workflow verification list referenced "PRISM Counsel" and "Lyte". Demo table section labels referenced "PRISM Counsel", "Lyte". Audience-specific tips referenced old names.

**After:** "PRISM Counsel" → "Counsel". "Lyte" → "KORA". "Vessels" → "SEXTANT". "Aegis" → "PARAGON". "CORTEX mobile" → "APEX mobile". Platform paths (e.g., `/lyte/`, `/vessels/`) preserved — these are routes not product names.

**Rationale:** Demo presenters use this guide alongside the README. Mixed naming causes hesitation during live demos. Paths preserved because that's where the software actually lives.

---

### `docs/demo/demo-scenarios.md`

**Before:** Narrative headers labeled "Lyte", "Alloy", "PRISM Counsel". Body text throughout used old names. Proof chain steps referenced "Alloy" as the execution layer.

**After:** All product names updated to canonical names. Version 1.0 → 1.1. All scenario steps updated consistently.

**Rationale:** This is the most detailed public demo document. Stale naming here directly damages demo credibility.

---

### `docs/demo/gap-report.md`

**Before:** Section headers "Lyte (Business Observability)", "PRISM Counsel (Legal Matter Command)". Body text used old names throughout.

**After:** "KORA (Decision Intelligence)", "Counsel (Legal Matter Command)". All body text updated.

**Rationale:** Gap report is referenced by investors and technical evaluators during due diligence.

---

### `docs/sales/press-kit.md`

**Before:** Platform hierarchy table listed "Lyte" as flagship command and "Alloy" as execution fabric. Product section headers "Lyte — Flagship Governed Command Surface", "Alloy — Execution Fabric", "CORTEX — Unified Mobile Command". Domain packs listed "PRISM Counsel" and "IMPERIUM". Boilerplate mentioned "Lyte" and "Alloy". Media assets pointed to stale `landing-hero.jpg` and `lyte-overview.jpg` references.

**After:** All renamed to canonical names. IMPERIUM removed (not a public product; not live). Boilerplate updated. Media assets updated to point to `docs/assets/screenshots/current/` with correct filenames.

**Rationale:** Press kit is the document sent to media and analysts. It must be accurate and consistent with all other public surfaces.

---

### `docs/sales/company-fact-sheet.md`

**Before:** Platform hierarchy listed "Lyte" and "Alloy". Domain pack table listed "PRISM Counsel" and "IMPERIUM". Platform scale numbers used outdated counts (10 artifacts, 40+ packages). CORTEX as mobile.

**After:** All renamed to canonical names. IMPERIUM removed. Platform scale updated to match README (14 artifacts, 100 packages, 51 shared libraries, 8 operator products). APEX replaces CORTEX.

**Rationale:** Fact sheet is used by investors for due diligence. Stale scale numbers contradict the README.

---

## Claims Policy Applied

All rewritten docs follow these claim rules:
1. **Alpha status**: All products described as "functional alpha" — no "production" or "enterprise-ready" claims without evidence.
2. **Data source honesty**: AIS described as "simulated" in SEXTANT demo caveats. Live data sources explicitly called out (CISA KEV, NVD CVE, NYC Open Data, OFAC).
3. **Certification honesty**: SOC 2 described as planned/roadmap, not certified. NCC Group penetration test cited accurately.
4. **Product availability**: IMPERIUM removed from all public docs (not a public product). CORTEX renamed to APEX (platform-canonical name).

---

## What Was Not Changed

- `docs/trust/trust-center.md` — already used canonical names (TENAX, Counsel, PARAGON, SEXTANT, DOMAINE, KORA, A11oy). No changes needed.
- `profile-readme/README.md` — already used KORA and A11oy. No changes needed.
- `README.md` — source of truth; not modified in this pass.
- Internal docs (`docs/architecture/`, `docs/operations/`, etc.) — out of scope for this pass.

---

## Verification

All changed files were reviewed and verified as of 2026-04-26:

- [x] Canonical product names throughout — all legacy names replaced with README-canonical names
- [x] No overclaimed production status — all products described as "functional alpha"; known gaps noted
- [x] No fake or unverified metrics — overclaimed counts corrected; unverifiable internal metrics removed
- [x] No contradictions with README.md — platform scale, product names, and roadmap status aligned
- [x] Platform paths (URLs) preserved correctly — artifact routes like `/lyte/`, `/vessels/` unchanged
- [x] Contact information consistent — all docs use `inquiries@szlholdings.com` / `stephen@szlholdings.com`

## Screenshot Cleanup Verification (2026-04-26)

- [x] `screenshots/` root directory deleted (~250 legacy files)
- [x] `launch-shots/` directory deleted (7 v0 launch captures)
- [x] `docs/media/screenshots/prism-counsel/` deleted (stale path alias, 2 files)
- [x] 19 superseded flat JPGs removed from `docs/media/screenshots/` root
- [x] 4 non-artifact files retained: `carlota-jo-hero.jpg`, `stephen-lutar-hero.jpg`, `szl-founder.jpg`, `trust-center.jpg` (no Playwright equivalents)
- [x] `brand/screenshots/` retained — canonical README image source, not stale
- [x] `docs/assets/screenshots/current/` retained — 131 verified Playwright captures (2026-04-26)
- [x] `docs/media/screenshots/manifest.json` created — machine-readable, 24 current files catalogued
- [x] `docs/media/screenshots/manifest.md` created — human-readable with status table and usage guidance
