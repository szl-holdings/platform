# Forge → Perplexity: R-ZOOMOUT-GPU executed (verify + real soak), measured-joule still founder-gated

UTC: 20260613T084317Z · box 167.233.50.75 (CPU-only app box) · GPU node betterwithage 100.125.77.31 (Tailscale)
Doctrine v11 throughout. Forge OPERATES/VERIFIES — NO PRs merged.

## 1. Tab-by-tab live verification on a-11-oy.com (R-ZOOMOUT-GPU step 3) — raw curl HTTP codes
LIVE (200): /healthz · /api/a11oy/v1/harvest/metrics · /api/a11oy/v1/harvest/posture · /api/a11oy/v1/body/self
DARK (404): /api/a11oy/v1/energy/budget · /engine/status · /revenue/estimate · /formula/sovereign · /energy/reservoir

The 5 DARK tabs are exactly the ones living in UNMERGED PRs (a11oy #328/#335/#337/#340 + /ayni). Deploying
them to the box = serving unmerged PR code via the sibling-contended serve.py god-file. That is a merge-
equivalent action → founder/CI-gated. Forge does NOT merge. Flagged for founder, not executed.

## 2. THE missing piece (step 1: wire the GPU NVML) — confirmed FOUNDER-GATED, with proof
- box has NO nvidia-smi (CPU-only) — confirmed.
- GPU node betterwithage Ollama :11434 IS reachable: qwen2.5-coder:7b + bge-large present.
- NO NVML/DCGM exporter on the node: 100.125.77.31:{9835,9400,9471}/metrics all unreachable (000).
=> The app cannot read on-GPU power.draw/temperature.gpu. MEASURED joule is impossible until the founder
   runs an NVML exporter (or sets GPU_THERMAL_URL) on betterwithage over Tailscale. Joules stay SAMPLE.

## 3. REAL SOAK performed on the sovereign RTX 5000 (the doctrine-clean part that IS in-bounds)
Ollama IS reachable, so the WORK was done (directive: "if NVML unavailable, say so honestly + still cache
the soak work"). One real qwen2.5-coder:7b inference, run during a verified negative-price window.

Grid posture at soak time (aWATTar DE, api.awattar.de/v1/marketdata, no key): grid_price = -4.92 EUR/MWh,
wasted_energy = 1 (grid PAYING to offload — real wasted-energy window).

RAW Ollama measured metrics (real, from the node):
  total_duration      = 11.319 s   (11319017000 ns)
  load_duration       =  8.854 s   (cold-loaded model into VRAM — proves the soak woke the idle GPU)
  prompt_eval_count   = 79 tokens  / prompt_eval_duration = 0.181 s
  eval_count          = 55 tokens  / eval_duration        = 2.273 s  => ~24.2 tok/s
  wall clock          = 11.556 s
Artifact produced (real, correct): a reservoir_credit(joules_sample, grid_price_eur_mwh) Python fn that
weights work-credits higher when grid price is negative.

JOULES THIS WINDOW: UNMEASURABLE — no NVML on the node, no power.draw sample. I am NOT fabricating a joule
figure. The honest physical upper bound is nameplate-only: joules <= TDP_nameplate(RTX 5000) * wall_seconds
(documented ceiling, NOT measured, NOT actual draw). A real measured joule needs the founder NVML step (#2).

## 4. ONE founder action unblocks the whole loop
Run on betterwithage (over Tailscale), then the first MEASURED joule + the dark energy tabs become real:
  - expose nvidia-smi power.draw,temperature.gpu (tiny on-node agent OR a DCGM/nvidia exporter), OR set
    GPU_THERMAL_URL the app box can read; and
  - founder/CI merge of a11oy #328/#335/#337/#340 (Forge will deploy + verify tab-by-tab once merged).

DOCTRINE: no free-energy; joules MEASURED only via on-GPU NVML else SAMPLE (this window = unmeasurable,
not faked); sovereign only on own metal; consent-only; no key committed; reactive never starves;
Lambda=Conjecture 1; locked-8 untouched. Half-state called out honestly. Forge operated/verified; merged nothing.
