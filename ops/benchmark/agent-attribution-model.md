# Agent Attribution Model

**Last updated:** April 2026
**Purpose:** Define how AI agent actions are attributed and governed across the platform

---

## Competitive Context

### Palantir AIP Agents
- Agents operate on the Ontology with defined permissions
- Agent actions are logged but not formally attributed with confidence scores
- Human-in-the-loop is supported but not structurally required

### SZL Agent Attribution
Every AI agent action in SZL produces a governed attribution record:

```
AgentAttribution {
  agentId: string
  modelId: string
  modelProvider: string
  confidenceScore: number (0.0 - 1.0)
  inputSources: Array<{ type, id, label }>
  outputType: "recommendation" | "classification" | "summarization" | "prediction"
  proofChainId: string
  outcomeId: string (linked after outcome is recorded)
  reviewState: "pending" | "approved" | "rejected" | "auto-approved"
  timestamp: ISO-8601
}
```

---

## Attribution Levels

| Level | Description | Governance Requirement |
|-------|-------------|----------------------|
| **L0: Informational** | Agent provides context (summaries, classifications) | Proof chain record only |
| **L1: Advisory** | Agent recommends an action | Proof chain + human review required |
| **L2: Consequential** | Agent action has operational impact | Proof chain + Covenant Policy + human approval |
| **L3: Critical** | Agent action has safety/compliance implications | Proof chain + Policy + executive approval + simulation |

---

## Agent Performance Tracking

The Outcome Graph enables closed-loop agent performance measurement:

| Metric | Formula | Healthy Range |
|--------|---------|--------------|
| Acceptance Rate | Accepted / Total Recommendations | 60-80% |
| Achievement Rate | Achieved Outcomes / Accepted Recommendations | > 70% |
| Override Rate | Human Overrides / Total Decisions | 5-15% |
| Confidence Calibration | Correlation(stated confidence, actual success) | > 0.75 |
| False Positive Rate | False Positives / Total Alerts | < 15% |

---

## Human vs. Agent Decision Matrix

| Decision Type | Agent Role | Human Role | Governance |
|---------------|-----------|-----------|-----------|
| Signal classification | Agent classifies severity | Human reviews critical classifications | L0 attribution |
| Cross-domain correlation | Agent identifies patterns | Human validates correlation hypothesis | L1 attribution |
| Response recommendation | Agent proposes actions | Human approves or modifies | L2 attribution |
| Cost simulation | Agent runs Monte Carlo | Human reviews distribution and risk | L1 attribution |
| Policy evaluation | System evaluates automatically | Human reviews denials and escalations | L2 attribution |
| Emergency response | Agent proposes immediate actions | Human approves critical actions | L3 attribution |

---

## Competitive Advantage

SZL's agent attribution model is more comprehensive than any competitor:
- **Palantir:** Logs agent actions but doesn't track outcomes
- **Copilot tools:** No attribution, no confidence calibration
- **SZL:** Full attribution with source citations, confidence tracking, outcome measurement, and closed-loop calibration
