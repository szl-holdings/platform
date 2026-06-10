# PROOF_STRATEGY_V2 — PURIQ Formal Proof Strategy (Lean 4 + Mathlib)

**Author:** Proof-research subagent (SZL Holdings)
**Date:** 2026-06-06
**Scope:** A build-ready proof-strategy doc for the Lean engineering team. Covers (1) the F23 Λ-aggregator uniqueness attack plan with exact Mathlib lemmas, (2) per-formula proof routes for the PURIQ "agentic" formula pack F1–F23, (3) a defensible target proven-count with honest caveats.

---

## 0. HONESTY DOCTRINE (must be preserved verbatim downstream)

This document never upgrades a conjecture to a theorem and always discloses declared axioms. Three honesty facts are load-bearing and **must survive any summarization**:

1. **The locked kernel proves exactly 5 formulas** sorry-free in the counted scope: **{F1, F11, F12, F18, F19}**. The experimental pass that discharged F1–F22 in `Lutar/Puriq/Formulas/` (Mathlib-free) was **excluded from the locked count** and stays excluded until re-audited.
2. **F23 = Λ uniqueness = "Conjecture 1." It is NOT a theorem.** Worse than "open": as currently axiomatized, **the unconditional uniqueness statement is FALSE** (see §1.2). The in-tree `knowledge.json` marks `TH_L1 Λ_uniqueness` as `"maturity":"proven"` — **that label is incorrect and must be corrected to `conjectured`** (see §4.3).
3. **Declared crypto axioms are honest only if disclosed.** F13′ and F14 depend on `hash_collision_resistant` and `ecdsa_unforgeable`. These are *idealizations*, not proofs of cryptographic hardness, and must always be reported as declared axioms in any `#print axioms` ledger.

---

## 1. F23 — THE Λ-AGGREGATOR UNIQUENESS CONJECTURE

### 1.1 The claim and the axioms

The Lutar invariant is the equal-weight geometric mean
\[
\Lambda_k(x) \;=\; \Big(\textstyle\prod_{i=1}^{k} x_i\Big)^{1/k}
\]
(the "Egyptian unit-fraction weights" are the equal exponents \(1/k\)). The conjecture claims \(\Lambda_k\) is the **unique** aggregator satisfying a list of axioms. The task states the axiom set as {idempotence, monotonicity, symmetry, zero-absorption, 1-homogeneity}. The in-tree formalization (`Lutar/Axioms.lean`, used by `Lutar/Uniqueness.lean` and `Lutar/Round13/Lambda_Uniqueness.lean`) uses **A1–A5**:

| Axiom | Name | Meaning |
|---|---|---|
| A1 | `IsMonotone` | monotone in each argument |
| A2 | `IsHomogeneous` | 1-homogeneous: \(\Phi(c\cdot x)=c\,\Phi(x)\) |
| A3 | `IsEgyptianExact`/normalize | idempotence: \(\Phi(c,\dots,c)=c\) |
| A4 | `IsBounded` | bounded above by the max axis |
| A5 | `IsPermutationInvariant` | symmetry |

(The `lambda-bounty` variant uses A1 idempotent / A2 monotone / A4 zero-absorbing over `Fin 9 → Nat`; the same gap applies.)

### 1.2 ⚠️ HONEST CRUX: uniqueness is FALSE under A1–A5 as stated

Two **machine-checked, sorry-free counterexamples already exist in-tree** and must not be ignored:

- `team/proof_work/ref/Lambda_Uniqueness.lean` proves `maxAgg (x) = x₀ ⊔ x₁` satisfies A2/A3/A5 (and A1/A4) yet `maxAgg_ne_Lambda : maxAgg ≠ Λ 2` (evaluated at `(4,1)`: max = 4, geometric mean = 2). Fully proved, no sorry.
- `team/proof_work/f23/A4Counterexample.lean` and `team/proof_research/Conjecture1_Refutation.lean` exhibit `aggMin` (min over 9 axes) vs `aggMaxZ` (0 if any axis 0 else max) — both satisfy the bounty's A1/A2/A4, disagree on a zero-free witness, proved by `decide`.

**Consequence:** `lambda_unique : ∀ Φ, LutarAxioms Φ → Φ = Λ k` is *not provable* because it is *not true* under A1–A5. The honest sorry in `Lambda_Uniqueness.lean` is tagged `FACTORIZATION_AXIOM_GAP` for exactly this reason. **Do not attempt to close that sorry directly — it would require proving a false statement.**

This matches the classical theory. Kolmogorov–Nagumo–de Finetti characterize quasi-arithmetic means by **{symmetry, idempotency (fixed-point), monotonicity, continuity, and "replacement"/bisymmetry/associativity}** — the *bisymmetry/associativity* axiom is the one that pins a quasi-arithmetic mean, and it is **absent from A1–A5** ([Quasi-arithmetic mean, Wikipedia](https://en.wikipedia.org/wiki/Quasi-arithmetic_mean); Aczél, *Lectures on Functional Equations*, 1966, §5.1). The two-variable case was solved by Aczél using bisymmetry; the n-variable case by Maksa–Münnich–Mokken, summarized in [Aczél-type characterization survey (ar5iv 1706.09040)](https://ar5iv.labs.arxiv.org/html/1706.09040).

### 1.3 The honest, achievable target: the CONDITIONAL theorem (already proved) + one new axiom

The maximal honestly-true uniqueness statement is **conditional on factorization**, and it is **already fully proved in-tree** (no open obligations) as `lambda_unique_of_factors` in `Lutar/Round13/Lambda_Uniqueness.lean`:

```
theorem lambda_unique_of_factors {k} (hk : 0 < k) (Φ : Aggregator k)
    (hL : LutarAxioms Φ) (αs : Fin k → NNReal) (hfac : Factors Φ αs) : Φ = Λ k
```
where `Factors Φ αs := ∀ x, Φ x = ∏ i, (x i) ^ (αs i : ℝ)`. Given factorization, A5 forces every exponent to `1/k` and the product collapses to `Λ k`. **This is the proof to feature** — it is true, closed, and substantive.

To obtain UNCONDITIONAL uniqueness honestly you must **add a declared structural axiom A6 = bisymmetry/associativity** (Kolmogorov–Nagumo–Aczél), then derive `Factors` from {A1–A5, A6} and feed `lambda_unique_of_factors`. There are two defensible paths:

- **Path A (recommended, honest, finite work):** declare `A6_bisymmetric` as a **named axiom** (disclosed exactly like the crypto axioms), prove `factorization_from_A1_A6`, then `exact lambda_unique_of_factors …`. This yields a real theorem `lambda_unique_under_A6`, with A6 transparently disclosed. **Do not silently fold A6 into the kernel** — present it as "uniqueness holds *given bisymmetry*."
- **Path B (research, larger):** prove that {A1–A5} + continuity + bisymmetry ⇒ continuity is automatic. Burai–Kiss–Szokol (2021) show **bisymmetry has a "regularity-improving" feature**: a bisymmetric, partially strictly monotone, reflexive, symmetric \(F:I^2\to I\) is automatically continuous, yielding a finer Aczél/Kolmogorov/Nagumo characterization ([arXiv:2107.07391](https://arxiv.org/abs/2107.07391)). This lets you drop an explicit continuity axiom but is substantially more Lean work.

### 1.4 The Cauchy step: `monotone_additive_linear` — exact Mathlib discharge plan

`Lutar/Uniqueness.lean` isolates the **sole analytic blocker** as a standalone lemma (currently `sorry`):

```
private theorem monotone_additive_linear (g : ℝ → ℝ)
    (hg_add : ∀ u v, g (u + v) = g u + g v) (hg_mono : Monotone g) :
    ∀ t : ℝ, g t = g 1 * t
```

This is the classical "monotone + additive ⇒ linear" (Cauchy 1821; Darboux 1875). It is **NOT in Mathlib** as a packaged lemma — confirmed by docs survey — but **every ingredient is**. Discharge route (~30–50 lines), with exact Mathlib names verified against `mathlib4_docs`:

**Step 1 — ℚ-linearity from additivity (no analysis).** An additive `g : ℝ → ℝ` is automatically `ℚ`-linear (Cauchy over ℚ). Cleanest in Lean: bundle `g` as an `AddMonoidHom ℝ ℝ` via `AddMonoidHom.mk'` (the `map_add'` field is `hg_add`). Then `g (q • x) = q • g x` for `q : ℚ` follows from `map_rat_smul`/`AddMonoidHom.map_ratCast_smul` (the ℚ-module compatibility of additive maps; see [Additive map → ℚ-linearity, Wikipedia](https://en.wikipedia.org/wiki/Additive_map)). Concretely: prove `hg_rat : ∀ q : ℚ, g q = g 1 * q` by `map_zero`, `map_nsmul`/`map_natCast`-style induction, `map_neg`, then division.

**Step 2 — Monotone ⇒ Continuous (order topology).** On ℝ a monotone function is continuous wherever it is "surjective enough"; the relevant infrastructure is in **`Mathlib.Topology.Order.MonotoneContinuity`** and **`Mathlib.Topology.Order.IntermediateValue`**. Because `g` is additive *and* monotone, it is monotone on all of ℝ and its range is dense/an interval; use `Monotone.continuous` style results plus IVT (`intermediate_value_Icc`, `IsPreconnected.intermediate_value`) from [`Mathlib.Topology.Order.IntermediateValue`](https://leanprover-community.github.io/mathlib4_docs/Mathlib/Topology/Order/IntermediateValue.html). Note: an additive monotone `g` has no jumps (additivity rules out a jump discontinuity), so continuity is forced.

**Step 3 — ℚ-dense equalizer (the closer).** `g` and `(g 1 • ·) = fun t => g 1 * t` are two continuous functions on ℝ that **agree on ℚ** (Step 1). Two continuous maps into a T2 space that agree on a dense set are equal. Exact Mathlib tools (verified):
- `Set.EqOn.closure` — "if two functions are equal on a set, they are equal on its closure" (`Mathlib.Topology.Separation`), combined with `Rat.denseRange_cast` / `Rat.dense_range_cast` giving `closure (Set.range ((↑) : ℚ → ℝ)) = univ`.
- or `Continuous.ext_on (hs : Dense s) (hf : Continuous f) (hg : Continuous g) (h : Set.EqOn f g s) : f = g` — the "two continuous functions to a t2-space that agree on a dense range are equal" lemma in [`Mathlib.Topology.DenseEmbedding`](https://leanprover-community.github.io/mathlib4_docs/Mathlib/Topology/DenseEmbedding.html) / `Mathlib.Topology.Separation.Hausdorff`.
- `DenseRange.equalizer` is the bundled form for the `denseRange` of `(↑) : ℚ → ℝ`.

**Skeleton (engineer fills concrete API forms):**
```lean
private theorem monotone_additive_linear (g : ℝ → ℝ)
    (hg_add : ∀ u v, g (u+v) = g u + g v) (hg_mono : Monotone g) :
    ∀ t, g t = g 1 * t := by
  -- bundle additive structure
  let G : ℝ →+ ℝ := AddMonoidHom.mk' g hg_add
  -- Step 1: ℚ-linearity
  have hg_rat : ∀ q : ℚ, g (q : ℝ) = g 1 * q := by
    intro q
    -- induction via map_natCast / map_neg / division by denominator
    sorry  -- finite, no analysis; ~15 lines
  -- Step 2: continuity from monotone + additive (no jumps)
  have hg_cont : Continuous g := by
    -- Monotone.continuous via order topology + IVT; additivity kills jumps
    sorry  -- ~10 lines
  -- Step 3: dense equalizer on ℚ
  have hlin : Continuous (fun t : ℝ => g 1 * t) := by continuity
  have key : Set.EqOn g (fun t => g 1 * t) (Set.range ((↑) : ℚ → ℝ)) := by
    rintro _ ⟨q, rfl⟩; simpa using hg_rat q
  intro t
  exact congrFun (Continuous.ext_on Rat.denseRange_cast hg_cont hlin key) t
```
**Imports needed:** `Mathlib.Topology.Order.MonotoneContinuity`, `Mathlib.Topology.Order.IntermediateValue`, `Mathlib.Topology.Separation.Hausdorff` (or `Mathlib.Topology.DenseEmbedding`), `Mathlib.Data.Rat.Cast.Order` / `Mathlib.Topology.Algebra.Order.Archimedean` (for `Rat.denseRange_cast`), `Mathlib.Algebra.Group.Hom.Defs`.

### 1.5 The assembly `lutar_is_geomean` — what closes once §1.4 lands

Once `monotone_additive_linear` is sorry-free, the top-level assembly (`Uniqueness.lean`, currently `sorry`) **still cannot become unconditional** because of §1.2. The correct, honest move:

- Use the slice `fᵢ(t) = Φ(eᵢ(t))`, define `gᵢ(u) = log (fᵢ (exp u))`. `gᵢ` is additive **only if** the slice is multiplicative — which is exactly the factorization that A1–A5 *do not* give. So the assembly must take `Factors` (or A6 ⇒ `Factors`) as input.
- Therefore: **re-target `lutar_is_geomean` to consume `hfac : Factors Φ αs`**, making it definitionally `lambda_unique_of_factors` (already proved in Round13). The geometric-mean collapse uses, on the Mathlib side:
  - `NNReal.mul_rpow`, `NNReal.rpow_natCast`, `NNReal.rpow_mul`, `NNReal.rpow_one` (`Mathlib.Analysis.SpecialFunctions.Pow.NNReal`),
  - `Finset.prod_mul_distrib`, `Finset.prod_const`, `Finset.card_fin`, `Equiv.prod_comp` (`Mathlib.Algebra.BigOperators.Group.Finset`),
  - and `∏ xᵢ^r = (∏ xᵢ)^r` proved by `Finset.induction_on` + `← NNReal.mul_rpow` (the exact pattern already in `lambda_unique_of_factors`, no Mathlib lemma named `prod_rpow` exists — induction is the route).

**Optional uniqueness-equality lemma for QA / counterexample search:** the equality case of weighted AM–GM is in Mathlib as `Real.geom_mean_eq_arith_mean_weighted_iff` and `Real.geom_mean_lt_arith_mean_weighted_iff_of_pos` ([`Mathlib.Analysis.MeanInequalities`](https://leanprover-community.github.io/mathlib4_docs/Mathlib/Analysis/MeanInequalities.html)) — useful to formally exhibit that `maxAgg ≠ Λ` (strict inequality unless all axes equal), reinforcing §1.2.

### 1.6 F23 verdict (defensible)

> **F23 stays Conjecture 1.** Deliverable that is honestly shippable: `lambda_unique_of_factors` (TRUE, fully proved) + `monotone_additive_linear` closed via §1.4 (removes the last analytic sorry from the slice machinery) + the machine-checked counterexamples (`maxAgg_ne_Lambda`) documenting that A1–A5 are insufficient. Unconditional uniqueness requires a **declared A6 (bisymmetry)**; under A6 it closes mechanically. Never report F23 as "proven."

---

## 2. PER-FORMULA PROOF ROUTES (F1–F23 agentic pack)

State legend: **PROVED** = sorry-free, no axioms beyond Lean core; **AXIOM** = sorry-free given a declared crypto axiom; **OPEN/CONJ** = not a theorem.

| ID | Claim | State | Technique / key lemmas | Mathlib needed? | Axiom? |
|----|-------|-------|------------------------|-----------------|--------|
| **F1** | Replay-hash determinism (congruence) | PROVED | `rw [h]`; `List.map` congruence (`f1_replay_trace_stable`) | No (core) | No |
| **F2** | Scheduler liveness | PROVED | strictly-decreasing `Nat` measure; `f2_ticks n w = w - n` by induction + `omega` | No | No |
| **F3** | Boot-gate soundness | PROVED | decidable `Bool` predicate `genomeValid`; `simp`/`inferInstance` | No | No |
| **F4** | Khipu DAG acyclicity | PROVED | backward-edge invariant; `Nat.lt_irrefl`, `Nat.lt_trans` | No | No |
| **F5** | Receipt-keyed recall | PROVED | assoc-list lookup; `beq_eq_false_iff_ne`, `simp` | No | No |
| **F6** | LMDB durability (WAL) | PROVED | `List.filter` recover model; `List.filter_cons`, induction | No | No |
| **F7** | Chaski FIFO ordering | PROVED | foldl-append accumulator lemma; `List.take_append_drop` | No | No |
| **F8** | OSS-only voice safety | PROVED | decidable enum whitelist; `cases`/`simp` | No | No |
| **F9** | Advisory non-interference | PROVED | low/high record projection; `rfl` (Goguen–Meseguer 1982) | No | No |
| **F10** | MCP idempotency | PROVED | `filter` stability; induction + `by_cases` | No | No |
| **F11** | Ayni reciprocity conservation | PROVED | `Int.add_sub_cancel`; tit-for-tat parity | No | No |
| **F12** | Kuramoto additive scaffolding | PROVED | `Nat.left_distrib` (additive only; NOT full nonlinear sync) | No | No |
| **F13** | Hash-chain verification soundness | PROVED | induction on records; `chainVerified → linksMatch` | No | No |
| **F13′** | Tamper-evidence | AXIOM | `hash_collision_resistant` (injective `hashFn`) | No | **hash_collision_resistant** |
| **F14** | DSSE attribution | AXIOM | `ecdsa_unforgeable` (structural attribution only) | No | **ecdsa_unforgeable** |
| **F15** | Merkle inclusion checker | PROVED | `computeRoot` fold; `beq_iff_eq` (structural) | No | (hash CR if upgraded to binding) |
| **F16** | Immune cross-cut completeness | PROVED | `Fin 8` coverage table; `decide`, `match` exhaustiveness | No | No |
| **F17** | Three-vertical isolation | PROVED | partition map; `decide` pairwise-disjoint | No | No |
| **F18** | Reed–Solomon RS(10,6) arithmetic | PROVED | `decide`/`omega` shard counting | No | No |
| **F19** | Bekenstein additive scaffolding | PROVED | `Nat.le_add_right` (additive STUB; NOT full bound) | No | No |
| **F20** | Touch≡pointer equivalence | PROVED | normalization map; `rfl` + `Decidable` instance | No | No |
| **F21** | Genome validation totality | PROVED | total `Fin 16` validator; `decide` | No | No |
| **F22** | Khipu emit monotonicity | PROVED | `List.range`; `List.mem_range`, `List.getElem_range` | No | No |
| **F23** | Λ-aggregator uniqueness | **CONJ** | see §1 — FALSE under A1–A5; needs A6 | Yes | (A6 if declared) |

### 2.1 Hardening / upgrade routes by formula family

**Merkle inclusion (F15) — upgrade from structural to binding.** Current F15 proves the checker is *correct-by-construction* (`verifyInclusion ↔ computeRoot = root`) over an abstract `opaque h2`. To prove *security* (a valid proof for leaf `ℓ` implies `ℓ` truly in the committed set) you need collision-resistance of `h2`, declared exactly like `hash_collision_resistant`. The published methodology to mirror: **ProVerif transparency-protocol verification** abstracts the Merkle data type with axioms and proves the protocol against them, then separately discharges the axioms for a concrete implementation ([Automatic verification of transparency protocols, arXiv:2303.04500](https://arxiv.org/abs/2303.04500)). The Mathlib height-bound pattern already exists in-tree: `merkle_dag_height_bound` (`Lutar/DPI/MerkleDAGBuild.lean`) uses `Nat.log_mono_right` from `Mathlib.Data.Nat.Log` (see `ref/BloodDSSEMerkle.lean`). RFC 6962 / RFC 9162 give the canonical inclusion/consistency-proof algorithms to model ([RFC 6962](https://www.rfc-editor.org/info/rfc6962/); [Merkle Tree Certificates draft](https://davidben.github.io/merkle-tree-certs/draft-ietf-plants-merkle-tree-certs.html)).

**Hash-chain tamper-evidence (F13/F13′).** Pattern is sound: prove structural link-matching sorry-free by induction (`f13_wayra_chain_verified`), isolate collision-resistance as a single declared axiom for the tamper-evidence corollary. This is the standard "abstract hash as injective oracle" idealization used across verified-log work; keep it disclosed.

**FIFO / queues (F7).** List-induction with a generalized accumulator is the canonical Lean/Coq route; `List.take_append_drop`, `List.foldl_cons` are the workhorses. The take/drop round-trip and head?-is-oldest lemmas are fully `simp`-closable. No Mathlib needed.

**Non-interference (F9).** The `rfl`-on-projection proof is the minimal honest core of Goguen–Meseguer non-interference (low view independent of high input). To strengthen to a *stepped* system (low-projection preserved under an advisory-writing transition relation), mirror the verified-systems pattern in [Noninterference specifications for secure systems (Bornholt et al.)](https://jamesbornholt.com/papers/ni-osr20.pdf) and the Isabelle CVDNI compiler-preservation work ([COVERN ITP19](https://covern.org/papers/ITP19.pdf)) — define `lowProj : State → Low` and prove `lowProj (step h s) = lowProj (step h' s)` by `cases`/`rfl` on a concrete state machine. Stays Mathlib-free.

**Idempotency / decidable gates (F3, F8, F10, F16, F20, F21).** All close by `decide`, `simp`, `inferInstance`, or `cases` over finite enums. These are the cheapest, most robust proofs in the pack — no Mathlib, no axioms.

**Additive "scaffolding" formulas (F12 Kuramoto, F19 Bekenstein).** ⚠️ Honesty flag: these prove only the *linear/additive* fragment, **not** the full nonlinear Kuramoto synchronization or the Bekenstein bound \(S \le 2\pi k R E/(\hbar c)\). The docstrings already say so — keep that caveat. Do not let downstream copy imply the full physics result is proved.

---

## 3. EXISTING FORMALIZATION PATTERNS TO MIRROR (cited)

| Need | Pattern / source | URL |
|---|---|---|
| Cauchy additive ⇒ linear | Classical proof, monotone/continuous/bounded variants | [Cauchy's functional equation, Wikipedia](https://en.wikipedia.org/wiki/Cauchy's_functional_equation) |
| Quasi-arithmetic mean characterization | Kolmogorov/Nagumo/de Finetti; Aczél bisymmetry | [Quasi-arithmetic mean, Wikipedia](https://en.wikipedia.org/wiki/Quasi-arithmetic_mean); [Aczél-survey ar5iv 1706.09040](https://ar5iv.labs.arxiv.org/html/1706.09040) |
| Bisymmetry ⇒ regularity (drop continuity axiom) | Burai, Kiss, Szokol 2021 | [arXiv:2107.07391](https://arxiv.org/abs/2107.07391) |
| Generalized quasi-arithmetic means | Páles–Pasteczka 2024 | [arXiv:2412.07315](https://arxiv.org/abs/2412.07315) |
| Weighted geometric/AM–GM equality case | Mathlib `Real.geom_mean_eq_arith_mean_weighted_iff` | [Mathlib.Analysis.MeanInequalities](https://leanprover-community.github.io/mathlib4_docs/Mathlib/Analysis/MeanInequalities.html) |
| Monotone ⇒ continuous, IVT | Mathlib order topology / IVT | [Mathlib.Topology.Order.IntermediateValue](https://leanprover-community.github.io/mathlib4_docs/Mathlib/Topology/Order/IntermediateValue.html) |
| Continuous fns agreeing on dense set | Mathlib `Continuous.ext_on` / `Set.EqOn.closure` | [Mathlib.Topology.DenseEmbedding](https://leanprover-community.github.io/mathlib4_docs/Mathlib/Topology/DenseEmbedding.html) |
| Merkle/transparency proofs via abstract axioms | ProVerif transparency-protocol methodology | [arXiv:2303.04500](https://arxiv.org/abs/2303.04500) |
| Merkle inclusion/consistency algorithms | RFC 6962 / RFC 9162 / MTC draft | [RFC 6962](https://www.rfc-editor.org/info/rfc6962/) |
| Non-interference specs (verified systems) | Bornholt et al.; COVERN | [ni-osr20](https://jamesbornholt.com/papers/ni-osr20.pdf); [COVERN ITP19](https://covern.org/papers/ITP19.pdf) |
| Large-scale verified-systems posture | seL4 / Isabelle security | [Isabelle and Security (Blanchette)](https://www.tcs.ifi.lmu.de/staff/jasmin-blanchette/iandsec.pdf) |
| Goguen–Meseguer non-interference (origin) | Goguen & Meseguer 1982, IEEE S&P | doi:10.1109/SP.1982.10014 |
| Aczél functional equations (canonical text) | Aczél, *Lectures on Functional Equations*, 1966 §5.1 | ISBN 0-12-043750-3 |

---

## 4. DEFENSIBLE TARGET PROVEN-COUNT

### 4.1 Classification of the F1–F23 agentic pack

- **Genuinely PROVABLE sorry-free, no axioms beyond Lean core (19 statements / 18 distinct formula IDs):**
  F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12*, F13, F15, F16, F17, F18, F19*, F20, F21, F22.
  (* F12, F19 are honest *additive scaffolding*, not the full physics theorems — count them only with that caveat.)
- **PROVABLE only with a DECLARED crypto axiom (2):** F13′ (`hash_collision_resistant`), F14 (`ecdsa_unforgeable`). Honest if disclosed.
- **CONJECTURE, not a theorem (1):** F23 (Λ uniqueness) — and FALSE unconditionally under A1–A5; needs declared A6.

### 4.2 Recommended target to defend publicly

> **18 substantive, sorry-free formulas with NO axioms beyond Lean core
> + 2 formulas proved under 2 clearly-declared crypto axioms (`hash_collision_resistant`, `ecdsa_unforgeable`)
> + F23 remains Conjecture 1 (unconditional uniqueness is false under A1–A5; a conditional `lambda_unique_of_factors` IS proved, and uniqueness closes only under a declared bisymmetry axiom A6).**

This is the honest ceiling for the agentic pack. If you must give a single headline number: **"~18 sorry-free + 2 axiom-gated, F23 conjecture."** Be conservative and subtract F12/F19 from any "deep result" claim since they are scaffolding fragments — a defensible "substantive and non-trivial" subset is closer to **12–16** (excluding the near-`rfl` decidable-gate one-liners and the two physics stubs if a skeptic demands "hard" theorems only).

### 4.3 Mandatory honesty corrections before publishing

1. **Locked count stays 5** ({F1,F11,F12,F18,F19}) until the F1–F22 experimental pass is formally re-audited and merged into the counted scope. The 18-count is the *engineering target*, not the current locked kernel.
2. **Fix `knowledge.json`:** `TH_L1 Λ_uniqueness` is labeled `"maturity":"proven"` — this is **false** and must be changed to `"conjectured"` (Conjecture 1). `A7 bekensteinBound` is correctly `"conjectured"`; keep it so.
3. **Axiom ledger:** any `#print axioms` report must list `hash_collision_resistant` and `ecdsa_unforgeable` (and `A6_bisymmetric` if Path A is taken) as declared, non-core axioms. The existing pack correctly shows only `propext`/`Quot.sound` for the 18 core-proofs — preserve that audit.
4. **Never** describe F12 as "Kuramoto synchronization proved" or F19 as "Bekenstein bound proved." They are additive scaffolding only.

---

## 5. ENGINEERING WORK ORDER (priority)

1. **Close `monotone_additive_linear`** (§1.4) — highest leverage, removes the only analytic sorry blocking the slice machinery. ~30–50 lines, all Mathlib API exists. Self-contained; can be PR'd in isolation.
2. **Feature `lambda_unique_of_factors`** as the headline F23 result (already proved) and wire `lutar_is_geomean` to consume `Factors` rather than claim unconditional uniqueness.
3. **Decide on A6:** if leadership accepts a declared bisymmetry axiom, add `axiom A6_bisymmetric`, prove `factorization_from_A1_A6`, ship `lambda_unique_under_A6` (disclosed). Otherwise leave F23 as Conjecture 1 with the conditional theorem + counterexamples.
4. **Optional Merkle hardening (F15):** add declared hash-binding axiom + inclusion-soundness corollary mirroring ProVerif methodology.
5. **Re-audit the F1–F22 experimental pass** for promotion into the locked count under the authoritative `lake build` (not bare `lean`), then update the locked number from 5.

All §2 PROVED routes are already realized in `team/proof_work/PuriqFormulaLean.PROVED.lean` (verified bare-`lean`, Mathlib-free, 1 remaining sorry = F23 by design). The Mathlib-dependent work (F23 Cauchy step + assembly) lives in `lutar-lean` (`Lutar/Uniqueness.lean`, `Lutar/Round13/Lambda_Uniqueness.lean`) and must be checked with full Mathlib via `lake build`.

---

## 6. SOURCES (URLs)

- Aczél, *Lectures on Functional Equations* (1966), §5.1 — ISBN 0-12-043750-3 (functional-equation characterization).
- Goguen & Meseguer, "Security Policies and Security Models," IEEE S&P 1982 — doi:10.1109/SP.1982.10014.
- Quasi-arithmetic (Kolmogorov–Nagumo–de Finetti) mean — https://en.wikipedia.org/wiki/Quasi-arithmetic_mean
- Cauchy's functional equation — https://en.wikipedia.org/wiki/Cauchy's_functional_equation
- Additive map (ℚ-linearity of additive maps) — https://en.wikipedia.org/wiki/Additive_map
- Aczél-type characterization survey (bisymmetry, n-variable) — https://ar5iv.labs.arxiv.org/html/1706.09040
- Burai, Kiss, Szokol (2021), bisymmetry ⇒ regularity — https://arxiv.org/abs/2107.07391
- Páles, Pasteczka (2024), generalized quasi-arithmetic means — https://arxiv.org/abs/2412.07315
- Mathlib `Analysis.MeanInequalities` (geom_mean equality lemmas) — https://leanprover-community.github.io/mathlib4_docs/Mathlib/Analysis/MeanInequalities.html
- Mathlib `Topology.Order.IntermediateValue` — https://leanprover-community.github.io/mathlib4_docs/Mathlib/Topology/Order/IntermediateValue.html
- Mathlib `Topology.DenseEmbedding` (`Continuous.ext_on`, dense equalizer) — https://leanprover-community.github.io/mathlib4_docs/Mathlib/Topology/DenseEmbedding.html
- Mathlib `Topology.Separation.Hausdorff` (`Set.EqOn.closure`) — https://leanprover-community.github.io/mathlib4_docs/Mathlib/Topology/Separation/Hausdorff.html
- Mathlib `Algebra.Module.LinearMap.Defs` / `AddMonoidHom` (ℚ-linearity bundling) — https://leanprover-community.github.io/mathlib4_docs/Mathlib/Algebra/Module/LinearMap/Defs.html
- ProVerif transparency-protocol verification (Merkle abstract axioms) — https://arxiv.org/abs/2303.04500
- RFC 6962 Certificate Transparency (Merkle inclusion/consistency) — https://www.rfc-editor.org/info/rfc6962/
- Merkle Tree Certificates draft (inclusion/consistency algorithms) — https://davidben.github.io/merkle-tree-certs/draft-ietf-plants-merkle-tree-certs.html
- Noninterference specifications for secure systems (Bornholt et al.) — https://jamesbornholt.com/papers/ni-osr20.pdf
- COVERN value-dependent NI compiler preservation (Isabelle), ITP19 — https://covern.org/papers/ITP19.pdf
- Isabelle and Security / seL4 (Blanchette) — https://www.tcs.ifi.lmu.de/staff/jasmin-blanchette/iandsec.pdf

---

*Doctrine preserved: F23 is Conjecture 1 (and unconditionally false under A1–A5); declared axioms (`hash_collision_resistant`, `ecdsa_unforgeable`, prospective `A6_bisymmetric`) are disclosed; locked count remains 5 until re-audit. No conjecture is called a theorem in this document.*
