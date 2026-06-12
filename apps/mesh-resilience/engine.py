"""
SZL Mesh Resilience Study — engine.py
=====================================
REAL, deterministic computation. Inspired by the relational-graph lens of
You/Leskovec/He/Xie (arXiv:2007.06559): treat the SZL UDS organ mesh as a
graph and study how its TOPOLOGY (clustering coefficient C, average path
length L) relates to a DEFINED resilience metric.

HONESTY (doctrine v11):
- This produces MEASURED/SIMULATED data, NOT a proven law. "Topology shapes
  mesh resilience" stays an OPEN hypothesis. We label everything SAMPLE.
- The resilience metric is a concrete, reproducible simulation of corroboration-
  quorum survival under f Byzantine organs (tied to mesh Spec 04 + Conjecture 2,
  which itself stays open). No claim of BFT safety.
- Pure stdlib; deterministic given the topology set. No network, no model calls.

Resilience metric (defined, not asserted):
  For a connected graph G on n organs, a "corroboration quorum" forms when a
  decision organ can reach >= ceil((n+1)/2) HONEST organs over edges that avoid
  any single Byzantine organ. We compute, over all size-f subsets of Byzantine
  organs, the fraction of (source organ) x (Byzantine subset) cases where the
  honest super-majority is still reachable. That fraction in [0,1] is the
  resilience score R_f. We report R_1 (single Byzantine organ) by default.
"""
from itertools import combinations, product
import json, math


def all_pairs(n):
    return list(combinations(range(n), 2))


def neighbors(n, edges):
    adj = {i: set() for i in range(n)}
    for a, b in edges:
        adj[a].add(b); adj[b].add(a)
    return adj


def is_connected(n, edges):
    adj = neighbors(n, edges)
    seen = {0}; stack = [0]
    while stack:
        v = stack.pop()
        for u in adj[v]:
            if u not in seen:
                seen.add(u); stack.append(u)
    return len(seen) == n


def clustering_coefficient(n, edges):
    """Average local clustering coefficient C (Watts-Strogatz), [0,1]."""
    adj = neighbors(n, edges)
    total = 0.0
    counted = 0
    for v in range(n):
        nb = list(adj[v])
        k = len(nb)
        if k < 2:
            continue
        links = sum(1 for a, b in combinations(nb, 2) if b in adj[a])
        total += (2.0 * links) / (k * (k - 1))
        counted += 1
    return (total / counted) if counted else 0.0


def avg_path_length(n, edges):
    """Average shortest-path length L over all pairs (BFS). Inf if disconnected."""
    adj = neighbors(n, edges)
    tot = 0; cnt = 0
    for s in range(n):
        dist = {s: 0}; q = [s]
        while q:
            nq = []
            for v in q:
                for u in adj[v]:
                    if u not in dist:
                        dist[u] = dist[v] + 1; nq.append(u)
            q = nq
        for t in range(n):
            if t != s and t in dist:
                tot += dist[t]; cnt += 1
    return (tot / cnt) if cnt else float("inf")


def reachable_avoiding(n, edges, src, blocked):
    """Set of organs reachable from src over edges that don't touch `blocked`."""
    if src in blocked:
        return set()
    adj = neighbors(n, edges)
    seen = {src}; stack = [src]
    while stack:
        v = stack.pop()
        for u in adj[v]:
            if u not in blocked and u not in seen:
                seen.add(u); stack.append(u)
    return seen


def resilience_score(n, edges, f=1):
    """
    R_f in [0,1]: over all honest source organs and all size-f Byzantine
    subsets, the fraction where the source still reaches an honest
    super-majority (>= ceil((n+1)/2) honest organs, excluding Byzantines).
    """
    need = math.ceil((n + 1) / 2)
    ok = 0; tot = 0
    for byz in combinations(range(n), f):
        byz = set(byz)
        honest = [v for v in range(n) if v not in byz]
        for src in honest:
            reach = reachable_avoiding(n, edges, src, byz)
            honest_reached = len(reach - byz)  # src counts itself
            tot += 1
            if honest_reached >= need:
                ok += 1
    return (ok / tot) if tot else 0.0


def sweep(n, max_graphs=4000):
    """
    Enumerate connected graphs on n labeled organs (sampling edge-subsets),
    compute (C, L, R_1, R_2). Deterministic given n. Returns list of records.
    """
    pairs = all_pairs(n)
    m = len(pairs)
    records = []
    # Enumerate over all edge bitmasks for small n; cap for larger n.
    limit = 1 << m
    step = 1 if limit <= max_graphs else max(1, limit // max_graphs)
    seen_topo = set()
    for mask in range(0, limit, step):
        edges = [pairs[i] for i in range(m) if (mask >> i) & 1]
        if len(edges) < n - 1:
            continue
        if not is_connected(n, edges):
            continue
        key = tuple(sorted(edges))
        if key in seen_topo:
            continue
        seen_topo.add(key)
        C = round(clustering_coefficient(n, edges), 4)
        L = round(avg_path_length(n, edges), 4)
        R1 = round(resilience_score(n, edges, f=1), 4)
        R2 = round(resilience_score(n, edges, f=2), 4) if n >= 5 else None
        records.append({"edges": edges, "n_edges": len(edges),
                        "C": C, "L": L, "R1": R1, "R2": R2})
    return records


# The canonical SZL 5-organ mesh: a11oy(4) hub-to-all + ring 0-1-2-3-0.
ORGANS = ["sentra", "amaru", "rosie", "killinchu", "a11oy"]
SZL_EDGES = [(4, 0), (4, 1), (4, 2), (4, 3),  # hub
             (0, 1), (1, 2), (2, 3), (3, 0)]  # corroboration ring


def szl_mesh_record():
    n = 5
    return {
        "name": "SZL canonical 5-organ mesh",
        "organs": ORGANS,
        "edges": SZL_EDGES,
        "C": round(clustering_coefficient(n, SZL_EDGES), 4),
        "L": round(avg_path_length(n, SZL_EDGES), 4),
        "R1": round(resilience_score(n, SZL_EDGES, f=1), 4),
        "R2": round(resilience_score(n, SZL_EDGES, f=2), 4),
    }


if __name__ == "__main__":
    n = 5
    recs = sweep(n)
    szl = szl_mesh_record()
    out = {
        "doctrine": "v11",
        "honesty": "MEASURED/SIMULATED data. 'Topology shapes resilience' is an "
                   "OPEN hypothesis, NOT a theorem, NOT locked. BFT safety = "
                   "Conjecture 2 (open). Labels: SAMPLE.",
        "inspired_by": "arXiv:2007.06559 (Graph Structure of Neural Networks, ICML 2020)",
        "n_organs": n,
        "n_connected_topologies": len(recs),
        "szl_canonical_mesh": szl,
        "metric_defs": {
            "C": "average local clustering coefficient (Watts-Strogatz), [0,1]",
            "L": "average shortest-path length over all organ pairs",
            "R1": "fraction of (source, single-Byzantine) cases where an honest "
                  "super-majority stays reachable (resilience to 1 bad organ)",
            "R2": "same, two Byzantine organs",
        },
        "sample_records": recs[:200],
    }
    with open("sweep_results.json", "w") as fh:
        json.dump(out, fh, indent=2)
    print(json.dumps({"n_topologies": len(recs), "szl": szl}, indent=2))
