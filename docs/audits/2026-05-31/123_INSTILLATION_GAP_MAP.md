# 123 — INSTILLATION GAP MAP (Thesis/Software → live a11oy + Rosie)

**Audit date:** 2026-05-31
**Question (founder verbatim):** *"has all this been instilled into a11oy and do it … then the rest for the ecosystem … and have Rosie have it all."*
**Method:** keyword presence + implementation-depth grep across the two live surfaces.
- **a11oy SPA:** `audit_.../round2/a11oy_replit_coder/build/src/` (132 pages, TS/React).
- **Rosie:** `szl/rosie_live_deployed/app.py` (979 lines, Gradio 6.x, Doctrine v9).
**Raw data:** `/home/user/workspace/zenodo_full_dive_2026-05-31/gap_map.json`

**Legend:** INSTILLED = real implementation present · PARTIAL = referenced/labelled only · MISSING = absent.

---

## Headline

- **a11oy SPA is BREADTH-rich, MATH-poor.** 132 pages of product surface (fabric cockpit, signal mesh, decision queue, evidence ledger, agent mesh, vessels/sentra verticals) but the **formal thesis math is essentially absent**: PAC-Bayes, khipu, Reidemeister, Schur, Feynman, Egyptian, Wheeler, Kraft, QEC, TH10/11/13, uniqueness, geometric-mean = **0 occurrences each**. What IS present: doctrine/carlota guards (73 files), Lean references (47 files), DPO (30 files), quantum (2 files).
- **Rosie IS the receipt-math surface.** It already carries: khipu (6), Λ (5+13), receipt (39), SummationInvariant/TH11 (4), DSSE (32), PAC-Bayes (as a formula domain), live Khipu Merkle DAG head, 5 anchor formulas with live Λ-scores, doctrine sweep (13). Rosie is the closest thing to "having it all."

**So: founder's instinct is correct — the math is NOT instilled into a11oy.** Rosie is far ahead. The instillation work is (1) bring the receipt/Λ/PAC-Bayes/khipu/knot surfaces from Rosie + the cookbook recipes INTO a11oy, and (2) close Rosie's few remaining gaps (Reidemeister knot-tag, explicit TH11 label, QEC ingress, byte-string emission, CSS-ingress).

---

## Per-Capability Gap Table

| # | Capability | Thesis ref | Software impl | a11oy | Rosie | Verdict |
|---|-----------|-----------|---------------|-------|-------|---------|
| 1 | Λ geometric-mean aggregator | v14 T1 / v18 thm:unique-aggregator | lutar-lean; rosie `_eval_*` | MISSING | INSTILLED | **PARTIAL** |
| 2 | Λ uniqueness (TH10→Conjecture 1) | v14→v20 | lutar-lean (sorry) | MISSING | MISSING | **MISSING** |
| 3 | PAC-Bayes governance bound (TH13, McAllester-99) | v15/v16/v18 | knot-calculus-v1 pac-bayes-bound.ts | MISSING | PARTIAL | **PARTIAL** |
| 4 | Khipu receipt DAG + summation invariant (TH11) | v15/v18 thv18-08 | knot-calculus khipu-receipt.ts; rosie SummationInvariant | MISSING | INSTILLED | **PARTIAL** |
| 5 | Reidemeister knot-invariant tag (R1/R2/R3) | v15/v16/v20 | knot-calculus knot-tag.ts | MISSING | MISSING | **MISSING** |
| 6 | Schur-concavity of Λ | v16/v18 thm:schur | lutar-lean (axiom A5) | MISSING | MISSING | **MISSING** |
| 7 | Feynman path-integral audit closure | v15/v16/v18 thm:path-integral | lutar-lean Feynman lineage | MISSING | MISSING | **MISSING** |
| 8 | Egyptian-fraction weight inspectability | v3/v14/v18 thv18-04 | lutar-lean Egyptian.lean | MISSING | MISSING | **MISSING** |
| 9 | Wheeler chain coherence | v17/v18 thm:wheeler-coherence | lutar-lean | MISSING | MISSING | **MISSING** |
| 10 | Shannon doctrine code / Kraft inequality | v17/v18 thv18-02/03 | carlota-jo guard; lutar-lean | PARTIAL | PARTIAL | **PARTIAL** |
| 11 | DPO LID stability (TH12) | v18 thm:dpo-stability | lutar-lean DPOFeasibility (3 sorry) | PARTIAL | PARTIAL | **PARTIAL** |
| 12 | Quantum-Λ (POVM / KS-18 / QBism) | v18 thm:quantum-lambda; anatomy-evolved | anatomy-evolved a11oy-povm/ks18/qbist | PARTIAL | MISSING | **PARTIAL** |
| 13 | DSSE envelope / receipt-bus σ-algebra | v18 governance operator | rosie dsse_verify; uds-mesh | MISSING | INSTILLED | **PARTIAL** |
| 14 | 16 verbatim-Lean TH-V18 theorems (status ledger) | v18 ch07 | lutar-lean (61 .lean) | PARTIAL | PARTIAL | **PARTIAL** |
| 15 | 8-organ anatomy map (a11oy/amaru/sentra/terra/vessels/counsel/carlota-jo/lutar-lean) | v14 ch9 / v17 | anatomy-evolved; 8 repos | PARTIAL | PARTIAL | **PARTIAL** |
| 16 | carlota-jo doctrine guard (adversarial defense) | v17 Shannon doctrine | carlota-jo-doctrine-guard.ts; rosie doctrine_sweep | INSTILLED | INSTILLED | **INSTILLED** |

---

## Tally

| Verdict | Count | Items |
|---------|-------|-------|
| **INSTILLED** | 1 | #16 doctrine guard |
| **PARTIAL** | 9 | #1, #3, #4, #10, #11, #12, #13, #14, #15 |
| **MISSING** | 6 | #2, #5, #6, #7, #8, #9 |

**a11oy alone:** INSTILLED 1 · PARTIAL 4 · MISSING 11 → a11oy is the primary instillation target.
**Rosie alone:** INSTILLED 4 · PARTIAL 5 · MISSING 7 → Rosie leads; close its 7 gaps for "have it all."

---

## What this means for the founder's directive

1. **"has all this been instilled into a11oy?"** → **No.** a11oy carries doctrine guards + Lean badges but none of the receipt/Λ/PAC-Bayes/khipu/knot/Feynman/Egyptian/Wheeler math. 11 of 16 capabilities are MISSING from a11oy.
2. **"and do it if it helps"** → Yes, high-value. The math is the moat; a11oy is the customer-facing surface. Wiring Rosie's receipt engine + the cookbook recipes into a11oy is the single biggest credibility upgrade. See `124_INNOVATION_QUEUE.md`.
3. **"have Rosie have it all"** → Rosie is ~70% there. Remaining: Reidemeister knot-tag, explicit TH11 verifier UI, QEC-governed ingress, canonical byte-string emission, CSS-ingress (all already in rosie's *repo* per its DOI title, but not all wired in the live `app.py`).
