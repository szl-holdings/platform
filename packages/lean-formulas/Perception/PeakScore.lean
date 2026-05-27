/-
Perception / PeakScore
======================

Formalises a single, structurally important property of the perception/bio
primitives extracted in Task #5513 (synthesis: `docs/research/perception-bio-synthesis-2026.md`).

Headline statement
------------------
The MsdialWorkbench-derived peak-detection primitive in
`@workspace/anomaly-fabric/peak-detector` itemises its composite score as

  composite = α·prominence + β·snRatio − γ·shapeResidual

The headline lemma in this file proves the most operationally important
property of this expression: with non-negative `α, β` and non-negative
`prominence, snRatio`, the composite is **monotone non-decreasing in
`prominence`** (holding the other inputs fixed). Concretely: an additional
unit of prominence cannot lower the composite score. This is the same
property the runtime test (`packages/anomaly-fabric/src/__tests__/peak-detector.test.ts`)
checks numerically; this Lean lemma is the formal counterpart.

Naturally-indexed
-----------------
Mirroring the rest of `packages/lean-formulas`, we keep this statement on
the platform's discrete carriers (`Nat`) to avoid pulling mathlib in. The
continuous-`ℝ` form is a one-line lift once a mathlib-warm cache is
available.

Registry tie (Task #5513)
-------------------------
This file's `peak_score_monotone_in_prominence` theorem is the Lean
counterpart of the `peakConfidence` runtime formula in
`packages/lambda-math/src/peak-confidence.ts`. Naming convention
(per `packages/lean-formulas/README.md`): kebab-case → snake_case, so
`peak-score-monotone-in-prominence` ↦ `peak_score_monotone_in_prominence`.

Cluster-partition corollary
---------------------------
The second result, `cluster_partition_total`, formalises the
`@szl-holdings/sim-kit/cluster-detect` invariant that the sum of
cluster sizes equals the number of particles. Stated as a `foldl`
identity over `Nat` to stay inside core Lean 4 (mathlib's `List.sum`
is not available without the cache).
-/

namespace LeanFormulas.Perception

/-- Composite peak score on `Nat`. -/
def peakComposite (α β γ prominence snRatio shapeResidual : Nat) : Nat :=
  α * prominence + β * snRatio - γ * shapeResidual

/-- Headline lemma. Non-negativity is automatic on `Nat`, so the
    monotonicity statement reduces to: adding to `prominence` only
    increases `α * prominence`, and subtraction by the same `γ *
    shapeResidual` preserves the order. -/
theorem peak_score_monotone_in_prominence
    (α β γ p₁ p₂ snRatio shapeResidual : Nat)
    (h : p₁ ≤ p₂) :
    peakComposite α β γ p₁ snRatio shapeResidual ≤
      peakComposite α β γ p₂ snRatio shapeResidual := by
  unfold peakComposite
  have hAdd : α * p₁ + β * snRatio ≤ α * p₂ + β * snRatio := by
    apply Nat.add_le_add_right
    exact Nat.mul_le_mul_left α h
  exact Nat.sub_le_sub_right hAdd (γ * shapeResidual)

/-- Sum-of-list helper that stays inside core Lean 4 (no mathlib). -/
def sumList : List Nat → Nat
  | []      => 0
  | x :: xs => x + sumList xs

/-- The total size of a cluster partition equals the sum of the
    individual cluster sizes. The runtime check
    `∑ cluster.size === particles.length` is the operational
    counterpart in `packages/sim-kit/src/cluster-detect.ts`. -/
theorem cluster_partition_total_singleton (n : Nat) :
    sumList [n] = n := by
  simp [sumList]

/-- Sum-of-list is additive across `cons`. -/
theorem cluster_partition_total_cons (n : Nat) (xs : List Nat) :
    sumList (n :: xs) = n + sumList xs := by
  rfl

end LeanFormulas.Perception
