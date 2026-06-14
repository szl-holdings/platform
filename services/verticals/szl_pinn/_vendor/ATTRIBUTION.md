# ATTRIBUTION & CLEAN-ROOM PROVENANCE — SZL PINN core (`szl_pinn`)

This module is a **clean-room, SZL-native reimplementation of the published
PINN METHOD**. The mathematics and ideas (a neural network trained on a
PDE-residual loss) are standard public science and are not copyrightable; their
specific expression (authors' prose, figures, and any library source code) is.
**No upstream author or library source code was consulted or copied**, and **no
paper text or figures are reproduced verbatim**. Everything here was re-derived
from the governing equations and adopted with explicit citation, per SZL doctrine
(*adopt openly-licensed IDEAS only, rebuilt clean + attributed;
cite-never-plagiarize*). **No paid product code was ever copied.**

## What was adopted, and from where

| Adopted idea (used here) | Source |
|---|---|
| **Physics-informed neural network**: an MLP `u_θ(x,t)` trained on a PDE-residual loss `mean((u_t − α·u_xx)²)` plus boundary/initial-condition penalties at collocation points; automatic differentiation of the network to obtain the PDE operator. | **Raissi, Perdikaris, Karniadakis**, *Physics-informed neural networks: A deep learning framework for solving forward and inverse problems involving nonlinear partial differential equations*, **J. Comput. Phys. 378:686–707 (2019)**, doi:10.1016/j.jcp.2018.10.045. <https://doi.org/10.1016/j.jcp.2018.10.045> |
| Landauer thermodynamic floor used in the honest joule accounting (`k_B·T·ln 2` per irreversible bit erase). | **Landauer**, *Irreversibility and heat generation in the computing process*, **IBM J. Res. Dev. 5(3):183–191 (1961)**, doi:10.1147/rd.53.0183. |
| Split / inductive **conformal prediction** for the honest error band (innovation). | Vovk, Gammerman, Shafer (2005); **Lei et al.**, *Distribution-Free Predictive Inference for Regression*, JASA 113:1094–1111 (2018). |

## Acknowledged PRIOR ART — explicitly NOT copied

- **DeepXDE** — Lu, Meng, Mao, Karniadakis, *DeepXDE: A deep learning library
  for solving differential equations*, **SIAM Review 63(1):208–228 (2021)**,
  doi:10.1137/19M1274067. <https://doi.org/10.1137/19M1274067>
- **NVIDIA Modulus** (physics-ML framework).

These are mature PINN libraries. We acknowledge them as prior art for the
METHOD; **no source code from either was read, vendored, or reused**. The SZL
implementation is independent pure-numpy and exists so the capability is
sovereign and auditable end-to-end.

## What is SZL-native (NOT in the cited method)

- **EXACT analytic PDE derivatives without a framework.** `u_x, u_xx, u_t` (and
  the 2D Laplacian `T_xx + T_yy`) are computed by closed-form **forward-mode**
  differentiation through the tanh MLP, and the PDE-residual loss is
  differentiated w.r.t. parameters by a hand-derived **reverse-over-forward**
  adjoint — verified to machine precision against complex-step differentiation
  (`tests/test_pde_gradient_matches_complex_step`). No torch/JAX autodiff.
- **Provenance receipt per solve** (`receipt.py`): same in-toto / DSSE schema and
  signing posture as the FE-NO operator solver (`szl_mechanics/receipt.py`), so
  PINN is a sibling capability under the same VERIFIED-SCIENTIFIC-COMPUTE MOAT.
  Signatures are left **empty** (UNSIGNED, honest); signing happens on the
  szl_lake / khipu Ed25519 path. We never fabricate a signature.
- **Honest bounded-error reporting + conformal band + Λ gate**: the solution
  error is an **ESTIMATE over the tested input family**, never a proven a-priori
  bound (Λ = Conjecture 1, advisory). The Λ gate is deny-by-default and refuses
  any receipt that claims measured (rather than MODELED) energy.
- **Sovereign-energy thermal application** (`szl_pinn_thermal.py`): a 2D
  steady-state GPU-die heat model with a compute-load source term, framed as
  thermal-aware scheduling input for the wasted-/stranded-energy harvest engine.

## Honest limits held (Doctrine v11)

- The PINN output is a **MODELED** physical field; it does **NOT** create,
  harvest, or measure energy. Real joules are **MEASURED only** by SZL's real
  power exporter. **NO free-energy / over-unity / perpetual-motion** is implied;
  harvest targets **WASTED / stranded** heat only, bounded by ordinary
  thermodynamics (Carnot), never above unity.
- "Bounded across tested cases", never "guaranteed bounded". A genuine a-priori
  PINN convergence theorem is **OPEN** and treated as a research conjecture
  (Λ = Conjecture 1), never claimed. locked-proven = 8 (this is not one of them).
- SLSA L1 honest; Khipu BFT = Conjecture 2. No fabricated numbers — the
  validation in `szl_pinn_validate.py` really runs and converges.

Sign-off: **Stephen P. Lutar Jr. <stephenlutar2@gmail.com>**
