# SZL Holdings — SLOs and Alerting Strategy

**Purpose:** Define Service Level Objectives and the alerting strategy for the SZL platform.

**Status:** Specification — for implementation reference
**As of:** April 2026

---

## SLO Philosophy

SZL platform SLOs are defined at two levels:

1. **Platform SLOs** — availability and latency targets for the shared infrastructure
2. **Business SLOs** — time-bound targets for business-critical operations (approval latency, signal-to-action time)

Business SLOs are the more important class — they are what enterprise buyers care about, and violations of them have direct revenue and risk consequences.

---

## Platform SLOs

### API Server Availability

| SLO | Target | Measurement Window |
|---|---|---|
| API availability | 99.5% | Rolling 30-day |
| Health endpoint (`/api/health`) response | 99.9% | Rolling 30-day |
| Error rate (5xx responses) | < 0.5% | Rolling 7-day |

**Measurement:** API health check + response status rate from access logs

---

### API Latency

| Endpoint Class | P50 Target | P95 Target | P99 Target |
|---|---|---|---|
| Read endpoints (GET) | < 100ms | < 500ms | < 1,000ms |
| Write endpoints (POST/PUT/PATCH) | < 200ms | < 800ms | < 2,000ms |
| AI inference endpoints | < 2,000ms | < 8,000ms | < 20,000ms |
| Report/export endpoints | < 5,000ms | < 30,000ms | < 60,000ms |

---

### Database

| SLO | Target |
|---|---|
| Query latency P95 | < 50ms |
| Query latency P99 | < 200ms |
| Connection pool availability | 99.9% |

---

### Workflow Engine (Alloy)

| SLO | Target |
|---|---|
| Workflow start latency P95 | < 500ms |
| Step execution latency P95 | < 1,000ms |
| Workflow completion rate (no error) | > 99% |
| Approval notification delivery | < 30 seconds |

---

## Business SLOs

### Approval Latency SLOs

These are the time-bound commitments for human approvals within the platform. Violations represent governance risk.

| Severity | Role Required | SLA Target | Alert Threshold |
|---|---|---|---|
| `emergency` | Any authorized actor | 15 minutes | 10 minutes |
| `critical` | Operator or above | 60 minutes | 45 minutes |
| `high` | Analyst or above | 4 hours | 3 hours |
| `medium` | Analyst or above | 24 hours | 20 hours |
| `low` | Any | 72 hours | 60 hours |

Approval latency breaches are recorded in the Decision Ledger and surfaced in the Governance dashboard.

---

### Signal-to-Action Time

The time from signal ingestion to action proposal should not exceed:

| Signal Severity | Target |
|---|---|
| `emergency` | < 5 minutes |
| `critical` | < 15 minutes |
| `warning` | < 60 minutes |
| `info` | < 4 hours |

---

### Agent Inference Latency

| Signal Severity | Inference Target |
|---|---|
| `emergency` | < 30 seconds |
| `critical` | < 2 minutes |
| `warning` | < 5 minutes |
| `info` | < 15 minutes |

---

## Alerting Strategy

### Alert Tiers

| Tier | Urgency | Channel | Who Is Paged |
|---|---|---|---|
| P0 — Platform Down | Immediate | PagerDuty (call) | On-call engineer |
| P1 — Degraded | < 15 min response | PagerDuty (SMS) | On-call engineer |
| P2 — SLO at Risk | < 1 hour response | Slack + email | Engineering lead |
| P3 — Warning | Business hours | Slack | Team channel |
| P4 — Informational | No response required | Log only | None |

---

### Platform Alert Definitions

#### P0 Alerts — Platform Down

| Alert | Condition | Trigger |
|---|---|---|
| API unavailable | Health check fails 3 consecutive times | Immediate page |
| Database connection lost | Connection pool exhausted or unreachable | Immediate page |
| Alloy workflow engine crash | Workflow engine not responding | Immediate page |

#### P1 Alerts — Degraded

| Alert | Condition | Trigger |
|---|---|---|
| API error rate elevated | 5xx rate > 2% for 5 minutes | P1 page |
| API latency degraded | P95 > 2× SLO target for 10 minutes | P1 page |
| Database latency elevated | P95 query latency > 500ms for 5 minutes | P1 page |
| Job queue depth high | Job queue depth > 100 for 10 minutes | P1 page |

#### P2 Alerts — SLO at Risk

| Alert | Condition | Trigger |
|---|---|---|
| SLO burn rate high | Error budget consumed > 50% in last 24 hours | P2 alert |
| Approval latency SLA at risk | Emergency approval pending > 10 minutes | P2 alert |
| Signal backlog growing | Signal queue depth > 50 unprocessed | P2 alert |
| AI inference latency elevated | P95 > 10 seconds for 10 minutes | P2 alert |

#### P3 Alerts — Warning

| Alert | Condition | Trigger |
|---|---|---|
| Agent eval score degraded | Eval score drops below 0.85 | P3 alert |
| Incomplete Decision Ledger chains | > 5 incomplete chains outstanding > 1 hour | P3 alert |
| External data feed delay | AIS/CISA/NYC data feed > 30 minutes stale | P3 alert |
| Memory usage high | Heap usage > 85% for 15 minutes | P3 alert |

---

### Business Alert Definitions

| Alert | Condition | Who Notified |
|---|---|---|
| Emergency approval pending | Emergency signal with no approval response in 10 min | On-call + exec escalation |
| Critical approval approaching SLA | Critical approval pending > 45 min | Responsible operator |
| High friction journey | Journey friction score > 75 | Journey owner |
| Revenue at risk threshold | Revenue at risk > $500K across active journeys | Executive summary channel |
| Cross-domain risk correlation | Two domain packs simultaneously flagging same entity | Command portal alert |

---

## Error Budget Policy

### Error Budget Calculation

```
Monthly error budget = (1 - SLO target) × total minutes in month

Example (99.5% availability SLO):
Budget = (1 - 0.995) × 43,200 = 216 minutes per month
```

### Error Budget Policy Rules

| Budget Remaining | Engineering Response |
|---|---|
| > 50% | Normal deployment velocity |
| 25–50% | Review deploys; no risky changes without rollback plan |
| 10–25% | Freeze non-critical deployments; prioritize reliability work |
| < 10% | Full deployment freeze; incident review required before resuming |

---

## Dashboard Requirements

A live SLO dashboard must display:

1. Current availability percentage (rolling 30-day) vs. target
2. Error budget remaining (percentage and minutes)
3. Latency percentiles (P50/P95/P99) — current vs. SLO
4. Active P0/P1 alerts
5. Approval latency heatmap (by severity, last 7 days)
6. Signal-to-action time (last 7 days)
7. Agent eval scores (current vs. threshold)

---

*SLOs should be reviewed quarterly. Business SLOs may be incorporated into enterprise SLAs and referenced in customer contracts once the platform reaches GA status.*
