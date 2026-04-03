# Lyte Operationalization Report

**Date:** April 2, 2026  
**Status:** Post-Payload Phase 2 — Operational Shell Delivered  
**Version:** 2.0

---

## Executive Summary

Lyte has been upgraded from a dashboarding surface into a working operational command shell. This report documents the **actual** API surface, UI integration, and data contracts delivered in Phase 2. All fields and mutations described here are implemented and backed by the database.

---

## What Lyte Is

Lyte is the **observability command surface** for the SZL Holdings platform. It is the primary interface through which operators, analysts, and executives:

- **See** — every signal, incident, and action across the business in one ranked queue
- **Prioritize** — by severity and recency
- **Act** — by triaging, assigning ownership, escalating, or routing to Alloy for execution
- **Review** — escalation history and audit timeline per entity

Lyte does not execute actions directly. It surfaces and prioritizes. Alloy executes.

---

## UI Integration: Operational Queue (`/queue`)

The Lyte Command Center includes a live **Operational Queue** page at the `/queue` route. It merges signals, incidents, and actions from the backend REST API into a unified ranked view.

**Data sources:**
- `GET /lyte/signals` — signals with metadata (assignee, rationale, escalations)
- `GET /lyte/incidents` — incidents with status and assignee
- `GET /lyte/actions` — actions with state, priority, stateHistory

**Filter controls:**
- Entity type: `all | signal | incident | action`
- Severity: `all | critical | high | medium | low`

**Sort controls:**
- Sort by: `severity | createdAt`
- Sort direction: ascending or descending toggle
- Default: severity descending, tie-break by createdAt descending

**KPI strip:** Total items, Critical count, High count, Escalated count, Unassigned count

**Detail pane:** Slide-in pane per item showing rationale, next action, ownership, escalation path history, and audit timeline. Includes assign and escalate action buttons.

**Auto-refresh:** Every 30 seconds via React Query.

---

## GraphQL API: Queue Query

```graphql
lyteQueue(
  filter: LyteQueueFilter
  sortBy: String
  sortDir: String
  limit: Int
  offset: Int
): [LyteQueueItem!]!

input LyteQueueFilter {
  entityType: String   # signal | incident | action
  severity: String     # valid severity for entity type
  status: String       # valid status for entity type
  priority: String     # urgent | high | medium | low — actions only
  assignee: String     # exact match
  domain: String       # signals: source column; incidents: impactArea column
}

type LyteQueueItem {
  id: ID!
  entityType: String!
  entityId: ID!
  title: String!
  severity: String
  status: String
  priority: String
  assignee: String
  source: String
  createdAt: String!
  updatedAt: String!
}
```

**Sort behavior:**
- `sortBy: "severity"` — critical=4, high=3, medium=2, low=1, info=0; ties broken by createdAt desc
- `sortDir: "asc"` — reverses primary sort direction
- `sortDir: "desc"` — default (highest severity first)

**Filter behavior:**
- `priority` filter applies to actions only (DB column: `lyte_actions.priority`)
- `domain` filter applies to signals (`source` column) and incidents (`impactArea` column)

---

## GraphQL API: Entity Types

### LyteSignal

```graphql
type LyteSignal {
  id: ID!
  source: String
  sourceType: String
  severity: String   # critical | high | medium | low | info
  title: String
  description: String
  status: String     # new | acknowledged | resolved | dismissed
  # Operational fields — derived from metadata jsonb
  assignee: String
  rationale: String
  nextAction: String
  escalationPaths: [EscalationPath!]!
  auditHistory: [AuditHistoryEntry!]!
  createdAt: String
  updatedAt: String
}
```

### LyteIncident

```graphql
type LyteIncident {
  id: ID!
  title: String
  severity: String   # critical | high | medium | low
  status: String     # open | investigating | mitigating | resolved | closed
  impactArea: String
  rootCause: String
  resolution: String
  assignee: String
  resolvedAt: String
  # Operational fields — derived from metadata jsonb
  escalationPaths: [EscalationPath!]!
  auditHistory: [AuditHistoryEntry!]!
  createdAt: String
  updatedAt: String
}
```

### LyteAction

```graphql
type LyteAction {
  id: ID!
  title: String
  description: String
  state: String      # new | acknowledged | assigned | escalated | resolved | dismissed
  priority: String   # urgent | high | medium | low
  valueAtRisk: String
  assignedTo: String
  owner: String
  notes: String
  dueAt: String
  resolvedAt: String
  # Operational fields — derived from stateHistory jsonb
  escalationPaths: [EscalationPath!]!
  auditHistory: [AuditHistoryEntry!]!
  createdAt: String
  updatedAt: String
}
```

### Shared Operational Primitives

```graphql
type EscalationPath {
  id: ID!
  level: Int!
  label: String!
  targetRole: String!
  targetUserId: ID
  notifyChannels: [String!]!
  triggeredAt: String
  resolvedAt: String
  active: Boolean!
}

type AuditHistoryEntry {
  id: ID!
  action: String!
  actor: String!
  actorType: String!
  previousState: String
  newState: String
  notes: String
  timestamp: String!
}
```

---

## Mutations

### Ownership

```graphql
assignLyteSignalOwner(id: ID!, ownerUserId: String!): LyteSignal!
# persists to: metadata.assignee (jsonb)

assignLyteIncidentOwner(id: ID!, assignee: String!): LyteIncident!
# persists to: assignee (text column)

assignLyteActionOwner(id: ID!, assignedTo: String!): LyteAction!
# persists to: assignedTo (text column); transitions state → assigned
```

### Escalation

```graphql
escalateLyteSignal(id: ID!, reason: String, targetRole: String!): LyteSignal!
# appends to: metadata.escalations[] = [{targetRole, reason, escalatedAt}]

escalateLyteIncident(id: ID!, reason: String, targetRole: String!): LyteIncident!
# appends to: metadata.escalations[] = [{targetRole, reason, escalatedAt}]
# also transitions: open → investigating

escalateLyteAction(id: ID!, reason: String, targetRole: String!): LyteAction!
# appends to: stateHistory[] = [{state: "escalated", targetRole, reason, changedAt}]
# also transitions: state → escalated
```

### Triage

```graphql
triageLyteSignal(id: ID!, rationale: String!, nextAction: String!): LyteSignal!
# persists to: metadata.rationale, metadata.nextAction
```

### Resolution

```graphql
resolveLyteSignal(id: ID!, notes: String): LyteSignal!
resolveLyteIncident(id: ID!, resolution: String!, rootCause: String): LyteIncident!
updateLyteActionState(id: ID!, state: String!, rationale: String): LyteAction!
```

### Executive Summary

```graphql
lyteExecutiveSummary: LyteExecutiveSummary!

type LyteExecutiveSummary {
  criticalSignals: Int!
  highSignals: Int!
  openIncidents: Int!
  criticalIncidents: Int!
  pendingActions: Int!
  pendingApprovals: Int!
  topRisks: [String!]!
  generatedAt: String!
}
```

---

## Persistence Model

| Entity | Ownership Field | Escalation Storage | Audit Storage |
|---|---|---|---|
| Signal | `metadata.assignee` (jsonb) | `metadata.escalations[]` (jsonb) | `metadata.auditHistory[]` (jsonb) |
| Incident | `assignee` (text column) | `metadata.escalations[]` (jsonb) | `metadata.auditHistory[]` (jsonb) |
| Action | `assignedTo` (text column) | `stateHistory[]` entries with `state="escalated"` | `stateHistory[]` (jsonb) |

### Schema Change

`lyte_incidents.metadata jsonb` — added in Phase 2 to store escalation paths and audit history. Auto-provisioned via `ensureTables()` migration at boot.

---

## Events Published

| Event | Trigger |
|---|---|
| `LYTE_EVENTS.QUEUE_CHANGED` | All 10 queue-affecting mutations |
| `LYTE_EVENTS.SIGNAL_UPDATED` | Signal triage, escalation, assignment |
| `LYTE_EVENTS.INCIDENT_UPDATED` | Incident escalation, resolution, assignment |
