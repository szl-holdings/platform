# 124 — INNOVATION QUEUE (MISSING/PARTIAL → severity · destination Space · concrete recipe)

**Audit date:** 2026-05-31
**Severity scale:** P0 = blocks Warhacker demo / Series-A diligence · P1 = high value · P2 = nice-to-have.
**Inputs:** `123_INSTILLATION_GAP_MAP.md`, `122_SOFTWARE_DEEP_DIVE.md`, `121_THESIS_CLAIMS_ALL_VERSIONS.md`.
**Principle:** the math (Rosie + lutar-lean + cookbook recipes) already exists; the gap is *wiring it into the customer surface (a11oy)* and *closing Rosie's last mile*.

---

## P0 — Blocks Warhacker / Series-A (5 items)

### P0-1 · Λ-Receipt Verifier page in a11oy
- **Capability:** #1/#4/#13 — Λ score + Khipu receipt DAG + DSSE verify (live in Rosie, absent in a11oy).
- **Destination:** **a11oy** (primary customer surface).
- **Recipe:** add `src/pages/ReceiptVerifier.tsx` + `src/lib/lambda.ts` (port `_eval_summation` and `dsse_verify_envelope` from `rosie_live_deployed/app.py` L88-134, L373-407 to TS). Wire into nav (`src/components/shell/`) and the Evidence Ledger page (`src/pages/fabric/EvidenceLedger.tsx`). Reuse `knot-calculus-v1/code/src/khipu-receipt.ts` verbatim (already TS).
- **Why P0:** A Series-A reviewer clicking a11oy currently sees zero of the formal moat. This is the demo-defining gap.

### P0-2 · PAC-Bayes bound calculator (live) in a11oy + Rosie
- **Capability:** #3 — TH13 McAllester-1999 bound.
- **Destination:** **a11oy** primary; mirror in **Rosie** "Live Formulas" tab.
- **Recipe:** import `knot-calculus-v1/code/src/pac-bayes-bound.ts` into a11oy `src/lib/`; add a `PacBayesGauge.tsx` card on `AgiConvergence.tsx` / `CapabilityTrajectory.tsx` with inputs (n, KL, δ, R̂) → live `upperBound` + `nonVacuous` badge. In Rosie, promote PAC-Bayes from a domain *label* (app.py L295) to a live `_eval_pacbayes()` formula with Λ-score.
- **Why P0:** PAC-Bayes is the "non-vacuous generalization bound" headline that distinguishes the thesis from hand-waving governance claims.

### P0-3 · Honest theorem-status ledger (TH10 = Conjecture 1) surfaced everywhere
- **Capability:** #2/#14 — uniqueness honesty arc; 16 TH-V18 verbatim Lean theorems.
- **Destination:** **a11oy** (`Constitution.tsx` / new `ProofLedger.tsx`) + **Rosie** (Live Formulas Lean column).
- **Recipe:** generate `src/data/proof_ledger.json` from `lutar-lean` `lakefile` + `30_LEAN_FULL_INVENTORY.md` (168 sorrys / 14 axioms / TH-V18-01..16 PROVED). Render a table: theorem · file · status (PROVED / SORRY-TAGGED / CONJECTURE / AXIOM). **Critically: label Λ-uniqueness as "Conjecture 1 (not Theorem)" per v20.**
- **Why P0:** Any live surface claiming "proved uniqueness / zero sorry" is a diligence landmine. v18 PDF metadata still claims "zero sorry"; the ledger must tell the v20 truth. This converts a liability into a credibility asset (honest-by-construction).

### P0-4 · "Have Rosie have it all" — close Rosie's 5 last-mile gaps
- **Capability:** #5 Reidemeister knot-tag · TH11 explicit verifier · QEC-governed ingress · canonical receipt byte-string emission · CSS-ingress (all named in Rosie's DOI title 20451997 but not all in live `app.py`).
- **Destination:** **Rosie** (`rosie_live_deployed/app.py` + `rosie/src/`).
- **Recipe:** add `knot-calculus-v1/code/src/knot-tag.ts` → emit 16-hex Audit-Reidemeister tag next to each Khipu DAG head; add a "TH11 Verify" button calling `_eval_summation`; wire `rosie/src/*` CSS-ingress + byte-string canonicalization into the live Gradio app (currently only in the repo, not the deployed Space).
- **Why P0:** Founder explicitly said "have Rosie have it all." Rosie is the receipt-bus σ-algebra surface; its DOI already promises these.

### P0-5 · 8-organ anatomy map (interactive) in a11oy
- **Capability:** #15 — a11oy/amaru/sentra/terra/vessels/counsel/carlota-jo/lutar-lean.
- **Destination:** **a11oy** (`src/pages/ArchitectureOverview.tsx` / `ConstellationGraph.tsx`).
- **Recipe:** port `anatomy-evolved-v1/thesis_ch9_anatomy_evolved_v1.md` organ deltas into `src/data/anatomy.json`; render the 8 organs as a graph (reuse existing `ConstellationGraph.tsx`) with per-organ Λ-axis, DOI link, and Lean-obligation status. Wire `carlota-jo` node to the live doctrine-sweep (already present).
- **Why P0:** This is the one-screen "what is SZL" that ties the whole ecosystem + thesis together for an investor.

---

## P1 — High value (5 items)

### P1-1 · Re-deposit szl-cookbook to Zenodo WITH the advanced recipes
- **Gap:** Zenodo 20436558 (v0.1.0) has the 9 skills but **NOT** `knot-calculus-v1` / `anatomy-evolved-v1` / `knot-calculus-v2`. Repo is v0.3.0+.
- **Destination:** **Zenodo** (new version on concept 20436557) + GitHub release.
- **Recipe:** cut `szl-cookbook v0.3.0` release including `recipes/`; mint new Zenodo version; update CITATION.cff + README DOI badge.

### P1-2 · Mint vsp-otel software DOI
- **Gap:** vsp-otel has no own Zenodo record (#A5).
- **Destination:** **Zenodo** + `vsp-otel` repo CITATION.cff.
- **Recipe:** tag `vsp-otel v0.2.0`, enable Zenodo-GitHub webhook, mint concept DOI; fix CITATION.cff (it previously pointed at thesis v15 DOI).

### P1-3 · Feynman path-integral + Wheeler-coherence audit visualizer
- **Capability:** #7/#9.
- **Destination:** **a11oy** (`src/pages/AuditSection.tsx`).
- **Recipe:** implement `Z_audit` monotone-decreasing sum (v18 thm:path-integral) + Wheeler chain coherence check (Λ(r) ≥ τ_min for all r) over a receipt chain; small chart showing `Z_audit^(t+1) ≤ Z_audit^(t)`.

### P1-4 · Quantum-Λ engines (POVM/KS-18/QBism) promoted from recipe to a11oy module
- **Capability:** #12.
- **Destination:** **a11oy** (`AdversarialResilience.tsx`) — fits the contextuality/no-NCHV adversarial story.
- **Recipe:** import `anatomy-evolved-v1/code/src/a11oy-povm.ts`, `a11oy-ks18-witness.ts`, `a11oy-qbist-credence.ts`; render a "no non-contextual hidden variable" adversarial-defense demo (Cabello 18/9). Tests already 25/25.

### P1-5 · agi-forecast Zenodo refresh v0.1.0 → v0.3.0
- **Gap:** #A6 stale deposit.
- **Destination:** **Zenodo** + agi-forecast repo. **Recipe:** cut v0.3.0 release, mint new version, fix CITATION.cff (currently points at thesis DOI not own).

---

## P2 — Nice-to-have (3 items)

- **P2-1 · Egyptian-fraction weight inspector** (#8) → **a11oy** `Constitution.tsx`: show the 9-axis weights as unit fractions summing to 1 (`th_v18_04`); tooltip the sexagesimal regularity (v16 IX.6).
- **P2-2 · Schur-concavity demonstrator** (#6) → **Rosie** Live Formulas: slider showing Λ increases as the axis vector becomes more uniform (majorization).
- **P2-3 · DPO LID-stability gauge** (#11) → **a11oy** `AlignmentReview.tsx`: surface the `|λ_i(π′)−λ_i(π)| ≤ L·KL` bound (TH12) as a drift gauge.

---

## Destination summary

| Space | P0 | P1 | P2 | Total actions |
|-------|----|----|----|---------------|
| **a11oy** (primary) | 4 (P0-1,2,3,5) | 2 (P1-3,4) | 2 (P2-1,3) | 8 |
| **Rosie** (exclusive receipt surface) | 2 (P0-3,4) + mirror P0-2 | — | 1 (P2-2) | 3–4 |
| **Zenodo / repos** (provenance) | — | 3 (P1-1,2,5) | — | 3 |

**Top recommendation:** Execute P0-1 → P0-3 first (Λ-Receipt Verifier + PAC-Bayes calculator + honest proof ledger in a11oy). These three convert a11oy from a breadth-only product surface into a surface that *visibly carries the formal moat* — the exact thing a Series-A technical reviewer will probe.
