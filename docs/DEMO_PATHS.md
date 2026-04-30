# SZL Holdings — Demo Paths

**Updated:** April 28, 2026

## Overview

These demo narratives are grounded in what the current codebase can actually support. Each path uses live artifacts, real API endpoints, and implemented platform primitives. Every demo path has been classified by its current execution status — what runs with live data, what uses configured seed data, and what requires additional setup.

---

## Status Legend

| Label | Meaning |
|-------|---------|
| **Live** | Real external data feed; runs without additional configuration |
| **Beta** | Operational with seed/demo data; live data requires subscription or token |
| **Requires Setup** | Feature implemented; specific configuration needed before demo |
| **Roadmap** | Not yet implemented; documented for completeness |

---

## Demo 1: Maritime Delay → Cross-Domain Cascade

**Duration:** 8 minutes
**Artifacts:** Vessels, Terra, Counsel, Unified Command, API Server
**Primitives Used:** Signal Mesh, Proof Chain, Policy Engine, Decision Replay
**Execution Status:** Beta (AIS data simulated; NOAA/Open-Meteo weather data is live)

### Prerequisites

| Requirement | Status |
|-------------|--------|
| API Server running | Required — all data flows through the API |
| Vessels artifact running | Required |
| Terra artifact running | Required |
| Counsel artifact running | Required |
| Command artifact running | Required |
| AIS live telemetry | **Not available** — Vessels uses simulated vessel positions. Clearly label as simulated during demo. |
| NOAA + Open-Meteo data | **Live** — weather and routing data from real feeds |

### Narrative

1. **Signal Detection** — Open the Vessels dashboard. Point to a vessel approaching Rotterdam showing a 48-hour port delay. The signal has crossed the configured threshold (24h). Note: vessel position data is simulated; weather overlay is live NOAA data.

2. **Cross-Domain Cascade** — Walk through the `maritime-realestate` signal chain in the Event Fabric (`packages/signal-mesh`). The system routes the signal to Terra (flag port-adjacent properties at risk) and Counsel (identify force-majeure clause obligations).

3. **Governed Recommendation** — Show the Policy Engine evaluating the recommendation. The risk tier (Medium) triggers a human approval gate. Show the policy rule that determined the tier.

4. **Approval Gate** — Navigate to Unified Command. The operator sees the evidence bundle: vessel ID, delay hours, affected properties, policy reference. They approve the property timeline adjustment.

5. **Proof Chain** — Show the immutable proof chain entry: hash-linked evidence including vessel signal, delay hours, affected properties, policy reference, approver identity, and timestamp.

6. **Decision Replay** — Replay the full decision from the Trace Graph. Walk through what triggered, what data was used, what policy applied, who approved, and what happened.

### Key Talking Points
- No single-domain tool handles this three-domain cascade
- The proof chain satisfies audit requirements that dashboards cannot
- Decision replay is the feature enterprise buyers have never seen before
- Even with simulated AIS, the governance loop is fully live

---

## Demo 2: Security Incident → Legal Hold + Executive Risk

**Duration:** 6 minutes
**Artifacts:** Sentra (Cyber Resilience Command), Counsel, SZL Holdings Dashboard, API Server
**Primitives Used:** Signal Mesh, Proof Chain, Policy Engine, Outcome Graph
**Execution Status:** Beta (CISA KEV, NVD CVE, MITRE ATT&CK, AbuseIPDB feeds are live)

### Prerequisites

| Requirement | Status |
|-------------|--------|
| API Server running | Required |
| Sentra artifact running | Required |
| Counsel artifact running | Required |
| SZL Holdings Dashboard running | Required |
| CISA KEV / NVD data | **Live** — real vulnerability feeds |
| AbuseIPDB | **Live** — real threat intelligence |
| Some Sentra scenarios | Seeded for demonstration (some scenarios are demo data) |

### Narrative

1. **Incident Detection** — Open Sentra. Show a critical security incident detected (severity 0.9, sourced from live CVE/KEV data). The `security-legal` signal chain activates automatically.

2. **Automatic Legal Hold** — Counsel receives the cascade signal. An evidence preservation workflow initiates. Show the obligation tracker flagging the regulatory disclosure window.

3. **Executive Risk Update** — Navigate to the SZL Holdings Dashboard. The portfolio risk score has updated to reflect the incident's financial and reputational impact. Show the cross-domain signal lineage.

4. **Outcome Tracking** — Show the Outcome Graph linking the incident to downstream business outcomes. Explain the closed loop: "In 30 days, the system will compare predicted impact to actual outcome and calibrate its next recommendation."

### Key Talking Points
- Security → Legal → Executive is a three-domain cascade in under 2 seconds
- Every step is captured in an immutable proof chain
- Regulatory disclosure readiness is built in, not bolted on
- The outcome graph closes the loop — the system learns from what actually happened

---

## Demo 3: Platform Governance Walk-Through

**Duration:** 10 minutes
**Artifacts:** Unified Command, API Server, Pulse
**Primitives Used:** All six core primitives
**Execution Status:** Live (all governance infrastructure is operational; some KPIs are seeded)

### Prerequisites

| Requirement | Status |
|-------------|--------|
| API Server running | Required |
| Command artifact running | Required |
| Pulse artifact running | Required |
| Platform metrics file | **Live** — `generated/platform-metrics.json` auto-generated |
| Command Arena | **Live** — `scripts/evals/run-arena.ts` executable |

### Narrative

1. **Health Overview** — Start at `/api/health`. Show 8+ platform apps, database latency (<20ms), service status. Every service is instrumented with OpenTelemetry.

2. **Platform Metrics** — Show `generated/platform-metrics.json` with code-derived counts: 14 registered artifacts, 123 packages, 6,235+ TS/TSX files, 798 DB tables, 12/12 primitives implemented. Emphasize: "These are not hand-maintained numbers. They're generated from the codebase on every CI run."

3. **Command Arena** — Run `npx tsx scripts/evals/run-arena.ts`. Walk through the multi-dimensional scoring: correctness, evidence completeness, approval compliance, replay integrity, policy adherence. Show the policy gate compliance rate.

4. **Architecture Walk** — Open `docs/CORE_PLATFORM_PRIMITIVES.md`. Show the six core primitives with their package locations: Outcome Graph (`lib/outcome-graph`), Proof Chain (`lib/proof-chain`), Decision Replay (`packages/replay-core`), Policy Engine (`lib/policy-engine`), Event Fabric (`packages/signal-mesh`), GenAI Observability (`packages/cognitive-observability`). These are real packages, not PowerPoint.

5. **Trust Center** — Walk through `docs/TRUST_CENTER.md`. Show security controls, governance architecture, compliance readiness, and — critically — disclosed gaps. "We tell you what isn't ready yet. That's the trust signal."

### Key Talking Points
- Every number is code-derived, not hand-maintained
- The primitives are packages with tests, not architecture slides
- The gaps are disclosed, not hidden — that's the governance posture
- An investor or auditor can verify every claim in this room

---

## Demo 4: Registry & Release Confidence Walk-Through

**Duration:** 6 minutes
**Artifacts:** API Server, Unified Command
**Primitives Used:** Prompt Registry, Eval OS, Run Ledger, Policy Engine
**Execution Status:** Beta (registries implemented; CLI tooling is roadmap)
**Audience:** Technical buyer or engineering evaluator

### Prerequisites

| Requirement | Status |
|-------------|--------|
| API Server running | Required |
| `lib/prompt-registry` populated | **Operational** — versioned prompt inventory |
| `lib/eval-os` configured | **Operational** — 7+ active eval suites |
| `lib/run-ledger` | **Operational** — append-only run history |
| Registry CLI (`pnpm registry:prompt`) | **Roadmap** (Phase 8) — currently manual registry update |

### Narrative

1. **Prompt Registry** — Open `lib/prompt-registry/README.md`. Show the versioned prompt inventory: active prompts with semver lifecycle, allowed data scopes, and eval scores. Highlight the promotion path (EVAL → STAGING → ACTIVE) and how a prompt in `rollback-candidate` status is isolated.

2. **Rollback Demonstration** — Walk through the rollback procedure for a prompt flagged as `rollback-candidate`. Update the registry entry status, restart the worker — under 5 minutes end-to-end. "This is a 5-minute documented procedure, not a war room incident."

3. **Eval OS** — Show `lib/eval-os/README.md`. Walk through active eval suites with scores. Point out: gate compliance on `core-policy-suite` is 1.00 — no policy gate was bypassed in any evaluated scenario.

4. **Run Ledger** — Show `lib/run-ledger/README.md`. Recent run history: multiple runs in the last 14 days, one flagged as `rollback-trigger`. Every run shows input tokens, cost, outcome, and operator. Append-only — no human can modify or delete a record.

5. **Inference/Eval Boundary** — Open `infra/INFERENCE_VS_TRAINING_BOUNDARY.md`. Show the hard boundary: inference path vs. eval path on separate resources, separate Key Vaults, separate billing meters. A `RUN_MODE` environment variable is enforced at the policy layer.

6. **AEF Eval Results** — Show the AEF eval summary: 55 scenarios across 7 categories. Gate compliance: 1.00. Policy-violation scenarios: all correctly blocked. Overall: 0.929.

### Key Talking Points
- Every prompt in production is version-pinned — `latest` is never used
- Rollback is a documented 5-minute procedure, not a war room incident
- The inference/eval boundary is enforced in infrastructure, not just convention
- Policy gate compliance is 1.00 — governance is tested, not aspirational

---

## Operational vs. Demo/Pilot Status Summary

| Demo | Live Data | Seed/Simulated Data | Requires Setup |
|------|-----------|-------------------|----------------|
| Demo 1: Maritime Cascade | NOAA weather, Open-Meteo routing | AIS vessel positions | AIS subscription for live vessel tracking |
| Demo 2: Security Response | CISA KEV, NVD CVE, AbuseIPDB | Some Sentra incident scenarios | None |
| Demo 3: Platform Governance | Platform metrics, CI data, Arena results | Some dashboard KPIs | None |
| Demo 4: Registry & Release | Prompt registry, eval suites, run ledger | None | None (CLI automation is roadmap) |

---

## Demo Environment Checklist

Before running any demo:

- [ ] API server running and healthy (`GET /api/health` returns 200)
- [ ] Target domain artifact(s) running
- [ ] Browser DevTools closed (avoid exposing internal network calls)
- [ ] `DEMO_MODE=true` if using seeded data (confirms seed data policy compliance)
- [ ] Demo environment uses a dedicated demo org (not production tenant)
- [ ] Proof chain populated with a recent example decision to demonstrate replay
