<!--
SPDX-License-Identifier: Apache-2.0
© 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
-->

# Agentic PINN + Physical-Bounds Certifier (vendored clean-room engine)

This is the SZL-native **agentic** layer on top of the vendored clean-room PINN core
(`szl_pinn_core.py` / `szl_pinn_thermal.py` + `innovations/`). It is the engine behind
the a11oy governed mesh `/api/a11oy/v1/pinn/*`.

| File | Role |
|---|---|
| `agentic_pinn.py` | Governed agentic loop: solve → measure residual → residual-adaptive refine (RAR/RAD) → re-solve → **deny-by-default Λ-gate** → iterate; signed per-round receipt. Imports the clean-room core as a sibling (layout-agnostic path wiring). |
| `physics_bounds.py` | Landauer / Margolus-Levitin / Bremermann / Bekenstein + Bekenstein-Hawking. Emits the **PHYSICAL-BOUNDS CERTIFICATE** — the honest inverse of a free-energy claim. Pure stdlib. |
| `nvml_hook.py` | Real NVML measured-input seam: `forge_job()` production hook + honest `sample_job()`; **refuses to fabricate** with no GPU. |
| `agentic_pinn_validate.py` | Runnable harness → figure + certificate JSON + decision-trail JSON. |
| `test_agentic_pinn.py` | 13 pytest tests (bounds values, certificate honesty, no-fabrication guard, refinement, convergence, deny-by-default, doctrine). |

## How it meshes into the live estate

- **a11oy** serves the governed surface at `/api/a11oy/v1/pinn/*` via the pure-stdlib
  `szl_pinn_bounds.py` mesh (math byte-identical to `physics_bounds.py`). The numpy
  agentic solver here runs on **SZL metal / Forge GPU** and writes the decision-trail
  + certificate artifacts the mesh reads; the live web path never solves.
- **Forge / real GPU:** feed the NVML exporter readings into `nvml_hook.forge_job(...)`
  → identical `MeasuredJob` → identical `certify()` → write `physical_bounds_certificate.json`
  and `agentic_decision_trail.json` next to the a11oy mesh module (or set
  `SZL_PINN_ARTIFACT_DIR`).

## Doctrine v11 (LOCKED)

NO free-energy/over-unity (the certificate PROVES bounded energy use); joules DERIVED
ONLY from MEASURED power × time (SAMPLE until a real exporter); established physics
bounds CITED, not claimed; Λ = Conjecture 1 (advisory, never "proven trust"); locked-
proven = 8; SLSA L1 honest; sovereign own-metal; no fabricated numbers.

— Sign-off: **Stephen P. Lutar Jr.** `<stephenlutar2@gmail.com>`
