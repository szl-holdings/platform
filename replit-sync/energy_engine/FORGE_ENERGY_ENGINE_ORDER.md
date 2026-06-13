# FORGE ORDER — Proven Energy Engine: 13 PRs → resident agentic GPU
Perplexity → Forge, 2026-06-13. Doctrine v11/v12. Dispatch is wired (forge-agent-manual).
Engine = the RTX 5000 @ betterwithage (http://100.125.77.31:11434/v1). Execute autonomously.
PRINCIPLE: harvest WASTED energy + PROVE bounded work. NO free-energy. Every joule SAMPLE/ESTIMATE
until a real meter. Reactive turns NEVER starve. sovereign:true ONLY when a local/owned node serves.
Consent-only swarm (no unauthorized access). Λ=Conjecture 1; locked-8 untouched; never commit a key.

## THE 13 PRs (all OPEN, built+tested+doctrine-clean, NONE merged by agents)
KEYSTONE proofs (lutar-lean — do NOT --admin merge; founder lowercases #239 title then CI-merge):
  #239 EnergyBudgetWitness.lean — Bekenstein/ledger/Kuramoto/coherence, 0-sorry, lake build GREEN
  #240 LandauerFloorWitness.lean — min-energy-per-bit lower bound, 0-sorry, core axioms only
Backend + API (a11oy):
  #328 szl_energy_budget.py + GET /v1/energy/budget (Bekenstein gate)        [merge FIRST of a11oy]
  #329 emit energy-budget receipt per governed turn (fail-open)             [needs #328]
  #331 tamper-evident energy provenance chain + /v1/energy/provenance       [needs #328]
  #330 console agentic-GPU operator tab (web/agentic-gpu.html)              [FE, standalone]
  #332 energy engine dashboard (web/energy.html, /energy)                   [FE, standalone]
Agentic-GPU control plane (platform, all under apps/agentic-gpu/, disjoint files):
  #356 energy-source signal feed (off-peak now + negative-price stub)       [merge FIRST of platform]
  #357 resident scheduler + daemon + energy_gate_adapter (Agent.xpu)        [needs #356]
  #358 swarm control-plane (consent-based multi-node, anchor-first)
  #359 Bekenstein batch sponge (soak curtailed/negative-price power)        [stacked on #357]
  #360 energy-proportional admission (NVML headroom + Landauer floor)
  #361 vLLM backend + /metrics slack signal                                 [stacked on #357]

## MERGE ORDER (bottom-up so each layer's dep exists; founder/CI gated)
1. lutar-lean #239, #240 (keystone — founder lowercases #239 title, CI merge, NOT --admin).
2. platform #356 → then #357 → then #358, #359, #360, #361 (357-stacked ones rebase onto main).
3. a11oy #328 → then #329, #331 → then #330, #332 (FE).
All app-suite Lighthouse/e2e reds on platform are PRE-EXISTING (these touch only apps/agentic-gpu/
or web/*.html) — do not block on them. Verify each PR's energy/doctrine checks are green first.

## BOX BRING-UP (Forge, on the RTX 5000 — the part only you can do)
After the PRs land:
1. Confirm Ollama serving (:11434/v1 /v1/models 200) — daemon reports sovereign:true only then.
2. vLLM upgrade (throughput): `vllm serve qwen2.5-coder:32b --enable-prefix-caching \
     --gpu-memory-utilization 0.92 --port 8000`  (keep Ollama as honest fallback).
   Flip daemon endpoint=VLLM_ENDPOINT (vllm_backend.py from #361). No scheduler change.
3. systemd unit for apps/agentic-gpu/daemon.py run_forever() (resident, Restart=always).
4. Wire real Chaski ingress into reactive_ingress() so user turns preempt proactive ON-DEVICE.
5. Wire vLLM /metrics (#361 vllm_metrics.py) into slack detection for piggybacking.
6. (optional) register the RTX 5000 as the ANCHOR node in swarm.py (#358); add consented nodes only.

## STAYS SAMPLE until a real power meter (do NOT relabel as MEASURED)
joules_est / price_signal stay SAMPLE/ESTIMATE until a hardware meter (PDU/clamp/NVML draw) feeds
joules_est. The Lean ledger proves monotonicity of whatever nonneg draws are logged — not their
physical truth. Only REAL signals today: the off-peak clock; and (when GRIDSTATUS/ENTSO-E/CAISO key
is set via env, NEVER committed) a real wholesale/negative-price feed → curtailed/negative-price posture.

## EVOLVE-LOOP (after deploy)
#1 Bekenstein Batch Sponge (#359): when wholesale feed says negative-price/curtailed, flood the
   proactive queue with Bekenstein-gated batch work; drain when power is dear. Needs the real
   wholesale signal + a batch-job source.
#5 Energy-proportional (#360): scale proactive admission to GPU thermal/power headroom (NVML).
Swarm (#358): grow the consent-based multi-node fabric (anchor + opt-in volunteer/DePIN/cloud-burst)
   toward aggregate "many-GPU" capacity — sovereign-first, served_by always honest.

## RELABEL (housekeeping, founder doc)
shared/ALLODIAL_FREE_COMPUTE_VISION.md: change "FREE ENERGY = solar" → "$0-MARGINAL SOLAR" (means
cheap/owned solar, NOT over-unity) to keep the honesty bar unambiguous.

## DEFINITION OF DONE (operational)
Resident daemon on the box, vLLM serving, Chaski turns preempting on-device, the energy gate driven
by a REAL stranded-power signal, receipts emitted through the /v1/energy/budget Bekenstein gate
(+ provenance chain) with a metered joules_est, the two Lean witnesses referenced as formal backing,
and the dashboards (#330/#332) live. Until the box steps land: PROVEN + BUILT + WIRED, not deployed.
HONEST throughout — the half-state (banner sovereign while router serves) is the ONLY unacceptable outcome.
