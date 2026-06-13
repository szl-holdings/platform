"""
SZL Agentic-GPU — yarqa_router.py  (CIRCULATION organ of the anatomy shell)
===========================================================================
The CIRCULATORY ROUTER of the agentic-GPU body: it routes COMPUTE/ENERGY flow
across the swarm's nodes using **yarqa's plug-flow compartmentalization** — the
same reducer that collapses a CFD velocity field into velocity-aligned
plug-flow compartments. Here the "fluid" is compute/energy and the "velocity"
is each node's SURPLUS POWER + headroom, so yarqa partitions the node fabric
into surplus-aligned compartments and we route work to the compartment carrying
the most aligned surplus — sovereign/local node first within it.

THE CANAL METAPHOR (ANATOMY_SHELL_AGENTIC_BODY.md): yarqa is "the irrigation
canal that divides flow." A canal network splits a river into channels and
sends water where the gradient carries it; here the swarm is the canal network,
surplus power is the gradient, and a task is the water — routed down the channel
(compartment) with the strongest aligned surplus flow.

MAPPING — swarm node-graph (PR #358 `swarm.py`) -> yarqa `Mesh`:
  - centers    : a synthetic 2-D flow-aligned embedding of each node — surplus
                 nodes are placed on the shared flow front (so yarqa's straddle
                 test cuts through and groups them), dry nodes pushed downstream.
  - velocities : the per-node SURPLUS-POWER vector — magnitude = surplus
                 headroom (SAMPLE/ESTIMATE), direction = a stable per-node
                 heading so that genuinely co-surplus nodes are velocity-aligned
                 and get grouped into one plug-flow compartment.
  - neighbors  : the swarm LINKS (which nodes share a routing edge); defaults to
                 a connected ring when no explicit link set is supplied.
Then `yarqa.compartmentalize(mesh, align_threshold)` labels each node with a
compartment id; we pick the compartment with the greatest total surplus and,
inside it, the sovereign/local node first (else honest non-sovereign fallback).

DOCTRINE (v11/v12):
- SOVEREIGN ONLY ON LOCAL/OWNED. The router reports `sovereign:true` ONLY when
  the node it routes to is an owned/local sovereign tier (mirrors `swarm.py`).
  A non-owned router node serving => `sovereign:false`, labeled honestly. The
  half-state (claiming sovereign while a router served) is unacceptable.
- CONSENT-ONLY NODES. Only registered, consenting nodes are ever considered; no
  discovery, no synthesizing a node we were not handed.
- SURPLUS FIGURES ARE SAMPLE/ESTIMATE until metered (no measured-watt claim).
- DEGRADE HONESTLY. If the `yarqa` package is absent, a self-contained
  region-growing reducer reproduces the velocity-aligned compartmentalization so
  the router still works (and says which path it took). open-weight; no key.

Cites: yarqa (szl-holdings/yarqa, Apache-2.0; plug-flow compartmentalization;
https://szlholdings-yarqa.hf.space). Swarm fabric: platform PR #358
`apps/agentic-gpu/swarm.py`.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass, field
from typing import Optional, Sequence

# --- yarqa package (the proven plug-flow reducer). Defensive: degrade to a
#     self-contained reducer if the pip package is not installed. -------------
try:
    import numpy as _np  # yarqa needs numpy; both present together.
    import yarqa as _yarqa  # type: ignore
    _HAVE_YARQA = True
    _YARQA_VERSION = getattr(_yarqa, "__version__", "?")
except Exception:  # noqa: BLE001 - no yarqa/numpy => self-contained reducer.
    _np = None  # type: ignore
    _yarqa = None  # type: ignore
    _HAVE_YARQA = False
    _YARQA_VERSION = None


# Owned/local tiers whose serving may HONESTLY be called sovereign. Kept as a
# string set so this module does not hard-depend on swarm.py's Tier enum being
# importable (the swarm fabric lives on a sibling branch, PR #358).
_SOVEREIGN_TIERS = frozenset({"ANCHOR", "BONUS_LOCAL", "CLOUD_BURST"})


@dataclass
class SwarmNode:
    """A registered, consenting node as seen by the circulatory router.

    Mirrors the load-bearing fields of `swarm.py`'s `Node` so a caller can adapt
    a real swarm registry into this router without importing it. `surplus_power`
    and `headroom` are SAMPLE/ESTIMATE (relative, in [0, inf) and [0,1]).
    """
    node_id: str
    tier: str                      # "ANCHOR" | "BONUS_LOCAL" | "CLOUD_BURST" | "ROUTER"
    owned: bool = True
    consent: bool = True
    surplus_power: float = 0.0     # SAMPLE/ESTIMATE surplus/stranded power units
    headroom: float = 1.0          # SAMPLE/ESTIMATE free compute fraction [0,1]
    base_url: str = ""

    @property
    def is_sovereign(self) -> bool:
        """True iff routing here may HONESTLY be called sovereign (owned+local)."""
        return self.owned and self.tier in _SOVEREIGN_TIERS

    @property
    def surplus_flow(self) -> float:
        """The 'velocity magnitude': surplus power actually usable = surplus*headroom.

        A node with surplus power but no headroom carries no usable flow, and
        vice-versa — the product is the aligned, routable surplus.
        """
        return max(0.0, self.surplus_power) * max(0.0, min(1.0, self.headroom))


@dataclass
class RouteDecision:
    """Where the circulatory router sent the task, and the honest posture."""
    served_by: Optional[str]            # node_id that was routed to, or None
    sovereign: bool                     # True ONLY when an owned/local node served
    compartment: Optional[int]          # the yarqa compartment id chosen
    compartment_members: tuple          # node_ids in the chosen compartment
    compartment_surplus: float          # total routable surplus in that compartment
    posture: str                        # "green" | "yellow" | "red"
    reducer: str                        # "yarqa" | "self-contained"
    note: str
    n_compartments: int = 0

    def as_dict(self) -> dict:
        return {
            "served_by": self.served_by,
            "sovereign": self.sovereign,
            "compartment": self.compartment,
            "compartment_members": list(self.compartment_members),
            "compartment_surplus_sample": round(self.compartment_surplus, 4),
            "posture": self.posture,
            "reducer": self.reducer,
            "n_compartments": self.n_compartments,
            "surplus_label": "SAMPLE/ESTIMATE",
            "note": self.note,
        }


# ===========================================================================
# Mesh construction: swarm node-graph -> velocity field
# ===========================================================================
def _flow_centers(nodes: Sequence[SwarmNode]):
    """A flow-aligned 2-D embedding so yarqa's straddle test groups co-surplus
    nodes (the canal channel).

    The surplus 'velocity' points along +x (see `_headings`). yarqa's
    `_straddles_front` only joins a neighbor whose cell extent is *cut* by the
    seed's flow front — the plane through the seed normal to +x. So we place
    every SURPLUS node at the SAME flow-axis coordinate (x=0) and spread them
    ACROSS the flow (distinct y): each then lies on the others' front and
    straddles it, collapsing them into one plug-flow compartment. DRY nodes are
    pushed downstream (x=+D) so the surplus front does not cut them — they fall
    into their own compartment(s), exactly the velocity-aligned partition we want.
    This mirrors the self-contained reducer's grouping under the real reducer."""
    downstream = 4.0
    out = []
    dry_i = 0
    for nd in nodes:
        if nd.surplus_flow > 1e-9:
            # On the front plane (x=0); spread perpendicular by node identity.
            out.append((0.0, float(len(out))))
        else:
            # Pushed downstream and fanned out so dry cells never straddle.
            out.append((downstream, float(dry_i)))
            dry_i += 1
    return out


def _surplus_velocity(node: SwarmNode, heading_rad: float):
    """The per-node surplus-power 'velocity' vector.

    Magnitude = routable surplus flow (surplus * headroom). Direction = a stable
    per-node heading. Co-surplus nodes share a similar heading band so the
    velocity-alignment test groups them; near-zero surplus -> near-zero velocity.
    """
    mag = node.surplus_flow
    return (mag * math.cos(heading_rad), mag * math.sin(heading_rad))


def _default_neighbors(n: int) -> list[list[int]]:
    """A connected ring adjacency when no explicit swarm links are supplied."""
    if n <= 1:
        return [[] for _ in range(n)]
    return [[(i - 1) % n, (i + 1) % n] for i in range(n)]


def _headings(nodes: Sequence[SwarmNode]):
    """Assign each node a heading so that nodes with surplus point 'downstream'
    (heading 0) and nodes without surplus point 'across' (heading pi/2).

    This makes surplus-carrying nodes velocity-aligned with each other (and thus
    grouped into one plug-flow compartment), and misaligned with dry nodes."""
    out = []
    for nd in nodes:
        out.append(0.0 if nd.surplus_flow > 1e-9 else math.pi / 2.0)
    return out


# ===========================================================================
# Compartmentalization: yarqa if present, else a self-contained reducer.
# ===========================================================================
def _compartmentalize_self_contained(velocities: list[tuple],
                                     neighbors: list[list[int]],
                                     align_threshold: float) -> list[int]:
    """A faithful fallback for `yarqa.compartmentalize` (region-growing).

    Repeatedly seed an unassigned cell and grow outward through face-neighbors
    whose unit-velocity dot-product with the seed is >= align_threshold. Every
    cell lands in exactly one compartment. This reproduces yarqa's half-space
    alignment rule (align_threshold=0 => dot>=0) without the straddle geometry.
    """
    n = len(velocities)
    labels = [-1] * n

    def unit(v):
        m = math.hypot(v[0], v[1])
        return (0.0, 0.0) if m < 1e-12 else (v[0] / m, v[1] / m)

    units = [unit(v) for v in velocities]
    comp = 0
    for seed in range(n):
        if labels[seed] != -1:
            continue
        labels[seed] = comp
        stack = [seed]
        su = units[seed]
        while stack:
            i = stack.pop()
            for j in neighbors[i]:
                if labels[j] != -1:
                    continue
                nj = units[j]
                dot = su[0] * nj[0] + su[1] * nj[1]
                # A zero-velocity (dry) cell aligns with nothing -> its own comp.
                aligned = (math.hypot(*nj) > 1e-12
                           and math.hypot(*su) > 1e-12
                           and dot >= align_threshold)
                if aligned:
                    labels[j] = comp
                    stack.append(j)
        comp += 1
    return labels


def compartmentalize_nodes(nodes: Sequence[SwarmNode],
                           neighbors: Optional[list[list[int]]] = None,
                           align_threshold: float = 0.25) -> tuple:
    """Partition the swarm into surplus-aligned plug-flow compartments.

    Returns (labels, reducer_name). Uses `yarqa.compartmentalize` on a real
    `yarqa.Mesh` when the package is present; otherwise the self-contained
    region-growing reducer. `align_threshold` raises toward 1.0 for stricter,
    more numerous compartments.
    """
    n = len(nodes)
    nbrs = neighbors if neighbors is not None else _default_neighbors(n)
    centers = _flow_centers(nodes)
    headings = _headings(nodes)
    velocities = [_surplus_velocity(nd, headings[i]) for i, nd in enumerate(nodes)]

    if _HAVE_YARQA and n > 0:
        try:
            mesh = _yarqa.Mesh(
                centers=_np.asarray(centers, dtype=float),
                velocities=_np.asarray(velocities, dtype=float),
                neighbors=[_np.asarray(x, dtype=int) for x in nbrs],
            )
            labels = _yarqa.compartmentalize(mesh, align_threshold=align_threshold)
            return ([int(x) for x in list(labels)], "yarqa")
        except Exception:  # noqa: BLE001 - any yarqa failure => honest fallback.
            pass
    return (_compartmentalize_self_contained(velocities, nbrs, align_threshold),
            "self-contained")


# ===========================================================================
# Routing: pick the highest-surplus compartment, sovereign-first within it.
# ===========================================================================
def route_task(nodes: Sequence[SwarmNode],
               neighbors: Optional[list[list[int]]] = None,
               align_threshold: float = 0.25,
               task: Optional[str] = None) -> RouteDecision:
    """Route a task to the surplus-aligned compartment, sovereign/local first.

    Steps (the circulation):
      1. consent filter — only registered, consenting nodes flow.
      2. compartmentalize — yarqa groups co-surplus nodes (the canal channels).
      3. pick the compartment with the greatest TOTAL routable surplus.
      4. within it, prefer a sovereign/local node (honest sovereign posture);
         else fall back to the best non-sovereign node (sovereign:false).
    Returns an honest red/non-sovereign decision if nothing can serve.
    """
    consenting = [nd for nd in nodes if nd.consent]
    if not consenting:
        return RouteDecision(
            served_by=None, sovereign=False, compartment=None,
            compartment_members=(), compartment_surplus=0.0, posture="red",
            reducer="yarqa" if _HAVE_YARQA else "self-contained",
            note="no consenting nodes registered — nothing to route to.")

    labels, reducer = compartmentalize_nodes(
        consenting, neighbors=neighbors, align_threshold=align_threshold)
    n_comp = (max(labels) + 1) if labels else 0

    # Aggregate routable surplus per compartment.
    by_comp: dict[int, list[int]] = {}
    surplus: dict[int, float] = {}
    for idx, lab in enumerate(labels):
        by_comp.setdefault(lab, []).append(idx)
        surplus[lab] = surplus.get(lab, 0.0) + consenting[idx].surplus_flow

    # Choose the compartment with the most surplus; ties -> one containing a
    # sovereign node, then lowest id (deterministic).
    def comp_key(lab: int):
        has_sov = any(consenting[i].is_sovereign for i in by_comp[lab])
        return (surplus[lab], 1 if has_sov else 0, -lab)

    best_comp = max(by_comp.keys(), key=comp_key)
    members = by_comp[best_comp]

    # Sovereign-first node selection inside the chosen compartment; among equals
    # pick the highest routable surplus.
    sov = [i for i in members if consenting[i].is_sovereign]
    pool = sov if sov else members
    chosen = max(pool, key=lambda i: consenting[i].surplus_flow)
    node = consenting[chosen]

    if node.surplus_flow <= 0.0 and not node.is_sovereign:
        # Nothing carries surplus and the pick is non-sovereign: honest yellow.
        posture = "yellow"
    elif node.is_sovereign:
        posture = "green"
    else:
        posture = "yellow"

    member_ids = tuple(consenting[i].node_id for i in members)
    note = ("routed to sovereign/local node in the highest-surplus compartment "
            "(sovereign:true)" if node.is_sovereign else
            "no sovereign node in the surplus compartment — routed to a "
            "non-sovereign node (sovereign:false, honest fallback)")
    return RouteDecision(
        served_by=node.node_id, sovereign=node.is_sovereign,
        compartment=int(best_comp), compartment_members=member_ids,
        compartment_surplus=surplus[best_comp], posture=posture,
        reducer=reducer, note=note, n_compartments=n_comp)


# ===========================================================================
# SELF-TEST — no network, no GPU. Deterministic.
#   - build a 4-node mesh; two nodes carry surplus power, two are dry.
#   - compartmentalize -> the two surplus nodes group into one compartment.
#   - route -> the task lands in the surplus compartment.
#   - sovereign-first respected: when the surplus compartment has a sovereign
#     node it is chosen and sovereign:true; a router-only surplus => sovereign:false.
#   - consent-only: a non-consenting node is never routed to.
#   - works with yarqa if present AND via the self-contained reducer.
# Prints {"ok": true} iff every assertion holds.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {"checks": [], "have_yarqa": _HAVE_YARQA,
                 "yarqa_version": _YARQA_VERSION}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    # --- 4-node swarm: anchor + bonus_local with surplus; two dry nodes -----
    anchor = SwarmNode("anchor", "ANCHOR", owned=True, surplus_power=8.0,
                       headroom=0.9)            # sovereign + lots of surplus
    bonus = SwarmNode("bonus", "BONUS_LOCAL", owned=True, surplus_power=6.0,
                      headroom=0.8)             # sovereign + surplus
    dry_router = SwarmNode("router", "ROUTER", owned=False, surplus_power=0.0,
                           headroom=0.1)        # non-sovereign, no surplus
    dry_local = SwarmNode("idle_local", "BONUS_LOCAL", owned=True,
                          surplus_power=0.0, headroom=0.05)  # sovereign but dry
    nodes = [anchor, bonus, dry_router, dry_local]

    labels, reducer = compartmentalize_nodes(nodes)
    out["labels"] = labels
    out["reducer_used"] = reducer
    # The two surplus nodes (anchor, bonus) must share a compartment.
    check("surplus_nodes_grouped", labels[0] == labels[1])
    # A dry node must NOT be in the surplus compartment.
    check("dry_node_separated", labels[2] != labels[0] or labels[3] != labels[0])
    check("more_than_one_compartment", (max(labels) + 1) >= 2)

    # --- route -> surplus compartment, sovereign-first ---------------------
    d = route_task(nodes, task="energy_aware_batch")
    out["route"] = d.as_dict()
    check("routed_into_surplus_compartment",
          set(d.compartment_members) >= {"anchor", "bonus"})
    check("served_by_a_surplus_node", d.served_by in ("anchor", "bonus"))
    check("sovereign_true_on_local", d.sovereign is True)
    check("posture_green_when_sovereign_surplus", d.posture == "green")
    check("compartment_surplus_positive", d.compartment_surplus > 0.0)

    # --- sovereign-first: if ONLY a router carries surplus, sovereign:false --
    r_surplus = SwarmNode("router_hot", "ROUTER", owned=False,
                          surplus_power=10.0, headroom=0.9)  # non-sovereign surplus
    sov_dry = SwarmNode("anchor_idle", "ANCHOR", owned=True,
                        surplus_power=0.0, headroom=0.02)    # sovereign but dry
    d2 = route_task([r_surplus, sov_dry], task="batch")
    check("router_surplus_routes_to_router", d2.served_by == "router_hot")
    check("router_surplus_is_not_sovereign", d2.sovereign is False)
    check("router_surplus_posture_yellow", d2.posture == "yellow")

    # --- consent-only: a non-consenting node is never routed to ------------
    no_consent = SwarmNode("rogue", "ANCHOR", owned=True, surplus_power=99.0,
                           headroom=1.0, consent=False)
    small = SwarmNode("anchor2", "ANCHOR", owned=True, surplus_power=1.0,
                      headroom=0.5)
    d3 = route_task([no_consent, small], task="batch")
    check("non_consenting_never_served", d3.served_by == "anchor2")
    check("non_consenting_excluded_from_members",
          "rogue" not in d3.compartment_members)

    # --- empty / all-non-consenting => honest red --------------------------
    d4 = route_task([SwarmNode("x", "ANCHOR", consent=False)])
    check("no_consenting_nodes_red", d4.posture == "red" and d4.served_by is None)

    # --- the self-contained reducer is exercised explicitly ----------------
    sc_labels = _compartmentalize_self_contained(
        [_surplus_velocity(n, h) for n, h in zip(nodes, _headings(nodes))],
        _default_neighbors(len(nodes)), align_threshold=0.25)
    check("self_contained_groups_surplus", sc_labels[0] == sc_labels[1])

    out["ok"] = True
    out["cites"] = ("yarqa (szl-holdings/yarqa, Apache-2.0; plug-flow "
                    "compartmentalize); swarm fabric platform #358 swarm.py")
    out["doctrine"] = ("route compute/energy flow to the surplus-aligned "
                       "compartment; sovereign:true ONLY on owned/local; "
                       "consent-only nodes; surplus is SAMPLE/ESTIMATE; "
                       "degrades honestly without the yarqa package; no key.")
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
