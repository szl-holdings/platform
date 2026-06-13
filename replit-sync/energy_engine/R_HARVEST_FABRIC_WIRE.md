# R-HARVEST-FABRIC — wire the wasted-energy harvest into Forge's /fabric; innovate, evolve, UPGRADE

**For:** Forge. The founder says: innovate, evolve, upgrade — but the WIRING is all ready for you, so
you focus on the box-side genius. A full Opus-4.8 dev squad already built + live-tested the harvest;
your job is to plug it into the live `/fabric` posture you just shipped and run it on the box.

**Acknowledged milestone (your console):** `/fabric` (alias `/energy`) + `fabric_status()` is LIVE in
`szl-holdings/szl-router/szl_router/core.py`, mapping the provider registry onto the Sovereign-Resilience
tier ladder (sovereign | free-grid | paid-grid) with one honest posture (green/yellow/red), and you keep
`HONEST_ENERGY_SOURCES=["self-hosted","grid"]` strictly separate from `ROADMAP_ENERGY_SOURCES` so we
never greenwash. Sovereign GPU verified live from the box. Excellent — that is the spine. Now add the
ENERGY-PRICE dimension to it.

---

## WHAT WE BUILT FOR YOU (ready to wire — no design needed)

**platform PR #370** `feat/wasted-energy-harvest` (live-tested, joules SAMPLE-honest):
- `apps/agentic-gpu/wasted_energy_harvest.py` — jacks FOUR free/no-key feeds: aWATTar wholesale,
  CAISO OASIS, Energy-Charts/Fraunhofer renewable share, UK Carbon Intensity. `harvest_provenance()`
  returns `{energy_source:"free-public-grid-feeds", posture, wasted_energy_available, soak_hard,
  price_measured, joules_label:"sample"}`. **Proved live at build time: posture=negative-price,
  aWATTar DE min_next −45.87 EUR/MWh, 10/15 windows negative, renewable share up to 107.4% of load.**
- `apps/agentic-gpu/energy_gate_adapter.py` — `should_soak_wasted_energy(allow_network=True)` returns
  True when the grid is paying to offload power. Reactive turns NEVER gated; proactive batch only.

**platform PR (stacked, incoming this hour)** `feat/harvest-formula-grounded`:
- `apps/agentic-gpu/harvest_budget.py` — makes the soak PROVABLY bounded by the founder's own proven
  formulas: Bekenstein-ADDITIVE info cap (EnergyBudgetWitness.lean #239), Landauer floor (#240),
  monotone SoakLedger, and an Ouroboros bounded-recursion guard so the sponge can NEVER run away.

---

## YOUR WIRING (the only integration step — code is ready)

1. **Feed harvest posture into `fabric_status()`.** In `szl_router/core.py`, where you build the
   honest energy posture, ALSO read the harvest posture (call `wasted_energy_harvest.harvest_provenance()`
   on the box, or replicate the 4 free GETs). Add a field `grid_price_posture` = negative-price |
   curtailed-renewable | cheap | normal | expensive, and `wasted_energy_available` (bool). Keep it under
   the `grid` HONEST source — it is real grid data, NOT sovereign, NOT roadmap. Do not let it flip the
   sovereign label.
2. **Prefer the sovereign GPU HARDER during a soak window.** When `wasted_energy_available` is True,
   the router should bias proactive/batch routing to the sovereign GPU (own metal) — that is when
   running our own hardware is effectively free (the grid is paying to absorb the load).
3. **Gate the batch sponge on the box.** Wire `should_soak_wasted_energy(allow_network=True)` into the
   resident daemon's PROACTIVE admission, capped by `harvest_budget.plan_soak(...)` (Bekenstein-additive
   + Ouroboros bound). Reactive turns always preempt.
4. **Pair with the FIRST MEASURED JOULE.** A soaked batch on the box → read NVML `power.draw` × seconds
   → emit ONE receipt with `joules_label:"measured"` through the Bekenstein `/v1/energy/budget` gate.
   This is the demo slice: real wasted-energy window + real measured joule on our own GPU.

---

## INNOVATE / EVOLVE / UPGRADE (your genius mode — go deeper)
- **Upgrade the model tier during soak:** in a negative-price window, pull/run a BIGGER open-weight
  model on the sovereign GPU (e.g. vLLM qwen2.5-coder:32b if VRAM fits, else 14b) since the marginal
  power is wasted-energy-cheap. Log the window used.
- **Forecast the next soak:** add Open-Meteo (free, no key — wind/solar radiation at the box's region)
  to PRE-SCHEDULE batch work into the next predicted surplus window before the price even drops.
- **Multi-grid follow-the-sun/wind:** aWATTar(DE/AT) + CAISO + UK + ENTSO-E(when founder's token lands)
  → route batch to whichever consented node sits on the deepest negative price right now.
- **Honest fabric color:** extend your green/yellow/red so a negative-price + sovereign-GPU-live window
  shows a distinct "HARVESTING" state — true, not greenwash (it IS real wasted grid energy + own metal).

## DOCTRINE (unchanged, binding)
No free-energy/over-unity — we soak ALREADY-WASTED grid energy; joules stay SAMPLE until on-box NVML;
sovereign:true ONLY on own metal (never label grid/free as sovereign — keep HONEST vs ROADMAP separate
as you already do); reactive never starves; consent-only swarm; open-weight only; NEVER commit a key;
Λ=Conjecture 1; Khipu BFT=Conjecture 2; locked-8 untouched. You do NOT merge; never --admin lutar-lean.
Report what you wired + the first measured-joule receipt to replit-sync/forge-jackin-report-<UTCstamp>.md.
