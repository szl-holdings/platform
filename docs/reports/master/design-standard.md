# Trust UI Design Standard — SZL Holdings Platform
**Date:** April 3, 2026  
**Status:** Canonical — All lanes must adopt  
**Version:** 1.1

---

## Purpose

This document defines the canonical trust UI patterns for every operational surface in the SZL Holdings platform. It is the implementation guide for making trust visible — not just in documentation, but in the product itself.

The full operational design standard (color system, typography, queue/detail layout) is in [`docs/reports/master/product/design-standard.md`](product/design-standard.md). This document focuses specifically on **trust UI patterns**: audit, ownership, evidence, escalation, maturity language, and role-aware controls.

---

## The Ten Trust Patterns

Every serious operational surface must implement all ten patterns below. Carlota Jo and Stephen Site are exempt from patterns 4, 5, 6, and 9 (they are not operational command surfaces).

### 1. Audit Trail

**What:** A chronological, immutable log of every state change, decision, and action on an entity.

**Implementation:**
```tsx
import { OperationalAuditTimeline } from "@workspace/shared-ui";

<OperationalAuditTimeline
  entries={entity.auditHistory}
  maxEntries={20}
  compact={false}
/>
```

**Rules:**
- Always place at the bottom of the detail pane
- Always show, even if empty (empty state: "No audit history yet")
- System actions shown with muted dot; user actions with blue dot; agent actions with gold dot
- State transitions shown as `from → to` in semantic colors

**Verification:** Open any Lyte entity detail → scroll to bottom → see audit timeline

---

### 2. Ownership Badge

**What:** Who owns this entity. Visible at queue row level and in the detail pane header.

**Implementation:**
```tsx
import { OperationalOwnerChip } from "@workspace/shared-ui";

<OperationalOwnerChip
  owner={entity.owner}
  compact={isQueueRow}
/>
```

**Rules:**
- Always show, even if unassigned (display "Unassigned" explicitly — never hide the absence of an owner)
- In queue rows: compact chip with avatar initials and name
- In detail pane: full chip with role

---

### 3. Current Status

**What:** The lifecycle state of the entity, shown with a semantic color badge.

**Implementation:**
```tsx
import { OperationalStatusBadge } from "@workspace/shared-ui";

<OperationalStatusBadge
  status={entity.status}
  size="sm"
  pulse={["running", "executing", "in_progress"].includes(entity.status)}
/>
```

**Rules:**
- Never use raw text for status — always use the badge component
- Pulse animation for active states only (running, executing, in_progress)
- Status colors are fixed — no overrides without updating the design system

---

### 4. Next Action

**What:** What needs to happen and who needs to do it. The clearest signal of what's blocking.

**Implementation:**
```tsx
// In OperationalDetailPane — nextAction prop
<OperationalDetailPane
  entity={entity}
  // entity.nextAction: string | NextAction
/>
```

**Rules:**
- Always show in the detail pane header area
- If no next action, show "No action required" — never leave empty
- Urgent next actions shown with amber accent
- Link to action handler where possible

---

### 5. Evidence and Rationale Panel

**What:** Why the system or user took an action. Shows evidence items with confidence scores and a rationale statement.

**Implementation:**
```tsx
import { OperationalEvidencePanel } from "@workspace/shared-ui";

<OperationalEvidencePanel
  items={entity.evidence}
  rationale={entity.rationale}
/>
```

**Rules:**
- Show if `entity.evidence` has any items or `entity.rationale` is set
- Confidence ≥80%: green; ≥60%: gold; <60%: red
- Rationale shown as gold-tinted panel above evidence list
- Source attribution required for every evidence item

---

### 6. Role-Aware Controls

**What:** Buttons and actions are shown, hidden, or disabled based on the current user's role.

**Implementation:**
```tsx
import { useRole, RoleGate } from "@workspace/shared-ui";

const { hasRole } = useRole();

<RoleGate roles={["admin", "analyst"]}>
  <ApproveButton />
</RoleGate>
```

**Rules:**
- Never show actions a user cannot perform
- Disabled state (grayed out) is acceptable only when the user needs to see that an action exists but is blocked by approval state — not by role
- Role check happens server-side; UI is a convenience layer, not a security boundary

---

### 7. Escalation Path Indicator

**What:** Shows who will be notified if this entity is not resolved, and whether escalation has been triggered.

**Implementation:**
```tsx
import { OperationalEscalationPanel } from "@workspace/shared-ui";

{entity.escalationPaths?.some(p => p.active) && (
  <OperationalEscalationPanel paths={entity.escalationPaths} />
)}
```

**Rules:**
- Show only when escalation is active (amber warning panel)
- Show level, target role, notification channels, and trigger time
- If no escalation, omit the component (do not show "No escalation")

---

### 8. History / Timeline

**What:** The full history of the entity — same as the audit trail (Pattern 1). Included as a separate named pattern for clarity.

See Pattern 1. In some contexts (e.g., a full-page history view), the timeline may be rendered at larger scale with more entries and expanded notes.

---

### 9. Export / Report Controls

**What:** The ability to export the full entity record — status, owner, evidence, audit trail, escalation history — as a PDF or structured data export.

**Implementation:**
```tsx
import { ExportButton, ExportableSection } from "@workspace/shared-ui";

// Wrap any entity detail section to make it exportable:
<ExportableSection
  title="Audit Record Export"
  data={entity}
  options={{ format: "json", filename: `audit-${entity.id}` }}
>
  {/* entity detail content */}
</ExportableSection>

// Or a standalone export button:
<ExportButton
  data={entity}
  options={{ format: "pdf", title: "Audit Record" }}
/>
```

**Rules:**
- Required on all detail panes for serious operational entities
- Export must include the full audit trail (not just current state)
- Timestamp and exported-by user are included in the export

---

### 10. Honest Maturity Language

**What:** Every surface that is not production-ready clearly states its stage.

**Implementation:**
```tsx
import { DataStateBadge, DataStateBanner } from "@workspace/shared-ui";

// For data state:
<DataStateBadge state="seeded" />  // or "live" | "simulated"

// For app stage:
<EnvironmentLabel />  // Shows dev/staging/prod

// For demo mode:
<DemoModeSwitcher />  // Allows switching between live/demo
```

**Rules:**
- Every surface with seeded data must show `DataStateBadge` with `state="seeded"` or `state="simulated"`
- Never show demo data without labeling it
- Expansion-lane apps (Aegis, Terra, Vessels) must include a stage label in the app header or landing
- Roadmap features must be marked as "Coming soon" — never presented as current capability

---

## Integration Status Per App

| App | Audit Trail | Owner Chip | Status Badge | Next Action | Evidence Panel | Role Controls | Escalation | Export | Data State |
|-----|-------------|-----------|-------------|-------------|---------------|--------------|------------|--------|-----------|
| Lyte | Full | Full | Full | Full | Full | Full | Partial | Partial | Partial |
| Alloy (engine) | Full | N/A | Full | N/A | Full | Full | N/A | N/A | Full |
| Aegis | Partial | Partial | Partial | Partial | Roadmap | Partial | Roadmap | Roadmap | Needed |
| Terra | Partial | Partial | Partial | Partial | Roadmap | Partial | Roadmap | Roadmap | Needed |
| Vessels | Partial | Partial | Partial | Partial | Roadmap | Partial | Roadmap | Roadmap | Needed |
| SZL Holdings | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Full |
| Carlota Jo | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Full |

**Legend:** Full = implemented and wired | Partial = component exists, integration incomplete | Roadmap = planned | Needed = missing, required | N/A = not applicable for this surface type

---

## Removing Hype Copy — Rules

1. **No metrics you can't back** — if you cannot point to the data source, the metric is removed
2. **No "live" language for seeded data** — if the data is seeded, it is labeled as such
3. **No "enterprise" claims for prototype features** — prototype features are labeled as prototype
4. **No "AI-powered" claims without pointing to the AI subsystem** — every AI claim must link to the Alloy engine evidence
5. **Stage labels are not optional** — every expansion lane app must display its honest stage in the header

---

## Shared UI Components: Trust Layer Reference

| Component | Pattern # | Import |
|-----------|-----------|--------|
| `OperationalAuditTimeline` | 1, 8 | `@workspace/shared-ui` |
| `AuditTrailDrawer` | 1 | `@workspace/shared-ui` |
| `OperationalOwnerChip` | 2 | `@workspace/shared-ui` |
| `OperationalStatusBadge` | 3 | `@workspace/shared-ui` |
| `OperationalDetailPane` | 4 | `@workspace/shared-ui` |
| `OperationalQueueRow` | 2, 3, 4 | `@workspace/shared-ui` |
| `OperationalEvidencePanel` | 5 | `@workspace/shared-ui` |
| `EvidencePanel` (Alloy) | 5 | `@workspace/shared-ui` |
| `ConfidenceBand` | 5 | `@workspace/shared-ui` |
| `RoleGate` / `useRole` | 6 | `@workspace/shared-ui` |
| `OperationalApprovalBadge` | 6 | `@workspace/shared-ui` |
| `OperationalEscalationPanel` | 7 | `@workspace/shared-ui` |
| `DataStateBadge` / `DataStateBanner` | 10 | `@workspace/shared-ui` |
| `DemoModeProvider` / `DemoModeSwitcher` | 10 | `@workspace/shared-ui` |
| `EnvironmentLabel` | 10 | `@workspace/shared-ui` |

---

*See also: [product/design-standard.md](product/design-standard.md) · [platform-trust-summary.md](platform-trust-summary.md) · [claim-vs-capability-audit.md](claim-vs-capability-audit.md)*
