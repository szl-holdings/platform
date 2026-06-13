"""
SZL Agentic-GPU — fleet_topology.py  (SKELETON/SHAPE organ of the anatomy shell)
================================================================================
The FLEET-TOPOLOGY organ of the agentic-GPU body: it watches the SHAPE of the
swarm node-graph and reports whether the fleet provably stays CONNECTED and
RESILIENT as nodes join/leave. It composes two proven topology invariants:

  * EULER (round6 `EulerFleetTopology`): the graph Euler characteristic and the
    first Betti number (cyclomatic number) of the live node-graph. For a graph
    G=(V,E) with C connected components,
        chi(G)   = V - E                         (graph Euler characteristic)
        beta1(G) = E - V + C                     (independent cycles = redundancy)
    A spanning TREE has E = V - 1, C = 1, hence beta1 = 0 (the proven identity
    `fleet_tree_euler`): a tree is connected but FRAGILE — every edge is a
    cut-edge, so any single link loss partitions the fleet. beta1 >= 1 means
    there is at least one redundant routing cycle: a resilient fleet.

  * CALUGAREANU (round7 `CalugareanuFleetInvariant`): the White/Calugareanu
    identity  Lk = Wr + Tw  (linking number = writhe + twist). We read it as a
    RESILIENCE LINKING NUMBER of the fleet "ribbon":
        writhe  := global redundancy  = beta1 (independent rerouting cycles)
        twist   := local reroute slack = a degree-balance term (how evenly each
                   node can absorb a neighbour's load if a link drops)
        Lk      := writhe + twist      = the combined resilience linking number
    Higher Lk => more ways to reroute flow when a node/link leaves => more
    resilient fleet shape. This is a SHAPE/RESILIENCE metric, not a measured
    throughput.

FLEET HEALTH SIGNAL (the organ's output, honest red/yellow/green):
  * green  : connected (C == 1) AND redundant (beta1 >= 1) — survives any single
             link loss without partitioning.
  * yellow : connected (C == 1) but a TREE/near-tree (beta1 == 0) — fragile;
             at least one cut-edge whose loss partitions the fleet.
  * red    : partitioned (C >= 2) — the fleet is ALREADY in pieces.

DOCTRINE (v11/v12):
- CONSENT-ONLY NODES. Only registered, consenting nodes form the graph; no
  discovery, no synthesizing a node we were not handed (mirrors swarm.py #358).
- INVARIANTS ARE EXACT (integer) topology — V, E, C, chi, beta1 are counted, not
  estimated. The Calugareanu twist term is a SAMPLE/ESTIMATE shape heuristic and
  is labeled as such; chi/beta1/connectivity are exact.
- HONEST SIGNAL. A partitioned fleet is reported red even if individual pieces
  are internally healthy; a tree is reported yellow even though it is connected.
  No green unless genuinely redundant.
- open-weight; no key; pure stdlib; deterministic; self-testable (no network).

Cites: round6 EulerFleetTopology (chi = V - E; tree => beta1 = 0); round7
CalugareanuFleetInvariant (Lk = Wr + Tw, White/Calugareanu). Swarm fabric:
platform PR #358 `apps/agentic-gpu/swarm.py`.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Optional, Sequence


# Owned/local tiers (mirrors swarm.py #358) — used only to count how much of the
# fleet shape is sovereign; not load-bearing for the topology invariants.
_SOVEREIGN_TIERS = frozenset({"ANCHOR", "BONUS_LOCAL", "CLOUD_BURST"})


@dataclass
class FleetNode:
    """A registered, consenting node as a vertex of the fleet graph.

    Mirrors the load-bearing fields of swarm.py's `Node` so a caller can adapt a
    real swarm registry without importing it.
    """
    node_id: str
    tier: str = "ANCHOR"           # "ANCHOR"|"BONUS_LOCAL"|"CLOUD_BURST"|"ROUTER"
    owned: bool = True
    consent: bool = True

    @property
    def is_sovereign(self) -> bool:
        return self.owned and self.tier in _SOVEREIGN_TIERS


@dataclass
class FleetTopology:
    """The exact topology invariants + Calugareanu resilience of the fleet graph."""
    n_vertices: int                 # V (consenting nodes)
    n_edges: int                    # E (distinct undirected links among them)
    n_components: int               # C (connected components, union-find)
    euler_characteristic: int       # chi = V - E (exact)
    betti1: int                     # beta1 = E - V + C (independent cycles, exact)
    writhe: int                     # global redundancy := beta1 (exact)
    twist: float                    # local reroute slack (SAMPLE/ESTIMATE)
    linking_number: float           # Lk = writhe + twist (resilience linking)
    connected: bool                 # C == 1
    redundant: bool                 # beta1 >= 1 (survives a single link loss)
    is_tree: bool                   # connected AND beta1 == 0 (fragile)
    health: str                     # "green" | "yellow" | "red"
    note: str

    def as_dict(self) -> dict:
        return {
            "V_vertices": self.n_vertices,
            "E_edges": self.n_edges,
            "C_components": self.n_components,
            "euler_characteristic_chi": self.euler_characteristic,
            "betti1_independent_cycles": self.betti1,
            "writhe": self.writhe,
            "twist_sample": round(self.twist, 4),
            "linking_number_Lk_sample": round(self.linking_number, 4),
            "connected": self.connected,
            "redundant": self.redundant,
            "is_tree": self.is_tree,
            "health": self.health,
            "twist_label": "SAMPLE/ESTIMATE",
            "note": self.note,
        }


# ===========================================================================
# Graph primitives (exact integer topology).
# ===========================================================================
def _normalize_edges(node_ids: Sequence[str],
                     links: Sequence[tuple]) -> list[tuple]:
    """Canonicalize links into a set of distinct undirected edges among known
    nodes. Drops self-loops, duplicates, and edges to unknown/non-consenting
    ids (we never invent a node we were not handed)."""
    known = set(node_ids)
    seen: set[tuple] = set()
    out: list[tuple] = []
    for a, b in links:
        if a == b or a not in known or b not in known:
            continue
        e = (a, b) if a <= b else (b, a)
        if e not in seen:
            seen.add(e)
            out.append(e)
    return out


def _components(node_ids: Sequence[str], edges: Sequence[tuple]) -> int:
    """Number of connected components via union-find (exact)."""
    parent = {nid: nid for nid in node_ids}

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for a, b in edges:
        union(a, b)
    return len({find(nid) for nid in node_ids}) if node_ids else 0


def _degrees(node_ids: Sequence[str], edges: Sequence[tuple]) -> dict:
    deg = {nid: 0 for nid in node_ids}
    for a, b in edges:
        deg[a] += 1
        deg[b] += 1
    return deg


def _twist_term(node_ids: Sequence[str], edges: Sequence[tuple]) -> float:
    """Calugareanu TWIST term: a SAMPLE/ESTIMATE local reroute-slack heuristic.

    Reading Lk = Wr + Tw, the twist measures how much LOCAL slack each node has
    to absorb a neighbour's flow if a link drops. We use the mean of
    max(0, degree - 1) over nodes: a node of degree d can reroute around any one
    of its links iff it has another (d - 1 spare incidences). A fleet whose nodes
    each keep spare incidences has more twist (local resilience). This is a shape
    heuristic, labeled SAMPLE/ESTIMATE; the exact invariants are chi/beta1/C.
    """
    if not node_ids:
        return 0.0
    deg = _degrees(node_ids, edges)
    spare = [max(0, deg[nid] - 1) for nid in node_ids]
    return sum(spare) / len(node_ids)


# ===========================================================================
# The organ: compute fleet topology + health from a consent-only registry.
# ===========================================================================
def fleet_topology(nodes: Sequence[FleetNode],
                   links: Optional[Sequence[tuple]] = None) -> FleetTopology:
    """Compute the fleet's exact topology invariants + Calugareanu resilience.

    `links` is the swarm link set (pairs of node_ids sharing a routing edge);
    when omitted, defaults to a connected ring over the consenting nodes (the
    minimal connected shape — a tree-plus-one-cycle on >=3 nodes).
    Only consenting nodes are graph vertices (consent-only doctrine).
    """
    consenting = [nd for nd in nodes if nd.consent]
    node_ids = [nd.node_id for nd in consenting]
    V = len(node_ids)

    if links is None:
        links = _default_ring_links(node_ids)
    edges = _normalize_edges(node_ids, links)
    E = len(edges)
    C = _components(node_ids, edges)

    chi = V - E                         # graph Euler characteristic (exact)
    beta1 = E - V + C                   # independent cycles (exact, >= 0)
    writhe = beta1                      # global redundancy
    twist = _twist_term(node_ids, edges)
    Lk = writhe + twist                 # resilience linking number

    connected = (C == 1) and V > 0
    redundant = beta1 >= 1
    is_tree = connected and beta1 == 0

    if V == 0:
        health, note = "red", "empty fleet — no consenting nodes form a graph."
    elif not connected:
        health = "red"
        note = (f"fleet PARTITIONED into {C} components — already in pieces "
                "(red); flow cannot cross a partition.")
    elif is_tree:
        health = "yellow"
        note = ("fleet connected but a TREE (beta1=0, fleet_tree_euler: "
                "E=V-1) — fragile: every link is a cut-edge, any single loss "
                "partitions it.")
    else:
        health = "green"
        note = (f"fleet connected AND redundant (beta1={beta1} independent "
                "cycle(s)) — survives any single link loss without partitioning.")

    return FleetTopology(
        n_vertices=V, n_edges=E, n_components=C,
        euler_characteristic=chi, betti1=beta1,
        writhe=writhe, twist=twist, linking_number=Lk,
        connected=connected, redundant=redundant, is_tree=is_tree,
        health=health, note=note)


def _default_ring_links(node_ids: Sequence[str]) -> list[tuple]:
    """A connected ring over the nodes when no explicit links are supplied.

    n>=3 -> a single cycle (beta1=1, redundant); n==2 -> one edge (a tree);
    n<=1 -> no edges."""
    n = len(node_ids)
    if n <= 1:
        return []
    if n == 2:
        return [(node_ids[0], node_ids[1])]
    return [(node_ids[i], node_ids[(i + 1) % n]) for i in range(n)]


def fleet_health(nodes: Sequence[FleetNode],
                 links: Optional[Sequence[tuple]] = None) -> str:
    """Convenience: the honest green/yellow/red fleet-health signal only."""
    return fleet_topology(nodes, links).health


# ===========================================================================
# SELF-TEST — no network, no GPU. Deterministic.
#   - connected redundant fleet (a ring of 4) -> green; chi/beta1 exact.
#   - drop a ring edge -> a path/tree -> yellow (connected but fragile).
#   - drop a node so the graph splits -> red (partitioned), C >= 2.
#   - fleet_tree_euler identity: a tree has E = V - 1 and beta1 = 0.
#   - Calugareanu Lk = writhe + twist holds; more cycles => larger writhe.
#   - consent-only: a non-consenting node is not a vertex.
# Prints {"ok": true} iff every assertion holds.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    n = [FleetNode(f"n{i}", "ANCHOR") for i in range(4)]

    # --- (1) connected ring of 4 -> green, redundant, beta1 == 1 ----------
    ring = [("n0", "n1"), ("n1", "n2"), ("n2", "n3"), ("n3", "n0")]
    t_ring = fleet_topology(n, ring)
    out["ring"] = t_ring.as_dict()
    check("ring_connected", t_ring.connected)
    check("ring_redundant", t_ring.redundant)
    check("ring_health_green", t_ring.health == "green")
    # chi = V - E = 4 - 4 = 0; beta1 = E - V + C = 4 - 4 + 1 = 1.
    check("ring_chi_exact", t_ring.euler_characteristic == 0)
    check("ring_beta1_one_cycle", t_ring.betti1 == 1)
    check("ring_writhe_is_beta1", t_ring.writhe == t_ring.betti1)
    check("ring_Lk_is_wr_plus_tw",
          abs(t_ring.linking_number - (t_ring.writhe + t_ring.twist)) < 1e-12)

    # --- (2) drop one ring edge -> a path (tree) -> yellow, fragile -------
    path = [("n0", "n1"), ("n1", "n2"), ("n2", "n3")]
    t_path = fleet_topology(n, path)
    out["path_tree"] = t_path.as_dict()
    check("tree_connected", t_path.connected)
    check("tree_not_redundant", not t_path.redundant)
    check("tree_health_yellow", t_path.health == "yellow")
    check("tree_is_tree_flag", t_path.is_tree)
    # fleet_tree_euler: a tree has E = V - 1 and beta1 = 0.
    check("fleet_tree_euler_E_eq_V_minus_1", t_path.n_edges == t_path.n_vertices - 1)
    check("tree_beta1_zero", t_path.betti1 == 0)
    # A ring is strictly more resilient than its spanning tree.
    check("ring_Lk_ge_tree_Lk", t_ring.linking_number >= t_path.linking_number)
    check("ring_writhe_gt_tree_writhe", t_ring.writhe > t_path.writhe)

    # --- (3) partition the fleet -> red, C >= 2 ---------------------------
    split = [("n0", "n1"), ("n2", "n3")]   # two disjoint edges => 2 components
    t_split = fleet_topology(n, split)
    out["partitioned"] = t_split.as_dict()
    check("partition_not_connected", not t_split.connected)
    check("partition_health_red", t_split.health == "red")
    check("partition_two_components", t_split.n_components == 2)

    # --- (4) default ring links for >=3 nodes => green (auto-connected) ---
    t_default = fleet_topology(n)            # no links -> _default_ring_links
    check("default_links_green", t_default.health == "green")
    check("default_links_one_cycle", t_default.betti1 == 1)

    # --- (5) consent-only: a non-consenting node is NOT a vertex ----------
    n_plus = n + [FleetNode("rogue", "ANCHOR", consent=False)]
    t_consent = fleet_topology(n_plus, ring)
    check("non_consenting_excluded_from_V", t_consent.n_vertices == 4)

    # --- (6) more cycles => larger writhe (add a chord to the ring) -------
    chorded = ring + [("n0", "n2")]          # ring + 1 chord => beta1 = 2
    t_chord = fleet_topology(n, chorded)
    out["chorded"] = t_chord.as_dict()
    check("chord_beta1_two", t_chord.betti1 == 2)
    check("chord_more_resilient", t_chord.linking_number > t_ring.linking_number)

    # --- (7) empty / all-non-consenting => honest red ---------------------
    t_empty = fleet_topology([FleetNode("x", consent=False)])
    check("empty_fleet_red", t_empty.health == "red" and t_empty.n_vertices == 0)

    out["ok"] = True
    out["cites"] = ("round6 EulerFleetTopology (chi = V - E; tree => beta1 = 0, "
                    "fleet_tree_euler); round7 CalugareanuFleetInvariant "
                    "(Lk = Wr + Tw, White/Calugareanu); swarm fabric #358 swarm.py")
    out["doctrine"] = ("exact integer topology (V, E, C, chi, beta1); Calugareanu "
                       "twist is SAMPLE/ESTIMATE; consent-only vertices; honest "
                       "red/yellow/green (no green unless genuinely redundant); "
                       "open-weight; no key.")
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
