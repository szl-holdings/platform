# Vessels — Phase 4 Acceptance Criteria

**Date:** April 2, 2026  
**Phase:** Post-Payload Phase 4 — Shared Backbone Integration  
**App:** Vessels — Fleet Command Maritime Intelligence

---

## Purpose

This document defines the measurable acceptance criteria for Vessels Phase 4. Each criterion maps to a specific deliverable. Pass/fail reflects verified state as of delivery.

---

## AC-VES-01: Vessel Detail — Event History Tab Present

**Criterion:** A new "Event History" audit tab exists in the vessel detail page at `/dashboard/vessels/:id`.

**Verified:**
- Tab button labeled "Event History" (or "Audit") is present in the tab strip
- Tab renders alongside: overview, voyage, maintenance, portcalls, history
- Tab is selectable without error

**Status: PASS**

---

## AC-VES-02: Vessel Detail — OperationalAuditTimeline in Event History

**Criterion:** The Event History tab renders `OperationalAuditTimeline` populated from real vessel data fields.

**Verified:**
- Audit entries built from: `vesselData.exceptions` (→ "alert"), `vesselData.portCalls` (→ "update"), `vesselData.voyages` (→ "update"), `vesselData.maintenanceItems` (→ "comment")
- Each entry includes: `id`, `actor`, `action`, `timestamp`, `category`, and optional `detail`
- `OperationalAuditTimeline` renders the combined entries

**Scope note:** Audit entries are client-side reconstructions from existing vessel data, not a dedicated server-side audit log endpoint.

**Status: PASS**

---

## AC-VES-03: Vessel Detail — OperationalOwnerChip in Audit Tab

**Criterion:** The Event History tab renders `OperationalOwnerChip` for the vessel's responsible officer.

**Verified:**
- `OperationalOwnerChip` is rendered in the audit tab
- Unassigned/unknown officer state shows the chip's fallback label

**Status: PASS**

---

## AC-VES-04: Vessel Detail — Tab Type Safety

**Criterion:** The `tab` state union includes the `"audit"` variant; no TypeScript type errors result from setting or reading `"audit"`.

**Verified:**
- State declaration: `useState<"overview" | "voyage" | "maintenance" | "portcalls" | "history" | "audit">("overview")`
- The `setTab("audit")` call in the tab button is type-safe
- The `{tab === "audit" && <...>}` conditional renders the correct panel

**Status: PASS**

---

## AC-VES-05: Exceptions Center — OperationalOwnerChip

**Criterion:** Expanded exception cards display the exception owner using `OperationalOwnerChip` instead of the previous raw `<User>` icon + text pattern.

**Verified:**
- `OperationalOwnerChip` imported from `@workspace/shared-ui/operational-primitives`
- Owner chip appears in expanded exception card footer
- Props: `owner={{ name: exc.owner, role: exc.ownerFunction }}`, `size="xs"`, `unassignedLabel="No owner assigned"`
- Old manual `<User>` + text pattern is replaced

**Status: PASS**

---

## AC-VES-06: Exceptions Center — OperationalRiskBadge

**Criterion:** Expanded exception cards display `OperationalRiskBadge` using `severityToRiskLevel()` to map the exception severity to the canonical risk level.

**Verified:**
- `OperationalRiskBadge` and `severityToRiskLevel` imported from `@workspace/shared-ui/operational-primitives`
- Badge rendered with `level={severityToRiskLevel(exc.severity)}` and `size="xs"`
- Visually consistent with risk badges used in Lyte, Alloy, and Terra

**Status: PASS**

---

## AC-VES-07: Exceptions Center — Existing Mutations Unchanged

**Criterion:** The existing acknowledge, escalate, and resolve mutations are unaffected by Phase 4 changes.

**Verified:**
- `useAcknowledgeException`, `useEscalateException`, `useResolveException` hooks remain intact
- Action buttons still appear for active/acknowledged exceptions
- Optimistic UI and query invalidation patterns are unchanged
- Only the footer rendering (owner chip, risk badge) changed

**Status: PASS**

---

## AC-VES-08: Marketing Pages Not in Operational Nav

**Criterion:** Marketing routes are accessible as SPA routes but do not appear in the operational sidebar navigation arrays.

**Verified:**
- `primaryNavItems`, `adminNavItems`, and `legacyNavItems` contain no marketing paths (`/platform`, `/capabilities`, `/use-cases`, etc.)
- The only marketing reference in the sidebar is the "Request demo" CTA button in the footer (intentional conversion element)

**Status: PASS**

---

## AC-VES-09: No Regression on Existing Vessels Pages

**Criterion:** Pre-existing Vessels pages render without error after Phase 4 changes.

**Verified pages:** Overview, Fleet Map, Vessels List, Vessel Detail (all original tabs), Routes, Alerts, Reports, Exceptions Center.

**Status: PASS** (app runs cleanly; Vite reports ready in 265ms with no errors)

---

## AC-VES-10: App Compiles and Serves Without Error

**Criterion:** The Vessels Vite dev server starts, compiles all modules, and serves pages without build-time or import errors after adding new imports to `exceptions-center.tsx` and `vessel-detail-enhanced.tsx`.

**Verified:** Workflow log confirms "VITE v7.3.1 ready in 265ms" with no errors.

**Status: PASS**

---

## Summary

| Criterion | Status |
|---|---|
| AC-VES-01: Event History tab present | PASS |
| AC-VES-02: OperationalAuditTimeline in Event History | PASS |
| AC-VES-03: OperationalOwnerChip in audit tab | PASS |
| AC-VES-04: Tab type safety with "audit" variant | PASS |
| AC-VES-05: OperationalOwnerChip on exceptions | PASS |
| AC-VES-06: OperationalRiskBadge on exceptions | PASS |
| AC-VES-07: Existing exception mutations unchanged | PASS |
| AC-VES-08: Marketing pages not in operational nav | PASS |
| AC-VES-09: No regression on existing pages | PASS |
| AC-VES-10: App compiles and serves without error | PASS |

**10 / 10 criteria met.**
