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

---

## Demo 4: Registry & Release Confidence Walk-Through

**Duration:** 6 minutes
**Artifacts:** API Server, Command
**Primitives Used:** Prompt Registry, Eval OS, Run Ledger, Policy Engine

*This demo is suited to a technical buyer or engineering evaluator who wants to understand how the platform governs AI model and prompt changes without breaking production.*

### Narrative

1. **Prompt Registry** — Open `lib/prompt-registry/README.md`. Show the versioned prompt inventory: 14 active prompts, semver lifecycle, allowed data scopes, and eval scores. Highlight the `signal-fusion@3.0.0` promotion path (EVAL → STAGING → ACTIVE) and the `hallucination-detector@0.9.0` currently in `rollback-candidate` state.

2. **Rollback Demonstration** — Walk through the rollback procedure for a prompt in `rollback-candidate` status. Update the registry entry status, restart the worker — under 5 minutes end-to-end. A Phase 8 CLI (`pnpm registry:prompt set-status`) will automate this to a single command. The rollback is recorded in `docs/FIX_LOG.md`.

3. **Eval OS** — Show `lib/eval-os/README.md`. Walk through the 7 active eval suites with their scores. Point out: gate compliance on `core-policy-suite` is 1.00 across all scenarios — no policy gate was bypassed in any evaluated scenario.

4. **Run Ledger** — Show `lib/run-ledger/README.md`. Recent run history table: 8 runs in the last 14 days, `run-008` flagged as `rollback-trigger`. Every run shows input tokens, cost, outcome, and operator. Append-only — no human can modify or delete a record.

5. **Inference/Eval Boundary** — Open `infra/INFERENCE_VS_TRAINING_BOUNDARY.md`. Show the hard boundary diagram: inference path (api-server, policy-engine, proof-chain) vs eval path (eval-os, run-ledger, aef-evals) are on separate Azure App Service plans, separate Key Vaults, separate billing meters. A `RUN_MODE` environment variable is enforced at the policy layer — an eval workload cannot masquerade as a production inference call.

6. **AEF Eval Results** — Show the AEF eval summary: 55 scenarios across 7 categories. Gate compliance: 1.00. Policy-violation scenarios: all 8 correctly blocked. Overall: 0.929.

### Key Talking Points
- Every prompt in production is version-pinned — `latest` is never used
- Rollback is a documented 5-minute procedure, not a war room incident
- The inference/eval boundary is enforced in infrastructure, not just in convention
- Policy gate compliance is 1.00 across all evaluated scenarios — governance is not aspirational, it is tested
