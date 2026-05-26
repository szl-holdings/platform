# Ingestion notes — graph viz & dependency mapping

Study of three mature bodies of upstream work on large-graph layout,
package-dependency rendering, and graph-ML for agent topologies. **No
code was copied.** Each entry below names what was *read*, the license
governing the source, and the durable idea we re-derived in our own
implementation. Where the idea has been landed in A11oy already, that is
noted; everything else is queued in *Proposed follow-ups*.

---

## Sources surveyed

### 1. anvaka — `ngraph.*` family and `pm.anvaka.com`

- **URLs:**
  - https://github.com/anvaka/ngraph
  - https://github.com/anvaka/ngraph.forcelayout
  - https://github.com/anvaka/ngraph.quadtreebh3d (Barnes-Hut)
  - https://github.com/anvaka/VivaGraphJS
  - https://github.com/anvaka/pm (npm package dependency visualizer)
- **License:** MIT (per repo `LICENSE` files; we re-derived patterns,
  we did not vendor source).
- **Ideas extracted (re-derived, not copied):**
  1. **Fruchterman-Reingold with cooling.** Repulsion is `k²/d`,
     attraction along edges is `d²/k`, displacement is clamped to a
     temperature that decays multiplicatively each frame. This is the
     simplest energy model that produces stable, readable layouts for
     dozens–hundreds of nodes without external libraries.
  2. **Barnes-Hut quadtree for repulsion at scale.** The naive O(n²)
     pairwise repulsion becomes O(n log n) once a quadtree groups
     distant nodes into a single approximated center of mass. We do
     *not* need this at our current node count (<50) but the contract
     of the simulation function is designed so it can be swapped in.
  3. **Edge-weight modulated spring strength** (from `pm.anvaka.com`):
     dependencies with more downstream weight pull harder. Visually
     this surfaces the "load-bearing" connections of a dependency
     graph without any extra UI affordance.
  4. **Level-of-detail labels.** `pm` only renders package names for
     the focal node and its immediate neighborhood; the rest are dim
     glyphs. This keeps a 10k-node viewport legible. We apply the
     same idea at our scale by enlarging the focal label and muting
     non-adjacent labels.
  5. **Focal-subgraph highlighting on hover.** Hover dims everything
     not in the 1-hop neighborhood. The eye locks onto the relevant
     subgraph instantly — a far better debugging affordance than a
     side panel.
  6. **User-driven reheat.** Dragging a node re-injects temperature
     so the layout settles around the new constraint rather than
     remaining frozen.

### 2. JiaxuanYou — GraphGym / GNN design space / position-aware GNNs

- **URLs:**
  - https://github.com/snap-stanford/GraphGym (Jiaxuan You et al.)
  - https://arxiv.org/abs/2011.08843 — *Design Space for Graph Neural Networks*
  - https://arxiv.org/abs/1906.04817 — *Position-aware Graph Neural Networks*
  - https://arxiv.org/abs/2006.10141 — *Identity-aware GNNs*
- **License:** MIT (GraphGym repo); papers are open-access preprints.
- **Ideas extracted (re-derived, not copied):**
  1. **Structural features deserve visual encoding.** GraphGym treats
     node degree, clustering coefficient, and PageRank as first-class
     design knobs. We re-derived the lightest of these — *degree
     centrality* — and bound it to node radius. The visual now tells
     an operator at a glance which agent is most-connected.
  2. **Local-neighborhood reasoning beats global summary.** Most GNN
     wins come from message passing over a node's k-hop neighborhood,
     not the whole graph. Our hover/select interaction mirrors that:
     it surfaces the 1-hop subgraph the operator actually needs in the
     moment, rather than asking them to read the whole topology.
  3. **Design-space thinking.** Rather than hand-picking a single
     "right" layout, GraphGym treats layout/encoding as a search
     space. We adopt this stance in the synthesis doc: each idea
     below is mapped to the surface where it has the highest payoff
     instead of being applied uniformly.
  4. **Position-aware features generalize across topology changes.**
     A11oy's agent network grows; relying on absolute positions (as
     the old `AgentTopology` did with hand-coded `x/y`) breaks the
     instant agents are added or removed. Force-directed layouts are
     position-aware by construction and remain readable as the mesh
     evolves.

### 3. ulab-uiuc — agent benchmarking and multi-agent topology

- **URLs:**
  - https://github.com/ulab-uiuc (lab index)
  - https://github.com/ulab-uiuc/AgentRefine
  - https://github.com/ulab-uiuc/GoR (Graph of Records)
  - https://arxiv.org/abs/2402.16823 — agent topology / multi-agent
    coordination work referenced by the lab
- **License:** MIT / Apache-2.0 across the lab's repos.
- **Ideas extracted (re-derived, not copied):**
  1. **Multi-agent systems are graphs, and the topology itself is a
     design choice.** ulab-uiuc's writing frames agent meshes as
     optimizable graphs (who talks to whom, with what edge weight).
     Our handoff-volume edges materialize this: the picture *is* the
     coordination policy, not a decoration on top of it.
  2. **Edges carry semantics, not just adjacency.** Each handoff has
     a trigger condition and a frequency. We attach both as edge
     data (`weight`, `label`), and weight modulates both spring force
     and visual stroke — the picture reflects the policy.
  3. **Evaluator-on-the-side topology.** Across ulab-uiuc's
     multi-agent work, a consistent pattern is a dedicated evaluator
     node receiving feeds from every executor. We color-code the
     `evaluator` role distinctly (MirrorEval) so the operator can
     verify by eye that every executor has an eval edge.

---

## Idea → page mapping

| Idea | Most-impacted A11oy page | Why |
| --- | --- | --- |
| Fruchterman-Reingold layout w/ cooling | `AgentViz` (AgentTopology) | Replaces hand-coded `x/y` with a layout that scales as the mesh grows. **Landed in this task.** |
| Degree-weighted node radius | `AgentViz` (AgentTopology) | Centrality is the single most useful structural signal for an operator. **Landed in this task.** |
| Edge-weight modulated spring | `AgentViz` (AgentTopology) | Surfaces the load-bearing handoffs visually. **Landed in this task.** |
| Focal-subgraph highlight on hover | `AgentViz` (AgentTopology) | Best debugging affordance for "what touches X?" **Landed in this task.** |
| LOD labels (focus-only emphasis) | `AgentViz` (AgentTopology) | Keeps the picture legible as agent count grows. **Landed in this task.** |
| Drag-to-reheat interaction | `AgentViz` (AgentTopology) | Lets operators perturb the layout to disambiguate overlaps. **Landed in this task.** |
| Force-directed dependency graph from BOM data | `AgentBom` | Today the dependency graph is a flex-wrap of pills. The BOM has true `dependencyGraph` + `toolManifest` edges that would benefit from the same layout engine. *(follow-up)* |
| Edge-weight = call volume from real MCP traffic | `AgentMesh` (MCP servers / Connector Firewall view) | The MCP bus has actual per-tool call counts; rendering it as a weighted graph surfaces hotspots and would expose underused servers. *(follow-up)* |
| Role-colored multi-agent topology with evaluator-on-the-side pattern | `AgentOrchestration` (handoffs tab) | The handoffs tab today is a flat list. The same force-directed view, colored by role, would make the "every executor → MirrorEval" invariant visible at a glance. *(follow-up)* |
| Barnes-Hut quadtree repulsion | `AgentViz` / `AgentBom` once node count exceeds ~80 | Current O(n²) is fine for the demo mesh. If a real customer mesh reaches ~100+ agents/tools, swap in Barnes-Hut without changing call sites. *(follow-up)* |
| Position-aware features as design knobs (GraphGym lens) | `ArchitectureOverview` | Today the 11 architecture components are presented as cards; rendering them in a force-directed layout with category-colored clusters would make the principle-to-component mapping clickable and live. *(lower priority follow-up)* |

---

## What was landed in this task

- `artifacts/a11oy/src/pages/AgentViz.tsx` — `AgentTopology` component
  rewritten from a static, hand-coordinated SVG into a real
  Fruchterman-Reingold force-directed simulation with:
  - Degree-weighted node radii
  - Edge-weight modulated spring strength
  - Hover/select focal-subgraph highlighting
  - LOD labels (focal node enlarged, off-focus muted)
  - Drag-to-reheat interaction (pointer-captured)
  - Cooling temperature so the layout settles and stops painting
  - Role color encoding (realtime / specialist / evaluator / system)
  - Legend + on-focus neighbor readout strip

No third-party graph libraries were added — the simulation is a
~50-line re-derivation tuned for the current viewBox and node count,
with an explicit hand-off documented in code comments for swapping in
Barnes-Hut if/when the node count climbs.

## Proposed follow-ups (one per most-impacted page)

1. **AgentBom — render `dependencyGraph` + `toolManifest` as a real
   force-directed graph.** Today both are pill lists; the BOM has
   genuine edges and would benefit immediately. Highest leverage.
2. **AgentMesh — wire the MCP tool-call ledger into a weighted
   server-tool graph in the "MCP" subtab.** The data already lives in
   the runtime; the visualization would surface hotspots and dead
   servers.
3. **AgentOrchestration — replace the flat handoffs list with the
   same force-directed view, colored by role, so the "every executor
   → MirrorEval" invariant is visible at a glance.**

Each of these can be landed in a small follow-up task that reuses the
simulation code factored out of `AgentViz.tsx` (extraction itself is
part of the follow-up — keep `AgentViz` as the reference implementation
until a second consumer appears, per the "rule of three" for premature
abstraction).

---

## License-respect statement

All three upstream bodies of work are under permissive licenses
(MIT / Apache-2.0), but the goal of this ingestion exercise was
*re-derivation of ideas*, not vendoring or porting code. No file,
function, or test from any of the surveyed repositories was copied,
adapted line-for-line, or translated. The implementation in
`artifacts/a11oy/src/pages/AgentViz.tsx` is original code written
against the techniques described in the literature.
