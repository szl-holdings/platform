# AEEP Command UX Patterns

**Version:** 1.0 | **Date:** April 2026 | **Status:** Canonical  
**Design system reference:** `docs/DESIGN_SYSTEM.md`

---

## Overview

This document defines the shared UX interaction patterns used across all domain packs in the AEEP platform. These patterns establish the command-grade aesthetic: evidence-first, high information density, minimal noise, and consistent operator/executive experience across Command, Sentra, Counsel, Terra, Vessels, Pulse, and Holdings.

All patterns are implemented as shared components in `packages/design-system/` and `lib/shared-ui/`. Do not re-implement these patterns locally in individual artifacts.

---

## 1. Shell Pattern

### 1.1 AppShell

The AppShell is the root layout container for all authenticated product surfaces. It provides:
- Collapsible side navigation (SideNav)
- Top bar with global search and user context (TopBar)
- Density mode context via `DesignSystemProvider`
- Screen mode context via `useScreenMode()`
- Tenant context via `TenantIndicator`

**Component:** `AppShell` — `packages/design-system/src/shell/AppShell.tsx`

The AppShell background is always `color.bg.base (#060b12)`. Never render content directly on a white or light background in authenticated product UX.

### 1.2 Primary Navigation (SideNav)

The SideNav provides the canonical primary navigation structure for all AEEP surfaces.

**Required nav items (all authenticated surfaces):**
1. Overview
2. Operations
3. Search
4. Workflows
5. Evidence
6. Memory
7. Reports
8. Admin

Domain-specific items may be added between Operations and Search. Cross-surface navigation uses `EcosystemNav` in `lib/shared-ui`.

**Behavior:**
- Collapsed by default in dense/operator mode; expanded in comfortable/executive mode
- Active item highlighted with `color.accent.*` (domain-specific) left border indicator
- Icon + label in expanded state; icon-only with tooltip in collapsed state
- Keyboard navigable: Up/Down arrows between items, Enter to select

### 1.3 TopBar

Fixed header across all surfaces. Contains:
- Page title (using `page-title` text style — max 20px)
- Breadcrumb navigation
- Global search trigger (opens CommandPalette)
- Screen mode toggle (Executive / Operator)
- Density mode toggle (Comfortable / Compact / Dense)
- User avatar and menu
- Tenant indicator

### 1.4 CommandPalette / GlobalCommandPalette

Triggered by ⌘K (Mac) or Ctrl+K (Windows/Linux). Provides cross-surface fuzzy search across:
- Navigation destinations
- Entity search (across all domain packs)
- Recent items
- Quick actions

**Component:** `GlobalCommandPalette` — `packages/design-system/src/form/GlobalCommandPalette.tsx`  
**Backing service:** `CommandPalette` in `lib/shared-ui` wired to all 13 surfaces.

---

## 2. Queue Views

Queue views display actionable items requiring human attention: approvals, exceptions, alerts, pending workflows.

### 2.1 Structure

```
[PageHeader]
  [FilterBar — status, priority, assignee, time range]
  [TableToolbar — bulk actions, export, refresh]
  [DataGrid — rows with StatusBadge + key fields + action affordance]
  [DetailDrawer — opens on row click or action]
```

### 2.2 Row Anatomy

Each queue row must show:
1. **Status** — `StatusBadge` with named variant (pending, approved, rejected, escalated, etc.)
2. **Priority/Severity** — icon + text label (never color alone)
3. **Entity identifier** — primary entity name/ID
4. **Timestamp** — relative time (`FreshnessChip` for data currency)
5. **Assignee** — avatar + name or "Unassigned"
6. **Action** — primary CTA aligned right (Approve, Review, Escalate)

### 2.3 Empty State

When a queue is empty, render `EmptyState` with:
- Icon representing the entity type
- Heading: "No [items] found"
- Supporting copy explaining what would appear here
- Optional CTA if the user can create items

Never show a blank white area or raw "No results" text.

### 2.4 Loading State

Use `SkeletonLoader` with the same column structure as the loaded state. Never show a full-page spinner for queue loads — show skeleton rows.

---

## 3. Proof Drawers / Evidence Drawers

When a user clicks any AI-generated result, recommendation, or alert, they must be able to inspect the full proof envelope. This is the Evidence Drawer pattern.

### 3.1 Trigger

The evidence drawer is triggered by:
- Clicking the evidence badge (`EvidenceBadge`) on any result card
- Clicking "View Evidence" in a detail drawer
- The "Evidence" tab in an entity inspector

### 3.2 Anatomy

The `EvidenceDrawer` / `EvidencePanel` surfaces these mandatory fields for any material AI result:

| Field | Component | Description |
|---|---|---|
| Trace ID | `code` text style | The unique ID of the AI run that produced this result |
| Result summary | `NarrativePanel` | Plain-language explanation of the result |
| Source citations | Citation list | Each source with domain, recency, confidence |
| Policy verdict | `PolicyStateChip` | Which policy ran and what it decided |
| Confidence score | `ConfidenceMeter` | Quantitative confidence (high/medium/low) |
| Freshness | `FreshnessChip` | How current the underlying data is |
| Autonomy mode | `AutonomyModeToggle` | What autonomy level was active |
| Tool calls | Collapsible list | Which tools were invoked and their inputs/outputs |
| Approval status | `StatusBadge` | Current approval state |

**Component:** `EvidenceDrawer` — `packages/design-system/src/cockpit/EvidenceDrawer.tsx`  
**Component:** `EvidencePanel` — `packages/design-system/src/evidence/EvidencePanel.tsx`  
**Component:** `DetailDrawer` — `packages/design-system/src/detail/DetailDrawer.tsx`

### 3.3 Drawer Behavior

- Opens from the right side
- Width: 480px (comfortable), 400px (compact)
- Close: Escape key, X button, or click-outside (configurable)
- Focus traps inside while open
- Close returns focus to the element that triggered it
- Elevation: `elevation.drawer`
- Background: `color.bg.surface`

---

## 4. Replay Timelines

Replay timelines visualize the sequence of events, decisions, and tool calls in an agent run or workflow execution.

### 4.1 When to Use

- Agent run detail screens
- Workflow execution history
- Incident replay
- Decision audit trail

### 4.2 Anatomy

The `RunTimeline` / `TimelineLane` pattern:

```
[Timeline header — run ID, timestamp, duration, status badge]
  [Lane: Agent decisions]
    [Event] → timestamp | event type | actor | summary | evidence badge
  [Lane: Tool calls]
    [Event] → timestamp | tool name | input summary | output summary | latency
  [Lane: Policy checks]
    [Event] → timestamp | policy name | verdict | confidence
  [Lane: Human actions]
    [Event] → timestamp | actor | action | rationale]
```

**Components:**  
- `RunTimeline` — `packages/design-system/src/cockpit/RunTimeline.tsx`  
- `TimelineLane` — `packages/design-system/src/cockpit/TimelineLane.tsx`  
- `Timeline` — `packages/design-system/src/timeline/Timeline.tsx`

### 4.3 Visual Rules

- Timeline line color: `color.border.subtle`
- Event nodes: 8px circle, color matches event type (agent = blue, tool = teal, policy = violet, human = amber)
- Timestamp: `mono-sm` text style, `color.text.muted`
- Event type label: `label` text style, `color.text.secondary`
- Summary: `body` text style, `color.text.primary`
- Expandable tool call details: collapsible with `transition.expand`

---

## 5. Graph Views

Graph views visualize entity relationships, causal connections, and knowledge networks.

### 5.1 When to Use

- Entity relationship exploration
- Causal chain visualization
- Knowledge graph browsing
- Risk propagation maps

### 5.2 Anatomy

**Component:** `GraphCanvas` — `packages/design-system/src/cockpit/GraphCanvas.tsx`

Graph chrome uses the same dark token base:
- Canvas background: `color.bg.base`
- Node borders: `color.border.default`
- Edge lines: `color.border.subtle`
- Selected node: `color.accent.*` (domain accent) border
- Node text: `body-sm` text style
- Relationship label: `caption` text style

### 5.3 Visual Rules

- Nodes are rounded rectangles (`radius.md`) — not circles (circles imply social graph, not command surface)
- Edge thickness encodes relationship strength (1–3px)
- Zoom controls in bottom-left corner
- Mini-map in bottom-right corner for large graphs
- Click node → opens DetailDrawer for that entity
- Right-click → context menu with entity actions

---

## 6. Approval Rails

Approval rails are the canonical UX for human-in-the-loop decision points in AI-driven workflows.

### 6.1 When to Use

- AI recommends an action requiring human approval
- Policy returns `requiresApproval` verdict
- High-value or irreversible decisions
- Compliance-gated operations

### 6.2 Anatomy

**Component:** `ApprovalDialog` — `packages/design-system/src/cockpit/ApprovalDialog.tsx`

```
[Modal header — "Approval Required" + traceId]
  [Recommendation summary — NarrativePanel]
  [Evidence section — source citations, policy verdict, confidence]
  [Impact summary — what changes if approved]
  [Rationale field — required text input from approver]
  [Action row]
    [Escalate button — secondary]
    [Reject button — destructive]
    [Approve button — primary, domain accent]
```

### 6.3 Behavior

- Always modal — blocks background interaction
- Approval requires a non-empty rationale field
- Approve/Reject/Escalate are the only terminal actions
- Approval state is immediately reflected in the queue view via `StatusBadge`
- Approved/rejected actions write to the audit rail
- Keyboard: Tab through fields, Enter submits the focused action, Escape is disabled (must explicitly choose)

### 6.4 Audit Rail

Every approval/rejection/escalation creates an entry in the `AuditRail`.

**Component:** `AuditRail` — `packages/design-system/src/cockpit/AuditRail.tsx`  
**Component:** `AuditTrailList` — `packages/design-system/src/timeline/AuditTrailList.tsx`

Audit entries show: timestamp | actor | action | entity | rationale | traceId

---

## 7. Outcome Panels

Outcome panels display the results of completed AI operations, workflow runs, or human decisions.

### 7.1 When to Use

- Workflow completion summary
- Agent run outcome
- Batch operation result
- Report generation result

### 7.2 Anatomy

**Component:** `NarrativePanel` — `packages/design-system/src/cockpit/NarrativePanel.tsx`

```
[Panel header — outcome status badge + title]
  [Narrative section — plain-language AI summary]
  [Metrics row — key outcome metrics using MetricStat]
  [Evidence link — opens EvidencePanel]
  [Action row — next steps, export, share]
```

### 7.3 Visual Rules

- Panel background: `color.bg.surface`
- Status badge at top-left: `StatusBadge` with appropriate variant
- Narrative text: `body` text style, `color.text.primary`
- Metrics: `MetricStat` with `metric-sm` text style
- No decorative charts unless data meaningfully supports them
- Export as PDF/CSV via toolbar action — not inline button in panel body

---

## 8. Status Badges

`StatusBadge` is the canonical component for all status, state, severity, and approval rendering across every surface. Never implement custom status coloring.

**Component:** `StatusBadge` — `packages/design-system/src/data/StatusBadge.tsx`

### 8.1 Supported Variants

| Variant | Color | Use |
|---|---|---|
| `success` | Green (`#5baa8a`) | Completed, allowed, healthy, active |
| `warning` | Amber (`#c9a85c`) | Pending, aging, requires attention |
| `error` | Red (`#c96070`) | Failed, blocked, critical, rejected |
| `info` | Blue (`#4d8fcc`) | Informational, in progress |
| `neutral` | Slate (`#7a99b8`) | Unknown, not applicable, inactive |
| `pending` | Amber (`#c9a85c`) | Awaiting action |
| `active` | Blue (`#4d8fcc`) | Currently running or in use |
| `approved` | Green (`#5baa8a`) | Human approved |
| `rejected` | Red (`#c96070`) | Human rejected |
| `escalated` | Violet (`#9b7cc8`) | Escalated to higher authority |

### 8.2 Usage Rules

- Every badge must pair color with an icon AND a text label
- Badge radius: `radius.sm (3px)`
- Font: `label` text style (11px / 500 weight)
- Never use badge color alone to communicate state
- Use `aria-label` on icon-only badge variants

---

## 9. Empty States

Empty states appear when a view has no data to show — queue is empty, search returns nothing, filter has no matches, or the feature has not been configured.

**Component:** `EmptyState` — `packages/design-system/src/feedback/EmptyState.tsx`

### 9.1 Anatomy

```
[Container — centered, comfortable padding]
  [Icon — muted, domain-appropriate, 48px]
  [Heading — "No [entity type] yet" / "No results found"]
  [Body — one sentence explaining what would appear here]
  [CTA button — optional, primary or secondary]
```

### 9.2 Rules

- Icon: muted color (`color.text.muted`), never a decorative illustration in data-dense surfaces
- Heading: `section-title` text style
- Body: `body` text style, `color.text.secondary`
- Never show a blank area without an empty state
- Never center-align content in wide panels (align left for operator mode, center only for full-page empty states)

---

## 10. Loading States

Use skeleton loading for data-bearing surfaces. Use spinner only for triggered actions (form submit, export, sync).

**Components:**  
- `SkeletonLoader` — `packages/design-system/src/feedback/SkeletonLoader.tsx`  
- `LoadingState` — `packages/design-system/src/feedback/LoadingState.tsx`

### 10.1 Skeleton Rules

- Skeleton shape matches the loaded content shape (table rows = row-shaped skeletons)
- Skeleton color: `color.bg.raised` on `color.bg.surface` background
- Animate with a subtle shimmer using the `transition.fade` token — no pulsing glow
- Show 5–8 skeleton rows for table loading; 3–4 card skeletons for card grids

### 10.2 Spinner Rules

- Use only for triggered actions (button press, form submit)
- Spinner: simple rotation only — no spring, bounce, or color cycling
- Duration: `motion.duration.slow` (200ms) per revolution
- Color: `color.accent.*` (domain accent)

---

## 11. Error States

**Component:** `ErrorState` — `packages/design-system/src/feedback/ErrorState.tsx`

### 11.1 Anatomy

```
[Error icon — red, 32px]
[Heading — "Something went wrong"]
[Body — specific error description or code]
[Actions — Retry | Contact support]
```

### 11.2 Rules

- Never show a raw stack trace to non-admin users
- Always provide a Retry action where retrying is possible
- Log the traceId alongside the error message for operators
- Error background: `semantic.status.error.bg (#2a0d12)` — do not use full-page red backgrounds

---

## 12. Search and Filter Patterns

### 12.1 SearchInput

**Component:** `SearchInput` — `packages/design-system/src/form/SearchInput.tsx`

- Placeholder: "Search [entity type]..."
- Icon: Lucide `Search` (16px, `color.text.muted`)
- Height: matches density mode input height
- Clears on Escape key
- Debounce: 200ms before triggering query

### 12.2 FilterBar

**Component:** `FilterBar` — `packages/design-system/src/data/FilterBar.tsx`

Standard horizontal filter row above data grids:
```
[SearchInput] [Select: Status] [Select: Assignee] [DateRangePicker] [Clear filters link]
```

- Filter bar is always visible in operator mode
- In executive mode, filters collapse behind a "Filter" button
- Active filters show a count badge on the Filter button
- Applied filters show as removable chips below the filter bar

### 12.3 SegmentedControl

**Component:** `SegmentedControl` — `packages/design-system/src/form/SegmentedControl.tsx`

Used for mutually exclusive view switches: "Table / Chart", "Day / Week / Month", "Executive / Operator".

- Segments use `label` text style
- Active segment: `color.bg.raised` background, domain accent text
- Inactive: `color.text.secondary`
- Border: `color.border.default`

---

## 13. Split Pane / Inspector Patterns

### 13.1 SplitPane

**Component:** `SplitPane` — `packages/design-system/src/layout/SplitPane.tsx`

Used for list-detail layouts where both sides need simultaneous visibility.

- Left pane: list/queue (DataGrid or FilterBar + queue rows)
- Right pane: entity inspector
- Draggable divider with min width constraints
- Keyboard: Tab moves focus between panes; focus indicator on active pane

### 13.2 SideInspector / InspectorTabs

**Components:**  
- `SideInspector` — `packages/design-system/src/layout/SideInspector.tsx`
- `InspectorTabs` — `packages/design-system/src/layout/InspectorTabs.tsx`

Used for entity detail inspection without leaving the current list view.

Tab pattern for entity detail:
1. **Overview** — key metrics, status, summary
2. **Evidence** — EvidencePanel
3. **Timeline** — activity feed and run history
4. **Audit** — AuditTrailList
5. **Settings** — entity configuration (admin only)

---

## 14. Narrative / AI Summary Pattern

All AI-generated summaries, briefings, and narratives must use `NarrativePanel` to ensure consistent formatting, evidence linkage, and tone.

**Component:** `NarrativePanel` — `packages/design-system/src/cockpit/NarrativePanel.tsx`

### 14.1 Rules

- Never render raw LLM output as unstyled prose
- Always surface the traceId alongside the narrative
- Always provide an "Evidence" link that opens the EvidencePanel
- Narrative text: `body` style, `color.text.primary`, max-width 72ch for readability
- Generated timestamp: `caption` style, `color.text.muted`

---

## 15. Recommendation Queue Pattern

Used in Pulse (executive briefing), Command (operations), and domain pack dashboards to surface AI-generated recommendations requiring human review.

**Component:** `RecommendationCard` — `packages/design-system/src/cockpit/RecommendationCard.tsx`

### 15.1 Card Anatomy

```
[Card — elevation.card, color.bg.surface]
  [Header row]
    [Priority badge — StatusBadge]
    [Domain tag]
    [Timestamp — FreshnessChip]
  [Recommendation title — card-title text style]
  [Summary — body-sm, 2-line clamp]
  [Evidence bar — ConfidenceMeter + EvidenceBadge + PolicyStateChip]
  [Action row — Approve | Defer | Dismiss | View Evidence]
```

### 15.2 Rules

- Recommendation cards are never draggable or sortable by end users (sort by priority, recency, or severity only)
- Approve/Defer/Dismiss are the terminal card actions
- "View Evidence" always opens the EvidenceDrawer — never expands inline
- Empty recommendation queue: render `EmptyState` with a checkmark icon and "All caught up"

---

## 16. Map Surface Pattern

Used in Vessels (fleet tracking), Terra (property portfolio), and Sentra (incident geo).

**Component:** `MapSurface` — `packages/design-system/src/cockpit/MapSurface.tsx`

### 16.1 Visual Rules

- Map tile: dark satellite or dark road style — never light/white map backgrounds
- Marker color: domain accent for active entities, `color.text.muted` for inactive
- Cluster marker: count badge using `label` text style on `color.bg.surface` background
- Tooltip on hover: `elevation.overlay` shadow, `color.bg.surface` background
- Click marker → opens DetailDrawer for that entity

### 16.2 Controls

- Zoom in/out: bottom-right
- Fullscreen toggle: top-right
- Layer toggle: top-left (if multiple entity types)
- Always keyboard accessible (arrow keys pan, +/- zoom)

---

## 17. Activity Feed Pattern

Used in Overview pages, entity timelines, and the SentientLayer AI rail.

**Components:**  
- `ActivityFeed` — `packages/design-system/src/timeline/ActivityFeed.tsx`
- `AgentRunCard` — `lib/shared-ui/AgentRunCard`

### 17.1 Feed Item Anatomy

```
[Actor avatar or icon — 24px]
[Content]
  [Actor name — label style]
  [Action description — body-sm style]
  [Entity link — text.link color]
[Timestamp — caption style, right-aligned]
```

### 17.2 Rules

- Feed is reverse-chronological
- Group events within the same 5-minute window by actor to reduce noise
- "Load more" pagination at the bottom — no infinite scroll in operator mode
- AI-generated events surface an `EvidenceBadge` inline
