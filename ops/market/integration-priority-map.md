# Integration Priority Map

**Last updated:** April 2026  
**Purpose:** High-value integration patterns for technical evaluators and design partners. Maps what can be integrated, what signals those integrations create, and what the implementation effort looks like.

---

## Integration Philosophy

The SZL Holdings platform is designed to pull signals from existing systems — not replace them. Every integration creates new signal sources that feed into the governed decision loop.

Integrations are prioritized by:
1. Signal value — does this integration surface high-quality, decision-relevant data?
2. Partner frequency — how many design partners or target buyers rely on this system?
3. Implementation effort — what is the realistic build cost?

---

## Tier 1: High Priority (Build for Design Partners)

### Microsoft 365 (SharePoint, Outlook, Teams)

**Value:** Document and communication signals for Counsel legal intelligence.

**What it enables:**
- SharePoint: matter document sync, brief and filing access
- Outlook: insurer communication tracking, deadline monitoring
- Teams: collaboration activity signals

**Integration pattern:**
- Microsoft Graph API
- OAuth 2.0 (on behalf of user) or service account
- Webhook subscriptions for real-time updates (`/subscriptions` endpoint in Graph API)
- Connector: `PRISM_COUNSEL_M365_CONNECTOR` placeholder exists in codebase

**Effort estimate:** 2–3 weeks for basic read integration, 4–6 weeks for bi-directional with webhook triggers.

**Who needs it:** Counsel design partners, any legal firm on Microsoft stack.

---

### AIS Data Feed (Maritime)

**Value:** Real-time vessel telemetry for Vessels intelligence — position, speed, port calls, route deviation.

**What it enables:**
- Real-time vessel position tracking
- Voyage anomaly detection (route deviation, unexpected port stops)
- Port call history and ETA accuracy

**Integration pattern:**
- AIS data providers: MarineTraffic API, Pole Star, FleetMon, Orbcomm
- REST API polling or WebSocket streaming
- Normalize AIS messages into Event Fabric signal format

**Effort estimate:** 1–2 weeks for REST API integration, 3–4 weeks for streaming with anomaly detection hooks.

**Who needs it:** All Vessels design partners. This is the highest-priority external data dependency for Vessels.

**Current status:** Placeholder connectors exist. Real AIS data feed connection requires paid AIS provider API key.

---

### Property Data (Real Estate)

**Value:** MLS, public records, and transaction data for Terra intelligence.

**What it enables:**
- Property valuation signals
- Market comparable analysis
- Transaction history and trend data

**Integration pattern:**
- MLS data: RESO API (standard for US MLS access) — requires MLS membership or third-party aggregator
- Public records: ATTOM Data Solutions, CoreLogic, or county-level APIs
- REST API polling

**Effort estimate:** 2–4 weeks depending on data provider and MLS access.

**Who needs it:** Terra design partners (real estate investors, brokers, property developers).

---

### STIX/TAXII Threat Intelligence (Security)

**Value:** Industry-standard threat intelligence feeds for Aegis security intelligence.

**What it enables:**
- External threat actor intelligence
- IOC (Indicator of Compromise) correlation against internal signals
- CVE and vulnerability feed integration

**Integration pattern:**
- TAXII 2.1 client (standard protocol)
- Pull from TAXII servers: MITRE ATT&CK, CISA AIS, commercial feeds
- Map STIX objects to Aegis signal format

**Effort estimate:** 1–2 weeks for basic TAXII client, 3–4 weeks for full signal normalization.

**Who needs it:** Aegis design partners (security teams, MSSPs).

---

## Tier 2: Medium Priority (Build When Partner Requests)

### Salesforce

**Value:** CRM data for pipeline intelligence, account history, and contact signals.

**Integration pattern:**
- Salesforce REST API or Bulk API
- OAuth 2.0
- Salesforce AppExchange package stub exists in codebase — extend to full connector

**Effort estimate:** 2–3 weeks for read integration, 4–6 weeks with bi-directional sync.

---

### Stripe (Internal Billing — Not Customer Integration)

**Value:** Revenue and billing visibility in internal ops.

**Integration pattern:**
- Stripe SDK already integrated (billing infrastructure built)
- Activation: configure price IDs and Stripe secret key

**Effort estimate:** 1–2 days for activation. Infrastructure is built.

---

### Slack

**Value:** Alert and notification routing for governance workflows — approved actions surface as Slack messages.

**Integration pattern:**
- Slack Incoming Webhooks for one-way notifications
- Slack API for bi-directional (approval requests in Slack)

**Effort estimate:** 1 week for notifications, 3–4 weeks for interactive approval in Slack.

---

### GitHub

**Value:** Release and deployment signal for Command Portal and engineering ops.

**Integration pattern:**
- GitHub REST API or Webhooks
- GitHub integration: already installed in Replit — can use GitHub API directly

**Effort estimate:** 1–2 days for basic webhook integration.

---

## Tier 3: Lower Priority (Future Roadmap)

| Integration | Domain | Value | Trigger for Priority Increase |
|---|---|---|---|
| Jira / Linear | All | Work item signal integration with Continuum workflows | Design partner with engineering workflow use case |
| Court records APIs | Counsel | External legal docket signals | Jurisdiction-specific PRISM partner |
| Weather APIs | Vessels, Terra | Environmental signal enrichment | Worldline integration for Counsel |
| Bloomberg / Refinitiv | Vessels, Carlota Jo | Market signal enrichment | Financial services design partner |
| Google Workspace | Counsel | Document signals for non-Microsoft firms | Design partner not on Microsoft stack |
| ERP systems (SAP, Oracle) | Vessels, Terra | Operational data signals | Enterprise design partner with ERP dependency |

---

## Webhook-Worthy Workflows

The following platform events are candidates for outbound webhook notifications (once webhooks are implemented):

| Event | Relevant Domain Packs | Example Consumer |
|---|---|---|
| High-priority signal detected | All | Slack notification, external monitoring |
| AI recommendation generated | All | Audit system, external approval workflow |
| Decision approved | All | ERP update, downstream system trigger |
| Decision rejected | All | Audit system, escalation workflow |
| Proof Chain entry created | All | Compliance system, immutable log sink |
| Pilot/deployment health change | Internal | Infrastructure monitoring |

**Current status:** Webhook subscriptions are on the roadmap. Not yet available for external integration.

---

## Integration Effort Guide

For technical evaluators estimating integration work:

| Integration Type | Typical Effort |
|---|---|
| Read from REST API (polling) | 1–3 days |
| Read from REST API (webhook) | 3–7 days |
| Bi-directional REST integration | 1–2 weeks |
| WebSocket streaming integration | 1–3 weeks |
| OAuth 2.0 flow setup | 2–5 days |
| Full connector with data normalization | 2–4 weeks |

These estimates assume a developer familiar with the domain and the target API. SZL Holdings provides API documentation, example request/response shapes, and direct founder support for design partner integrations.

---

*See also: `api-commercial-readiness.md` (API overview), `technical-evaluator-brief.md` (one-page summary)*
