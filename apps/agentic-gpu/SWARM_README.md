# SZL Agentic-GPU Swarm — control-plane (`swarm.py`)

The distributed **SWARM aggregation layer** for SZL's Proven Energy Engine: the
"10 supercomputers" **Tier-3** vision (volunteer / DePIN / cloud-burst GPU pool)
sitting **on top of** the RTX 5000 @ betterwithage **anchor**. This directory is
the **control-plane code + spec** — deterministic, testable, stdlib-only. It does
**not** run inference and is **not deployed**; box bring-up + the real
`POST /v1/chat/completions` is a separate Forge step.

It does one job, honestly: route each task to the **highest-available SOVEREIGN
tier first** (a local/owned GPU), fall back honestly, and **always report which
node actually served** — claiming `sovereign:true` *only* when an owned/local
node serves.

## Honesty (doctrine v11/v12) — read first
- **CONSENT-ONLY.** A node participates **only** if an operator explicitly
  `register_node(...)`s it (opt-in). There is **no discovery, no scanning, no
  unauthorized access** of any machine — the router can only ever see the
  registry. This is the **volunteer-computing consent model** of
  [BOINC](https://boinc.berkeley.edu/) and [Folding@home](https://foldingathome.org/):
  the machine owner opts in; the project never reaches for a node that wasn't
  handed to it. A node registered with `consent=False` is **refused**, and
  `deregister_node(...)` honors consent withdrawal immediately.
- **SOVEREIGN ONLY ON OWNED/LOCAL.** `sovereign:true` is reported *only* when the
  serving node is an owned/local tier (anchor / bonus-local / owned cloud-burst).
  A public router / third-party API serving is `sovereign:false`, labeled
  honestly. **The half-state — banner sovereign while a non-sovereign node served
  — is the ONLY unacceptable outcome.**
- **`served_by` ALWAYS HONEST.** Every `RouteResult` names the real `node_id`,
  `tier`, and `base_url`. We never claim a node served that did not.
- **open-weight only; never commit a key.** Cloud/router credentials come from
  the env / secret store. This control plane embeds **no** key and the health
  probe sends **no** key (local endpoints are no-key).

## Tiers (mirrors `SOVEREIGN_RESILIENCE_FABRIC.md`)
| Tier | `Tier` enum | Sovereign? | Role |
|---|---|---|---|
| **Anchor** | `ANCHOR` (0) | **yes** | Always-on owned GPU — **RTX 5000 @ betterwithage** (Ollama today, vLLM `:8000/v1` next). Tried first. |
| **Bonus / volunteer local** | `BONUS_LOCAL` (1) | **yes** | Opt-in owned/volunteer local GPU (laptop, second box). Sovereign while awake. |
| **Cloud burst** | `CLOUD_BURST` (2) | **yes** *(if owned)* | Operator-owned on-demand cloud GPU (e.g. RunPod). For spikes / both local tiers down. |
| **DePIN stub** | `CLOUD_BURST` / `BONUS_LOCAL` | depends on ownership | A DePIN/marketplace node registers like any other; `owned=` records whether it counts as sovereign. **Stub:** no marketplace client here — it joins only by explicit registration. |
| **Router** | `ROUTER` (3) | **no** | Public hosted API / HF router — **honest last resort**, `sovereign:false`. |

Routing is **strictly tier-ordered** (ANCHOR → ROUTER), FIFO within a tier, so
the decision is deterministic. The first registered node whose health probe
answers serves.

### Posture (RESILIENCE_FABRIC §4)
- **green** — an owned/local (sovereign) node served.
- **yellow** — only a non-sovereign router served (degraded but honest).
- **red** — nothing answered (honest hard-down; no fake banner).

## F12 / Kuramoto coupling (PROVEN backing)
Predictable multi-node accounting composes the **kernel-proven**
`node_coupling_additive` in `Showcase/Frontier/EnergyBudgetWitness.lean`
(lutar-lean, 0-sorry, core-axioms-only):

```
node_coupling_additive (k) (ps) :  k * (Σ ps) = Σ (k * pᵢ)
```

the F12 pairwise additivity (`kuramoto_pair_additive`,
`k·(p1+p2)=k·p1+k·p2`) lifted to an arbitrary-length fabric by induction.
`Swarm.swarm_coupled_capacity(k)` is the **runtime shadow** of that theorem: the
swarm's coupled capacity is exactly the sum of the per-node coupled capacities —
**no phantom capacity created or lost when nodes synchronize**. The self-test
checks the additive identity `k·(Σ w) = Σ(k·w)` holds at runtime. (Capacity
weights are **SAMPLE/ESTIMATE** relative figures — GPU class, not measured FLOPs.)

## How it maps to LiteLLM / SOLLOL failover
The swarm registry is a 1:1 shadow of a LiteLLM `model_list` + `fallbacks`
config (see `SOVEREIGN_RESILIENCE_FABRIC.md` STEP 2). Each `Node.base_url` is a
LiteLLM `api_base`; tier order is the LiteLLM `fallbacks` chain:

```yaml
model_list:
  - model_name: code         # ANCHOR  (sovereign)
    litellm_params: {model: openai/qwen2.5-coder:32b,
                     api_base: http://100.125.77.31:11434/v1, api_key: local}
  - model_name: code-bonus   # BONUS_LOCAL (sovereign)
    litellm_params: {api_base: http://<laptop>:11434/v1, api_key: local}
  - model_name: code-cloud   # CLOUD_BURST (sovereign if owned)
    litellm_params: {api_base: <RunPod-ip>/v1, api_key: os.environ/RUNPOD_KEY}
  - model_name: code-router  # ROUTER (NOT sovereign)
    litellm_params: {model: huggingface/..., api_key: os.environ/A11OY_GPU_TOKEN}
litellm_settings:
  fallbacks: [{code: ["code-bonus", "code-cloud", "code-router"]}]
```

`swarm.py` is the **policy/honesty layer** above whatever does the actual
failover: it decides *which tier is allowed to be called sovereign* and emits the
honest `served_by` posture. The box can run LiteLLM/SOLLOL for the transport and
let this module own the sovereignty verdict, or use `Swarm.route()` directly with
a real `HealthProbe` that does `GET {base_url}/models`.

## Files
- `swarm.py` — the consent-based router: `Node`, `Tier`, `Swarm`,
  `register_node`/`deregister_node`, `route()` (anchor-first, honest posture),
  `swarm_coupled_capacity()` (F12 shadow), `status()`. Self-test:
  `python3 swarm.py` → `{"ok": true}`.
- `SWARM_README.md` — this file.

## Run (self-test, local, no GPU, no network)
```bash
cd apps/agentic-gpu
python3 swarm.py    # prints {"ok": true, ...}
```
Scenarios proven by the self-test:
1. **Anchor healthy** → anchor serves, `sovereign:true`, green.
2. **Anchor down** → fails over to the next registered local node, still
   `sovereign:true` (anchor was tried first).
3. **All owned/local down, only public router up** → router serves,
   `sovereign:false`, **yellow** (honest degrade).
4. **Everything down** → nothing serves, `sovereign:false`, **red**.
5. **Consent-only** → a non-consenting node is **refused**; deregistration is honored.
6. **F12** → the additive coupled-capacity identity `k·(Σw)=Σ(k·w)` holds.

## Deployment
**Code + spec only — not deployed.** Real bring-up (wiring a live `HealthProbe`
that probes each tier's `/v1/models`, the real chat call against the served
node, registering the actual anchor + any opted-in volunteer/DePIN/cloud nodes,
and co-locating with LiteLLM/SOLLOL) is a separate **Forge/box step**. Do **not**
infer box access from this module. **No node is ever contacted without an
operator having explicitly registered it.**

Cites: `SOVEREIGN_RESILIENCE_FABRIC.md` (tiers, LiteLLM config, honest posture);
`AGENTIC_GPU_ENGINE.md` STEP 4 (scale-out swarm); BOINC / Folding@home
(volunteer-consent model); Agent.xpu (arXiv:2506.24045).
