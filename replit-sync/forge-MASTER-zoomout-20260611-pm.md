# FORGE MASTER ORDER — Full Zoom-Out Synthesis (2026-06-11 PM, T-5 to Warhacker)

**From:** CTO/Computer · **To:** Forge. Supersedes the earlier two orders for the OPEN items. Built from a full two-dev gap audit (apps + infra/governance). NO BANDAIDS, full Series-A.

## STATE OF THE ESTATE (verified live this session)
**Healthy / done — do not redo:**
- Three new formula modules LIVE byte-identical both apps + HF, all endpoints 200: **scaling** (Kleiber), **allodial** (Allodial AI: 𝒜-score/DCI/lattice/non-interference), **entanglement** (capacity bound E_max(t)≤C0·e^(−γt), concurrence/negativity/CHSH/monogamy). Plus a unified **Formula Atlas** index tab.
- **2 Lean theorems MERGED** to lutar-lean main: Allodial order-theory (#229, `783a38d0`) + Entanglement capacity-bound (#230, `7b344e11`). No sorry, no new axioms, EXPERIMENTAL_SCOPES → **locked stays EXACTLY 8**. lutar-lean CI green.
- **Auto-DOI write-back Action** shipped to szl-papers/.github (resolves Zenodo-minted DOI on release → writes CITATION.cff + README badge → opens PR). Zenodo↔GitHub webhook already active.
- a11oy 152 views + killinchu 118 views all render (0 real JS errors, 0 visible codenames). 37 shared modules byte-identical GitHub↔HF. 3 Spaces RUNNING. szl-uds-deployment CI all green.
- Agent already fixed this session: a11oy doctrine CI red (root-caused green), a killinchu↔HF entanglement drift (re-synced), CITATION.cff → honest v8 status.

## OUTSTANDING — FOUNDER/FORGE-GATED (ranked; never auto-do the signed/sudo ones)

**1. HETZNER REDEPLOY (sudo — #1 visible gap).** a-11-oy.com now serves scaling/* + allodial/* at 200 but **404s on entangle/*** (one redeploy behind HF). Run `box-scripts/a11oy-rebuild` on 167.233.50.75 → pull current main → serve entangle/* + the Entanglement + Formula Atlas tabs. Re-verify `/api/a11oy/v1/entangle/summary` = 200 on a-11-oy.com.

**2. ZENODO DOI for thesis v8 — CONCEPT-ID NEEDS CONFIRMATION FIRST.** The auto-write-back Action + `.zenodo.json` currently stage v8 under concept `20020842`, which the audit found is the **GraphRAG-paper lineage, not the thesis lineage**. BEFORE minting: founder confirms the correct concept DOI for the SZL Thesis series (or mints fresh). Then: enable/confirm Zenodo OAuth for szl-papers, cut a GitHub Release `thesis-v8.0.0` → Zenodo auto-mints → the write-back Action writes the DOI into CITATION.cff + badge. Fix the `ZENODO_CONCEPT_ID` in `.github/workflows/doi-writeback.yml` to the confirmed id.

**3. UNIFIED L6 CHAIN-OF-TITLE RECEIPT (the differentiator — partly buildable).** Design: one `szl.*.receipt` per release embedding cosign image digest + Rekor log entry + Zenodo DOI + the merged Lean theorem refs. Forge CAN build the non-signing ASSEMBLER (collects digest+DOI+Lean refs into the receipt JSON). The cosign/Rekor SIGNING of that receipt is founder-gated. Attaching a DOI to the UDS bundle release is also part of this.

**4. a11oy UDS bundle RE-PUBLISH (env-gated — Forge can do).** Still STALE (built against old organ image). Re-publish via `.github` `uds-canonical-bundles-publish.yml` (bundle=a11oy), re-verify new digest, update MESH_READY digest line. cosign re-sign sub-step = founder-gated → flag.

**5. HETZNER-CURRENCY CI GUARD (Forge can do — prevents recurrence).** Add a smoke check comparing a-11-oy.com's endpoint set vs HF (assert scaling/allodial/entangle/summary all 200 on BOTH); honest WARN if Hetzner lags (redeploy is sudo-gated). This would have caught #1 automatically.

**6. SURFACE THE 2 MERGED LEAN THEOREMS downstream (Forge can do, carefully).** Allodial #229 + Entanglement #230 should appear in the thesis "experimental theorems" section + the app honest-tab — but DO NOT inject them into the auto-generated VERIFIED_THEOREMS.md (that would weaken the honesty gate; the audit correctly left it alone). Add an honest "EXPERIMENTAL machine-checked (not locked-8)" index instead.

**7. (carryover, founder-gated):** oqs-python PQ keys (PQ-provenance PROXY→real ML-DSA-65), SZL_LOCAL_LLM_URL brain secret (Chaski stub→live), MAJOR dep bumps, uds-v0.3.0 cosign re-sign.

**8. (cosmetic, Forge can do):** vendor KaTeX .woff fonts on killinchu (2 cosmetic 404s; woff2 works); regenerate stale team/A11OY_TABKEYS.txt.

## DOCTRINE (unchanged hard gate)
locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17. Λ uniqueness = Conjecture 1 (never theorem). Allodial / Entanglement-capacity / Λ-v5 = PROPOSED engineering gates, NOT formal Λ. No bare SLSA L3/FedRAMP/IronBank/CMMC/ATO without "roadmap". No user-visible codenames; agent = Chaski. Trust never 100%; 0 runtime CDN; no fabricated data; GitHub↔HF byte-identical on shared modules; ast.parse before push; NEVER commit a key; NEVER weaken/silence a gate; no Lean self-merge. Reject sovereign-citizen "land patent" framing.

## REPORTING
Append results to a dated forge report in platform/replit-sync/. SYNC_STATUS.md entry for any HF-served file change.
