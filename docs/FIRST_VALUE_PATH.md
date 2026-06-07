# SZL Holdings — First Value Path by Domain Pack

**Status:** Specification — for implementation reference
**As of:** April 2026

---

## Purpose

This document maps the shortest path from signup to first verified outcome for each domain pack. "First value" is defined as the moment a user sees a platform-generated intelligence output that is specific to their domain, actionable, and evidenced — not a demo slide or static walkthrough.

Each path below is the **minimum viable activation journey** — the fastest route to `first_outcome_verified` with zero wasted steps.

---

## Universal Prerequisites (All Domain Packs)

Before domain-specific value can be delivered, every user must complete:

1. Account created + email confirmed
2. Organization profile set up (name, slug, domain)
3. Role assigned
4. Workspace initialized (`workspace_created` fired)

**Target elapsed time for prerequisites:** < 3 minutes

---

## Domain Pack 1: Cyber Resilience (Sentra / Aegis)

**Primary artifact:** Sentra — Cyber Resilience Command (`/sentra`)
**First value moment:** First threat signal with MITRE ATT&CK mapping surfaced and reviewed
**Target TTFV:** < 6 minutes

### Minimum Path

| Step | Action | Where | Time |
|---|---|---|---|
| 1 | Activate Cyber domain pack | Command portal onboarding | 30 sec |
| 2 | Connect first data source: choose between (a) connect SIEM/EDR integration, or (b) load seed threat data | Integrations panel or Setup wizard | 90 sec |
| 3 | Platform generates first threat signal from connected source | Automated | 60 sec |
| 4 | User opens signal in Sentra dashboard — sees severity, MITRE mapping, evidence | Sentra `/signals` | 60 sec |
| 5 | User submits first triage action (escalate / contain / dismiss) | Signal detail panel | 30 sec |
| 6 | Outcome recorded in proof chain | Automated | Instant |

**Total:** ~4.5 minutes

### Friction Risks
- Integration auth failures (SIEM/EDR OAuth) → mitigate with seed data fallback
- Empty state if no signals generated → ensure seed data path always produces ≥ 3 signals
- MITRE mapping not visible by default → pin ATT&CK badge to signal card

### First Outcome Definition
`security.incident.triaged` event recorded in event store + proof chain entry created.

---

## Domain Pack 2: Maritime Intelligence (Vessels)

**Primary artifact:** Vessels Maritime Intelligence (`/vessels`)
**First value moment:** First vessel anomaly detected with voyage P&L impact displayed
**Target TTFV:** < 8 minutes

### Minimum Path

| Step | Action | Where | Time |
|---|---|---|---|
| 1 | Activate Maritime domain pack | Command portal onboarding | 30 sec |
| 2 | Connect AIS feed or load seed fleet data (3–5 vessels) | Vessels setup or seed wizard | 2 min |
| 3 | Platform analyzes vessel positions and flags AIS gap or route deviation | Automated | 90 sec |
| 4 | User opens alert in Vessels dashboard — sees affected vessel, gap duration, P&L estimate | Vessels `/alerts` | 60 sec |
| 5 | User submits voyage hold recommendation or clears alert | Alert action panel | 30 sec |
| 6 | Action recorded in proof chain | Automated | Instant |

**Total:** ~6 minutes

### Friction Risks
- AIS feed provisioning is technical → always offer seed fleet as primary path for new users
- P&L impact not shown unless freight rate configured → default to estimated impact range
- Map rendering slow on first load → show table view first, map as secondary

### First Outcome Definition
`maritime.voyage.hold.placed` or `maritime.compliance.alert.generated` + proof chain entry.

---

## Domain Pack 3: Legal Matter Command (Counsel)

**Primary artifact:** Counsel — Legal Matter Command (`/counsel`)
**First value moment:** First contract clause risk flagged with governing policy reference
**Target TTFV:** < 10 minutes

### Minimum Path

| Step | Action | Where | Time |
|---|---|---|---|
| 1 | Activate Legal domain pack | Command portal onboarding | 30 sec |
| 2 | Upload a sample contract (PDF) or use pre-loaded sample matter | Counsel matter upload | 2 min |
| 3 | Platform parses contract, flags risk clauses, maps to policy library | Automated | 2–3 min |
| 4 | User opens matter in Counsel — sees clause risk summary and governing policy | Matter detail view | 90 sec |
| 5 | User approves or requests revision on flagged clause | Clause action panel | 30 sec |
| 6 | Decision recorded in matter audit trail | Automated | Instant |

**Total:** ~8 minutes

### Friction Risks
- PDF parsing latency can be 2–4 min → show progress indicator with "analyzing..." state
- No contract available → provide 3 sample contracts (NDA, MSA, SaaS agreement) as one-click load
- Policy library not configured → default to platform standard risk taxonomy for first run

### First Outcome Definition
`business.approval.granted` or `business.approval.denied` on a contract clause, recorded in matter audit trail.

---

## Domain Pack 4: Real Estate Intelligence (Terra)

**Primary artifact:** Terra — Real Estate Intelligence (`/terra`)
**First value moment:** First distressed property identified with deal pipeline entry created
**Target TTFV:** < 8 minutes

### Minimum Path

| Step | Action | Where | Time |
|---|---|---|---|
| 1 | Activate Real Estate domain pack | Command portal onboarding | 30 sec |
| 2 | Set target market (city/zip/MSA) or load seed property dataset | Terra market setup | 90 sec |
| 3 | Platform scans for distress signals (lien filings, ownership changes, price drops) | Automated | 60 sec |
| 4 | User opens opportunity in Terra dashboard — sees distress score, ownership chain, contact info | Terra `/opportunities` | 90 sec |
| 5 | User adds property to deal pipeline | Deal pipeline action | 30 sec |
| 6 | Deal creation recorded | Automated | Instant |

**Total:** ~6 minutes

### Friction Risks
- Market data not available for selected geography → offer 3 pre-loaded market datasets (NYC, Miami, Chicago)
- Distress score algorithm not explained → surface tooltip explaining score components on first view
- Deal pipeline empty state is generic → customize with "Your first deal starts here" messaging

### First Outcome Definition
`real_estate.deal.created` event fired + property added to user's active pipeline.

---

## Domain Pack 5: Advisory Intelligence (Lyte / PRISM)

**Primary artifact:** Lyte — Decision Intelligence (`/lyte`)
**First value moment:** First business signal reviewed with recommended action submitted for approval
**Target TTFV:** < 7 minutes

### Minimum Path

| Step | Action | Where | Time |
|---|---|---|---|
| 1 | Activate Advisory domain pack | Command portal onboarding | 30 sec |
| 2 | Connect business data source or load sample KPI dataset | Lyte data setup or seed wizard | 2 min |
| 3 | PRISM analyzes KPIs and generates anomaly signal with inference | Automated | 60 sec |
| 4 | User opens signal in Lyte dashboard — sees anomaly, inference, confidence score | Lyte `/signals` | 60 sec |
| 5 | User submits first approval on recommended action | Approval workflow | 30 sec |
| 6 | Decision recorded in decision ledger | Automated | Instant |

**Total:** ~5.5 minutes

### Friction Risks
- Business data schema mismatch → provide structured CSV template with required columns
- Inference not generated if data too sparse → require minimum 30 rows in seed dataset
- Approval queue not visible on first session → surface approval CTA inline on signal card

### First Outcome Definition
`business.approval.granted` + `governance.decision_ledger.entry.written` events fired.

---

## Cross-Domain Activation

For users activating multiple domain packs, the recommended activation sequence is:

1. **Start with the highest-urgency domain** (typically whichever drove the purchase decision)
2. Reach `first_outcome_verified` in domain 1 before activating domain 2
3. After domain 1 activation, the cross-domain cascade demo (Signal → Counsel → Command) becomes available

The cross-domain value proposition should not be shown until at least one domain is activated — showing it before activation creates cognitive overload.

---

## Seed Data Strategy

Every domain pack must offer a one-click seed data option that:
- Loads realistic (non-generic) demo data for the selected domain
- Generates at least 3 signals/opportunities/alerts immediately
- Does not require any external integration or auth flow
- Is clearly labeled as "Sample data — replace with your data when ready"

Seed data is the primary onboarding path for users in the first 48 hours. Integration connections are secondary.

---

## Related Documents

- `docs/ONBOARDING_ARCHITECTURE.md` — Full onboarding system design
- `docs/ACTIVATION_METRICS.md` — How first value is measured
- `ONBOARDING_AUDIT.md` — Current friction points in each path
- `docs/DEMO_PATHS.md` — Demo narratives that overlay these activation paths
