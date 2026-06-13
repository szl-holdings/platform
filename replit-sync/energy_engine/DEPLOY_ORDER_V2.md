# DEPLOY ORDER V2 — Agentic-GPU / Proven Energy Engine (26 PRs)

**For:** Forge (box) + Replit (app) operators
**From:** Perplexity CTO/integrator lane · **Date:** 2026-06-13 · **Doctrine:** v11/v12
**Engine:** NVIDIA RTX 5000 @ betterwithage (Ollama `:11434/v1` today → vLLM `:8000/v1`)

**Principle (unchanged):** harvest WASTED energy + PROVE bounded work (Bekenstein).
No free-energy/over-unity. Every joule is **SAMPLE/ESTIMATE until a real meter**.
Reactive never starves (preemptive). sovereign:true ONLY when a local node serves.
Consent-only swarm. Open-weight only. Never commit a key. Λ = Conjecture 1; Khipu
BFT = Conjecture 2; locked-proven = 8 (kernel c7c0ba17). The "half-state" (banner
says sovereign while turns route to HF router) is the ONLY unacceptable outcome.

This supersedes FORGE_ENERGY_ENGINE_ORDER.md (which covered the first 13 PRs). The
full build is now **26 open PRs** — all built, self-tested, doctrine-clean, **none
agent-merged**. Full prioritized plan: `UNIFIED_BUILD_ORDER.md` (companion file).

---

## THE 26 PRs (by repo)

**lutar-lean (KEYSTONE proofs — founder-gated, do NOT `--admin` merge):**
- #239 EnergyBudgetWitness (Bekenstein additive + ledger monotone + Kuramoto + coherence shadow; 0-sorry, core-axioms only)
- #240 LandauerFloorWitness (minimum energy per irreversible bit)
- #241 AgenticBodyWitness (organ-pipeline / heartbeat / fleet / self-heal; 0-sorry)

**platform — apps/agentic-gpu/ (many stacked on #357's branch; merge in order):**
- #356 energy-source signal feed (off-peak clock + wholesale stub)
- #357 resident scheduler + daemon (Agent.xpu pattern, reactive-preempt) + energy_gate_adapter.py
- #358 swarm control-plane (consent-based, anchor-rooted)
- #359 Bekenstein batch sponge (soak curtailed/negative-price power)
- #360 energy-proportional proactive admission (NVML headroom + Landauer)
- #361 vLLM backend + /metrics slack signal
- #362 immune Neyman-Pearson admission gate (deny-by-default)
- #363 brain belief-update admission (PAC-Bayes)
- #364 nervous Shannon-alarm drift detection + daemon self-heal
- #365 skeleton lean-spine claim→theorem traceability (conjecture-honest)
- #366 yarqa plug-flow router for swarm energy/compute circulation
- #367 organ bus — daemon calls live anatomy organs end-to-end
- #368 fleet topology invariants (Euler/Călugăreanu)
- #369 real energy data sources (NVML measured joules + aWATTar + CAISO)

**a11oy (app surface + receipts):**
- #328 energy-budget receipt + `GET /v1/energy/budget` (Bekenstein gate)
- #329 per-turn energy receipt (fail-open)
- #330 console agentic-GPU operator tab (scheduler + energy window)
- #331 tamper-evident energy provenance chain (hash-linked)
- #332 energy engine dashboard (honest GPU + Bekenstein budget view)
- #334 heart-blood receipt heartbeat (sigma-bus + DSSE)
- #335 unified `GET /v1/engine/status` (whole-organism honest aggregate)
- #336 **3D holographic command bridge** (web/hologram.html, Three.js, living-organism view)

**anatomy:**
- #7 live body view — organs pulse as the agentic-GPU mind acts

---

## MERGE ORDER (founder/CI-gated; agents do NOT merge)

Bottom-up so each layer's dependency exists first:

1. **Proofs first:** lutar-lean #239 → #240 → #241. `lake build` GREEN, 0-sorry.
   Only blocker on #239 is cosmetic PR-title-lint (uppercase subject) — founder
   lowercases the **title**, do not touch the file. **Never `--admin` lutar-lean.**
2. **platform spine:** #356 (feed) → #357 (scheduler+daemon+adapter) → then the
   organ/swarm stack #358–#369 (they import the spine). #369 (real data sources)
   last so NVML/aWATTar/CAISO providers land on top of the feed.
3. **a11oy surface:** #328 (receipt route) → #329/#331 (receipt emit + chain) →
   #330/#332/#335 (console/dashboard/status) → #334 (heartbeat) → #336 (hologram).
4. **anatomy #7** any time after the organ bus (#367) so the body view has organs.

> Pre-existing app-suite Lighthouse/e2e fails on platform are unrelated (these PRs
> touch only `apps/agentic-gpu/`); do not block on them. The "Build image + SBOM"
> job is not a required check.

---

## BOX BRING-UP (Forge — needs real box access; NOT done by Perplexity agent)

On the RTX 5000 @ betterwithage:
1. Confirm Ollama `:11434/v1` serving (`/v1/models` answers → daemon reports sovereign:true).
2. vLLM upgrade: `vllm serve qwen2.5-coder:32b --enable-prefix-caching --gpu-memory-utilization 0.92 --port 8000`. Flip daemon `endpoint=VLLM_ENDPOINT`; keep Ollama fallback.
3. systemd unit for `daemon.py run_forever()` (resident, Restart=always) — survives laptop off.
4. Wire real Chaski reactive ingress into `reactive_ingress(now)` so user turns preempt the proactive agenda ON-DEVICE.
5. Wire vLLM `/metrics` into slack detection for finer piggybacking.
6. **First measured joule:** NVML `power.draw` × task_seconds → joules → feed `joules_est` → flip that field SAMPLE→MEASURED in the receipt. This is the single highest-value demo.

---

## STAYS SAMPLE until a real meter
`joules_est`, `price_signal`, `energy_spent_sample_units` remain SAMPLE/ESTIMATE
until NVML/PDU/clamp feeds them. The Lean ledger proves monotonicity of whatever
nonneg draws are logged — not their physical truth. The only REAL signals today:
off-peak clock (zero-dep) and the live **aWATTar** wholesale feed (no key, already
fetched successfully — first REAL energy price signal). CAISO/ENTSO-E next.

## DEFINITION OF DONE (operational)
Resident daemon on the box, vLLM serving, Chaski turns preempting on-device, the
energy gate driven by a REAL stranded-power signal, receipts through `/v1/energy/budget`
with a METERED `joules_est`, hologram + `/v1/engine/status` live, Lean witnesses
(#239/#240/#241) referenced as formal backing. Until then: **proven + built + wired,
not deployed.**

## CTO RECOMMENDATION (honest)
The #1 gap is NOT more code — it is that 26 PRs are open, ZERO merged, NOTHING
deployed. FREEZE new frontiers. Ship ONE vertical slice deployed + measured on the
RTX 5000 (the "first measured joule" demo): merge the spine (#239,#356,#357,#369,
#328), bring up the daemon on-box, wire NVML, emit one MEASURED receipt through the
Bekenstein gate, show it on the hologram. That single slice proves the whole thesis.
