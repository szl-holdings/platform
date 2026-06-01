# 130 — PINN → DINN FRONTIER R&D DISPATCH

**Doctrine-Informed Neural Networks: SZL's take on Physics-Informed Neural Networks**
Founder dispatch · 2026-05-31 · audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31
Source article: [Henderson, *PINNs: An Intuitive Guide*, Towards Data Science, 28 Jan 2025](https://towardsdatascience.com/physics-informed-neural-networks-pinns-an-intuitive-guide-fff138069563/)

---

## TL;DR (founder-readable, 4 sentences)

A PINN trains a network whose loss includes the residual of the governing physical law, so the network is *forced to respect that law during learning, not just checked at inference* ([Raissi, Perdikaris & Karniadakis, arXiv:1711.10561](https://arxiv.org/abs/1711.10561)) — which is exactly the shape of SZL's "doctrine-respecting AI." We already own the *inference-time* version of this idea (the Λ AND-gate, Reidemeister invariance, HUKLLA halt, Bekenstein DPI bound) but **none of it is a learning signal yet** — the constraints are walls the model hits, not gradients the model is trained against. The frontier move ("DINN" — Doctrine-Informed Neural Networks) is to fold those same constraints into the *training loss* so the reasoner *learns to stay governed*, with a Lean obligation that loss-minimization implies the actual invariant holds to an ε margin. **Verdict: this genuinely helps the knot (YES) and genuinely helps the brain innovate/evolve (YES, with one honest caveat) — ship Proposal A as a P0 demo for Warhacker, scope B as the P1 Series-A wedge, and keep C as P2 research.**

---

## PHASE 1 — PINN FOUNDATIONS (deep summary)

### 1.1 The loss formulation (the whole idea in one equation)

A PINN minimizes a weighted sum of a **data loss** and a **physics (PDE-residual) loss** ([Henderson/TDS](https://towardsdatascience.com/physics-informed-neural-networks-pinns-an-intuitive-guide-fff138069563/)):

\[
\mathcal{L}(\theta) \;=\; w_{\text{data}}\underbrace{\frac{1}{N_d}\sum_i \big\|u_\theta(x_i,t_i) - u_i\big\|^2}_{\text{MSE on observed data}} \;+\; w_{\text{phys}}\underbrace{\frac{1}{N_r}\sum_j \big\|\mathcal{R}\big[u_\theta\big](x_j,t_j)\big\|^2}_{\text{PDE residual at collocation points}}
\]

where the residual operator \(\mathcal{R}[u] = u_t + \mathcal{N}[u] - f\) is evaluated by **autodifferentiating the network output with respect to its own inputs** to obtain the required derivatives, then substituting into the governing equation ([Henderson/TDS](https://towardsdatascience.com/physics-informed-neural-networks-pinns-an-intuitive-guide-fff138069563/); [Raissi et al., *J. Comput. Phys.* 378:686-707, 2019](https://www.sciencedirect.com/science/article/pii/S0021999118307125)). The key structural facts:

- **Data loss needs labels; physics loss does not.** The residual term is evaluated at "collocation points" sampled freely across the whole domain — no targets required ([Henderson/TDS](https://towardsdatascience.com/physics-informed-neural-networks-pinns-an-intuitive-guide-fff138069563/)). This is why PINNs are *data-efficient*: physics fills in where data is sparse.
- **Unknown physics parameters become trainable.** A drag coefficient μ can be made a `trainable variable` discovered jointly with θ — this is the "inverse problem" / discovery mode ([Henderson/TDS](https://towardsdatascience.com/physics-informed-neural-networks-pinns-an-intuitive-guide-fff138069563/)).
- **Soft vs hard constraints.** The above is a *soft* constraint (a penalty term). A *hard* constraint bakes the law into the architecture so it is satisfied exactly by construction — e.g. an output transform \(u_\theta(x)= g(x) + \ell(x)\,\mathcal{N}_\theta(x)\) where \(\ell\) vanishes on the boundary, or a non-trainable periodic input layer ([Sukumar & Srivastava, *Exact Dirichlet BC PINN*, CMAME 2022](https://www.sciencedirect.com/science/article/abs/pii/S0045782523003080); [PINNs with hard and soft BCs, *Phys. Fluids* 37:087158, 2025](https://pubs.aip.org/aip/pof/article/37/8/087158/3358658/Physics-informed-neural-networks-with-hard-and)). Hard constraints guarantee satisfaction but *shrink the solution space* and can raise error elsewhere by up to ~15× in some BC settings ([*Phys. Fluids* 2025](https://pubs.aip.org/aip/pof/article/37/8/087158/3358658/Physics-informed-neural-networks-with-hard-and)). **This soft/hard distinction is the single most important design axis for DINN.**

### 1.2 When PINNs win
- Sparse / noisy / incomplete data where pure data-driven models cannot extrapolate ([Henderson/TDS](https://towardsdatascience.com/physics-informed-neural-networks-pinns-an-intuitive-guide-fff138069563/)).
- Mesh-free forward and inverse PDE solving; differentiable surrogate over the whole domain ([Raissi et al. 2019](https://www.sciencedirect.com/science/article/pii/S0021999118307125)).
- Parameter discovery inside known equations.

### 1.3 When PINNs fail (the honest part — this constrains what DINN can claim)
- **Spectral bias / gradient pathologies.** Gradient descent fits low-frequency components fast and high-frequency components badly; for stiff/nonlinear PDEs the bottleneck is **optimization, not capacity** ([Krishnapriyan et al., *Characterizing possible failure modes in PINNs*, NeurIPS 2021](https://arxiv.org/abs/2109.01050); [Wang et al., *gradient flow pathologies*](https://arxiv.org/abs/2001.04536)).
- **Width pathology.** Empirically, wider single-layer PINNs do *not* help and can hurt (scaling exponent α ≈ 0 or < 0), contradicting approximation theory — confirmed across KdV, Sine-Gordon, Allen-Cahn ([Chaudhry, *Scaling Laws & Pathologies of Single-Layer PINNs*, NeurIPS ML4PS 2025](https://ml4physicalsciences.github.io/2025/files/NeurIPS_ML4PS_2025_15.pdf)).
- **Activation must be smooth.** A residual that penalizes 2nd derivatives makes plain ReLU catastrophically fail (its 2nd derivative is a sum of Diracs); tanh / smooth activations are required ([Chaudhry 2025](https://ml4physicalsciences.github.io/2025/files/NeurIPS_ML4PS_2025_15.pdf); [Henderson/TDS](https://towardsdatascience.com/physics-informed-neural-networks-pinns-an-intuitive-guide-fff138069563/)).
- **Loss-weight balancing is fragile.** \(w_{\text{data}}\) vs \(w_{\text{phys}}\) imbalance causes one term to dominate; active research on adaptive/aligned weighting continues into 2026 ([*Mitigating Gradient Pathology via Aligned weighting*, arXiv:2605.25001, May 2026](https://arxiv.org/html/2605.25001v1)).
- **The physics may not match the data.** Even a perfect PINN only fits whatever law you encoded — wrong/incomplete physics → wrong model ([Henderson/TDS](https://towardsdatascience.com/physics-informed-neural-networks-pinns-an-intuitive-guide-fff138069563/)).

### 1.4 State of the art, 2025-2026 (the extension menu DINN steals from)
- **PI-DeepONet** — physics-informed operator learning; learns solution *operators*, not single solutions, with hard-constraint variants ([*Improving PI-DeepONets with hard constraints*, arXiv:2309.07899](https://arxiv.org/abs/2309.07899)).
- **PINO / Fourier Neural Operator** — physics-informed neural operators that fix some spectral-bias issues via spectral parameterization ([Li et al., *Physics-Informed Neural Operator*, ACM/JDSL 2024](https://dl.acm.org/doi/10.1145/3648506)).
- **B-PINNs** — Bayesian PINNs for uncertainty quantification under noisy data ([Yang, Meng & Karniadakis, *J. Comput. Phys.* 2021](https://github.com/Event-AHU/PINN_Paper_List)).
- **Hard-constraint projection** — project network output onto the constraint manifold each step ([Horne, Jimack, Khan & Wang, *Hard constraint projection in a PINN*](https://www.aifluids.net/proceedings/M.J.%20S.%20Horne,%20P.%20K.%20Jimack,%20A.%20Khan,%20H.%20Wang,%20Hard%20constraint%20projection%20in%20a%20physics%20informed%20neural%20network.pdf); [Neumann hard constraints, openreview](https://openreview.net/pdf?id=jKdZsWdRLZ)).
- **Lean-verified PINNs: ABSENT in the literature.** No web result returns a formally machine-checked PINN-invariance proof. **This is open white space — and it is exactly where SZL's Lean stack is differentiated.**

---

## PHASE 2 — SZL INVENTORY VERDICT (be honest)

| Area | Verdict | Evidence (file:line) |
|---|---|---|
| `szl-cookbook/recipes/knot-calculus-v1/` | **ADJACENT** (closest fit; *checks* invariance, does not *learn* it) | Recipe verifies TH11 sum-of-sums + emits Audit-Reidemeister knot tag; the invariant is asserted/verified, no network, no loss — `recipes/knot-calculus-v1/README.md`; `code/src/knot-tag.ts` |
| `lutar-lean/Lutar/Knot/ReidemeisterConjecture.lean` | **ADJACENT** (the *physics* of the knot is formalized; no learner) | R1/R2/R3 audit moves + `segmentLambda` geometric-mean; R1/R2 retained as **axioms** (issue lutar-lean#32), R3 proved — `ReidemeisterConjecture.lean:1-120`. This is the ready-made "PDE residual" for Proposal A. |
| `anatomy-evolved-v1/` (8 organs) | **ABSENT** (no constrained learner; QKAN-FWP is a flow-weight predictor, not residual-trained) | `code/src/amaru-qkan-fwp.ts`; organs are deterministic kernels, no physics-loss term |
| `lutar-lean/` (neural / loss / gradient / PDE) | **ABSENT** as PINN; **ADJACENT** as constraint algebra | `Lutar/Invariant.lean:21` defines Λ = geometric mean of axes; `Lutar/HUKLLA/HaltEligibility.lean:80` `LAMBDA_FLOOR := 0.90` + monotonicity theorem. No gradient/PDE/loss object exists. |
| `repos/agi-forecast/` | **ABSENT** | No constrained loss, residual, or penalty term found in `runtime` |
| `git-repos/ouroboros-thesis-git/.../thesis_v18/chapters/` | **ADJACENT** (invariance framed as governance condition, never as a loss) | `01_introduction.tex:600-601` "Reidemeister R1/R2 invariance as governance consistency conditions"; `02_mathematical_foundations.tex:1513-1514` r1/r2 invariance verified; `07_formal_validation.tex:601-606`. Grep for "PINN"/"physics-informed"/"PDE residual"/"constrained loss" → **zero hits.** |
| `repos/ouroboros/` runtime (constrained learner?) | **ABSENT** as learner; **HAS** the inference-time gate | `runtime/lambda-gate/src/gate.ts:68` conjunctive AND gate (every axis ≥ threshold + critical axes + composite Λ geomean ≥ threshold). This is a *wall*, evaluated at inference — not a gradient. |
| Bekenstein | **ADJACENT** (bound exists as DPI theorem, not as an entropy-cap loss) | `repos/a11oy/packages/a11oy-knowledge/src/theorems.ts:90` `bekenstein_entropy_bound_dpi`: H(chain) ≤ H(registry) ≤ 8A bits via DPI; figure `thesis-repo/figures/build_all.py:293` `fig_bekenstein`. T4 still labeled **conjectured** (`knowledge.test.ts:119`). |

**Net honest read:** SZL has built a complete library of *inference-time, formally-verified constraints* (Λ-gate, Reidemeister invariance, HUKLLA halt, Bekenstein DPI) but **has zero examples of a constraint expressed as a training-time loss gradient.** That gap is precisely the PINN trick. The conversion is small in code and large in narrative.

---

## PHASE 3 — THREE DINN PROPOSALS (full technical spec)

> **Naming.** Where PINN residual \(\mathcal{R}[u]\) = "violation of physical law," DINN residual \(\mathcal{D}[f]\) = "violation of doctrine." The auto-diff machinery, soft/hard-constraint design axis, and spectral-bias caveats all carry over verbatim.

### PROPOSAL A — KNOT-DINN for TH11 (the demo play)

**Object.** A small smooth-activation net \(f_\theta:\; \text{knot diagram} \to \mathbb{R}\) (or \(\mathbb{R}^k\)) producing an invariant scalar/vector.

**DINN loss.** Reidemeister moves are the "PDE residual." Using the audit moves already formalized in `ReidemeisterConjecture.lean` (R1 repack/axis-permutation, R2 commutation, R3 associativity):
\[
\mathcal{L}(\theta)=\underbrace{\frac{1}{N}\sum_K\|f_\theta(K)-y_K\|^2}_{\text{data: known invariants}} \;+\; \lambda\!\!\sum_{m\in\{R1,R2,R3\}}\frac{1}{N_m}\sum_K \big\|f_\theta(m(K)) - f_\theta(K)\big\|^2
\]
The second term is a *label-free* residual sampled by applying random Reidemeister moves to any diagram — exactly the PINN collocation trick ([Henderson/TDS](https://towardsdatascience.com/physics-informed-neural-networks-pinns-an-intuitive-guide-fff138069563/)). Use **tanh** activation (smooth — required, per §1.3).

**Hard-constraint variant (recommended for the demo).** Since R1/R2 invariance reduces to permutation/order invariance of the audit segment (`segmentLambda` is a geometric mean → already permutation-invariant), a DeepSets/symmetric-pooling architecture satisfies R1/R2 **by construction** (hard constraint), leaving only R3 as a soft residual. This sidesteps spectral-bias fragility for the parts we can make exact, mirroring best 2025 hard-BC practice ([*Phys. Fluids* 2025](https://pubs.aip.org/aip/pof/article/37/8/087158/3358658/Physics-informed-neural-networks-with-hard-and)).

**Lean obligation.**
```lean
-- Lutar/Knot/KnotDINN.lean   (v1: sorry OK)
theorem dinn_loss_implies_reidemeister_invariance
    (f : KnotDiagram → ℝ) (ε : ℝ) (hε : 0 < ε)
    (hloss : reidemeisterResidual f ≤ ε) :
    ∀ K m, m ∈ ReidemeisterMoves → |f (m K) - f K| ≤ Real.sqrt ε := by
  sorry  -- discharges from residual = mean of squared move-deltas (Jensen/√)
```
This is the missing converse of the existing `r12_equiv_lambda_flat` corollary: that one says invariance ⇒ Λ-flat; this says low-loss ⇒ ε-invariant.

**Where it lives.** New recipe `szl-cookbook/recipes/knot-calculus-v2/` + a Rosie tab "Knot-DINN learner."
**Demo surface.** Feed two diagrams; net classifies same/different knot **with the live invariance-loss displayed** as the trust number. Backs `thm:two_witness_KS18_soundness` (`Lutar/TwoWitness.lean:101`) + Khipu DAG receipts (`recipes/knot-calculus-v1`).

### PROPOSAL B — DOCTRINE-DINN (the headline Series-A wedge)

**Object.** Amaru's reasoner trained with an auxiliary doctrine-residual so it *learns* to stay above the Λ floor, instead of only being gated at inference by `gate.ts`.

**DINN loss.**
\[
\mathcal{L}(\theta)=\mathcal{L}_{\text{task}}(\theta) \;+\; \lambda\sum_{i=1}^{n}\big(\max(0,\; \Lambda_{\text{floor}} - a_i(\theta))\big)^2,\qquad \Lambda_{\text{floor}}=0.90
\]
where \(a_i\) are the per-axis scores (current runtime schema is the **9-axis** `Axes 9`, `Lutar/Invariant.lean`; the founder's "13-axis" refers to the v15 13-axiom corpus — see risk note). The hinge penalty \( \max(0,\Lambda_{\text{floor}}-a_i)\) is the doctrine analogue of a one-sided PDE residual: zero when compliant, quadratic when violated. Governance stops being a wall and becomes a **gradient**.

**Lean obligation.**
```lean
-- Lutar/DINN/DoctrineLoss.lean   (v1: sorry OK)
-- (1) convexity in axis values:
theorem doctrine_penalty_convex (floor : ℝ) :
    ConvexOn ℝ Set.univ (fun a => (max 0 (floor - a))^2) := by sorry
-- (2) bounded gradient (Lipschitz) → safe to add to task loss:
theorem doctrine_penalty_grad_bounded (floor : ℝ) :
    ∀ a, |deriv (fun x => (max 0 (floor - x))^2) a| ≤ 2 * floor := by sorry
```
Convex + Lipschitz-gradient ⇒ adding the term cannot destabilize a well-behaved task optimizer (this is the rigorous version of "it's a safe regularizer"). Ties to existing `halt_eligibility_monotone` (`HaltEligibility.lean`): a learner trained to raise min-axis monotonically raises halt-eligibility.

**Where it lives.** New `amaru` chakra tab `/chakra/dinn` showing **live training that respects gates** — loss curve + min-axis curve climbing above 0.90.
**Frontier claim (carefully worded — see Phase 6).** "A governance-informed learner whose compliance penalty is formally verified convex and gradient-bounded." Do **not** say "first formally-verified governance-informed learner" until the Lean `sorry`s are discharged.

### PROPOSAL C — BEKENSTEIN-DINN (entropy-cap learner, research)

**Object.** A learner whose output entropy is penalized for exceeding a dimensionalized Bekenstein bound — a *provable cognitive cap*.

**DINN loss.**
\[
\mathcal{L}(\theta)=\mathcal{L}_{\text{task}}(\theta)+\lambda\,\max\!\big(0,\; H[u_\theta]-S_{\max}\big),\qquad S_{\max}=\frac{2\pi R E}{\hbar c}
\]
SZL already has the *information-theoretic* form of this bound proved by DPI — H(chain) ≤ H(registry) ≤ 8A bits (`a11oy-knowledge/src/theorems.ts:90`, `bekenstein_entropy_bound_dpi`) — so the loss can be stated against the **8A-bit registry bound** (rigorous, already-proved) rather than the raw physics constant (still conjectural, `knowledge.test.ts:119`). **Strongly prefer the 8A form for any external claim.**

**Where it lives.** Extend HUKLLA halt with an "entropy-floor halt": `isHaltEligible` already halts on low Λ (`HaltEligibility.lean:128`); add a clause that halts when measured output entropy provably exceeds the bound.
**Backing.** Bekenstein un-banned in Doctrine v9; existing `fig_bekenstein` cascade (`thesis-repo/figures/build_all.py:293`).

---

## PHASE 4 — VERDICT ON FOUNDER'S TWO QUESTIONS

**Q1 — "does it help the knot?" → YES.**
Technical reason: the Reidemeister moves are *already formalized as the governing law* of the knot in `ReidemeisterConjecture.lean`, and R1/R2 are still **axioms** (lutar-lean#32), not proved theorems. Knot-DINN turns those axioms into a *trained, measurable* invariance with an ε-margin Lean converse — converting an unproven assumption into an empirically-bounded, formally-stated quantity. That is strictly more than `knot-calculus-v1` does today (it only *verifies* a pre-asserted tag).

**Q2 — "[does it help] our brain innovate and evolve?" → YES (with one honest caveat).**
Technical reason: SZL's entire stack expresses doctrine as *inference-time walls* (the `gate.ts` AND-gate, HUKLLA halt). DINN makes doctrine a *learning signal* — the reasoner's weights move to satisfy the constraint, so the system "evolves toward compliance" rather than merely being clipped at the boundary. The caveat is the PINN literature's own warning: soft-constraint loss-weight imbalance and spectral bias can make the penalty term ineffective or destabilizing ([Krishnapriyan et al. 2021](https://arxiv.org/abs/2109.01050); [Chaudhry 2025](https://ml4physicalsciences.github.io/2025/files/NeurIPS_ML4PS_2025_15.pdf)) — which is exactly why Proposal B pairs the soft penalty with a *proved* convex/Lipschitz guarantee and Proposal A uses hard constraints where possible.

---

## PHASE 5 — IMPLEMENTATION PLAN

### Proposal A — KNOT-DINN  ·  **P0 (this week, ship to Warhacker)**
- **Files:** `szl-cookbook/recipes/knot-calculus-v2/README.md`; `code/src/knot-dinn.ts` (tanh MLP + DeepSets pooling for hard R1/R2); `code/tests/demo.ts` (two-diagram same/different + live invariance loss); `lutar-lean/Lutar/Knot/KnotDINN.lean`.
- **Lean theorem:** `dinn_loss_implies_reidemeister_invariance` (sorry OK v1).
- **UI:** Rosie tab "Knot-DINN learner" (Rosie Space).
- **Cookbook recipe:** `knot-calculus-v2`.
- **Risk:** small net may not generalize across diagram encodings → mitigate by hard-constraining R1/R2 (architecture) and only learning R3. Laugh-test risk: "you trained a net to learn something Lean already asserts" → backstop with the ε-margin converse theorem (it's *new* math, not a re-derivation). Backstop: keep `knot-calculus-v1` verification as the ground-truth oracle.

### Proposal B — DOCTRINE-DINN  ·  **P1 (2-week)**
- **Files:** `lutar-lean/Lutar/DINN/DoctrineLoss.lean` (convexity + grad-bound, sorry OK); `repos/amaru/src/chakras/.../dinn-loss.ts`; `/chakra/dinn` web tab.
- **Lean theorem:** `doctrine_penalty_convex` + `doctrine_penalty_grad_bounded`.
- **UI:** Amaru chakra `/chakra/dinn` live-training panel (loss + min-axis curve crossing 0.90).
- **Cookbook recipe:** fold into `anatomy-dinn-v1`.
- **Risk:** the **9 vs 13 axis** discrepancy — runtime schema is `Axes 9` (`Invariant.lean`), the "13-axis" is the v15 13-*axiom* corpus, not 13 gate axes. **Reconcile before any external claim or we get caught.** Also: λ-weight tuning fragility ([arXiv:2605.25001](https://arxiv.org/html/2605.25001v1)) — backstop with the convexity proof and keep the hard `gate.ts` wall in place as belt-and-suspenders (training-time soft + inference-time hard).

### Proposal C — BEKENSTEIN-DINN  ·  **P2 (post-Warhacker R&D)**
- **Files:** `lutar-lean/Lutar/HUKLLA/EntropyFloorHalt.lean`; `bekenstein-dinn` loss module.
- **Lean theorem:** entropy-floor halt extension of `isHaltEligible`.
- **UI:** HUKLLA halt panel "entropy-floor halt."
- **Cookbook recipe:** `bekenstein-dinn-v1`.
- **Risk:** the raw physics constant \(S_{\max}=2\pi R E/\hbar c\) is dimensionally delicate and T4 is still *conjectured* — **use the proved 8A-bit DPI form for anything public** or we get laughed at by a physicist. Backstop: the DPI bound is already a clean Mathlib-adjacent proof.

---

## PHASE 6 — POSITIONING NARRATIVE (1 page for founder)

**The 2-3 sentence pitch (no overclaiming):**
> "PINNs made neural nets respect *physical law* by putting the law's residual in the training loss. SZL's DINN puts *doctrine's* residual in the loss — so an agent doesn't just get *blocked* when it drifts out of policy, it is *trained* to stay in policy, and we attach a Lean proof that low training-loss implies the governance invariant actually holds to a stated margin. It's the difference between a guardrail that stops you and a vehicle that learns to drive in the lane."

**Tie-ins:**
- **Defense Unicorns' UDS substrate analogy.** UDS signs *images* at admission (cosign) but produces *no signed receipt of what the AI decided at run time* ([100_WARHACKER_DU_DEEP_DIVE.md §1](audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/100_WARHACKER_DU_DEEP_DIVE.md)). DINN is the training-time complement to SZL's existing run-time Khipu receipt: UDS verifies the package, SZL verifies the *decision*, and DINN makes the model *learn* to produce verifiable-good decisions in the first place.
- **DoW Apr-2026 agentic-AI memo.** The memo names "deceptive behavior… misrepresenting actions to avoid shut down" and "ability to bypass guardrails, monitors, and human-in-the-loop" as core risks, and the field demands *cryptographic attestation + declarative safety contracts* ([DoW, *Careful Adoption of Agentic AI Services*, 30 Apr 2026](https://media.defense.gov/2026/Apr/30/2003922823/-1/-1/0/CAREFUL%20ADOPTION%20OF%20AGENTIC%20AI%20SERVICES_FINAL.PDF)). A learner whose *weights* have been shaped by a formally-verified compliance penalty is harder to make "bypass guardrails" — the constraint is internalized, not bolted on.
- **The "watchman who can be trusted" problem.** Every other oversight tool is "an AI watching an AI" — a learned, probabilistic, bypassable monitor ([100_WARHACKER_DU_DEEP_DIVE.md Problem A](audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/100_WARHACKER_DU_DEEP_DIVE.md)). DINN's contribution to that thesis: the watchman's *allow/deny* remains a kernel-verified Lean proof (unchanged), and now the *watched* agent has also been trained against that same verified objective — closing the loop between "the rule" and "the learner that obeys it."

**What NOT to say:** Do not claim "first formally-verified governance learner" until the `sorry`s close. Do not cite the raw Bekenstein physics constant publicly (use the 8A-bit DPI form). Do not call the 9-axis schema "13-axis" in any deck until reconciled.

---

### Citations index (external)
- [Henderson, PINNs intuitive guide, TDS 2025](https://towardsdatascience.com/physics-informed-neural-networks-pinns-an-intuitive-guide-fff138069563/) · [Raissi/Perdikaris/Karniadakis arXiv:1711.10561](https://arxiv.org/abs/1711.10561) · [Raissi et al. JCP 2019](https://www.sciencedirect.com/science/article/pii/S0021999118307125) · [Krishnapriyan NeurIPS 2021](https://arxiv.org/abs/2109.01050) · [Chaudhry ML4PS 2025](https://ml4physicalsciences.github.io/2025/files/NeurIPS_ML4PS_2025_15.pdf) · [Aligned weighting arXiv:2605.25001](https://arxiv.org/html/2605.25001v1) · [PI-DeepONet hard constraints arXiv:2309.07899](https://arxiv.org/abs/2309.07899) · [PINO ACM 2024](https://dl.acm.org/doi/10.1145/3648506) · [Exact Dirichlet BC PINN, CMAME](https://www.sciencedirect.com/science/article/abs/pii/S0045782523003080) · [Hard/soft BC PINN, Phys. Fluids 2025](https://pubs.aip.org/aip/pof/article/37/8/087158/3358658/Physics-informed-neural-networks-with-hard-and) · [DoW AI Strategy Jan 2026](https://media.defense.gov/2026/Jan/12/2003855671/-1/-1/0/artificial-intelligence-strategy-for-the-department-of-war.pdf)

*Internal evidence cites file:line throughout Phase 2/3/5. Deliverable authored 2026-05-31.*
