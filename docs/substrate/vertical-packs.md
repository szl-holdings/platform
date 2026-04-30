# Substrate Vertical Packs

Phase 2 of the Sovereign Execution Substrate ships one production workflow per vertical product. Each pack runs end-to-end through the same governed runtime — same policy compiler, same evidence chain, same approval gates, same OpenTelemetry traces — regardless of the product surface.

---

## Reference Workflows (Phase 2)

These four workflows are domain-agnostic composition kernels that vertical packs compose.

### Cross-System Reconciliation

| Property | Value |
|---|---|
| Workflow ID | `cross-system-reconciliation` |
| Pipeline | Retrieve (A) → Retrieve (B) → Reason → Verify → ApprovalGate → Decide |
| Policy profile | `reconciliation-policy` |
| Approval threshold | Operator |
| High-risk side effects | `financial`, `deletion`, `write-external`, `write-internal`, `infrastructure` |

**Evidence sources**: Two configurable system retrievers (`system-a-retriever`, `system-b-retriever`).

**Approval**: Required before any corrective write is issued. Approval routes to the `cross-system-reconciliation` inbox pattern.

**Dry-run / replay**: Retrieval and reasoning stages run; the Decide stage outputs `{ suppressed: true }` — no writes.

---

### Executive Brief

| Property | Value |
|---|---|
| Workflow ID | `executive-brief` |
| Pipeline | Retrieve → Reason → Verify → Decide |
| Policy profile | `executive-brief-policy` |
| Approval threshold | Manager (for escalated briefs) |
| High-risk side effects | `write-external`, `financial`, `deletion` |

**Evidence sources**: `signal-retriever` — cross-domain signal aggregator.

**Approval**: Auto-publish path (no ApprovalGate stage) — brief is published automatically once verified. High-risk external writes still require manager approval.

**Dry-run / replay**: Brief reasoning stage outputs a structured draft; publish stage is suppressed.

---

### Risk Escalation

| Property | Value |
|---|---|
| Workflow ID | `risk-escalation` |
| Pipeline | Retrieve → Reason → Verify → ApprovalGate → Decide |
| Policy profile | `risk-escalation-policy` |
| Approval threshold | Operator |
| High-risk side effects | `escalation`, `notification`, `write-external` |

**Evidence sources**: `risk-signal-retriever` — alert, anomaly, compliance gap, and prior escalation corpus.

**Approval**: Required before escalation actions are committed. Inbox pattern: `risk-escalation`.

---

### Evidence-Based Recommendation

| Property | Value |
|---|---|
| Workflow ID | `evidence-based-recommendation` |
| Pipeline | Retrieve → Reason → Verify → ApprovalGate → Decide |
| Policy profile | `evidence-recommendation-policy` |
| Approval threshold | Operator |
| High-risk side effects | `financial`, `write-external`, `deletion`, `escalation`, `infrastructure` |

**Evidence sources**: `evidence-retriever` — historical records, metrics, prior decisions, external reference.

**Approval**: Operator reviews evidence bundle before decision packet is issued. Inbox pattern: `evidence-based-recommendation`.

**Output**: Dense decision packet + sparse provenance graph from `run.stageResults`.

---

## Vertical Workflow Packs

### Lyte — Operational Drift Review

| Property | Value |
|---|---|
| Workflow ID | `lyte-operational-drift` |
| Domain | `lyte` |
| Pipeline | Retrieve → Reason → Verify → ApprovalGate → Decide |
| Policy profile | `lyte-drift-policy` |
| Approval threshold | Operator |
| Evidence sources | `lyte-retriever` — SLO history, config snapshots, resource utilisation trends |
| Inbox pattern | `lyte-operational-drift` |
| UI entry point | Lyte Command Center → Run Console → "Operational Drift Review" |

**What it detects**: SLO compliance drift velocity, configuration divergence across services, capacity headroom trends.

**Output**: `DriftItem[]` ranked by drift score + `OperationalDriftDecision` with per-service remediation actions.

**Approval thresholds**: Any corrective write (`write-internal`, `write-external`, `infrastructure`) requires operator sign-off.

---

### Aegis — Threat Triage and Escalation Routing

| Property | Value |
|---|---|
| Workflow ID | `aegis-threat-triage` |
| Domain | `aegis` |
| Pipeline | Retrieve → Reason → Verify → ApprovalGate → Decide |
| Policy profile | `aegis-threat-triage-policy` |
| Approval threshold | Operator (SOC analyst) |
| Evidence sources | `aegis-retriever` — CVE feeds, alert clusters, MITRE ATT&CK correlations |
| Inbox pattern | `aegis-threat-triage` |
| UI entry point | Aegis → Decision Console → "Threat Triage" |

**What it detects**: CVE exploitation, lateral movement indicators, anomalous auth, dark-fleet correlations.

**Output**: `TriagedThreat[]` with tier (T1–T4), CVSS score, blast radius + `ThreatTriageDecision` with routing actions.

**Approval thresholds**: Escalation and notification side effects require operator approval before dispatch.

---

### Vessels — Voyage Event Anomaly Review

| Property | Value |
|---|---|
| Workflow ID | `vessels-voyage-anomaly` |
| Domain | `vessels` |
| Pipeline | Retrieve → Reason → Verify → ApprovalGate → Decide |
| Policy profile | `vessels-voyage-anomaly-policy` |
| Approval threshold | Operator (maritime ops analyst) |
| Evidence sources | `vessels-retriever` — AIS position history, port call records, STS event logs |
| Inbox pattern | `vessels-voyage-anomaly` |
| UI entry point | Vessels → Command Workflows → "Voyage Anomaly Review" |

**What it detects**: AIS dark periods, unexpected port calls, STS transfers with sanctioned vessels, route deviations, sanctions proximity.

**Output**: `VoyageAnomaly[]` with type and coordinates + `VoyageAnomalyDecision` with escalation actions and case IDs.

**Approval thresholds**: Escalation and case creation require operator approval. Evidence bundles are signed for regulatory reporting.

---

### Terra — Property Portfolio Anomaly and Event Intelligence

| Property | Value |
|---|---|
| Workflow ID | `terra-portfolio-anomaly` |
| Domain | `terra` |
| Pipeline | Retrieve → Reason → Verify → ApprovalGate → Decide |
| Policy profile | `terra-portfolio-anomaly-policy` |
| Approval threshold | Operator (portfolio manager) |
| Evidence sources | `terra-retriever` — AVM data, vacancy rates, tenant credit scores, covenant dashboards |
| Inbox pattern | `terra-portfolio-anomaly` |
| UI entry point | Terra → Decision Center → "Portfolio Anomaly Review" |

**What it detects**: Distress signals, AVM outliers, tenant risk events, covenant breach risk, market dislocation correlations.

**Output**: `PortfolioAnomaly[]` with type and deviation + `PortfolioAnomalyDecision` with property-level action items.

**Approval thresholds**: Financial writes and external notifications require operator approval.

---

### Counsel — Matter Evidence Packaging and Deadline Escalation

| Property | Value |
|---|---|
| Workflow ID | `prism-counsel-evidence-packaging` |
| Domain | `prism-counsel` |
| Pipeline | Retrieve → Reason → Verify → ApprovalGate → Decide |
| Policy profile | `prism-counsel-evidence-policy` |
| Approval threshold | Operator (supervising attorney / legal ops) |
| Evidence sources | `counsel-retriever` — matter files, document bundles, obligation timelines, privilege designations |
| Inbox pattern | `prism-counsel-evidence-packaging` |
| UI entry point | Counsel → Audit Trail → "Evidence Packaging" |

**What it produces**: Structured `EvidencePackage[]` per matter with privilege-reviewed document bundles + `MatterDeadline[]` with urgency scores.

**Output**: `PrismCounselDecision` with deadline escalations and attorney assignments.

**Approval thresholds**: Attorney or legal ops manager must approve before client notification or external document submission.

---

### Carlota Jo — White-Glove Task Routing and Approval Coordination

| Property | Value |
|---|---|
| Workflow ID | `carlota-jo-task-routing` |
| Domain | `carlota-jo` |
| Pipeline | Retrieve → Reason → Verify → ApprovalGate → Decide |
| Policy profile | `carlota-jo-task-routing-policy` |
| Approval threshold | Operator (practice lead) |
| Evidence sources | `carlota-retriever` — client profiles, engagement history, advisor capacity and expertise matrix |
| Inbox pattern | `carlota-jo-task-routing` |
| UI entry point | Carlota Jo → Governed Cockpit → "Task Routing" |

**What it does**: Matches incoming client tasks to advisors by expertise score, availability, and relationship depth. Generates SLA commitment and client notification draft.

**Output**: `AdvisorMatch[]` ranked by overall score + `TaskRoutingDecision` with assignment, SLA, and notification draft.

**Approval thresholds**: Practice lead approves routing before task is confirmed and client is notified.

---

## Common Patterns

All vertical packs share the same substrate patterns:

- **Evidence chains**: Every stage transition writes a signed `EvidenceBundle` to the `SubstrateJournal`. The bundle includes `inputHash`, `outputHash`, `bundleHash`, and HMAC-SHA256 `signature`.
- **Approval gates**: `ApprovalGate` stages submit to `@workspace/approvals-inbox` in live mode. In dry-run, replay, and counterfactual modes, the gate auto-approves.
- **Counterfactual replay**: Any run can be replayed with an alternative model adapter (`counterfactualModel`) or policy profile (`counterfactualPolicy`) to produce a diff.
- **Dry-run safety**: All `ToolCall` and mutating `Decide` side effects are suppressed in non-live modes. Side effects produce `{ suppressed: true, reason: "non-live mode" }`.
- **OTel traces**: Every stage emits a span to `@workspace/cognitive-observability` with `vertical`, `stage_category`, and `mode` tags.

## Running a Vertical Pack

```typescript
import { runLyteOperationalDrift } from "@szl/substrate";

const result = await runLyteOperationalDrift(
  { services: ["lyte-api-gateway"], lookbackHours: 72 },
  { mode: "dry-run" }  // safe for demo/test
);

console.log(result.run.status);        // "dry-run-complete"
console.log(result.driftItems);         // DriftItem[]
console.log(result.pendingApprovalId);  // null in dry-run
```

## Wiring a New Vertical

1. Import the workflow and runner from `@szl/substrate/workflows/<pack-name>`.
2. Add a `SubstrateWorkflowPanel` component to the vertical's existing operator page (no new pages).
3. The panel calls the runner, surfaces status in the operator inbox, and routes the evidence bundle to the journal + trace viewer.
4. Register the workflow retriever adapter if running in live mode (see `registerLyteRetrieverAdapter` pattern).
