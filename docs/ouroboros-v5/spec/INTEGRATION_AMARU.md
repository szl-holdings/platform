# Amaru Integration

Amaru is the deterministic replay & forensic surface. It reconstructs
past loop executions from witness chains and policy decisions. Horizon
gives Amaru the missing primitive: a mathematical certificate that the
replay is faithful.

---

## What changes

Before Horizon:
- Amaru replays from event logs. Confidence in the replay is "we logged
  every event we knew to log."
- Detecting that a replay diverged from the original requires comparing
  outputs, which can fail silently when outputs are stochastic.

After Horizon:
- Amaru can compare two no-hair states for equivalence (`noHairEquivalent`):
  if they match, the loops are operationally identical regardless of any
  internal differences.
- Amaru can reconstruct the Page curve from witness chains and verify
  the same `PageCurveResult.clean` and `pageEntropy` values are reproduced.
- Dual-witness verification is itself the replay invariant: if the
  internal and external chains both verify and the consistency theorem
  holds, the replay is mathematically faithful.

---

## Drop-in code

```ts
import {
  WitnessChain, verifyDualWitness, computeNoHair, noHairEquivalent,
  PageCurveTracker, asLoopId,
} from "@workspace/horizon";

interface ReplayInput {
  loopId: string;
  internalEntries: WitnessEntryPayload[];
  externalEntries: WitnessEntryPayload[];
  observableSamples: { tick: number; loopState: string; envState: string }[];
  closedNoHair: NoHairState;
}

function replay(input: ReplayInput): ReplayVerdict {
  const internal = restoreChain("internal", input.internalEntries);
  const external = restoreChain("external", input.externalEntries);

  // Step 1: chain integrity.
  if (!internal.verify() || !external.verify()) {
    return { ok: false, reason: "chain_integrity_broken" };
  }

  // Step 2: dual-witness consistency.
  const dual = verifyDualWitness({ internal, external });
  if (!dual.consistent) {
    return { ok: false, reason: "complementarity_violation", dual };
  }

  // Step 3: Page-curve reconstruction.
  const tracker = new PageCurveTracker(asLoopId(input.loopId));
  for (const s of input.observableSamples) {
    tracker.observe(s.tick, s.loopState, s.envState);
  }
  const pc = tracker.close();
  if (!pc.clean) return { ok: false, reason: "dirty_close", pc };

  // Step 4: no-hair equivalence to the original closed state.
  const replayedNoHair = computeNoHair({
    work: deriveWork(internal),
    obligations: deriveObligations(internal),
    inputDistribution: deriveInputDistribution(input.observableSamples),
    tier: input.closedNoHair.tier,
    witnessChain: internal.toArray(),
  });
  if (!noHairEquivalent(replayedNoHair, input.closedNoHair)) {
    return { ok: false, reason: "no_hair_mismatch", replayedNoHair };
  }

  return { ok: true };
}
```

---

## Forensic queries Horizon enables

1. *"Show me every loop in the last 24 h that closed dirty."*
   `WHERE ouroboros.horizon.page_curve.clean = false`

2. *"Show me every agent invocation where the agent's reasoning trace
   claimed an external action that the auditor never observed."*
   `WHERE ouroboros.horizon.dual_witness.consistent = false`

3. *"Find loop pairs that are entangled above 0.5 bits but were
   declared decoupled in the topology registry."*
   Cross-join entanglement-edge events with the static registry.

4. *"Identify the 10 loops most consistently above their capacity
   horizon for the last week — these are the candidates to split."*
   `WHERE ouroboros.horizon.capacity.recommendation = "SPLIT"` group by loop.

These were not previously expressible. They become possible because
Horizon attaches the right scalar to every span.

---

## Replay-as-DOI

Each loop's no-hair string is a permanent, citable identifier of that
closure: `nohair/v1|mass=…|charge=…|spin=…|tier=…|hash=…`. Two artifacts
with the same no-hair string are interchangeable for any downstream
purpose. This is the missing piece for cross-environment audit:
production and staging produce different timestamps, different latencies,
different request IDs — but if they produce the same no-hair string, the
loops are equivalent at the only level that matters operationally.
