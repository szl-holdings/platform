# Prism Counsel — Solution Brief

> **DEPRECATED:** PRISM Counsel has been retired. Legal capabilities are now available in the **Aegis legal workspace** (`/aegis/`). This document is preserved for historical reference only.

**Audience:** Legal Technology Directors, IT Decision Makers, Department Heads  
**Date:** April 2026

---

## Platform Summary

Prism Counsel is a legal matter intelligence and governed execution platform for plaintiff-side insurance litigation practices. It combines structured matter observability, multi-dimensional pressure scoring, AI-powered analysis with attorney oversight, and native Microsoft 365 integration.

**Built on:** Alloy — SZL Holdings' orchestration and control plane, which provides model routing, tool orchestration, permission-aware retrieval, audit logging, and proof chain generation across all platform operations.

**Designed for:** New York plaintiff-side insurance litigation teams (auto injury, premises liability, no-fault, workers' compensation). Configurable for other jurisdictions.

---

## Core Modules

### Matter Twin

A structured, living data artifact capturing the complete state of each legal matter.

- **Matter profile:** Type, status, stage, jurisdiction, SOL, health score, settlement range
- **Parties:** Plaintiff, carrier, adjuster, expert, opposing counsel, mediator
- **Claims:** Coverage type, policy limits, claim status per carrier
- **Deadlines:** SOL, discovery cutoff, expert disclosure, trial date — with risk flags
- **Evidence map:** Document completeness scoring with critical gap identification
- **Financial exposure:** Damages, liens, settlement range with verification status
- **AI insights:** Pressure scores, forecasts, worldline overlays — with review state
- **Change detection:** What changed since last snapshot, with movement explanations

### Pressure Graph

A 12-dimension pressure scoring engine that quantifies legal matter risk in real time.

Dimensions: `deadline · insurer · adjuster · coverage · venue · medical · damages · settlement · weather_event · evidence · communication · governance`

Each dimension outputs: score (0.0–1.0) · movement (rising/stable/falling) · confidence · top drivers · likely consequence · recommended actions

**Six synthesized data products:**
- Insurer Pressure Index (insurer + adjuster + communication)
- Venue Velocity Index (venue + deadline)
- Incident Context Layer (weather + evidence)
- No-Fault Friction Score (medical + evidence + deadline)
- Settlement Friction Map (settlement + damages + coverage)
- AI Defensibility Index (governance + evidence)

### Forecast Engine

Seven matter-level forecasts updated on each computation cycle:

| Forecast | What it measures |
|----------|-----------------|
| Insurer Response Latency | Days since last carrier response vs. normal baseline |
| Offer Movement Likelihood | Probability of offer movement given friction and pressure |
| Settlement Friction Score | Composite blocking score across friction dimensions |
| Review Bottleneck Risk | Approval queue depth relative to throughput capacity |
| Approval Lag Risk | Compound risk from pending approvals + overdue deadlines |
| Recovery/Lien Drag Risk | Timeline impact of active lien negotiations |
| Quiet Risk Deterioration | Activity drought detection — matters going stale |

Each forecast: current score · trend · confidence · top drivers · worldline drivers · recommended actions · requires_review flag

### Copilot Workbench

A multi-mode AI assistant with full Alloy context, source grounding, and proof chain anchoring on every output.

| Mode | Purpose |
|------|---------|
| Matter | Status synthesis, change explanation, missing artifact identification |
| Communications | Carrier communication analysis, silence window detection, ask/commitment extraction |
| Document | Document summary, fact extraction, contradiction detection |
| Strategy | Settlement posture, leverage analysis, mediation prep briefing |
| Ops | Connector health, sync status, pipeline backlog (operator role only) |

Every Copilot response: source-grounded · proof chain anchored · confidence scored · review state assigned · advisory only

### Proof Chain

Immutable audit record for every AI output in the system.

- SHA-256 content hash for integrity verification
- Source references (documents, communications, pressure scores)
- Model provider, version, and lane
- Extraction confidence
- Review state and approval state
- Export safety gate (enforced at API level)
- Privilege state preservation

### Worldline Engine

External signal ingestion that enriches internal matter data with jurisdiction-specific context.

**Source classes:**
- `regulatory_insurance` — NY DFS complaint data
- `crash_incident` — NYPD/NYC crash records
- `weather_environmental` — NWS weather alerts and observations
- `county_demographic` — Census ACS county-level data
- `court_venue` — NY Courts eCourts case data
- `lien_recovery` — CMS MSP recovery context
- `internal_firm` — Firm-specific enrichment data

Signals are scored for freshness, provenance, and legal usefulness. Features are published to matter records and used in pressure computation and forecasting.

### Review and Approval Workflow

- Review items created for any AI output with `requiresReview=true`
- Paralegal can review and submit for attorney sign-off
- Attorney approves or rejects via signoff queue
- Approval recorded with actor, timestamp, and reasoning
- Only approved outputs become `exportSafe=true`
- Full change event trail from AI generation to export

### M365 Connector

Native integration with Microsoft 365 for document and communication sync.

- SharePoint document library sync with delta updates
- Outlook communication ingestion (opted-in mailboxes)
- Graph webhook subscriptions for real-time notifications
- ACL mapping from SharePoint permissions to Prism Counsel roles
- Automatic privilege state inference from sensitivity labels

---

## Technical Specifications

| Specification | Detail |
|--------------|--------|
| Deployment | Managed SaaS (Azure Container Apps) |
| Authentication | OpenID Connect (PKCE), organization-scoped RBAC |
| Database | PostgreSQL 15+ (37+ tables, full audit trail) |
| AI providers | OpenAI (GPT-4o), Azure Document Intelligence, HuggingFace, Azure AI Search |
| Model architecture | 7-lane model mesh with circuit breaker and fallback chain |
| M365 integration | Microsoft Graph API v1.0, OAuth 2.0 |
| API | REST (OpenAPI 3.1) + GraphQL |
| Document processing | Azure Document Intelligence v4 |
| Retrieval | Hybrid RRF (keyword + semantic), permission-aware ACL |
| Audit | Immutable append-only event log |
| Exports | Word (.docx), PDF — after attorney approval only |

---

## What Prism Counsel Does Not Do

This is important for compliance-sensitive buyers:

- Does not file documents autonomously
- Does not send communications on behalf of users
- Does not make legal determinations — outputs are advisory
- Does not claim SOC 2 or HIPAA compliance (working toward certification)
- Does not share tenant data across organizations
- Does not use client matter data for AI model training

---

## Pricing Model

Prism Counsel is priced per active matter, per month, with a base platform fee covering all modules, the M365 connector, and standard support. Volume pricing available for portfolios over 100 active matters.

Contact SZL Holdings for current pricing.

---

*See also:*
- *[Executive Overview](prism-counsel-executive-overview.md)*
- *[Use Cases](prism-counsel-use-cases.md)*
- *[M365 Companion Overview](prism-counsel-m365-companion.md)*
- *[Trust Center](../trust/prism-counsel-trust-center.md)*
