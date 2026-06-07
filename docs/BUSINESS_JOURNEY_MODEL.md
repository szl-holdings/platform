# SZL Holdings — Business Journey Model

**Purpose:** Tie technical signals and operational observations to business process stages — showing how platform intelligence maps to revenue impact, risk exposure, and process friction.

**Status:** Specification — for implementation reference
**As of:** April 2026

---

## The Core Problem

Technical platforms observe technical events: a server is slow, a vessel is off-route, a threat actor is in the network. These are real and important — but they are not what business leaders care about directly.

Business leaders care about:
- **Revenue:** Is a deal at risk? Is a voyage profitable? Is a customer about to churn?
- **Risk:** What's our exposure to regulatory, financial, or operational consequence?
- **Process:** Where is the bottleneck? What's taking longer than it should? Who is blocked?

The Business Journey Model is the translation layer between technical signals and business outcomes. It answers: "This alert in the system — what does it mean for the business?"

---

## The Model Structure

Every business process in the SZL platform is modeled as a **Journey** — a sequence of stages from initiation to outcome. Each stage can be observed, assessed for friction, and mapped to revenue/risk impact.

```
Journey: [Stage 1] → [Stage 2] → [Stage 3] → ... → [Outcome]
              ↑
         Signal observed here
              ↓
         Business impact at this stage
```

---

## Core Journey Entity

```json
{
  "journey_id": "jny_maritime_voyage_001",
  "journey_type": "maritime_voyage",
  "name": "Voyage: Fujairah → Singapore, MV Ariadne",
  "entity_id": "vsl_9c2b...",
  "entity_type": "vessel",
  "current_stage": "in_transit",
  "stages_completed": ["pre-departure", "departure", "ocean_transit"],
  "started_at": "2026-04-10T08:00:00Z",
  "expected_completion": "2026-04-22T00:00:00Z",
  "revenue_at_risk_usd": 840000,
  "risk_score": 72,
  "friction_score": 38,
  "active_signals": ["sig_8f3a..."],
  "workspace_id": "ws_tenant_001"
}
```

---

## Standard Journey Templates

### 1. Maritime Voyage Journey

| Stage | Business Meaning | Technical Signals That Affect It |
|---|---|---|
| `pre_departure` | Cargo booked, crew certified, port cleared | Documentation gaps, crew certification lapses |
| `departure` | Vessel departed port on time | Port delay, weather hold, AIS first ping |
| `ocean_transit` | Vessel en route | AIS gaps, route deviation, speed anomaly |
| `port_arrival` | Vessel approaching destination port | ETA drift, port congestion alerts |
| `discharge` | Cargo unloaded | Cargo damage signal, discharge time overrun |
| `settlement` | Voyage financial close | Demurrage calculated, charter party finalized |

**Revenue impact model:**
- AIS gap > 60 min → potential sanctions exposure → voyage may be blocked → 100% of cargo value at risk
- ETA drift > 12 hours → demurrage risk → $15,000–$50,000 per day depending on vessel class
- Route deviation > 30nm → fuel cost overrun → 2–8% of voyage P&L impact

---

### 2. Security Incident Journey

| Stage | Business Meaning | Technical Signals That Affect It |
|---|---|---|
| `detection` | Threat identified in environment | SIEM alert, anomaly detection, CISA KEV match |
| `triage` | Incident severity established | Lateral movement indicators, asset criticality |
| `containment` | Active threat scope limited | Firewall rule change, endpoint isolation |
| `investigation` | Root cause and impact understood | Log correlation, forensics, timeline reconstruction |
| `remediation` | Vulnerability closed, threat removed | Patch applied, credential reset, backdoor removed |
| `recovery` | Systems restored to normal operation | Service restoration verification |
| `post_incident` | Documentation and regulatory notification | Incident report, breach notification (if applicable) |

**Revenue impact model:**
- Containment delay > 4 hours → lateral movement likely → average breach cost increases 3.2x
- Critical asset compromised → operational disruption → estimate revenue at risk per hour of downtime by asset
- Regulatory notification required (GDPR, NIS2, SEC) → non-compliance exposure = fines + legal costs

---

### 3. Business Operational Journey (Lyte / PRISM)

| Stage | Business Meaning | Technical Signals That Affect It |
|---|---|---|
| `signal_surfaced` | Business anomaly detected | PRISM pulse anomaly, KPI threshold breach |
| `assessed` | Severity and context established | Inference generated, risk scored |
| `assigned` | Responsible owner identified | Action routed via Alloy |
| `in_progress` | Owner working on resolution | Approval pending, task in progress |
| `pending_approval` | Action requires authorization | Approval latency clock running |
| `resolved` | Issue closed, outcome recorded | Outcome recorded in proof chain |

**Revenue impact model:**
- Approval latency > SLA → multiply signal severity × expected revenue impact per hour of delay
- Unresolved critical signals accumulate → operational debt score increases → NPS risk

---

### 4. Real Estate Deal Journey (Terra)

| Stage | Business Meaning | Technical Signals That Affect It |
|---|---|---|
| `opportunity_identified` | Distressed property identified | Distress score threshold, ownership change event |
| `initial_outreach` | Broker contact initiated | Contact logged in CRM |
| `diligence` | Property and ownership research | Lien search, permit check, ownership chain |
| `offer` | Offer submitted | Offer logged, competing offers detected |
| `under_contract` | Property under contract | Contract executed |
| `closing` | Transaction closed | Closing recorded, deal moved to portfolio |

**Revenue impact model:**
- Opportunity missed because signal surfaced too late → deal gone to competitor → estimated commission: $150K–$800K NYC
- Diligence gap (missed lien) → deal falls through → sunk cost + opportunity cost

---

## Friction Score Model

Each journey stage carries a **friction score** — a composite measure of how degraded the process is relative to expected performance.

```
friction_score = SUM(
  signal_severity_weight × time_in_stage_overrun_pct +
  approval_latency_weight × approval_delay_pct +
  exception_volume_weight × exception_rate
) × domain_multiplier
```

- Score 0–25: Healthy — operating within expected parameters
- Score 26–50: Degraded — measurable slowdown; no immediate risk
- Score 51–75: At Risk — significant friction; revenue or compliance impact likely
- Score 76–100: Critical — immediate intervention required

---

## Cross-Domain Journey Correlation

When a signal in one domain affects a journey in another, the Business Journey Model creates a **cross-domain link**:

**Example:** A security incident affecting port management software (Aegis) delays vessel departure clearance (Vessels). The security incident's business impact is not just IT downtime — it is voyage delay, demurrage cost, and cargo owner relationship risk.

Cross-domain links allow the platform to quantify: "This Aegis alert has a $340K business impact across 3 active voyages" — a statement that is impossible without the Business Journey Model.

---

## API Surface

| Endpoint | Method | Description |
|---|---|---|
| `/api/journeys` | GET | List active journeys with filters |
| `/api/journeys/:journey_id` | GET | Full journey detail with signals, friction, and risk |
| `/api/journeys/:journey_id/signals` | GET | All signals affecting this journey |
| `/api/journeys/cross-domain` | GET | Journeys with active cross-domain links |
| `/api/journeys/risk-summary` | GET | Aggregate revenue at risk across all active journeys |

---

*The Business Journey Model is the translation layer that makes platform intelligence valuable to business leaders, not just technical operators. Implement it as the primary context layer for all executive and investor-facing views.*
