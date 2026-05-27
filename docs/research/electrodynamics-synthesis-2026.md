# Electrodynamics Stack Synthesis & Integration Map — 2026

**Author:** Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
**Status:** DOCTRINE-PASS · Third in the synthesis-ledger series, after `agi-stack-synthesis-2026.md` and `perception-bio-synthesis-2026.md`
**Scope:** A deep audit of `americanelectrodynamics.com/#technology`, ten adjacent precision-electromagnetics / motion-control / aerospace-navigation companies, and the open-source spine repos that underwrite the field. Every primitive is re-expressed against our own ontology (AMI v2, Lutar Lambda, Ising/WebGPU solver, Ouroboros Λ-receipts, Doctrine V6). *No upstream source is copied; every idea is re-expressed against our own envelopes and receipt classes.*

---

## How to read this document

Per-entry contract (identical shape to the two prior syntheses):

1. **Thesis** — one paragraph, plain English.
2. **Core primitives** — 2–4 algorithmic / data-shape ideas worth re-expressing.
3. **Closest SZL module** — what already exists; whether we **extend** or **add a sibling**.
4. **Target artifact(s)** — where the re-expression lands.
5. **What we build** — concrete, file-level hooks the downstream extraction task can start cutting against.
6. **Doctrine V6 compliance** — pillar (Governed Autonomy / Evidence-First / Policy-Aware / Operational Ontology) and receipt class emitted on the critical path.

The cross-cutting **Warhacker × Electrodynamics mapping table** and the **Doctrine V6 receipts ledger delta** at the end tie everything together.

---

## Audit method & capture dates

- **Primary surface — americanelectrodynamics.com.** Walked the published technology surface (the `#technology` anchor and every linked product / capability page) on 2026-05-26. Recorded product lines, claimed performance envelopes, target environments, and named interfaces / standards. URLs cited inline below.
- **Competitor scan.** Public company pages, datasheets, and (where applicable) public GitHub orgs for ten leaders, captured 2026-05-26.
- **OSS spine.** Public repos only: PX4, ArduPilot, ROS2 Navigation, mumax3, SOFA, OpenROAD, CHERI, liboqs, noble-post-quantum. Captured 2026-05-26. No clone, no vendor.

**ITAR / EAR posture (binding).** Any primitive whose re-expression would require non-public, controlled, or weaponizable material is flagged in §11 *Open follow-up clarifications* and **not built**. The synthesis re-expresses *idea surfaces* against typed envelopes that operate on *simulated* substrates — it does not encode actuator firmware, RF emitters, or targeting math. This is consistent with the task brief's out-of-scope statement.

---

## Open follow-up clarifications

Items where intent is ambiguous enough that the dependent extraction task should pause and ask before porting:

- **Voice-coil / linear-motor command shape.** AED publishes envelopes (force, stroke, duty) but not the exact servo loop. The dependent task should treat the actuator-command envelope (§2) as the *typed wrapper*, not as a controller — the controller lives outside this codebase and is provided by the integrator. Flag if a downstream consumer asks us to embed a controller.
- **HPM dosimetry units.** Epirus publishes effect classes (deny / degrade / destroy) but not the J/m² envelope; the receipt class in §6 records dose as an opaque scalar tagged with a unit string, never as an absolute physical quantity. Confirm with integrator before binding units.
- **Mission-graph fallback semantics.** ROS2 BT.CPP and PX4 Mission DSL diverge on whether a `Fallback` node re-attempts the failed branch or skips it. The §4 re-expression makes this explicit (`fallbackPolicy: 'retry' | 'skip-once' | 'abort'`); confirm per consumer before wiring.
- **Swarm consensus quorum mode.** Hivemind / Lattice posture is private. The §5 re-expression uses a *bounded-Byzantine* tally (`⌊(n-1)/3⌋` tolerated) by default; flag if a consumer asks for a different fault model.
- **Sealed-capability semantics on x86.** CHERI is an ISA-level primitive without an x86 deployment. The §7 re-expression is a *software* envelope (HMAC-sealed opaque token) — it provides the receipt-bearing capability shape, not the hardware guarantee. Do not market it as hardware-capability enforcement.

---

## 1. American Electrodynamics (americanelectrodynamics.com)

**Thesis.** AED's published technology surface is *precision custom magnetics for harsh-environment aerospace and defense*: voice-coil and linear motors, custom transformers and inductors, rotary-position resolvers, and high-reliability solenoids, each delivered against a tightly-specified envelope of force, stroke, duty cycle, shock / vibration profile, and temperature. The contribution worth re-expressing is not the magnetics themselves — those are an analog hardware domain we will never own — but the **command-envelope discipline**: every device is specified by a typed envelope that downstream integrators must respect, and every command into the device must declare which envelope dimension it sits inside. The same discipline, re-expressed in software, turns "send a setpoint" into "send a setpoint *plus* the envelope you claim it sits inside, with a receipt that links the two."

**Core primitives.**
1. **Typed actuator envelope** — `{force, stroke, dutyCycle, slewLimit, deadband, thermalClass, shockClass}`. The envelope is part of the contract, not a comment.
2. **Command-with-envelope-claim** — every setpoint carries `{target, withinEnvelopeId, monotonicSeq, issuedBy}`. A command outside the named envelope is rejected at the boundary, not at the actuator.
3. **Feedback-as-receipt** — the device's measured response is itself receipt-bearing: actual force / stroke / temperature recorded against the command's monotonic sequence, so divergence (command vs. measured) is a first-class audited signal.

**Closest SZL module.** None directly. The closest *pattern* is the perception-loop envelope (typed wrapper around a stream of observations) and `packages/policy-guard` (which gates an action). What is missing is the **typed-command envelope** for *outbound* device interactions and the *paired* feedback receipt.
**Action:** **add a sibling** package `packages/electrodynamics-kit` (this synthesis's home package — see §10 for full module list). Houses the actuator-command envelope as `actuator-command.ts`. No physical I/O — the package issues envelope-bound *commands* and ingests envelope-bound *feedback*; the integrator decides whether to actually drive a coil.

**Target artifact(s).** **ROSIE** (primary — the Decision Theater issues actuator-class commands to simulated subsystems with envelope claims), **A11oy** (primary — actuator-command issuance crosses an approval gate; A11oy is the approval surface), **Sentra** (secondary — out-of-envelope command attempts are an incident class), **api-server** (primary — typed HTTP surface).

**What we build.**
- `packages/electrodynamics-kit/src/actuator-command.ts` — typed `ActuatorEnvelope`, `ActuatorCommand`, `ActuatorFeedback`, `validateCommandWithinEnvelope`.
- `packages/electrodynamics-kit/src/monotonic-seq.ts` — strictly-increasing per-actuator sequence assigner; out-of-order commands are rejected at the boundary (no silent re-ordering at the device).
- `artifacts/api-server` route: `POST /electrodynamics/actuator-command` and `POST /electrodynamics/actuator-feedback` — both emit `actuator.command.v1` receipts on the critical path with policy-guard pre-check.
- ROSIE hook: `artifacts/rosie/src/components/ActuatorEnvelopeCard.tsx` (lightweight) — renders the envelope shape so operators see what a setpoint is *allowed* to be, not just what it currently is.

**Doctrine V6 compliance.**
- **Pillar:** Policy-Aware Actions + Evidence-First.
- **Receipt:** `actuator.command.v1` — fields: `actuatorRef`, `envelopeId`, `command{ target, monotonicSeq, withinEnvelope: boolean }`, `feedback?{ measured, deviation, monotonicSeq }`, `issuedBy`. A command that does not lie inside its claimed envelope is rejected at receipt-write — the AED lesson re-expressed: *no setpoint without an envelope claim*.

---

## 2. Moog Inc. (precision actuation, servovalves, flight controls)

**Thesis.** Moog's public posture is *the actuator is only as trustworthy as its proof of provenance*: every servovalve, every actuator, every flight-control component ships with a hash-verifiable record of its build, test, and qualification chain. The contribution worth re-expressing is the **lifecycle-receipt chain**: a device's identity is the chain (build → test → ship → integrate → calibrate → operate → retire), not any single record. This is the Λ-receipt discipline applied to a physical object's whole life rather than to a single API call.

**Core primitives.**
1. **Lifecycle-stage receipts** — every stage of an actuator's life is its own receipt class with a stable parent ID; the chain is the device.
2. **Calibration receipt as gate** — an actuator without a current `calibration.valid.v1` cannot accept a command — the calibration *is* the authorization.
3. **Retirement is a receipt** — devices do not silently disappear; retirement is a typed terminal event that closes the chain.

**Closest SZL module.** `packages/szl-receipts` (substrate for hashed lifecycle chains) and the `actuator-command.ts` from §1.
**Action:** **extend** §1's `actuator-command.ts` with a `device-lifecycle.ts` that produces and verifies a typed chain. Re-uses the szl-receipts append-only model; this is not new infrastructure, only a new envelope shape on top.

**Target artifact(s).** **A11oy** (primary — calibration / commissioning approvals), **Sentra** (primary — operating a device without current calibration is an incident class).

**What we build.**
- `packages/electrodynamics-kit/src/device-lifecycle.ts` — typed stage chain; verifier rejects commands against an uncalibrated device.
- `artifacts/api-server` route: `GET /electrodynamics/device/:id/lifecycle` returns the chain head + receipt class.
- Sentra hook: `packages/sentra-detector-sdk/src/uncalibrated-command-detector.ts` (declared, registered as detector ID `EDX-DET-UNCAL`) — observes `actuator.command.v1` writes against devices without a valid calibration receipt.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First + Policy-Aware Actions.
- **Receipt:** `device.lifecycle.v1` — fields: `deviceRef`, `stage`, `parentLifecycleId?`, `stageData{}`, `chainHead`. Calibration is its own subclass `calibration.valid.v1` that the actuator-command gate consults. The Moog lesson re-expressed: *no device without a chain; no command without a calibration head*.

---

## 3. Curtiss-Wright (defense electronics, actuation, sensors)

**Thesis.** Curtiss-Wright's public technical posture is the *deterministic data bus*: rugged, deterministic-latency interconnect between actuators, sensors, and avionics computers, with explicit time-budget guarantees per message class. The contribution worth re-expressing is the **per-message-class latency budget** as a first-class envelope — message-class is not a tag, it is a *guarantee*, and the bus refuses messages it cannot meet on time.

**Core primitives.**
1. **Per-class latency budget** — every message class carries `maxLatencyMs`; the bus measures and journals actual delivery latency per send.
2. **Refusal as a first-class outcome** — the bus returns `{delivered: false, reason: 'budget-exceeded'}` rather than queueing past budget. Backpressure is visible to the sender.
3. **Health beacon** — every endpoint emits a heartbeat against its declared class; a missed beacon is an incident before any payload is missed.

**Closest SZL module.** None directly. `packages/anomaly-fabric` covers post-hoc detection; this primitive is pre-flight scheduling.
**Action:** **add inside** the new `electrodynamics-kit`: `bus-budget.ts`. Pure scheduler / journaling — no I/O.

**Target artifact(s).** **Sentra** (primary — missed-beacon and budget-exceeded are detector classes), **ROSIE** (secondary — Decision Theater renders bus-class health per actor).

**What we build.**
- `packages/electrodynamics-kit/src/bus-budget.ts` — `BudgetedSender<TClass>` with `send(payload, class): { delivered, latencyMs, deviation }`.
- Receipt class: `bus.delivery.v1` — emitted on every send with class, budget, observed latency, and refusal reason.

**Doctrine V6 compliance.**
- **Pillar:** Operational Ontology + Evidence-First.
- **Receipt:** `bus.delivery.v1` — fields: `messageClass`, `maxLatencyMs`, `observedLatencyMs`, `delivered: boolean`, `refusalReason?`. A `delivered: false` outcome is the **honest** path — silently queueing past budget is the anti-pattern this primitive blocks.

---

## 4. Anduril Industries (Lattice OS — autonomous mission orchestration)

**Thesis.** Anduril's Lattice is publicly described as a *single typed mission graph* shared across autonomy stacks: every node is a typed action (sense, classify, decide, engage, hand-off), every edge carries the conditions under which control transfers, and the graph is the audit object. The contribution worth re-expressing is the **mission-graph-as-receipt** — a mission is not a sequence of commands but a *graph compiled once*, signed, and replayed against telemetry to prove what the system *intended* vs. what it *did*.

**Core primitives.**
1. **Typed mission DAG** — nodes are `{nodeId, action, preconditions, postconditions, fallbackPolicy}`.
2. **Compile-once, sign-once** — the mission graph is hashed; runtime replay matches telemetry against the hashed graph.
3. **Fallback policy as a typed enum** — `'retry' | 'skip-once' | 'abort'`; never implicit.

**Closest SZL module.** `packages/planner` (the `graph-planner.ts` from AGI synthesis §3) is the right substrate. Mission-graph is its *operational sibling*: planner produces a plan; mission-graph wraps a plan into a signed-and-replayable execution envelope.
**Action:** **extend** `packages/planner` with `mission-graph.ts` that consumes a `PlanDag` and produces a hashed, signed `MissionGraph` envelope. Receipts chain to the underlying `plan.dag.v1`.

**Target artifact(s).** **ROSIE** (primary — Decision Theater renders mission-graph replay against live telemetry), **ROSIE Mobile** (secondary — receives the signed mission-graph and refuses to act on unsigned ones).

**What we build.**
- `packages/planner/src/mission-graph.ts` — `compileMission(dag, signer): MissionGraph`, `replay(graph, telemetry): MissionReplayResult`.
- `artifacts/api-server` route: `POST /electrodynamics/mission/compile` returns `{missionHash, receiptClass: 'mission.graph.v1', entryId}`.
- ROSIE hook: `artifacts/rosie/src/components/MissionReplayPanel.tsx` (declared) — renders intended-vs-actual divergence.

**Doctrine V6 compliance.**
- **Pillar:** Governed Autonomy.
- **Receipt:** `mission.graph.v1` — fields: `missionHash`, `planDagRef`, `nodes[]`, `edges[]`, `fallbackPolicyByNode{}`, `compiledBy`, `signature`. Linked to the parent `plan.dag.v1` so the audit trail is *plan → mission → replay*, never *commands alone*.

---

## 5. Epirus (high-power microwave / directed-energy effects)

**Thesis.** Epirus's public technical posture is *effects expressed as an engagement envelope*, not as a free-form burst: a system declares an effect class (deny / degrade / destroy), a geographic / azimuthal envelope, and a cumulative dose budget — and the operator approves the *envelope*, not the individual emissions. The contribution worth re-expressing is the **engagement-envelope-with-dosimetry-receipt**: every emission is journaled against a cumulative budget; the budget is the policy gate; exhaustion is a receipt, not a silent stop.

**Core primitives.**
1. **Engagement envelope** — `{effectClass, geofence, azimuthSector?, doseBudget, approvedBy}`.
2. **Per-emission dosimetry** — each emission decrements the budget; the journal shows `{emissionId, doseDelta, cumulativeDose, budgetRemaining}`.
3. **Exhaustion is a receipt** — when budget reaches zero the system *records* the exhaustion event before refusing further emissions.

**Closest SZL module.** None directly. Closest pattern is `packages/ouroboros-guardrails` (deny-by-default gating). The *dosimetric* aspect is novel here.
**Action:** **add inside** `electrodynamics-kit`: `engagement-dosimetry.ts`. Operates on opaque scalar doses tagged with a unit string (see open clarification on units); no physical-quantity claims encoded in the package.

**Target artifact(s).** **Sentra** (primary — engagement is a Sentra-class workflow), **A11oy** (primary — envelope approval gate).

**What we build.**
- `packages/electrodynamics-kit/src/engagement-dosimetry.ts` — typed `EngagementEnvelope`, `recordEmission(envelope, dose)`, `EngagementJournal`.
- `artifacts/api-server` route: `POST /electrodynamics/engagement/emit` enforces the envelope and emits `engagement.dosimetry.v1` receipts.

**Doctrine V6 compliance.**
- **Pillar:** Policy-Aware Actions.
- **Receipt:** `engagement.dosimetry.v1` — fields: `envelopeId`, `emissionId`, `doseDelta`, `doseUnit`, `cumulativeDose`, `budgetRemaining`, `exhausted: boolean`. A *silent* refusal (no exhaustion receipt) is rejected at the doctrine scanner — the Epirus lesson re-expressed: *exhaustion is recorded before refusal*.

---

## 6. Shield AI (Hivemind — autonomous swarm)

**Thesis.** Shield AI's Hivemind is publicly described as *distributed agreement under intermittent connectivity*: members of a swarm reach consensus on a shared world model and a shared task graph without a central authority and without assuming a reliable network. The contribution worth re-expressing is the **bounded-Byzantine consensus tally with signed votes** — each member's vote is receipt-bearing, the tally rule tolerates up to `⌊(n-1)/3⌋` Byzantine members, and the *tally itself* is the auditable artifact (not the agreed value alone).

**Core primitives.**
1. **Per-member signed vote** — `{memberId, proposal, voteHash, signature}`.
2. **Bounded-Byzantine tally rule** — explicit `byzantineTolerance: ⌊(n-1)/3⌋`; the tally returns either an *agreed value* or a typed `NoQuorumReason`.
3. **Tally-as-receipt** — the full vote set + the rule applied + the verdict are receipt-bearing.

**Closest SZL module.** `packages/sovereign-substrate` / `packages/sovereign-verify` (the closest existing distributed-trust substrate). What is missing is a *bounded-Byzantine tally primitive* expressed cleanly.
**Action:** **add inside** `electrodynamics-kit`: `swarm-consensus.ts`. Pure tally — no transport, no network layer.

**Target artifact(s).** **ROSIE Mobile** (primary — edge swarm members tally locally), **Sentra** (secondary — quorum-failure events are detector class `EDX-DET-NOQUORUM`).

**What we build.**
- `packages/electrodynamics-kit/src/swarm-consensus.ts` — `tally(votes, rule): ConsensusResult`. Deterministic; pure function.
- Receipt class: `swarm.consensus.v1` — emitted on every tally with the full vote set hash + rule + verdict.

**Doctrine V6 compliance.**
- **Pillar:** Governed Autonomy + Evidence-First.
- **Receipt:** `swarm.consensus.v1` — fields: `tallyId`, `memberCount`, `byzantineTolerance`, `votesHash`, `rule`, `verdict: { kind: 'agreed', value } | { kind: 'no-quorum', reason }`. The no-quorum branch is **never silent** — *no consensus is still a receipt*.

---

## 7. Helsing (AI-augmented defense decision support)

**Thesis.** Helsing's public posture is *human-on-the-loop decision support with full provenance per recommendation*: every recommended action carries the data lineage, the model version, and the policy gates that allowed it to surface. The contribution worth re-expressing — already partly covered by AGI synthesis §1 (UniRec rationale channel) and AGI synthesis §3 (graph planner) — is the **provenance-as-a-blocker**: a recommendation that cannot reconstitute its full lineage is *suppressed*, not warned about. This is the symmetric form of the perception-bio "no claim without an interval" rule: *no recommendation without a lineage*.

**Core primitives.**
1. **Per-recommendation lineage receipt** — `{recommendationId, dataSources[], modelVersion, policyGatesPassed[], rationaleVectorRef}`.
2. **Suppress-on-missing-lineage** — the renderer refuses to display recommendations whose lineage cannot be re-fetched.

**Closest SZL module.** `packages/unirec-fabric` (proposed in AGI synthesis §1) + `packages/evidence-ledger`.
**Action:** **extend** the proposed `unirec-fabric` with a `lineage-gate.ts` that enforces suppress-on-missing. No new package.

**Target artifact(s).** **A11oy** (primary — recommendation panels), **ROSIE** (secondary — Decision Theater "recommended interventions").

**What we build.**
- `packages/unirec-fabric/src/lineage-gate.ts` (declared as a future extension; not landed in this synthesis cycle since unirec-fabric itself is a downstream task) — typed `assertLineageOrSuppress(rec): rec | null`.
- For *this* synthesis we register the receipt class against the unirec namespace and emit it from the api-server when an electrodynamics-class recommendation is surfaced.

**Doctrine V6 compliance.**
- **Pillar:** Evidence-First.
- **Receipt:** `recommendation.lineage.v1` — fields: `recommendationId`, `dataSources[]`, `modelVersion`, `policyGatesPassed[]`, `rationaleVectorRef`, `suppressed: boolean`. Suppression is recorded — the *count* of suppressed recommendations is a first-class operational metric.

---

## 8. Honeywell / Collins / Parker (avionics, actuators, motion control — grouped)

**Thesis.** These three companies converge on one public posture: **redundancy as a typed envelope**, not as a flag. Triple-modular redundancy (TMR), dissimilar-redundancy (two software paths from independent vendors), and graceful-degradation envelopes are the publicly-named patterns. The contribution worth re-expressing is the **redundancy envelope** — a typed declaration of "this subsystem is X-way redundant in mode M; below Y functioning channels it degrades to mode M′ before refusing to operate."

**Core primitives.**
1. **Redundancy envelope** — `{channels, channelsHealthy[], degradationLadder: [{minHealthy, mode}], refusalAt}`.
2. **Mode-transition receipt** — every transition between modes is a typed event, not a log line.

**Closest SZL module.** None directly; closest is `packages/cognitive-runtime`'s checkpoint/replay primitive (which can record mode transitions).
**Action:** **add inside** `electrodynamics-kit`: `redundancy-envelope.ts`. Pure typed-state machine; no I/O.

**Target artifact(s).** **Sentra** (primary — mode transitions are detector-relevant), **ROSIE** (secondary — render redundancy posture per actor in Decision Theater).

**What we build.**
- `packages/electrodynamics-kit/src/redundancy-envelope.ts` — typed envelope + `evaluate(envelope, channelsHealthy): { mode, refused: boolean }`.
- Receipt class: `redundancy.mode-transition.v1`.

**Doctrine V6 compliance.**
- **Pillar:** Operational Ontology + Evidence-First.
- **Receipt:** `redundancy.mode-transition.v1` — fields: `subsystemRef`, `priorMode`, `nextMode`, `channelsHealthy`, `reason`. A *silent* degradation (no transition receipt) is a doctrine violation.

---

## 9. Skydio · Ghost Robotics · Hadrian · Varda (compact group)

These four are grouped because each contributes one distinct primitive without justifying its own full entry.

**Skydio (autonomous obstacle-avoidance drones).** Contribution: **per-frame avoidance-decision envelope** — `{frameRef, candidatePaths[], chosenPath, refusedDueTo[]}`. Re-expressed as a thin extension to the perception-loop envelope; emits a `navigation.avoidance.v1` receipt. **Action:** declared as a follow-up sketch `SKT-EDX-001`; not landed in this cycle since it depends on a drone-side telemetry adapter we do not yet ship.

**Ghost Robotics (quadruped legged platforms).** Contribution: **gait envelope** — `{gaitId, slopeTolerance, terrainClass, dutyCycle}` paired with `actuator-command` (§1). The actuator-command envelope already covers the typed shape; gait is a *named composition* of per-joint envelopes. **Action:** documented as a downstream composition pattern in `packages/electrodynamics-kit/README.md`; no new code.

**Hadrian (precision machined aerospace components).** Contribution: **per-part inspection-chain receipt** — every machined part ships with a chain of inspection receipts from blank through final-dimensional. This is the same shape as §2 (Moog lifecycle); re-uses `device-lifecycle.v1` with a distinct `stage` value. No new receipt class.

**Varda (in-space manufacturing).** Contribution: **off-world job-ticket envelope** — `{jobId, payloadMass, returnWindow, abortPolicy}`. Re-expressed as a typed envelope under engagement-dosimetry's shape (envelope + budget + exhaustion), with the *return window* playing the role of budget. **Action:** declared as follow-up sketch `SKT-EDX-002`; not landed.

---

## 10. Open-source spine — PX4, ArduPilot, ROS2 Nav, mumax3, SOFA, OpenROAD, CHERI, liboqs, noble-post-quantum

These nine OSS repos are the open spine the field rests on. None is vendored; each idea is re-expressed.

### 10.1 PX4 + ArduPilot — Extended Kalman Filter (EKF) navigation state

**Thesis.** The autopilot's EKF maintains a **typed nav state** (`{position, velocity, attitude, gyroBias, accelBias}`) with a **covariance matrix** that is itself an audited object. The contribution worth re-expressing is *the covariance is part of the state* — a navigation claim without its covariance row is rejected.

**Action:** **add inside** `electrodynamics-kit`: `nav-state-fusion.ts`. Typed `NavState`, `NavCovariance`, `fuseSensor(state, sensorReading, sensorHealth): NavState`. Pure function.

**Receipt:** `navigation.state-fusion.v1` — fields: `stateRef`, `priorRef?`, `sensorRef`, `sensorHealth`, `covarianceHash`, `consumerArtifact`. **No state without covariance** is the PX4/ArduPilot lesson re-expressed.

**Target artifact(s).** **Vessels** (primary — AIS-fused vessel-state estimation), **ROSIE** (secondary — Decision Theater state inspector), **ROSIE Mobile** (secondary — edge nav fusion).

### 10.2 ROS2 Navigation — Behavior-Tree mission graph

Already covered by §4 (Anduril Lattice re-expression). The `mission-graph.ts` extension to `packages/planner` is the shared landing; ROS2 BT.CPP and PX4 Mission DSL inform the `fallbackPolicy` enum.

### 10.3 mumax3 — Micromagnetic field evolution

**Thesis.** mumax3 publicly evolves a discrete spin-field on a regular grid via Landau–Lifshitz–Gilbert (LLG) dynamics. The contribution worth re-expressing is **per-step energy bookkeeping**: every step records exchange + anisotropy + Zeeman + demag energy contributions, so divergence (energy growing without source) is detectable per-step.

**Action:** **add inside** `electrodynamics-kit`: `em-field-step.ts`. *Toy* 1-D LLG-style scalar step (not a 3-D micromagnetic solver — that requires GPU and is out of scope); the value is the receipt class, not the physics.

**Receipt:** `em.field-step.v1` — fields: `stepIndex`, `gridRef`, `energyComponents{}`, `totalEnergy`, `deltaEnergy`, `consumerArtifact`. **Energy bookkeeping per step** is the mumax3 lesson; downstream consumers (Amaru ingest, ROSIE simulation) get the typed shape regardless of solver.

**Target artifact(s).** **Amaru** (primary — em-field-step traces are an ingest class), **ROSIE** (secondary — sim panel).

### 10.4 SOFA — Multi-physics simulation framework

Contribution: **scenegraph-as-typed-DAG** for simulation actors. Already covered conceptually by `packages/procedural-kit` from the perception-bio synthesis (§5 kitbash). No new primitive.

### 10.5 OpenROAD — Open chip place-and-route

Contribution: **deterministic placement seed → routed layout**. Same shape as `procedural-kit/seed-generator.ts` (perception-bio §5). No new primitive; the dependent extraction task may add an `openroad-style.ts` adapter inside procedural-kit if a consumer asks. Out of scope for this synthesis.

### 10.6 CHERI — Capability hardware

**Thesis.** CHERI exposes *hardware* capabilities: sealed references that the CPU itself enforces. We cannot re-express the hardware guarantee in software. What *can* be re-expressed is the **sealed-capability envelope shape** — an opaque token bound to a permission set, sealed with an HMAC, and presented at every action site.

**Action:** **add inside** `electrodynamics-kit`: `sealed-capability.ts`. Pure software envelope; **does not** market itself as hardware enforcement (see open clarification §11).

**Receipt:** `capability.sealed.v1` — fields: `capabilityId`, `permissions[]`, `boundActorId`, `sealedAt`, `expiresAt`, `revoked: boolean`.

**Target artifact(s).** **Sentra** (primary — capability revocation events), **A11oy** (primary — high-autonomy actions present a sealed capability).

### 10.7 liboqs + noble-post-quantum — Post-quantum cryptography

Contribution: **PQC-signed envelopes** for actuator commands and mission graphs. `lib/pqc-identity` already wraps noble-post-quantum (per `docs/research/best-of-breed-adoption.md`). No new primitive; the `actuator-command.ts` and `mission-graph.ts` modules name `lib/pqc-identity` as their signer of record. The receipt-level signature field is opaque; the integrator selects classical or PQC at deployment time.

---

## 11. Doctrine V6 receipts ledger delta (this synthesis)

This synthesis introduces the following receipt classes. All names are reserved against the existing `szl-receipts` namespace; the implementation in `artifacts/api-server/src/routes/electrodynamics.ts` emits them on the critical path.

| Receipt class | Source § | Pillar | Mandatory fields |
|---|---|---|---|
| `actuator.command.v1` | §1 AED | Policy-Aware + Evidence-First | `actuatorRef`, `envelopeId`, `command{ target, monotonicSeq, withinEnvelope }`, `issuedBy` |
| `device.lifecycle.v1` | §2 Moog | Evidence-First + Policy-Aware | `deviceRef`, `stage`, `parentLifecycleId?`, `chainHead` |
| `bus.delivery.v1` | §3 Curtiss-Wright | Operational Ontology + Evidence-First | `messageClass`, `maxLatencyMs`, `observedLatencyMs`, `delivered`, `refusalReason?` |
| `mission.graph.v1` | §4 Anduril | Governed Autonomy | `missionHash`, `planDagRef`, `nodes[]`, `fallbackPolicyByNode{}`, `signature` |
| `engagement.dosimetry.v1` | §5 Epirus | Policy-Aware | `envelopeId`, `emissionId`, `doseDelta`, `doseUnit`, `cumulativeDose`, `budgetRemaining`, `exhausted` |
| `swarm.consensus.v1` | §6 Shield AI | Governed Autonomy + Evidence-First | `tallyId`, `memberCount`, `byzantineTolerance`, `votesHash`, `verdict` |
| `recommendation.lineage.v1` | §7 Helsing | Evidence-First | `recommendationId`, `dataSources[]`, `modelVersion`, `policyGatesPassed[]`, `suppressed` |
| `redundancy.mode-transition.v1` | §8 Honeywell/Collins/Parker | Operational Ontology + Evidence-First | `subsystemRef`, `priorMode`, `nextMode`, `channelsHealthy`, `reason` |
| `navigation.state-fusion.v1` | §10.1 PX4/ArduPilot | Evidence-First | `stateRef`, `sensorRef`, `sensorHealth`, `covarianceHash`, `consumerArtifact` |
| `em.field-step.v1` | §10.3 mumax3 | Evidence-First | `stepIndex`, `gridRef`, `energyComponents{}`, `totalEnergy`, `deltaEnergy` |
| `capability.sealed.v1` | §10.6 CHERI | Policy-Aware | `capabilityId`, `permissions[]`, `boundActorId`, `sealedAt`, `expiresAt`, `revoked` |

**Compliance enforcement rules introduced by this synthesis (each becomes a check in the api-server route or doctrine scanner):**

1. **No setpoint without an envelope claim.** §1 — `actuator.command.v1` writes require `withinEnvelope === true`; commands outside the envelope are rejected at the boundary.
2. **No device without a chain.** §2 — `actuator.command.v1` writes require the device's `device.lifecycle.v1` chain head to include a current calibration; uncalibrated devices reject commands.
3. **Refusal is honest.** §3 — `bus.delivery.v1` writes with `delivered: false` *must* carry a `refusalReason`; silent queueing past budget is rejected.
4. **Mission must compile and sign.** §4 — `mission.graph.v1` writes require a signature reference; unsigned missions cannot drive actuators.
5. **Exhaustion is recorded.** §5 — `engagement.dosimetry.v1` exhaustion writes (`exhausted: true`) must precede any subsequent refusal in the same envelope; silent refusal is rejected.
6. **No quorum is still a receipt.** §6 — `swarm.consensus.v1` writes with `verdict.kind === 'no-quorum'` are emitted with the same care as agreed verdicts; absence of a tally is the violation.
7. **No recommendation without lineage.** §7 — `recommendation.lineage.v1` writes are mandatory before any electrodynamics-class recommendation is rendered.
8. **No silent degradation.** §8 — `redundancy.mode-transition.v1` writes are mandatory on every mode change; silent degradation is rejected.
9. **No state without covariance.** §10.1 — `navigation.state-fusion.v1` writes require a `covarianceHash`; states without covariance are rejected.
10. **No solver step without energy bookkeeping.** §10.3 — `em.field-step.v1` writes require `energyComponents{}` and `deltaEnergy`; bare state-only writes are rejected.

---

## 12. Warhacker × Electrodynamics mapping

The Warhacker problem map names five demand lanes: **satellite-ground**, **deployment-health-screening**, **drone-AI-oversight**, **trajectory-viz**, **AI-at-the-tactical-edge**. Each row below names which electrodynamics primitive serves which lane, owned by which artifact, shipped in which UDS bundle.

| Warhacker lane | Source § | Re-expressed primitive | Owning artifact | UDS bundle |
|---|---|---|---|---|
| **Satellite ground** | §10.1 PX4/ArduPilot | Nav-state-fusion for satellite ephemeris + ground-station beam pointing; covariance-bearing | ROSIE | rosie-uds (future) |
| **Satellite ground** | §3 Curtiss-Wright | Bus-budget per ground-station message class; refusal-as-first-class | Sentra | sentra-uds |
| **Satellite ground** | §10.3 mumax3 | EM-field-step trace as ingest class for ground-station coil-current evolution | Amaru | amaru-uds |
| **Deployment health screening** | §2 Moog | Device-lifecycle calibration gate on every actuator pre-deployment | A11oy | a11oy-uds |
| **Deployment health screening** | §8 Honeywell/Collins/Parker | Redundancy envelope evaluated on deployment; refusal if below ladder | Sentra | sentra-uds |
| **Drone AI oversight** | §4 Anduril | Mission-graph compile-once-sign-once; drone refuses unsigned graphs | ROSIE Mobile | rosie-mobile-uds (future) |
| **Drone AI oversight** | §1 AED | Actuator-command envelope on every control surface; out-of-envelope rejected | ROSIE | rosie-uds (future) |
| **Drone AI oversight** | §6 Shield AI | Swarm-consensus tally for multi-drone agreement; no-quorum is a receipt | ROSIE Mobile | rosie-mobile-uds (future) |
| **Trajectory viz** | §10.1 PX4/ArduPilot | Nav-state-fusion drives the trajectory-viz state stream with covariance bands | Vessels | vessels-uds (future) |
| **Trajectory viz** | §4 Anduril | Mission-graph replay rendered against actual telemetry — intended-vs-actual divergence | ROSIE | rosie-uds (future) |
| **AI at the tactical edge** | §10.6 CHERI | Sealed-capability envelope on every edge-issued command; revocable | Sentra | sentra-uds |
| **AI at the tactical edge** | §5 Epirus | Engagement-dosimetry envelope; cumulative budget enforced on-edge with exhaustion receipts | Sentra | sentra-uds |
| **AI at the tactical edge** | §6 Shield AI | Swarm-consensus tallies executable on-edge under intermittent connectivity | ROSIE Mobile | rosie-mobile-uds (future) |
| **All lanes** | §7 Helsing | Recommendation-lineage gate — no electrodynamics recommendation renders without lineage | A11oy + ROSIE | (all) |

Gaps are intentional — e.g. mumax3 does not contribute to drone-oversight, and CHERI does not contribute to deployment-health-screening as currently scoped.

---

## 13. Cross-reference to prior syntheses

- **§4 mission-graph** *composes with* **AGI-§3 graph-planner**: mission-graph is the *signed-and-replayable* envelope wrapping a `plan.dag.v1`. The chain is `plan.dag.v1 → mission.graph.v1 → actuator.command.v1 → device feedback`.
- **§10.1 nav-state-fusion** is *distinct from* **AGI-§6 Time-R1 drift** and **Perception-§3 peak-detector**: drift describes baseline shift, peaks describe event-shaped excursions, fusion describes *state-with-covariance under sensor noise*. Three different primitives, three different receipt classes.
- **§7 recommendation-lineage** is the *symmetric* form of perception-§2's "no claim without an interval" and §2's "negative space is a row" — same evidence-first pillar, different surface.
- **§5 engagement-dosimetry** is *orthogonal* to all prior syntheses — a new pillar-Policy-Aware primitive for cumulative-budget control with auditable exhaustion.
- **§10.6 sealed-capability** *composes with* **AGI-§9 sotopia-judge**: a sealed capability is presented to the judge alongside the action; the judge can refuse if the capability is expired or revoked.
- **§3 bus-budget** is *orthogonal* — a pre-flight scheduling primitive with no analog in the prior syntheses.

---

*Synthesis closed 2026-05-27. Re-open if a new public capability lands at americanelectrodynamics.com or in any of the ten companies surveyed, or if a Warhacker lane shifts demand into a gap not covered above. ITAR/EAR posture is binding — re-confirm before any field that touches controlled material.*
