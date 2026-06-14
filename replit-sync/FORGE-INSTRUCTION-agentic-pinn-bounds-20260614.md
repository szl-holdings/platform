# ⚡ EXECUTION TARGET LOCKED (re-pinned 2026-06-14 02:30 EDT) — read this header first

**STATUS NOW (verified live this minute, not reported — actually probed):**
- ✅ The `/api/a11oy/v1/pinn/*` mesh is **LIVE on the HF Space** `szlholdings-a11oy.hf.space`
  (certificate/solve/residual/index all 200; SAMPLE certificate, physically_bounded=true,
  2.09e10× above Landauer). The harvest console bounds card is live there too.
- ⚠️ **`a11oy.net` (the box, nginx @ 167.233.50.75) is serving a STALE build** — `/pinn/*` is 404 there
  while older routes are 200. The box never pulled latest `main` + restarted. THIS is the real backlog
  symptom of `dispatch_mode:none`: merged → HF auto-mirrors → but the BOX deploy step is the part that
  needs dispatch, so it gets reported, not executed.

**TWO concrete execution steps (do the moment dispatch is on — or a human runs step A once):**

### A. UN-STALE THE BOX (highest priority — closes the visible gap)
On 167.233.50.75, pull latest main and restart the a11oy service so the box matches HF:
```bash
cd /opt/a11oy && git fetch --all && git reset --hard origin/main \
  && (docker compose up -d --build a11oy 2>/dev/null || sudo systemctl restart a11oy.service) \
  && sleep 6 && curl -s -o /dev/null -w 'box /pinn after redeploy: %{http_code}\n' http://127.0.0.1:8081/api/a11oy/v1/pinn/certificate
# adjust /opt/a11oy + service/compose name to this box's actual layout
```
Expected after: `a11oy.net/api/a11oy/v1/pinn/certificate` → 200 (matches HF).

### B. RUN THE AGENTIC PINN ON THE LIVE SOVEREIGN GPU — node **`rtx-betterwithage`**
The compute-pool probe shows ONE GPU reachable and sovereign: **`rtx-betterwithage`**
(`http://100.125.77.31:11434`, kind=sovereign-gpu, reachable=true). chaski (100.76.58.50) is still OFF —
do NOT block on it; run on `rtx-betterwithage`. Steps:
```bash
cd /opt/a11oy   # repo root that holds the vendored engine (or platform/services/verticals/szl_pinn/_vendor)
# 1) MEASURED energy from the real NVML exporter (NOT sample). Feed the readings you already collect:
python3 - <<'PY'
import json, services.verticals.szl_pinn._vendor.nvml_hook as nh
import services.verticals.szl_pinn._vendor.physics_bounds as pb
import services.verticals.szl_pinn._vendor.agentic_pinn as ap
job = nh.read_nvml_job()                  # refuses to fabricate; real GPU power×time
cert = pb.certify(job)                     # label MUST be MEASURED only if reading is real
res  = ap.AgenticPINN(cfg=ap.AgenticConfig(seed=0)).run(verbose=False)
open('physical_bounds_certificate.json','w').write(json.dumps(cert.to_dict(), indent=2))
open('agentic_decision_trail.json','w').write(json.dumps(res.to_dict(), indent=2))
print('wrote MEASURED certificate + decision trail; bounded=', cert.physically_bounded)
PY
# 2) place both JSON next to szl_pinn_bounds.py (or export SZL_PINN_ARTIFACT_DIR) so the mesh serves them
# 3) restart a11oy -> /api/a11oy/v1/pinn/certificate flips label SAMPLE -> MEASURED on BOTH box + HF
# 4) sign through the khipu/szl_lake Ed25519 DSSE path -> /api/a11oy/v1/verify returns a real signed verify
```
HARD: energy = MEASURED power × MEASURED time only. `label:"MEASURED"` ONLY when the NVML reading is real.
Keep the deny-by-default Λ-gate + signed per-round receipt. Honest inverse of free-energy — never over-unity.

---
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
