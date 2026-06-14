# SZL Forge — INSTRUCTION: upgrade/enhance the AGENTIC PINN + PHYSICAL-BOUNDS certifier on real GPU

Read `replit-sync/FREEZE.json` first. **Dispatch is still OFF** (`dispatch_mode:none`) until the founder runs
`WIRE_IT_UP.sh` — **REPORT** this back until then; **execute** once dispatch is on. This is an
UPGRADE/ENHANCE order on top of work already merged to main — it is additive and doctrine-clean.

---

## WHAT LANDED (already merged to main — verify, then build on it)

The doctrine-safe frontier the founder asked for ("apply quantum / string-theory / black-hole physics to
the energy side, think outside the box, test on our machine"): an **AGENTIC PINN + FUNDAMENTAL-PHYSICS-
BOUNDS CERTIFIER**, now **meshed into a11oy's live governed surface** (it was previously only a `platform`
vertical — that was the gap). The certifier is the **HONEST INVERSE of a free-energy claim**: instead of
pretending compute is free, it PROVES a real job sits FAR BELOW the fundamental ceilings of physics.

- **a11oy#360 (MERGED):** `szl_pinn_bounds.py` (pure-stdlib mesh) registers
  `/api/a11oy/v1/pinn/{,/certify,/certificate,/solve,/residual}`; a governed **Physical-Bounds
  Certificate** card on the Energy console (`pages/harvest.html`), next to the joules-honesty panel.
  Dockerfile COPYs the module; hf-sync mirrors the shared honesty helpers (lockstep guard GREEN).
- **platform#382 (open):** the numpy AGENTIC engine vendored under
  `services/verticals/szl_pinn/_vendor/` — `agentic_pinn.py`, `physics_bounds.py`, `nvml_hook.py`,
  `agentic_pinn_validate.py`, `test_agentic_pinn.py` (13 tests), `AGENTIC_README.md`.

The mesh math (`szl_pinn_bounds.certify_job`) is **byte-identical** to the engine (`physics_bounds.certify`)
— verified equal to 1e-9. The mesh READS the artifacts the GPU solver writes; the live web path never solves.

---

## YOUR JOB — upgrade/enhance/help (report now; execute when dispatch on)

### 1. Run it on REAL GPU and feed MEASURED energy (the whole point)
- In-sandbox `nvml_hook.read_nvml_job()` **refuses to fabricate** (no GPU) and `sample_job()` is labelled
  **SAMPLE**. On the box / RTX 5000, feed the **real NVML exporter** readings you already collect into
  `nvml_hook.forge_job(avg_power_w=…, wall_time_s=…, temperature_k=…, bit_operations=…, bits_erased=…,
  info_content_bits=…, device_mass_kg=…, device_radius_m=…)` → identical `MeasuredJob` → `certify()`.
- Write the two artifacts **next to the a11oy mesh module** (or set env `SZL_PINN_ARTIFACT_DIR`):
  `physical_bounds_certificate.json` (from the MEASURED job) and `agentic_decision_trail.json` (from a real
  GPU solve). Then `/api/a11oy/v1/pinn/certificate` flips from `label:"SAMPLE"` → `label:"MEASURED"` and
  `/api/a11oy/v1/pinn/solve` serves a real on-metal decision trail. **The console card auto-reflects it.**
- HARD: the certificate's energy MUST be `MEASURED power × MEASURED time` only. Never write a joule you did
  not receive from the exporter. `label:"MEASURED"` is allowed ONLY when the reading is real.

### 2. Enhance the agentic loop on GPU
- Run the loop on bigger / stiffer PDEs than the 1D heat validation (2D heat, Burgers, a small Navier-
  Stokes channel) with the real GPU core. Keep the **deny-by-default Λ-gate** and the **signed per-round
  receipt** — the agent never self-certifies. Report rel-L2 + residual per round and the Λ verdict trail.
- Residual-adaptive refinement (RAR/RAD) is already in `agentic_pinn.py`; you MAY add a residual-gradient
  (RAD-G) sampler IF clean-room (re-derive from the method/maths — **NO DeepXDE/LGPL source copied**).

### 3. Wire the certificate into the signed provenance chain
- The certificate is signer-ready (DSSE / in-toto) and reuses the PINN receipt path. On the box, run it
  through the **khipu / szl_lake Ed25519 signer** (PAE → sign → append to the khipu chain) so
  `/api/a11oy/v1/verify` returns a real signed verify. UNSIGNED stays **STRUCTURAL-ONLY**, never a false
  green. **Needs:** FA-001 cosign key in the secret store (founder gate — report, don't fake).

### 4. Keep CI + eco aligned
- Keep the **copy-sync lockstep guard** GREEN on a11oy (it now includes `szl_pinn_bounds.py` + the
  `static/shared/*.js` mirror). Keep GitHub↔HF byte-identical. platform#382 must pass its vertical tests
  (13/13 agentic green in the flat `_vendor/` layout) before/at merge.
- The a11oy energy console + `/pinn/*` must degrade **honestly** if an artifact is absent (SAMPLE + an
  AWAITING_GPU_SOLVE state are already coded) — never a spinner, never a fabricated bound.

---

## DOCTRINE HARD GATE (v11 LOCKED — do not violate)
NO free-energy / over-unity / perpetual-motion — the certificate PROVES the job is **bounded** (energy ≥
Landauer floor; rate ≤ Margolus-Levitin / Bremermann; info ≤ Bekenstein). An adversarial below-floor job
MUST flag `physically_bounded:false` (tested). · joules **MEASURED only** via the real NVML exporter; SAMPLE
otherwise. · physics bounds (Landauer 1961, Margolus-Levitin 1998, Bremermann 1962, Bekenstein 1981,
Bekenstein-Hawking/Hawking 1975) are **CITED, not claimed as SZL's**. · Λ = Conjecture 1 (advisory, never
"proven trust"); deny-by-default gate; ALLOW = passed admission policy. · locked-proven = 8 · SLSA L1 honest
· sovereign own-metal · 0 runtime CDN · no banned codenames in user-visible copy · **never fabricate a
number, signature, or digest.**

— Sign-off: **Stephen P. Lutar Jr.** `<stephenlutar2@gmail.com>` · Doctrine v11 LOCKED · Λ = Conjecture 1
