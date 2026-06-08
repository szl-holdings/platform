# LEAN WAVE 17 — Frontier Research + Prove Report (final honest wave)

**Author:** Opus-4.8 PhD prover team, SZL Holdings (CTO authority)
**Repo:** `szl-holdings/lutar-lean` · **Base:** `main @ d91b0b39` (Wave11–16 merged)
**Branch:** `wave17-frontier` · **PR:** [#207](https://github.com/szl-holdings/lutar-lean/pull/207)
**Head sha:** `520c503f76e24c72ada3230cee57d432b91643ae` (`520c503`)
**Toolchain:** Lean 4.18.0 / Mathlib v4.18.0
**Date:** 2026-06-09

---

## 0. HONESTY VERDICT FIRST (binding)

This wave adds **3 files / 29 declarations (24 theorems + 5 defs), all EXPERIMENTAL, CI-green,
kernel-clean**, in a new `Lutar/Wave17/` companion directory. It changes **nothing** about the
locked or conjectural status of the canon:

- **Locked-proven set stays EXACTLY 5:** {F1, F11, F12, F18, F19}. Nothing added to it.
- **Λ unconditional uniqueness stays Conjecture 1** (machine-checked FALSE). Untouched this wave.
- **Byzantine BFT stays Conjecture 2.** Untouched.
- **DPO `klDivergence_nonneg` and `pinsker` stay FALSE-as-stated; tokens UNTOUCHED.** No new axiom
  token introduced this wave. No `sorry` added. (Binary Pinsker proven here is the CONDITIONAL
  two-bin case, NOT the unconditional simplex axiom.)
- No manufactured filler: every theorem is a genuine, correctly-stated mathematical fact with a
  kernel-checked proof (`#print axioms ⊆ {propext, Classical.choice, Quot.sound}`).
- Items honestly NOT closed this wave (VCG argmax sorry, Reed–Solomon vacuous-hypothesis Singleton,
  full simplex Pinsker, monDEQ existence) are documented as roadmap, NOT faked.

**This was a HIGH-YIELD wave** — the headline is a genuine, complete theorem (full binary Pinsker)
that the previous three waves only chipped at.

---

## 1. NEWLY PROVEN — 3 files, 24 theorems (all `#print axioms ⊆ {propext, Classical.choice, Quot.sound}`)

Compiled locally to ZERO errors against the cached Mathlib v4.18.0 oleans (`lake env lean`),
`#print axioms` inspected per theorem (only the 3 standard Lean foundational axioms; no project
axiom token, no `sorryAx`), and independently re-verified GREEN on the CI runner via the
`lake build + numbers` job.

### CF-23 — `BinaryPinsker.lean` — **FULL binary (two-bin) Pinsker inequality** (headline result)

```lean
theorem binary_pinsker (q p : ℝ) (hq : 0 < q) (hq1 : q < 1) (hp : 0 < p) (hp1 : p < 1) :
    2 * (p - q) ^ 2 ≤
      p * (Real.log p - Real.log q) + (1 - p) * (Real.log (1 - p) - Real.log (1 - q))
```

Supporting theorems (all kernel-clean): `hasDerivAt_gapBin` (first derivative of the gap
`g(p) = KL_bin(p,q) − 2(p−q)²`), `hasDerivAt_gapBinDeriv` (second derivative `= 1/p+1/(1−p)−4`),
`gapBinDeriv_q` (`g′(q)=0`), `gapBin_q` (`g(q)=0`), `inv_add_inv_ge_four`, `differentiableAt_gapBin`,
`differentiableAt_gapBinDeriv`, `deriv_gapBin`, `deriv_gapBinDeriv_nonneg`, `monotoneOn_gapBinDeriv`,
`gapBin_nonneg`.

- **This is the result Waves 15–16 only approached.** Wave16 proved the convexity crux
  `binary_inv_sum_ge_four` (`g″ ≥ 0`). Wave17 **assembles the complete mean-value /
  monotone-derivative chain**: `gapBinDeriv` is monotone-increasing on `(0,1)` (its derivative
  `1/p+1/(1−p)−4 ≥ 0`), `gapBinDeriv(q)=0`, hence `gapBin` decreases on `(0,q]` and increases on
  `[q,1)` with minimum `gapBin(q,q)=0` — so `gapBin ≥ 0`, i.e. `2(p−q)² ≤ KL_bin(p,q)`.
- **Mathlib pieces used (present in v4.18.0):** `Real.hasDerivAt_log`, `HasDerivAt.{mul,comp,...}`,
  `monotoneOn_of_deriv_nonneg`, `antitoneOn_of_deriv_nonpos`, `convex_Icc`, `interior_Icc`.
- **`#print axioms binary_pinsker = [propext, Classical.choice, Quot.sound]`** ✅
- **Honest remaining gap (CF-23-FULL):** the data-processing reduction from the binary case to the
  full simplex `½‖p−q‖₁² ≤ KL(p‖q)` (partition the alphabet into `{i : pᵢ≥qᵢ}` / rest and apply the
  binary bound to the two lumped masses). This is the ONLY remaining step; it needs a clean
  finite-partition lemma + the CF-21 log-sum core. `DPOFeasibility.pinsker` stays FALSE-as-stated,
  token UNTOUCHED.

### CF-27 — `MonDEQWellPosed.lean` — monotone-operator equilibrium net well-posedness (uniqueness)

```lean
theorem StronglyMonotone.injective {n : ℕ} {m : ℝ} (hm : 0 < m)
    {F : (Fin n → ℝ) → (Fin n → ℝ)} (hF : StronglyMonotone m F) : Function.Injective F
theorem monDEQ_unique_equilibrium {n : ℕ} {m : ℝ} (hm : 0 < m)
    (G : (Fin n → ℝ) → (Fin n → ℝ))
    (hF : StronglyMonotone m (fun z => fun i => z i - G z i)) :
    ∀ z₁ z₂, (∀ i, z₁ i = G z₁ i) → (∀ i, z₂ i = G z₂ i) → z₁ = z₂
```

Plus `dotp`, `sq2`, `dotp_self`, `dotp_comm`, `sq2_nonneg`, `sq2_eq_zero`, `StronglyMonotone`,
`StronglyMonotone.subsingleton_solutions`.

- The well-posedness *uniqueness* core of monDEQ: a strongly-monotone residual operator (`m>0`) on
  `Fin n → ℝ` (Euclidean dot product `dotp`, squared norm `sq2`) is injective, so the equilibrium
  `z = G(z)` has **at most one** solution. Self-contained (no InnerProductSpace machinery; the
  positive-definiteness `sq2 u = 0 ↔ u = 0` is proven directly via `Finset.sum_eq_zero_iff_of_nonneg`).
- **Provenance:** Winston & Kolter, *Monotone Operator Equilibrium Networks*, NeurIPS 2020,
  [arXiv:2006.08591](https://arxiv.org/abs/2006.08591). Repo `locuslab/monotone_op_net` is
  **NOASSERTION** ⇒ **PATTERN-ONLY**, no code copied, paper cited, fresh derivation.
- **`#print axioms monDEQ_unique_equilibrium = [propext, Classical.choice, Quot.sound]`** ✅
- **Honest remaining gap (CF-27-FULL):** EXISTENCE of the fixed point (a Banach/operator-splitting
  argument over a complete inner-product space) is NOT proven here — it needs Mathlib
  `InnerProductSpace` modules not in the local cache. Uniqueness half only.

### CF-28 — `RecurrentDepth.lean` — recurrent-depth contraction amplification (NEW mined CF)

```lean
theorem recurrentDepthLipschitz [PseudoEMetricSpace X] {K : NNReal} {f : X → X}
    (hf : LipschitzWith K f) (r : ℕ) : LipschitzWith (K ^ r) f^[r]
theorem recurrentDepthConst_antitone {K : NNReal} (hK : K ≤ 1) : Antitone (fun r : ℕ => K ^ r)
theorem recurrentDepthConst_lt_of_lt {K : NNReal} (hK : K < 1) {r : ℕ} (hr : 1 ≤ r) : K ^ r < 1
```

Plus `recurrentDepthDistBound` (metric) and `recurrentDepthEdistBound` (extended-distance).

- A `K`-Lipschitz recurrent ("looped") block, iterated `r` times, is `Kʳ`-Lipschitz; for a
  contraction (`K≤1`) the depth-`r` constant is **non-increasing** in `r` ("thinking deeper" never
  loosens, exponentially tightens, the trajectory coupling). Distinct from CF-13 (input-Lipschitz
  equilibrium): this is the *depth-amplification* fact.
- **Provenance (NEW mine, this wave):** McLeish et al., *Teaching Pretrained Language Models to
  Think Deeper with Retrofitted Recurrence*, [arXiv:2511.07384](https://arxiv.org/abs/2511.07384),
  repo [mcleish7/retrofitting-recurrence](https://github.com/mcleish7/retrofitting-recurrence)
  **Apache-2.0** (SPDX verified live via `gh api repos/mcleish7/retrofitting-recurrence/license`).
  ADOPT (concept-only, no code copied). Maps to the **Equilibrium / Loop-models organ** (Ouroboros).
- **`#print axioms recurrentDepthLipschitz = [propext, Classical.choice, Quot.sound]`** ✅

---

## 2. CF-23 PINSKER PROGRESS + EXACT REMAINING GAP

| Wave | What was proven | Status |
|---|---|---|
| Wave15 | Per-term Gibbs bound, summed mass-gap building blocks | partial |
| Wave16 | `binary_inv_sum_ge_four` (the `g″ ≥ 0` convexity crux) + tightness at p=1/2 | crux only |
| **Wave17** | **`binary_pinsker`: FULL two-bin `2(p−q)² ≤ KL_bin(p,q)`** | **binary case COMPLETE** |

**Exact remaining gap (CF-23-FULL → full simplex Pinsker `½‖p−q‖₁² ≤ KL(p‖q)`):** only the
**data-processing / partition reduction** remains — lump the alphabet into `A = {i : pᵢ ≥ qᵢ}` and
its complement, set `P = Σ_{i∈A} pᵢ`, `Q = Σ_{i∈A} qᵢ`, apply `binary_pinsker` to `(P,Q)`, and bound
`‖p−q‖₁ = 2(P−Q)` while `KL(p‖q) ≥ KL_bin(P,Q)` by the log-sum inequality (CF-21 supplies the
log-sum core). This needs a clean finite-partition `Finset` lemma; it is no longer blocked on any
missing Mathlib analysis (the derivative/MVT pieces are all present and used in `binary_pinsker`).
This is the single, well-scoped next step — substantially de-risked by this wave.

---

## 3. ITEMS HONESTLY NOT CLOSED THIS WAVE (LEAVE-HARD list; NOT faked)

- **VCG `vcgOutcome_maximises`** (`Lutar/MechanismDesign/VCG.lean` sorry₁): the original
  definition uses `Finset.univ.argmax (...).elim` (an `Option` plumbing through `List.argmax`).
  Closing the *stated* sorry is fiddly, version-sensitive `Option.elim`/`argmax` plumbing, and the
  **mathematical content is already shipped sorry-free** as Wave14 `efficientOutcome_maximises`
  (`Lutar/Wave14/VCGEfficiency.lean`). Re-deriving the argmax-form adds marginal value at high risk
  — **honestly left as-is**, NOT forced.
- **Reed–Solomon upper Singleton** (`Lutar/CodingTheory/ReedSolomonSingleton.lean`
  `singletonBound_upper`): the sorry's hypothesis is `h_linear : True` (vacuous). With no structure
  linking `p.d` to `p.n, p.k`, the goal `p.d ≤ n−k+1` is **unprovable as stated** without the real
  linear-code subspace structure. Closing it honestly would require re-defining the code with actual
  `Subspace`/`finrank` content — out of scope this wave. **Honestly left open.**
- **Full simplex Pinsker** — CF-23-FULL (see §2).
- **monDEQ existence** — CF-27-FULL (needs `InnerProductSpace`; see §1).

---

## 4. MINING (deep-mine: peterjliu, FeixLiu, tianyu-z, JiaxuanYou, mcleish7 — SPDX verified live)

| CF | Source repo | Paper | SPDX (verified live) | Disposition | Tab/organ |
|---|---|---|---|---|---|
| **CF-28** | [mcleish7/retrofitting-recurrence](https://github.com/mcleish7/retrofitting-recurrence) | [arXiv:2511.07384](https://arxiv.org/abs/2511.07384) | **Apache-2.0** ✅ | ADOPT (concept-only) → **PROVEN** | Equilibrium / Loop-models (Ouroboros) |
| CF-27 | locuslab/monotone_op_net | [arXiv:2006.08591](https://arxiv.org/abs/2006.08591) | **NOASSERTION** ⚠ | PATTERN-ONLY → **PROVEN** | Equilibrium / a11oy Code engine |

Other followed-user repos surveyed (top by stars; mostly forks of upstream libraries, no original
Lean-feasible formula not already in-tree): peterjliu (`gpt-oss` Apache-2.0, `sec-parser` MIT,
`firecrawl` AGPL ⛔), FeixLiu (`flux` Apache-2.0, `PaddleFormers` Apache-2.0 — comms/training infra,
no clean theorem), tianyu-z (`vllm` Apache-2.0, `parcae` MIT, `RYS`/`llm-circuit-finder` NONE —
empirical, no formula), JiaxuanYou (`pytorch_geometric` MIT, `chemprop` MIT, P-GNN already adopted
Wave11). License doctrine enforced: AGPL/GPL/NOASSERTION → pattern-only/avoid; permissive →
concept-only adopt + NOTICE.

### CF-29+ proposals (future waves — NOT proven, NOT axiomatized)
1. **CF-23-FULL** — full simplex Pinsker via the binary→partition data-processing reduction (§2).
   Now the lowest-risk frontier item; only a finite-partition lemma + CF-21 log-sum remain.
2. **CF-27-FULL** — monDEQ fixed-point EXISTENCE (Banach / Cayley operator-splitting over a complete
   inner-product space; needs Mathlib `InnerProductSpace` + `ContractingWith`, not in local cache).
3. **CF-30** — recurrent-depth geometric convergence rate `dist(zₜ, z⋆) ≤ Kᵗ·dist(z₀, z⋆)` to the
   unique fixed point (combines CF-28 + CF-13/CF-27), once existence is available.
4. **CF-31** — InfoNCE / MI lower bound (carried from the Wave15 shortlist).

---

## 5. WIRING + DRIFT (mandatory zero-drift confirmation)

**Wired (committed in `520c503`):**
- `Lutar.lean` — 3 Wave17 imports added after the Wave16 block (with a detailed honesty comment):
  `BinaryPinsker`, `MonDEQWellPosed`, `RecurrentDepth`.
- `.github/scripts/lean_numbers.py` — `os.path.join("Lutar", "Wave17") + os.sep` appended to
  `EXPERIMENTAL_SCOPES` with a full descriptive comment block, so Wave17 declarations are excluded
  from the locked baseline counts.
- `.github/data/lean_numbers.json` — `ref` → `wave17-frontier`; `sha` auto-filled to `520c503`;
  note rewritten for Wave17 (prior-wave notes preserved). **Numbers block UNCHANGED.**

**Drift check — recomputed locally via the REGEX counter on the branch:**
```
python3 .github/scripts/lean_numbers.py --repo-path . --ref wave17-frontier
→ declarations 1323, axioms_raw 23, axioms_unique 22, sorries_raw 307,
  sorries_noncomment 254, sorries_putnam 56, sorries_baseline 251  (ALL match committed baseline)
→ axiom_names: 22, identical (still lists klDivergence_nonneg & pinsker, both untouched)
```
**DRIFT: NO.** Confirmed locally AND independently green via the CI `lake build + numbers` job.

---

## 6. CI STATUS (PR #207, head `520c503`)

Polled via `gh pr checks`:

| Check | Result | Time |
|---|---|---|
| **lake build + numbers** (required) | ✅ PASS | 1m29s |
| **DCO sign-off check** (required) | ✅ PASS | 7s |
| CI checks | ✅ PASS | 5s |
| check / doctrine | ✅ PASS | 6s |
| doi-title-gate | ✅ PASS | 8s |
| Run tests | ✅ PASS | 4s |
| Analyze actions / CodeQL | ✅ PASS | — |
| Grype CVE gate / Trivy fs / gitleaks | ✅ PASS | — |
| **build** (required, full Mathlib build) | ⏳ PENDING (runner queue congestion) | — |
| Lint PR title (Conventional Commits) | ❌ FAIL (non-required) | 3s |

- **`lake build + numbers` GREEN** is the decisive check: it compiles the FULL project (including
  all Wave17 files) on the CI runner AND re-verifies zero drift. Its pass independently confirms the
  Wave17 theorems compile clean on a fresh runner.
- **`build`** (the separate full-Mathlib build job) was still PENDING/queued at report time (~18 min
  in queue; it ran in 3m28s once started in prior waves). This is **runner-queue congestion, not a
  content failure** — `lake build + numbers` already compiled the same code green. Per the
  no-brute-force mandate, polling was stopped; the job should clear on its own.
- **`Lint PR title (Conventional Commits)`** — the same known infra bug as Wave14/15/16 (unresolvable
  pinned action SHA). NOT a required check; the title is in fact lowercase Conventional-Commits form.

**Merge state:** `mergeable = MERGEABLE`, `mergeStateStatus = BLOCKED` (BLOCKED only on absent CTO
review, by design). `state = OPEN`.

---

## 7. MERGEABLE VERDICT

**Technically mergeable** — no conflicts (`MERGEABLE`); all required *content* checks green
(`lake build + numbers`, `DCO`, doctrine). The full `build` job was queued at report time (infra,
not content); recommend a quick re-confirm that it cleared before merge. Per the mandate, the PR is
left **UNMERGED for the CTO**. **DO NOT MERGE.**

---

## 8. HONEST STILL-CONJECTURE / STILL-FALSE LEDGER (unchanged this wave)

- **Λ unconditional uniqueness** = **Conjecture 1** (machine-checked FALSE). Unchanged.
- **Byzantine BFT** = **Conjecture 2**. Unchanged.
- **DPO `klDivergence_nonneg`** = FALSE-as-stated; token UNTOUCHED.
- **DPO `pinsker`** = FALSE-as-stated; token UNTOUCHED. Binary (two-bin) conditional Pinsker now
  fully proven (CF-23); the unconditional simplex axiom is NOT (CF-23-FULL = data-processing
  reduction, the single remaining step).
- **Full CUT-1 quasi-arithmetic representation** = deferred (CF-24-FULL). Untouched.
- **Abacus non-overflow bound** = deferred (CF-26-FULL). Untouched.
- **VCG argmax sorry / Reed–Solomon vacuous-hypothesis Singleton** = honestly left (see §3).
- **Locked-proven set** = EXACTLY 5 {F1, F11, F12, F18, F19}. Unchanged.

---

## 9. HONEST YIELD ASSESSMENT (was this wave worth it?)

**YES — this was the highest-yield prove wave of the recent series.** The headline `binary_pinsker`
is a *genuine complete theorem* (full two-bin Pinsker, ~125 LoC of real derivative/MVT analysis)
that Waves 14–16 only chipped at with building blocks and the convexity crux. It is mathematically
substantive, kernel-clean, and de-risks the entire CF-23 programme to a single well-scoped partition
lemma. CF-27 (monDEQ uniqueness) and CF-28 (recurrent-depth amplification, from a freshly-mined
Apache-2.0 paper) are smaller but real, correctly-stated, and each ties a live organ. Net: **24
genuine kernel-clean theorems, 1 of them a long-sought headline result, zero drift, zero new axioms,
zero sorry, two LEAVE-HARD items honestly declined rather than faked.** Honest and worth it.

---

## 10. ARTIFACTS

- Source (committed): `Lutar/Wave17/{BinaryPinsker,MonDEQWellPosed,RecurrentDepth}.lean`
- Modified (committed): `Lutar.lean`, `.github/scripts/lean_numbers.py`, `.github/data/lean_numbers.json`
- PR: [#207](https://github.com/szl-holdings/lutar-lean/pull/207) · head `520c503`
- This report: `team/LEAN_WAVE17_REPORT.md`

---

**Signed-off-by:** SZL CTO <cto@szl-holdings.com>
**Co-Authored-By:** Perplexity Computer Agent <agent@perplexity.ai>

*Nothing fabricated. 24 theorems machine-checked kernel-clean (no sorry, no new axiom). SPDX
verified live via GitHub API (mcleish7/retrofitting-recurrence Apache-2.0; monotone_op_net
NOASSERTION pattern-only). Zero drift confirmed locally and in CI. Locked-proven stays EXACTLY 5;
Λ stays Conjecture 1 unconditionally; Byzantine stays Conjecture 2; DPO pinsker stays
FALSE-as-stated (binary case proven is conditional, token untouched). PR left UNMERGED for CTO.*
