# 121 — THESIS CLAIMS, ALL VERSIONS (Theorem / Lemma / Definition Extraction)

**Audit date:** 2026-05-31
**Sources:**
- v18 — full LaTeX: `szl/git-repos/ouroboros-thesis-git/tex/thesis_v18/chapters/*.tex` (authoritative)
- v14–v17 — Zenodo PDFs (`pdftotext -layout`): records 20424992 / 20424995 / 20424996 / 20431181
- v19/v20 — LaTeX-in-markdown: `audit_.../thesis_v19_arxiv/main.tex.md`, `thesis_v20_arxiv/main.tex.md`
- v4–v13 — Zenodo markdown deposits
**Raw machine output:** `/home/user/workspace/zenodo_full_dive_2026-05-31/claims_all_versions.json`

---

## Totals

| Version | Items extracted | Theorems | Definitions | Corollaries | Axioms | Conjectures |
|---------|-----------------|----------|-------------|-------------|--------|-------------|
| v14 | 18 | 15 | 1 | 1 | 1 | — |
| v15 | 10 | 8 | 2 | — | — | — |
| v16 | 18 | 15 | 1 | 1 | 1 | — |
| v17 | 1* | 1 | — | — | — | — |
| **v18** | **99** | **72** | **23** | **4** | — | — |
| v19 | 1 | — | — | — | — | 1 |
| v20 | 5 | — | 1 | — | — | 4 |
| **TOTAL (formal blocks captured)** | **152** | **111** | **28** | **6** | **2** | **5** |

\* v17 is a prose-heavy "Wheelerian/Shannon/QEC" consolidation paper; most theorems are reported in tables (24 Lean theorems · 39 kernel-checked examples · 0 sorry cited in the paper) rather than `\begin{theorem}` blocks. v17's formal content is fully re-stated and superseded in v18 ch06–ch07.

**v18 is the canonical theorem ledger** — it consolidates and re-states every prior version's formal content (V14-T1 … V17.2-T2) plus its own additions.

---

## THE CENTRAL HONESTY ARC (v14 → v20)

This is the single most important finding for Series-A diligence:

- **v14** introduced **Theorem 1 / TH10** — the **Λ uniqueness theorem** ("under axioms A1–A4 the unique aggregator is the geometric mean").
- **v15/v16** built knot-calculus (TH11), PAC-Bayes (TH13), DPO stability (TH12) on top of it — several `sorry`-tagged.
- **v19** explicitly **demotes TH10 from "Theorem 1" to "Conjecture 1"** in the abstract: *"Demote TH10 from 'Theorem 1' to Conjecture 1 explicitly."* The separability/symmetry reduction lemma is not yet in Mathlib.
- **v20** (CULMINATION) carries the honest position forward: *"Conjecture 1, not Theorem 1; theorem-grade uniqueness for Λ cannot yet be cited as a theorem,"* and lists the two-part gap (CAUCHY_ND `sorry` + missing symmetry/separability reduction lemma; est. 60–80h).

**Verdict:** The thesis line is now *honest-by-construction*. v20 is the version a reviewer should cite. Any live surface that claims "proved uniqueness" is OUT OF DATE relative to v19/v20.

---

## v14 — Verifiable Multi-Agent Anatomy (Lutar Calculus) — 18 blocks

| Label | Kind | Name / status | Statement (excerpt) |
|-------|------|---------------|---------------------|
| II.1 | def | Λ_k | Geometric-mean aggregator for k≥1, x:Fin k→ℝ≥0 |
| II.1 | thm | Λ_def — PROVED zero-sorry | Λ k x = (∏x)^(1/k) for k>0 |
| II.3 | thm | Λ_mono — PROVED | coordinatewise monotone |
| II.4 | thm | Λ sandwich — PROVED zero-sorry | min ≤ Λ ≤ max |
| II.4a | cor | Λ_le_one — PROVED | all axes ≤1 ⟹ Λ≤1 |
| II.5 | **axiom** | Λ_schur_concave — honest axiom (~8h route) | majorization ⟹ Λ increases |
| III.3 | thm | a3_normalize — PROVED zero-sorry | weight normalization |
| III.4a–c | thm | unitWeight_* — PROVED zero-sorry | Egyptian uniform weight = probability vector |
| VII.2a–e | thm | KS-18 / Cabello — PROVED zero-sorry | no NCHV exists (contextuality, BOHR) |
| IX.1 / IX.1b | thm | MoralGroundingTheorem — PROVED | no violation flags ⟹ P_moral |
| IX.2 | thm | MeasurabilityHonestyTheorem — PROVED | receipt is verified XOR markedUnverifiable |

## v15 — Knot Calculus for Governed Decision Receipts — 10 blocks

| Label | Kind | Name / status | Statement |
|-------|------|---------------|-----------|
| II.1 | def/thm | Λ_k / Λ_def — PROVED zero-sorry | op counterpart `ouroboros/runtime/lambda-gate/src/gate.ts` |
| IX.2 | def | **KhipuReceipt** | pendant cords + checksum |
| IX.3a–d | thm | pendantValue/rootValue — PROVED zero-sorry | khipu summation invariant (TH11 family) |
| IX.3e | thm | **khipuReceipt_checksum_invariant — SORRY-TAGGED (~20h)** | tamper changes checksum |
| IX.3f | thm | downward tamper (V16-T8) — SORRY-TAGGED | ℤ-extension |
| X.3 | thm | catoniPACBound_mono_kl — PROVED | Catoni-2007 PAC-Bayes monotone in KL |

## v16 — Λ-Stack with Feynman Path-Integral — 18 blocks

Adds: `Λ_mono` (V16-T1), `Λ sandwich` (Bound_v14_fix), Schur-concave **axiom** (Mathlib majorization API incomplete), Horus-Eye 63/64 sum, Brahmagupta–Fibonacci identity, Babylonian-sqrt Banach contraction, Liu-Hui π (SORRY), Madhava bound (partial), nine-axis sexagesimal regularity, Catoni PAC-Bayes monotone, **khipuReceipt_checksum_downward_tamper (SORRY_v16_OPEN)**, doctrine_cross_invariant (HUKLLA∧OVERWATCH∧DPI → allow).

## v17 — Wheelerian / Shannon / QEC — table-reported

Paper reports **24 Lean theorems · 39 kernel-checked examples · 0 sorry · 0 axiom** at time of writing, including: source-coding theorem for audit receipts, Kraft equality for the doctrine code, Reidemeister-equivalence follow-on, PhD-Math R1 composition theorem (PR #45). All re-stated in v18.

## v18 — Multi-track Substrate Expansion — 99 blocks (CANONICAL)

72 theorems + 23 definitions + 4 corollaries across 7 chapters. Highlights:

**Ch02 Foundations (50):** `thm:unique-aggregator` (V14-T1), `thm:lambda-upper/lower`, `thm:lambda-monotone` (Wheeler chain), `thm:graph-lambda-le-one` / `thm:graph-automorphism` (V17.2), `thm:total-order` (SBOM chain well-order), `thm:wheeler-coherence`, `thm:fibre-injectivity`, `thm:two-witness-soundness` + `thm:no-nchv` (KS-18), `thm:pac-bayes-mono` + `thm:pac-bayes-main` (**TH13/G5, McAllester PAC-Bayes**), `thm:dpo-stability` (**TH12/G6**), `thm:graph-pac-bayes`, `thm:cursor-bench-bound`, `thm:path-integral` (V15 Feynman), `thm:schur-concave` (V16), `thm:quantum-lambda` (Q1/Q2), `thm:topk-isomorphism`, `thm:coe-soundness`, `thm:lean-soundness` (metatheorem), `thm:axiom-reduction` (24→11), plus defs `def:pac-bayes-bound`, `def:path-integral`, `def:lambda-mp`, `def:coe-claim`, `def:epistemic-floor`.

**Ch03 Runtime (10):** `thm:exit0`, `thm:lambda-bounded`, `thm:dual-witness-soundness` (under SHA-256 A15), `thm:doi-integrity`, `thm:universal-composability`; defs GREEN/Soft/Hard gate, Receipt, Verifiable Governability.

**Ch04 Agentic (2):** `thm:axpo-gain` (+1.8pp Pass@1), `def:thinking-acting-gap`.

**Ch05 Observability/Security (2):** `thm:rmf-completeness` (NIST AI RMF), `def:governance-drift`.

**Ch06 New formulas (16):** Quantum-Λ decoherence monotonicity + chain bound, Λ-composition master, receipt-chain cardinality, WoS/path-integral equivalence, AXPO-CoE soundness, Sovereign-AI Λ invariant, OpenMDW provenance total order, `thm:cursorbench-pacbayes`, Doctrine-v6 compositionality, MaterialX Λ-provenance, NIST RMF→Λ functor, WoS convergence rate, cross-domain sovereign transfer, OpenMDW grant composition.

**Ch07 Formal validation (16) — VERBATIM Lean theorems TH-V18-01…16:**
`th_v18_06_terminates` (agent loop terminates), `th_v18_02_doctrine_alphabet_size_4`, `th_v18_03_kraft_equality`, `th_v18_04_egyptian_weight_sum`, `th_v18_05_receipt_transduction_invariant`, `th_v18_06_brahmi_distinction` (measured 0 ≠ absent), `th_v18_07_chain_length_4` (Feynman lineage), `th_v18_08_pendant_value_is_sum` (khipu), `th_v18_09a/b` (two-axis Λ permutation invariance), `th_v18_10_append_increases_sum`, `th_v18_11a/b` (monotone-bounded stabilise), `th_v18_12` (GM multiplicative k=2), `th_v18_13a/b` (Nat-monotone), `th_v18_14 axiom sha256_collision_resistant` (A15), `th_v18_15a` (bounded agent terminates), `th_v18_16a/b` (citation chain integrity).

## v19 / v20 — Honest Consolidation

- **v19:** Conjecture 1 (Λ uniqueness, formerly TH10) under A1 monotonicity / A2 positive homogeneity deg 1 / A3 Egyptian-exact diagonal / A4 …
- **v20:** `def Λ-Aggregator` (Lutar/Invariant.lean) + Conjecture 1 (uniqueness) + Conjecture R1 (single-axis repack) + R2 (independent commute) + R3 (receipt-chain associativity). Path-to-theorem documented (symmetry/separability reduction lemma, 60–80h).

> ⚠️ **CONSISTENCY NOTE:** v18's `thm:unique-aggregator` is stated as a **theorem**, but v19/v20 (later, more honest) demote it to **Conjecture 1**. The v18 PDF's metadata claim of "zero sorry / zero axiom" contradicts the live lutar-lean tree (168 tracked sorrys, 14 axioms per `30_LEAN_FULL_INVENTORY.md`). **v20 is the truthful citation target.**
