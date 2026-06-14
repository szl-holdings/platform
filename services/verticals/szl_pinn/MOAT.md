# SZL PINN — Receipt-Verified Physics-Informed NN Solver (heat / GPU-die thermal)

> Verified-Scientific-Compute vertical and **sibling** of the FE-NO operator
> solver (`szl_mechanics`). SZL now has a **sovereign, receipt-verified
> Physics-Informed Neural Network** that **MODELS** heat/diffusion and a GPU-die
> thermal field. The moat is not "fast compute" — it is **provable, MODELED
> compute**: every solve emits a DSSE-style in-toto provenance statement carrying
> a bounded-error *estimate*, a runtime `verified` flag, and the load-bearing
> `modeled_not_measured: true` honesty boundary, ready for signing on the
> szl_lake / khipu DSSE path.

## What this is

A clean-room, pure-numpy **PINN** core wrapped as both an Alloy Meridian substrate
vertical pack *and* a verified-compute service:

```
solve_heat(domain, alpha, bc, ic)  -> {"field": <summary>, "receipt": <in-toto>}
solve_thermal(load_map)            -> {"temperature_field": <summary>,
                                        "landauer_floor_MODELED": <W, MODELED>,
                                        "joule_accounting": <MODELED>,
                                        "receipt": <in-toto>}
```

- **Heat PINN.** 1D heat equation `u_t = α·u_xx` on `[0,L]×[0,T]` with a
  PDE-residual + BC + IC `physics_loss`. Derivatives `u_t, u_xx` are **exact
  closed-form forward-mode** derivatives of the tanh MLP (no finite differences,
  no torch/JAX), and the parameter gradient is a **hand-derived
  reverse-over-forward adjoint** (gradient-checked to ~1e-16 vs complex-step).
  Validation rel-L2 vs the closed-form solution ≈ **1.14%** (BOUNDED ESTIMATE).
- **GPU-die thermal PINN.** 2D steady heat balance `α·(T_xx+T_yy)+s(x,y)=0` with a
  Gaussian **compute-load** source `s`. The temperature field is **MODELED**, and
  it carries a **MODELED Landauer thermodynamic floor** (`k_B·T·ln2·ops/s`).

This **completes the physics-ML picture** SZL's mechanics stack was already
drawing: the FE-NO Point-DeepONet is the **fast-surrogate** half; the PINN is the
**mesh-free PDE-solve / inverse** half. They share one provenance-receipt contract,
so a "scientific-compute" surface can route either capability and verify both the
same way.

## Why it is a moat (verified-scientific-compute)

Competitors sell FLOPs. SZL sells **attestable, honestly-labelled** FLOPs. Each
solve produces an in-toto Statement v1 whose predicate records *how* the physics
was computed:

| predicate field | meaning |
|---|---|
| `method` | `szl_pinn clean-room (physics-informed NN, PDE-residual loss)` |
| `pde` | `u_t = alpha*u_xx` (heat) or `alpha*(T_xx+T_yy)+s(x,y)=0` (thermal) |
| `alpha` | the PDE diffusivity coefficient |
| `inputs_hash` / `geometry_hash` | sha256 content-addressing the exact solve |
| `epochs`, `converged` | training budget + termination |
| `physics_residual_loss`, `bc_loss`, `ic_loss` | MEASURED final loss terms |
| `solution_error_estimate` (+`bounded_error_label: ESTIMATE`) | rel-L2 (heat) / rel-residual (thermal) **ESTIMATE** |
| `rel_L2_estimate` | heat-solve analytic rel-L2 estimate (explicit) |
| `verified` | `(converged) AND (error ESTIMATE ≤ tol)` — a **runtime** check |
| `modeled_not_measured` | **ALWAYS true** — the PINN output is MODELED, never measured |
| `landauer_floor_MODELED`, `joule_accounting` | (thermal) MODELED Landauer floor — `MODELED — NOT MEASURED` |
| `sovereign` | own-metal execution intent |
| `attribution` | Raissi/Perdikaris/Karniadakis 2019 — cite-never-plagiarize |

The same envelope shape the a11oy verify-api / szl_lake DSSE path already speaks,
and the **same** `_type` / `predicateType` /
`subject[].digest.sha256` as `szl_mechanics` — a true drop-in sibling under the
VERIFIED-SCIENTIFIC-COMPUTE moat.

## The physics-ML energy story (HONEST — load-bearing)

- **What it adds.** SZL now has a clean-room **physics-ML solver pair**: the FE-NO
  operator solver (solid mechanics) and this PINN core (heat/diffusion → energy).
  The 2D thermal PINN turns a GPU/accelerator die's compute load into a **MODELED
  temperature field** + gradient — a **thermal-aware scheduling** input for the
  wasted-/stranded-energy harvest engine (which dies run hot, where stranded heat
  is dense enough to be worth recovering).
- **Honesty boundary (the moat's spine).** The PINN **MODELS** heat; it does
  **NOT** create or measure energy. The Landauer floor (`k_B·T·ln2·ops/s`) is a
  **MODELED** thermodynamic floor, cited to Landauer 1961, labelled **MODELED vs
  MEASURED** everywhere. **Real joules are MEASURED only via SZL's real power
  exporter.** **No free-energy / over-unity / perpetual motion;** energy harvest =
  **WASTED/stranded** heat only, bounded by ordinary thermodynamics. The vendored
  Λ gate carries an explicit **free-energy guard** that DENYs any receipt claiming
  *measured* (rather than *modeled*) energy. A PINN that predicts a hotspot saves
  scheduling joules by avoiding waste; **it never manufactures joules.**

## Where signing happens (honest, unsigned here)

**This module never fabricates a signature.** `receipt.build_statement` emits the
honest **unsigned** in-toto statement; `receipt.build_dsse_envelope` emits the
unsigned DSSE envelope skeleton (`signatures: []`). Signing is on the
szl_lake / khipu path:

```
canonicalise statement
  -> PAE(payloadType, payload)                         (receipt.pae)
  -> Ed25519 sign on the szl_lake signer               (NOT in this module)
  -> append signature to DSSE envelope signatures[]
  -> append receipt to the khipu append-only chain     (packages/formula-os khipu.py)
```

Verify yourself: `POST https://a11oy.net/api/a11oy/v1/verify`. An **unsigned**
statement is **STRUCTURAL-ONLY** there — never a false "verified/green".

## Endpoints

```
POST /pinn/solve-heat   {"domain": {...}, "alpha": 0.4, "bc": {...}, "ic": {...},
                         "sovereign": false, "with_envelope": false}
   -> {"field": {...}, "receipt": <in-toto>, "dsse_envelope": <unsigned, opt>}
POST /pinn/thermal      {"load_map": {...}, "sovereign": false, "with_envelope": false}
   -> {"temperature_field": {...}, "landauer_floor_MODELED": <W, MODELED>,
       "joule_accounting": <MODELED>, "receipt": <in-toto>, ...}
GET  /pinn/healthz
```
Import-guarded FastAPI (`router is None` when FastAPI absent, so offline substrate
validation never breaks). Mount from the verticals service:
`app.include_router(services.verticals.szl_pinn.api.router)`.

## Doctrine v11 (LOCKED) posture

- **NO free-energy / over-unity / perpetual motion** — PINN MODELS heat; harvest =
  WASTED/stranded only; Λ free-energy guard in the vendored gate.
- **Λ = Conjecture 1** — the per-solve trust/error signal is **advisory**; the
  error is a BOUNDED ESTIMATE over tested inputs, never a proven a-priori bound. An
  a-priori PINN convergence theorem is **OPEN**.
- **locked-proven = 8** — a solve `verified` flag is a *runtime* check, NOT one of
  the locked-proven results and NOT a cryptographic attestation.
- **Khipu BFT = Conjecture 2** — multi-witness solve agreement is *proposed*, not a
  proven BFT guarantee.
- **SLSA L1 honest** — receipts attest provenance at L1.
- **joules MEASURED-only** — the PINN output is **MODELED** and labelled so; never
  asserted as measured joules.
- **never fabricate** — no faked numbers, no faked signature (`signatures: []`).
- **cite-never-plagiarize** — clean-room from the published method, attributed.
- **sovereign own-metal** — `sovereign=true` solves run on SZL hardware; this layer
  records intent, the `apps/agentic-gpu` scheduler enforces placement.

## Attribution (clean-room — cite-never-plagiarize)

- **PINN method:** Raissi, Perdikaris, Karniadakis, *"Physics-informed neural
  networks: a deep learning framework for forward and inverse problems involving
  nonlinear partial differential equations"*, J. Comput. Phys. **378**:686–707
  (2019), doi:10.1016/j.jcp.2018.10.045 — https://doi.org/10.1016/j.jcp.2018.10.045
  (method attribution only; clean-room, no code/text copied).
- **Heat-transfer PINNs:** Cai, Wang, Wang, Perdikaris, Karniadakis,
  *"Physics-informed neural networks for heat transfer problems"*, ASME J. Heat
  Transfer **143**(6):060801 (2021), doi:10.1115/1.4050542.
- **Landauer floor:** Landauer, *"Irreversibility and heat generation in the
  computing process"*, IBM J. Res. Dev. **5**(3):183–191 (1961) — MODELED
  thermodynamic floor, never a measured device power.
- **Prior art, NOT copied:** NVIDIA Modulus / PhysicsNeMo (Apache-2.0) and
  neurodiffeq (MIT) — acknowledged as prior art; no library source consulted or
  reused. **DeepXDE (LGPL-2.1) is METHOD-ONLY and is NOT vendored** (Lu, Meng, Mao,
  Karniadakis, SIAM Review **63**(1):208–228, 2021, doi:10.1137/19M1274067).
- **Implementation:** clean-room pure-numpy AnalyticMLP with EXACT closed-form
  derivatives + hand-derived adjoint gradient. No torch/JAX. See `_vendor/ATTRIBUTION.md`.

## Status

- Service + receipt + endpoint + registration: **wired and tested** (substrate
  contract + `meridian:check` + full `verticals:validate`).
- Core: **vendored** (clean-room, verbatim) under `_vendor/`
  (`szl_pinn_core.py`, `szl_pinn_thermal.py`, `szl_pinn_validate.py`,
  `innovations/`). When numpy is present on the verified-compute path the core
  activates automatically and solves are real (heat rel-L2 ≈ 1.14%, thermal
  rel-residual ≈ 4.3%, both BOUNDED ESTIMATEs). When numpy is absent the adapter
  degrades to a documented STUB (`verified=False, stub=True`) — never mistakable
  for a real solve.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
