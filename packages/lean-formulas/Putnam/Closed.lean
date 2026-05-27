/-
Putnam / Closed
===============

Closed-form Putnam-statement adapter for the
`@szl-holdings/putnam-harness` evaluator.

What this file is
-----------------
Most Putnam problems are proof-style: the candidate must justify a
universally quantified claim with no closed-form numeric output, which
means the `lean-check` stage can only verify *syntactic well-formedness*
of the candidate's encoded theorem statement (see
`packages/putnam-harness/src/lean-check.ts`).

A small subset of Putnam problems each year ask for an explicit
*closed-form numeric answer* — "find the largest a such that …",
"find the minimal value of k such that …", etc. For those problems the
candidate's answer can be encoded as a Lean 4 term and the elaborator
can genuinely type-check it. This file is the schema the harness uses
to wrap such answers.

Honesty contract
----------------
- Elaboration of the schema does NOT imply the candidate's answer
  matches the official Putnam answer key. It only verifies that the
  candidate produced a term of the declared type. The harness reports
  this as `elaborated: true, proofProvided: false` unless the candidate
  also supplies an equality proof against an official-answer constant.
- When the lean toolchain is unavailable the harness reports
  `toolchainAvailable: false, elaborated: false` — this file does NOT
  change that contract.
- No `axiom` declarations are introduced; the demo lemmas below are
  proved by `rfl` or `decide` against concrete `Nat` carriers so the
  `lake build` validation step remains genuinely green from a cold
  cache.

Why no mathlib
--------------
The package is mathlib-free for the reasons documented in
`packages/lean-formulas/README.md` § "Why no mathlib?". Closed-form
answers that need real numbers, π, or trig functions (e.g. Putnam 2025
problem 2: `a = 8/π², b = 1`) cannot be encoded here today. The schema
is parametric on the carrier `α`, so a future mathlib-backed root can
re-export it with `α := ℝ` without breaking existing callers.
-/

namespace LeanFormulas.Putnam.Closed

universe u

/-- A typed closed-form claim for one Putnam problem.

The candidate's answer is wrapped as a term of `α`, which the Lean
elaborator type-checks when the harness invokes `lake build` (or
`lake env lean`) on the generated stub. -/
structure ClosedFormClaim (α : Type u) where
  year       : Nat
  problemIdx : Nat
  answer     : α

/-- `MatchesOfficial claim official` says the candidate's `answer`
field is definitionally equal to the supplied official-answer-key
value. The harness can request this as an additional theorem from the
candidate (`theorem … : MatchesOfficial myClaim 1013 := rfl`); only
candidates whose answer matches the key will have the proof elaborate.
-/
def MatchesOfficial {α : Type u} (claim : ClosedFormClaim α) (official : α) : Prop :=
  claim.answer = official

/-! ### Demo claim

Exists only so the schema is exercised end-to-end inside the package's
own `lake build` — every root file in this package proves at least one
non-vacuous lemma so a typo in the schema fails CI rather than passing
silently. The values below are placeholders and are NOT the official
Putnam 2025 answer key. -/

/-- Placeholder demo claim (NOT the official Putnam 2025 P4 answer). -/
def demoClaim : ClosedFormClaim Nat :=
  { year := 2025, problemIdx := 4, answer := 0 }

theorem demoClaim_year : demoClaim.year = 2025 := rfl

theorem demoClaim_idx  : demoClaim.problemIdx = 4 := rfl

/-- The demo claim's answer matches its own value via `MatchesOfficial`,
proving the predicate is non-vacuous and the schema's `α := Nat`
specialisation type-checks. -/
theorem demoClaim_matches_self : MatchesOfficial demoClaim 0 := rfl

end LeanFormulas.Putnam.Closed
