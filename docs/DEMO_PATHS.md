# SZL Holdings — Demo Paths

## Overview

These demo narratives are grounded in what the current codebase can actually support. Each path uses live artifacts, real API endpoints, and implemented platform primitives.

---

## Demo 1: Maritime Delay → Cross-Domain Cascade

**Duration:** 8 minutes
**Artifacts:** Vessels, Terra, Command, API Server
**Primitives Used:** Signal Mesh, Proof Chain, Policy Engine, Decision Replay

### Narrative

1. **Signal Detection** — Show Vessels dashboard detecting a 48-hour port delay at Rotterdam. The signal crosses the configured threshold (24h).

2. **Cross-Domain Cascade** — Walk through the `maritime-realestate` signal chain. The Event Fabric routes the signal to Terra (flag port-adjacent properties) and Counsel (review force-majeure clauses).

3. **Governed Recommendation** — Show the Policy Engine evaluating the recommendation. The risk tier triggers a human approval gate.

4. **Approval Gate** — Demonstrate the approval queue in Unified Command. An operator reviews the evidence bundle and approves the property timeline adjustment.

5. **Proof Chain** — Show the immutable proof chain entry with hash-linked evidence: vessel ID, delay hours, affected properties, policy reference, approver identity.

6. **Decision Replay** — Replay the full decision from the Trace Graph. Walk through what triggered, what data was used, what policy applied, who approved, and what happened.

### Key Talking Points
- No single-domain tool handles this cascade
- The proof chain satisfies audit requirements that dashboards cannot
- Decision replay is the feature enterprise buyers have never seen

---

## Demo 2: Security Incident → Legal Hold + Executive Risk

**Duration:** 6 minutes
**Artifacts:** Aegis (Sentra), Counsel, SZL Holdings Dashboard, API Server
**Primitives Used:** Signal Mesh, Proof Chain, Policy Engine, Outcome Graph

### Narrative

1. **Incident Detection** — Show Aegis detecting a critical security incident (severity 0.9). The `security-legal` signal chain activates.

2. **Automatic Legal Hold** — Counsel receives the cascade and initiates a legal hold review. Evidence preservation workflow starts automatically.

3. **Executive Risk Update** — SZL Holdings portfolio risk score updates to reflect the incident's financial and reputational impact.

4. **Outcome Tracking** — Show the Outcome Graph linking the incident to downstream business outcomes over time.

### Key Talking Points
- Security → Legal → Executive is a three-domain cascade in under 2 seconds
- Every step is captured in the proof chain
- Regulatory disclosure readiness is built in, not bolted on

---

## Demo 3: Platform Governance Walk-Through

**Duration:** 10 minutes
**Artifacts:** Unified Command, API Server, Pulse
**Primitives Used:** All six core primitives

### Narrative

1. **Health Overview** — Start at `/api/health`. Show 8 platform apps, database latency, service status.

2. **Platform Metrics** — Show `generated/platform-metrics.json` with code-derived counts: 17 artifacts, 123 packages, 4,900+ TS/TSX files, 920 DB tables, 12/12 primitives implemented.

3. **Command Arena** — Run `npx tsx scripts/evals/run-arena.ts`. Show 5 scenario evaluations with multi-dimensional scoring: correctness, evidence completeness, approval compliance, replay integrity, policy adherence.

4. **Architecture Walk** — Show the six core primitives: Outcome Graph, Proof Chain, Decision Replay, Policy Engine, Event Fabric, Simulation Engine. Each is a real package in `lib/` or `packages/`.

5. **Trust Center** — Walk through `docs/TRUST_CENTER.md`. Show security controls, governance architecture, compliance readiness, and disclosed gaps.

### Key Talking Points
- Every number is code-derived, not hand-maintained
- The primitives are packages, not PowerPoint
- The gaps are disclosed, not hidden
