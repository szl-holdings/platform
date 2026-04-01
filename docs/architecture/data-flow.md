# SZL Holdings — Data Flow & Entity Model

**Date:** April 2026

---

## Core Entity Model

These entities are shared across the entire platform ecosystem. Domain-specific entities (vessels, properties, security incidents) extend this base model.

| Entity | Description | Appears In |
|--------|-------------|------------|
| **Signal** | A raw or normalized data point indicating a state change, anomaly, or operational event | All platforms |
| **Finding** | A validated signal with attribution, severity classification, and confidence score | Aegis, Vessels, Terra |
| **Incident** | An active operational event requiring triage, response, and resolution tracking | Aegis, Lyte |
| **Recommendation** | An AI-generated advisory with reasoning, evidence chain, and confidence score | Alloy, INCA, Lyte |
| **Action** | A human-confirmed response to a finding or recommendation, with full attribution | Alloy |
| **Actor** | A person, role, or AI agent responsible for an action or decision | All platforms |
| **Workflow** | A structured sequence of steps with approval gates and routing rules | Alloy, all platforms |
| **Audit Event** | An immutable record of any actor action, system state change, or AI output | All platforms |
| **Organization** | A tenant context for multi-tenant deployments | All platforms |

---

## Cross-Platform Data Flow

### Lyte (Business Observability)

```
External Systems (CRMs, ERPs, APIs, Webhooks)
    │
    ▼
Signal Ingestion Layer
    │   Normalizes signals to common schema
    │   Applies PRISM dimension tagging (Pulse/Risk/Intelligence/Signals/Motion)
    │
    ▼
PRISM Analysis Engine
    │   Scores by dimension
    │   Identifies anomalies and drift
    │   Calculates organizational health indices
    │
    ▼
Command Inbox + Action Queue
    │   Role-appropriate signal surfacing
    │   Priority ranking with contributing factors
    │
    ▼
Alloy → Human Approval → Confirmed Action → Audit Trail
```

### Aegis (Defense & Intelligence)

```
Security Event Sources (SIEM, endpoint, threat feeds, CVE databases)
    │
    ▼
Threat Normalization (MITRE ATT&CK mapping, STIX/TAXII)
    │
    ▼
Sentinel Agent (AI threat analysis, triage recommendation)
    │   Reasoning chain visible to analyst
    │   Confidence score + contributing indicators
    │
    ▼
SOC Command / Incident Queue
    │   Analyst review and enrichment
    │
    ▼
Alloy → Human Approval → Response Action → Audit Trail
```

### Vessels (Maritime Intelligence)

```
AIS Telemetry (vessel position, speed, heading, port calls)
    │
    ▼
Voyage Data Normalization
    │   Economic modeling, route analysis
    │   Dark period detection
    │
    ▼
Sanctions Screening (OFAC, UN, EU, UK sanctions lists)
    │
    ▼
Helmsman Agent (risk scoring, recommendation generation)
    │   Fleet health dashboard
    │   Exception queue with consequence modeling
    │
    ▼
Alloy → Human Approval → Response Action → Audit Trail
```

### Terra (Real Estate Intelligence)

```
NYC Public Data Sources (HPD, DOF, DOB, ACRIS, ECB)
    │
    ▼
Distress Signal Extraction
    │   Ownership structure mapping
    │   Distress score calculation
    │
    ▼
Property Intelligence Layer
    │   Deal opportunity scoring
    │   Market signal aggregation
    │
    ▼
Broker / Investor Dashboard
    │   Pipeline management via Alloy
    │
    ▼
Alloy → Deal Workflow → Action → Audit Trail
```

---

## Alloy Execution Flow

Alloy is the shared execution fabric. Every consequential action across all platforms flows through this pathway:

```
Signal / Finding / Recommendation
    │
    ▼
Workflow Creation
    │   Platform: which vertical is this from?
    │   Action type: what needs to happen?
    │   Priority: what is the urgency?
    │
    ▼
Routing Engine
    │   Who needs to approve?
    │   What is the approval deadline?
    │   What happens on timeout?
    │
    ▼
Human-in-the-Loop Gate ◄─── REQUIRED for consequential operations
    │   Actor reviews recommendation and evidence
    │   Actor approves, rejects, or escalates
    │   Cannot be bypassed at the code level
    │
    ▼
Action Execution
    │   Triggered after explicit approval
    │   Immutable audit event created
    │
    ▼
Outcome Recording
    │   Result logged with full attribution
    │   Recommendation chain preserved: signal → finding → recommendation → approval → action → outcome
```

---

## Audit Trail Schema

Every audit event captures:

```typescript
{
  id:           string       // Unique event ID
  timestamp:    DateTime     // UTC, immutable
  actor:        {
    id:         string       // User or agent ID
    role:       string       // Role at time of action
    type:       'human' | 'agent'
  }
  action:       string       // What happened (structured enum)
  entityType:   string       // What was acted on
  entityId:     string       // Which specific entity
  platform:     string       // Which platform (lyte, aegis, vessels, etc.)
  context:      {
    sessionId:  string       // Auth session
    workflowId: string | null // If action was workflow-triggered
    ipAddress:  string       // For security events
  }
  before:       object | null  // State before action (for mutations)
  after:        object | null  // State after action (for mutations)
  metadata:     object       // Domain-specific additional context
}
```

Audit events are append-only. Once written, they cannot be modified or deleted by any platform user, including platform administrators.

---

## Database Schema Organization

The single PostgreSQL database uses domain namespacing for table isolation:

| Domain | Prefix | Examples |
|--------|--------|---------|
| Core / Auth | (no prefix) | `users`, `organizations`, `roles`, `sessions` |
| Alloy | `alloy_*` | `alloy_workflows`, `alloy_actions`, `alloy_agents` |
| Lyte | `lyte_*` | `lyte_signals`, `lyte_prism_scores` |
| Aegis | `aegis_*` | `aegis_incidents`, `aegis_findings`, `aegis_playbooks` |
| Vessels | `vessels_*` | `vessels_vessels`, `vessels_voyages`, `vessels_positions` |
| Terra | `terra_*` | `terra_properties`, `terra_distress_signals` |
| Platform | `platform_*` | `platform_products`, `platform_feature_flags` |
| Audit | `audit_*` | `audit_events` (immutable, append-only) |

---

*See also: [System Overview](system-overview.md) · [Platform Map](platform-map.md)*
