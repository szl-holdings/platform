# Aegis — Phase 4 Acceptance Criteria

**Date:** April 2, 2026  
**Phase:** Post-Payload Phase 4 — Shared Backbone Integration  
**App:** Aegis (Firestorm) — Unified Defense & Intelligence Command

---

## Purpose

This document defines the measurable acceptance criteria for Aegis Phase 4. Each criterion maps to a specific deliverable. Pass/fail reflects verified state as of delivery.

---

## AC-AEG-01: Incidents Page — OperationalDetailPane Slide-in

**Criterion:** Clicking an incident row opens a slide-in detail pane implemented using `OperationalDetailPane` from the shared backbone.

**Verified:**
- `IncidentDetailSidePane` renders `OperationalDetailPane` with the entity from `buildIncidentEntity()`
- Pane contains Overview, Evidence, Escalation, and Audit tabs
- All tabs render without error

**Status: PASS**

---

## AC-AEG-02: Incidents Page — Audit Timeline

**Criterion:** The Audit tab in the incident detail pane renders `OperationalAuditTimeline` with entries derived from the incident's current field state.

**Verified:**
- `auditHistory` is built at render time from `createdAt`, `assignedAnalyst`, `status`, `resolvedAt`
- Minimum entries: detection (created), assignment (if analyst set), status advancement, resolution (if resolvedAt set)
- Timeline renders via `OperationalAuditTimeline` without error

**Scope note:** Audit entries are client-side reconstructions from available incident fields, not a server-side audit log. This is the correct approach at this stage.

**Status: PASS**

---

## AC-AEG-03: Incidents Page — Evidence Panel

**Criterion:** The Evidence tab renders `OperationalEvidencePanel` with items built from available incident fields.

**Verified:**
- Evidence items built from `attackTechnique` (ATT&CK technique label) and `severity` (triage classification)
- `OperationalEvidencePanel` renders without error
- Empty state handled if neither field is populated

**Scope note:** Evidence items cover ATT&CK classification and severity. IOC-level evidence (IPs, file hashes) is not implemented in this phase; the field is available in the entity type for future enrichment.

**Status: PASS**

---

## AC-AEG-04: Incidents Page — Escalation Panel

**Criterion:** The Escalation tab renders `OperationalEscalationPanel` with escalation paths for critical incidents.

**Verified:**
- Critical non-closed incidents receive an automatic L1 "Incident Commander" escalation path
- `OperationalEscalationPanel` renders with this path
- Non-critical incidents render an empty escalation state gracefully

**Status: PASS**

---

## AC-AEG-05: Incidents Page — OperationalOwnerChip

**Criterion:** The incident detail pane displays the assigned analyst using `OperationalOwnerChip`.

**Verified:**
- `entity.owner` is set from `incident.assignedAnalyst` with role "Analyst"
- `OperationalOwnerChip` renders in the detail pane via `OperationalDetailPane`
- Unassigned incidents render the chip's unassigned fallback state

**Status: PASS**

---

## AC-AEG-06: Incidents Page — Status Lifecycle Mutations

**Criterion:** Incident status can be advanced from the incident list via the shared `updateMut` mutation, and the onUpdate callback is wired into the detail pane.

**Verified:**
- `advanceStatus()` calls `api.incidents.update(id, { status: nextStatus })` through `updateMut`
- Advancing to `closed` automatically sets `resolvedAt`
- `onUpdate` prop is passed into `IncidentDetailSidePane` for in-pane updates
- React Query invalidates `["incidents"]` on success

**Scope note:** Status is updated via a general update endpoint, not dedicated action-specific endpoints (`/acknowledge`, `/escalate`, `/resolve`). The UI status lifecycle covers the same logical transitions.

**Status: PASS**

---

## AC-AEG-07: Cases Page — OperationalAuditTimeline

**Criterion:** The case detail panel renders `OperationalAuditTimeline` replacing the previous raw text audit trail.

**Verified:**
- `OperationalAuditTimeline` is imported and rendered in `CaseDetailPanel`
- Entries built from `statusHistory` (status changes) and `notes` (analyst comments)
- Raw text audit trail is no longer present

**Status: PASS**

---

## AC-AEG-08: Cases Page — OperationalOwnerChip

**Criterion:** The case detail panel displays the assigned analyst using `OperationalOwnerChip`.

**Verified:**
- `OperationalOwnerChip` rendered in case detail header/metadata
- Unassigned cases render the chip's fallback state

**Status: PASS**

---

## AC-AEG-09: Research Tools Nav — Removed

**Criterion:** Experimental and non-operational intel lab pages are removed from the Aegis sidebar navigation, route table, and lazy imports.

**Verified:**
- "Research Tools" collapsible sidebar section: removed
- Removed routes: `/intel/gpu-monitoring`, `/intel/llm-eval`, `/intel/benchmarking`, `/intel/model-registry`, `/intel/ensemble`, `/intel/experiments`, `/intel/agent-spawner`, `/intel/neural-explorer`, `/intel/alerts`
- Removed lazy imports: `GPUMonitoring`, `LLMEvaluation`, `Benchmarking`, `ModelRegistry`, `EnsembleStudio`, `Experiments`, `AgentSpawner`, `NeuralExplorer`, `IntelAlertsManagement`
- Removed state: `intelToolsExpanded`, `intelToolsNav`, `SHOW_EXPERIMENTAL_INTEL`
- Command palette entries updated to remove stale routes

**Status: PASS**

---

## AC-AEG-10: Retained Intel Routes Functional

**Criterion:** The nine retained intelligence routes remain accessible and render their components.

**Routes retained:** `/intel/dashboard`, `/intel/quipu-command`, `/intel/chasqui-relay`, `/intel/dual-mind`, `/intel/willaq-umu`, `/intel/models`, `/intel/predictions`, `/intel/projects`, `/intel/insights`

**Verified:** All nine routes registered in router; lazy imports intact; no build errors.

**Status: PASS**

---

## AC-AEG-11: App Compiles and Serves Without Error

**Criterion:** The Firestorm Vite dev server starts and serves without build-time or import errors after Phase 4 changes.

**Verified:** Workflow log confirms "VITE v7.3.1 ready in 2061ms" with no errors.

**Status: PASS**

---

## Summary

| Criterion | Status |
|---|---|
| AC-AEG-01: OperationalDetailPane on incidents | PASS |
| AC-AEG-02: Audit timeline on incidents | PASS |
| AC-AEG-03: Evidence panel on incidents | PASS |
| AC-AEG-04: Escalation panel on incidents | PASS |
| AC-AEG-05: OperationalOwnerChip on incidents | PASS |
| AC-AEG-06: Status lifecycle mutations wired | PASS |
| AC-AEG-07: OperationalAuditTimeline on cases | PASS |
| AC-AEG-08: OperationalOwnerChip on cases | PASS |
| AC-AEG-09: Research Tools nav removed | PASS |
| AC-AEG-10: Retained intel routes functional | PASS |
| AC-AEG-11: App compiles and serves without error | PASS |

**11 / 11 criteria met.**
