# Wave20 — Density PRIMITIVES Report (A + B)

**Branch:** `wave20-density-primitives` (off `main` @ `044eb098`)
**Commit:** `4ddc947` — `feat(wave20): density PRIMITIVES A+B …`
**PR (NOT merged):** https://github.com/szl-holdings/lutar-lean/pull/210
**Toolchain:** Lean 4 / Mathlib **v4.18.0** (cached oleans; verified via `lake env lean`).
**Role:** SECOND, complementary team to Wave19. We own the two **standalone, reusable
primitives** the density proof depends on, as independent Mathlib-style lemmas under
`Lutar/Wave20/`. **No Wave18/Wave19 files touched** (imports core Mathlib only; zero Wave18/19
dependency). Wave19 owns the BKS-specific direct dyadic construction.

---

## TL;DR — what closed

| Target | Status | Where |
|---|---|---|
| **PRIMITIVE A** — pairwise-disjoint nonempty opens are countable | ✅ **CLOSED, fully kernel-clean** (self-contained proof + general packaging + corollaries) | `Lutar/Wave20/DisjointOpens.lean` |
| **PRIMITIVE B engine** — nonempty perfect ⊆ ℝ ⇒ uncountable | ✅ **CLOSED, kernel-clean** | `Lutar/Wave20/Accumulation.lean` |
| **PRIMITIVE B bridge** — closed + no-isolated-points ⇒ perfect ⇒ uncountable; two-sided-acc ⇒ `AccPt` | ✅ **CLOSED, kernel-clean** | `Lutar/Wave20/Accumulation.lean` |
| **PRIMITIVE B residual (B-residual)** — closure of dyadic image *contains a nonempty perfect set* of two-sided acc. points | ⚠️ **DOCUMENTED RESIDUAL** — NOT faked, NOT axiomatised, NOT `sorry`-ed; reduced to ONE clearly-stated hypothesis | reduced via `uncountable_twoSidedAccSet_of_perfect_subset` |

Both files compile to **zero errors** locally. **17 declarations** total (8 in A, 9 in B).

---

## PRIMITIVE A — `Lutar/Wave20/DisjointOpens.lean`

> *A family of pairwise-disjoint nonempty open sets in ℝ (or any separable / second-countable
> space) is countable; an uncountable index cannot inject into such a family.*

Two complementary developments — the brief asked for the **self-contained rational-injection
proof** (not just a re-export), and we deliver both that *and* the general packaging:

| Theorem | Content |
|---|---|
| `exists_rat_mem_of_isOpen` | Each nonempty open ⊆ ℝ contains a rational (via `Rat.isDenseEmbedding_coe_real.dense.exists_mem_open`). |
| `countable_of_pairwiseDisjoint_isOpen_real` | **Self-contained proof over ℝ:** choose `qᵢ ∈ Uᵢ` (`choose`); disjointness ⇒ `i ↦ qᵢ` injective (`Disjoint.ne_of_mem`); `ℚ` countable ⇒ `ι` countable (`Injective.countable`). No black box. |
| `countable_of_pairwiseDisjoint_isOpen` | Brief's exact `Pairwise (Function.onFun Disjoint U)` + `Injective U` signature. |
| `countable_of_pairwiseDisjoint_isOpen_sep` | **General `SeparableSpace` packaging** via Mathlib `Pairwise.countable_of_isOpen_disjoint`. |
| `false_of_uncountable_pairwiseDisjoint_isOpen` | Contrapositive / contradiction engine (`Uncountable ι` ⇒ `False`). |
| `countable_of_pairwiseDisjoint_isOpen_on` | Set-indexed form (`s.PairwiseDisjoint U`) via `PairwiseDisjoint.countable_of_isOpen`. |
| `countable_of_pairwiseDisjoint_Ioo` | **Concrete `Set.Ioo` interval form** — the literal shape `α ↦ ]F(X,α),F(Y,α)[` the BKS gap-to-intervals map produces. |
| `false_of_uncountable_pairwiseDisjoint_Ioo` | Interval form in `False`-producing shape — what the density contradiction calls. |

**Exact Mathlib v4.18.0 declarations used** (confirmed by `#check` probe, no research-team file
needed):
- `Pairwise.countable_of_isOpen_disjoint` — `Pairwise (Disjoint on s) → (∀ i, IsOpen (s i)) → (∀ i, (s i).Nonempty) → Countable ι` (requires `[SeparableSpace α]`).
- `PairwiseDisjoint.countable_of_isOpen` — set-indexed version.
- `Rat.isDenseEmbedding_coe_real`, `IsDenseEmbedding.dense`, `DenseRange.exists_mem_open`.
- Instances: `Countable ℚ` (`Mathlib.Data.Rat.Encodable`), `SeparableSpace ℝ` (`Mathlib.Topology.MetricSpace.ProperSpace.Real`).

> Note: this duplicates *function* (intentionally — independent ownership) with Wave19's
> `DisjointOpens.lean`, but Wave20's `…_real` lemma is a **genuinely self-contained proof**
> (Wave19 thinly re-exports the Mathlib black box). Primitive A is therefore independently
> mergeable to Mathlib-style and directly unblocks both Wave19 and CUT-1.

---

## PRIMITIVE B — `Lutar/Wave20/Accumulation.lean`

> *The closure of the dyadic image f(D) has uncountably many two-sided accumulation points
> (BKS 2208.07083 Lemma 6, bullet 2).*

The genuinely deep content is the existence of a nonempty **perfect** subset; that is the
honest residual. Everything else is proved kernel-clean:

| Theorem / def | Content |
|---|---|
| `natBool_not_countable` | `ℕ → Bool` is uncountable (cardinality `𝔠 > ℵ₀`). |
| `perfect_nonempty_not_countable` | **Engine:** a nonempty perfect set ⊆ ℝ is uncountable, via Cantor injection `Perfect.exists_nat_bool_injection`. |
| `perfect_of_isClosed_no_isolated` | `IsClosed C` + `Preperfect C` (`∀ x ∈ C, AccPt x (𝓟 C)`) ⇒ `Perfect C`. |
| `uncountable_of_isClosed_no_isolated` | **The brief's requested bridge:** *closed + no isolated points ⇒ perfect ⇒ uncountable.* |
| `not_countable_of_perfect_subset` | If `S ⊇ C` with `C` nonempty perfect, then `S` is uncountable. |
| `IsTwoSidedAccPt` (def) | BKS footnote-2 predicate: `∀ ε>0, (Ioo (α-ε) α ∩ H).Nonempty ∧ (Ioo α (α+ε) ∩ H).Nonempty`. |
| `accPt_of_isTwoSidedAccPt` | **Bridge:** two-sided acc. point ⇒ Mathlib `AccPt α (𝓟 H)` (via `accPt_iff_nhds` + `Metric.mem_ball`). |
| `twoSidedPerfect_uncountable` | Capstone: nonempty closed `C` all of whose points are two-sided acc. points of `C` ⇒ uncountable. |
| `uncountable_twoSidedAccSet_of_perfect_subset` | **Single named entry point** the BKS generator argument must feed (consumes B-residual). |

**Exact Mathlib v4.18.0 declarations used:** `Perfect` (= `IsClosed` ∧ `Preperfect`), `Preperfect`
(= `∀ x ∈ C, AccPt x (𝓟 C)`), `Perfect.exists_nat_bool_injection`, `accPt_iff_nhds`,
`Cardinal.mk_arrow`, `aleph0_lt_continuum`.

### The honest residual (B-residual) — exactly what remains
> **(B-residual):** the closure of the BKS dyadic generator image `f(D)` *contains a nonempty
> perfect set `C` of two-sided accumulation points*.

This is the part that requires the **recursive midpoint / densely-self-similar generator
structure** `f((d₁+d₂)/2)=F(f d₁, f d₂)` (Aczél–Dhombres *Functional Equations in Several
Variables*, pp. 287–290), and is genuinely multi-week. Once `C` is exhibited,
`uncountable_twoSidedAccSet_of_perfect_subset` / `not_countable_of_perfect_subset` make BKS
bullet 2 immediate. **It is NOT faked, NOT axiomatised, NOT `sorry`-ed** — it is a stated
hypothesis of the final lemma. The Kiss (2026) noncontinuous construction is the honest reason
reflexivity + symmetry hypotheses cannot be dropped (without them the residual fails and `F`
can be noncontinuous).

---

## Axiom cleanliness (`#print axioms`) — VERIFIED LOCALLY

Every Wave20 theorem prints axioms ⊆ **{propext, Classical.choice, Quot.sound}**. No `sorryAx`,
no new declared `axiom` token. Verified by appending `#print axioms` to each file and running
`lake env lean`:

```
Lutar.Wave20.countable_of_pairwiseDisjoint_isOpen_real      [propext, Classical.choice, Quot.sound]
Lutar.Wave20.countable_of_pairwiseDisjoint_isOpen           [propext, Classical.choice, Quot.sound]
Lutar.Wave20.countable_of_pairwiseDisjoint_isOpen_sep       [propext, Classical.choice, Quot.sound]
Lutar.Wave20.false_of_uncountable_pairwiseDisjoint_isOpen   [propext, Classical.choice, Quot.sound]
Lutar.Wave20.countable_of_pairwiseDisjoint_isOpen_on        [propext, Classical.choice, Quot.sound]
Lutar.Wave20.countable_of_pairwiseDisjoint_Ioo             [propext, Classical.choice, Quot.sound]
Lutar.Wave20.false_of_uncountable_pairwiseDisjoint_Ioo     [propext, Classical.choice, Quot.sound]
Lutar.Wave20.natBool_not_countable                        [propext, Classical.choice, Quot.sound]
Lutar.Wave20.perfect_nonempty_not_countable               [propext, Classical.choice, Quot.sound]
Lutar.Wave20.perfect_of_isClosed_no_isolated              [propext, Classical.choice, Quot.sound]
Lutar.Wave20.uncountable_of_isClosed_no_isolated          [propext, Classical.choice, Quot.sound]
Lutar.Wave20.not_countable_of_perfect_subset              [propext, Classical.choice, Quot.sound]
Lutar.Wave20.accPt_of_isTwoSidedAccPt                     [propext, Classical.choice, Quot.sound]
Lutar.Wave20.twoSidedPerfect_uncountable                  [propext, Classical.choice, Quot.sound]
Lutar.Wave20.uncountable_twoSidedAccSet_of_perfect_subset [propext, Classical.choice, Quot.sound]
```

No `sorry`/`admit`/`axiom`/`native_decide` tokens anywhere in `Lutar/Wave20/` (grep-clean;
only doc-comment mentions).

---

## Drift status — ZERO DRIFT, locked-proven STAYS 5

`python3 .github/scripts/lean_numbers.py --clone --ref wave20-density-primitives` (run against
the pushed branch) reports, **identical to the locked v11 baseline** (Wave20 is registered under
`EXPERIMENTAL_SCOPES` as `Lutar/Wave20/`):

```
declarations      1323   (baseline 1323) ✓
axioms_raw          23   (baseline 23)   ✓
axioms_unique       22   (baseline 22)   ✓
axiom_names    UNCHANGED (22 tokens; no new token) ✓
sorries_raw        307   (baseline 307)  ✓
sorries_noncomment 254   (baseline 254)  ✓
sorries_putnam      56   (baseline 56)   ✓
sorries_baseline   251   (baseline 251)  ✓
```

**Locked-proven set STAYS EXACTLY 5** {F1, F11, F12, F18, F19}. Λ UNCONDITIONAL uniqueness STAYS
Conjecture 1 (this work does not touch it). `lean_numbers.py` and `Lutar.lean` updated additively
(Wave20 scope + imports only).

---

## CI status — local green; CI blocked by pre-existing infra regression

- **Local verification is authoritative** (per task: "Verify locally with `lake env lean` —
  CI Actions logs are proxy-blocked"). Both files: `lake env lean … → EXIT 0`, zero errors.
- **PR #210 CI:** the `build` / `lake build + numbers` jobs **fail in ~12–25s** with
  `error: failed to parse latest release tag` at the **elan/lake toolchain-resolution** step
  (network/runner-side), *before any Lean compilation*. This is a **GitHub-runner infrastructure
  regression, NOT a code defect**:
  - The toolchain pin itself validates ("lean-toolchain pin: leanprover/lean4:v4.18.0 … toolchain pin OK").
  - The **sibling Wave19 PR fails identically** (same step, same error) — both started failing
    in the same window, while earlier wave18/wave17 runs built fine (2–25 min).
  - Reproduced on rerun (`gh run rerun --failed`) → same error, confirming it is persistent infra.
  - The `Lint PR title (Conventional Commits)` check also fails for an unrelated infra reason —
    the workflow pins a non-resolvable action SHA (`amannn/action-semantic-pull-request@0723387…`,
    "unable to find version"). Our PR title is valid Conventional Commits.
- **Passing checks:** CodeQL, DCO sign-off, Trivy, gitleaks, doi-title-gate, check/doctrine,
  Run tests, CI checks, Analyze actions.

**Recommendation for parent:** the Lean content is green and axiom-clean locally; the red CI
jobs are environmental (elan toolchain fetch + a dead action SHA) and affect Wave19 equally —
not blockers attributable to Wave20. Re-running CI once the runner's toolchain mirror recovers
(or after the org fixes the `commit-lint.yml` action pin) should turn them green with no code
change. **PR is intentionally left OPEN / NOT merged — parent verifies.**

---

## Artifacts
- Source: `Lutar/Wave20/DisjointOpens.lean`, `Lutar/Wave20/Accumulation.lean` (branch `wave20-density-primitives`).
- Isolated dev worktree (build cache symlinked): `/home/user/workspace/wave20-wt/`.
- PR: https://github.com/szl-holdings/lutar-lean/pull/210 (open).

## Sources
- Burai, Kiss, Szokol (2022), *A dichotomy result for strictly increasing bisymmetric maps*,
  arXiv:2208.07083 — https://arxiv.org/abs/2208.07083 — Lemma 6, Step 2 (density), bullets 2–3.
- G. Kiss (2026), *On noncontinuous bisymmetric strictly monotone operations* — honest boundary
  (reflexivity + symmetry essential).
- Aczél & Dhombres, *Functional Equations in Several Variables*, pp. 287–290 (recursive generator).
- Mathlib v4.18.0: `Pairwise.countable_of_isOpen_disjoint`, `PairwiseDisjoint.countable_of_isOpen`,
  `Perfect`/`Preperfect`/`Perfect.exists_nat_bool_injection`, `accPt_iff_nhds`,
  `Rat.isDenseEmbedding_coe_real`, `DenseRange.exists_mem_open`.
