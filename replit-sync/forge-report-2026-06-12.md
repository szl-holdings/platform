# Forge execution report — outstanding Forge-doable items audit + Lean index

**Date:** 2026-06-12
**Against:** `replit-sync/forge-FINAL-20260611-night.md` (latest CTO order; supersedes the PM zoom-out for OPEN items)
**Operator:** Forge (Replit task agent · GitHub `Carlota-1` / org-owner token)

## Audit — how many Forge-doable items were actually left
Re-checked live GitHub state of every OPEN item in the FINAL night order:

- **L6 unified chain-of-title receipt assembler** — already BUILT (`replit-sync/szl_chain_of_title.py`, non-signing, honest UNSIGNED/PROXY labels). WIRED into killinchu, **NOT yet into a11oy** (parity gap — flagged below, not blindly pushed into the 1MB concurrently-edited a11oy console this pass).
- **K9 ops UI prototype** — already STAGED (`replit-sync/k9/`: `k9_console.html`, `k9_ops_feeds.py`, README).
- **Surface the 3 merged Lean theorems downstream (thesis half)** — was genuinely NOT done (0 hits in a11oy/szl-papers). **DONE this session** (below).

## DONE this session
**Thesis-side EXPERIMENTAL machine-checked index** — created `szl-papers/thesis/EXPERIMENTAL_LEAN_THEOREMS.md` (new, additive; does NOT touch the auto-generated `VERIFIED_THEOREMS.md`). Honestly indexes the three merged, lake-verified, EXPERIMENTAL-tier Lean backbones with real PR + merge-commit refs:
- Allodial `Lutar/Allodial.lean` — PR #229 @ `783a38d0`
- Entanglement `Lutar/Entanglement.lean` — PR #230 @ `7b344e11`
- Neuroplasticity `Lutar/Neuroplasticity.lean` — PR #231 @ `9a0dcc77`

Honesty boundary stated explicitly: locked stays EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22}; Λ-aggregator uniqueness remains **Conjecture 1 (OPEN)**; these are PROPOSED backbones, not formal Λ, not locked theorems. Overclaim-safe wording (no unconditional-proof claims).

## Flagged — Forge-doable but deferred (collision/honesty-sensitive)
- **a11oy honest-tab half of the Lean index** + **a11oy chain-of-title parity** — both touch the live, concurrently-written a11oy `console.html` / served `serve.py` (sibling-active, hf-sync auto-mirror). Recommend the parent or a single-owner window apply these to avoid clobbering; ready to pick up if assigned the window.

## Founder-gated (cannot auto-do — need a founder decision/credential)
1. **Zenodo DOI mint** — staged concept `20020842` is the GraphRAG lineage, not the SZL Thesis lineage; minting would poison the chain. Needs founder to confirm/mint the correct concept DOI, then set `ZENODO_CONCEPT_ID` in `doi-writeback.yml` + cut Release `thesis-v8.0.0`.
2. **a11oy UDS bundle re-publish + cosign re-sign** — re-publish is env-gated (needs UDS/Zarf/Docker/registry); the cosign re-sign sub-step is founder-gated.
3. **Carryovers** — cosign/Rekor `uds-v0.3.0` re-sign; oqs-python PQ keys; `SZL_LOCAL_LLM_URL` brain secret; MAJOR dep bumps; SIGNING of the L6 receipt (assembler is built; signing gated).
4. **FairWave / Proxima BFT** — propose-only per the order; not implemented.

## Honesty / invariants honored
- locked = EXACTLY 8; Λ uniqueness = Conjecture 1; no user-visible codenames (agent = Chaski); no key committed; no CI gate weakened; no Lean self-merge; no fabricated commit/solver data (all refs verified live).

— Forge
