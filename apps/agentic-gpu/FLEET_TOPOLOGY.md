# Fleet topology invariants — swarm resilience (the SKELETON/SHAPE organ)

`fleet_topology.py` is the **fleet-shape organ** of the agentic-GPU body. It
watches the *shape* of the swarm node-graph (from the consent-only registry,
platform **PR #358** `swarm.py`) and reports — with **exact integer topology** —
whether the fleet provably stays **connected** and **resilient** as nodes join
and leave. It composes two proven topology invariants into one honest
green/yellow/red **fleet-health signal**.

Control-plane only: no inference, no GPU, no network. The self-test is
deterministic and stdlib-runnable.

## The two proven invariants

### 1. Euler / connectivity (round6 `EulerFleetTopology`)

For a graph `G = (V, E)` with `C` connected components:

```
chi(G)   = V - E              # graph Euler characteristic (exact)
beta1(G) = E - V + C          # first Betti number = independent cycles (exact)
```

- `beta1` counts **independent rerouting cycles** — the fleet's routing
  redundancy. `beta1 >= 1` means there is at least one cycle, so the fleet
  **survives any single link loss** without partitioning.
- A spanning **tree** satisfies the proven identity `fleet_tree_euler`:
  `E = V - 1`, `C = 1`, hence `beta1 = 0`. A tree is connected but **fragile** —
  every edge is a cut-edge, so *any* single link loss partitions the fleet.

### 2. Calugareanu resilience (round7 `CalugareanuFleetInvariant`)

The White/Calugareanu identity for a closed ribbon is `Lk = Wr + Tw` (linking
number = writhe + twist). We read it as a **resilience linking number** of the
fleet "ribbon":

| Calugareanu term | fleet meaning | kind |
| --- | --- | --- |
| **writhe** `Wr` | global redundancy `:= beta1` (independent rerouting cycles) | exact |
| **twist** `Tw` | local reroute slack — mean `max(0, degree − 1)` per node (spare incidences to absorb a neighbour's flow if a link drops) | SAMPLE/ESTIMATE |
| **`Lk = Wr + Tw`** | combined resilience linking number — higher ⇒ more ways to reroute when a node/link leaves | SAMPLE/ESTIMATE |

`Lk` is a **shape/resilience** metric, not a measured throughput.

## Fleet-health signal (honest red/yellow/green)

| signal | condition | meaning |
| --- | --- | --- |
| `green` | connected (`C == 1`) **and** redundant (`beta1 >= 1`) | survives any single link loss without partitioning |
| `yellow` | connected but a **tree/near-tree** (`beta1 == 0`) | fragile — at least one cut-edge whose loss partitions the fleet |
| `red` | partitioned (`C >= 2`) **or** empty | the fleet is **already** in pieces |

No `green` is reported unless the fleet is **genuinely redundant** — a tree is
honestly downgraded to `yellow` even though it is connected; a partitioned fleet
is `red` even if each piece is internally healthy.

## Mapping — swarm registry (#358 `swarm.py`) → fleet graph

- **vertices** `V` — the registered, **consenting** nodes (consent-only; no
  discovery, no invented nodes). `FleetNode` mirrors the load-bearing fields of
  `swarm.py`'s `Node` so no import is required.
- **edges** `E` — the swarm **links** (pairs of node_ids sharing a routing
  edge); self-loops, duplicates and edges to unknown nodes are dropped. When no
  links are supplied, a connected **ring** is assumed (the minimal connected
  shape; `beta1 = 1` for `n >= 3`).

## Doctrine (v11/v12) — honesty floor

- **CONSENT-ONLY** vertices — only registered, consenting nodes form the graph.
- **EXACT integer topology** — `V`, `E`, `C`, `chi`, `beta1` are *counted*, not
  estimated. Only the Calugareanu **twist** term is a SAMPLE/ESTIMATE shape
  heuristic, and it is labeled as such.
- **HONEST signal** — no `green` unless genuinely redundant; trees → `yellow`;
  partitions → `red`.
- open-weight; **no key**; pure stdlib; deterministic.

## Self-test

```
python3 fleet_topology.py    # prints {"ok": true} iff every assertion holds
```

The deterministic self-test (no network, no GPU):

- a **connected ring of 4** → `green`, `beta1 = 1`, `chi = 0` (exact);
- **drop a ring edge** → a path/**tree** → `yellow`, fragile, with the
  `fleet_tree_euler` identity `E = V - 1` and `beta1 = 0`;
- **partition** the graph (two disjoint edges) → `red`, `C = 2`;
- **default ring links** for `n >= 3` → auto-connected `green`;
- **consent-only**: a non-consenting node is **not** a vertex;
- **add a chord** → `beta1 = 2`, strictly larger resilience linking number
  (`Lk` rises with redundancy);
- **empty / all-non-consenting** → honest `red`.

## Dependencies

- **platform PR #358** — `apps/agentic-gpu/swarm.py` (the consent-only swarm
  registry this organ reads; `FleetNode` mirrors its fields, no import needed).

## Citations

- **round6 `EulerFleetTopology`** — `chi = V - E`; tree ⇒ `beta1 = 0`
  (`fleet_tree_euler`).
- **round7 `CalugareanuFleetInvariant`** — `Lk = Wr + Tw` (White/Calugareanu
  linking = writhe + twist).
- **Swarm fabric** — platform PR #358 `apps/agentic-gpu/swarm.py`.
