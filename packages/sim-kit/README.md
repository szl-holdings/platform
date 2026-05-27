# @szl-holdings/sim-kit

Dependency-free sim kernel. Four independent modules — use whichever
fits the consumer surface:

| Module             | What                                                   |
|--------------------|--------------------------------------------------------|
| `verlet-step`      | One step of Verlet integration with collision projection |
| `cluster-detect`   | Union-find connected components over `label + radius` |
| `emitter-contract` | Typed `ClusterEvent` → `ParticleEmission` shapes (no impl) |
| `scoring`          | Monotone-checked `score(history, f)`                  |

## Doctrine boundary

- `ClusterEvent` is the **receipt-bearing** object (`cluster.event.v1`).
- `ParticleEmission` is **cosmetic** and explicitly NOT receipt-bearing.
  The doctrine scanner forbids any source file matching `*.particle*`
  from importing `@szl-holdings/szl-receipts`.

## Source provenance

Architecture re-expressed (not copied) from
`github.com/standardgalactic/spherepop` (license: upstream). The empirical
combo-multiplier curve from the upstream game is **not** ported — the
synthesis doc flags it as an open question; consumers either pick a
monotone payoff or supply one explicitly through `score()`.

## Consumers

| Artifact         | Use                                                      |
|------------------|----------------------------------------------------------|
| Vessels          | Port-cluster sim + cluster-event panel                   |
| Vessels-Pitch    | Live AIS-driven physics surface (no canned animation)    |
| ROSIE            | Decision Theater event-marker particles                  |
| video-js scenes  | Explainer animations                                     |

See [`docs/research/perception-bio-synthesis-2026.md`](../../docs/research/perception-bio-synthesis-2026.md) §4.
