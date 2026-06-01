# 22 — ZENODO FOUNDER ACTIONS: What Needs Minting / Fixing
**Audit date:** 2026-05-31  
**ORCID:** 0009-0001-0110-4173  
**Auditor:** Perplexity Computer (read-only)  
**Doctrine:** v7 strict. Zero-Bandaid Law. Watunakuy compliant.

---

## Priority Matrix

| Priority | Action | Effort | Blocker Risk |
|----------|--------|--------|--------------|
| 🔴 P0 | Fix v18.0 deposit description (remove "zero sorry" claim) | 10 min | CRITICAL — reviewer-visible factual error on current MASTER |
| 🔴 P0 | Mint Ouroboros Thesis v19 deposit | 30 min | v19 arXiv package exists in workspace; only Zenodo upload remains |
| 🔴 P0 | Mint Ouroboros Thesis v20 deposit | 30 min | v20 arXiv package exists in workspace; only Zenodo upload remains |
| 🔴 P0 | Mint vsp-otel v0.2.0 software deposit | 20 min | No own deposit; CITATION.cff now has concept DOI only (already corrected) |
| 🟠 P1 | Fix ouroboros CITATION.cff — doi: must point to own DOI (20162352) | 5 min | Every GitHub "Cite this repo" points to wrong record |
| 🟠 P1 | Fix amaru CITATION.cff — version 0.2.0 → 0.3.1 + own DOI | 5 min | Version is 2 minor bumps stale |
| 🟠 P1 | Fix szl-cookbook CITATION.cff — wrong DOI listed (lutar-lean DOI cited as own) | 5 min | Provenance error: cites lutar-lean as szl-cookbook |
| 🟠 P1 | Fix v18 PDF body — redeposit with true v18 PDF (current body = v17 PDF) | 1 hr | v18.0 record ships wrong document |
| 🟡 P2 | Add own DOIs to CITATION.cff for: a11oy, sentra, vessels, rosie, uds-mesh | 5 min each | Citation tools direct to wrong records |
| 🟡 P2 | Mint agi-forecast v0.3.0 deposit (current Zenodo: v0.1.0) | 20 min | Two minor versions stale |
| 🟡 P2 | Mint szl-cookbook v0.3.0 deposit (current Zenodo: v0.1.0) | 20 min | Two minor versions stale |
| 🟡 P2 | Add szl-brand own DOI to its CITATION.cff | 5 min | Missing own-DOI reference |
| 🟢 P3 | Mint vsp-otel v0.3.0 update (after v0.2.0 deposit) | 15 min | Incremental version |
| 🟢 P3 | Consolidate lutar-lean duplicate concept chains (20434305 / 20434307) | 15 min | Confusion over canonical DOI |
| 🟢 P3 | Mint platform (szl-holdings-platform) monorepo snapshot | 1 day | README says "DOI pending"; needed for Series A due diligence |
| 🟢 P3 | Mint SZL Doctrine v7 deposit (only v2 on Zenodo; v7 is the operational version) | 30 min | Doctrine chain has a 5-version gap |

---

## P0 — Critical Actions (Do Immediately)

---

### ACTION-01: Fix v18.0 Description — Remove "zero sorry, zero open axioms" Claim

**What:** Zenodo record 20434276 description states "zero sorry, zero open axioms."  
**Reality:** lutar-lean HEAD has 168 tracked sorries and 14 unique axioms.  
**Why urgent:** This is the current MASTER thesis. Any reviewer clicking the Zenodo badge sees a factually false claim about the proof state.

**Zenodo edit procedure:**
1. Log in to zenodo.org
2. Navigate to https://zenodo.org/records/20434276
3. Click "Edit" (available to owner on published records)
4. In description, replace:
   - `zero sorry, zero open axioms` → `168 tracked sorries (117 non-Putnam baseline + 51 Putnam; see lutar-lean HEAD c7c0ba17); 14 unique axioms; 749 total Lean declarations; sorry-free sub-results: a3_normalize, lambda_isMonotone, Λ_le_max, TH11`
   - Add note: `Conjecture 1 (TH10 / lutar_is_geomean): demoted from Theorem in v14; two-part proof gap documented in v19.`
5. Save and republish (no new DOI needed — description edits don't mint new versions)

**Time:** 10 minutes.

---

### ACTION-02: Mint Ouroboros Thesis v19 Deposit

**What:** v19 arXiv package exists in workspace at:  
`/home/user/workspace/szl/audit_2026-05-30_cursor_offline/thesis_v19_arxiv/`

**Files ready:**
- `main.tex.md` — full v19 thesis source
- `refs.bib` — bibliography
- `CITATION.cff` — correctly authored (has `PENDING-v19` placeholder)
- `README.md`

**Zenodo deposit metadata:**
```json
{
  "title": "Ouroboros Thesis v19 — Mid-Step Consolidation: K10v2 Honest Discharge, Wire-B/C HTTP Substrate, σ-Algebra Retraction",
  "upload_type": "publication",
  "publication_type": "article",
  "publication_date": "2026-05-31",
  "version": "19.0.0",
  "creators": [{"name": "Lutar, Stephen P.", "affiliation": "SZL Holdings, Inc.", "orcid": "0009-0001-0110-4173"}],
  "license": "CC-BY-4.0",
  "related_identifiers": [
    {"identifier": "10.5281/zenodo.19944926", "relation": "isVersionOf", "scheme": "doi"},
    {"identifier": "10.5281/zenodo.20434276", "relation": "isNewVersionOf", "scheme": "doi"}
  ]
}
```

**Steps:**
1. Generate v19 PDF from `main.tex.md` (pandoc → pdflatex)
2. Upload PDF to Zenodo under concept DOI `10.5281/zenodo.19944926`
3. Record new DOI; replace `PENDING-v19` in CITATION.cff
4. Update ouroboros-thesis README Zenodo badge to v19

**Time:** 30 minutes (PDF generation + upload).

---

### ACTION-03: Mint Ouroboros Thesis v20 Deposit

**What:** v20 arXiv package exists in workspace at:  
`/home/user/workspace/szl/audit_2026-05-30_cursor_offline/thesis_v20_arxiv/`

**Files ready:**
- `main.tex.md` — full v20 standalone thesis (~7500 words, 16 sections)
- `refs.bib` — ~65 BibTeX entries
- `CITATION.cff` — correctly authored (has `PENDING-v20` placeholder)
- `CHANGES_FROM_V19.md`
- `README.md`

**Zenodo deposit metadata:**
```json
{
  "title": "Ouroboros Thesis v20 — A Formally-Verified Governance Gate for Agentic AI: Lean 4 Λ-Operator, Khipu Merkle Receipt DAGs, and a UDS-Deployable Substrate",
  "upload_type": "publication",
  "publication_type": "article",
  "publication_date": "2026-05-31",
  "version": "20.0.0",
  "creators": [{"name": "Lutar, Stephen P.", "affiliation": "SZL Holdings, Inc.", "orcid": "0009-0001-0110-4173"}],
  "license": "CC-BY-4.0",
  "related_identifiers": [
    {"identifier": "10.5281/zenodo.19944926", "relation": "isVersionOf", "scheme": "doi"},
    {"identifier": "10.5281/zenodo.PENDING-v19", "relation": "isNewVersionOf", "scheme": "doi"}
  ]
}
```

**Note:** v19 must be minted first so the `isNewVersionOf` relation can point to a real DOI.

**Steps:**
1. After v19 is minted, replace `PENDING-v19` in v20's CITATION.cff and refs.bib
2. Generate v20 PDF from `main.tex.md`
3. Upload to Zenodo as new version of concept DOI `10.5281/zenodo.19944926`
4. Record new DOI; replace `PENDING-v20` in CITATION.cff and all identifiers
5. This will be the new MASTER (index 38 in chain)

**Time:** 30 minutes.

---

### ACTION-04: Mint vsp-otel Software Deposit

**What:** vsp-otel has no own Zenodo software deposit. Current CITATION.cff correctly lists only the concept DOI (corrected from prior audit that found it listing thesis v15).  
**Repo:** https://github.com/szl-holdings/vsp-otel  
**Current version:** v0.2.0 (CHANGELOG shows v0.2.0 released 2026-05-28)

**Zenodo deposit metadata:**
```json
{
  "title": "vsp-otel — OpenTelemetry exporter and DSSE attestation for SZL Holdings governed AI spans",
  "upload_type": "software",
  "publication_date": "2026-05-29",
  "version": "0.2.0",
  "creators": [{"name": "Lutar, Stephen P.", "affiliation": "SZL Holdings, Inc.", "orcid": "0009-0001-0110-4173"}],
  "license": "Apache-2.0",
  "related_identifiers": [
    {"identifier": "10.5281/zenodo.19944926", "relation": "isSupplementTo", "scheme": "doi"},
    {"identifier": "https://github.com/szl-holdings/vsp-otel", "relation": "isSupplementedBy", "scheme": "url"}
  ]
}
```

**Steps:**
1. Download GitHub release ZIP: `szl-holdings/vsp-otel` at tag `v0.2.0` (or create tag if missing)
2. Upload to Zenodo as new software record
3. Record the new DOI
4. Update vsp-otel CITATION.cff: add own DOI to identifiers section

**Time:** 20 minutes.

---

## P1 — High Priority CITATION.cff Fixes

---

### ACTION-05: Fix ouroboros CITATION.cff doi: field

**Repo:** https://github.com/szl-holdings/ouroboros  
**Problem:** `doi: 10.5281/zenodo.20434276` (thesis v18) instead of own software DOI  
**Fix:** Change `doi:` to `10.5281/zenodo.20162352`; add own DOI to identifiers

```yaml
# BEFORE (wrong):
doi: "10.5281/zenodo.20434276"

# AFTER (correct):
doi: "10.5281/zenodo.20162352"
identifiers:
  - description: "Ouroboros Runtime v6.3.0 — Zenodo software deposit"
    type: doi
    value: "10.5281/zenodo.20162352"
  - description: "Ouroboros Thesis v18 — companion paper"
    type: doi
    value: "10.5281/zenodo.20434276"
  - description: "Ouroboros Thesis concept DOI — always-latest"
    type: doi
    value: "10.5281/zenodo.19944926"
```

---

### ACTION-06: Fix amaru CITATION.cff version + doi

**Repo:** https://github.com/szl-holdings/amaru  
**Problems:** version is `0.2.0` (deposit is `uds-v0.3.1`); `doi:` points to thesis  
**Fix:**
```yaml
# BEFORE (wrong):
version: "0.2.0"
doi: "10.5281/zenodo.20434276"

# AFTER (correct):
version: "0.3.1"
doi: "10.5281/zenodo.20466440"
identifiers:
  - description: "amaru uds-v0.3.1 — Zenodo software deposit"
    type: doi
    value: "10.5281/zenodo.20466440"
```

---

### ACTION-07: Fix szl-cookbook CITATION.cff wrong DOI

**Repo:** https://github.com/szl-holdings/szl-cookbook  
**Problem:** lists `10.5281/zenodo.20434308` (lutar-lean!) as "szl-cookbook Zenodo DOI"  
**Fix:**
```yaml
# REMOVE:
- description: "szl-cookbook Zenodo DOI"
  type: doi
  value: "10.5281/zenodo.20434308"   # ← this is lutar-lean, NOT szl-cookbook

# ADD:
- description: "szl-cookbook v0.1.0 — Zenodo deposit"
  type: doi
  value: "10.5281/zenodo.20436558"
```

---

### ACTION-08: Fix v18 PDF Body (Redeposit)

**Problem:** Zenodo record 20434276 contains a PDF whose title page reads "Ouroboros Thesis v17" — the v18 metadata shell was minted but the v17 PDF file was attached.  
**Required file:** `CORRECT_v18_thesis_for_zenodo_upload.pdf` — already exists in workspace at `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/zenodo_v18_fix/` along with `INSTRUCTIONS.md`  

**Steps:**
1. Review the INSTRUCTIONS.md at the v18_fix path
2. On Zenodo record 20434276, click Edit → Files
3. Delete the existing `ouroboros-thesis-v18.0.pdf`
4. Upload `CORRECT_v18_thesis_for_zenodo_upload.pdf` (renamed to `ouroboros-thesis-v18.0.pdf`)
5. Save and republish

**Note:** Minting v19 (ACTION-02) effectively supersedes this — v19 will become the new chain head, and a "v18 body is v17" anomaly becomes a historical record, not the current state. Still recommended to fix for chain integrity.

---

## P2 — CITATION.cff Own-DOI Additions (One-liner fixes)

For each repo below, add the listed DOI to the `identifiers:` section with `type: doi`:

| Repo | DOI to add | Description string to use |
|------|-----------|--------------------------|
| a11oy | `10.5281/zenodo.20451991` | "a11oy uds-v0.3.0 — Zenodo software deposit" |
| sentra | `10.5281/zenodo.20466435` | "sentra uds-v0.3.1 — Zenodo software deposit" |
| vessels | `10.5281/zenodo.20451595` | "vessels uds-v0.3.0 — Zenodo software deposit" |
| rosie | `10.5281/zenodo.20451997` | "rosie uds-v0.3.0 — Zenodo software deposit" |
| uds-mesh | `10.5281/zenodo.20451999` | "uds-mesh uds-v0.3.0 — Zenodo software deposit" |
| szl-brand | `10.5281/zenodo.20436556` | "szl-brand v0.1.0 — Zenodo deposit" |

---

## P2 — Stale Version Deposits

### ACTION-09: Mint agi-forecast v0.3.0 Deposit

**Current Zenodo:** v0.1.0 (10.5281/zenodo.20436560)  
**Current repo version:** v0.3.0  
**Steps:**
1. Tag `v0.3.0` in GitHub repo (if tag doesn't exist)
2. Download release ZIP
3. Upload as new version under concept `10.5281/zenodo.20436559`
4. New DOI will be assigned; add to agi-forecast CITATION.cff

### ACTION-10: Mint szl-cookbook v0.3.0 Deposit

**Current Zenodo:** v0.1.0 (10.5281/zenodo.20436558)  
**Current repo version:** v0.3.0  
**Steps:**
1. Download `szl-cookbook` at v0.3.0 as ZIP
2. Upload as new version under concept `10.5281/zenodo.20436557`
3. New DOI assigned; update CITATION.cff

---

## P3 — Completeness Actions

### ACTION-11: Consolidate lutar-lean Duplicate Concept Chains

**Problem:** Two Zenodo deposits for the same GitHub repo lutar-lean with different concept DOIs:
- 20434306 (concept 20434305) — "lutar-lean — Lean 4 formalization..." (GitHub auto-release ZIP)
- 20434308 (concept 20434307) — "Lutar — Lean 4 Formal Proofs..." (manually crafted TAR.GZ, primary cite target per lutar-lean README)

**Fix:** 
1. On record 20434306, edit related identifiers to add `{"identifier": "10.5281/zenodo.20434308", "relation": "isIdenticalTo"}`
2. In lutar-lean README, clearly designate 20434308 (concept 20434307) as the canonical cite target
3. All future version deposits should go under concept 20434307 only

### ACTION-12: Mint SZL Doctrine v7 Deposit

**Context:** SZL Doctrine v2 is on Zenodo (DOI 10.5281/zenodo.20174600). The operational doctrine is now at v7 (all repos reference "Doctrine v7 strict"). Versions v3–v7 were never deposited.

**Minimum action:** Mint a Doctrine v7 deposit (the current operational version). Package the doctrine specification from the .github repo or szl-holdings-platform.

### ACTION-13: Mint szl-holdings-platform Monorepo Snapshot

**Context:** The platform README explicitly says "DOI pending Zenodo deposit." This is the main commercial product monorepo (131 packages, 291 test files). Series A due diligence will ask for this.

**Steps:**
1. Tag the current platform state (e.g., `platform-2026-05-31`)
2. Generate a source ZIP (or use GitHub's ZIP download for the tag)
3. Upload to Zenodo as a new software record
4. Record DOI and update platform README

**Blocker note:** Platform CI was reported as failing at HEAD in a prior audit (ZENODO_VERDICT.md §4). Confirm CI is green before minting.

---

## Recommended Execution Order

```
TODAY (2026-05-31):
  1. ACTION-01: Fix v18 description (10 min, no new DOI)
  2. ACTION-02: Mint v19 (30 min) → get PENDING-v19 DOI
  3. ACTION-03: Mint v20 after v19 (30 min) → get PENDING-v20 DOI
  4. ACTION-04: Mint vsp-otel v0.2.0 (20 min)

SAME SESSION (30 min for all):
  5. ACTION-05: Fix ouroboros CITATION.cff doi:
  6. ACTION-06: Fix amaru CITATION.cff version + doi
  7. ACTION-07: Fix szl-cookbook CITATION.cff wrong DOI
  8. P2 batch: Add own DOIs to a11oy, sentra, vessels, rosie, uds-mesh, szl-brand

THIS WEEK:
  9. ACTION-08: Redeposit v18 with correct PDF body (if not superseded by v19)
  10. ACTION-09: Mint agi-forecast v0.3.0
  11. ACTION-10: Mint szl-cookbook v0.3.0

BEFORE WARHACKER (June 16–19):
  12. ACTION-11: Consolidate lutar-lean concept chains
  13. ACTION-12: Mint Doctrine v7 deposit
  14. ACTION-13: Mint platform snapshot (after CI goes green)
```

---

## Post-Audit Zenodo State (Expected After All Actions)

| Metric | Current | After Actions |
|--------|---------|---------------|
| Total live deposits | 33 | 39+ (33 + v19 + v20 + vsp-otel + agi-forecast v0.3 + szl-cookbook v0.3 + platform + doctrine-v7) |
| CITATION.cff with correct own DOI | 2 of 13 | 13 of 13 |
| "zero sorry" false claim on Zenodo | 1 (v18 description) | 0 |
| XXXXX placeholder in live deposits | 2 (v13 deposits) | 0 (superseded by v19/v20) |
| v18 PDF body matching v18 title | 0 (body = v17) | 1 (or superseded by v20) |
| vsp-otel own deposit | 0 | 1 |
| Duplicate concept chains for same repo | 1 (lutar-lean) | 0 |
