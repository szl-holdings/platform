---
id: SKT-PERC-005
title: Sim-kit as a kernel-not-engine
disposition: productionised
source: docs/research/perception-bio-synthesis-2026.md §4, §7
package: '@szl-holdings/sim-kit'
receipt-class: cluster.event.v1
---

# SKT-PERC-005 — Sim-kit as a kernel-not-engine

The spherepop sim loop reduces to three independent primitives —
Verlet step, label+radius union-find cluster detection, and a
particle-emitter contract — none of which require a game engine. The
package ships each module independently so React surfaces, WebGPU
shaders, and video artefacts can pull only what they need.

Boundary: cluster events are **receipt-bearing** (`cluster.event.v1`);
particle emissions are **cosmetic** and explicitly NOT receipt-bearing.
The doctrine scanner forbids any source file matching `*.particle*`
from importing `@szl-holdings/szl-receipts`. "Cosmetic effects never
become evidence."

The empirical combo-multiplier curve from the upstream game is not
ported — the synthesis doc flagged this as an open question. Consumers
either supply their own payoff function (monotonicity self-checked by
`sim-kit/scoring`) or use the identity.

**Disposition rationale.** `productionised` once Vessels + ROSIE +
Vessels-Pitch consume the kernel in their integration tasks.
