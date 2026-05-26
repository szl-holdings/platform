/-
Connection / NullSpace
======================

Formalises the core invariant from

  R. Sodagari, A. Khawar, T. C. Clancy, R. McGwier,
  *A Projection Based Approach for Radar and Telecommunication Systems
  Coexistence*, IEEE Globecom 2012.

Claim. Given a channel map `A : E → F` between additive groups and a
projector `P : E → E` whose image lies in the null-space of `A`, every
projected vector `P v` satisfies `A (P v) = 0`. The platform shim
`packages/agi-forecast/src/null-space.ts` checks this post-condition
numerically against 1k random inputs.

Registry tie (Task #5406)
-------------------------
This file's `null_space_coexistence` theorem is the Lean counterpart of
the `null-space-projection` entry in `lib/formulas/src/registry.ts`.
The naming convention is documented in `README.md`: the registry id is
mapped to a Lean identifier via `kebab-case → snake_case`, so
`null-space-projection` ↦ `null_space_projection` (the underlying
predicate) and the headline theorem keeps the legacy name.

Why pure Lean 4
---------------
This proof needs only the type-theoretic content that a projector into
the kernel annihilates the original map. No `ℝ`-specific or
inner-product machinery is required, so we keep the statement in core
Lean and let the runtime shim discharge the numerical side.
-/

namespace LeanFormulas.Connection

universe u v

/-- A zero element on the codomain. We work over any pointed type rather
than baking in `ℝ`; in the platform shim this is instantiated with the
real-valued channel output and `Float.zero`. -/
class HasZero (α : Type u) where
  zero : α

instance : HasZero Nat := ⟨0⟩

/-- `IsNullProjection A P` says `P` lands every input into the
null-space of `A`. This is exactly the post-condition the runtime
checks: for every `v`, `A (P v) = 0`. -/
def IsNullProjection {E : Type u} {F : Type v} [HasZero F]
    (A : E → F) (P : E → E) : Prop :=
  ∀ v : E, A (P v) = HasZero.zero

/-- **Null-space projection (registry: `null-space-projection`).**
For any null-projector `P` of channel `A`, the projected waveform
produces zero interference on `A`. This is the headline lemma the TS
shim `null-space.ts` exercises with 1k random inputs. -/
theorem null_space_projection
    {E : Type u} {F : Type v} [HasZero F]
    {A : E → F} {P : E → E}
    (h : IsNullProjection A P) (v : E) :
    A (P v) = HasZero.zero :=
  h v

/-- Historical alias kept so downstream prose may still cite the
"coexistence" lemma name from the 2012 paper. -/
theorem null_space_coexistence
    {E : Type u} {F : Type v} [HasZero F]
    {A : E → F} {P : E → E}
    (h : IsNullProjection A P) (v : E) :
    A (P v) = HasZero.zero :=
  null_space_projection h v

/-- Sanity check on `Nat`: the constant-zero projector is a null
projector of the identity map. Exercises `IsNullProjection` end-to-end
in the prelude so the theorem above is not vacuous on at least one
concrete instance. -/
theorem zero_projector_is_null :
    IsNullProjection (fun n : Nat => n) (fun _ => 0) := by
  intro _; rfl

end LeanFormulas.Connection
