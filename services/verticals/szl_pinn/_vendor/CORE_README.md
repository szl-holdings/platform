# SZL PINN core (`szl_pinn`) — physics-informed ML, energy-first

**Clean-room, SZL-native Physics-Informed Neural Network (PINN) core.** This is
the seed of SZL's physics-ML **energy** capability and a **sibling** of the
clean-room FE-NO operator solver (`platform/services/verticals/szl_mechanics`):
it shares the same provenance-receipt contract, the same honest-error posture,
and the same deny-by-default Λ governance gate.

Pure Python + numpy. No torch/JAX/tensorflow. Sovereign, own-metal, auditable.
Sign-off: **Stephen P. Lutar Jr. <stephenlutar2@gmail.com>**.

---

## The seed physics — 1D heat / diffusion equation

A small MLP `u_θ(x, t)` is trained **not on labelled data** but on the PDE itself:

```
u_t = α · u_xx ,        x ∈ [0, L],  t ∈ [0, T]
IC:  u(x, 0) = sin(kπx/L)
BC:  u(0, t) = u(L, t) = 0          (homogeneous Dirichlet)
```

The training objective is the **physics loss**:

```
physics_loss(θ) = mean_collocation ( u_t − α·u_xx )²       # PDE residual
                + λ_bc · mean_boundary ( u_θ − u_BC )²       # boundary condition
                + λ_ic · mean_initial  ( u_θ − u_IC )²       # initial condition
```

This is the canonical PINN of **Raissi, Perdikaris & Karniadakis (2019)**,
re-derived clean-room from the published method (the PDE-residual loss is
standard public science). For this IC the closed-form solution is
`u(x,t) = exp(−α(kπ/L)²·t)·sin(kπx/L)`, used as ground truth in validation.

### Honest derivatives without a framework

`u_t`, `u_xx` (and the 2D Laplacian `T_xx + T_yy`) are **EXACT analytic**
derivatives of the network, computed by closed-form **forward-mode**
differentiation through the tanh activations (`tanh' = 1 − tanh²`,
`tanh'' = −2·tanh·tanh'`). Parameter gradients of the PDE-residual loss come from
a hand-derived **reverse-over-forward adjoint**, verified to machine precision
(~1e-16) against complex-step differentiation in the test suite. Training uses a
from-scratch Adam optimizer. No finite-difference noise in the operator, no
black-box autodiff.

---

## Energy application — sovereign GPU-die thermal model

`szl_pinn_thermal.py` applies the same machinery to a **2D steady-state heat
equation with a compute-load source** on a GPU/accelerator die `[0,1]²`:

```
α · (T_xx + T_yy) + s(x, y) = 0,   s = Gaussian compute-load hotspots
BC: Dirichlet edge T = T_edge      (heat-spreader reference)
```

The output is a **temperature field** `T(x, y)` and its gradient, framed as
**thermal-aware scheduling input** for SZL's wasted-/stranded-energy harvest
engine: hot regions are scheduling constraints, and dense thermal gradients mark
where stranded heat is worth recovering.

### Joule accounting — MEASURED vs MODELED (read this)

- The temperature field and the source integral are **MODELED design inputs**.
- The **Landauer floor** `k_B · T · ln 2 · (ops/s)` is a **MODELED thermodynamic
  FLOOR** on dissipated power (Landauer 1961), clearly labelled MODELED.
- **Real joules are MEASURED only** by SZL's real power exporter. Nothing in this
  module asserts a measured joule.
- **NO free-energy / over-unity / perpetual-motion.** This MODELS heat; it does
  not create energy. Harvest targets **WASTED / stranded** heat only, bounded by
  ordinary thermodynamics (Carnot) — never above unity.

---

## The MOAT — provenance receipt per solve

Every solve emits an honest in-toto provenance **Statement** (`receipt.py`),
content-addressed by the inputs hash, capturing: method, PDE, α, final
PDE-residual loss, bounded solution-error ESTIMATE, walltime, `verified` flag,
`modeled_not_measured` flag, and full attribution. The schema and signing posture
are **identical to `szl_mechanics/receipt.py`**, so PINN plugs into the same
VERIFIED-SCIENTIFIC-COMPUTE MOAT.

- The statement is **UNSIGNED** (honest). `build_dsse_envelope` produces the
  DSSE envelope skeleton with `signatures: []`. **Signing happens on the
  szl_lake / khipu Ed25519 path** (`_signing` note records exactly where). We
  never fabricate a signature; an unsigned statement is STRUCTURAL-ONLY at the
  a11oy verify-api and never reports a false green.
- The bounded error is wrapped in a **split-conformal interval**
  (`innovations/conformal_interval.py`) whose realized coverage is MEASURED, with
  a `distribution_shift_flag` when off-distribution.
- A deny-by-default **Λ gate** (`innovations/lambda_gate.py`) admits a solve only
  if it converged, the error estimate is under tolerance, and the receipt
  honestly declares MODELED (a free-energy guard DENYs any receipt claiming
  measured energy). **Λ = Conjecture 1 (advisory), never "proven trust".**

---

## Files

| File | What |
|---|---|
| `szl_pinn_core.py` | Pure-numpy `AnalyticMLP` (exact forward-mode `u_x/u_xx/u_t`), heat-equation `HeatProblem` + closed-form reference, PDE-residual loss, reverse-over-forward gradient, Adam, `solve_heat_pinn` → `ProvenanceReceipt`. |
| `szl_pinn_thermal.py` | 2D steady GPU-die thermal PINN with compute-load source; exact analytic Laplacian; MODELED Landauer joule accounting; `solve_chip_thermal`. |
| `receipt.py` | In-toto / DSSE provenance statement + unsigned envelope (sibling of `szl_mechanics/receipt.py`). |
| `core_adapter.py` | Platform-wiring seam (generic `solve(geometry,bcs)` → core; honest STUB when core absent). |
| `innovations/conformal_interval.py` | Split-conformal honest error band (measured coverage). |
| `innovations/lambda_gate.py` | Deny-by-default Λ governance gate + free-energy guard. |
| `szl_pinn_validate.py` | RUNS heat PINN vs analytic + thermal app; writes `pinn_validation.png`, `pinn_receipt.json`, `pinn_thermal_receipt.json`. |
| `tests/test_szl_pinn.py` | Real assertions (8 tests): exact derivatives, gradient-check, convergence, Landauer floor, honest receipt, Λ gate. |
| `ATTRIBUTION.md` | Clean-room provenance + full citations. |

## Run it

```bash
pip install -r requirements.txt
python szl_pinn_core.py        # train the heat PINN (prints residual, rel-L2)
python szl_pinn_thermal.py     # thermal app + MODELED Landauer accounting
python szl_pinn_validate.py    # full validation + figure + receipts
python tests/test_szl_pinn.py  # or: python -m pytest tests/ -q
```

## Measured validation results (really run, not fabricated)

| Metric | Value |
|---|---|
| Heat PINN relative-L2 vs analytic | **~1.1e-02 (1.1%)** — BOUNDED ESTIMATE |
| Heat PINN final PDE-residual loss | **~2.1e-03** (MEASURED) |
| Heat PINN conformal 90% band realized coverage | **~0.90** (MEASURED) |
| Heat PINN `verified` / Λ gate | **True / ALLOW** |
| Thermal app relative residual (RMS resid / RMS source) | **~4.3e-02 (4.3%)** — BOUNDED ESTIMATE |
| Thermal app `verified` | **True** |
| MODELED Landauer floor (1e15 ops/s @ 350 K) | **~3.35e-06 W** — MODELED, not measured |
| Walltime (heat, 2000 epochs) | **~4–5 s** (in-sandbox) |

`pinn_validation.png` shows: heat PINN vs analytic at several times, the physics
loss decay, the GPU-die temperature field, and the steady-balance residual field.

## Honest limits (Doctrine v11)

Λ = Conjecture 1 (advisory, not a theorem); locked-proven = 8 (this is not one);
SLSA L1 honest; Khipu BFT = Conjecture 2; sovereign own-metal-only; **joules
MEASURED-only via real exporter — the PINN field is MODELED, labelled so**; no
free-energy/over-unity; no fabricated numbers; cite-never-plagiarize. A genuine
a-priori PINN convergence theorem is **open**.
