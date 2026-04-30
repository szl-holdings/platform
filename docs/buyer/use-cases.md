# SZL Holdings — Use Cases

**Date:** Q2 2026

---

## KORA — Decision Intelligence: Use Cases

### Use Case 1: Approval Latency Detection and Escalation

**Scenario:** A growing operations team has a budget approval sitting unreviewed for 6 days. Nobody notices until the project is delayed and the client is unhappy.

**How KORA solves it:** Approval latency is tracked by the Approvals Center from the moment an approval is requested. KORA surfaces stalled approvals in the Risk dimension of the PRISM dashboard, ranked by business impact. Alloy routes an escalation to the responsible owner's inbox before the delay compounds.

**Outcome:** Approval resolved in 24 hours. Client timeline preserved. Escalation chain documented in audit trail.

---

### Use Case 2: Executive Operational Briefing

**Scenario:** A CFO spends 2 hours every Monday morning pulling data from 5 different systems to prepare a leadership briefing on organizational health, risk exposure, and key decisions pending.

**How KORA solves it:** The Executive Dashboard surfaces organizational health across the PRISM dimensions in real time. Pulse shows revenue trend and team health. Risk shows pending approvals, churn signals, and SLA exposure. Intelligence shows AI-modeled risk scoring with contributing factors. Motion shows where escalations are active.

**Outcome:** Monday briefing prepared in 15 minutes with more current data and a traceable evidence chain for every metric shown.

---

### Use Case 3: PMO Signal Aggregation

**Scenario:** A PMO manages 12 simultaneous projects across 4 business units. Project status lives in Jira. Financial tracking is in Excel. Stakeholder approvals are in email. Nobody has a single view.

**How KORA solves it:** KORA ingests signals from each connected data source (Jira, financial systems, approval workflows) and normalizes them against the PRISM framework. The PMO sees one dashboard: which projects are on track, which have risk signals, which have blocked approvals, which are drifting toward deadline risk.

**Outcome:** PMO escalation time reduced from days (manual correlation) to hours (automated signal surfacing). Ownership gaps detected and routed before they become escalations.

---

## SEXTANT — Maritime Intelligence: Use Cases

### Use Case 4: Sanctions Screening and Compliance Documentation

**Scenario:** A commodity trading firm needs to verify that none of their contracted vessels have been in violation of OFAC or EU sanctions before booking cargo.

**How SEXTANT solves it:** SEXTANT screens every vessel against current sanctions lists (OFAC, UN, EU, UK) and surfaces any flags in the fleet command dashboard. Dark vessel detection (AIS signal gap analysis) identifies vessels that have been operating without transponders — a key indicator of sanctions evasion. Compliance documentation for each screening is generated and stored.

**Outcome:** Sanctions exposure identified before cargo booking. Compliance documentation generated automatically. SEXTANT command logs the screening as an immutable audit event.

---

### Use Case 5: Voyage Economics Optimization

**Scenario:** A fleet operator wants to evaluate the profitability of a charter contract before signing, but the economics depend on accurate voyage time, fuel consumption, and port costs.

**How SEXTANT solves it:** SEXTANT models voyage economics from the fleet command interface — ETA based on current vessel position and historical speed profiles, estimated fuel consumption, port call costs, and comparison against market rates. The Helmsman AI agent provides route recommendations and flags weather risks.

**Outcome:** Charter decision made with full economic visibility in hours instead of days.

---

## PARAGON — Defense & Intelligence: Use Cases

### Use Case 6: SOC Alert Triage and Response

**Scenario:** A SOC analyst receives 2,000 alerts per day. 95% are noise. The 5% that matter are buried in the queue.

**How PARAGON solves it:** PARAGON Defense workspace normalizes alerts from connected SIEM sources, maps them to MITRE ATT&CK, and prioritizes them using the Sentinel AI agent. The agent provides triage recommendations with reasoning — not just scores. The analyst reviews recommendations, confirms the most significant findings, and triggers SOAR playbooks via Alloy.

**Outcome:** Alert triage time reduced. Mean time to respond improved. False positive rate tracked and used to refine the Sentinel model.

---

### Use Case 7: MSP Client SLA Management

**Scenario:** A managed security provider (MSP) manages security operations for 20 clients. Each client has different SLAs, different threat profiles, and different reporting requirements.

**How PARAGON solves it:** PARAGON Command workspace provides a multi-client command surface — one view across all clients, with per-client health dashboards, SLA tracking, incident queues, and reporting. Alerts from any client escalate appropriately without getting lost in a single-tenant view.

**Outcome:** MSP operations team manages 20 clients with the operational clarity of managing one.

---

## DOMAINE — Real Estate Intelligence: Use Cases

### Use Case 8: Distressed Property Identification

**Scenario:** A NYC real estate investor wants to identify properties where owners are in financial distress before they hit the public market.

**How DOMAINE solves it:** DOMAINE aggregates distress signals from NYC HPD (housing violations), DOF (tax liens), DOB (building violations), ACRIS (deed transfers and mortgage filings), and ECB (environmental violations). Properties are scored by distress signal intensity and displayed on an interactive map. Ownership structures — including LLC chains — are traced to reveal beneficial ownership.

**Outcome:** Investor identifies distressed opportunities 30–60 days before they reach brokers. Deal pipeline managed via Alloy.

---

## Carlota Jo — Private Advisory: Use Cases

### Use Case 9: Intelligence-Informed Executive Advisory

**Scenario:** A founder is preparing for a board meeting and needs strategic clarity on operational performance, brand positioning, and platform direction.

**How Carlota Jo solves it:** Principal advisory grounded in platform intelligence — not intuition. The advisory engagement draws on the same observability infrastructure as the operational platforms, translating signal into strategic narrative and decision frameworks.

**Outcome:** Board presentation grounded in operational evidence, not impressionistic summaries.
