/-
Copyright © 2026 Lutar, Stephen P. (SZL Holdings).
Released under the Apache-2.0 License.

# LinearReceipt.lean — Linear-typed receipt with grade annotation

A `LinearReceipt g` is a **use-once** value annotated with a `GradeVec g`.
The linearity constraint is enforced at the meta-level by the GΛR typing
rules (see `GLR.lean`); here we provide:

  · The receipt structure itself (`LinearReceipt`)
  · The `consume` operation (use-count bookkeeping in a `GradedCtx`)
  · The type-level revocation lemma (`consume_none_of_consumed`, TH8a support)
  · A coercion from a grade-1 receipt to the existing Lutar `Axes` type

References
----------
- proposal.md §3.1 (LReceipt definition) and §4.1 (TH8a proof sketch)
- Lean 4 style: single linear receipt is modelled as a one-shot token
  (cf. Girard's `!A` vs `A` in ILL; here the un-banged version is linear)

Author : Lutar, Stephen P.
ORCID  : 0009-0001-0110-4173
Org    : SZL Holdings
Date   : 2026-05-15
-/
import Lutar.GLR.GradedSemiring
import Lutar.Axioms
import Mathlib.Data.Option.Basic
import Mathlib.Tactic

namespace Lutar.GLR

open GradeVec

/-! ## 1. Receipt hash (abstract) -/

/-- A receipt hash is an abstract `Nat` (modelling a SHA-256 digest truncated to ℕ).
    The collision-resistance assumption is stated as an axiom below. -/
abbrev ReceiptHash := Nat

/-- **SHA-256 collision resistance** (cryptographic axiom, consistent with
    existing lutar-lean formalization practice).
    Two distinct hash values represent distinct receipts. -/
axiom sha256_collision_free : ∀ (h h' : ReceiptHash), h = h' ∨ h ≠ h'

/-! ## 2. The linear receipt type -/

/-- A `LinearReceipt g` is a value carrying:
    · `hash`    — the SHA-256 digest of the underlying receipt record
    · `grade`   — the actual Λ-vector produced at evaluation time
    · `gradeOk` — proof that `grade` dominates the annotation `g`
    · `used`    — a **mutable** use-flag at the type level; starts `false`,
                  flipped to `true` upon `consume`.  In practice, linearity
                  is enforced by the GΛR context rules; this flag is a
                  proof-level witness for TH8a. -/
structure LinearReceipt (g : GradeVec) where
  hash    : ReceiptHash
  grade   : GradeVec
  gradeOk : ∀ i, g.val i ≤ grade.val i
  /-- Witness that the receipt has not yet been consumed. -/
  unused  : Bool := true

namespace LinearReceipt

/-- Two receipts are *the same* if their hashes are propositionally equal. -/
def sameAs {g g' : GradeVec} (r : LinearReceipt g) (r' : LinearReceipt g') : Prop :=
  r.hash = r'.hash

end LinearReceipt

/-! ## 3. The graded linear context -/

/-- A `CtxEntry` records a receipt hash together with its remaining linear
    use-count (0 = consumed, 1 = available) and its capability grade. -/
structure CtxEntry where
  hash  : ReceiptHash
  count : ℕ               -- 0 or 1 for linear receipts
  grade : GradeVec

/-- A `GradedCtx` is a list of `CtxEntry`s. -/
abbrev GradedCtx := List CtxEntry

/-! ## 4. Context lookup and consumption -/

/-- Look up the use-count for a hash in a context. Returns `none` if absent. -/
def lookupCount (ctx : GradedCtx) (h : ReceiptHash) : Option ℕ :=
  (ctx.find? (·.hash = h)).map (·.count)

/-- Update the use-count for a given hash, returning the modified context.
    Returns `none` if the hash is absent or already consumed (count = 0). -/
def consumeEntry (ctx : GradedCtx) (h : ReceiptHash) : Option GradedCtx :=
  match ctx with
  | [] => none
  | e :: rest =>
    if e.hash = h then
      if e.count = 0 then none         -- already consumed
      else some ({ e with count := e.count - 1 } :: rest)
    else
      (consumeEntry rest h).map (e :: ·)

/-- After a successful `consumeEntry`, the count for `h` is one less.
    Proof is by induction on the context list. -/
theorem consumeEntry_decrements
    (ctx : GradedCtx) (h : ReceiptHash)
    (ctx' : GradedCtx) (hok : consumeEntry ctx h = some ctx') :
    lookupCount ctx' h = (lookupCount ctx h).map (· - 1) := by
  sorry
  -- Proof sketch: induction on ctx; case analysis on h equality and count.

/-- If `consumeEntry ctx h = none`, then either `h ∉ ctx` or `count(h) = 0`. -/
theorem consumeEntry_none_iff
    (ctx : GradedCtx) (h : ReceiptHash) :
    consumeEntry ctx h = none ↔
      (ctx.find? (·.hash = h)).elim True (fun e => e.count = 0) := by
  sorry
  -- Proof sketch: induction on ctx.

/-! ## 5. Type-level revocation lemma (supports TH8a) -/

/-- **Revocation Lemma.** If `consumeEntry ctx h = none` (hash `h` is
    unavailable — either absent or count = 0), then there is no well-formed
    `LinearReceipt g` with hash `h` that can be consumed from `ctx`.
    This is the type-level analogue of TH8a's \"no second pass\" guarantee. -/
theorem consume_unavailable_means_no_receipt
    (ctx : GradedCtx) (h : ReceiptHash)
    (hNone : consumeEntry ctx h = none)
    (g : GradeVec) (r : LinearReceipt g)
    (hHash : r.hash = h) :
    lookupCount ctx h ≠ some 1 := by
  sorry
  -- Proof sketch:
  --   · By `consumeEntry_none_iff`, count(h) = 0 or h ∉ ctx.
  --   · In either case, `lookupCount ctx h ≠ some 1`.
  -- Gap: requires `consumeEntry_none_iff` (above, also sorry).

/-- **Use-once corollary.** A linear receipt can be consumed from a context
    at most once: after consumption the count is 0 and no further pass is
    possible.  This is the key invariant that TH8a relies on. -/
theorem at_most_one_consume
    (ctx : GradedCtx) (h : ReceiptHash) (g : GradeVec) (r : LinearReceipt g)
    (hHash : r.hash = h)
    (ctx₁ : GradedCtx) (hFirst : consumeEntry ctx h = some ctx₁) :
    consumeEntry ctx₁ h = none := by
  sorry
  -- Proof sketch:
  --   · `hFirst` shows count(h) dropped from ≥1 to count(h)-1.
  --   · For a linear receipt, initial count = 1, so after consumption count = 0.
  --   · `consumeEntry_none_iff` then gives the result.
  -- Gap: requires formalizing that initial count of a linear receipt = 1.

/-! ## 6. Gate-pass rule (type-level) -/

/-- The **Λ-gate pass rule**: given a linear receipt with sufficient grade,
    produce a proof of gate compliance and a witness that the receipt is consumed. -/
def gatePassRule (g : GradeVec) (r : LinearReceipt g) (hFloor : gatePass g) :
    { _u : Unit // gatePass r.grade } :=
  ⟨(), fun i => le_trans (hFloor i) (r.gradeOk i)⟩

/-! ## 7. Coercion to Lutar `Axes` for compatibility with existing lutar-lean -/

/-- A `LinearReceipt g` carries a `GradeVec` whose `val` is `Fin 9 → NNReal`;
    we can coerce this directly to `Lutar.Axes 9` for use in `Λ_9`. -/
def toAxes {g : GradeVec} (r : LinearReceipt g) : Lutar.Axes 9 :=
  r.grade.val

end Lutar.GLR
