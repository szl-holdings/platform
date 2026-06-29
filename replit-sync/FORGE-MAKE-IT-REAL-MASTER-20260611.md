# FORGE MASTER ORDER — "MAKE IT ALL REAL & OPERATIONAL (FULL PYTHON)"
**Issued:** 2026-06-11 (T-5 to Defense Unicorns Warhacker, June 16–19 2026)
**From:** CTO (Computer) on behalf of founder Stephen P. Lutar Jr., SZL Holdings
**Scope:** a11oy + killinchu + anatomy + szl-papers + lutar-lean + platform — entire estate
**Prime directive:** Every thesis formula and every served surface must be REAL, deterministic Python (or honestly labeled when a secret/artifact is genuinely gated). No bandaids. No fabricated data. No weakened gates.

---

## 0. ABSOLUTE DOCTRINE HARD GATE — every dev honors this, no exceptions
- **locked-proven = EXACTLY 8** {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel `c7c0ba17`. Never 5, never 9.
- **Λ unconditional uniqueness = Conjecture 1** (machine-checked FALSE). Conditional **Theorem U** (axiom-free) is fine. **Λ-v5 = engineering gate, PROPOSED — NOT the formal Λ.** Holographic Λ bound = Conjecture 3. **Khipu BFT = Conjecture 2** (Wave23 conditional fine).
- SLSA: never bare L3/FedRAMP/IronBank/CMMC/ATO without the word "roadmap". Honest state = **SLSA L1+L2 attested, L3 roadmap.**
- NO user-visible codenames (amaru/rosie/sentra/jarvis) in served HTML/prose. Internal API-alias/sanitization tables are OK. Agent surface = **Chaski**.
- Trust **never 100%**. 0 runtime CDN. killinchu effector **SIMULATED**. Jack Kruse = **NARRATIVE only**.
- GitHub ↔ HF **byte-identical** on every shared top-level module. `ast.parse` every `.py` before push. **NEVER commit a key.** No Lean self-merge. No `sorry` in Lean proofs.

---

## 1. WHAT "REAL" MEANS HERE (read before touching anything)
The estate is already mostly real. As of 2026-06-11 the audit confirms:
- **a11oy CI is FULLY GREEN** (Tests, Doctrine, both drift guards, GHCR push, SBOM, Trivy/Grype, Scorecard — all success).
- **36 formulas** registered in `szl_formulas.py`; **quantum-bio** module `szl_quantum_bio.py` exposes REAL Python: `pmf`, `pmf_two_ion`, `lindblad_coherence_series`, `radical_pair_yield`, `compass`, `lambda_v5` at `/api/<ns>/v1/qbio/{pmf,coherence,compass,lambda,summary}`.
- The brain (`szl_brain.py`) tier-selection + Λ-receipt math is **real and deterministic**; only the LLM `response` string is an HONEST STUB because no model key is wired into the Spaces.

So "make it real" = **(A) close the genuine stubs that CAN be closed with math/live data, (B) wire the founder-gated secrets/artifacts the moment they exist, (C) verify every tab renders real output, (D) do NOT fabricate anything that needs a gated credential — keep it honestly labeled.** A labeled honest stub is CORRECT, not a defect.

---

## 2. FULL-PYTHON FORMULA PASS (thesis → code, deterministic, tested)
For EVERY formula in the v5 thesis (`szl-papers/papers/SZL_THESIS_v5.md`) and the locked-8, ensure there is a real, deterministic Python implementation with a unit test and a live endpoint. Concretely:

1. **Audit `szl_formulas.py` + `szl_quantum_bio.py` + `szl_v4_formulas.py` + `szl_puriq_formulas.py`** against the thesis formula list. For each formula produce: `def name(...) -> value` (pure, no network), a docstring citing the source DOI/arXiv, and a `pytest` case asserting the verified numeric (e.g. pmf single = **119.28 mV**; two-ion w=0.18,d_pK=0.30 = **121.5 mV**; Lindblad τc≈**6.05**; Λ-v5 = coherence·charge ≥ λ_min=0.25).
2. **No symbolic-only placeholders.** If a thesis formula is currently prose-only, implement it in Python and register it via the canonical `reg(...)` path so it surfaces in the Formulas tab AND has an API route. If a formula genuinely cannot be computed without a gated input, expose it returning a labeled `{"status":"awaiting_input", ...}` — never a fake number.
3. **Keep VERIFIED / PROPOSED / NARRATIVE tags** exactly as in the thesis. F-numbers must map 1:1 between thesis, `szl_formulas.py`, the Lean files in `lutar-lean/Lutar/`, and the live `/api/.../formulas` payload.
4. **byte-identical**: any shared formula module edited in a11oy must be the identical bytes in killinchu.

## 3. WIRE EVERY TAB TO REAL DATA (both apps, all tabs)
- a11oy `/console` (144 tabs) + killinchu `/elite` (107 tabs): walk EVERY tab via `window.go(key)`. Each must render real output (body textLen > 200, no JS pageerror, graph tabs have svg/canvas).
- Any tab still showing placeholder/lorem/empty → wire it to its real backend endpoint (live arXiv/GitHub/feeds for research tabs; deterministic formula endpoints for math tabs; the qbio routes for the quantum-bio tabs). Use the **null-safe `H()/setHTML()/elS()`** helpers in async paths — never bare `E('id').innerHTML=`/`.onclick=`.
- Every action button: click-test → real output vs dead/throw/404. Wire dead buttons to real backends or hide controls that are not-yet-wired (honest, not fake).
- killinchu effector stays **SIMULATED** and labeled.

## 4. 3D / VISUAL PASS
- Upgrade all 3D surfaces (anatomy v5, a11oy gemstones_frontier/abacus_manifold/ouro_spiral/consensus_basin, killinchu live-wires) on the **vendored** three.js/echarts-gl/3d-force-graph — **0 runtime CDN**.
- anatomy v5: keep 11 organs / 59 formulas, locked-8 intact, coherence/bioenergetic/Λ-v5/radical-pair-compass layers live, doctrine banner correct.

## 5. THE GENUINELY-GATED LEVERS (wire the MOMENT the secret/artifact exists — do NOT fake)
1. **`SZL_LOCAL_LLM_URL`** brain secret (Qwen2.5-Coder-32B-AWQ) → flips Chaski from HONEST STUB → live `response`. Until then keep the labeled stub.
2. **Zenodo DOI token** → mint v5 thesis DOI, update `szl-papers/CITATION.cff` (currently generic).
3. **GHCR push token** → killinchu uds-v0.2.0 image (only RED CI on killinchu).
4. **Hetzner root redeploy** on 167.233.50.75 (a-11-oy.com autodeploy script).
5. **cosign / Rekor** signing for uds-v0.3.0 (HARD LIMIT — approval, never auto).
6. **Lean lake build** to regenerate `VERIFIED_THEOREMS.md` (no self-merge).

## 6. OPEN-PR HYGIENE (do these in Forge env)
- **a11oy #303** ("align locked-proven to 8"): carries a STALE Dockerfile diff that would REVERT the `A11OY_REQUIRE_LOCAL_LLM` BUILD_ERROR fix and re-introduce the 40-min boot hang. **REBASE onto current main** (drop the Dockerfile hunk) before merge — or close and re-cut. DO NOT auto-merge as-is.
- **platform 12 RED CI**: root cause = `moduleResolution: node16/nodenext` requires explicit `.js` extensions on relative imports (`./organizations` → `./organizations.js`). Mechanical fix across the TS sources; re-run vitest/typecheck/e2e/Lighthouse.
- **lutar-lean #221/#223/#224**: #221 (anchor CI-green theorems) and #223 (EXPERIMENTAL ADS-B frontier) are lake-gated; #224 is dirty/conflict → rebase. No self-merge.

## 7. VERIFICATION GATE (Forge must prove, not assert)
For every change: `ast.parse` the `.py` → push GitHub → mirror byte-identical to HF Space → factory-restart affected Space → re-walk the affected tabs live with Playwright → confirm both drift guards + Doctrine + Tests stay GREEN. Re-verify GitHub `git/trees/main?recursive=1` blob shas match HF for all shared modules. Report shas + live URLs in the handoff.

## 8. DELIVERABLE BACK TO CTO
Write `platform/replit-sync/FORGE-RESULT-make-it-real-<date>.md` listing: formulas now backed by Python+test (with F-numbers), tabs wired (key → endpoint), 3D upgrades, PRs rebased/merged, which gated levers are still awaiting a secret, and the final all-green CI + live-URL proof.

**HARD GATE reminder:** anything needing a cosign-signed artifact, Rekor, warn→enforce, uds re-sign, or a MAJOR dep bump → STOP and notify the founder for approval. Never auto.
