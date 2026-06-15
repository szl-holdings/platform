# YARQA flow-router — swarm energy/compute circulation (the CIRCULATION organ)

`yarqa_router.py` is the **circulatory router** of the agentic-GPU body. It
routes COMPUTE/ENERGY flow across the swarm's nodes using **yarqa's plug-flow
compartmentalization** — the same proven reducer that collapses a CFD velocity
field into velocity-aligned plug-flow compartments. Here the "fluid" is
compute/energy, the "velocity" is each node's **surplus power × headroom**, and
a task is the water routed down the channel carrying the most aligned surplus —
**sovereign/local node first** within it.

This module is **control-plane only**: no inference, no GPU, no network. The
self-test is deterministic and stdlib-runnable. It depends on the swarm node
registry from platform **PR #358** (`apps/agentic-gpu/swarm.py`) and, when
present, the `yarqa` pip package; it **degrades honestly** to a self-contained
reducer when yarqa is absent.

## The canal metaphor

`ANATOMY_SHELL_AGENTIC_BODY.md` casts yarqa as *"the irrigation canal that
divides flow."* A canal network splits a river into channels and sends water
where the gradient carries it. Here:

- the **swarm** is the canal network,
- **surplus power** is the gradient,
- a **task** is the water — routed down the channel (compartment) with the
  strongest aligned surplus flow.

## Mapping — swarm node-graph (#358 `swarm.py`) → yarqa `Mesh`

| yarqa `Mesh` field | swarm meaning |
| --- | --- |
| `centers` | a synthetic **flow-aligned** 2-D embedding of each node (surplus nodes on the shared flow front; dry nodes pushed downstream — see below) |
| `velocities` | the per-node **surplus-power** vector: magnitude = routable surplus `surplus_power × headroom` (SAMPLE/ESTIMATE), direction = a stable per-node heading so co-surplus nodes are velocity-aligned |
| `neighbors` | the swarm **LINKS** (which nodes share a routing edge); defaults to a connected ring when no explicit link set is supplied |

Then `yarqa.compartmentalize(mesh, align_threshold)` labels each node with a
compartment id. We pick the compartment with the **greatest total routable
surplus** and, inside it, the **sovereign/local node first** (else an honest
non-sovereign fallback).

### Why the flow-aligned embedding

yarqa's reducer joins a neighbor into a compartment only when it is **both**
(a) velocity-aligned with the seed **and** (b) *straddles the seed's flow front*
— the plane through the seed normal to its velocity. A neighbor straddles only
when the front actually **cuts through** its cell extent. So co-surplus nodes
are placed at the **same flow-axis coordinate** (on the shared front) and spread
**perpendicular** to the flow; the front cuts each, and they collapse into one
plug-flow compartment. Dry (zero-surplus) nodes are pushed downstream so the
surplus front does not cut them — they fall into their own compartment(s). This
reproduces, under the *real* yarqa reducer, exactly the velocity-aligned
partition the self-contained fallback computes.

## Routing (the circulation)

1. **consent filter** — only registered, consenting nodes flow (no discovery).
2. **compartmentalize** — yarqa groups co-surplus nodes (the canal channels).
3. **pick** the compartment with the greatest **total routable surplus**.
4. within it, **prefer a sovereign/local node** (honest `sovereign:true`); else
   fall back to the best non-sovereign node (`sovereign:false`, honest).

Returns an honest **red / non-sovereign** decision when nothing can serve.

## Doctrine (v11/v12) — honesty floor

- **SOVEREIGN ONLY ON LOCAL/OWNED.** `sovereign:true` is reported **only** when
  the served node is an owned/local sovereign tier (`ANCHOR` / `BONUS_LOCAL` /
  `CLOUD_BURST`), mirroring `swarm.py`. A router serving ⇒ `sovereign:false`,
  labeled honestly. The half-state (claiming sovereign while a router served) is
  the one unacceptable outcome.
- **CONSENT-ONLY NODES.** Only registered, consenting nodes are ever considered;
  no discovery, no synthesizing a node we were not handed.
- **SURPLUS IS SAMPLE/ESTIMATE** until metered — every surplus figure is labeled
  `SAMPLE/ESTIMATE`; no measured-watt claim.
- **DEGRADE HONESTLY.** If the `yarqa` package is absent, a self-contained
  region-growing reducer reproduces the velocity-aligned compartmentalization so
  the router still works — and the result says which path it took
  (`reducer: "yarqa" | "self-contained"`). open-weight; **no key**.

## Posture

| posture | meaning |
| --- | --- |
| `green` | a sovereign/local node in the surplus compartment served |
| `yellow` | only a non-sovereign router (or a dry pick) served — honest degrade |
| `red` | nothing could serve (no consenting nodes) |

## Self-test

```
python3 yarqa_router.py    # prints {"ok": true} iff every assertion holds
```

The deterministic self-test (no network, no GPU):

- builds a **4-node mesh** — an `ANCHOR` and a `BONUS_LOCAL` carrying surplus,
  plus two dry nodes — and checks **the two surplus nodes group** into one
  compartment while a dry node is separated (verified under the **real yarqa
  0.4.0 reducer** *and* the self-contained fallback);
- **routes** a task into the surplus compartment, served by a surplus node;
- checks **sovereign-first**: when the surplus compartment holds a sovereign
  node it is chosen and `sovereign:true`, posture `green`;
- checks **router-only surplus** ⇒ routed to the router, `sovereign:false`,
  posture `yellow` (honest);
- checks **consent-only**: a non-consenting node is never routed to nor listed;
- checks **all-non-consenting ⇒ red** with `served_by:null`.

## Dependencies

- **platform PR #358** — `apps/agentic-gpu/swarm.py` (the consent-only swarm node
  registry this router adapts; `SwarmNode` mirrors its load-bearing fields so no
  import is required).
- **`yarqa`** pip package (Apache-2.0; szl-holdings/yarqa) when available;
  optional — the module degrades honestly without it.

## Citations

- **yarqa** — szl-holdings/yarqa (Apache-2.0): plug-flow compartmentalization;
  live endpoint <https://szlholdings-yarqa.hf.space>.
- **Swarm fabric** — platform PR #358 `apps/agentic-gpu/swarm.py`.
- **Scheduler context** — Agent.xpu ([arXiv:2506.24045](https://arxiv.org/abs/2506.24045)).
