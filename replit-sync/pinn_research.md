# PINN Deep Harvest — Physics-Informed Neural Networks for SZL Holdings

**Author:** Lead Research Scientist, SZL Holdings
**Date:** 2026-06-14
**Classification:** Founder-Internal · aims the build
**Doctrine:** v11 — NO free-energy/over-unity/perpetual-motion; energy harvest = WASTED/stranded only; PINNs MODEL heat, they do not create energy; Λ = Conjecture 1 (advisory); locked-proven = 8 theorems; SLSA L1 honest; sovereign own-metal; joules MEASURED only via a real exporter sample; cite-never-plagiarize; every $/credit = ESTIMATE.

> **Scope.** This report makes SZL expert in physics-informed neural networks (PINNs) and physics-informed machine learning, then maps — energy-first — exactly how the method evolves SZL's surfaces. It is the research substrate for a "PINNs for Mechanical Engineers" / "Mastering Heat Transfer PINNs" product and for upgrading the energy, mechanics, forecast, and lutar-lean surfaces. Every claim is cited to a primary source. Every license is verified against the upstream repository. No method here violates Doctrine v11.

---

## PART 1 — FOUNDATIONS & METHOD

### 1.1 The PINN paradigm in one sentence

A physics-informed neural network is a neural network whose **loss function embeds the residual of a governing partial differential equation (PDE)**, evaluated by **automatic differentiation** at a set of **collocation points**, so the trained network is constrained to respect the physics — symmetries, invariances, and conservation principles — rather than merely interpolating data. This is the formulation introduced by [Raissi, Perdikaris & Karniadakis (2019), *J. Comp. Physics* 378:686–707](https://doi.org/10.1016/j.jcp.2018.10.045) and reviewed comprehensively in [Karniadakis et al. (2021), *Nature Reviews Physics* 3:422–440](https://doi.org/10.1038/s42254-021-00314-5), which describes PINNs as "seamlessly integrat[ing] the information from both the measurements and partial differential equations (PDEs) by embedding the PDEs into the loss function of a neural network using automatic differentiation."

### 1.2 The heat / diffusion equation worked end-to-end (the product's core)

This is the equation baked into the founder's `physics_loss`. Consider the 1-D heat (diffusion) equation on a spatial domain \(x\in[0,L]\) and time \(t\in[0,T]\):

\[
\frac{\partial u}{\partial t} \;=\; \alpha\,\frac{\partial^2 u}{\partial x^2}, \qquad u_t = \alpha\,u_{xx},
\]

where \(u(x,t)\) is temperature and \(\alpha>0\) is the thermal diffusivity \((\alpha = k/(\rho c_p)\), conductivity over volumetric heat capacity). A PINN replaces \(u(x,t)\) with a neural surrogate \(u_\theta(x,t)\) (parameters \(\theta\)). Define the **PDE residual operator**

\[
r_\theta(x,t) \;=\; \frac{\partial u_\theta}{\partial t}(x,t) \;-\; \alpha\,\frac{\partial^2 u_\theta}{\partial x^2}(x,t).
\]

If \(u_\theta\) solves the PDE exactly, \(r_\theta \equiv 0\). The derivatives \(\partial_t u_\theta\) and \(\partial_{xx} u_\theta\) are obtained **exactly (to machine precision) by automatic differentiation of the network with respect to its inputs** — not by finite differences, hence no discretization/truncation error in the operator itself, as emphasized by [Cai, Wang, Wang, Perdikaris & Karniadakis (2021), *J. Heat Transfer* 143(6):060801](https://doi.org/10.1115/1.4050542): "automatic differentiation is leveraged to evaluate differential operators without discretization errors."

**The composite (physics) loss.** Training minimizes a weighted sum of three terms:

\[
\mathcal{L}(\theta) \;=\; \lambda_r\,\mathcal{L}_r(\theta) \;+\; \lambda_b\,\mathcal{L}_b(\theta) \;+\; \lambda_0\,\mathcal{L}_0(\theta)\;\;(+\;\lambda_d\,\mathcal{L}_d(\theta)),
\]

- **PDE residual loss** (interior physics), at \(N_r\) collocation points \(\{(x_r^i,t_r^i)\}\) sampled in the interior of the space-time domain:
\[
\mathcal{L}_r(\theta) = \frac{1}{N_r}\sum_{i=1}^{N_r} \big| r_\theta(x_r^i,t_r^i) \big|^2.
\]
- **Boundary-condition loss** at \(N_b\) boundary points. For Dirichlet data \(u=g_D\) on \(x\in\{0,L\}\):
\[
\mathcal{L}_b(\theta) = \frac{1}{N_b}\sum_{i=1}^{N_b}\big| u_\theta(x_b^i,t_b^i) - g_D(x_b^i,t_b^i)\big|^2,
\]
and for Neumann (flux) data \(-k\,\partial_x u = q\), the residual uses \(\partial_x u_\theta\) (again via autodiff).
- **Initial-condition loss** at \(N_0\) points at \(t=0\): \(\mathcal{L}_0 = \frac{1}{N_0}\sum_i |u_\theta(x_0^i,0)-u_0(x_0^i)|^2\).
- **Data loss** (optional), at any sparse sensor measurements \(\{(x_d^i,t_d^i,u_d^i)\}\): \(\mathcal{L}_d = \frac{1}{N_d}\sum_i |u_\theta(x_d^i,t_d^i)-u_d^i|^2\). This is what lets PINNs solve **inverse / data-assimilation** problems (e.g. unknown \(\alpha\), or unknown boundary heat flux), as demonstrated for heat transfer with unknown thermal boundary conditions by [Cai et al. (2021)](https://doi.org/10.1115/1.4050542).

**Collocation points** are the discretization-free analogue of a mesh: they are sampled (uniform, Latin-hypercube, or adaptively refined where the residual is large) and can be re-sampled each epoch. **Residual-based adaptive refinement (RAR)** concentrates points where \(|r_\theta|\) is largest, improving accuracy on sharp fronts — a feature popularized by the DeepXDE library ([Lu, Meng, Mao & Karniadakis (2021), *SIAM Review* 63(1):208–228](https://doi.org/10.1137/19M1274067)).

**Automatic differentiation (why it is the engine).** Because \(u_\theta\) is a composition of differentiable layers, reverse-/forward-mode AD computes \(\partial_t u_\theta\), \(\partial_x u_\theta\), \(\partial_{xx} u_\theta\) as exact derivatives of the network graph. There is no stencil, no grid spacing \(h\), and the same machinery extends to any differential operator (higher order, mixed, nonlinear). This is the single mechanism that makes the residual loss possible and is the conceptual core of [Raissi et al. (2019)](https://doi.org/10.1016/j.jcp.2018.10.045).

### 1.3 Other canonical PINN systems (the breadth the product must cover)

**Navier–Stokes (fluid flow).** For incompressible flow the residuals enforce momentum and continuity:
\[
\partial_t \mathbf{u} + (\mathbf{u}\!\cdot\!\nabla)\mathbf{u} = -\tfrac{1}{\rho}\nabla p + \nu\nabla^2\mathbf{u}, \qquad \nabla\!\cdot\!\mathbf{u}=0.
\]
The reference PINN treatment is **NSFnets** ([Jin, Cai, Li & Karniadakis (2021), *J. Comp. Physics* 426:109951](https://doi.org/10.1016/j.jcp.2020.109951)), which solves the incompressible Navier–Stokes equations in velocity–pressure and vorticity–velocity forms. A divergence-free **hard constraint** is often imposed via a stream-function formulation so continuity holds by construction.

**Elasticity / structural dynamics (SZL's mechanics surface).** For linear elastostatics the residual is the equilibrium PDE \(\nabla\!\cdot\!\sigma + \mathbf{b} = 0\) with constitutive law \(\sigma = \mathbb{C}:\varepsilon\), \(\varepsilon = \tfrac12(\nabla\mathbf{u}+\nabla\mathbf{u}^\top)\). The canonical solid-mechanics PINN is [Haghighat, Raissi, Moure, Gomez & Juanes (2021), *CMAME* 379:113741](https://doi.org/10.1016/j.cma.2021.113741) (arXiv:2003.02751), "A physics-informed deep learning framework for inversion and surrogate modeling in solid mechanics." A **two-mass spring–damper** structural-dynamics PINN (the "Dynamics PINN" two-mass system in SZL's screenshot) enforces the coupled ODE residuals \(m_i\ddot{x}_i + \) damping/stiffness terms \(= 0\), again with AD providing \(\dot{x}_i,\ddot{x}_i\).

### 1.4 Hard vs. soft constraints

- **Soft constraints** add BC/IC as penalty terms in the loss (the formulation in §1.2). Simple and general, but the constraints are only approximately satisfied and the **loss weights \(\lambda\) must be balanced** — the source of most training pathology (§1.5).
- **Hard constraints** build the constraint into the architecture so it holds *exactly by construction*. Example: replace \(u_\theta\) by an ansatz \(\hat{u}(x,t) = g(x,t) + \ell(x,t)\,u_\theta(x,t)\), where \(g\) reproduces the boundary/initial data and the *distance function* \(\ell\) vanishes on the boundary — so BC/IC residuals are identically zero and only the PDE residual is trained. Conservation can likewise be hard-wired (divergence-free stream-function for incompressible flow; symmetric strain operator for elasticity). SZL's own FE-NO core uses a related principle: strain/stress are **analytically derived** from the operator (\(\sigma = E\,\partial_x G^u\)) so mechanical consistency holds by construction rather than by penalty (`feno_szl/README.md`, `ATTRIBUTION.md`).

### 1.5 Known failure modes (the honest part — what breaks and the fixes)

PINNs are not a free lunch; the founder-grade product must teach the failure taxonomy:

1. **Spectral bias.** Neural nets learn low frequencies first and struggle with high-frequency / multiscale content. The diagnosis and the **Fourier-feature** fix are in [Wang, Wang & Perdikaris (2021), "On the eigenvector bias of Fourier feature networks…", *CMAME* 384:113938](https://doi.org/10.1016/j.cma.2021.113938).
2. **Unbalanced gradients / loss-weighting stiffness.** The multi-term loss produces back-propagated gradients of wildly different magnitude; the residual term swamps the BC term (or vice versa). [Wang, Teng & Perdikaris (2021), *SIAM J. Sci. Comput.* 43(5):A3055–A3081](https://doi.org/10.1137/20M1318043) (arXiv:2001.04536) identify this "fundamental mode of failure … related to numerical stiffness leading to unbalanced back-propagated gradients" and propose a **learning-rate annealing** algorithm that uses gradient statistics to set the \(\lambda\) weights adaptively, reporting 50–100× accuracy gains.
3. **NTK-perspective training failure.** [Wang, Yu & Perdikaris (2022), "When and why PINNs fail to train: A neural tangent kernel perspective", *J. Comp. Physics* 449:110768](https://doi.org/10.1016/j.jcp.2021.110768) (arXiv:2007.14527) show the Neural Tangent Kernel of a PINN has eigenvalues spanning many orders of magnitude, explaining slow/biased convergence, and propose **NTK-based adaptive weighting** of the loss terms. (Caveat for the honest curriculum: [the NTK picture breaks for nonlinear PDEs — the kernel is stochastic at init and dynamic during training, arXiv:2402.03864](https://arxiv.org/html/2402.03864) — so NTK reweighting is a heuristic, not a guarantee.)
4. **Stiff / multiscale PDEs.** Stiffness (fast + slow timescales) destabilizes the residual optimization; remedies include domain decomposition (§Part 2 cPINN/XPINN), adaptive sampling, and operator-splitting hybrids.
5. **Temporal causality violation (training pathology for time-dependent PDEs).** Vanilla PINNs minimize the residual over all times simultaneously, so the network can "cheat" by fitting late-time behavior before early-time dynamics are correct. [Wang, Sankaran & Perdikaris (2024), "Respecting causality for training physics-informed neural networks", *CMAME* 421:116813](https://doi.org/10.1016/j.cma.2024.116813) reformulate the loss with a **causal weight** \(\omega_i \propto \exp(-\epsilon\sum_{k<i}\mathcal{L}_r(t_k))\), so the residual at time \(t_i\) is only weighted once earlier times are well-approximated; this fixes benchmarks (Lorenz, Kuramoto–Sivashinsky, Navier–Stokes) where vanilla PINNs fail and gives a quantitative convergence diagnostic.

**Gradient-balancing toolbox (summary):** learning-rate annealing ([Wang et al. 2021](https://doi.org/10.1137/20M1318043)), NTK reweighting ([Wang et al. 2022](https://doi.org/10.1016/j.jcp.2021.110768)), causal training ([Wang et al. 2024](https://doi.org/10.1016/j.cma.2024.116813)), Fourier features for spectral bias ([Wang et al. 2021 CMAME 384](https://doi.org/10.1016/j.cma.2021.113938)), residual-based adaptive collocation ([Lu et al. 2021 SIAM Rev.](https://doi.org/10.1137/19M1274067)).

### 1.6 The bridge to OPERATOR LEARNING — the unification SZL already half-owns

A PINN solves **one instance** of a PDE (one BC/IC/geometry) as a mesh-free function approximator. **Operator-learning networks** instead learn the **solution operator** \(G: a \mapsto u\) mapping an input function (initial condition, source, geometry, parameter field) to the PDE solution — so a single trained net is a **fast surrogate for an entire family** of problems and runs in milliseconds at inference.

- **DeepONet** ([Lu, Jin, Pang, Zhang & Karniadakis (2021), *Nature Machine Intelligence* 3:218–229](https://doi.org/10.1038/s42256-021-00302-5)) factorizes the operator into a **branch net** (encodes the input function sampled at sensor points) and a **trunk net** (encodes query coordinates), combined by a dot product: \(u(y) = \sum_k b_k(a)\,t_k(y) + b_0\). This is exactly the architecture SZL adopts in `szl_point_deeponet.py` (`feno_szl/README.md`, `ATTRIBUTION.md`).
- **Fourier Neural Operator (FNO)** ([Li, Kovachki, Azizzadenesheli, Liu, Bhattacharya, Stuart & Anandkumar (2021), ICLR 2021](https://openreview.net/forum?id=c8P9NQVtmnO)) parameterizes the integral kernel directly in Fourier space, giving a **resolution-invariant, mesh-invariant** operator that is "up to three orders of magnitude faster compared to traditional PDE solvers" and the first ML method to model turbulent Navier–Stokes with zero-shot super-resolution.

**The unification (this is the strategic core for SZL):**

| | PINN | Operator net (DeepONet/FNO) |
|---|---|---|
| Learns | one solution \(u\) | the solution **operator** \(G\) |
| Mesh | **mesh-free** (collocation) | mesh-/grid- (FNO) or point-cloud (Point-DeepONet) |
| Cost | train per problem | train once, infer fast on a whole family |
| Data | can be **zero-data** (physics only) | usually needs solution pairs |
| Role | flexible PDE *solver* / inverse engine | fast *surrogate* |

The two **fuse** as **physics-informed operator learning**: [Wang, Wang & Perdikaris (2021), "Learning the solution operator of parametric PDEs with physics-informed DeepONets", *Science Advances* 7(40):eabi8605](https://doi.org/10.1126/sciadv.abi8605) trains a DeepONet using the **PDE residual as the loss** (no labeled solution pairs) — i.e. a PINN loss applied to an operator net. **SZL already sits on this exact unification:** the clean-room FE-NO core (`platform/services/verticals/szl_mechanics` / `feno_szl`) couples a real finite-element subdomain to a Point-DeepONet operator subdomain via non-overlapping Schwarz with Neumann–Dirichlet exchange, and its optional **physics-informed derivative-supervision** term (`ATTRIBUTION.md`, citing [Wang, Wang & Perdikaris 2021](https://doi.org/10.1126/sciadv.abi8605)) is precisely a PINN residual on the operator. **PINNs are the missing mesh-free PDE-solve / inverse / data-assimilation half; the operator nets are the fast-surrogate half. Adding a PINN capability completes the picture SZL's mechanics stack was already drawing.**

---

## PART 2 — PUBLICATION CANON + FRONTIER (every entry cited to a primary source)

### 2.1 The canon (foundations)

| # | Paper | Authors | Venue / Year | DOI / arXiv |
|---|---|---|---|---|
| C1 | **Physics-informed neural networks: a deep learning framework for forward & inverse problems involving nonlinear PDEs** (the original PINN paper) | Raissi, Perdikaris, Karniadakis | *J. Comp. Physics* **378**:686–707, 2019 | [10.1016/j.jcp.2018.10.045](https://doi.org/10.1016/j.jcp.2018.10.045) |
| C2 | **Physics-informed machine learning** (the field-defining review) | Karniadakis, Kevrekidis, Lu, Perdikaris, Wang, Yang | *Nature Reviews Physics* **3**:422–440, 2021 | [10.1038/s42254-021-00314-5](https://doi.org/10.1038/s42254-021-00314-5) |
| C3 | **Hidden physics models** (precursor; data-driven PDE discovery) | Raissi, Karniadakis | *J. Comp. Physics* **357**:125–141, 2018 | [10.1016/j.jcp.2017.11.039](https://doi.org/10.1016/j.jcp.2017.11.039) |
| C4 | **DeepXDE: a deep learning library for solving differential equations** (the reference library + RAR) | Lu, Meng, Mao, Karniadakis | *SIAM Review* **63**(1):208–228, 2021 | [10.1137/19M1274067](https://doi.org/10.1137/19M1274067) |

### 2.2 Domain decomposition & conservation-law enforcement

| # | Paper | Authors | Venue / Year | DOI / arXiv |
|---|---|---|---|---|
| F1 | **cPINN — Conservative PINNs on discrete domains for conservation laws** (flux continuity across subdomain interfaces; adaptive activations) | Jagtap, Kharazmi, Karniadakis | *CMAME* **365**:113028, 2020 | [10.1016/j.cma.2020.113028](https://doi.org/10.1016/j.cma.2020.113028) |
| F2 | **XPINN — Extended PINNs: generalized space-time domain decomposition** (any PDE, arbitrary decomposition, parallelizable) | Jagtap, Karniadakis | *Commun. Comput. Phys.* **28**(5):2002–2041, 2020 | [10.4208/cicp.OA-2020-0164](https://doi.org/10.4208/cicp.OA-2020-0164) |

### 2.3 Uncertainty / Bayesian

| # | Paper | Authors | Venue / Year | DOI / arXiv |
|---|---|---|---|---|
| F3 | **B-PINNs — Bayesian physics-informed neural networks for forward & inverse PDE problems with noisy data** (HMC / variational posterior; epistemic UQ) | Yang, Meng, Karniadakis | *J. Comp. Physics* **425**:109913, 2021 | [10.1016/j.jcp.2020.109913](https://doi.org/10.1016/j.jcp.2020.109913) |

### 2.4 Variational / weak-form

| # | Paper | Authors | Venue / Year | DOI / arXiv |
|---|---|---|---|---|
| F4 | **VPINNs — Variational PINNs** (Petrov–Galerkin weak form; lowers operator order via integration by parts) | Kharazmi, Zhang, Karniadakis | arXiv:1912.00873, 2019 | [arXiv:1912.00873](https://arxiv.org/abs/1912.00873) |
| F5 | **hp-VPINNs — Variational PINNs with domain decomposition** (h- and p-refinement of the weak form) | Kharazmi, Zhang, Karniadakis | *CMAME* **374**:113547, 2021 | [10.1016/j.cma.2020.113547](https://doi.org/10.1016/j.cma.2020.113547) |

### 2.5 Training pathologies & gradient balancing (the "make it actually converge" canon)

| # | Paper | Authors | Venue / Year | DOI / arXiv |
|---|---|---|---|---|
| F6 | **Understanding & mitigating gradient pathologies in PINNs** (learning-rate annealing; gradient-balanced loss weights; 50–100× gains) | Wang, Teng, Perdikaris | *SIAM J. Sci. Comput.* **43**(5):A3055–A3081, 2021 | [10.1137/20M1318043](https://doi.org/10.1137/20M1318043) · [arXiv:2001.04536](https://arxiv.org/abs/2001.04536) |
| F7 | **When & why PINNs fail to train: an NTK perspective** (NTK eigenvalue spread → adaptive weighting) | Wang, Yu, Perdikaris | *J. Comp. Physics* **449**:110768, 2022 | [10.1016/j.jcp.2021.110768](https://doi.org/10.1016/j.jcp.2021.110768) · [arXiv:2007.14527](https://arxiv.org/abs/2007.14527) |
| F8 | **On the eigenvector bias of Fourier feature networks** (spectral bias diagnosis + multiscale fix) | Wang, Wang, Perdikaris | *CMAME* **384**:113938, 2021 | [10.1016/j.cma.2021.113938](https://doi.org/10.1016/j.cma.2021.113938) |
| F9 | **Respecting causality for training PINNs** (causal weighting; fixes time-dependent benchmarks; convergence diagnostic) | Wang, Sankaran, Perdikaris | *CMAME* **421**:116813, 2024 | [10.1016/j.cma.2024.116813](https://doi.org/10.1016/j.cma.2024.116813) |

### 2.6 Operator learning + PINN–operator hybrids (the unification frontier)

| # | Paper | Authors | Venue / Year | DOI / arXiv |
|---|---|---|---|---|
| F10 | **DeepONet — learning nonlinear operators via the universal operator-approximation theorem** | Lu, Jin, Pang, Zhang, Karniadakis | *Nature Machine Intelligence* **3**:218–229, 2021 | [10.1038/s42256-021-00302-5](https://doi.org/10.1038/s42256-021-00302-5) |
| F11 | **Fourier Neural Operator (FNO) for parametric PDEs** (resolution-invariant; turbulent NS; up to 1000× faster) | Li, Kovachki, Azizzadenesheli, Liu, Bhattacharya, Stuart, Anandkumar | ICLR 2021 | [ICLR 2021](https://openreview.net/forum?id=c8P9NQVtmnO) · [arXiv:2010.08895](https://arxiv.org/abs/2010.08895) |
| F12 | **Physics-informed DeepONets** (PINN residual as the operator-net loss; no paired data) | Wang, Wang, Perdikaris | *Science Advances* **7**(40):eabi8605, 2021 | [10.1126/sciadv.abi8605](https://doi.org/10.1126/sciadv.abi8605) · [arXiv:2103.10974](https://arxiv.org/abs/2103.10974) |
| F13 | **Non-overlapping Schwarz hybrid FE–Neural-Operator solver for solid mechanics on irregular domains** (the method SZL's FE-NO core clean-rooms) | Wang, Gupta, Ruan, Goswami | arXiv:2606.08796 [cs.CE], 2026, CC BY 4.0 | [arXiv:2606.08796](https://arxiv.org/abs/2606.08796) · DOI [10.48550/arXiv.2606.08796](https://doi.org/10.48550/arXiv.2606.08796) |

### 2.7 Domain-specific: heat transfer & solid mechanics (the product verticals)

| # | Paper | Authors | Venue / Year | DOI / arXiv |
|---|---|---|---|---|
| F14 | **PINNs for heat transfer problems** (forced/mixed convection, unknown thermal BCs, two-phase Stefan; inverse heat transfer) | Cai, Wang, Wang, Perdikaris, Karniadakis | *ASME J. Heat Transfer* **143**(6):060801, 2021 | [10.1115/1.4050542](https://doi.org/10.1115/1.4050542) |
| F15 | **NSFnets — PINNs for the incompressible Navier–Stokes equations** | Jin, Cai, Li, Karniadakis | *J. Comp. Physics* **426**:109951, 2021 | [10.1016/j.jcp.2020.109951](https://doi.org/10.1016/j.jcp.2020.109951) |
| F16 | **A physics-informed deep learning framework for inversion & surrogate modeling in solid mechanics** | Haghighat, Raissi, Moure, Gomez, Juanes | *CMAME* **379**:113741, 2021 | [10.1016/j.cma.2021.113741](https://doi.org/10.1016/j.cma.2021.113741) · [arXiv:2003.02751](https://arxiv.org/abs/2003.02751) |

### 2.8 Recent synthesis (2024)

| # | Paper | Authors | Venue / Year | DOI / arXiv |
|---|---|---|---|---|
| F17 | **Physics-Informed Neural Networks and Extensions** (current-state review by the originators; failure modes & remedies consolidated) | Raissi, Perdikaris, Ahmadi, Karniadakis | arXiv:2408.16806, 2024 | [arXiv:2408.16806](https://arxiv.org/abs/2408.16806) |

> **Honest caveat held in the curriculum.** PINNs do **not** come with general a-priori error bounds; convergence is problem-dependent and the failure modes in §1.5 are real. The product must teach the fixes (F6–F9) and the honest UQ (F3, conformal) — never sell PINNs as a guaranteed black-box solver. This mirrors SZL's FE-NO honesty: "bounded across tested cases, never guaranteed bounded" (`feno_szl/ATTRIBUTION.md`).

---

## PART 3 — OPENLY-LICENSED FRAMEWORKS (LICENSE VERIFIED AT SOURCE)

**Method:** each license was read directly from the upstream repository's `LICENSE`/`LICENSE.txt` via the GitHub API on 2026-06-14 (and cross-checked against PyPI metadata where the GitHub auto-classifier failed). **Doctrine rule applied:** permissive (MIT/BSD/Apache-2.0) is OK for code reuse with attribution; **copyleft (GPL/LGPL) → method/ideas only, never source incorporation; no-license / non-commercial → REJECT for code reuse (method/ideas only, clean-room).**

| Framework | Repo (verified) | EXACT license (verified) | Reuse verdict | What to adopt | Clean-room note |
|---|---|---|---|---|---|
| **DeepXDE** | [`lululxvi/deepxde`](https://github.com/lululxvi/deepxde) | **LGPL-2.1** (GitHub API `spdx: LGPL-2.1`; PyPI `License :: OSI Approved :: GNU Lesser General Public License v2 (LGPLv2)`, v1.15.0) | ⚠️ **COPYLEFT → METHOD-ONLY.** Do **not** copy/fork source into SZL's permissive/closed code. LGPL permits *dynamic linking* against the unmodified library, but SZL doctrine is conservative: treat as **ideas only**. | RAR adaptive collocation, the geometry/BC abstraction, the clean PINN API design pattern | Re-derive the math (RAR, residual loss) clean-room; cite DeepXDE ([SIAM Review 63:208–228](https://doi.org/10.1137/19M1274067)); SZL-native naming; do not vendor LGPL source. |
| **NVIDIA Modulus / PhysicsNeMo** | [`NVIDIA/modulus`](https://github.com/NVIDIA/modulus) → redirects to [`NVIDIA/physicsnemo`](https://github.com/NVIDIA/physicsnemo) | **Apache-2.0** (verified on both the redirect target `NVIDIA/physicsnemo` and `LICENSE.txt`) | ✅ **PERMISSIVE — reusable with attribution + NOTICE.** | Modulus's PINN/operator training recipes, Fourier-feature & SDF hard-constraint utilities, multi-GPU scaling patterns (where SZL chooses a framework path); otherwise the design ideas | Apache-2.0 allows reuse; retain copyright/NOTICE, state changes. Prefer adopting *ideas* to keep the sovereign pure-numpy core dependency-free. |
| **jaxpi** ("jax-pi" / PirateNet JAX repo) | [`PredictiveIntelligenceLab/jaxpi`](https://github.com/PredictiveIntelligenceLab/jaxpi) | **NOT open source** — custom **"Penn Software PirateNet" license: non-profit research use only; no distribution to third parties without Penn's written approval** (GitHub API `spdx: NOASSERTION`; full text verified) | ❌ **REJECT for code reuse (commercial).** Non-commercial + no-redistribution. | The *published methods* only — PirateNet residual adaptive resampling, curriculum/causal training, gradient-balancing schemes — which are described in the open papers (F6–F9) | **Method/ideas only, clean-room from the papers, never the repo code.** The repo license forbids commercial use and third-party distribution. Cite the papers, not the code. |
| **neurodiffeq** | [`NeuroDiffGym/neurodiffeq`](https://github.com/NeuroDiffGym/neurodiffeq) | **MIT** (verified; "Copyright (c) 2019 Feiyu Chen") | ✅ **PERMISSIVE — reusable with attribution.** | Lightweight ODE/PDE PINN bundle-solution patterns, the hard-constraint reparametrization helpers | MIT allows reuse; retain copyright notice. Prefer ideas to keep core sovereign. |
| **PINA** | [`mathLab/PINA`](https://github.com/mathLab/PINA) | **MIT** (verified `LICENSE.rst`; "Copyright (c) 2021-current PINA contributors") | ✅ **PERMISSIVE — reusable with attribution.** | PyTorch-Lightning-based problem/solver abstractions, operator-learning + PINN unified API design | MIT allows reuse; retain copyright notice. |
| **SciANN** | [`ehsanhaghighat/sciann`](https://github.com/ehsanhaghighat/sciann) (old `sciann/sciann` repo deprecated/moved) | **MIT** (GitHub auto-classifier shows NOASSERTION because the file has a custom header, but the body is **verbatim MIT** and PyPI declares `License :: OSI Approved :: MIT License`) | ✅ **PERMISSIVE — reusable with attribution.** | Keras-style functional API for assembling PINNs; solid-mechanics PINN patterns (author Haghighat is also F16) | MIT allows reuse; retain the custom copyright header + MIT notice. |
| **IDRLnet** | [`idrl-lab/idrlnet`](https://github.com/idrl-lab/idrlnet) | **Apache-2.0** (verified) | ✅ **PERMISSIVE — reusable with attribution + NOTICE.** | Symbolic-PDE → PINN graph compilation, geometry/sampling modules | Apache-2.0 allows reuse; retain NOTICE, state changes. |

**Adoption stance for SZL (doctrine-consistent).** SZL's FE-NO core is **pure-numpy, sovereign, own-metal, dependency-free** by design (`feno_szl/requirements.txt`). The recommended path is **adopt the permissive frameworks' *ideas/patterns* and re-implement clean-room in SZL-native numpy** (as already done for FE-NO/DeepONet), preserving auditability and avoiding any heavy ML-framework dependency in the trust path. Where a framework path is later chosen for scale, **Apache-2.0 (PhysicsNeMo, IDRLnet) and MIT (neurodiffeq, PINA, SciANN) are clean to vendor with attribution; DeepXDE (LGPL) and jaxpi (non-commercial) are method-only and must never have their source copied into SZL code.**

---

## PART 4 — SZL FIT: "EVOLVE THE ENERGY SIDE" (the build map)

Each item below states **what to build**, **which SZL surface it upgrades**, and **the moat** (signed receipt + honest bounded error, Λ=Conjecture 1 advisory, joules MEASURED only, NO free-energy/over-unity). All four reuse SZL's existing trust plumbing: the **provenance receipt** (`feno_receipt.json`, DSSE/Khipu-ready, `signature: null` until really signed), the **split-conformal honest uncertainty** band (`feno_szl/innovations/conformal_interval.py`), and the **Λ-gate deny-by-default governance** (`feno_szl/innovations/lambda_gate.py`).

### 4.1 ENERGY (energy-first) — Thermal-aware PINN for the GPU fabric

- **What to build.** A **heat-equation PINN** for the GPU/datacenter thermal field: \(u_t = \alpha\,u_{xx}\) (1-D bar / fin) extended to \(\partial_t u = \nabla\!\cdot(\alpha\nabla u) + Q(x,t)/(\rho c_p)\) in 2-D/3-D, where the source \(Q\) is the **MEASURED** per-chip power draw from the real NVML exporter (the only legitimate joule source per `devO_joules_honesty.md` — `joules_label="measured"` *only* with a fresh exporter sample inside the 120 s freshness window via `szl_joules_truth.py`). The PINN predicts the temperature field and hotspots between sparse sensor readings (an **inverse / data-assimilation** problem exactly in the wheelhouse of [Cai et al. 2021](https://doi.org/10.1115/1.4050542)), enabling **thermal-aware scheduling**: route/throttle inference to keep junction temperatures bounded and to exploit waste-heat reuse.
- **Which SZL surface.** The **a11oy energy tab**, the **`SZLHOLDINGS/energy` HF space** (`hf_energy_space/`), and the **wasted-energy harvest engine** (`harvest_budget.py`, `a11oy_harvest_endpoints.py`). Ties directly to the stranded-energy thesis (`STRANDED_ENERGY_SOVEREIGN_COMPUTE.md`): waste-heat double-use (server exhaust → district heating) is a *measured* thermal-transport problem a PINN models honestly.
- **Joule-accounting physics.** The PINN **models heat transport and dissipation**; it does **not** create energy. Landauer (\(k_BT\ln 2\) per irreversible bit) and Bekenstein bounds remain **advisory physical references** SZL already cites — used to frame thermodynamic floors, never to claim recovery beyond what is measured. **Energy "harvest" = WASTED/stranded only** (curtailed wind/solar, flared gas, surplus hydro, server waste-heat — all cited in `STRANDED_ENERGY_SOVEREIGN_COMPUTE.md`). **NO free-energy, NO over-unity, NO perpetual motion. A PINN that predicts a hotspot saves scheduling joules by avoiding waste; it never manufactures joules.**
- **The moat.** Every thermal solve emits a **signed-ready receipt** (inputs hash, geometry, MEASURED power source + `joules_evidence`, conformal coverage band, wall-time, `verified` flag, `signature: null`); error is an **honest bounded ESTIMATE** with a **split-conformal interval** (distribution-free, with a `distribution_shift_flag` when the served thermal regime drifts off calibration); the verdict passes the **Λ-gate (advisory, deny-by-default, Λ=Conjecture 1 — "passed SZL admission policy, NOT proven correct")**. No competitor pairs a thermal PINN with measured-only joules + cryptographic provenance + conformal honesty.

### 4.2 MECHANICS / VESSELS — Dynamics PINN complementing the FE-NO solver

- **What to build.** A **structural-dynamics PINN** for the **two-mass spring–damper system** (the "Dynamics PINN" in the SZL screenshot): residuals \(m_1\ddot{x}_1 = -k_1 x_1 - c_1\dot{x}_1 + k_2(x_2-x_1)+c_2(\dot{x}_2-\dot{x}_1)\), etc., with AD providing \(\dot{x},\ddot{x}\). For continua, an elasticity PINN (per [Haghighat et al. 2021](https://doi.org/10.1016/j.cma.2021.113741)) as the **mesh-free PDE-solve / inverse** complement to the FE-NO **fast surrogate**. This *completes the unification of §1.6 inside SZL's own stack*: PINN = mesh-free transient/inverse solver; FE-NO Point-DeepONet = fast operator surrogate; they share the same Schwarz-coupling and analytic-strain machinery.
- **Which SZL surface.** `platform/services/verticals/szl_mechanics` / `feno_szl`, surfaced on the **mechanics HF space** (`hf_mechanics_space/`) and the FE-NO console.
- **The moat.** Reuses the FE-NO **provenance receipt + bounded-error estimate + conformal band + Λ-gate** unchanged; the PINN residual is itself a *verifiable* physics check on the surrogate ("does the fast operator obey the PDE the PINN enforces?"). Honest limits held: no a-priori convergence theorem is claimed (open research conjecture, per `ATTRIBUTION.md`).

### 4.3 FORECAST tab — PINN-based physical forecasting with conformal UQ

- **What to build.** A **physics-constrained forecaster**: where a quantity obeys (or approximately obeys) a known dynamical law (thermal decay, diffusion, charge/discharge dynamics), train a PINN whose residual enforces that law, then wrap every forecast in a **split-conformal prediction interval** (`conformal_interval.py`) for distribution-free coverage — and flag distribution shift honestly when the regime drifts.
- **Which SZL surface.** The **FORECAST tab** (a11oy / yarqa forecast surfaces).
- **The moat.** A forecast that is *both* physically consistent (PINN residual) *and* honestly uncertain (conformal coverage measured on a held-out check set, never assumed) and *governed* (Λ-gate advisory). Coverage is a **finite-sample exchangeability statement, not a proof** — stated explicitly, matching SZL's "honest error bar, not a proof of correctness" doctrine.

### 4.4 lutar-lean — Machine-checked PINN residual bound / conservation law

- **What to build.** Two honest, scoped Lean targets in `lutar-lean`:
  1. **A conservation-law / residual-bound *specification*** — formalize the statement "for the discrete cPINN/Schwarz coupling, the interface flux-continuity residual is bounded by \(\epsilon\) under stated hypotheses" as a Lean *spec* with explicit `sorry`-annotated obligations, exactly analogous to how Khipu BFT is treated (Conjecture 2: a Lean specification short of a full proof, per `STATE_OF_SZL`). What is *machine-checkable now* is the **algebraic identity** (e.g. a discrete conservation/telescoping-sum identity, or a verified-arithmetic check that a *given numeric* residual is below a *given* tolerance — a decidable proposition), **not** a general PINN convergence theorem.
  2. Keep the **general PINN/FE-NO a-priori error bound as an explicit research conjecture** (Λ-style advisory), never claimed as a theorem.
- **Which SZL surface.** `szl-holdings/lutar-lean` (the kernel-checked witness library) + the FE-NO certificate (`solve_certificate.py`).
- **The moat.** A *machine-checked* discrete conservation identity or a *verified-arithmetic* residual-below-tolerance certificate is a non-replicable proof-of-capability that compounds the estate — **but it is honestly labeled**: it certifies the *algebra/arithmetic*, not that "the PINN is correct." This respects **locked-proven = 8**, adds nothing to the theorem count it cannot defend, and keeps Λ = Conjecture 1 advisory.

### 4.5 Doctrine compliance checklist (v11) — all four builds

| Doctrine rule | How each PINN build complies |
|---|---|
| NO free-energy / over-unity / perpetual motion | PINNs **model** heat/dynamics; never claim energy creation. Harvest = WASTED/stranded only (`STRANDED_ENERGY_SOVEREIGN_COMPUTE.md`). |
| Joules MEASURED only | Thermal PINN source term \(Q\) and all energy figures come from the **real NVML exporter** via `szl_joules_truth.py` (120 s freshness); else labeled `sample`/`estimate`. Never fabricated. |
| Λ = Conjecture 1 (advisory) | Every solve routes through the **Λ-gate** (`lambda_gate.py`): ALLOW = "passed SZL admission policy, NOT proven correct"; deny-by-default. |
| Honest bounded error | **Split-conformal** interval (`conformal_interval.py`) + `error_estimate_is_bound: true`; "bounded across tested cases", never "guaranteed". |
| Signed receipt | DSSE/Khipu-ready `feno_receipt.json`; `signature: null` until really signed (never fabricated). |
| locked-proven = 8 · SLSA L1 honest · sovereign own-metal | PINNs add **no** theorem claims; pure-numpy sovereign core; SLSA L1 honest; lutar-lean targets are specs/conjectures, not inflated theorems. |
| cite-never-plagiarize · $/credit = ESTIMATE | All methods adopted from cited papers, clean-room; any cost figure is an ESTIMATE. |

---

## APPENDIX — SZL stack cross-references (internal)

- **FE-NO core / Point-DeepONet:** `feno_szl/szl_feno_core.py`, `feno_szl/szl_point_deeponet.py`, `feno_szl/README.md`, `feno_szl/ATTRIBUTION.md` (clean-room of arXiv:2606.08796 + DeepONet [Lu et al. 2021](https://doi.org/10.1038/s42256-021-00302-5)).
- **Honest UQ / governance:** `feno_szl/innovations/conformal_interval.py`, `feno_szl/innovations/lambda_gate.py`, `feno_szl/innovations/solve_certificate.py`.
- **Joules honesty (energy):** `estate_audit/devO_joules_honesty.md`, `szl_joules_truth.py` (120 s freshness; measured-only).
- **Energy thesis:** `STRANDED_ENERGY_SOVEREIGN_COMPUTE.md` (wasted/stranded only, cited).
- **Doctrine / estate state:** `evolve/STATE_OF_SZL_20260612.md` (locked = 8, Λ = Conjecture 1, Khipu BFT = Conjecture 2, SLSA L1, lutar-lean).

*All external claims cite primary sources (DOI/arXiv) inline. All licenses verified at the upstream repository on 2026-06-14. No Doctrine-v11 floor is crossed in any recommendation.*
