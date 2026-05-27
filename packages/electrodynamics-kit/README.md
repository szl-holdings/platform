# @szl-holdings/electrodynamics-kit

Re-expression of the precision-electromagnetics / motion-control / aerospace-navigation idea surface (American Electrodynamics + Moog, Curtiss-Wright, Anduril, Epirus, Shield AI, Helsing, Honeywell, Collins, Parker, Skydio, Ghost Robotics, Hadrian, Varda + the OSS spine: PX4, ArduPilot, ROS2 Navigation, mumax3, SOFA, OpenROAD, CHERI, liboqs, noble-post-quantum) into SZL Doctrine V6 primitives.

See `docs/research/electrodynamics-synthesis-2026.md` for the full per-source contract; each module below maps to one section of that doc.

## Modules

- `actuator-command` (§1 AED) — typed `ActuatorEnvelope` + `ActuatorCommand` + `validateCommandWithinEnvelope`. Receipt: `actuator.command.v1`.
- `device-lifecycle` (§2 Moog) — typed lifecycle stage chain; uncalibrated devices reject commands. Receipt: `device.lifecycle.v1`.
- `bus-budget` (§3 Curtiss-Wright) — per-message-class latency budget with refusal-as-first-class. Receipt: `bus.delivery.v1`.
- `mission-graph` (§4 Anduril) — compile-once-sign-once mission DAG with typed fallback policy. Receipt: `mission.graph.v1`.
- `engagement-dosimetry` (§5 Epirus) — cumulative-dose envelope with exhaustion receipts. Receipt: `engagement.dosimetry.v1`.
- `swarm-consensus` (§6 Shield AI) — bounded-Byzantine tally with no-quorum-as-receipt. Receipt: `swarm.consensus.v1`.
- `redundancy-envelope` (§8 Honeywell/Collins/Parker) — typed redundancy ladder with mode-transition receipts. Receipt: `redundancy.mode-transition.v1`.
- `nav-state-fusion` (§10.1 PX4/ArduPilot) — nav state with covariance; states without covariance are rejected. Receipt: `navigation.state-fusion.v1`.
- `em-field-step` (§10.3 mumax3) — toy 1-D LLG-style step with per-step energy bookkeeping. Receipt: `em.field-step.v1`.
- `sealed-capability` (§10.6 CHERI) — HMAC-sealed software capability envelope. **Not** hardware-capability enforcement. Receipt: `capability.sealed.v1`.

## Doctrine V6 posture

Every module is pure (no I/O, no global state). Receipts are emitted by the consumer (typically `artifacts/api-server/src/routes/electrodynamics.ts`) on the critical path; the package itself defines the receipt-class constants and the validators that must succeed before a receipt is written.

## ITAR / EAR

This package operates on typed envelopes and simulated substrates. It does not encode actuator firmware, RF emitter math, or targeting logic. Any consumer that bridges to physical hardware is responsible for its own export-control posture.
