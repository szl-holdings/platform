# Stranded-Energy Sovereign Compute — jack into the waste, compute for good
2026-06-13. "Jack into wind/water power, who's wasting energy we can take and use for good."
The honest, cited, outside-the-box plan to power allodial open-weight inference on energy the
world is THROWING AWAY. Doctrine v11/v12, open-weight only, never overclaim.

## The thesis (validated, not sci-fi)
30-40% of US renewable energy goes UNUSED — curtailed because the grid can't take it. [PCIM /
Soluna]. A whole industry already converts this waste into compute (mostly Bitcoin). SZL's NOVEL
angle: use it for SOVEREIGN OPEN-WEIGHT INFERENCE + verifiable receipts — governed AI on power
no one else wants. Compute is the perfect curtailment sponge: interruptible, relocatable, runs
where the energy IS instead of fighting the 2,600 GW interconnection queue. [PCIM 2026]

## WHO is wasting energy we can capture (ranked by access, cited)
1) CURTAILED WIND/SOLAR (the biggest, cleanest waste): grids tell renewable farms "stop, we
   can't take it." 30-40% wasted. Co-locate compute BEHIND THE METER, bypass the grid entirely.
   - WinDC, Soluna+Siemens (2MW TX pilot, behind-the-meter, no grid), Rune "RELIC" DC-architecture
     micro-DCs at solar/wind sites, IREN 7.5GW Childress buying curtailed wind. [windc; Industry-USA;
     Rune/youtube; PCIM]
2) NEGATIVE-PRICE POWER (they PAY you to consume): wind oversupply at off-peak (00:00-08:00,
   20:00-24:00) drives spot prices BELOW ZERO. Time compute to negative-price windows = energy
   that pays you. [diva-portal negative prices; arxiv curtailed-wind storage "using curtailed
   energy is free"]
3) FLARED / STRANDED GAS (oil wells burn it for nothing): Crusoe (40+ flare DCs, >99% combustion
   vs 93% flaring, -63% CO2e), Canaan (2.5MW Calgary gas-to-compute), BTC+Aurora (5-10MW Canada).
   Stranded gas -> on-site power -> compute. [keepcool/Crusoe; cryptorank/Canaan; morningstar/BTC]
4) MICRO-HYDRO / SURPLUS HYDRO (small + overlooked): Greensparc + Cordova Co-op put a 170kW edge
   DC INSIDE the Humpback Creek hydro plant in Alaska on surplus generation. Any run-of-river /
   spillway with surplus = a sovereign node. [PCIM Alaska]
5) BIOGAS / LANDFILL METHANE: dispatchable 24/7 at ~$0.07/kWh — methane that would vent anyway.
   [EcoEngineers]
6) WASTE HEAT (double-use, compute for good): server exhaust -> district heating / greenhouses
   for food-insecure communities. Cuts DC power 10-30%, avoids 54 power plants if national. The
   compute warms homes as a byproduct. [reimagineappalachia Catching-Heat; EESI; WEF; heatbeat]

## SZL's edge — what no one is doing
Everyone above mines Bitcoin or rents generic GPU. SZL runs GOVERNED, VERIFIABLE, open-weight
inference (Lean-proven receipts, cosign+Rekor) on stranded energy. "Honest AI on honest power":
- every turn reports served_by + which ENERGY SOURCE powered it (curtailed-wind / solar / hydro /
  flare-mitigated), as a verifiable receipt. That's a defense/ESG story (your Navy-CTO audience):
  sovereign AI, carbon-negative-ish (flare mitigation cuts CO2e), no grid dependency, no landlord.

## The build path (small -> large, allodial throughout)
TIER 0 (now, you): solar + LiFePO4 anchor (Mac mini M4 ~50W best perf/watt) — already specced in
  ALLODIAL_FREE_COMPUTE_VISION.md. Unkillable floor.
TIER 1 (weeks): a curtailment-timed node — a box at/near a wind or solar site (or just a grid box
  scheduled to run inference HARD during negative-price / curtailment windows, idle when power is
  dear). Software-only version: time-shift batch inference to cheap/negative-price hours.
TIER 2 (partnership): behind-the-meter container at a curtailed wind/solar or micro-hydro site
  (WinDC / Soluna / Greensparc model). Relocatable, ~90-day deploy. Powers a real sovereign cluster.
TIER 3 (vision): SZL "honest-power" mesh — multiple stranded-energy nodes (solar, hydro, flare)
  in the LiteLLM/Petals failover fabric, each emitting an energy-provenance receipt. Compute
  follows the wasted energy around the country/world. No grid, no landlord, no kill-switch.

## Wire it (software-first; hardware as partnerships land)
[Forge now] (a) Energy-aware SCHEDULER: a curtailment/negative-price signal feed (grid API or a
  simple off-peak time window) that gates heavy/batch inference + model pulls to cheap-power hours;
  log the energy window used. (b) Add served_by + energy_source fields to the turn receipt (even if
  "grid" today) so the provenance plumbing exists. (c) Mix the free Chinese/open endpoints
  (ALLODIAL_FREE_COMPUTE_VISION.md) as zero-cost fallback tiers in the LiteLLM router NOW.
[Founder] Tier-0 solar anchor; then scout one behind-the-meter curtailed-renewable or micro-hydro
  partner (WinDC/Soluna/Greensparc-style) for a real stranded-energy sovereign node.

## Doctrine floor
open-weight ONLY; never commit a key; sovereign:true only on OWN metal; free/stranded-grid tiers
honest sovereign:false; energy_source claims must be REAL (no greenwashing — only claim
flare-mitigated/curtailed when verifiably so). The half-state is the ONLY unacceptable outcome.
locked=8; Λ=Conj1; BFT=Conj2. Compute for good: warm homes with the waste heat where we can.
