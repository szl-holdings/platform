# FORGE ORDER — Allodial AI rollout + gated items (2026-06-11, T-5 to Warhacker)

**From:** CTO/Computer · **To:** Forge. Companion to `forge-MASTER-fullchain-20260611.md`. NO BANDAIDS.

## WHAT THE AGENT ALREADY SHIPPED (do not redo)
- **`szl_allodial.py`** — Allodial AI sovereignty formulas, byte-identical both apps (blob `f29169e1`) + mirrored to `platform/replit-sync/szl_allodial.py`. Self-test 14/14. Formulas: EU-CSF SovScore + HHI/DCI (Dependency Concentration Index), Goguen-Meseguer(1982) non-interference check, Denning(1976) lattice position, Allodial Score 𝒜∈[0,100]. Every formula cited to its real author; PROPOSED/EXPERIMENTAL tier; locked-8 untouched; Λ stays Conjecture 1.
- **`Lutar/Allodial.lean`** — 5 machine-checked order-theorems (allodial_dominates_all, allodial_iff_top, feudal_has_overlord, galois_preserves_allodial, ni_low_independent_of_high) — a Lean dev is lake-verifying + opening a SIGNED PR now. **Founder merges Lean only.**
- **Backend register + Doctrine/Score surface + living-3D Sovereignty tab** — two Opus full-stack devs wiring a11oy + killinchu now (endpoints `/api/<ns>/v1/allodial/*`, doctrine surface, 3D control-lattice viz). UDS MESH_READY gets an honest "Allodial posture" section.
- **Allodial AI doctrine one-pager** at `team/ALLODIAL_AI_DOCTRINE.md` (honest, cited, rejects sovereign-citizen fringe).

## OUTSTANDING — FOUNDER/FORGE-GATED (itemized; never auto-do the signed/sudo ones)

**1. HETZNER REDEPLOY (sudo — Forge/founder).** a-11-oy.com is UP but STALE: it 404s on `/api/a11oy/v1/scaling/summary` and will 404 on the NEW `/api/a11oy/v1/allodial/*` until redeployed. Run `box-scripts/a11oy-rebuild` on 167.233.50.75 so Hetzner pulls current main and serves scaling + allodial endpoints + the new console tabs. Re-verify both endpoint families = 200 and the Allodial/Sovereignty tabs render on a-11-oy.com/console. (This is the #1 visible gap; same redeploy clears both scaling AND allodial.)

**2. ZENODO DOI for Thesis v8 (founder Zenodo token — "GitHub DOIs style").** The GitHub→Zenodo workflow is the right one and is STAGED: `szl-papers/.zenodo.json` (v8 metadata, related concept DOI 10.5281/zenodo.20020841 as isNewVersionOf) + `CITATION.cff` (notes "DOI pending Zenodo mint"). TO MINT, GitHub-DOIs style: (a) ensure the Zenodo↔GitHub integration is enabled for `szl-holdings/szl-papers` (founder authorizes Zenodo OAuth); (b) cut a GitHub Release (tag e.g. `thesis-v8.0.0`) — Zenodo auto-mints a versioned DOI under the concept DOI; (c) write the minted DOI back into CITATION.cff (`doi:` field) + add the DOI badge to the szl-papers README; (d) cross-link the DOI from the a11oy Doctrine surface + the new Allodial tab. Requires founder Zenodo authorization → FORGE coordinates, founder authorizes.

**3. LEAN PR MERGE (founder — doctrine: no Lean self-merge).** The Allodial order-theory PR (branch `allodial/order-theory-proposed`) will be lake-verified GREEN. Founder merges (squash). If a parent commit lacks DCO sign-off, founder rebases/amends or admin-merges (same pattern as PR #225).

**4. (carryover) cosign/Rekor uds-v0.3.0 re-sign, oqs-python PQ keys, SZL_LOCAL_LLM_URL brain secret, MAJOR dep bumps** — unchanged, founder-gated.

## DOCTRINE (unchanged hard gate)
locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17. Λ uniqueness = Conjecture 1 (never theorem). Allodial frame + 𝒜 score = PROPOSED engineering gate, NOT formal Λ. No bare SLSA L3/FedRAMP/IronBank/CMMC/ATO without "roadmap". No user-visible codenames; agent = Chaski. Trust never 100%; 0 runtime CDN; no fabricated data; GitHub↔HF byte-identical on shared modules; ast.parse before push; NEVER commit a key; NEVER weaken a gate; no Lean self-merge. REJECT sovereign-citizen "land patent" framing — Allodial AI is architectural+governance, anchored to real statutes/standards.

## REPORTING
Append results to a dated forge report in `platform/replit-sync/`. SYNC_STATUS.md entry for any HF-served file change.
