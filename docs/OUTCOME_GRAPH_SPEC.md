# SZL Holdings — Outcome Graph Specification

## Purpose

The Outcome Graph tracks the full lifecycle of a decision and its real-world consequences. It links actions to results, enabling the platform to calibrate future recommendations based on actual outcomes.

## Implementation

Package: `lib/outcome-graph`
Schema: `outcome_nodes`, `outcome_edges` tables

## Data Model

### Nodes

Each node represents a stage in the decision lifecycle:

| Node Type | Description |
|-----------|-------------|
| `signal` | The triggering event or data point |
| `analysis` | The analysis performed on the signal |
| `recommendation` | The AI-generated recommendation |
| `simulation` | Monte Carlo or scenario simulation result |
| `approval` | Human approval or rejection decision |
| `execution` | The action taken |
| `verification` | Post-execution verification |
| `outcome` | The measured business outcome |

### Edges

Edges connect nodes with relationship metadata:

| Edge Type | Description |
|-----------|-------------|
| `triggered_by` | Signal → Analysis |
| `produced` | Analysis → Recommendation |
| `simulated_by` | Recommendation → Simulation |
| `approved_by` | Recommendation → Approval |
| `executed_as` | Approval → Execution |
| `verified_by` | Execution → Verification |
| `resulted_in` | Verification → Outcome |
| `cascaded_to` | Cross-domain cascade link |

### Outcome Measurement

```typescript
interface OutcomeNode {
  id: string;
  decision_id: string;
  domain: string;
  outcome_type: "positive" | "negative" | "neutral" | "pending";
  metric_name: string;
  expected_value: number;
  actual_value: number;
  deviation: number;
  measured_at: string;
  measurement_source: string;
  confidence: number;
}
```

## Calibration Loop

The Outcome Graph enables a calibration loop:

1. **Record** — Capture the recommendation's predicted outcome
2. **Measure** — Measure the actual outcome after execution
3. **Compare** — Calculate deviation between predicted and actual
4. **Calibrate** — Feed deviation data back to improve future recommendations
5. **Score** — Update the model/agent's accuracy score in the registry

## Cross-Domain Outcomes

When a signal cascades across domains, the Outcome Graph tracks outcomes in each affected domain:

```
Signal (Vessels: port delay)
  → Outcome (Terra: property timeline adjusted, delivered on time)
  → Outcome (Counsel: force-majeure clause reviewed, no action needed)
  → Outcome (Holdings: portfolio risk score normalized)
```

This cross-domain outcome tracking is unique to SZL. No competing platform links outcomes across domain boundaries with verifiable provenance.

## Query Interface

| Endpoint | Purpose |
|----------|---------|
| `GET /api/outcomes/:decision_id` | Full outcome graph for a decision |
| `GET /api/outcomes/domain/:domain` | Outcomes by domain |
| `GET /api/outcomes/calibration/:model_id` | Calibration data for a model |
