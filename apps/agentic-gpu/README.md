# SZL Agentic-GPU — resident scheduler (Agent.xpu pattern)

Turn the **betterwithage RTX 5000** from a passive model server into a
**resident autonomous engine**: it serves reactive Chaski turns AND runs its own
proactive agenda on-device, with **preemptive priority so proactive work can
never starve a user turn**. This directory is the **control-plane code + spec**
(deterministic, testable, stdlib-only). It does **not** run inference and is
**not yet deployed** — box deployment is a separate Forge step (see
[Deployment](#deployment)).

Pattern + motivation: **Agent.xpu** — Han et al., *"Agent.xpu: Efficient
Scheduling of Agentic LLM Workloads on Heterogeneous SoC"*
([arXiv:2506.24045](https://arxiv.org/abs/2506.24045), 2025), which co-optimizes
**reactive timeliness + proactive throughput + energy** on one device with
preemption so self-initiated work never starves a user turn. See also HERA
([arXiv:2504.00434](https://arxiv.org/abs/2504.00434)) for the keep-it-local
iteration scheduler.

## Honesty (doctrine v11/v12) — read first
- **Proactive NEVER starves reactive.** Enforced *structurally* by strict
  preemptive priority, not by tuning — a running proactive task is paused
  (progress saved, requeued) the moment a reactive turn arrives. This is the
  load-bearing guarantee and it is covered by the self-test.
- **Control plane only.** No model calls, no network in the hot path of
  `scheduler.py`. `daemon.py` does a stdlib health *probe* of the local
  endpoint and nothing else. Real serving + deployment is a Forge/box step.
- **Energy figures are SAMPLE/ESTIMATE** until a real power meter is wired —
  they are labeled as such. The `energy_budget` hook is a *policy gate*, not a
  measurement. The default power signal is conservative: it does **not** assume
  cheap power unless a real signal says so (no free-energy overclaim).
- **open-weight only; never commit a key.** The local box endpoint is no-key.
  **`sovereign:true` ONLY when the local endpoint actually serves** — the daemon
  derives posture from a live probe and honestly reports router fallback when
  the box is unreachable. The half-state (banner sovereign while a router
  serves) is the only unacceptable outcome.
- This does not touch Λ (Conjecture 1) or the locked-8.

## Files
- `scheduler.py` — the preemptive priority scheduler: reactive > proactive,
  slack-aware piggybacking (proactive fills idle ticks), `energy_budget` gate
  for proactive admission. Runnable self-test: `python3 scheduler.py` → `{ok:true}`.
- `daemon.py` — the always-on resident loop *skeleton*: health/warmth probe of
  the local endpoint, energy-signal gate, due-based proactive agenda, one
  scheduler tick per loop. Runnable self-test: `python3 daemon.py`.
- `immune_gate.py` — the **IMMUNE** organ: a Neyman-Pearson *most-powerful*
  admission test for PROACTIVE work, **deny-by-default**, composing with the
  existing `EnergyGate` via `compose_gates(...)`. Reactive is **never** gated.
  Backed by the proven **ImmuneNeymanPearson** formula (lutar-lean round9); live
  runtime is sentra `/api/sentra/v1/gates` (8 gates). Self-test:
  `python3 immune_gate.py` → `{ok:true}`. See [IMMUNE admission](#immune-admission-neyman-pearson-deny-by-default).
- `README.md` — this file.

## How it maps to Agent.xpu (reactive / proactive / energy)
| Agent.xpu concept | Here |
|---|---|
| **Reactive flow** (latency-critical user turns) | `Priority.REACTIVE` tasks (Chaski `/code/chat`). Admitted before any proactive task; preempt running proactive work within one tick. |
| **Proactive flow** (self-initiated, throughput) | `Priority.PROACTIVE` tasks: `self_monitor`, `energy_aware_batch`, `receipt_loop`, `governance_refresh` (the `DEFAULT_AGENDA`). Fill idle GPU cycles. |
| **Preemption** (never starve reactive) | `AgenticGpuScheduler.tick()` pauses the running proactive task, requeues it with `done_ticks` preserved (resume from saved progress), then runs reactive. |
| **Slack-aware piggybacking** | When no reactive task is waiting, the scheduler admits the best proactive task into the idle tick — idle silicon is never wasted. |
| **Energy co-scheduling** | The `EnergyGate` (`energy_budget` hook) gates *proactive* admission on a cheap/stranded-power signal (STRANDED_ENERGY). Reactive is **never** energy-gated — it must always serve. |

## How it calls the local OpenAI-compatible endpoint
`daemon.py` probes the on-box endpoint with the stdlib only (short timeout,
never raises, no key sent):
- **Today (Ollama):** `http://100.125.77.31:11434/v1` — `GET /v1/models` for
  liveness/warmth (`probe_endpoint`).
- The probe result drives **honest posture**: `sovereign:true` only when the
  endpoint actually answers; otherwise it reports router fallback.

A real reactive turn (once the box wires its Chaski queue into
`reactive_ingress`) would `POST /v1/chat/completions` against this same endpoint;
that call lives in the box deployment, not in this control-plane skeleton.

## vLLM upgrade path (from Ollama)
Ollama is the current open-weight, no-key server. The throughput upgrade
(Agent.xpu STEP 1) is **vLLM** on the RTX 5000:

```bash
# On the box (Forge step — not run here):
vllm serve qwen2.5-coder:32b \
  --enable-prefix-caching --gpu-memory-utilization 0.92 \
  --port 8000            # OpenAI-compatible at http://100.125.77.31:8000/v1
# /health + /metrics wired; keep Ollama (:11434) as fallback.
```

The daemon already knows both endpoints (`LOCAL_ENDPOINT` = Ollama `:11434/v1`,
`VLLM_ENDPOINT` = vLLM `:8000/v1`); flipping `endpoint=` (or probing vLLM first,
Ollama as fallback) is the only change. vLLM's `/metrics` then feeds GPU-idle
detection for finer slack-aware piggybacking. No scheduler change required —
the preemption guarantee is endpoint-agnostic.

## IMMUNE admission (Neyman-Pearson, deny-by-default)
`immune_gate.py` upgrades proactive admission from a single power-window gate to
a provably **most-powerful** statistical test — the **IMMUNE** organ of the
anatomy shell (`energy_engine/anatomy/ANATOMY_SHELL_AGENTIC_BODY.md`).

**Proven backing — ImmuneNeymanPearson (lutar-lean round9, kernel-proven).**
The Neyman-Pearson lemma: among all tests of H0 vs H1 with false-positive
(type-I) rate ≤ α, the likelihood-ratio test `Λ(x) = p₁(x)/p₀(x) ≥ k` is the
**most powerful** — no other size-α test admits more genuinely-good work. The
gate therefore thresholds the log-LR at the `log k(α)` derived from α against the
H0 distribution (a *derived* cutoff, not a tuned constant):

- **H0** — do **not** admit now (power dear / no headroom / unsafe).
- **H1** — admit now (cheap/stranded power + GPU headroom + safe + valuable).
- Evidence `x = (power_cheap, gpu_headroom, task_safety, task_value)`, each in
  [0,1] and **SAMPLE/ESTIMATE** (policy signals, not metered joules), modeled as
  shared-variance Gaussians; `log Λ` is then linear in `x`, so under H0 it is
  Gaussian with closed-form mean/SD and `log k(α) = μ₀ + z₁₋α·σ₀`.
- **ADMIT** iff `log Λ(x) ≥ log k(α)`, else **DENY** (deny-by-default).

**Live runtime — IMMUNE = sentra `/api/sentra/v1/gates` (8 deny-by-default
gates).** The 8 gates (`overclaim`, `sovereignty`, `energy_honesty`, `consent`,
`key_exposure`, `open_weight`, `provenance`, `safety`) are *hard* binary gates: a
single rejection short-circuits to DENY regardless of the soft LR. The endpoint
is read-only/advisory and **off-box here**; the control-plane test never depends
on it being reachable (deny-by-default if it is not).

**Composition (no scheduler change).** The immune gate is a
`scheduler.EnergyGate`-shaped callable; `compose_gates(energy_gate, immune_gate)`
ANDs them so **both** the power-window policy and the NP safety/value test must
pass. Any gate that denies (or raises) denies the whole — fail-closed.

```python
from immune_gate import make_immune_gate, compose_gates
from energy_gate_adapter import make_energy_gate
gate = compose_gates(make_energy_gate(), make_immune_gate(evidence_fn=...))
scheduler = AgenticGpuScheduler(energy_gate=gate)   # proactive only; reactive never gated
```

**Doctrine.** Deny-by-default; **reactive is NEVER gated** (the scheduler routes
reactive work around every gate — verified in the self-test); the test is honest
(the self-test Monte-Carlo's the H0 null and confirms the realized false-admit
rate is controlled at ≈α with power ≫ α); evidence is SAMPLE/ESTIMATE;
open-weight only; no key. Traces to the proven formula; does not touch Λ
(Conjecture 1) or the locked-8.

## Run (self-tests, local, no GPU)
```bash
cd apps/agentic-gpu
python3 scheduler.py     # prints {"ok": true, ...} — preempt+resume, no-starve, energy gate
python3 daemon.py        # prints {"ok": true, ...} — resident loop, reactive preempts mid-batch
python3 immune_gate.py   # prints {"ok": true, ...} — NP admit/deny, deny-by-default, reactive never gated
```

## Deployment
This is **code + spec only — not deployed.** The resident daemon is intended to
run persistently on the Forge box (RTX 5000 @ betterwithage), owning the
proactive agenda and yielding to Chaski reactive turns. Bringing it up on the
box (systemd unit, vLLM upgrade, wiring the real Chaski ingress + the
STRANDED_ENERGY power signal + receipt emission) is a separate **Forge/box
step** — see `AGENTIC_GPU_ENGINE.md` evolution STEP 1–4. Forge owns the box
deployment; **do not** infer box access from this PR.
