# Agent Evaluation Framework

## Overview

The SZL Holdings Agent Evaluation Framework provides a structured, measurable, and reproducible approach to benchmarking AI agent behavior across all platform domains (Aegis, Vessels, Terra, Prism Counsel, and cross-domain). It encompasses three interlinked capabilities:

1. **Replay Lab** — captures real incidents and agent flows into sanitized, replayable datasets
2. **Eval Lab** — benchmarks agent strategies with precision, recall, usefulness, policy compliance, cost, latency, and operator override rate
3. **Trust Console** — a production dashboard tracking recommendation quality, autonomous action safety, failure modes, and regression history

---

## Architecture

### Packages

| Package | Location | Purpose |
|---|---|---|
| `@szl-holdings/replay-core` | `packages/replay-core/` | Incident/flow capture, snapshot generation, PII redaction, scenario registry, and workflow replay |
| `@szl-holdings/evals-core` | `packages/evals-core/` | Evaluation runner, precision/recall metrics, policy compliance, override metrics, cost/latency analytics, regression detection, and strategy comparison |

### UI Surfaces (Command App)

| Surface | Route | Purpose |
|---|---|---|
| Replay Lab | `/operations/alloy/replay-lab` | Browse captured scenarios, replay against agents, compare outcomes |
| Eval Lab | `/operations/alloy/eval-lab` | Run evaluation suites, view benchmarks, track regressions |
| Trust Console | `/operations/alloy/trust-console` | Production trust dashboard with all real-time metrics |

### API Backend

| Route | Purpose |
|---|---|
| `GET /pulse-evals/datasets` | List available eval domains and case counts |
| `POST /pulse-evals/run` | Run an eval suite against a mock or real executor |
| `POST /pulse-evals/run-red-team` | Run red-team safety evaluations |
| `POST /pulse-evals/compare` | Compare two or more eval suite reports |
| `POST /pulse-evals/baseline` | Record a baseline for regression detection |
| `POST /pulse-evals/check-regression` | Check a new report against its baseline |
| `GET /pulse-evals/regression-dashboard` | Summarize all tracked regressions |

---

## Replay Core (`@szl-holdings/replay-core`)

### Capture

```typescript
import { captureIncident, captureFlow } from "@szl-holdings/replay-core/capture";

const snapshot = captureIncident({
  id: "snap-001",
  scenarioId: "aegis-soc-threat-triage-v1",
  domain: "aegis",
  incidentType: "ransomware",
  severity: "critical",
  title: "Ransomware lateral movement detected",
  description: "...",
  inputContext: { endpoints: 14, vlans: 3 },
  outcome: "escalated",
}, { source: "automatic", tags: ["soc", "critical"] });
```

### Snapshots

Snapshots are sanitized historical context records. They include:
- `historicalContext` — state of the world at capture time (env metrics, prior incidents, threat baseline)
- `agentInputs` — the actual inputs presented to the agent (can be multiple for multi-turn)
- `groundTruth` — the correct expected output for evaluation purposes

PII is automatically redacted when `redactPII()` is called before a snapshot is stored or exported.

### Replay

```typescript
import { replayScenario } from "@szl-holdings/replay-core/replay";
import { listSnapshots } from "@szl-holdings/replay-core/snapshot";

const snapshots = listSnapshots({ domain: "aegis" });
const report = await replayScenario(snapshots, myAgentExecutor, {
  maxConcurrency: 3,
  compareGroundTruth: true,
});

console.log(report.groundTruthMatchRate); // e.g. 0.87
```

### Seeded Scenarios

Seven production-grade scenarios are registered on package load across four domains:

1. **`aegis-soc-threat-triage-v1`** — Ransomware lateral movement across 14 endpoints with 3 snapshots covering initial alert, T2 analyst override, and post-incident artifact generation.
2. **`vessels-voyage-pnl-optimization-v1`** — Voyage route optimization under cyclone constraints with 2 snapshots covering the diversion decision and post-voyage P&L reconciliation.
3. **`vessels-charter-rate-negotiation-v1`** — Competing charter party offer analysis for a handymax vessel with 2 snapshots covering offer comparison and fixture recap clause audit.
4. **`terra-portfolio-stress-test-v1`** — 200bps rate shock impact across a 12-asset mixed-use portfolio with 3 snapshots covering stress modeling, disposition decision, and board-level report generation.
5. **`terra-asset-valuation-override-v1`** — 12% valuation discrepancy reconciliation for a Grade-A London office asset with 2 snapshots covering cap rate analysis and RICS compliance audit.
6. **`prism-sar-filing-workflow-v1`** — AML structuring/layering detection with 3 snapshots covering suspicious activity classification, SAR narrative drafting, and tipping-off guardrail enforcement.
7. **`prism-compliance-breach-response-v1`** — GDPR data breach notification workflow with 3 snapshots covering breach severity classification, ICO Article 33 notification drafting, and Article 34 data subject notification decision.

---

## Evals Core (`@szl-holdings/evals-core`)

### Evaluation Metrics

#### Precision & Recall

```typescript
import { computePrecisionRecall } from "@szl-holdings/evals-core/metrics";

const metrics = computePrecisionRecall(predictions, groundTruths);
// { precision, recall, f1Score, accuracy, truePositives, ... }
```

#### Usefulness Score

Composite of relevance (30%), completeness (20%), accuracy (35%), and actionability (15%).

```typescript
import { computeUsefulnessScore } from "@szl-holdings/evals-core/metrics";

const score = computeUsefulnessScore({ relevance: 0.88, completeness: 0.75, accuracy: 0.92, actionability: 0.80 });
// { composite: 0.866, ... }
```

#### Policy Compliance

```typescript
import { computePolicyCompliance } from "@szl-holdings/evals-core/metrics";

const result = computePolicyCompliance(policyCheckResults);
// { complianceRate, criticalViolations, violations, ... }
```

#### Operator Override Rate

```typescript
import { computeOverrideMetrics } from "@szl-holdings/evals-core/metrics";

const metrics = computeOverrideMetrics(decisions);
// { overrideRate: 0.12, overrideReasons: { scope_underestimation: 3 }, ... }
```

#### Cost & Latency

```typescript
import { computeCostLatencyMetrics } from "@szl-holdings/evals-core/metrics";

const metrics = computeCostLatencyMetrics(samples, successfulOutcomes);
// { avgLatencyMs, p50LatencyMs, p95LatencyMs, p99LatencyMs, costPerOutcome, ... }
```

### Running an Eval Suite

```typescript
import { runEvalSuite } from "@szl-holdings/evals-core/runner";

const report = await runEvalSuite(cases, myExecutor, {
  suiteId: "soc-triage-v2",
  suiteName: "SOC Triage with GPT-4o fine-tuned",
  domain: "aegis",
  maxConcurrency: 5,
});

console.log(report.passRate);      // e.g. 0.893
console.log(report.precision);     // PrecisionRecallMetrics
console.log(report.usefulness);    // UsefulnessScore
```

### Precision/Recall Ground Truth Labels

Each `EvalCase` carries an optional `expectedOutcome?: "pass" | "fail"` field that defines its role in the precision/recall matrix:

- **`"pass"` (default)** — A standard case. The agent should produce the correct output matching `groundTruth`. Maps to ground truth = positive. TP = agent passed; FN = agent failed.
- **`"fail"`** — A negative/red-team case. The agent should refuse or produce a specific failure signal. `groundTruth` should contain the expected refusal markers (e.g., `{ refused: true, injectionDetected: true }`). The case is scored by comparing agent output to `groundTruth` — a correct refusal has score ≥ 0.7 (`passed = true`). Maps to ground truth = negative. PR prediction is inverted (`!passed`): TN when agent correctly refuses; FP when agent fails to refuse.

**PR/TN matrix:**
| Case type | Agent passes | Agent fails |
|---|---|---|
| Standard (`"pass"`, gt=true) | TP | FN |
| Red-team (`"fail"`, gt=false) | TN (correct refusal) | FP (failed to refuse) |

**Important**: suites containing only `"pass"` cases will always have precision = 1.0 (no FPs possible without negative examples). Include explicit `"fail"` / red-team cases to produce meaningful FP counts and non-trivial precision values.

### Regression Detection

```typescript
import { recordBaseline, checkRegression } from "@szl-holdings/evals-core/regression";

// After a known-good run:
recordBaseline(goodReport);

// After a subsequent run:
const regression = checkRegression(newReport, 5); // 5% threshold
if (regression?.hasRegression) {
  console.log(regression.severity); // "minor" | "major" | "critical"
  console.log(regression.regressions); // ["Pass rate dropped 8.2%", ...]
}
```

### Strategy Comparison

```typescript
import { compareSuites } from "@szl-holdings/evals-core/compare";

const comparison = compareSuites([reportA, reportB, reportC]);
console.log(comparison.winner);         // "SOC Triage with GPT-4o fine-tuned"
console.log(comparison.recommendation); // Human-readable recommendation
```

---

## Trust Console Metrics Reference

The Trust Console tracks these key production signals:

| Metric | Target | Description |
|---|---|---|
| Recommendation Acceptance Rate | ≥ 85% | % of agent recommendations accepted without override |
| Operator Override Rate | ≤ 15% | % of agent decisions manually overridden |
| Execution Success Rate | ≥ 97% | % of autonomous executions that completed without error |
| Time to Triage | ≤ 5 min | Alert ingestion → agent classification |
| Time to Decision | ≤ 12 min | Triage → recommended action |
| Time to Remediation | ≤ 45 min | End-to-end incident resolution |
| False Positive Rate | ≤ 4% | Agent-flagged incidents cleared as non-issues |
| Policy Violation Rate | ≤ 0.5% | Actions triggering policy guardrails |
| Agent Regression Rate | ≤ 3% | Eval re-runs showing measurable degradation |
| Token Cost per Outcome | ≤ $0.012 | Cost per successful autonomous outcome |
| Business Value Protected | Rolling QTD | Estimated financial value saved by agent actions |

---

## Eval Suite Definitions

| Suite | Domain | Cases | Red-Team | Strategies Supported |
|---|---|---|---|---|
| Signal Ranking Accuracy | pulse | 42 | 8 | gpt-4o-base, gpt-4o-finetuned, claude-3-5-sonnet |
| SOC Triage Decision Quality | aegis | 28 | 5 | gpt-4o-base, gpt-4o-rlhf, claude-3-5-sonnet |
| Voyage & Charter Commercial Reasoning | vessels | 18 | 3 | gpt-4o-base, gpt-4o-finetuned |
| Portfolio Stress & Valuation | terra | 22 | 4 | gpt-4o-base, gpt-4o-finetuned, claude-3-5-sonnet |
| AML & Compliance Breach Response | prism | 24 | 6 | gpt-4o-base, gpt-4o-finetuned |
| Policy Compliance & Safety | cross | 55 | 20 | gpt-4o-base, gpt-4o-finetuned |
| Artifact Generation Quality | cross | 35 | 0 | gpt-4o-base, gpt-4o-finetuned, claude-3-5-sonnet |
| Hallucination & Calibration | cross | 30 | 0 | gpt-4o-base, gpt-4o-finetuned |

---

## Scenario Registry

Seeded scenarios ship with the `@szl-holdings/replay-core` package:

### `aegis-soc-threat-triage-v1`

**Tags:** security, ransomware, soc, triage, critical, ground-truth

Three snapshots covering the full lifecycle of a real SOC incident:
1. Initial alert: ransomware lateral movement detected, 3 endpoints compromised
2. T2 escalation: blast radius underestimated by agent, human override recorded
3. Post-incident: executive report generation and compliance impact

**Ground truth provided:** yes. Suitable for precision/recall benchmarking.

### `vessels-voyage-pnl-optimization-v1`

**Tags:** maritime, voyage, pnl, optimization, routing

Two snapshots covering voyage optimization and post-voyage validation:
1. Optimization decision: MV Poseidon route optimization under cyclone constraint; ground truth confirms Cape of Good Hope diversion as the correct recommendation
2. Post-diversion reconciliation: actual voyage P&L audit validates the diversion decision and quantifies net diversion cost vs avoided cyclone risk

### `vessels-charter-rate-negotiation-v1`

**Tags:** maritime, charter, negotiation, commercial, fixture, ground-truth

Two snapshots covering the full charter fixture lifecycle:
1. Offer comparison: two competing charter party offers (grain vs fertilizer) evaluated against Baltic Handymax Index; ground truth recommends CTR-A due to absence of deviation clause and hold-cleaning risk
2. Fixture recap audit: laytime and demurrage clause review of the signed charter; ground truth flags WIBON weather exposure and recommends amendment

**Ground truth provided:** yes. Suitable for commercial reasoning and clause-risk benchmarking.

### `terra-portfolio-stress-test-v1`

**Tags:** real-estate, stress-test, portfolio, rate-shock, dcf, ground-truth

Three snapshots covering a full fund-level stress event:
1. Rate shock modeling: 200bps shock applied to a 12-asset portfolio; agent identifies two covenant-breach assets and a disposition priority ranking
2. Disposition decision: three options evaluated for a Manchester retail park breaching 70% LTV covenant; ground truth recommends immediate sale over refinance or JV
3. Board report generation: artifact generation for AIFMD/Basel-III audience including heat map, disposition plan, and sensitivity table

**Ground truth provided:** yes. Suitable for DCF reasoning, covenant detection, and artifact-generation benchmarking.

### `terra-asset-valuation-override-v1`

**Tags:** real-estate, valuation, appraisal, dispute, office, ground-truth

Two snapshots covering an appraisal discrepancy resolution:
1. Valuation reconciliation: 13.2% gap between internal model (£96.2M) and third-party appraisal (£85M) for a Grade-A London office; ground truth identifies cap rate assumption as primary driver and recommends revising internal cap rate to 5.2%
2. RICS compliance audit: methodology audit against RICS Red Book 2024; ground truth confirms report is NAV-ready with one minor deficiency (missing downside sensitivity scenario)

**Ground truth provided:** yes. Suitable for valuation methodology reasoning and compliance audit benchmarking.

### `prism-sar-filing-workflow-v1`

**Tags:** compliance, aml, sar, fincen, suspicious-activity, ground-truth

Three snapshots covering end-to-end SAR filing:
1. Suspicious activity detection: structuring (ACCT-0471) and layering (ACCT-1882) patterns identified across two accounts; ground truth requires SAR filing for both within 30 days
2. SAR narrative drafting: FinCEN-compliant narrative for ACCT-0471 structuring case; ground truth validates required narrative elements, word count, and PII handling
3. Post-SAR guardrail: tipping-off prohibition check blocks proposed client closure notice; agent correctly permits account freeze and law enforcement escalation only

**Ground truth provided:** yes. Suitable for AML reasoning, regulatory drafting quality, and compliance guardrail benchmarking.

### `prism-compliance-breach-response-v1`

**Tags:** compliance, gdpr, data-breach, notification, regulatory, ground-truth

Three snapshots covering the GDPR breach notification lifecycle:
1. Breach classification: 2,400-record exfiltration including national IDs; agent classifies as high severity, starts 72-hour ICO notification clock, and mandates data subject notification
2. ICO Article 33 notification draft: structured report to supervisory authority with all required GDPR sections; ground truth validates completeness and factual tone
3. Article 34 threshold decision: agent correctly rejects the "sufficient technical measures" exception because encryption was not in place at breach time, making data subject notification mandatory

**Ground truth provided:** yes. Suitable for regulatory deadline reasoning, notification quality, and exception-logic benchmarking.

---

## Adding New Scenarios

```typescript
import { registerScenario } from "@szl-holdings/replay-core/scenarios";

registerScenario({
  id: "my-domain-scenario-v1",
  name: "My Domain — Key Decision",
  domain: "my-domain",
  description: "What this scenario tests",
  tags: ["ground-truth", "my-domain"],
  snapshots: [
    {
      id: "snap-my-001",
      scenarioId: "my-domain-scenario-v1",
      label: "Step 1 — Initial context",
      domain: "my-domain",
      snapshotType: "incident",
      version: "1.0",
      sanitized: true,
      createdAt: new Date().toISOString(),
      tags: [],
      historicalContext: { /* ... */ },
      agentInputs: [{ /* ... */ }],
      groundTruth: { /* ... */ },
      metadata: {},
    },
  ],
});
```

---

## Capture-to-Replay Pipeline

Captured incidents and flows (from `captureIncident()`/`captureFlow()`) are stored in a raw capture store and must be explicitly converted into `ReplaySnapshot` objects before they can be run through `replaySnapshot()` or `replayScenario()`.

The conversion pipeline is:

```
captureIncident()          →  raw IncidentSnapshot (in-memory capture store)
    ↓
redactIncidentPII()        →  sanitized IncidentSnapshot (piiRedacted=true)
    ↓
incidentToReplaySnapshot() →  ReplaySnapshot (registered in snapshot store)
    ↓
replaySnapshot()           →  ReplayRunReport (with ground-truth comparison)
```

Or in batch from an exported dataset:

```typescript
import { exportDataset, batchConvert, replayScenario } from "@szl-holdings/replay-core";

// Export with mandatory PII redaction applied to every field
const dataset = exportDataset();

// Convert all incidents and flows to ReplaySnapshots (registered in snapshot store)
const { total } = batchConvert(dataset, { register: true });

// Run replay against any registered scenario
const report = await replayScenario("aegis-soc-threat-triage-v1", myExecutor);
```

### Converter behavior

| Source field | Mapped to |
|---|---|
| `incident.inputContext` | `historicalContext` + `agentInputs[0]` |
| `incident.agentDecision` | `groundTruth` (expected agent behavior) |
| `flow.steps[*].input` | `agentInputs[*]` (per-step inputs) |
| `flow.steps[-1].output` | `groundTruth` (end-to-end expected output) |
| `captureContext.tags` | merged into `snapshot.tags` |
| `severity`, `outcome`, etc. | `snapshot.metadata` |

**Warning**: if a snapshot is not yet PII-redacted, `incidentToReplaySnapshot()` and `flowToReplaySnapshot()` log a console warning. Always redact before converting for safe replay pipelines.

---

## Security & Privacy

### PII redaction guarantees

Snapshots are **not** automatically redacted at capture time — raw data is stored in-memory as captured to preserve fidelity for replay. Redaction must be applied explicitly before export or sharing:

- Call `redactIncidentPII(snapshot, additionalFields?)` to redact a single incident snapshot. Returns a new object with `piiRedacted: true`.
- Call `exportDataset(additionalFields?)` to export the full capture store with mandatory deep-field PII redaction applied to **every snapshot and every flow step**. The exported result is safe for eval/replay pipelines.
- `redactPII()` in `snapshot.ts` provides the same deep redaction for `ReplaySnapshot` objects.
- The default sensitive field list is: `email`, `phone`, `ssn`, `name`, `address`, `ip`, `creditCard`, `dob`, `passport`.

**Never pass raw (non-redacted) incident captures to an eval executor or share them externally.** Always use `exportDataset()` or call `redactIncidentPII()` first.

### Eval data guidelines

- Eval case inputs should use anonymized or synthetic data, not real customer records.
- Red-team evals are restricted to the `admin` role on the API (`POST /pulse-evals/run-red-team`).
- Eval results and baselines are stored in-memory only; no eval case inputs, outputs, or ground truth are written to the audit chain or any persistent store (pending the database persistence follow-up task).

---

## Roadmap

- Full domain pack replay coverage (Aegis, Vessels, Terra, Prism, Lyte)
- NVIDIA-accelerated simulation for large-scale scenario batches
- Live eval-on-deploy CI gate (auto-run eval suite on each merge)
- Longitudinal agent genome score tracking integrated with Trust Console
- Adversarial red-team scenario library expansion (30+ cases per domain)
