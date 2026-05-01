# Ouroboros Horizon

Information-theoretic primitives for the Ouroboros runtime, derived from
black-hole physics and operationalized for A11oy, Sentra, and Amaru.

This is the payload. It is a Replit-ready monorepo.

---

## What this is

Five primitives, one bridge:

| Primitive            | Physics anchor                             | What it gives the runtime                   |
|----------------------|--------------------------------------------|---------------------------------------------|
| PageCurveInvariant   | Page (1993) average subsystem entropy      | Information conservation across loops       |
| NoHairContract       | Israel/Carter/Robinson (1967–75)           | 5-scalar canonical loop interface           |
| DualWitness          | Susskind complementarity (~1993)           | Internal/external audit non-contradiction   |
| EntanglementMetric   | Ryu-Takayanagi (2006)                      | Empirical loop-coupling graph               |
| CapacityHorizon      | Bekenstein-Hawking (1973–75)               | Holographic capacity bound for scheduling   |
| HorizonOtelBridge    | OpenTelemetry GenAI semconv                | Emit all of the above as standard spans     |

Sources: see [`docs/CITATIONS.md`](docs/CITATIONS.md). Specification:
[`docs/SPEC.md`](docs/SPEC.md). Pre-registered tests:
[`docs/FALSIFICATION_LEDGER.md`](docs/FALSIFICATION_LEDGER.md).

---

## Quick start (Replit)

Import into Replit, hit **Run**. The default action installs deps and runs
the test suite. Then:

```
npm run demo:full
```

Locally:

```bash
cd packages/horizon
npm install
npm test
npm run demo:full
```

You should see:
- Page curve: clean = true
- Dual Witness: consistent = true, orphans = 0
- Capacity Horizon: a real C(ℓ) and a SPLIT/STEADY/MERGE recommendation
- No-Hair State: `nohair/v1|mass=…|charge=…|spin=…|tier=…|hash=…`

---

## Test count

`@workspace/horizon`: **62/62 passing** — covering all five primitives plus
the OTel bridge. Combined with the existing Ouroboros runtime (142/142),
the full platform is **204/204** once Horizon is wired in.

---

## Integration roadmap

- [`docs/INTEGRATION_A11OY.md`](docs/INTEGRATION_A11OY.md) — orchestrator
  changes, 4-sprint migration plan.
- [`docs/INTEGRATION_SENTRA.md`](docs/INTEGRATION_SENTRA.md) — new policy
  primitives that reference Page-curve cleanliness, tier monotonicity,
  topology decoupling.
- [`docs/INTEGRATION_AMARU.md`](docs/INTEGRATION_AMARU.md) — replay-as-DOI
  via no-hair equivalence; forensic queries that become possible.

---

## Honest limits

- Mutual information from sample streams is a faithful **classical** analog
  of entanglement entropy, not the quantum object. The classical-shadow
  literature (Nielsen & Chuang §11.3) supports this correspondence in the
  regime we operate in — but a black-hole-information-theory expert will
  rightly point out we are not measuring a density matrix.
- α and T_min in the capacity horizon are calibration constants. v0.1
  ships placeholder defaults. Per-surface calibration from production
  traces is a v0.2 deliverable.
- Page-curve cleanliness is a necessary but not sufficient condition for
  correctness. A loop can close cleanly and still be wrong about the world.
  Horizon does not replace evals — it adds a layer of mathematical
  invariants that evals cannot observe.

What it is **not**: a theory-of-everything. It is five well-defined,
testable invariants that close real gaps in the runtime today.

---

## License

Proprietary. See [`LICENSE`](LICENSE) at the repository root once committed.
This payload is intended to be merged into `github.com/szl-holdings/ouroboros`
as a new package and inherits that repository's license terms.

---

## Citation

If you reference this work:

> Lutar, S. P. (2026). *Ouroboros Horizon: information-theoretic
> primitives for governed bounded loops.* SZL Holdings.

ORCID: 0009-0001-0110-4173.
