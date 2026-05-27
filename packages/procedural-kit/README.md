# @szl-holdings/procedural-kit

Procedural part-graph authoring (kitbash-style). The part-graph IS the
ontology of the rendered scene — receipts hash the graph, the renderer
reads the flattened mesh.

## Pipeline

```
Part[]  →  PartLibrary
                ↓
            seed-generator(seed, library, constraints)
                ↓
            Scene  (typed DAG of SceneNode)
                ↓
            openusd-export/from-part-graph(scene)
                ↓
            USD stage  +  scene.composed.v1 receipt
```

## Doctrine rule enforced

**No scene without seed.** Visual surfaces that reference a procedural
scene must link to a `scene.composed.v1` receipt. The doctrine scanner
flags any surface that imports a part-graph without the matching
receipt.

## Worked example

```ts
import { generate, bomOf, partGraphHash, makePartLibrary } from '@szl-holdings/procedural-kit';
import { createHash } from 'node:crypto';

const library = makePartLibrary('terminal-v1', [/* parts */]);
const scene = generate(20260527, library, { rootTag: 'terminal', maxDepth: 4, fillProbability: 0.8 });
const hash = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');
const sceneHash = partGraphHash(scene, hash);
const bom = bomOf(scene); // { 'tank-large': 4, 'jetty': 2, ... }
```

## Source provenance

Authoring pattern re-expressed (not copied) from
`github.com/standardgalactic/kitbash`. The UV-unwrap strategy is
documented as an open question in the synthesis doc; this package does
not bake in a strategy — it ships only the part-graph shape, and
`openusd-export/from-part-graph` picks the strategy at export time.

## Consumers

| Artifact         | Use                                                 |
|------------------|-----------------------------------------------------|
| Vessels          | Dorian-LPG terminal scene, BOM panel                |
| Vessels-Pitch    | Reproducible investor-grade scenes                  |
| ROSIE            | Decision Theater 3-D actor placement                |
| Amaru            | Sync-envelope topology visualised as a scene        |

See [`docs/research/perception-bio-synthesis-2026.md`](../../docs/research/perception-bio-synthesis-2026.md) §5.
