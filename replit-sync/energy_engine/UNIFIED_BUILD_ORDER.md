# UNIFIED BUILD ORDER — Proven Energy Engine

**Owner:** CTO/integrator lane · **Date:** 2026-06-13 · **Doctrine:** v11/v12
**Audience:** Forge (box) + Replit (app) operators.
**Principle:** harvest WASTED energy + PROVE bounded work. No free-energy. Every
joule is SAMPLE/ESTIMATE until a real meter. Reactive never starves; sovereign
only when local serves. Λ = Conjecture 1; locked-8 untouched.

This is the prioritized, executable order from "5 PRs open" to "resident,
energy-aware engine running on the betterwithage RTX 5000."

---

## PHASE 0 — Merge order (founder/CI gated; agents do NOT merge)
Merge bottom-up so each layer's dependency exists first:

1. **lutar-lean #239 — `EnergyBudgetWitness.lean` (KEYSTONE).**
   - `lake build FrontierShowcase` is GREEN, 0-sorry, core-axioms only.
   - **Blocker is cosmetic:** PR-title-lint rejects the uppercase subject.
     *Action:* founder lowercases the PR **title** (e.g. `proof: energy-budget
     witness …`) — do NOT touch the file. Then merge. **Do not `--admin` merge.**
2. **platform #356 — `energy_signal/` feed.** No app code; energy work green.
3. **a11oy #328 — `szl_energy_budget.py` + `serve.py`** (receipt route).
4. **platform #357 — scheduler + daemon + `energy_gate_adapter.py`.**
   - Commit-lint fixed (both headers ≤100 chars, rebased `90f2165`).
   - Merge AFTER #356 so the adapter's `import energy_signal` resolves in-tree.
   - Pre-existing app-suite Lighthouse/e2e fails are unrelated (touches only
     `apps/agentic-gpu/`); do not block on them.

> **#356 ⊕ #357 merge clean** (disjoint files under `apps/agentic-gpu/`). After
> both land, the adapter auto-wires the live feed — no extra commit needed.

---

## PHASE 1 — Integration wiring (mostly DONE; verify post-merge)
1. **[DONE]** `energy_gate_adapter.py` bridges `current_posture().window==cheap`
   → `scheduler.EnergyGate` and `daemon.PowerSignal` (default now feed-driven,
   conservative-honest when feed absent). Self-test `ok:true`, 8 checks.
2. **[VERIFY post-merge]** From `apps/agentic-gpu/` run `python3 daemon.py` and
   `python3 energy_gate_adapter.py` in the merged tree → adapter must report
   `have_signal:true` and the gate must track the live window.
3. **[TODO — small app commit]** Have the live a11oy receipt loop call
   `energy_signal.energy_provenance()` so emitted receipts carry the real
   `energy_source`/`window` (shape already matches; just call it).

---

## PHASE 2 — Box bring-up (Forge; needs real box access — NOT done here)
Order on the RTX 5000 @ betterwithage:
1. **Ollama baseline** (`:11434/v1`) confirmed serving; daemon probe returns
   `sovereign:true` only when `/v1/models` answers.
2. **vLLM upgrade** (Agent.xpu STEP 1) — throughput:
   ```bash
   vllm serve qwen2.5-coder:32b --enable-prefix-caching \
     --gpu-memory-utilization 0.92 --port 8000
   ```
   Flip daemon `endpoint=VLLM_ENDPOINT`; keep Ollama as fallback. No scheduler
   change (preemption is endpoint-agnostic).
3. **systemd unit** for `daemon.py run_forever()` (resident, restart=always).
4. **Wire real Chaski ingress** into `reactive_ingress(now)` so user turns
   actually preempt the proactive agenda on-device.
5. **Wire vLLM `/metrics`** into slack detection for finer piggybacking.

---

## PHASE 3 — What STAYS SAMPLE until a real meter
- `joules_est`, `price_signal`, `energy_spent_sample_units` remain
  **SAMPLE/ESTIMATE** until a hardware power meter (e.g. PDU/clamp/NVML draw) is
  wired. The Lean ledger proves monotonicity of *whatever* nonneg draws are
  logged — not their physical truth. Do NOT relabel as MEASURED until the meter
  lands and feeds `joules_est`.
- The only REAL signals available today: the **off-peak clock** (local time,
  zero-dep, honest) and — once `GRIDSTATUS_API_KEY`/ENTSO-E/CAISO is set via env
  (never committed) — a **real wholesale/negative-price** feed promoting the
  posture to `curtailed-renewable`/`negative-price`.

---

## PHASE 4 — Next evolve-loop (from the innovation briefs)
**Build #1 first, #5 alongside; #2–4 are low-power witness rails only.**
1. **#1 Curtailed-renewable / negative-price Bekenstein Batch Sponge** —
   when the wholesale feed says negative-price/curtailed, the daemon floods the
   proactive queue with Bekenstein-gated batch work (training/eval/receipts),
   soaking otherwise-wasted power. The gate is already the admission point;
   needs the real wholesale signal (Phase 3) + a batch-job source.
5. **#5 Thermal Sovereignty / energy-proportional scheduler** — scale proactive
   admission to GPU thermal/power headroom (NVML), pairing the Landauer-floor
   intuition with the existing monotone ledger. Build concurrently with #1.
   - #2 SMFC, #3 ocean TEG, #4 RF harvesting: **witness rails only** — log a
     SAMPLE provenance source, never assert real harvest until metered.

---

## Definition of done (operational)
Resident daemon on the box, vLLM serving, Chaski turns preempting on-device, the
energy gate driven by a REAL stranded-power signal, receipts emitted through the
`/v1/energy/budget` Bekenstein gate with a metered `joules_est`, and the Lean
witness referenced as the formal backing. Until then: **proven + built + wired,
not deployed.**
