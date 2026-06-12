# SZL Mesh-Resilience Findings

**Study type:** Measured / simulated topology sweep. Doctrine v11 (locked = 8). **Honesty label: SAMPLE.** Inspired by *Graph Structure of Neural Networks* (You, Leskovec, He & Xie, arXiv:2007.06559, ICML 2020).

**Data basis:** All 728 connected 5-organ topologies over the organs `{sentra, amaru, rosie, killinchu, a11oy}`, each scored on clustering coefficient C ∈ [0,1], average shortest-path length L ∈ [1.0, 2.0], and Byzantine resilience R1 (one bad organ) and R2 (two bad organs), where Rk is the fraction of (source, Byzantine-subset) cases in which an honest super-majority stays reachable.

---

## 1. Headline finding

Across the full enumeration of 728 topologies, **topology measurably shapes Byzantine resilience, and short paths are the dominant lever.** The strongest single relationship in the dataset is between average path length and two-Byzantine resilience: corr(L, R2) = **−0.947**. Edge count tracks resilience almost as tightly (corr(edges, R2) = **+0.921**), and clustering contributes a weaker positive signal (corr(C, R2) = **+0.533**). Resilience to one Byzantine organ is high on average (R1_mean = **0.898**) and degrades the same way (corr(L, R1) = **−0.865**), but the harder two-fault regime is far more discriminating: R2_mean = **0.615**, and only **26 of 728** topologies (≈3.6%) achieve perfect R2 = 1.0. The picture is consistent and directional: shorter, denser, more redundant meshes survive faults better — but perfect two-fault resilience is rare and does not come for free.

## 2. The C and L relationship to resilience

The data orders the three structural predictors cleanly. **Path length is the primary driver** (|corr| = 0.947 for R2, 0.865 for R1): every additional hop a message must traverse is another place a Byzantine organ can sit astride the only route, so collapsing L toward 1.0 removes single points of interception. **Edge count is essentially a proxy for redundancy** (corr = 0.921), and **clustering helps only secondarily** (corr = 0.533): triangles supply alternate two-hop paths, which matter once direct links are cut, but a high-C topology with long average paths still loses on R2. Clustering is a useful tie-breaker, not the main effect.

This **diverges from the source paper's headline**, and that divergence is worth stating plainly. In You et al. (2007.06559), neural-network *accuracy* peaks in a relational-graph "sweet spot" of intermediate clustering and intermediate path length — neither extreme is best. Our resilience metric shows **no such interior optimum**: R2 improves monotonically as L falls and as edges/C rise, with L dominating. The two studies optimize different objectives (predictive accuracy of a trained network vs. fault-tolerant reachability of a message mesh), so there is **no reason to expect the NN sweet-spot to carry over, and our data confirms it does not.** Borrowing the paper's graph-structure lens was generative; borrowing its conclusion would be an error.

## 3. Where the SZL canonical mesh sits

The SZL canonical mesh — `a11oy` (organ 4) as a hub to all four others, plus the `sentra–amaru–rosie–killinchu` ring (8 edges) — scores **C = 0.667, L = 1.2, R1 = 1.0, R2 = 1.0.** It is one of the 26 perfect-R2 topologies, and it is in the **cheapest such class: the minimum edge count that achieves R2 = 1.0 is exactly 8, which is what SZL uses.** The mesh is therefore a *minimal-cost, perfectly-2-Byzantine-resilient* design under this metric.

The structural reason is legible and matches Section 2. The **hub gives short paths** — every organ reaches every other in one or two hops, pulling L down to 1.2 and pushing R1 to a clean 1.0. The **ring gives redundancy** — when as many as two organs go Byzantine, the ring supplies an alternate path around the failures that the hub alone could not guarantee, which is what carries R2 across the line to 1.0. Hub-for-latency plus ring-for-redundancy is precisely the combination the correlations predict should win: low L first, supporting redundancy second. SZL is not merely *a* good point in the space; it sits at the efficient frontier of it.

## 4. What this does NOT prove

This is the critical section, and the limits are firm:

- **This is measured/simulated data on one defined metric, not a theorem.** R1/R2 are reachability fractions over enumerated fault subsets, not a proof about any specific protocol's behavior.
- **It is not BFT safety.** Byzantine-fault-tolerant *safety* remains **Conjecture 2 (open)**. Reachability of an honest super-majority is necessary-flavored intuition, not a safety guarantee; nothing here closes that conjecture.
- **It does not transfer the neural-network accuracy result.** As Section 2 shows, the source paper's sweet-spot does not even hold for our own resilience metric, let alone for accuracy of anything SZL runs.
- **"Topology shapes mesh resilience" remains an OPEN hypothesis** — now with supporting measured evidence at n = 5 organs, 728 topologies, but still a hypothesis. It is **not locked.** Doctrine v11 stands: **locked = 8, Λ = Conjecture 1, BFT = Conjecture 2.**
- **Scope is n = 5.** The correlations are observed on five organs only; their magnitude or even sign at larger n is untested.

## 5. Actionable recommendation

When the mesh grows to a 6th organ, **optimize for the two structural properties that the data shows actually drive resilience, in order:**

1. **Preserve short average path length first.** Keep the hub topology: the new organ should attach to `a11oy` (or whatever node carries the hub role) so that L stays near its floor. This is the highest-leverage move (corr(L, R2) = −0.947).
2. **Preserve 8-edge-class redundancy second.** Extend the ring through the new organ rather than leaving it as a leaf, so that two-fault alternate paths still exist. Re-run the R2 sweep on the 6-organ space and select from the minimum-edge perfect-R2 class, mirroring how the 5-organ canonical mesh was chosen.
3. **Treat clustering as a tie-breaker, not a target** — prefer the configuration with more closing triangles only among options already tied on L and redundancy.
4. **Re-derive, do not assume.** Because results are validated only at n = 5, recompute R1/R2 for any 6-organ candidate before adopting it; do not extrapolate the 8-edge constant or the correlations to the larger graph.

In short: keep the hub-plus-ring shape that made the 5-organ mesh a minimal-cost perfect-R2 topology, verify the property holds after expansion, and continue to treat "topology shapes resilience" as a supported but open hypothesis under Doctrine v11.
