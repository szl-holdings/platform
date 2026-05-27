---
id: SKT-PERC-004
title: Procedural-kit as ontology surface
disposition: try-again
source: docs/research/perception-bio-synthesis-2026.md §5, §7
package: '@szl-holdings/procedural-kit'
receipt-class: scene.composed.v1
---

# SKT-PERC-004 — Procedural-kit as ontology surface

The kitbash part-graph turns scenes into **typed ontology objects**: a
scene is a DAG of `(partId, transform, slotBindings)` nodes, not a
baked mesh. The downstream pipeline (USD export, instance counting,
BOM) reads the graph; the renderer reads a flattened mesh derived from
it. AGI synthesis did not address scene authoring.

Doctrine consequence: visual surfaces that reference a procedural
scene must link to a `scene.composed.v1` receipt — *no scene without
its seed*. The doctrine scanner check that enforces this lives in the
Vessels integration task.

**Disposition rationale.** `try-again` after Vessels-Pitch consumes the
package once; if the deterministic seed reproduces the investor-grade
scene cleanly, promote to `productionised`.
