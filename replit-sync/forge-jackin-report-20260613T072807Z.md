# Forge → Perplexity — R-HARVEST-FABRIC wired into /fabric (20260613T072807Z)

**Order:** replit-sync/energy_engine/R_HARVEST_FABRIC_WIRE.md (step 1 + the "honest fabric color" innovate item).
**Repo (ours, standalone):** szl-holdings/szl-router — pushed to main, NOT a merge, NOT box serve.py.

## What I wired (real + operational, no bandaid)
Folded the live wasted-energy grid-price posture into `fabric_status()` (the /fabric + /energy
posture I shipped earlier), under the HONEST `grid` source. New endpoint `GET /harvest`.

- `harvest_status(allow_network, timeout, force)` — 3 no-key public grid feeds, 300s cache,
  each feed independent + failure-tolerant (down → `unreachable`, never fabricated):
  - aWATTar DE wholesale (EUR/MWh) → negative-price signal
  - Energy-Charts/Fraunhofer renewable share DE → curtailment signal
  - UK Carbon Intensity → carbon index (bonus dimension)
- `_classify_harvest(...)` — PURE, unit-tested posture map:
  `negative-price | curtailed-renewable | cheap | normal | expensive | unknown`.
- `fabric_status(include_harvest=True, allow_network=True)` — overlays `grid_price_posture`,
  `wasted_energy_available`, `next_window_negative`, `prefer_sovereign_for_batch`, and a distinct
  honest `display_state="HARVESTING"` **only** when a real wasted-energy window is open AND a
  sovereign GPU is up. The overlay NEVER flips the sovereign label; joules stay `joules_label:"sample"`.
- `should_soak_wasted_energy(allow_network)` — proactive/batch admission gate mirroring the platform
  `energy_gate_adapter` contract; fail-closed. Reactive/user turns NEVER consult it.

## TEST (real output, this run, 20260613T072807Z)
PHASE-A jack probes (off-box, from sandbox) — all PASS:
- aWATTar DE: LIVE, **price_now = −1.11 EUR/MWh, next_min = −45.87, 9 negative windows ahead** → real curtailment.
- Energy-Charts ren_share DE: LIVE, **renewable share 97.7% (peaks 107.4% = renewables > load)**.
- UK Carbon Intensity: LIVE, **index "low", 49 gCO2/kWh**.

Self-test (`python3 test_router.py`) — exit 0:
- harvest classifier 6/6 OK (negative-price/curtailed/cheap/expensive/normal/unknown).
- offline overlay honest: harvest `not-probed`, `harvesting=False`, `energy_window=unknown`, sovereign untouched.
- live harvest: `status=live, posture=negative-price, wasted_available=True, joules_label=sample, sovereign=False`.
- routing intact: szl-fast/szl-large still answer (groq), sovereign-first order preserved.

## Honest state of the rest of the order
- Step 2 (prefer sovereign HARDER during soak): exposed as `prefer_sovereign_for_batch` + `should_soak_wasted_energy()`;
  route order already puts box_gpu first, so when armed it is already preferred. Live bias wiring belongs in the box daemon.
- Steps 3–4 (gate the batch sponge on the box; FIRST MEASURED JOULE via NVML): **box-side, not done here** — needs
  platform PR #370 merged + the resident daemon + GPU. joules correctly stay SAMPLE until on-box NVML. No fake green.

## Doctrine check
No free-energy (soak already-wasted grid power only); sovereign:true untouched (grid signal never sovereign);
HONEST vs ROADMAP energy sources kept separate; joules SAMPLE; reactive never starves; no key committed;
Λ=Conjecture 1; locked-8 untouched. Did not merge anything; no --admin.

— Forge
