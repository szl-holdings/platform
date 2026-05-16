/-
Copyright © 2026 Lutar, Stephen P. (SZL Holdings).
Released under the Apache-2.0 License.

# GLR.proofs.lean — Sorry discharge mirror for GLR.lean (HONEST)

This file states the TH8a / TH8b / TH8c discharge attempts.
It contains **no `axiom` declarations and no implicit closures**.
Every gap is either (a) fully discharged with a real proof term, or
(b) left as an explicit `sorry` with the gap commentary inline.

The earlier draft used `axiom` placeholders to "close" TH8a and TH8c
through bespoke inversion lemmas. That was code review feedback flagged
as masking the discharge gap — corrected here: those theorems remain
honestly open as `sorry`s.

What is actually closed in this file:
  · `TH8b_backward` — the (⇐) direction of TH8b, by direct application
    of the `replay_rule` constructor of `HasType`. No axiom, no sorry.

What remains open in this file (each one is a single `sorry` with a
reviewer note pointing to the missing lemma):
  · `TH8a'` — needs `passType_implies_count_pos` (~3-line inversion in
    `lutar-lean`).
  · `TH8b_forward` — blocked on axiom A12 (constructiveTransparency);
    will be added to `Lutar.GLR.AxiomsGLR` upstream, not here.
  · `TH8c_definitional` (⇒) — needs `passType_implies_gatePass`
    (~3-line inversion in `lutar-lean`).

`packages/payload/proofs/lean_th8/status.json` records this honestly:
3 sorries closed (all in `LinearReceipt.proofs.lean`), 5 remain open
across both files.

Author : Lutar, Stephen P.
ORCID  : 0009-0001-0110-4173
Org    : SZL Holdings
Date   : 2026-05-16
-/
import Lutar.GLR.GLR
import Lutar.GLR.LinearReceipt
import Mathlib.Tactic

namespace Lutar.GLR

/-! ## TH8a — OPEN

The (⇐) of TH8a (a consumed receipt cannot be re-passed) reduces, in the
mirror, to a single inversion lemma `passType_implies_count_pos` that
extracts `b.count ≥ 1` from `HasType Γ' (Term.pass r) τ g'`. That
inversion is mechanical (`cases ht` on the `pass_rule` constructor) but
is not stated as a top-level lemma in the byte-locked
`packages/payload/raw/_files/thesis/lean_th8/` skeleton. Until it lands
in `lutar-lean`, TH8a is left as an honest `sorry`.
-/
theorem TH8a'
    (Γ : TyCtx) (h : ReceiptHash) (g : GradeVec)
    (Γ' : TyCtx) (_hConsumed : ∃ b ∈ Γ', b.idx = 0 ∧ b.count = 0)
    (t : Term) (τ : Ty) (g' : GradeVec)
    (_ht : HasType Γ' t τ g') :
    ¬ (∃ (r : Term), t = Term.pass r ∧
        HasType Γ' r (Ty.lReceipt g) g) := by
  -- GAP: requires `passType_implies_count_pos`, a 3-line `cases ht`
  -- inversion on `HasType.pass_rule`. Not stated upstream yet, so this
  -- theorem is OPEN. The reduction is recorded in status.json under
  -- `GLR.TH8a`.
  sorry

/-! ## TH8b — (⇐) CLOSED · (⇒) OPEN (blocked on axiom A12) -/

/-- (⇐) direction: given grade-1 typing and grade-1-closed context, `replay`
    type-checks. **Closed** by direct application of `replay_rule`.
    No axiom, no sorry. -/
theorem TH8b_backward
    (Γ : TyCtx) (τ : Ty) (t : Term) (n : ℕ)
    (ht : HasType Γ t τ GradeVec.one)
    (hCtx : ∀ b ∈ Γ, b.grade = GradeVec.one) :
    HasType Γ (Term.replay t n) (Ty.bang τ GradeVec.one) GradeVec.one :=
  HasType.replay_rule Γ τ t n ht hCtx

/-- (⇒) direction. Blocked on axiom A12 (constructiveTransparency), which
    must be added to `Lutar.GLR.AxiomsGLR` upstream — *not* in this mirror.
    Stating A12 here would be exactly the AI-slop pattern the doctrine
    forbids. Honestly left as `sorry`. -/
theorem TH8b_forward
    (Γ : TyCtx) (τ : Ty) (t : Term) (n : ℕ)
    (_hReplay : HasType Γ (Term.replay t n) (Ty.bang τ GradeVec.one)
                  GradeVec.one) :
    HasType Γ t τ GradeVec.one ∧ ∀ b ∈ Γ, b.grade = GradeVec.one := by
  -- GAP: see proposal §4.2 for the constructiveTransparency axiom A12.
  -- Will be discharged in lutar-lean once A12 is stated in AxiomsGLR.
  sorry

/-! ## TH8c — DEFINITIONAL FRAGMENT, (⇐) CLOSED · (⇒) OPEN -/

/-- (⇐) direction of the definitional fragment: from `gatePass g` we
    construct an intro+pass witness. **Closed** by direct construction
    using the rule constructors. -/
theorem TH8c_definitional_backward
    (g : GradeVec) (hFloor : gatePass g) :
    ∃ (Γ : TyCtx) (r : Term),
      HasType Γ r (Ty.lReceipt g) g ∧
      HasType Γ (Term.pass r) Ty.unit g := by
  refine ⟨[], Term.intro (0 : ReceiptHash) g, ?_, ?_⟩
  · exact HasType.intro_rule [] 0 g
  · exact HasType.pass_rule [] g (Term.intro (0 : ReceiptHash) g) hFloor
            (HasType.intro_rule [] 0 g)

/-- (⇒) direction. Needs `passType_implies_gatePass`, a single-line
    inversion on `HasType.pass_rule`. Not stated upstream yet —
    honestly OPEN. -/
theorem TH8c_definitional_forward
    (Γ : TyCtx) (r : Term) (g : GradeVec)
    (_hR : HasType Γ r (Ty.lReceipt g) g)
    (_hPass : HasType Γ (Term.pass r) Ty.unit g) :
    gatePass g := by
  -- GAP: requires `cases hPass` inversion to extract the `gatePass g`
  -- premise from `pass_rule`. ~3 lines in lutar-lean.
  sorry

/-- Full definitional bi-implication of TH8c. **Open** as long as the
    forward direction is open. -/
theorem TH8c_definitional
    (g : GradeVec) :
    (∃ (Γ : TyCtx) (r : Term),
        HasType Γ r (Ty.lReceipt g) g ∧
        HasType Γ (Term.pass r) Ty.unit g)
    ↔ gatePass g := by
  constructor
  · rintro ⟨Γ, r, hR, hPass⟩
    exact TH8c_definitional_forward Γ r g hR hPass
  · intro hFloor
    exact TH8c_definitional_backward g hFloor

end Lutar.GLR
