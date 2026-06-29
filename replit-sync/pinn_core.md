# SZL PINN core (energy) — clean-room build COMPLETE & RUNNABLE

**Status:** COMPLETE, RUNS, CONVERGES, tests pass. Built in
`/home/user/workspace/pinn_szl/`. Not pushed to any repo (a later step wires it
into the platform via `core_adapter.py`). Clean-room, sovereign, honest per
Doctrine v11. Sign-off: **Stephen P. Lutar Jr. <stephenlutar2@gmail.com>**.

The research report `estate_audit/pinn_research.md` was **absent** throughout the
build (polled at start and after core), so I built to the task spec. The
implementation tracks the canonical PINN method (Raissi/Perdikaris/Karniadakis
2019) and is ready to be re-checked against that report when it lands — the math
(PDE-residual loss, BC/IC penalties on collocation points) is standard and stable.

This is the **founder's seed** (the heat equation `u_t = α·u_xx` baked into a
`physics_loss`) made SZL-native, and it evolves SZL's ENERGY side as a **sibling**
of the FE-NO operator solver (`szl_mechanics`).

---

## What I built

| File | What |
|---|---|
| `szl_pinn_core.py` (539 ln) | Pure-numpy `AnalyticMLP` (tanh) with **EXACT analytic** `u_x, u_xx, u_t` via closed-form forward-mode; `HeatProblem` (1D heat + closed-form reference); PDE-residual + BC + IC `physics_loss`; **hand-derived reverse-over-forward** parameter gradient (verified to 1e-16 vs complex-step); from-scratch Adam; `solve_heat_pinn` → `ProvenanceReceipt`. |
| `szl_pinn_thermal.py` (380 ln) | 2D **steady-state GPU-die** heat PINN `α(T_xx+T_yy)+s=0` with Gaussian **compute-load** source; exact analytic Laplacian; **MODELED Landauer** joule accounting; thermal-aware-scheduling framing; `solve_chip_thermal`. |
| `receipt.py` (184 ln) | in-toto / DSSE provenance Statement + **UNSIGNED** envelope skeleton — **same schema/posture as `szl_mechanics/receipt.py`**. |
| `core_adapter.py` (143 ln) | Platform-wiring seam: generic `solve(geometry,bcs)` → core; **honest STUB** (verified=False, stub=True) when core absent. Mirrors `szl_mechanics/core_adapter.py`. |
| `innovations/conformal_interval.py` | Split-conformal honest error band (MEASURED coverage + `distribution_shift_flag`). |
| `innovations/lambda_gate.py` | Deny-by-default Λ gate + **free-energy guard** (DENYs any receipt claiming measured energy). |
| `szl_pinn_validate.py` (191 ln) | RUNS both solves; writes `pinn_validation.png`, `pinn_receipt.json`, `pinn_thermal_receipt.json`. |
| `tests/test_szl_pinn.py` | **8 real assertions** — all PASS. |
| `README.md`, `ATTRIBUTION.md`, `requirements.txt`, `__init__.py` | Math, honest limits, full citations, clean-room statement. |

### Honest derivatives without a framework
`u_t`, `u_xx`, and the 2D Laplacian are **exact closed-form** forward-mode
derivatives of the tanh MLP (no finite-difference noise, no torch/JAX). The
PDE-residual loss is differentiated w.r.t. parameters by a **hand-derived
reverse-over-forward adjoint**, gradient-checked to ~1e-16 against complex-step
(`test_pde_gradient_matches_complex_step`). This makes the PINN both honest and
fast: the heat solve is ~4–5 s for 2000 epochs in-sandbox.

---

## Validation numbers (MEASURED at runtime — none fabricated)

`python szl_pinn_validate.py` →

| Metric | Value |
|---|---|
| **Heat PINN relative-L2 vs analytic** | **1.139e-02 (1.1%)** — BOUNDED ESTIMATE |
| Heat PINN final PDE-residual loss | **2.146e-03** (MEASURED) |
| Heat PINN BC / IC loss | 1.45e-05 / 1.06e-05 |
| Heat PINN conformal 90% band realized coverage | **0.9025** (MEASURED) |
| Heat PINN `verified` / Λ-gate verdict | **True / ALLOW** |
| Heat PINN walltime (2000 epochs) | ~4.3 s |
| **Thermal app relative residual** (RMS resid / RMS source) | **4.283e-02 (4.3%)** — BOUNDED ESTIMATE |
| Thermal app `verified` | **True** |
| Thermal app peak MODELED T | 0.2633 (relative units) |
| MODELED Landauer floor (1e15 ops/s @ 350 K) | **3.349e-06 W** — MODELED, not measured |
| **Tests** | **8/8 PASS** |

**Figure:** `/home/user/workspace/pinn_szl/pinn_validation.png` — 4 panels:
(1) heat PINN `u(x,t)` overlaying the analytic solution (dashed) at t=0,0.1,0.3,0.6;
(2) physics-loss decay over training (total / PDE-residual / BC / IC, log scale,
dropping ~3.5 orders);
(3) GPU-die temperature field `T(x,y)` with compute-load hotspots marked;
(4) `|steady heat-balance residual|` field (largest near the sharpest hotspot —
the honest hard region).

---

## Provenance receipt schema (MOAT) — sibling of `szl_mechanics`

Matched to `platform/services/verticals/szl_mechanics/receipt.py`: same in-toto
Statement v1, same `predicateType`, same UNSIGNED/DSSE posture, same
`_signing` note. PINN is therefore a drop-in sibling under the
VERIFIED-SCIENTIFIC-COMPUTE MOAT.

```jsonc
{
  "_type": "https://in-toto.io/Statement/v1",
  "predicateType": "https://szlholdings.com/attestations/scientific-compute/v1",
  "subject": [{ "name": "szl-pinn/solve/<digest12>",
                "digest": { "sha256": "<inputs_hash>" } }],
  "predicate": {
    "method": "szl_pinn (physics-informed NN, PDE-residual loss; 1D heat u_t=alpha*u_xx)",
    "pde": "u_t = alpha*u_xx",
    "alpha": 0.4,
    "inputs_hash": "sha256:...",               // canonical problem+solver settings
    "epochs": 2000,
    "converged": true,
    "physics_residual_loss": 2.146e-03,         // MEASURED final PDE residual
    "bc_loss": 1.45e-05,
    "ic_loss": 1.06e-05,
    "solution_error_estimate": 1.139e-02,       // BOUNDED ESTIMATE (rel-L2 vs analytic)
    "bounded_error_label": "ESTIMATE",          // NEVER a proven bound
    "error_estimate_is_bound": true,
    "error_estimate_scope": "rel-L2 vs closed-form on tested (alpha,IC,domain) family ...",
    "walltime_s": 4.28,
    "verified": true,                           // converged AND estimate<=tol (RUNTIME check)
    "verified_note": "... NOT a cryptographic attestation, NOT one of locked-proven=8",
    "modeled_not_measured": true,               // ALWAYS true — PINN output is MODELED
    "modeled_note": "... joules MEASURED only via real exporter; no free-energy",
    "sovereign": true,
    "stub": false,
    "attribution": { "pinn_method": "Raissi/Perdikaris/Karniadakis 2019 ...",
                     "prior_art_not_copied": "DeepXDE / NVIDIA Modulus ...",
                     "implementation": "clean-room pure-numpy ...",
                     "license_note": "standard public science; method only" },
    "doctrine": "v11 LOCKED; Lambda=Conjecture 1; locked-proven=8; SLSA L1; ...",
    // validation harness also attaches:
    "measured_relative_L2_error": 1.139e-02,
    "conformal_band": { "alpha":0.1, "q_hat":..., "realized_coverage":0.9025,
                        "distribution_shift_flag": false },
    "lambda_gate": { "verdict":"ALLOW", "advisory":false, ... }
  },
  "_signing": { "status": "UNSIGNED",
                "signed_by": "szl_lake / khipu-consensus DSSE signer (Ed25519)",
                "signing_path": "canonicalise -> PAE -> Ed25519 -> envelope.signatures[] -> khipu chain",
                "verify_path": "POST https://a-11-oy.com/api/a11oy/v1/verify",
                "consensus": "Khipu BFT = Conjecture 2 (advisory); SLSA L1 (honest)." }
}
```

DSSE envelope: `{ payloadType, payload: b64(canonical statement w/o _signing),
signatures: [] }`. **`signatures` is empty by design** — signing happens on the
szl_lake / khipu Ed25519 path; we never fabricate a signature. For the 2D thermal
solve the predicate additionally carries `joule_accounting` (MODELED, labelled).

The thermal receipt differs only in `method`, `pde`
(`alpha*(T_xx+T_yy)+s(x,y)=0`), `ic_loss=0` (steady state), and a
`solution_error_estimate` that is the **relative residual** (no closed form for a
multi-hotspot field — the scale-free residual is the honest in-sample error).

---

## Energy-evolution note (how this grows SZL's ENERGY side)

- **What it adds.** SZL now has a clean-room **physics-ML solver pair**: the
  **FE-NO operator solver** (`szl_mechanics`, solid mechanics) and this **PINN
  core** (`szl_pinn`, heat/diffusion → energy). They share one provenance-receipt
  contract, so a "scientific-compute" surface can route either capability and
  verify both the same way.
- **The energy use-case.** The 2D thermal PINN turns a GPU/accelerator die's
  compute load into a **MODELED temperature field** + gradient. That field is a
  **thermal-aware scheduling** input for the wasted-/stranded-energy harvest
  engine: which dies/regions run hot, and where stranded heat is dense enough to
  be worth recovering. It is a *planning/modeling* layer, not a power source.
- **Honesty boundary (load-bearing).** The PINN MODELS heat; it does **NOT**
  create or measure energy. The **Landauer floor** (`k_B·T·ln2·ops/s`) is a
  MODELED thermodynamic floor, cited to Landauer 1961 (which SZL already cites),
  and is labelled **MODELED vs MEASURED** everywhere. **Real joules are MEASURED
  only via the real exporter.** No free-energy / over-unity / perpetual-motion;
  harvest is **WASTED/stranded** heat only, bounded by ordinary thermodynamics.
  The Λ gate enforces this with an explicit **free-energy guard** that DENYs any
  receipt claiming measured (rather than modeled) energy.
- **Next steps (for the wiring step).** Vendor `szl_pinn_core.py` /
  `szl_pinn_thermal.py` under a platform vertical (e.g. `szl_thermal`) and flip
  `core_adapter.CORE_AVAILABLE`; feed the receipt into the szl_lake / khipu DSSE
  signer (currently UNSIGNED, signer-ready); connect the thermal field's gradient
  to the harvest-engine scheduler as an advisory input (gated by Λ); optionally
  extend to **transient** 2D (add `t`) and to inverse problems (infer `α` from
  sparse sensor data — the PINN form supports it directly).

---

## Doctrine v11 — hard rules held

- **NO free-energy/over-unity/perpetual-motion** — PINN MODELS heat; harvest =
  WASTED/stranded only; Λ free-energy guard in the gate.
- **Λ = Conjecture 1 (advisory)** — error is a BOUNDED ESTIMATE over tested
  inputs, never a proven a-priori bound; a-priori PINN convergence is OPEN.
- **locked-proven = 8** — `verified` is an honest RUNTIME check (converged AND
  estimate ≤ tol), explicitly NOT one of the 8 and NOT a crypto attestation.
- **SLSA L1 honest; sovereign own-metal** — pure numpy, no heavy framework.
- **joules MEASURED-only** — PINN output is MODELED, labelled so; never asserted
  as measured joules.
- **never fabricate numbers** — every metric above is produced by a real run.
- **cite-never-plagiarize** — method cited (Raissi et al. 2019); DeepXDE / NVIDIA
  Modulus acknowledged as PRIOR ART, **NOT copied**; no paid product code copied.
- **no banned codenames** (amaru/sentra/rosie/jarvis); szl-router stays PRIVATE.
- **UNSIGNED honest** — signatures empty; signing pointer recorded, never faked.

## Artifacts (all in `/home/user/workspace/pinn_szl/`)
- `pinn_validation.png` — 4-panel validation figure
- `pinn_receipt.json` — heat-PINN statement + UNSIGNED DSSE envelope
- `pinn_thermal_receipt.json` — thermal-app statement (+ MODELED joule accounting)
- code + tests + README + ATTRIBUTION + requirements
