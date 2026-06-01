# Cross-Lane Operationalization Plan

**Date:** April 2, 2026  
**Status:** Post-Payload Phase 2 — Backbone Ready, Lanes Queued  
**Version:** 1.0

---

## Purpose

This document defines how Terra, Aegis, and Vessels will inherit the Alloy + Lyte operational backbone established in Phase 2. The patterns are standardized. The shared primitives are in `@workspace/shared-ui`. The execution fabric is in Alloy. This document specifies what each lane needs to do to adopt them.

---

## The Backbone (What Alloy + Lyte Built)

### What exists now

| Component                      | Location                                           | Status    |
|--------------------------------|----------------------------------------------------|-----------|
| Workflow state machine          | `artifacts/api-server/src/lib/alloy-orchestration.ts` | Complete |
| Workflow GraphQL API           | `artifacts/api-server/src/graphql/domains/alloy.ts`   | Complete |
| Lyte operational shell         | `artifacts/api-server/src/graphql/domains/lyte.ts`    | Complete |
| Shared operational primitives  | `lib/shared-ui/src/operational-primitives.tsx`        | Complete |
| Audit trail infrastructure     | `@workspace/db` alloy_audit_log table                 | Complete |
| Approval flow                  | Alloy orchestration lib                               | Complete |
| Escalation paths               | Lyte GraphQL + shared-ui components                   | Complete |

### What every lane inherits

By calling Alloy's GraphQL API and adopting the shared-ui components, each lane gets:

- Validated workflow lifecycle (draft → terminal)
- Human-in-the-loop approval gates (cannot be bypassed)
- Retry policy with exponential backoff
- Immutable audit trail with full attribution
- Escalation paths (L1–L4)
- Executive summary views
- Standardized UI components (status, risk, evidence, timeline)

---

## Lane Adoption Plan

### Tier 1: High Priority (Next Phase)

#### Aegis — Defense & Intelligence

**Current state:** Incidents managed with `updateLyteIncident`-style mutations, no approval gates, no escalation paths.

**What to build:**
1. Route all high/critical threat responses through `createAlloySignalWorkflow`
2. Add `approvalRequired: true` for all destructive response actions (block IP, isolate host, kill process)
3. Wire SOC analyst role to approval reviewer
4. Add evidence chain to Aegis findings (IOCs, threat feeds, MITRE techniques)
5. Implement escalation paths: L1=analyst, L2=SOC lead, L3=CISO, L4=board

**GraphQL additions needed:**
```graphql
# In firestorm.ts GraphQL domain
type AegisFinding {
  # ... existing ...
  owner: OperationalOwner
  evidence: [EvidenceItem!]
  rationale: String
  approvalState: ApprovalState
  alloyWorkflowId: ID
  escalationPaths: [EscalationPath!]
  auditHistory: [AuditHistoryEntry!]
}

escalateAegisFinding(id: ID!, level: Int!, targetRole: String!): AegisFinding!
routeAegisFindingToAlloy(id: ID!, responseType: String!): AlloyWorkflow!
```

**UI changes:**
- SOC queue view uses `OperationalQueueRow` + `OperationalDetailPane`
- Approval gate widget in incident detail
- MITRE ATT&CK technique tags mapped to evidence items

---

#### Terra — Real Estate Intelligence

**Current state:** Distress signals surface properties, pipeline actions are UI-only with no approval or audit.

**What to build:**
1. Route deal actions through `createAlloySignalWorkflow` (offer submission, LOI routing, due diligence triggers)
2. Add approval for high-value transactions (>$5M configurable threshold)
3. Evidence chain = distress signal data points (HPD violations, tax liens, pre-foreclosure filings)
4. Escalation paths: L1=broker, L2=fund analyst, L3=investment committee, L4=GP

**GraphQL additions needed:**
```graphql
# In terra.ts GraphQL domain
type TerraDealAction {
  # ... existing ...
  owner: OperationalOwner
  evidence: [EvidenceItem!]
  rationale: String
  valueAtRisk: Float        # deal value
  approvalRequired: Boolean
  approvalState: ApprovalState
  alloyWorkflowId: ID
  escalationPaths: [EscalationPath!]
  auditHistory: [AuditHistoryEntry!]
}

routeTerraActionToAlloy(distressSignalId: ID!, actionType: String!, dealValue: Float): AlloyWorkflow!
```

**UI changes:**
- Pipeline view becomes an operational queue
- Deal detail pane uses `OperationalDetailPane` with distress data as evidence items
- Approval gate for offers above threshold

---

### Tier 2: Medium Priority (Phase 3)

#### Vessels — Maritime Intelligence

**Current state:** Fleet positions and risk scores surface but no execution layer.

**What to build:**
1. Route high-risk vessel responses through Alloy (sanctions escalation, dark period reporting, port authority notification)
2. Evidence chain = AIS telemetry, sanctions match details, voyage anomalies
3. Approval for externally visible actions (regulatory reporting, charter termination)
4. Escalation paths: L1=fleet ops, L2=compliance officer, L3=C-suite, L4=legal/regulatory

**GraphQL additions needed:**
```graphql
# In vessels.ts GraphQL domain
type VesselsComplianceAction {
  owner: OperationalOwner
  evidence: [EvidenceItem!]     # AIS data, sanctions hits, anomalies
  rationale: String
  riskScore: Float
  approvalRequired: Boolean
  approvalState: ApprovalState
  alloyWorkflowId: ID
  escalationPaths: [EscalationPath!]
}

routeVesselRiskToAlloy(vesselId: ID!, riskType: String!, severity: String!): AlloyWorkflow!
```

**UI changes:**
- Exception queue replaces static risk list
- Fleet detail pane uses `OperationalDetailPane`
- Sanctions review workflow with compliance evidence panel

---

## Shared Implementation Checklist (Per Lane)

When implementing the backbone for any lane, follow this checklist:

### Database
- [ ] Domain signal/finding table has `ownerUserId` column
- [ ] Domain action table has `approvalRequired`, `approvalState` columns
- [ ] Domain tables reference `alloy_workflow_id` where needed

### GraphQL
- [ ] Domain entities include `owner: OperationalOwner`
- [ ] Domain entities include `evidence: [EvidenceItem!]`
- [ ] Domain entities include `auditHistory: [AuditHistoryEntry!]`
- [ ] Domain entities include `escalationPaths: [EscalationPath!]`
- [ ] Domain entities include `approvalState: ApprovalState`
- [ ] `assignOwner` mutation implemented
- [ ] `escalate` mutation implemented with level + targetRole
- [ ] `routeToAlloy` mutation calls `createAlloySignalWorkflow`

### Frontend
- [ ] Queue view uses `OperationalQueueRow`
- [ ] Detail pane uses `OperationalDetailPane`
- [ ] Status badges use `OperationalStatusBadge`
- [ ] Risk badges use `OperationalRiskBadge`
- [ ] Approval state uses `OperationalApprovalBadge`
- [ ] Evidence rendered with `OperationalEvidencePanel`
- [ ] Audit history rendered with `OperationalAuditTimeline`
- [ ] Escalation paths rendered with `OperationalEscalationPanel`
- [ ] Live/simulation mode indicator present

### Policy
- [ ] Approval required for severity >= high (configurable threshold)
- [ ] Approval required for actions exceeding dollar thresholds (domain-specific)
- [ ] Escalation L3/L4 triggers notification to relevant channel (Slack/email)
- [ ] Audit trail written for every state change

---

## Shared Infrastructure Used by All Lanes

```
@workspace/shared-ui
  └─ operational-primitives.tsx
       ├─ OperationalStatusBadge
       ├─ OperationalRiskBadge
       ├─ OperationalApprovalBadge
       ├─ OperationalOwnerChip
       ├─ OperationalEvidencePanel
       ├─ OperationalAuditTimeline
       ├─ OperationalEscalationPanel
       ├─ OperationalDetailPane
       ├─ OperationalQueueRow
       └─ Types: OperationalEntity, EvidenceItem, AuditHistoryEntry, EscalationPath

@workspace/api-server (GraphQL)
  ├─ alloy.ts — workflow lifecycle mutations + subscriptions
  └─ lyte.ts — queue, detail, executive summary queries

@workspace/db
  ├─ alloy_workflows — canonical workflow state
  ├─ alloy_approvals — approval records
  ├─ alloy_audit_log — immutable event trail
  └─ alloy_actions — recorded action outcomes
```

---

## Sequencing

```
Phase 2 (Complete):
  Alloy backbone hardened
  Lyte operational shell built
  Shared primitives extracted and documented

Phase 3 (Next):
  Aegis adopts backbone (SOC command + threat response)
  Terra adopts backbone (deal pipeline + approval gates)

Phase 4:
  Vessels adopts backbone (fleet compliance + sanctions escalation)

Phase 5:
  Carlota Jo uses Alloy for advisory workflow routing
  SZL Holdings executive dashboard surfaces cross-lane rollup
```

---

## Success Metrics

| Metric                                       | Target           |
|----------------------------------------------|------------------|
| % of consequential actions routed through Alloy | 100%          |
| Approval coverage for high/critical severity | 100%             |
| Audit trail coverage for significant events  | 100%             |
| UI pattern consistency (shared primitives)   | All lanes        |
| Time from signal to action (median)          | < 5 minutes      |
| False escalation rate                        | < 5%             |
| Retry exhaustion rate                        | < 2%             |

---

*See also: [alloy-operationalization.md](alloy-operationalization.md) · [lyte-operationalization.md](lyte-operationalization.md) · [design-standard.md](design-standard.md)*
