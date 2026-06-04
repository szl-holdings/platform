# Operational Design Standard

**Date:** April 2, 2026  
**Status:** Canonical — All lanes must adopt  
**Version:** 1.0

---

## Purpose

This document defines the **canonical design standard** for operational surfaces across the SZL Holdings platform ecosystem. Every platform that handles operational entities — signals, incidents, actions, workflows — must implement these patterns consistently.

Lyte and Alloy are the reference implementations. Terra, Aegis, and Vessels inherit from this standard.

---

## Design Philosophy

**Clarity under pressure.** Operational interfaces are used by people making consequential decisions under time pressure. Every design choice must serve that context.

**Information hierarchy.** What is most urgent must be most visible. Labels, colors, and layout enforce priority — not just visually signal it.

**Explicit state.** Users never guess what something is doing. Every entity's status, approval state, and data freshness are visible at all times.

**Action proximity.** The path from "I see a problem" to "I take action" should be at most two clicks. Queue → Detail → Action.

---

## Color System (Dark Theme)

```
Background:
  page:     #080c14   (deepest level)
  surface:  #0c1018   (cards, panels)
  elevated: #10141e   (headers, modals)

Border:
  subtle:   rgba(255,255,255,0.04)
  muted:    rgba(255,255,255,0.07)

Text:
  primary:   rgba(255,255,255,0.88)
  secondary: rgba(255,255,255,0.55)
  tertiary:  rgba(255,255,255,0.28)
  muted:     rgba(255,255,255,0.14)

Accent:
  gold:    #d4a054   (primary CTA, attention, "live" indicator)
```

### Semantic Status Colors

| Status Category   | Color      | Hex       | Usage                              |
|-------------------|------------|-----------|------------------------------------|
| Success / Done    | Forest     | `#6b8f71` | completed, resolved, approved      |
| Running / Active  | Gold       | `#d4a054` | running, executing, in_progress    |
| Warning / Caution | Amber      | `#c8953c` | escalated, degraded, expiring      |
| Approval Pending  | Violet     | `#8b7ac8` | waiting_approval, approval pending |
| Information       | Steel Blue | `#4a90b8` | approved, investigating, contained |
| Error / Failed    | Crimson    | `#c45a4a` | failed, rejected, open (critical)  |
| Neutral / Muted   | Slate      | `#6b7280` | cancelled, closed, suppressed      |

**Rule:** Every status badge uses exactly these colors. No new status colors. If a new status needs a color, it maps to the closest existing semantic.

---

## Status Badge Standard

```tsx
// From @workspace/shared-ui
<OperationalStatusBadge
  status="waiting_approval"
  size="sm"    // xs | sm | md
  pulse        // shows animated dot for active states
/>
```

**Size guide:**
- `xs` — queue row secondary info
- `sm` — queue row primary, detail pane header
- `md` — standalone status display, summary cards

**Always include status badges** for any entity in a list. Never use text-only status.

---

## Risk Level Standard

Risk levels map to severity or a computed score:

| Level    | Score Range | Color   | Usage                                 |
|----------|-------------|---------|---------------------------------------|
| critical | 0.85–1.00   | Crimson | Immediate action required             |
| high     | 0.65–0.84   | Gold    | Action required within hours          |
| medium   | 0.35–0.64   | Amber   | Action required within day            |
| low      | 0.00–0.34   | Forest  | Monitor, no immediate action          |

```tsx
<OperationalRiskBadge
  level="critical"     // or use score
  score={0.92}
  showScore            // shows (92) next to label
/>
```

---

## Queue View Standard

Every operational surface must expose a queue view with these characteristics:

### Layout
- Full-width list, not grid
- Each row: entity type tag, title, status badge, risk badge, owner chip, next action, timestamp
- Selected row: left border accent highlight (`2px solid #d4a054`)
- Row click: opens detail pane (slide-in or right panel)

### Sorting
- Default: severity descending (critical → high → medium → low), then `updatedAt` desc
- Secondary sorts: `createdAt`, `dueAt`, `owner.name`, `riskScore`
- Sort controls: two-button header (sort field + direction toggle)

### Filtering
- Filter bar: severity, status, entity type, owner, approval state
- Active filters shown as dismissible chips
- Filter state persisted in URL search params

### Empty State
- Text: "No items match the current filter"
- Show filter reset button
- Never show a blank page

---

## Detail Pane Standard

When a queue row is selected, a detail pane opens. It must contain, in order:

1. **Entity header** — title, status badge, risk badge, approval badge
2. **Owner + Next Action** — side-by-side, always present (show "Unassigned" if no owner)
3. **Evidence + Rationale** — expandable panel, shown if available
4. **Active Escalations** — warning panel, shown if any active paths
5. **Custom domain slot** — domain-specific fields (e.g., fleet position, property distress score)
6. **Audit History Timeline** — chronological, bottom of pane

```tsx
<OperationalDetailPane entity={entity}>
  {/* domain-specific content goes here */}
  <DomainSpecificFields data={domainData} />
</OperationalDetailPane>
```

---

## Approval Gate Standard

Approval state must be visible at every level where it is relevant:

### Queue row
- Show `OperationalApprovalBadge` when `approvalState !== "none"`
- Pulse animation when `approvalState === "pending"`

### Detail pane
- Show approval panel when `requiresApproval === true`
- Include: approval state, reviewer (if assigned), expiry time, approve/reject buttons

### Approve/Reject buttons
- Approve: violet (`#8b7ac8`) background, border `rgba(139,122,200,0.3)`
- Reject: crimson (`#c45a4a`) background, border `rgba(196,90,74,0.3)`
- Both require confirmation on click (no accidental approvals)

---

## Evidence Panel Standard

```tsx
<OperationalEvidencePanel
  items={evidenceItems}
  rationale="The entity resolution confidence dropped below threshold due to..."
/>
```

Evidence item display:
- Label + value as primary row
- Source as secondary text
- Confidence as right-aligned percentage (green ≥80%, gold ≥60%, red <60%)

Rationale display:
- Gold-tinted panel above evidence list
- "Rationale" label in gold accent
- Paragraph text in secondary color

---

## Audit Timeline Standard

```tsx
<OperationalAuditTimeline
  entries={auditHistory}
  maxEntries={10}
  compact={false}
/>
```

Timeline rendering:
- Vertical line connecting entries
- Actor type dot: blue = user, gold = agent, muted = system
- Action label + actor name + relative timestamp
- State transition shown as `previous → next` (colored: red for from, green for to)
- Notes shown below transition if present

---

## Escalation Panel Standard

Active escalations always render above audit history in the detail pane:

```tsx
<OperationalEscalationPanel paths={escalationPaths} />
```

Visual: amber background panel showing level, target role, notification channels, and time triggered.

---

## Typography Scale (Operational UI)

| Use                         | Size   | Weight     | Font    |
|-----------------------------|--------|------------|---------|
| Section header              | 13px   | semibold   | system  |
| Table header / label        | 9px    | semibold   | mono    |
| Primary content             | 11px   | medium     | system  |
| Secondary content           | 10px   | regular    | system  |
| Tertiary / timestamps       | 9px    | regular    | mono    |
| Badge / chip labels         | 8–9px  | semibold   | mono    |
| KPI numbers                 | 18–24px| bold       | mono    |

---

## KPI Strip Standard

Every domain command surface should include a KPI strip at the top:

```
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Metric 1 │ Metric 2 │ Metric 3 │ Metric 4 │ Metric 5 │ Metric 6 │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

- 6 columns on desktop (collapse to 3 on mobile)
- Label: 8px, uppercase, muted
- Value: 18–24px, bold, mono, semantic color
- Sub-label: 8px, mono, muted (e.g., "7d avg", "active")
- Pulse dot for live/active metrics

---

## Live vs. Simulation Mode

Every operational surface must show a clear live/simulation indicator:

```tsx
{isLive ? (
  <div className="flex items-center gap-1.5">
    <Wifi className="w-3 h-3" style={{ color: ACCENT }} />
    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
    <span className="text-[10px] font-mono" style={{ color: ACCENT }}>Live</span>
  </div>
) : (
  <div className="flex items-center gap-1.5">
    <WifiOff className="w-3 h-3" style={{ color: TEXT.tertiary }} />
    <span className="text-[10px] font-mono" style={{ color: TEXT.tertiary }}>Simulation</span>
  </div>
)}
```

**Rule:** Never show simulated data without labeling it. Operators must always know what they are looking at.

---

## Shared UI Components Reference

All operational components are exported from `@workspace/shared-ui`:

| Component                    | Import                           |
|------------------------------|----------------------------------|
| `OperationalStatusBadge`     | `from "@workspace/shared-ui"`    |
| `OperationalRiskBadge`       | `from "@workspace/shared-ui"`    |
| `OperationalApprovalBadge`   | `from "@workspace/shared-ui"`    |
| `OperationalOwnerChip`       | `from "@workspace/shared-ui"`    |
| `OperationalEvidencePanel`   | `from "@workspace/shared-ui"`    |
| `OperationalAuditTimeline`   | `from "@workspace/shared-ui"`    |
| `OperationalEscalationPanel` | `from "@workspace/shared-ui"`    |
| `OperationalDetailPane`      | `from "@workspace/shared-ui"`    |
| `OperationalQueueRow`        | `from "@workspace/shared-ui"`    |
| `getStatusConfig`            | `from "@workspace/shared-ui"`    |
| `getRiskConfig`              | `from "@workspace/shared-ui"`    |
| `formatAgo`                  | `from "@workspace/shared-ui"`    |
| `formatDuration`             | `from "@workspace/shared-ui"`    |

Type exports: `OperationalEntity`, `OperationalStatus`, `RiskLevel`, `ApprovalState`, `EvidenceItem`, `AuditHistoryEntry`, `EscalationPath`, `OperationalOwner`

---

*See also: [alloy-operationalization.md](alloy-operationalization.md) · [lyte-operationalization.md](lyte-operationalization.md) · [cross-lane-operationalization.md](cross-lane-operationalization.md)*
