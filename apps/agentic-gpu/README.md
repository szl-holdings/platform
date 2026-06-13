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
- `vllm_backend.py` — the endpoint **adapter** the daemon flips to for the vLLM
  upgrade: prefers vLLM (`:8000/v1`, exposes `/health` + `/metrics`), falls back
  honestly to Ollama (`:11434/v1`), and to router fallback when neither local
  endpoint answers. `select_backend()` → `daemon_kwargs()` feeds the daemon's
  injectable `endpoint=`/`probe=` (no scheduler change). `sovereign:true` ONLY
  when a local endpoint served. Self-test: `python3 vllm_backend.py` → `{ok:true}`.
- `vllm_metrics.py` — parses vLLM's Prometheus `/metrics` (running/waiting
  requests, GPU KV-cache usage, prefix-cache hit rate) into a **slack signal**
  `∈[0,1]` for finer slack-aware piggybacking; admits proactive work only with
  real headroom and **no** queue backpressure. Off-box (no `/metrics`) it falls
  back to a clearly-labeled **SAMPLE** slack model. Self-test:
  `python3 vllm_metrics.py` → `{ok:true}`.
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
(Agent.xpu STEP 1) is **vLLM** on the RTX 5000. This is a **Forge/box step** —
**not run here** (this control plane is off-box; do not infer box access):

```bash
# On the box (Forge step — not run here):
vllm serve qwen2.5-coder:32b \
  --enable-prefix-caching --gpu-memory-utilization 0.92 \
  --port 8000            # OpenAI-compatible at http://100.125.77.31:8000/v1
# /health + /metrics wired; keep Ollama (:11434) as the honest fallback.
```

`qwen2.5-coder:32b` is **open-weight** and served **no-key** on the LAN — the
same model Ollama serves today, so the upgrade is a server swap, not a model
swap. The control-plane side of the flip is already coded here:

- **`vllm_backend.py`** resolves the backend honestly — `select_backend()`
  prefers vLLM when `/health` answers, falls back to Ollama, then to router
  fallback (NOT sovereign) when neither local endpoint serves. `daemon_kwargs()`
  hands the daemon's injectable `endpoint=`/`probe=` straight in:

  ```python
  from vllm_backend import daemon_kwargs
  from daemon import ResidentDaemon
  kw = daemon_kwargs()                       # probes; picks vLLM, else Ollama
  daemon = ResidentDaemon(endpoint=kw["endpoint"], probe=kw["probe"])
  ```

- **`vllm_metrics.py`** turns vLLM's `/metrics` into a slack signal the
  scheduler polls (`slack_signal_fn()`), so proactive piggybacking only fires
  when there is real GPU headroom and no queue backpressure. Off-box it returns
  a SAMPLE slack (labeled), never a measured one.

**No scheduler change required** — the preemption guarantee is endpoint-agnostic,
and the slack signal only *permits* proactive admission; reactive turns still
preempt within one tick and are never starved.

```bash
python3 vllm_backend.py   # {ok:true} — vLLM-preferred, Ollama fallback, honest router fallback
python3 vllm_metrics.py   # {ok:true} — /metrics → slack signal, SAMPLE fallback off-box
```

## Run (self-tests, local, no GPU)
```bash
cd apps/agentic-gpu
python3 scheduler.py   # prints {"ok": true, ...} — preempt+resume, no-starve, energy gate
python3 daemon.py      # prints {"ok": true, ...} — resident loop, reactive preempts mid-batch
```

## Deployment
This is **code + spec only — not deployed.** The resident daemon is intended to
run persistently on the Forge box (RTX 5000 @ betterwithage), owning the
proactive agenda and yielding to Chaski reactive turns. Bringing it up on the
box (systemd unit, vLLM upgrade, wiring the real Chaski ingress + the
STRANDED_ENERGY power signal + receipt emission) is a separate **Forge/box
step** — see `AGENTIC_GPU_ENGINE.md` evolution STEP 1–4. Forge owns the box
deployment; **do not** infer box access from this PR.
