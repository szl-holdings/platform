---
name: A11oy perception/bio reviewer wiring
description: Conventions for mixing peak-detector + reviewer-presence into the AMI gate, and the privacy invariant that protects raw frame bytes.
---

# A11oy perception/bio reviewer wiring

## AMI mixing rule (peak-detector + reviewer-presence)

`ChatAmiSignals` has two optional fields that come from
perception/bio primitives: `peakSignal` (from
`@workspace/anomaly-fabric/peak-detector` via the
`peaksToAmiContribution` helper in `@szl/a11oy-runtime`) and
`reviewerPresence` (from the browser `PerceptionGate`).

The mixing rule is **non-destructive**:

- **N (noise)** and **D (drift)** are set to `max(base, peak)`. Peak
  bursts can only raise the floor; they can never lower a value
  established by the existing per-turn telemetry.
- **G (governance)** is multiplied by a reviewer-presence damper:
  absent → ×0.6, second-factor → ×0.85,
  perception → ×(0.85 + 0.15·confidence). Missing reviewer info
  leaves G untouched.

**Why:** these signals are advisory deltas, not authoritative
replacements. Overwriting would silently erase prior gate state when
a noisy stream produces a momentarily low contribution, and would
inflate G when a reviewer attests on top of an already-degraded
governance posture.

**How to apply:** any new perception/bio signal added to AMI must
either mix multiplicatively (downward only) into G, or with `max()`
into N/D. Never assign directly.

## Privacy invariant

`@szl-holdings/perception-loop` MUST not surface raw frame bytes in
its envelope. The contract is enforced by
`src/__tests__/privacy.test.ts`: it builds a frame whose `payload`
contains both a distinctive byte run (`0xab` × 64) and a unique
string tag, runs `detect()`, and asserts the JSON-serialised envelope
contains neither. If you add a new field to `PerceptionEnvelope`,
re-run that test — a regression here is a privacy regression.

**How to apply:** the browser `PerceptionGate` component captures
frames in a closure-local canvas and only ever emits the
`LivenessSummary` feature vector to its `onAttest` callback. Any
future "send frame to server" pathway is a contract break — the
api-server `/perception/verify` route is built around the same
invariant.

## Reliquary join (orchestration-traces)

`runOrchestration` in `@szl/a11oy-runtime` wraps the 4-stage canonical
flow (drift → evaluate → approve → publish) with `StagedPipeline` and
captures the Λ verdict receipt id alongside the per-stage
`pipeline.stage.v1` artefacts. The api-server exposes the in-memory
ring via `GET /api/a11oy/orchestration-traces`; the reliquary panel
at `/reliquary/orchestration-traces` joins those rows to the receipt
chain. **The publish stage always emits an artefact** even when the
decision is `deny`/`escalate` — absence-of-publish is itself
evidence and must remain observable.
