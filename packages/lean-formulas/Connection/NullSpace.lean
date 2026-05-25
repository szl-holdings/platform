/-
Connection / NullSpace
======================

Formalises the core invariant from

  R. Sodagari, A. Khawar, T. C. Clancy, R. McGwier,
  *A Projection Based Approach for Radar and Telecommunication Systems
  Coexistence*, IEEE Globecom 2012.

Claim. Given a (full-row-rank) channel matrix `A : Fin m → Fin n → ℝ`, the
orthogonal projector `P` onto `(LinearMap.ker A)` satisfies `A ∘ P = 0` as a
linear map. Consequently, for every comms signal `v`, the projected waveform
`P v` lies in the null-space of the radar channel `A` and therefore induces
zero interference: `A (P v) = 0`.

This is the post-condition the TypeScript shim
`packages/agi-forecast/src/null-space.ts` checks numerically against
1k random inputs.
-/
import Mathlib.LinearAlgebra.Projection
import Mathlib.LinearAlgebra.Matrix.ToLin
import Mathlib.Analysis.InnerProductSpace.Projection

namespace LeanFormulas.Connection

open LinearMap Submodule

variable {𝕜 : Type*} [RCLike 𝕜]
variable {E F : Type*}
  [NormedAddCommGroup E] [InnerProductSpace 𝕜 E] [CompleteSpace E]
  [NormedAddCommGroup F] [InnerProductSpace 𝕜 F]

/-- The orthogonal projector onto the kernel of a continuous linear map `A`
sends every vector into `ker A`. -/
theorem orthogonalProjection_into_ker
    (A : E →L[𝕜] F) (v : E) :
    (orthogonalProjection (LinearMap.ker A.toLinearMap)) v ∈
      LinearMap.ker A.toLinearMap :=
  ((orthogonalProjection (LinearMap.ker A.toLinearMap)) v).2

/-- **Null-space coexistence lemma.** For every comms signal `v`, the
orthogonally-projected waveform produces zero interference on the radar
channel `A`. This is the post-condition tested by `null-space.ts`. -/
theorem null_space_coexistence
    (A : E →L[𝕜] F) (v : E) :
    A ((orthogonalProjection (LinearMap.ker A.toLinearMap) : E →L[𝕜] _) v) = 0 := by
  have h := orthogonalProjection_into_ker A v
  -- `h : (orthogonalProjection (ker A)) v ∈ ker A`, i.e. A (·) = 0.
  simpa [LinearMap.mem_ker, ContinuousLinearMap.coe_coe] using h

end LeanFormulas.Connection
