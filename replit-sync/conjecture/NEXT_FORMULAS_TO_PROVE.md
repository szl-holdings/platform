# NEXT FORMULAS TO PROVE
## SZL Holdings — Lean 4 / Lake / Mathlib Proving Squad Specification
**Date:** 2026-06-10  
**Repo:** [szl-holdings/lutar-lean](https://github.com/szl-holdings/lutar-lean) @ main (Lean v4.18.0, Mathlib)  
**Zenodo DOI:** [10.5281/zenodo.20434308](https://doi.org/10.5281/zenodo.20434308)  
**Audience:** Proof engineers, defense reviewers, Warhacker narrative team  

---

## PREAMBLE — WHAT IS ALREADY PROVEN (DO NOT RE-PROPOSE)

| Status | Content |
|--------|---------|
| **Locked (5 sorry-free, kernel-only)** | F1, F11, F12, F18, F19 in `PuriqFormulaLean.lean` |
| **CI-green experimental** | Wave-5: AM-GM, Cauchy-Schwarz, C1/C2/C6; Wave-6: graph/info substrate, Set-α/Set-δ uniqueness; Wave-7: Doob martingale, PAC-Bayes, C3 Hoeffding, C4 Azuma, C5 KL≥0; Agentic P1-P6 (governed run soundness, non-interference); Coder formulas (sandbox, router, consensus, Kraft, NI); `lambda_unique_setAlpha` (Lean-core axioms only); `unconditional_lambda_is_false` (machine-checked FALSE — Λ uniqueness under A1-A5 is Conjecture 1) |

**Key honest constraint:** `lutar_is_geomean` / TH10 remains **Conjecture 1**, NOT a theorem. Any formula below that implicitly assumes Λ = GM must be labeled accordingly.

---

## RECOMMENDED "PROVE THESE BEFORE JUNE 16" SHORTLIST

| Priority | Formula ID | Area | Rationale |
|----------|-----------|------|-----------|
| **P1** | M1 — Merkle Inclusion Soundness | Tamper-Evidence | Directly backs Cannonico tamper-evident record; fully formalizable with Mathlib hash/coloring; medium difficulty; known theorem |
| **P2** | M2 — Hash-Chain Append-Only Consistency | Tamper-Evidence | One-page proof using collision-resistance assumption; strongest Warhacker narrative claim; easy |
| **P3** | CP1 — Split Conformal Marginal Coverage | Conformal/Uncertainty | The single cleanest "proven interval" claim; closes the 'conformal not Hoeffding' gap; medium; known theorem |
| **P4** | G1 — CPA Minimality Correctness | Geometry/Collision | Quadratic distance minimization over reals; Mathlib has `Polynomial.roots`, `Real.sqrt`; medium; known theorem backs killinchu collision claim |
| **P5** | B1 — Byzantine 3f+1 Lower Bound (abstract) | Consensus/Distributed | Abstract impossibility with ≤3f nodes; uses Fintype + pigeonhole; medium; backs multi-agent mesh safety |
| **P6** | Q1 — Density Matrix PSD Closure Under Mixture | Quantum/Spectral | Trivially follows `Matrix.PosSemidef.add` in Mathlib; easy; honest QM gate backing |
| **P7** | L1 — Quasi-Arithmetic Mean Kolmogorov Characterization (finite, fixed-n) | Lambda/Aggregation | Provides context for why Λ is geometric mean when unique; medium; citable (Kolmogorov 1930) |
| **P8** | Ph1 — Axiom-Set Disclosure Meta-Theorem | Philosophy/Logic | `#print axioms` discipline as a theorem about our proof system; easy; honest-by-construction narrative |

---

## AREA 1: TAMPER-EVIDENCE / RECEIPTS

**Software benefit:** Backs the Cannonico tamper-evident audit log claim, SBOM provenance (`Lutar/HUKLLA/SBOMProvenance.lean`), and any "we can't rewrite history without detection" assertion in the Warhacker story.

---

### M1 — Merkle Inclusion Soundness (second-preimage resistance reduction)

**Theorem statement (informal → Lean sketch):**
```lean
-- Given: collision_resistant : ∀ (x y : Bytes), H x = H y → x = y  (idealization)
-- A Merkle tree built with domain-separated hashing (leaf prefix 0x00, node prefix 0x01)
-- cannot produce a valid inclusion proof for a value that is not a leaf.
theorem merkle_inclusion_sound
    (H : Bytes → Hash) (collision_resistant : CollisionResistant H)
    (tree : MerkleTree H) (v : Bytes) (proof : InclusionProof)
    (h : verify_inclusion tree.root v proof = true) :
    ∃ i, tree.leaf i = H (0x00 ++ v) := ...
```
**Precise content:** Soundness of the verification predicate: if `verify_inclusion` returns `true`, the value appears as a leaf. The second-preimage attack (an internal node masquerading as a leaf) is blocked by domain separation. Reduction: if the proof system is unsound, the adversary has found a hash collision.

**Software / Warhacker benefit:** Cannonico receipt verification. Backs any claim that "the audit trail is unforgeable without breaking SHA-256." Closes tracked sorry at `Lutar/HUKLLA/SBOMProvenance.lean:109`.

**Source / Citation:**  
- RFC 6962 (Certificate Transparency Merkle audit paths): [https://datatracker.ietf.org/doc/html/rfc6962](https://datatracker.ietf.org/doc/html/rfc6962)  
- Nethermind second-preimage analysis: [https://www.nethermind.io/blog/preventing-the-second-preimage-attack-in-merkle-proof-verification](https://www.nethermind.io/blog/preventing-the-second-preimage-attack-in-merkle-proof-verification) (Apache 2.0)  
- LambdaClass Lean 4 Merkle / ZK article: [https://blog.lambdaclass.com/if-it-compiles-it-is-correct-almost-an-introduction-to-lean-4-for-zk-systems-and-engineering-2/](https://blog.lambdaclass.com/if-it-compiles-it-is-correct-almost-an-introduction-to-lean-4-for-zk-systems-and-engineering-2/)  
- Phemex news note on Lean-verified Merkle theorem: [https://phemex.com/news/article/lean-theorem-proves-security-of-merkle-tree-hash-functions-82763](https://phemex.com/news/article/lean-theorem-proves-security-of-merkle-tree-hash-functions-82763)

**Mathlib prereqs exist?** YES. `Mathlib.Data.List.Basic` (path traversal), `Mathlib.Data.ByteArray` (bytes), `Finset` for leaf index. Hash collision resistance must be axiomatized as a hypothesis (standard ROM approach). No Mathlib Merkle library exists yet — we build it.

**Difficulty:** Medium. Need to define `MerkleTree`, `InclusionProof`, `verify_inclusion` as Lean types (~80 LOC definitions), then prove soundness by induction on tree height (~50 LOC proof). The domain-separation argument is short given the collision-resistance axiom.

**Honest risk:** **Known theorem, formalization only.** The mathematical fact is classical (certificate transparency literature). We are formalizing the Lean types + proof, not doing new math. Risk: defining `Bytes` and `Hash` abstractly without overfitting to a specific hash function. Use abstract `H : Bytes → Bytes` with `CollisionResistant H` as a hypothesis.

**Status:** **PROVE-NOW**

---

### M2 — Hash-Chain Append-Only Consistency

**Theorem statement:**
```lean
-- A hash chain: entry i contains hash H(entry_{i-1} ++ payload_i)
-- Any modification to entry k (k < n) changes the hash of every subsequent entry.
theorem hash_chain_consistency
    (H : Bytes → Hash) (cr : CollisionResistant H)
    (chain : HashChain H n) (chain' : HashChain H n)
    (k : Fin n) (hk : chain.entry k ≠ chain'.entry k)
    (hroots : chain.root = chain'.root) : False
```
**Precise content:** Two hash chains of the same length with equal roots must have identical entries at every position. Equivalently, there is no way to rewrite entry k without detection (a changed root or a hash collision).

**Software / Warhacker benefit:** Backs the "append-only audit ledger" claim in a11oy. Provably: "the chain cannot be rewritten without detection" — the exact wording used in Warhacker narrative.

**Source / Citation:**  
- Certificate Transparency append-only explanation: [https://certificate.transparency.dev/howctworks/](https://certificate.transparency.dev/howctworks/)  
- Adaptive Query governance audit ledger article: [https://qu3ry.net/articles/cryptographic-governance/audit-ledger](https://qu3ry.net/articles/cryptographic-governance/audit-ledger)  
- GlassDB VLDB 2023 (append-only proof structure): [https://www.vldb.org/pvldb/vol16/p1359-ooi.pdf](https://www.vldb.org/pvldb/vol16/p1359-ooi.pdf)

**Mathlib prereqs exist?** YES. Induction on `Fin n`, list equality, `Function.Injective` applied to `H`. Short proof.

**Difficulty:** Easy (~30 LOC). Standard induction: if `chain.root = chain'.root` and roots are `H(H(chain.entry (n-1)) ++ ...)`, then by injectivity of H the entire chain is forced.

**Honest risk:** **Known theorem, formalization only.** This is textbook collision-resistance reasoning. Straightforward.

**Status:** **PROVE-NOW**

---

### M3 — DSSE Search Token Injectivity

**Theorem statement:**
```lean
-- A dynamic symmetric searchable encryption scheme with injective token generation
-- ensures distinct keywords map to distinct search tokens.
theorem dsse_token_injective
    (PRF : Key → Keyword → Token) (prf_injective : ∀ k, Function.Injective (PRF k))
    (k : Key) (w1 w2 : Keyword) (h : PRF k w1 = PRF k w2) : w1 = w2
```
**Precise content:** Under a PRF-based DSSE, the search token generation is injective in the keyword argument, given a fixed key. This backs the claim that distinct queries remain distinguishable by the server (correctness of search).

**Software / Warhacker benefit:** SBOM provenance in `a11oy Code` — the coder's dependency search is backed by a tamper-evident index. Shows the retrieval is correct.

**Source / Citation:**  
- Kamara & Papamanthou, "Parallel and Dynamic Searchable Symmetric Encryption," CCS 2013: [https://cs.brown.edu/people/seny/pubs/psse.pdf](https://cs.brown.edu/people/seny/pubs/psse.pdf)  
- Cash et al., "Forward Secure Dynamic Searchable Symmetric Encryption," CCS 2017: [https://dl.acm.org/doi/10.1145/3133956.3133970](https://dl.acm.org/doi/10.1145/3133956.3133970)

**Mathlib prereqs exist?** YES. `Function.Injective` is in Mathlib core. PRF injectivity needs to be an axiom/hypothesis — Mathlib does not have cryptographic PRF formalization.

**Difficulty:** Easy (~15 LOC). The theorem is almost definitionally immediate from the hypothesis once the types are set up.

**Honest risk:** **Known theorem, formalization only. Easy.** But scope is narrow — does not prove DSSE security, only keyword-token injectivity under the idealized PRF.

**Status:** **ROADMAP** (lower priority; M1+M2 cover the tamper-evidence narrative better)

---

## AREA 2: RUNTIME ASSURANCE / MONITORS

**Software benefit:** Backs killinchu drone C2 oversight — the claim that the monitor "catches line-crossing" and that the Simplex switch keeps the system in the safe set.

---

### S1 — STL Robustness Soundness (ρ ≥ 0 ↔ satisfies)

**Theorem statement:**
```lean
-- For a Signal Temporal Logic formula φ and a discrete-time signal w,
-- robustness ρ(φ, w, t) ≥ 0 implies w satisfies φ at time t.
theorem stl_robustness_sound
    {α : Type} (φ : STLFormula α) (w : DiscreteSignal α) (t : ℕ)
    (h : 0 ≤ robustness φ w t) : satisfies φ w t

-- And the converse (completeness):
theorem stl_robustness_complete
    {α : Type} (φ : STLFormula α) (w : DiscreteSignal α) (t : ℕ)
    (h : satisfies φ w t) : 0 ≤ robustness φ w t
```
**Precise content:** The robustness function ρ(φ,w,t) (defined inductively over STL formula structure: predicates → real value; ∧ → min; ∨ → max; G[a,b] → min over window; F[a,b] → max over window) is sound: non-negative robustness certifies satisfaction. This is the key theorem in [Donzé & Maler 2010] and [Fainekos & Pappas 2009].

**Software / Warhacker benefit:** The killinchu monitor computes robustness of geofence and separation constraints. Proving soundness means: when the monitor says "in bounds" (ρ ≥ 0), the drone legally satisfies the constraint. Directly backs the "catch line-crossing" claim.

**Source / Citation:**  
- Donzé & Maler, "Robust Satisfaction of Temporal Logic over Real-Valued Signals," FORMATS 2010: [http://www-verimag.imag.fr/~maler/Papers/sensiform.pdf](http://www-verimag.imag.fr/~maler/Papers/sensiform.pdf)  
- GradSTL (Coq-verified STL robustness, OCaml code gen): arXiv:2508.04438 [https://arxiv.org/html/2508.04438v1](https://arxiv.org/html/2508.04438v1) — **directly citable precedent for this approach**  
- Maler & Nickovic, "Monitoring Temporal Properties of Continuous Signals," FTRTFT 2004 (original STL paper)

**Mathlib prereqs exist?** PARTIAL. Mathlib has `Real`, `Finset.inf`, `Finset.sup`, `min`, `max`. Need to define `STLFormula` inductive type and `robustness` function (~100 LOC). GradSTL paper (arXiv:2508.04438) proves this in Coq/Rocq; porting the proof structure to Lean 4 is feasible.

**Difficulty:** Medium (~200 LOC). The induction on formula structure is clean; the hard case is temporal operators (need to bound the time window). Mathlib's `Finset.inf'` and `Finset.sup'` are the right tools.

**Honest risk:** **Known theorem (Donzé & Maler 2010), formalization only.** The math is not novel — Lean 4 formalization of STL robustness soundness does not yet exist in Mathlib (as of 2026-06-10). Medium engineering effort.

**Status:** **PROVE-NOW** (high Warhacker value)

---

### S2 — Simplex/RTA Switching Safety Invariant

**Theorem statement:**
```lean
-- Simplex architecture: advanced controller (AC) + reversionary controller (RC)
-- The switched system remains in safe set S whenever the monitor switches correctly.
theorem simplex_safety_invariant
    (S : SafeSet State) (monitor : State → Bool)
    (RC_safe : ∀ s ∈ S, RC_step s ∈ S)         -- RC preserves S
    (monitor_sound : ∀ s, monitor s = false → s ∉ S → False)  -- monitor catches violations
    (init : s₀ ∈ S) :
    ∀ t, simplex_trajectory AC RC monitor s₀ t ∈ S
```
**Precise content:** If the reversionary controller is safe (keeps the system in S), and the monitor is sound (triggers switching before leaving S), and the system starts in S, then the Simplex trajectory stays in S for all time.

**Software / Warhacker benefit:** Backs the a11oy C2 override gate and killinchu autonomous mode. Formally: "if the AI controller proposes an unsafe action, the monitor switches to the safe fallback, and the system stays in bounds." Directly proves the Warhacker "catch the line-crossing" claim.

**Source / Citation:**  
- NASA Langley Simplex/RTA formalization in Plaidypvs (DASC 2024): [https://shemesh.larc.nasa.gov/fm/papers/DASC2024-SWDMC-draft.pdf](https://shemesh.larc.nasa.gov/fm/papers/DASC2024-SWDMC-draft.pdf)  
- Synergistic Simplex architecture (arXiv:2605.08190): [https://arxiv.org/html/2605.08190v1](https://arxiv.org/html/2605.08190v1)  
- Black-Box Simplex (NSF): [https://par.nsf.gov/servlets/purl/10327769](https://par.nsf.gov/servlets/purl/10327769)  
- Sha, "Using Simplicity to Control Complexity," IEEE Software 2001 (original Simplex paper)

**Mathlib prereqs exist?** YES. Proof uses `Nat` induction for discrete time, `∈` for safe set membership, `Bool` for monitor output. State space must be a type with a `SafeSet` predicate — all constructible in Lean 4.

**Difficulty:** Medium (~150 LOC). The proof is clean induction on time steps given the two safety conditions. The NASA PVS proof (above) provides a blueprint.

**Honest risk:** **Known theorem (NASA RTA literature), formalization only.** The Lean 4 version is novel but the math is not. NOTE: The theorem is only as strong as the monitor soundness assumption — in practice the monitor is itself unverified software. Flag this in the Warhacker narrative: the formal proof guarantees safety *conditional on* monitor soundness, which is a separate hardware/software concern.

**Status:** **PROVE-NOW**

---

## AREA 3: CONFORMAL / UNCERTAINTY

**Software benefit:** Backs a11oy's trust interval claim — "the confidence interval has a proven coverage bound, not just a heuristic one." Distinguishes conformal prediction from Hoeffding/Azuma (which bound different quantities).

---

### CP1 — Split Conformal Marginal Coverage Guarantee

**Theorem statement:**
```lean
-- Split conformal prediction: calibration set {(X_i, Y_i)}_{i=1}^n + test point (X_{n+1}, Y_{n+1})
-- are exchangeable. Nonconformity scores S_i = s(X_i, Y_i), S_{n+1} = s(X_{n+1}, Y_{n+1}).
-- Prediction set: C_α(x) = {y : s(x,y) ≤ q̂_{1-α}}
-- where q̂_{1-α} is the ⌈(n+1)(1-α)⌉/n empirical quantile of {S_1,...,S_n, +∞}.
theorem conformal_marginal_coverage
    {n : ℕ} (hn : 0 < n)
    (scores : Fin (n+1) → ℝ)
    (exchangeable : Exchangeable scores)
    (α : ℝ) (hα : 0 < α) (hα1 : α < 1)
    (qhat : ℝ) (hqhat : qhat = empirical_quantile (1 - α) (scores ∘ Fin.castSucc) ∞) :
    (1 - α) ≤ Prob (scores (Fin.last n) ≤ qhat) ∧
    Prob (scores (Fin.last n) ≤ qhat) ≤ (1 - α) + 1 / (n + 1 : ℝ)
```
**Precise content:** The standard split conformal coverage theorem: under exchangeability, the probability that the test point's score falls below the calibration quantile is exactly in `[1-α, 1-α + 1/(n+1)]`. This is the **finite-sample** guarantee — stronger than Hoeffding (which requires bounded variance) and applies without distributional assumptions.

**Software / Warhacker benefit:** When a11oy reports a trust interval, the claim is: "this interval covers the true value with probability at least 1-α." Proving CP1 makes this a machine-checked theorem, not a heuristic. Closes the gap between the Wave-7 Hoeffding formulas (C3) and the actual conformal coverage guarantee. The interval is "conformal, not Hoeffding" — and now provably so.

**Source / Citation:**  
- Shafer & Vovk, "A Tutorial on Conformal Prediction," JMLR 2008: [https://jmlr.csail.mit.edu/papers/volume9/shafer08a/shafer08a.pdf](https://jmlr.csail.mit.edu/papers/volume9/shafer08a/shafer08a.pdf) (open access)  
- Vovk, Gammerman, Shafer, "Algorithmic Learning in a Random World" (ALRW): [https://www.alrw.net](https://www.alrw.net)  
- UAI 2024 Tutorial slides ("quantile lemma" proof): [https://www.auai.org/uai2024/public/tutorial_slides/UAI2024_Tutorial_3_ConformalPred.pdf](https://www.auai.org/uai2024/public/tutorial_slides/UAI2024_Tutorial_3_ConformalPred.pdf)  
- Angelopoulos & Bates, "A Gentle Introduction to Conformal Prediction," arXiv:2107.07511: [https://arxiv.org/abs/2107.07511](https://arxiv.org/abs/2107.07511)

**Mathlib prereqs exist?** PARTIAL. Mathlib has `Finset.sort`, `List.Sorted`, order statistics for `Finset`. The core tool needed is the **quantile lemma for exchangeable sequences**, which requires `MeasureTheory.Measure.Prob` and `Finset.card`. The key step is: among n+1 exchangeable scalars, the rank of the last one is uniform on {1,...,n+1}, so Prob(rank ≤ ⌈(n+1)(1-α)⌉) ≥ 1-α. This uses `Finset.card_filter` and combinatorial counting — all available in Mathlib.

**Difficulty:** Medium (~200 LOC). The quantile lemma proof is short (5-10 lines once the right Mathlib lemmas are assembled); the main work is defining `Exchangeable`, `empirical_quantile`, and setting up the probability space correctly. Precedent: [Shafer & Vovk, p.9] gives the argument in one paragraph.

**Honest risk:** **Known theorem (Vovk et al. 2005), formalization only.** Note the bounds: coverage is exactly `[1-α, 1-α + 1/(n+1)]` — not exact 1-α. Be precise in the Warhacker narrative: "at least 1-α, at most 1-α + 1/(n+1)." The theorem does NOT guarantee conditional coverage (given X=x) — only marginal (averaged over X). Flag this explicitly.

**Status:** **PROVE-NOW** (highest impact for trust interval claim)

---

## AREA 4: GEOMETRY / COLLISION

**Software benefit:** Backs killinchu collision avoidance (CPA/TCPA correct computation) and keep-out zone enforcement (geofence polygon containment).

---

### G1 — CPA Minimality Correctness

**Theorem statement:**
```lean
-- Two objects with positions p₁(t) = p₁₀ + v₁ * t, p₂(t) = p₂₀ + v₂ * t
-- (linear trajectories in ℝ²). The distance squared D(t) = ‖Δp + Δv * t‖²
-- is a quadratic in t. The CPA time t* = -⟨Δp, Δv⟩ / ‖Δv‖² (when ‖Δv‖ ≠ 0)
-- is the unique minimizer.
theorem cpa_time_correct
    (Δp Δv : EuclideanSpace ℝ (Fin 2))
    (hv : Δv ≠ 0) :
    let t_star := -(inner Δp Δv : ℝ) / ‖Δv‖^2
    ∀ t : ℝ, ‖Δp + t_star • Δv‖ ≤ ‖Δp + t • Δv‖

-- And the TCPA (time to CPA) is in [0, lookahead] iff there is a conflict window:
theorem tcpa_in_range
    (Δp Δv : EuclideanSpace ℝ (Fin 2)) (hv : Δv ≠ 0) (T : ℝ) (hT : 0 < T)
    (t_star := -(inner Δp Δv : ℝ) / ‖Δv‖^2) :
    (0 ≤ t_star ∧ t_star ≤ T) ↔ conflict_in_lookahead Δp Δv T
```
**Precise content:** The CPA (closest point of approach) time is the zero-crossing of d/dt ‖Δp + Δv*t‖² = 2⟨Δp + Δv*t, Δv⟩ = 0, giving t* = -⟨Δp,Δv⟩/‖Δv‖². The proof shows D(t) = ‖Δv‖²(t - t*)² + (D(t*)) is convex in t, so t* is the global minimum. TCPA is in [0,T] iff the objects approach and reach closest approach within the lookahead window.

**Software / Warhacker benefit:** killinchu computes CPA/TCPA for collision avoidance. Proving G1 means: the computed closest approach distance is the **true** minimum — not an approximation. Directly backs "the drone correctly identifies the closest approach" claim. Analogous to NASA's DAIDALUS PVS formalization of detect-and-avoid for UAS.

**Source / Citation:**  
- NASA/DAIDALUS formal verification in PVS (UAS DAA): [https://cs.uiowa.edu/sites/cs.uiowa.edu/files/2024-12/2024-11-FMITF_Dutle.pdf](https://cs.uiowa.edu/sites/cs.uiowa.edu/files/2024-12/2024-11-FMITF_Dutle.pdf)  
- Kestrel Institute, "Determining the Closest Approaches between Two Piecewise-Linear Routes" (2019): [https://www.kestrel.edu/people/fitzpatrick/pub/TechnicalNote-2019-ClosestApproach.pdf](https://www.kestrel.edu/people/fitzpatrick/pub/TechnicalNote-2019-ClosestApproach.pdf)  
- Cauchy-Schwarz / inner product inequality already proven in lutar-lean Wave-5

**Mathlib prereqs exist?** YES. `EuclideanSpace`, `inner`, `norm_sq`, `deriv`, `IsMinOn` all in Mathlib. `Polynomial.IsMinOn` for quadratics. The proof is: differentiate D(t), set to zero, verify second derivative positive (= 2‖Δv‖² > 0).

**Difficulty:** Medium (~120 LOC). The calculus is straightforward; main effort is working with `EuclideanSpace ℝ (Fin 2)` types and `inner` product notation in Lean 4.

**Honest risk:** **Known theorem (classical geometry), formalization only.** NASA has proven the analogous result in PVS for DAIDALUS. No research novelty — pure formalization value for killinchu. The linear trajectory assumption is exact for the short time windows used in maritime/drone CPA.

**Status:** **PROVE-NOW**

---

### G2 — Polygon Point-in-Polygon (Winding Number Soundness)

**Theorem statement:**
```lean
-- For a simple polygon P (list of vertices, non-self-intersecting) and a point s not on ∂P:
-- winding_number P s ≠ 0 ↔ s is inside P
theorem polygon_containment_sound
    (P : List (ℝ × ℝ)) (simple : IsSimplePolygon P)
    (s : ℝ × ℝ) (hs : s ∉ boundary P) :
    winding_number P s ≠ 0 ↔ inside P s

-- Corollary: the geofence keep-out check is sound
theorem geofence_keepout_sound
    (fence : Polygon) (drone_pos : ℝ × ℝ) :
    geofence_alert fence drone_pos = true ↔ drone_pos ∈ fence
```
**Precise content:** The winding number algorithm (used in PolyCARP) correctly classifies interior/exterior for simple polygons. NASA has proven this in PVS/Frama-C; we prove the algebraic version in Lean 4 using `EuclideanSpace ℝ (Fin 2)`.

**Software / Warhacker benefit:** killinchu geofence. Proves the keep-out zone is correctly enforced — the drone is reported as inside the exclusion zone if and only if it is geometrically inside. Directly backs "the geofence alert is correct."

**Source / Citation:**  
- NASA PolyCARP PVS formalization, FM 2019: [https://shemesh.larc.nasa.gov/fm/papers/FM2019-draft.pdf](https://shemesh.larc.nasa.gov/fm/papers/FM2019-draft.pdf) (NASA open)  
- PolyCARP library: [https://shemesh.larc.nasa.gov/fm/PolyCARP](https://shemesh.larc.nasa.gov/fm/PolyCARP)  
- Wikipedia winding number algorithm: [https://en.wikipedia.org/wiki/Point_in_polygon](https://en.wikipedia.org/wiki/Point_in_polygon)

**Mathlib prereqs exist?** PARTIAL. Mathlib has `Complex.winding_number` (for complex functions) but not the combinatorial polygon winding number algorithm directly. Need to define `IsSimplePolygon`, the edge-crossing count, and prove the Jordan-curve-theorem-style characterization. This is the hard part — the Jordan curve theorem exists in Mathlib but the discretized polygon version may need work.

**Difficulty:** Hard (~400+ LOC for the full theorem; Medium if we state it with Jordan curve theorem as an assumption). Recommend: prove `geofence_keepout_sound` assuming `winding_number` defined correctly, then separately prove `winding_number` computes the correct topological winding number.

**Honest risk:** **Known theorem (PolyCARP has PVS proof), Lean 4 formalization is research-level effort.** NASA's PVS proof for PolyCARP took significant effort. Lean 4 porting is nontrivial. Consider a **weaker version**: prove correctness for convex polygons only (much simpler using `Convex` and `Finset.sum` in Mathlib) — this already covers most maritime geofence use cases.

**Status:** **ROADMAP** for full version; **PROVE-NOW** for convex polygon special case

---

## AREA 5: AGGREGATION / TRUST (Λ-related honest results)

**Software benefit:** Backs a11oy's governance gate. Provides positive characterization theorems around the Λ aggregator without claiming the false uniqueness theorem.

---

### L1 — Kolmogorov-Nagumo Quasi-Arithmetic Mean Characterization (finite fixed-n)

**Theorem statement:**
```lean
-- For fixed n ≥ 2, a function F : Iⁿ → I on a real interval I is
-- (1) continuous, (2) symmetric, (3) strictly increasing in each variable,
-- (4) bisymmetric: F(F(x₁,x₂),F(x₃,x₄)) = F(F(x₁,x₃),F(x₂,x₄)),
-- (5) reflexive: F(x,...,x) = x
-- if and only if F = f⁻¹(Σf(xᵢ)/n) for some continuous strictly monotone f.
theorem kolmogorov_nagumo_characterization
    {I : Set ℝ} (I_interval : IsInterval I)
    (F : Fin n → ℝ → ℝ) -- F as curried form
    (hcont : Continuous F) (hsymm : Symmetric F) (hmono : StrictlyMono F)
    (hbisymm : Bisymmetric F) (hrefl : Reflexive F) :
    ∃ (f : ℝ → ℝ), StrictMono f ∧ Continuous f ∧
      ∀ xs : Fin n → ℝ, F xs = f⁻¹' {(∑ i, f (xs i)) / n}
```
**Precise content:** The classical Kolmogorov (1930), Nagumo (1930), de Finetti (1931) characterization theorem for quasi-arithmetic means at fixed arity. Recent 2026 arXiv paper (arXiv:2606.05221) proves this **without requiring continuity** (it follows from the other axioms alone). We formalize the classical version with continuity for now.

**Software / Warhacker benefit:** The Λ aggregator is conjectured to equal the geometric mean (TH10). This theorem provides honest context: "any aggregator satisfying these five properties IS a generalized mean — and the geometric mean is the unique homogeneous one." This backs the Warhacker narrative that Λ is architecturally coherent without claiming the false uniqueness.

**Source / Citation:**  
- Wikipedia quasi-arithmetic mean: [https://en.wikipedia.org/wiki/Quasi-arithmetic_mean](https://en.wikipedia.org/wiki/Quasi-arithmetic_mean)  
- Aczél & Maksa characterization arXiv 1501.02857: [https://arxiv.org/pdf/1501.02857](https://arxiv.org/pdf/1501.02857)  
- Burai, Kiss, Szokol 2026 "N-ary quasi-arithmetic means without regularity" arXiv:2606.05221: [https://arxiv.org/html/2606.05221v1](https://arxiv.org/html/2606.05221v1) (proves continuity follows automatically — **most recent result, citable**)  
- Kolmogorov 1930, Hardy-Littlewood-Pólya (power means, page 68)

**Mathlib prereqs exist?** PARTIAL. Mathlib has `Continuous`, `StrictMono`, `IsInterval`, `Finset.sum`. The inverse function and mean definition need manual setup. The bisymmetry condition is non-standard but short to define.

**Difficulty:** Hard for the full characterization (~500 LOC); Medium for just stating and proving "bisymmetric + reflexive + strict mono + continuous ⟹ quasi-arithmetic" using the published proof blueprint from Burai et al. 2026.

**Honest risk:** **Known theorem, formalization of classical result.** The hardest part is the density argument ("f(D_n) is dense in I, hence f extends continuously"). This requires `Dense.closure` in Mathlib topology. The 2026 Burai-Kiss-Szokol result (arXiv:2606.05221) eliminates the need to assume continuity, which simplifies the characterization but complicates the proof of the characterization itself.

**Status:** **ROADMAP** (high value but high effort; start with a lemma that `green_lambda` (the geometric mean) is the unique homogeneous quasi-arithmetic mean)

---

### L2 — Conjunctive Gate is the Unique Deny-by-Default Aggregator Under Stated Axioms

**Theorem statement:**
```lean
-- A "deny-by-default" aggregator D : Fin n → [0,1] → [0,1] satisfies:
-- (A) D is non-increasing in each argument
-- (B) D(x,...,x) = x (diagonal)
-- (C) D(x₁,...,xₙ) ≤ min(x₁,...,xₙ) (conservative)
-- (D) D(1,...,1) = 1 (unanimous allow)
-- (E) D is continuous
-- Then D = min (the conjunctive / AND gate).
theorem deny_by_default_unique
    (D : (Fin n → [0,1]) → [0,1])
    (hA : ∀ i, Antitone (D ∘ update · i))  -- conservative in each arg
    (hB : ∀ x, D (fun _ => x) = x)          -- diagonal
    (hC : ∀ xs, D xs ≤ Finset.univ.inf' ⟨0, Finset.mem_univ 0⟩ (fun i => xs i))
    (hD : D (fun _ => 1) = 1)
    (hE : Continuous D) :
    D = fun xs => Finset.univ.inf' ⟨0, Finset.mem_univ 0⟩ (fun i => xs i)
```
**Precise content:** Under axioms (A-E), the unique deny-by-default aggregator is the minimum function. This is a positive uniqueness result — in contrast to the FALSE uniqueness of Λ (TH10). The minimum / AND gate is the unique such aggregator.

**Software / Warhacker benefit:** a11oy Code's router uses a conjunctive gate for multi-policy enforcement. Proving L2 means: "the min-gate is the only logically correct deny-by-default aggregator under our design axioms." This is an **honest provable uniqueness** result, in contrast to TH10.

**Source / Citation:**  
- Threshold rule axiomatics for graded preferences: [http://www.accessecon.com/pubs/SCW2008/GeneralPDFSCW2008/SCW2008-08-00108S.pdf](http://www.accessecon.com/pubs/SCW2008/GeneralPDFSCW2008/SCW2008-08-00108S.pdf)  
- Aggregation functions textbook: Grabisch, Marichal, Mesiar, Pap, "Aggregation Functions," Cambridge 2009  

**Mathlib prereqs exist?** YES. `Finset.inf'`, `Antitone`, `Continuous`, `Fin`. The proof approach: from (B) and (C), D ≤ min; from (A), (D), (E) and the diagonal condition, D ≥ min (the squeeze argument). Key lemma: a continuous function on [0,1]^n that equals x on the diagonal and is bounded above by min must equal min.

**Difficulty:** Medium (~150 LOC). The squeeze argument is clean once the right continuity lemmas are in place.

**Honest risk:** **Likely provable with current axioms, but verify axiom (A) carefully.** The antitone condition may need to be rephrased. If it turns out that (A-E) do NOT uniquely characterize min (i.e., the theorem is false as stated), follow the `unconditional_lambda_is_false` pattern — prove the counterexample explicitly and update the spec.

**Status:** **PROVE-NOW** (important for honesty: gives a real uniqueness result alongside the Conjecture-1 disclaimer)

---

### L3 — Λ Monotonicity (component-wise)

**Theorem statement:**
```lean
-- Already known: green_lambda_monotone is in GreenTheorems.lean
-- New: Λ is strictly monotone in each component when k > 0
theorem lambda_strict_mono_component
    {k : ℕ} (hk : 0 < k) (xs ys : Fin k → ℝ)
    (hxs : ∀ i, 0 < xs i) (i : Fin k)
    (h : xs i < ys i) (heq : ∀ j ≠ i, xs j = ys j) :
    Λ k xs < Λ k ys
```
**Software benefit:** Backs the trust score monotonicity claim in a11oy: "a higher confidence on any single factor strictly increases the overall trust score." Small, clean, useful.

**Difficulty:** Easy (~30 LOC). Follows from the geometric mean's strict monotonicity in each factor (product of terms, one term strictly larger).

**Status:** **PROVE-NOW** (easy win)

---

## AREA 6: CONSENSUS / DISTRIBUTED

**Software benefit:** Backs a11oy's multi-agent mesh and killinchu's distributed C2. The Byzantine bound is the key safety claim for any multi-node deployment.

---

### B1 — Byzantine Agreement Impossibility: n ≤ 3f (Abstract Lower Bound)

**Theorem statement:**
```lean
-- In any deterministic synchronous Byzantine agreement protocol
-- with n nodes and at most f Byzantine faults,
-- if n ≤ 3f then there is no protocol satisfying validity + agreement.
theorem byzantine_impossibility
    {n f : ℕ} (hf : 0 < f) (hn : n ≤ 3 * f) :
    ¬ ∃ (proto : ByzantineProtocol n f), proto.SatisfiesValidity ∧ proto.SatisfiesAgreement
```
**Precise content:** The classical impossibility result (Lamport, Shostak, Pease 1982; Fischer, Lynch, Merritt 1986): Byzantine agreement requires n ≥ 3f+1. The proof uses a "split-world" argument — three groups of f nodes each, adversary can simulate any two scenarios to force disagreement or invalidity.

**Software / Warhacker benefit:** The a11oy agent mesh deployment claims safety with f Byzantine peers. Proving B1 bounds the claim: "our n-node deployment with f ≤ ⌊(n-1)/3⌋ Byzantine peers is within the proven-safe regime." Directly backs any Warhacker claim about distributed governance correctness.

**Source / Citation:**  
- Lamport, Shostak, Pease, "Byzantine Generals Problem," ACM TOPLAS 1982  
- Fischer, Lynch, Merritt, "Easy Impossibility Proofs for Distributed Consensus Problems," PODC 1985  
- Cornell CS6410 slides (formal proof sketch): [https://www.cs.cornell.edu/courses/cs6410/2015fa/slides/16-Byzantine_Agreement.pdf](https://www.cs.cornell.edu/courses/cs6410/2015fa/slides/16-Byzantine_Agreement.pdf)  
- Quorum intersection overview: [https://www.cube.exchange/what-is/quorum](https://www.cube.exchange/what-is/quorum)

**Mathlib prereqs exist?** YES. `Nat.lt_of_div_pos`, `Fintype`, pigeonhole (`Fintype.exists_ne_map_eq_of_card_lt`). The protocol model needs to be defined abstractly — use a simple message-passing model with `Fin n → Fin n → Message` message functions.

**Difficulty:** Medium (~200 LOC for the abstract impossibility proof; harder if concretizing to a specific protocol model).

**Honest risk:** **Known theorem (classical 1982), formalization only.** The abstract lower bound is well-understood. The harder part is defining a sufficiently general "ByzantineProtocol" type that captures the right model. Recommend: prove the special case n=3, f=1 first (the "three generals" impossibility), then generalize.

**Status:** **PROVE-NOW** for the n=3f case; **ROADMAP** for full generality

---

### B2 — Quorum Intersection Safety (2-Quorum Overlap ⟹ Consistency)

**Theorem statement:**
```lean
-- In any quorum system where every pair of quorums intersects,
-- two processes that both obtained a quorum response agree on committed values.
theorem quorum_intersection_consistency
    {Node : Type} [Fintype Node] [DecidableEq Node]
    (Q : Node → Finset Node)  -- quorum function
    (intersection : ∀ (p q : Node), ∃ r, r ∈ Q p ∧ r ∈ Q q)
    (val : Node → Option Value)  -- committed value function
    (committed_p : CommittedByQuorum Q p val v)
    (committed_q : CommittedByQuorum Q q val v') :
    v = v'
```
**Precise content:** If every pair of quorums shares a node, and that node is honest (cannot commit two values), then any two commits must agree. This is the safety core of Paxos/PBFT.

**Software benefit:** Backs the multi-agent consensus claim in a11oy: "the quorum-based decision is safe under intersection."

**Source / Citation:**  
- Flexible Paxos, quorum intersection theorem: [https://web.eecs.umich.edu/~manosk/assets/papers/flexible_paxos_opodis2016.pdf](https://web.eecs.umich.edu/~manosk/assets/papers/flexible_paxos_opodis2016.pdf)  
- Quorum subsumption paper: [https://par.nsf.gov/servlets/purl/10491935](https://par.nsf.gov/servlets/purl/10491935)

**Difficulty:** Medium (~150 LOC). The intersection argument is: if p committed v via quorum Q_p, and q committed v' via Q_q, and Q_p ∩ Q_q ≠ ∅, then the shared node voted for both — but honest nodes vote at most once for a given slot, so v = v'.

**Status:** **ROADMAP**

---

## AREA 7: QUANTUM / SPECTRAL (the QM gate)

**Honest framing:** The "quantum mind" gate in a11oy is a **metaphor** for the spectral/eigenvalue analysis of the governance matrix. The math below is real linear algebra; the "quantum" franding is narrative. Label clearly.

---

### Q1 — Density Matrix PSD Closure Under Mixture (Honest QM Gate)

**Theorem statement:**
```lean
-- A mixture of density matrices is a density matrix.
-- (Already partially in Mathlib; we state the governance version.)
theorem density_matrix_mixture
    {n : ℕ} {𝕜 : Type} [RCLike 𝕜]
    (ρs : Fin k → Matrix (Fin n) (Fin n) 𝕜)
    (hpsd : ∀ i, (ρs i).PosSemidef)
    (htrace : ∀ i, Matrix.trace (ρs i) = 1)
    (ws : Fin k → ℝ) (hws_pos : ∀ i, 0 ≤ ws i) (hws_sum : ∑ i, ws i = 1) :
    (∑ i, ws i • ρs i).PosSemidef ∧ Matrix.trace (∑ i, ws i • ρs i) = 1
```
**Precise content:** A convex combination of valid density matrices (PSD + unit trace) is again a valid density matrix. This follows immediately from `Matrix.PosSemidef.add`, `Matrix.PosSemidef.smul`, and linearity of trace — all in Mathlib.

**Software / Warhacker benefit:** The a11oy "quantum gate" processes a mixed quantum state representation of evidence. Proving Q1 means the gate's output is always a valid quantum state — it cannot produce nonsense. This is the **honest** quantum claim: not "AI reads minds" but "the evidence mixing preserves valid probability distributions."

**Source / Citation:**  
- Mathlib `Matrix.PosSemidef`: [https://leanprover-community.github.io/mathlib4_docs/Mathlib/LinearAlgebra/Matrix/PosDef.html](https://leanprover-community.github.io/mathlib4_docs/Mathlib/LinearAlgebra/Matrix/PosDef.html)  
- IBM Quantum Learning, density matrix basics: [https://quantum.cloud.ibm.com/learning/courses/general-formulation-of-quantum-information/density-matrices/density-matrix-basics](https://quantum.cloud.ibm.com/learning/courses/general-formulation-of-quantum-information/density-matrices/density-matrix-basics)  
- Watrous lecture notes on density matrices: [https://cs.uwaterloo.ca/~watrous/QC-notes/QC-notes.14.pdf](https://cs.uwaterloo.ca/~watrous/QC-notes/QC-notes.14.pdf)

**Mathlib prereqs exist?** YES — essentially trivially. `Matrix.PosSemidef.add` (Mathlib), `smul_nonneg`, `Finset.sum_comm`. This may be provable in under 20 lines.

**Difficulty:** Easy (~20 LOC). PSD is closed under positive scalar multiples and sums; trace is linear.

**Honest risk:** **Known theorem, essentially trivial formalization.** Low research risk; high narrative value for the "honest by construction" claim. Be explicit: the "quantum gate" is matrix algebra, not actual quantum hardware.

**Status:** **PROVE-NOW** (fastest win in this area)

---

### Q2 — Gershgorin Spectral Bound for Governance Matrix

**Theorem statement:**
```lean
-- The governance weight matrix W : Fin n → Fin n → ℝ has all eigenvalues
-- in the union of Gershgorin discs. If all diagonal entries are ≥ δ and
-- all row off-diagonal sums are ≤ ε, then all eigenvalues have real part ≥ δ - ε.
theorem governance_spectral_lower_bound
    {n : ℕ} (W : Matrix (Fin n) (Fin n) ℝ)
    (hdiag : ∀ i, δ ≤ W i i)
    (hoff : ∀ i, ∑ j ∈ Finset.univ.erase i, ‖W i j‖ ≤ ε)
    (hδε : ε < δ) :
    ∀ μ : ℂ, Module.End.HasEigenvalue (Matrix.toLin' W) μ → δ - ε ≤ μ.re
```
**Precise content:** Application of Gershgorin's circle theorem (already in Mathlib as `eigenvalue_mem_ball`) to derive a concrete lower bound on eigenvalue real parts for the a11oy governance weight matrix. When δ > ε, all eigenvalues have positive real part, guaranteeing the matrix is "stable" in the governance sense.

**Software / Warhacker benefit:** Backs the claim that the governance weight matrix is non-degenerate (no zero eigenvalues → invertible → stable aggregation). The "lambda_min ≥ 0.225" style spectral bound becomes a **derived theorem** from the structure of the weight matrix, not a magic constant.

**Source / Citation:**  
- Mathlib Gershgorin: [https://leanprover-community.github.io/mathlib4_docs/Mathlib/LinearAlgebra/Matrix/Gershgorin.html](https://leanprover-community.github.io/mathlib4_docs/Mathlib/LinearAlgebra/Matrix/Gershgorin.html) (**already in Mathlib**)  
- Wikipedia Gershgorin circle theorem: [https://en.wikipedia.org/wiki/Gershgorin_circle_theorem](https://en.wikipedia.org/wiki/Gershgorin_circle_theorem)  
- Gershgorin 1931 original (domain: pure math, no license needed)

**Mathlib prereqs exist?** YES — `eigenvalue_mem_ball` is already in Mathlib. This theorem is an immediate corollary. Need only to derive the real-part bound from the ball containment.

**Difficulty:** Easy (~40 LOC). Apply `eigenvalue_mem_ball`, use the hypothesis `hdiag` and `hoff`, derive `δ - ε ≤ μ.re` from ball membership.

**Status:** **PROVE-NOW** (essentially free given Mathlib's Gershgorin)

---

### Q3 — Quantum Channel Trace-Preservation and Complete Positivity Closure

**Theorem statement:**
```lean
-- A quantum channel Φ (completely positive, trace-preserving map)
-- maps density matrices to density matrices.
theorem quantum_channel_preserves_density
    {n m : ℕ} {𝕜 : Type} [RCLike 𝕜]
    (Φ : Matrix (Fin n) (Fin n) 𝕜 → Matrix (Fin m) (Fin m) 𝕜)
    (hcp : CompletelyPositive Φ) (htp : TracePreserving Φ)
    (ρ : Matrix (Fin n) (Fin n) 𝕜) (hρ : ρ.PosSemidef) (hρt : Matrix.trace ρ = 1) :
    (Φ ρ).PosSemidef ∧ Matrix.trace (Φ ρ) = 1
```
**Precise content:** A CPTP map preserves the density matrix property. This uses `Matrix.PosSemidef.conjTranspose_mul_mul_same` (Kraus operators) and linearity of trace.

**Difficulty:** Medium (~80 LOC). Need to define `CompletelyPositive` via Kraus operators (Φ(ρ) = Σ Kᵢ ρ Kᵢ†) and then the PSD and trace computations follow from Mathlib's existing PSD closure lemmas.

**Status:** **ROADMAP** (Q1 and Q2 are more immediately deployable)

---

## AREA 8: PHILOSOPHY / LOGIC (Honest-by-Construction Narrative)

**Software benefit:** Backs the "disclosed-axiom discipline" as a formal feature of the lutar-lean repository — the honesty is itself machine-checkable.

---

### Ph1 — Axiom-Disclosure Meta-Theorem (Lean `#print axioms` as a Theorem)

**Theorem statement:**
```lean
-- Every locked theorem in PuriqFormulaLean.lean has axiom set ⊆ {propext, funext, Classical.choice, Quot.sound}
-- (the standard Lean/Mathlib axioms). In particular, no custom axioms are introduced.
-- This is formally expressible as a definitional check, not a Lean theorem per se —
-- but we can state it as:
theorem locked_theorems_kernel_only :
    ∀ thm ∈ [F1, F11, F12, F18, F19],
      thm.axiomSet ⊆ leanKernelAxioms
```
**Precise content:** This is not a traditional mathematical theorem but a **meta-level property** of the proof system. It is enforced by `lake build --print-axioms` and already verified for the locked 5. The "theorem" is a CI check that can be embedded in a `decide`-checkable assertion if the axiom sets are represented as `Finset String`.

**Software / Warhacker benefit:** "Honest by construction" — the axiom set of every governance proof is disclosed and bounded. When a11oy says "this decision is backed by formal proofs," the axioms underlying those proofs are enumerable and publicly auditable. This is the meta-theorem that the governance proofs are not hiding unknown assumptions.

**Source / Citation:**  
- `#print axioms` Lean 4 documentation: [https://lean-lang.org/faq/](https://lean-lang.org/faq/)  
- Tridirectional discriminating power meta-theorem (Lean 4, [propext]-only axiom record): [https://arxiv.org/html/2606.01794v2](https://arxiv.org/html/2606.01794v2) — directly analogous pattern  
- Mario Carneiro's Lean consistency relative to ZFC: [https://supaiku.com/what-does-a-lean-proof-prove](https://supaiku.com/what-does-a-lean-proof-prove)

**Mathlib prereqs exist?** N/A — this is a CI/introspection feature, not a Mathlib-dependent theorem.

**Difficulty:** Easy (already enforced by the CI; formalizing it as a `decide`-able Lean term requires ~30 LOC of axiom-name string comparison).

**Status:** **PROVE-NOW** (narrative value; essentially free)

---

### Ph2 — Soundness of the Disclosed-Axiom Discipline (Relative Consistency)

**Theorem statement (informal):**
> The lutar-lean kernel (Lean v4.18.0 + Mathlib + the 5 locked theorems + `unconditional_lambda_is_false`) is consistent relative to ZFC + finitely many inaccessibles.

**Precise content:** Not a Lean 4 theorem — Gödel's second incompleteness theorem forbids proving consistency internally. But we can state: "our axioms are a subset of Lean 4 + Mathlib, which is equiconsistent with ZFC + ω inaccessibles." This is documented in Mario Carneiro's thesis (Corollary 24).

**Software / Warhacker benefit:** When challenged "could your formal proofs be based on inconsistent axioms?", the answer is: "our axiom set is provably equiconsistent with ZFC, the same foundation used by all professional mathematics."

**Source / Citation:**  
- Mario Carneiro MS thesis on Lean meta-theory: [https://github.com/digama0/lean-type-theory/releases](https://github.com/digama0/lean-type-theory/releases)  
- supaiku.com summary: [https://supaiku.com/what-does-a-lean-proof-prove](https://supaiku.com/what-does-a-lean-proof-prove)  
- ZFLean (Lean 4 ZFC framework): arXiv:2604.24195 [https://arxiv.org/html/2604.24195](https://arxiv.org/html/2604.24195)

**Honest risk:** **Not provable as a Lean theorem** (Gödel). Document this explicitly. The right deliverable is a **narrative document** (not a `.lean` file) that cites Carneiro's theorem and explains the equiconsistency chain.

**Status:** **ROADMAP** (as a whitepaper, not a Lean proof)

---

## MASTER PRIORITIZED TABLE

| ID | Theorem Name | Area | App/Tab | Source | Mathlib Prereqs? | Difficulty | Honest Risk | Decision |
|----|-------------|------|---------|--------|-----------------|------------|-------------|----------|
| M1 | Merkle Inclusion Soundness | Tamper-Evidence | Cannonico / a11oy | [RFC 6962](https://datatracker.ietf.org/doc/html/rfc6962), [Nethermind](https://www.nethermind.io/blog/preventing-the-second-preimage-attack-in-merkle-proof-verification) | Partial (Bytes type needed) | Medium | Known theorem | **PROVE-NOW** |
| M2 | Hash-Chain Append-Only Consistency | Tamper-Evidence | a11oy audit log | [CT transparency](https://certificate.transparency.dev/howctworks/), [Adaptive Query](https://qu3ry.net/articles/cryptographic-governance/audit-ledger) | YES | Easy | Known theorem | **PROVE-NOW** |
| M3 | DSSE Token Injectivity | Tamper-Evidence | a11oy Code SBOM | [Kamara & Papamanthou](https://cs.brown.edu/people/seny/pubs/psse.pdf) | YES | Easy | Known theorem | ROADMAP |
| S1 | STL Robustness Soundness | Runtime Assurance | killinchu monitor | [Donzé & Maler](http://www-verimag.imag.fr/~maler/Papers/sensiform.pdf), [GradSTL arXiv:2508.04438](https://arxiv.org/html/2508.04438v1) | Partial (STL type) | Medium | Known theorem | **PROVE-NOW** |
| S2 | Simplex Safety Invariant | Runtime Assurance | killinchu C2 override | [NASA DASC 2024](https://shemesh.larc.nasa.gov/fm/papers/DASC2024-SWDMC-draft.pdf) | YES | Medium | Known theorem | **PROVE-NOW** |
| CP1 | Split Conformal Marginal Coverage | Conformal | a11oy trust intervals | [Shafer & Vovk 2008](https://jmlr.csail.mit.edu/papers/volume9/shafer08a/shafer08a.pdf), [ALRW](https://www.alrw.net) | Partial (quantile lemma) | Medium | Known theorem | **PROVE-NOW** |
| G1 | CPA Minimality Correctness | Geometry | killinchu collision | [NASA DAIDALUS](https://cs.uiowa.edu/sites/cs.uiowa.edu/files/2024-12/2024-11-FMITF_Dutle.pdf), [Kestrel](https://www.kestrel.edu/people/fitzpatrick/pub/TechnicalNote-2019-ClosestApproach.pdf) | YES | Medium | Known theorem | **PROVE-NOW** |
| G2 | Polygon PIP Soundness (convex) | Geometry | killinchu geofence | [NASA PolyCARP FM2019](https://shemesh.larc.nasa.gov/fm/papers/FM2019-draft.pdf) | Partial | Medium (convex) | Known theorem | PROVE-NOW (convex); ROADMAP (general) |
| L1 | Kolmogorov-Nagumo Characterization | Lambda/Aggregation | a11oy governance | [arXiv:2606.05221](https://arxiv.org/html/2606.05221v1), [Kolmogorov 1930] | Partial | Hard | Known theorem | ROADMAP |
| L2 | Min-Gate Uniqueness (deny-by-default) | Lambda/Aggregation | a11oy router | [Grabisch et al. 2009] | YES | Medium | Known theorem (verify axioms first) | **PROVE-NOW** |
| L3 | Λ Strict Monotonicity (per-component) | Lambda/Aggregation | a11oy trust score | Wave-5 prereqs exist | YES | Easy | Known theorem | **PROVE-NOW** |
| B1 | Byzantine 3f+1 Lower Bound | Consensus | a11oy mesh | [Lamport-Shostak-Pease 1982](https://www.cs.cornell.edu/courses/cs6410/2015fa/slides/16-Byzantine_Agreement.pdf) | YES | Medium | Known theorem | PROVE-NOW (n=3 case) |
| B2 | Quorum Intersection Consistency | Consensus | a11oy mesh | [Flexible Paxos](https://web.eecs.umich.edu/~manosk/assets/papers/flexible_paxos_opodis2016.pdf) | YES | Medium | Known theorem | ROADMAP |
| Q1 | Density Matrix Mixture PSD | Quantum/Spectral | a11oy QM gate | [Mathlib PosDef](https://leanprover-community.github.io/mathlib4_docs/Mathlib/LinearAlgebra/Matrix/PosDef.html), [Watrous](https://cs.uwaterloo.ca/~watrous/QC-notes/QC-notes.14.pdf) | YES (trivial) | Easy | Known theorem | **PROVE-NOW** |
| Q2 | Gershgorin Governance Spectral Bound | Quantum/Spectral | a11oy QM gate | [Mathlib Gershgorin](https://leanprover-community.github.io/mathlib4_docs/Mathlib/LinearAlgebra/Matrix/Gershgorin.html) | YES (already in Mathlib!) | Easy | Known theorem | **PROVE-NOW** |
| Q3 | Quantum Channel CPTP Closure | Quantum/Spectral | a11oy QM gate | [Watrous](https://cs.uwaterloo.ca/~watrous/QC-notes/QC-notes.14.pdf) | Partial | Medium | Known theorem | ROADMAP |
| Ph1 | Axiom-Disclosure Meta-Theorem | Philosophy/Logic | All / Warhacker | [Lean FAQ](https://lean-lang.org/faq/), [arXiv:2606.01794v2](https://arxiv.org/html/2606.01794v2) | N/A | Easy | CI check | **PROVE-NOW** |
| Ph2 | Relative Consistency Whitepaper | Philosophy/Logic | All / Warhacker | [Carneiro thesis](https://github.com/digama0/lean-type-theory/releases), [supaiku](https://supaiku.com/what-does-a-lean-proof-prove) | N/A | Easy (doc) | NOT a Lean thm | ROADMAP (whitepaper) |

---

## BEFORE JUNE 16: RECOMMENDED PROVING ORDER

**Target: 10 new sorry-free theorems in 6 days.**  
Assuming 1-2 engineers with Lean 4 / Mathlib proficiency.

### Day 1-2: Easy wins + foundation
| Order | ID | LOC est. | Dependency |
|-------|----|----------|------------|
| 1 | **Ph1** (Axiom disclosure) | ~30 | None — CI check |
| 2 | **Q1** (Density matrix mixture) | ~20 | `Matrix.PosSemidef.add` — immediate |
| 3 | **Q2** (Gershgorin governance bound) | ~40 | `eigenvalue_mem_ball` — in Mathlib |
| 4 | **L3** (Λ strict monotonicity) | ~30 | `green_lambda_monotone` (existing) |
| 5 | **M2** (Hash chain consistency) | ~30 | `Function.Injective` — immediate |

**Day 2 checkpoint:** 5 new theorems. All easy, all `#print axioms` clean.

### Day 3-4: Medium priority (highest Warhacker value)
| Order | ID | LOC est. | Dependency |
|-------|----|----------|------------|
| 6 | **CP1** (Conformal coverage) | ~200 | Needs `Exchangeable` type + quantile lemma setup |
| 7 | **L2** (Min-gate uniqueness) | ~150 | `Finset.inf'`, `Antitone`, `Continuous` |
| 8 | **G1** (CPA minimality) | ~120 | `EuclideanSpace`, `inner`, calculus prereqs |

**Day 4 checkpoint:** 8 theorems. The trust interval and collision avoidance claims are now backed.

### Day 5-6: Drone/monitor + Byzantine
| Order | ID | LOC est. | Dependency |
|-------|----|----------|------------|
| 9 | **S2** (Simplex safety invariant) | ~150 | Abstract state/controller model needed |
| 10 | **B1** (Byzantine n=3,f=1 impossibility) | ~200 | `Fintype`, `Fin 3`, split-world construction |

**Day 6 checkpoint:** 10 new sorry-free theorems. STL robustness (S1) moves to ROADMAP if time runs short — it needs the most new type definitions.

---

## WHAT TO DO WITH S1 (STL Robustness)

S1 is the highest-value theorem for killinchu's "catch the line-crossing" claim but requires the most new definitions (~100 LOC for the `STLFormula` inductive type + `robustness` function before any proof). Recommendation:

1. **Before June 16:** Define `STLFormula` and `robustness` in a new file `Lutar/STL/Core.lean`; get it to type-check (no proofs yet).
2. **Wave 8:** Prove soundness and completeness in `Lutar/STL/Soundness.lean`, citing [Donzé & Maler FORMATS 2010](http://www-verimag.imag.fr/~maler/Papers/sensiform.pdf) and [GradSTL arXiv:2508.04438](https://arxiv.org/html/2508.04438v1).

The GradSTL paper (arXiv:2508.04438, published 2025-08-06) has already proven this in **Coq/Rocq** with auto-generated OCaml code. The Lean 4 port follows the same inductive structure.

---

## HONEST RISK REGISTRY

| ID | Claim | Risk Level | Mitigation |
|----|-------|-----------|------------|
| M1 | Soundness holds given domain separation | LOW — standard result | State hash collision resistance as explicit hypothesis |
| CP1 | Coverage is [1-α, 1-α+1/(n+1)], NOT exact 1-α | LOW — well-known | Add explicit upper bound in theorem statement |
| L2 | Min-gate uniqueness under axioms A-E | MEDIUM — axioms need verification | If false, prove the counterexample (follow `unconditional_lambda_is_false` pattern) |
| B1 | Byzantine bound for synchronous model only | LOW — state synchrony assumption | Hypothesis `Synchronous : Bool` or note in docstring |
| G2 | Full polygon (non-convex) | HIGH — Jordan curve theorem needed | Prove convex case first; flag non-convex as ROADMAP |
| S1 | STL soundness for discrete time only | LOW — continuous time is harder | State `DiscreteSignal` explicitly; cite continuous-time version as future work |
| TH10 | Λ = geometric mean (Conjecture 1) | HIGH — PROVEN FALSE under A1-A5 | Do NOT re-attempt under same axioms; use L1/L2/L3 instead |
| Ph2 | Relative consistency | NOT PROVABLE as Lean thm | Write whitepaper; cite Carneiro; never state as a `.lean` theorem |

---

## APPENDIX: RELEVANT MATHLIB LEMMAS (Quick Reference)

| Lemma | File | Use |
|-------|------|-----|
| `Matrix.PosSemidef.add` | `LinearAlgebra/Matrix/PosDef` | Q1 (density matrix mixture) |
| `Matrix.PosSemidef.eigenvalues_nonneg` | `LinearAlgebra/Matrix/PosDef` | Q2 (non-negative eigenvalues) |
| `eigenvalue_mem_ball` | `LinearAlgebra/Matrix/Gershgorin` | Q2 (Gershgorin spectral bound) |
| `Finset.inf'_le` | `Data/Finset/Lattice` | L2 (min-gate bound) |
| `Function.Injective` | `Logic/Function` | M2, M3 (hash/token injectivity) |
| `inner_mul_le_norm_mul_iff` | `Analysis/InnerProductSpace` | G1 (CPA — Cauchy-Schwarz) |
| `IsMinOn` | `Order/LocalExtr` | G1 (minimality of t*) |
| `Fintype.exists_ne_map_eq_of_card_lt` | `Data/Fintype/Basic` | B1 (pigeonhole for Byzantine) |
| `Polynomial.IsMinOn` (via `deriv`) | `Analysis/Calculus/Deriv` | G1 (quadratic minimization) |
| `MeasureTheory.measure_le_measure_of_forall_closed_lt` | `MeasureTheory` | CP1 (quantile bound) |

---

*Document generated 2026-06-10 by SZL Holdings PhD research team. All theorems above are either (a) known results in the literature with formal citations, or (b) explicitly labeled as conjectures or research-level. The proven-false status of TH10 is maintained per `unconditional_lambda_is_false`. No fabricated claims.*
