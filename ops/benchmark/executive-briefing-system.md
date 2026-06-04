# Executive Briefing System

**Last updated:** April 2026
**Purpose:** Define automated executive briefing patterns for Lyte/Command

---

## Competitive Patterns

### Palantir Executive View
- Ontology-powered dashboards with drill-down
- Alert-driven briefings surfacing critical changes
- Custom views per executive role

### Rippling Executive Dashboard
- Compound metrics across HR, IT, finance in single view
- Real-time headcount, spend, compliance status
- Exception-based alerts (only surfaces anomalies)

### Cloudflare Analytics
- Time-series visualizations with severity filtering
- Automatic anomaly detection with alerts
- Zone-level drill-down for incident investigation

---

## SZL Executive Briefing Components

### 1. Decision Velocity Dashboard
How fast are decisions moving through the governed loop?

| Metric | Description | Benchmark |
|--------|-------------|-----------|
| Signal-to-Decision Time | Average time from signal detection to policy approval | < 30 minutes for critical |
| Simulation Coverage | % of decisions that ran Monte Carlo before approval | > 90% |
| Policy Gate Pass Rate | % of decisions approved on first attempt | 70-85% (too high = rubber-stamping) |
| Outcome Variance | Average difference between predicted and actual outcomes | < 20% |
| Confidence Calibration Score | How well AI confidence matches actual outcome success | > 0.75 Brier score |

### 2. Cross-Domain Signal Map
Which domains are generating signals and how are they correlating?

- Heat map of signal volume by domain (Aegis, Vessels, Terra, etc.)
- Correlation links between domains (thickness = frequency)
- Trend arrows showing volume changes

### 3. Governance Posture
Is the organization governing decisions effectively?

| Indicator | Healthy | Warning | Critical |
|-----------|---------|---------|----------|
| Proof chain coverage | > 95% of decisions have proof records | 80-95% | < 80% |
| Override frequency | < 10% of recommendations overridden | 10-25% | > 25% |
| Escalation rate | 5-15% of decisions escalated | < 5% or > 25% | > 40% |
| Outcome loop closure | > 80% of decisions have outcome records | 60-80% | < 60% |

### 4. Agent Performance Summary
How well are AI agents performing across domains?

| Metric | Description |
|--------|-------------|
| Acceptance rate | % of agent recommendations accepted by operators |
| Achievement rate | % of accepted recommendations that led to desired outcome |
| Confidence accuracy | Correlation between stated confidence and actual success |
| False positive rate | % of flagged signals that were not actionable |

---

## Briefing Delivery Patterns

### Daily Digest (CORTEX Push Notification)
- 3-sentence summary of yesterday's governed decisions
- Top anomaly or exception requiring attention
- One-tap to open full briefing in CORTEX

### Weekly Executive Brief (Email + PDF)
- Decision velocity trends
- Cross-domain correlation highlights
- Governance posture changes
- Agent performance summary
- Actionable recommendations for governance improvement

### Real-Time Alert (Push + Lyte Banner)
- Critical signal correlation detected
- Policy escalation requiring executive action
- Outcome variance exceeding threshold
- System governance posture degradation

---

## Implementation Notes

The executive briefing system should compose from the same data primitives used by the governed loop — Event Fabric events, Covenant decisions, Proof Chain records, Outcome Graph metrics. No separate data pipeline required.
