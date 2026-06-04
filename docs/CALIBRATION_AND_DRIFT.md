# Precision Evolution Runtime — Calibration & Drift Detection

## Calibration

Calibration runs establish a performance baseline for a candidate policy before
it enters the full evaluation gauntlet. They are lighter-weight than evaluation
runs and act as a first-pass gate.

### Calibration Run Types

| Type | Purpose |
|---|---|
| `baseline` | Establish initial performance baseline |
| `regression` | Confirm no regression vs. prior active policy |
| `ablation` | Test impact of individual policy components |
| `stress` | High-load / adversarial prompt suite |
| `precision` | Validate numerical precision under target profile |

### Calibration Outcomes

- `passed` — baseline meets thresholds; candidate advances to evaluation queue
- `failed` — thresholds not met; candidate marked `archived` unless retried
- `inconclusive` — results below confidence threshold; run retried (up to `maxRetries`)

### Schema

`per_calibration_runs` table:

| Column | Type | Notes |
|---|---|---|
| runId | uuid | PK |
| candidateId | uuid | FK → per_candidate_policies |
| runType | varchar | baseline / regression / ablation / stress / precision |
| status | varchar | pending / running / completed / failed / inconclusive |
| baselineMetrics | jsonb | task_success_rate, avg_latency_ms, throughput_tok_s |
| deltaFromActive | jsonb | comparison to currently active policy |
| simulated | boolean | true in EVOLUTION_MODE=simulation |

---

## Drift Detection

PER continuously monitors for distributional drift in deployed and shadow policies
relative to their calibration baseline.

### Drift Components

```
DriftMeasurement {
  klDivergence:    number   // KL divergence proxy between output distributions
  rewardDelta:     number   // abs(current_reward - baseline_reward)
  latencyDelta:    number   // abs(current_latency - baseline_latency) / baseline
  overallScore:    number   // weighted composite (0–1, lower is better)
  status:          'healthy' | 'degraded' | 'critical'
  simulated:       boolean
}
```

### Thresholds

| Component | Degraded | Critical |
|---|---|---|
| KL Divergence | > 0.10 | > 0.25 |
| Reward Delta | > 0.05 | > 0.15 |
| Latency Delta | > 0.20 | > 0.40 |
| Overall Score | > 0.12 | > 0.30 |

Thresholds are configurable per candidate via `per_candidate_policies.config`.

### Drift Guard

When `DRIFT_GUARD=true` (default), a rollout job that encounters a critical drift
report is automatically paused and an operator notification is emitted. The job
can be resumed manually after drift is investigated and resolved.

### Schema

`per_drift_reports` table:

| Column | Type | Notes |
|---|---|---|
| reportId | uuid | PK |
| candidateId | uuid | FK → per_candidate_policies |
| evalRunId | uuid | FK → per_evaluation_runs (nullable) |
| klDivergence | numeric | |
| rewardDelta | numeric | |
| latencyDelta | numeric | |
| overallDriftScore | numeric | |
| status | varchar | healthy / degraded / critical |
| actionTaken | varchar | none / paused_rollout / rolled_back / alerted |
| simulated | boolean | |

---

## Simulation Behaviour

In `EVOLUTION_MODE=simulation`:

- Calibration runs are generated with synthetic `baselineMetrics`
- Drift reports cycle through healthy → degraded → critical to exercise the full
  alert and rollback paths
- All records are tagged `simulated: true`
- No real inference calls are made; no GPU resources are consumed
