# Aegis Operationalization Report

**Date:** April 2, 2026  
**Status:** Post-Payload Phase 4 — Shared Backbone Integrated  
**Version:** 2.0

---

## Executive Summary

Aegis (Firestorm) has been upgraded from a SOC dashboarding surface into a working operational command shell that inherits the shared operational backbone from Alloy/Lyte/Terra. This report documents the **actual** API surface, UI integration, and data contracts delivered in Phase 4. Domain-specific differences remain cleanly isolated. Non-operationally-backed experimental lab features have been removed from navigation.

---

## What Aegis Is

Aegis is the **unified defense and intelligence command surface** for the SZL Holdings platform. It is the primary interface through which security analysts, SOC operators, and executives:

- **Detect** — security incidents, alerts, and threat intelligence signals
- **Investigate** — enriched incident timelines, evidence chains, and MITRE ATT&CK mappings
- **Act** — advance incident status, assign analysts, and track escalation paths
- **Review** — full operational audit timeline per entity (who did what, when)

---

## Shared Backbone Integration

### Primitives Adopted

All of the following are imported from `@workspace/shared-ui/operational-primitives`:

| Primitive | Usage in Aegis |
|---|---|
| `OperationalDetailPane` | Slide-in entity detail pane for incidents |
| `OperationalAuditTimeline` | Audit history for incidents and cases |
| `OperationalEvidencePanel` | ATT&CK technique and severity classification evidence |
| `OperationalEscalationPanel` | Escalation path display (critical incidents) |
| `OperationalOwnerChip` | Analyst ownership on incidents and cases |
| `OperationalRiskBadge` | Severity-to-risk-level badge |
| `severityToRiskLevel` | Canonical severity normalizer |

### Entity Mapping (`buildIncidentEntity`)

`buildIncidentEntity()` maps `AegisIncident` API data to the canonical `OperationalEntity` type:

```typescript
function buildIncidentEntity(incident: any): OperationalEntity {
  // Evidence built from available fields:
  const evidence: EvidenceItem[] = [];
  if (incident.attackTechnique) {
    evidence.push({ id: "att-ck", label: "ATT&CK Technique",
      value: incident.attackTechnique, source: "MITRE ATT&CK", confidence: 0.9 });
  }
  if (incident.severity) {
    evidence.push({ id: "severity", label: "Severity Classification",
      value: incident.severity.toUpperCase(), source: "Triage System",
      confidence: incident.severity === "critical" ? 0.97 : 0.88 });
  }

  // Audit history derived from incident fields (not a separate endpoint):
  const auditHistory: AuditHistoryEntry[] = [];
  // – created entry from createdAt
  // – assigned entry when assignedAnalyst is set
  // – status-update entry when status != "detection"
  // – resolved entry when resolvedAt is set

  // Escalation paths: critical non-closed incidents get L1 "Incident Commander" path
  const escalationPaths = incident.severity === "critical" && incident.status !== "closed"
    ? [{ level: 1, label: "Critical — Incident Commander", ... }]
    : [];

  return {
    id: incident.id, title: incident.title, status: incident.status,
    riskLevel: severityToRiskLevel(incident.severity ?? "low"),
    owner: incident.assignedAnalyst ? { name: incident.assignedAnalyst, role: "Analyst" } : undefined,
    evidence, auditHistory, escalationPaths, ...
  };
}
```

**Note:** Audit history is derived at render time from the incident's current fields (not a server-side audit log). This is a client-side reconstruction pattern, consistent with early-stage operationalization.

---

## UI Integration: Incidents Page (`/incidents`)

### Queue Behavior
- Live incident list fetched from `GET /aegis/incidents` via `api.incidents.list()`
- Filtered by status, severity, and free-text search
- KPI strip: Total, Critical, Active, and per-status counts
- Auto-refresh every 30 seconds via React Query

### Detail Pane (Slide-in)
`IncidentDetailSidePane` renders `OperationalDetailPane` with the entity built by `buildIncidentEntity()`:
- Overview tab: incident rationale/description, ATT&CK classification
- Evidence tab: `OperationalEvidencePanel` with ATT&CK technique and severity items
- Escalation tab: `OperationalEscalationPanel` with critical-incident escalation path
- Audit tab: `OperationalAuditTimeline` with chronological state transitions

### Status Advancement
Incident status is advanced via `api.incidents.update(id, { status: nextStatus })` using `updateMut`. The status lifecycle is:

```
detection → triage → analysis → containment → remediation → closed
```

Advancing to `closed` sets `resolvedAt` automatically. The `onUpdate` callback is passed into `IncidentDetailSidePane` from the page.

---

## UI Integration: Cases Page (`/cases`)

### Changes Applied
- `OperationalAuditTimeline` renders case audit history (status changes + notes) in the `CaseDetailPanel`
- `OperationalOwnerChip` replaces the previous manual analyst display in case details

### Audit Entry Construction (Cases)
```typescript
const auditEntries = [
  ...(caseItem.statusHistory || []).map(h => ({
    id: `status-${h.changedAt}`, actor: h.changedBy || "System",
    action: `Status changed to ${h.newStatus}`, timestamp: h.changedAt,
    category: "status" as const,
  })),
  ...(caseItem.notes || []).map(n => ({
    id: `note-${n.createdAt}`, actor: n.author || "Analyst",
    action: n.content, timestamp: n.createdAt,
    category: "comment" as const,
  })),
];
```

---

## Nav Downgrade: Research Tools Removed

The following experimental/non-operational intel pages have been removed from the Aegis sidebar navigation and route table:

| Page | Route | Reason |
|---|---|---|
| GPU Monitoring | `/intel/gpu-monitoring` | Not operationally relevant |
| LLM Evaluation | `/intel/llm-eval` | Lab tooling, not a command surface |
| Benchmarking | `/intel/benchmarking` | Lab tooling |
| Model Registry | `/intel/model-registry` | Lab tooling |
| Ensemble Studio | `/intel/ensemble` | Lab tooling |
| Experiments | `/intel/experiments` | Deprecated route |
| Agent Spawner | `/intel/agent-spawner` | Removed with SHOW_EXPERIMENTAL_INTEL flag |
| Neural Explorer | `/intel/neural-explorer` | Removed with SHOW_EXPERIMENTAL_INTEL flag |
| Intel Alerts Management | `/intel/alerts` | Redundant with SOC alerts |

Removed artifacts: `intelToolsNav` array, `intelToolsExpanded` state, `SHOW_EXPERIMENTAL_INTEL` flag, "Research Tools" sidebar JSX section, and all removed lazy imports.

**Retained Intel Engine routes:**
`/intel/dashboard`, `/intel/quipu-command`, `/intel/chasqui-relay`, `/intel/dual-mind`, `/intel/willaq-umu`, `/intel/models`, `/intel/predictions`, `/intel/projects`, `/intel/insights`

---

## Domain-Specific Isolation

These features remain Aegis-specific:

- MITRE ATT&CK tactic mapping and matrix view
- XDR console and endpoint telemetry
- Threat intelligence feed (CVE enrichment, actor profiling)
- Vulnerability dashboard and scanner integration
- Compliance readiness scoring (SOC 2, ISO 27001)
- MSP operations views (NOC, dispatch, RMM, service desk)

---

## Data Sources

| Entity | API Method | Notes |
|---|---|---|
| Incidents list | `api.incidents.list()` | Live |
| Incident create | `api.incidents.create(data)` | Live |
| Incident update | `api.incidents.update(id, data)` | Status lifecycle via update |
| Incident delete | `api.incidents.delete(id)` | Live |
| Cases | `api.cases.list()` / `api.cases.get(id)` | Live |
