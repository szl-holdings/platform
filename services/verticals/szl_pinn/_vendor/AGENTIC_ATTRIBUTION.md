<!--
SPDX-License-Identifier: Apache-2.0
© 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
-->

# ATTRIBUTION — Agentic PINN + Physical-Bounds Certifier

**CITE-NEVER-PLAGIARIZE (Doctrine v11).** Everything below is *method/mathematics*
attribution. This module is a **clean-room** SZL-native reimplementation built from
**published methods and established physics**. No library source code (DeepXDE
[LGPL], NVIDIA Modulus, pynvml internals) and no paper text were copied. The
fundamental-physics bounds are **CITED, never claimed as SZL conjectures**.

## 1. PINN method (the solver core, reused from `pinn_szl/`)

- **Raissi, M., Perdikaris, P., Karniadakis, G.E. (2019).** "Physics-informed
  neural networks: A deep learning framework for solving forward and inverse
  problems involving nonlinear partial differential equations." *J. Comput. Phys.*
  378:686–707. doi:10.1016/j.jcp.2018.10.045. — The PDE-residual loss. *Method
  attribution only; clean-room, no code/text copied.*

## 2. Adaptive collocation refinement (the agentic loop's step (c))

- **Lu, L., Meng, X., Mao, Z., Karniadakis, G.E. (2021).** "DeepXDE: A deep
  learning library for solving differential equations." *SIAM Review* 63(1):208–228.
  doi:10.1137/19M1274067. — **RAR** (residual-based adaptive refinement).
- **Wu, C., Zhu, M., Tan, Q., Kartha, Y., Lu, L. (2023).** "A comprehensive study
  of non-adaptive and residual-based adaptive sampling for physics-informed neural
  networks." *Comput. Methods Appl. Mech. Engrg.* 403:115671.
  doi:10.1016/j.cma.2022.115671. — **RAD / RAR-D** residual-weighted sampling
  density `p(x) ∝ ε(x)^k / E[ε^k] + c`.

> Our `adaptive_refine()` re-derives the **published method/mathematics** of
> residual-weighted point insertion. **No DeepXDE source code (LGPL) was consulted
> or copied.** Residual-based sampling is standard public science; only the
> non-copyrightable idea/maths is adopted, with citation.

## 3. Honest uncertainty band (the loop's conformal error bar)

- **Vovk, V., Gammerman, A., Shafer, G.** *Algorithmic Learning in a Random World*
  (split/inductive conformal prediction); **Lei, J. et al. (2018)** distribution-
  free predictive inference. — Finite-sample, distribution-free coverage. Clean-room
  math (reused from `pinn_szl/innovations/conformal_interval.py`).

## 4. Fundamental-physics bounds (the certifier) — ESTABLISHED PHYSICS, CITED

| Bound | Source | Formula |
|---|---|---|
| **Landauer floor** | Landauer, R. (1961), *IBM J. Res. Dev.* 5(3):183–191, doi:10.1147/rd.53.0183 | `E_min = k·T·ln2` per bit erased |
| **Margolus–Levitin** | Margolus, N. & Levitin, L. (1998), *Physica D* 120:188–195, doi:10.1016/S0167-2789(98)00054-2 | max ops/s `= 4E/h` |
| **Bremermann** | Bremermann, H.J. (1962), *Self-Organizing Systems* | `c²/h ≈ 1.356×10⁵⁰` bits/s/kg |
| **Bekenstein bound** | Bekenstein, J.D. (1981), *Phys. Rev. D* 23(2):287, doi:10.1103/PhysRevD.23.287 | `S ≤ 2πkRE/(ħc)`; `I ≤ 2πRE/(ħc·ln2)` bits |
| **Bekenstein–Hawking** | Hawking, S.W. (1975), *Commun. Math. Phys.* 43:199–220, doi:10.1007/BF02345020; Bekenstein (1973), *Phys. Rev. D* 7:2333 | `S = k·c³·A/(4Għ)` (holographic area ceiling) |
| **Holographic principle** | 't Hooft (1993); Susskind (1995) | information scales with **area**, not volume |
| **Physical limits of computation** | Lloyd, S. (2000), *Nature* 406:1047; Lloyd (2002), *Phys. Rev. Lett.* 88:237901 | synthesis of the above for compute |

> These are **ESTABLISHED, peer-reviewed physics**. SZL claims **none** of them.
> The certificate is the **honest inverse of a free-energy claim**: it proves a
> real job is *bounded* by these laws — it never claims over-unity.

## 5. SZL's own contribution (what IS novel here)

- The **governed agentic loop**: solve → measure residual → adaptive refine →
  re-solve → **deny-by-default Λ-gate** with a **signed per-round provenance
  trail** (the agent never self-certifies; every round is an *advisory* Λ verdict).
- The **PHYSICAL-BOUNDS CERTIFICATE**: a signer-ready (DSSE/khipu) artifact that
  ties MEASURED compute telemetry to the cited bounds, with strict MEASURED-vs-
  DERIVED labelling and a free-energy guard.
- Integration with the SZL provenance-receipt contract and the locked-formula / Λ
  framework (see README §"Tie-in").

**Λ = Conjecture 1 (advisory).** SLSA L1 (honest). Sovereign / own-metal. No banned
codenames. No fabricated numbers — the validation really runs.
