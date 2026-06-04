# Feature Overview — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026  
**Audience:** Enterprise evaluators, technical reviewers, design partners

This document is the complete feature map across all SZL Holdings platform surfaces. Features are organized by layer: platform primitives, command surfaces, domain packs, and cross-cutting capabilities.

---

## Platform Primitives (Shared Across All Surfaces)

### Outcome Graph
- Full decision lifecycle tracking: recommendation → decision → outcome
- Closed-loop feedback: outcome accuracy rates per model, per domain
- Learning cycle engine: calibrates model weights based on prediction accuracy
- Decision memory: historical pattern matching across all past governed decisions
- Outcome delta reporting: predicted vs. actual with explainability

### Proof Chain
- Immutable, append-only audit trail for every AI output and human action
- Model attribution: model ID, provider, version, confidence score, and timestamp on every AI record
- Source citations: evidence links with recency and reliability metadata
- Actor attribution: name, role, org, and timestamp on every approval or rejection
- Export formats: PDF and JSON for compliance and legal use
- Tamper detection: hash-based integrity verification

### Covenant Policy
- Policy rule builder: condition-based rules with action triggers
- Human-in-the-loop enforcement: no consequential action without explicit approval
- Approval routing: role-based routing with escalation chains
- Financial threshold gates: configurable thresholds for cost-sensitive actions
- Cross-domain sign-off: require approvers from multiple domain packs
- Policy simulation: test policy impact before publishing
- Time-window restrictions: block or require approval for time-sensitive windows
- Policy audit trail: log of all policy evaluations and outcomes

### Decision Simulation (Monte Carlo)
- 10,000+ iteration Monte Carlo simulation on all recommendation scenarios
- Three-scenario comparison: recommended action, alternative action, inaction
- Sensitivity tornado chart: which variables drive outcome uncertainty most
- Cost-of-waiting metric: quantified cost per hour/day of inaction
- Confidence intervals: median, 25th, 75th, and 95th percentile outcomes
- Input variable configuration: operators can adjust input assumptions

### Workflow Engine
- Durable workflow execution with checkpoint recovery
- Multi-step workflows with conditional branching
- Agent coordination: multiple AI agents can operate in sequence
- Event-driven triggers: signals from Event Fabric trigger workflows automatically
- Human approval steps embedded in workflow DAG
- Execution monitoring: per-step status, timing, and output
- Failure handling: automatic retry with configurable backoff
- Playbook generation: AI-generated workflow playbooks from outcome patterns

### Event Fabric (Prism Bus)
- Cross-domain signal ingestion and normalization
- Signal correlation: automatically links related signals across domains
- Event routing: rules-based routing to the appropriate domain pack and approval chain
- Signal deduplication and aggregation
- Real-time and batch ingestion support
- Webhook delivery with HMAC signatures
- Schema-validated event types (9 AI decision schemas, extensible)

---

## Lyte — Flagship Command Surface

### Signal Command
- Priority-ranked signal feed with severity classification
- Signal timeline: chronological view of all correlated signals with attribution
- Cross-domain signal correlation: Aegis + Vessels + Terra signals in one view
- Signal search and filter (by domain, severity, status, assignee)
- Signal acknowledgement and escalation workflow

### PRISM Dashboard
- Five-dimension health scoring: People, Revenue, Infrastructure, Security, Market
- Per-dimension signal summary and trend indicators
- Configurable metric thresholds per dimension
- Health history and trend charts (30-day, 90-day views)

### Action Queue
- Pending decisions ranked by urgency and consequence
- Inline recommendation review without leaving the queue
- Approve, reject, or escalate directly from queue
- Queue filtering by domain, severity, and age
- SLA countdown indicators

### Approvals Center
- Centralized view of all pending approvals (cross-domain)
- Full decision context inline: recommendation, simulation, policy results
- Multi-approver workflow state: see where in the chain each item sits
- Approval comment threads (recorded in Proof Chain)

### Ownership Map
- Accountability graph: who owns what decisions, currently and historically
- Unassigned signal detection: surfaces decisions with no clear owner
- Override tracking: records when operators override AI recommendations
- Workload distribution: signal volume per operator per domain

---

## Aegis — Security & Defense Domain Pack

### SOC Command
- Threat feed with MITRE ATT&CK classification per alert
- Severity triage with customizable scoring rules
- Alert lifecycle: new → investigating → escalated → resolved
- Assignee routing and handoff tracking

### SOAR Playbooks
- Pre-built and AI-generated response playbooks
- Playbook execution with human approval gate before action
- Step-by-step execution tracking with per-step status
- Cross-domain playbook triggers (e.g., vessel anomaly triggers security playbook)

### Threat Intelligence
- Multi-source threat intel aggregation
- IOC (indicators of compromise) management
- Threat actor profile database
- STIX/TAXII feed integration
- Confidence scoring on all intel records

### XDR (Cross-Domain Response)
- Cross-domain correlation: links security signals to maritime, legal, and other domain signals
- Unified timeline view across correlated signals
- Coordinated response across domain packs

### Case Management
- Investigation case creation and lifecycle
- Evidence collection with chain-of-custody tracking
- Case assignment and escalation
- Proof Chain integration: every case action logged immutably
- Case export for legal and compliance use

### CISO Executive Dashboard
- Aggregated KPIs across all eight security modules
- Security posture score with trend
- SLA compliance rate
- Mean time to detect and mean time to respond

---

## Vessels — Maritime Domain Pack

### Fleet Command
- Live AIS-based vessel position map (6-minute refresh cycle)
- Fleet overview: all vessels with status, position, speed, and heading
- Individual vessel detail: cargo, route, ETA, compliance status, Voyage P&L

### Exception-Based Workflow
- Exception queue: ETA deviations, sanctions flags, dark vessel alerts, port congestion
- Exception severity classification with SLA-based response time
- Governed exception response: recommendation → simulation → policy → execution
- Exception resolution tracking and outcome recording

### AIS Intelligence
- Live AIS feed integration (provider-agnostic)
- Dark vessel detection: AIS gap and transponder outage alerting
- AIS spoofing detection: pattern-based anomaly identification
- Historical AIS track playback

### Sanctions Screening
- Real-time screening against OFAC, UN, EU, and custom sanctions lists
- Counterparty screening (vessel owner, charterer, cargo shipper)
- Sanctions hit workflow: automatic escalation to legal sign-off
- Screening audit trail with list version and match confidence

### Voyage P&L
- Per-voyage revenue, cost, and margin tracking
- Bunker cost tracking and deviation alerts
- Port cost actuals vs. estimate
- Freight rate benchmarking: market rate context for active voyages
- Forecast vs. actual comparison at voyage close

### Compliance Monitoring
- Port State Control (PSC) inspection risk scoring
- ISM/ISPS compliance status tracking
- Certificate expiry tracking with advance warning
- Vetting status (SIRE, CDI) tracking

---

## Terra — Real Estate Domain Pack

### Distress Pipeline
- NYC distress signal detection: tax liens, foreclosure filings, code violations, lis pendens
- Distress score per property (composite of signal types and recency)
- Pipeline view with stage tracking
- Bulk import and filtering tools

### Ownership Graph
- Beneficial ownership tracing through LLC chains
- Known associates and related entity mapping
- Historical ownership timeline
- Cross-reference against sanctions and watch lists

### AI Underwriting
- Automated valuation model with confidence score and evidence citations
- Comparable sales analysis with recency weighting
- Rent roll analysis (for income properties)
- Distress discount modeling
- Underwriting output as Proof Chain record (auditable)

### Deal Workflow
- Deal stages: prospect → underwriting → offer → contract → close
- Document collection gates at each stage
- Approval chain for deal advances above threshold
- Timeline tracking and SLA monitoring
- Deal export for legal review

### Portfolio View
- Aggregate portfolio by geography, asset class, and deal stage
- Portfolio KPIs: invested capital, unrealized value, distress exposure
- Deal history and outcome tracking

---

## CORTEX — Mobile Command Layer

### Workspace Switcher
- All domain workspaces accessible from one app
- Cross-domain badge counts: unread signals per workspace
- Workspace-level notification controls

### Unified Command Feed
- All signals across all active workspaces in a single chronological feed
- Priority-based sorting with critical signals surfaced first
- Quick actions from feed (acknowledge, escalate, approve)

### AI Copilot
- Workspace-adaptive: different context and capabilities per domain pack
- Voice-to-text signal reporting
- Quick question-and-answer on active signals

### Mobile Governance
- Approve or reject governed actions directly from mobile
- Full decision context visible before approval (recommendation + simulation + policy)
- Biometric auth (Face ID / Touch ID) for approval actions
- Offline approval queue with sync-on-reconnect

---

## Cross-Cutting Capabilities

### Authentication & Access
- OIDC/PKCE authentication with session-based httpOnly cookie management
- 11-role RBAC with org-scoped tenant isolation
- SCIM 2.0 user provisioning and deprovisioning
- Azure AD SSO integration
- SAML 2.0 (roadmap)

### Audit & Compliance
- Global deny-by-default authentication middleware on all private routes
- Append-only audit log for all admin and governance actions
- Configurable audit log retention (7 years default)
- Compliance report export (CSV, JSON, PDF)
- CodeQL automated security scanning in CI/CD

### Observability
- Structured JSON logging with trace IDs
- API health endpoint at `/api/health`
- Per-domain performance metrics
- Error tracking and alerting

### Distribution & Publishing
- Articles CMS with publish/draft workflow
- Newsletter management and subscription pages
- X Studio for social content
- Carousel Lab for visual content
- Campaign/UTM management and analytics
- Public link-in-bio and insights pages

---

## Feature Availability by Status

| Surface | Status | Notes |
|---|---|---|
| Lyte command surface | Alpha | Seeded data; live auth |
| Alloy workflow engine | Alpha | Core workflows operational |
| CORTEX mobile | Alpha | iOS + Android |
| Aegis SOC | Alpha | Seeded threat data |
| Vessels fleet command | Alpha | AIS integration pending production config |
| Terra distress pipeline | Alpha | NYC public records data |
| Carlota Jo portal | Live | Production-ready |
| PRISM Counsel | Integrated (Aegis) | Matter management |
| IMPERIUM | In development | — |

Legend: **Live** = production-ready with real data. **Alpha** = functional with seeded/demo data. **In development** = not yet available.

---

## Reference

- [Product Overview](product-overview.md) — Architecture and platform thesis
- [Platform Primitives](../architecture/platform-primitives.md) — Technical specification
- [End User Guide](user/end-user-guide.md) — How to use each surface
