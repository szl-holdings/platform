# Falsification Ledger

Every Horizon primitive ships with a pre-registered test that, if it fails,
falsifies the primitive's claim to operational utility. We record those
tests here so future contributors cannot quietly soften them.

This is a debt-free design: any primitive whose acceptance test is later
weakened must add an entry explaining why.

---

## P1 — PageCurveInvariant

**Claim.** A correctly bounded loop's entanglement entropy with its
environment is non-decreasing then non-increasing, and falls below ε at
close.

**Acceptance test.** `test/page-curve.test.ts > PageCurveTracker — clean
close > rises, peaks, and falls to ~0 for a simulated bounded loop`.

**Falsification condition.** Either (a) a clean run produces residual
entropy > ε on more than 2% of trials, or (b) a known-dirty run
(unbounded coupling) produces residual entropy ≤ ε on more than 5% of
trials. Either invalidates the primitive.

**Pre-registered statistical bound.** Over 100 trials with the canonical
clean-close generator and noise σ = 0.1: P(false dirty) ≤ 0.02.

**Status as of v0.1.** Single-run unit test passes deterministically. A
calibration suite over 100 stochastic trials is on the v0.2 roadmap.

---

## P2 — NoHairContract

**Claim.** Two closed loops with identical wire-format no-hair strings
are operationally equivalent for all consumers downstream.

**Acceptance test.** `test/no-hair.test.ts > serializeNoHair / parseNoHair
> round-trips a state exactly`.

**Falsification condition.** A consumer downstream of the no-hair boundary
distinguishes two loops with identical no-hair strings.

**Status.** Round-trip test passes. The composition equivalence test
(consumer-side blind comparison) is part of A11oy integration tests
(see `docs/INTEGRATION_A11OY.md`).

---

## P3 — DualWitness

**Claim.** Every externally-observable internal claim has, at audit time,
a matching external witness entry — or the system reports a violation.

**Acceptance test.** `test/dual-witness.test.ts > verifyDualWitness >
flags an orphaned internal claim`.

**Falsification condition.** An agent forges an external entry that
defeats the matcher. Mitigation: external witnesses originate from the
auditor process, not the agent. The matcher is configurable per kind so
that adversarial payload-similarity does not yield a false consistent
verdict.

**Status.** Default matcher (kind equality + primitive payload subset)
is conservative. Stronger matchers (cryptographic attestation, signed
external entries) are on the v0.2 roadmap.

---

## P4 — EntanglementMetric

**Claim.** The mutual-information-based entanglement metric correctly
identifies coupled vs decoupled loop pairs in the runtime.

**Acceptance test.** `test/entanglement.test.ts > checkEntanglementGuards
> flags a violation when expected-decoupled pair is correlated`.

**Falsification condition.** A loop pair with bits > 0.5 that produces
no observable cross-effect under load test, or a pair with bits < 0.1
that produces measurable cross-effect.

**Status.** Spot-checks pass. Operational calibration on real A11oy
traces is the v0.2 deliverable.

---

## P5 — CapacityHorizon

**Claim.** Loops whose observed information rate exceeds C(ℓ) experience
quality degradation; loops below C(ℓ) by > 0.5 bits/tick can be merged
without quality loss.

**Acceptance test.** `test/horizon.test.ts > recommendFromHorizon >
recommends SPLIT when far above capacity`.

**Falsification condition.** Either (a) splitting a SPLIT-recommended
loop fails to improve a measurable quality metric (defect rate, latency
P95, hallucination rate, policy-violation rate), or (b) merging a
MERGE-recommended pair degrades any of those metrics.

**Status.** The dimensional argument is sound; the calibration of α and
T_min is empirical and must be set per surface. v0.1 ships defaults
(α=1.0, T_min=1.0) that are intentionally placeholder. v0.2: per-surface
α, T_min from production traces.

---

## How to add an entry

When changing any acceptance test or default constant, add an entry of
the form:

```
## YYYY-MM-DD  <author>  <primitive>
- old:  <description>
- new:  <description>
- why:  <one-paragraph justification with link to data>
```

Do not silently soften a test. Soft tests rot; recorded soft tests can be
audited and challenged.
