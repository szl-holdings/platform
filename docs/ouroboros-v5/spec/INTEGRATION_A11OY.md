# A11oy Integration

A11oy is the orchestrator. It opens loops, fans them out across agents,
and closes them. Horizon gives A11oy five new signals that turn it from
a request router into an information-theoretic governor.

---

## What changes

Before Horizon:
- A11oy decides to split or merge based on request count + p95 latency.
- Cross-loop dependencies are hand-coded edges in a static graph.
- Loop close is "the last agent returned."
- Audit relies on the agent's self-report.

After Horizon:
- Split/merge decision driven by capacity-horizon margin (`recommendFromHorizon`).
- Cross-loop edges discovered empirically (`buildEntanglementGraph`).
- Loop close requires Page-curve cleanliness (`PageCurveResult.clean`).
- Audit is dual-witness with mathematical non-contradiction proof.

---

## Drop-in code

Open a loop:

```ts
import {
  PageCurveTracker, WitnessChain, asLoopId,
  computeCapacityHorizon, recommendFromHorizon,
  HorizonOtelBridge,
} from "@workspace/horizon";

const loopId = asLoopId(`a11oy:${surface}:${invocationId}`);
const tracker = new PageCurveTracker(loopId, { epsilon: 0.05 });
const internal = new WitnessChain("internal");
const external = new WitnessChain("external");
const bridge = new HorizonOtelBridge();
const span = bridge.startLoopSpan({
  loopId,
  agentName: agent.name,
  agentId: agent.id,
  systemProvider: agent.provider, // "perplexity", "openai", ...
});
```

Per tick:

```ts
tracker.observe(tick, project(loopState), project(envState));
// internal witness — agent's own trace
internal.append({ tick, kind: "reasoning", payload, externallyObservable: false });
// external witness — auditor process records this independently
external.append({ tick, kind: "tool_call", payload, externallyObservable: true });
```

At close:

```ts
import {
  computeNoHair, verifyDualWitness, attachAllHorizon, computeCapacityHorizon,
  recommendFromHorizon,
} from "@workspace/horizon";

const pageCurve = tracker.close();
const dual = verifyDualWitness({ internal, external });
const capacity = computeCapacityHorizon(loopId, {
  boundaryCardinality: integrationPoints.size,
  throughputPerSec: rateMeter.rate,
});
const recommendation = recommendFromHorizon(capacity, tracker.current());
const noHair = computeNoHair({
  work, obligations, inputDistribution, tier, witnessChain: internal.toArray(),
});

attachAllHorizon(bridge, span, {
  pageCurve, dualWitness: dual, noHair,
  capacity: { reading: capacity, observedBitsPerTick: tracker.current(), recommendation },
});
span.end();

if (!pageCurve.clean) emit("a11oy.dirty_close", { loopId, residual: pageCurve.residualEntropy });
if (!dual.consistent) emit("a11oy.complementarity_violation", { loopId, orphans: dual.orphanedClaims });
if (recommendation === "SPLIT") scheduler.split(loopId);
if (recommendation === "MERGE") scheduler.markCandidateForMerge(loopId);
```

---

## Cross-loop graph

Once per scheduling epoch (e.g. 60 s):

```ts
import { buildEntanglementGraph, checkEntanglementGuards } from "@workspace/horizon";

const samples: Map<LoopId, ObservableSample[]> = collectSamplesFromLastEpoch();
const edges = buildEntanglementGraph(samples);
const violations = checkEntanglementGuards(edges, {
  expectedDecoupled: registry.expectedDecoupled(),
  expectedCoupled: registry.expectedCoupled(),
});
if (violations.length) emit("a11oy.topology_violation", { violations });
scheduler.updateAffinity(edges); // route coupled pairs to the same shard
```

---

## Migration plan (4 steps)

1. **Shadow-mode** — emit Horizon attributes on every span without changing
   any decision logic. Verify dirty-close rate and complementarity-violation
   rate match expectations on production traffic. ~1 sprint.
2. **Inform-only scheduler** — let the existing scheduler run, but log
   each split/merge decision side-by-side with the Horizon recommendation.
   Measure agreement and quality delta on the disagreements. ~1 sprint.
3. **Horizon-led splits** — promote `recommendation === "SPLIT"` to a
   hard scheduler signal. Keep merges informational. ~1 sprint.
4. **Full cutover** — Horizon recommendation is the scheduling signal.
   Page-curve cleanliness becomes a release-gate metric. ~1 sprint.

Total: 4 sprints from drop-in to full adoption. No data migrations, no
schema changes outside the OTel attribute namespace.
