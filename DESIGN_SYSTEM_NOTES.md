# Design System Notes — SZL Holdings Platform

**Version:** 1.0 · **Last updated:** April 2026

---

## Design Principles

The SZL Holdings design language follows four governing principles:

1. **Calm authority** — The UI should feel settled, not anxious. Operators make high-stakes decisions; the interface should project confidence, not urgency.
2. **Hierarchy over noise** — Every piece of information has a rank. Critical data is visually dominant. Secondary data recedes. Decorative elements do not exist.
3. **Governance is visible** — The approval chain, proof trail, and primitive involvement are always surfaced — never hidden in logs.
4. **Speed is respect** — Operators do not click through menus. Keyboard shortcuts, inline actions, and command palette access are first-class.

---

## Design Tokens

All design tokens are defined in `lib/shared-ui/src/tokens.ts`. All apps must use the token system — hardcoded hex values in components are prohibited except for app-specific accent colors defined in `LANE_ACCENT_HEX`.

### Color Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `colors.background` | `hsl(214, 16%, 4%)` | Page background |
| `colors.surface` | `hsl(214, 12%, 8%)` | Card and panel backgrounds |
| `colors.surfaceElevated` | `hsl(214, 10%, 11%)` | Elevated surface (modal, dropdown) |
| `colors.border` | `hsla(0, 0%, 100%, 0.08)` | Default border |
| `colors.borderStrong` | `hsla(0, 0%, 100%, 0.14)` | Prominent border |
| `colors.foreground` | `hsl(38, 8%, 92%)` | Primary text |
| `colors.muted` | `hsl(214, 7%, 55%)` | Secondary text, labels |
| `colors.subtle` | `hsl(214, 7%, 35%)` | Tertiary text, disabled states |
| `colors.primary` | `hsl(191, 92%, 44%)` | Primary actions, links |
| `colors.success` | `hsl(152, 70%, 50%)` | Success states, active |
| `colors.warning` | `hsl(45, 90%, 55%)` | Warning states |
| `colors.danger` | `hsl(0, 84%, 60%)` | Error states, destructive |
| `colors.info` | `hsl(210, 90%, 60%)` | Informational |
| `colors.accent` | `hsl(260, 70%, 65%)` | Accent / violet |

### App Accent Colors (Lane Colors)

Each domain pack has a defined accent color from `LANE_ACCENT_HEX` in `lib/shared-ui/src/lane-colors.ts`. These accent colors are used for:
- App identity in the EcosystemNav
- Sidebar active state indicator
- Loading spinner color
- Focus rings and interactive highlights

| App | Primary Accent | Usage |
|-----|---------------|-------|
| SZL Holdings | Slate | Corporate identity |
| Lyte / Command | Cyan (`#22d3ee`) | Primary command surface |
| Aegis | Violet (`#8b7ac8`) | Security domain pack |
| Vessels | Sky blue (`#38bdf8`) | Maritime domain pack |
| Terra | Copper (`#c87941`) | Real estate domain pack |
| Carlota Jo | Warm stone (`#d4b896`) | Advisory domain pack |
| Alloy | Blue (`#60a5fa`) | Execution fabric |

---

## Component Library

All shared components live in `lib/shared-ui/src/`. The primary exports:

### Layout Components

| Component | Import Path | Purpose |
|-----------|-------------|---------|
| `DashboardShell` | `@szl-holdings/shared-ui/design-system` | Full-page operator shell with sidebar |
| `SidebarNav` | `@szl-holdings/shared-ui/design-system` | Sidebar navigation with grouped sections |
| `EcosystemNav` | `@szl-holdings/shared-ui/ecosystem-nav` | Global top-bar navigation |
| `PackBanner` | `@szl-holdings/shared-ui` | Domain pack identity banner (top of sidebar) |

### Interaction Components

| Component | Import Path | Purpose |
|-----------|-------------|---------|
| `CommandPalette` | `@szl-holdings/shared-ui/command-palette` | Cmd+K global command interface |
| `AgentCopilot` | `@szl-holdings/shared-ui/copilot` | Domain-specific AI copilot panel |
| `UserButton` | `@szl-holdings/shared-ui/UserButton` | Auth-aware user profile button |
| `NotificationCenter` | `@szl-holdings/shared-ui` | Cross-domain notification panel |

### Feedback & State Components

| Component | Import Path | Purpose |
|-----------|-------------|---------|
| `SandboxModeBanner` | `@szl-holdings/shared-ui` | Demo/sandbox indicator banner |
| `RealtimeStatusIndicator` | `@szl-holdings/shared-ui` | SSE connection health badge |
| `SyncStatusBadge` | `@szl-holdings/shared-ui` | Offline sync queue status |
| `StaleIndicator` | `@szl-holdings/shared-ui/stale-indicator` | Data freshness warning |
| `OnboardingWizard` | `@szl-holdings/shared-ui` | First-run guided onboarding overlay |
| `GettingStartedChecklist` | `@szl-holdings/shared-ui` | Persistent onboarding checklist |

### Primitive UI Components

From `@szl-holdings/shared-ui/ui/*` (shadcn/ui based):

- `Button`, `Input`, `Select`, `Checkbox`, `Switch`
- `Dialog`, `Sheet`, `Popover`, `Tooltip`
- `Table`, `Badge`, `Card`, `Separator`
- `Tabs`, `Accordion`, `ScrollArea`
- `Sonner` (toast notifications)

---

## Pattern Library

### Page Layout Pattern

Every operator page follows this shell structure:

```
DashboardShell
  ├── PackBanner (domain identity, breadcrumbs)
  ├── SidebarNav (grouped sections)
  └── Main Content Area
        ├── PageHeader (title, subtitle, primary action)
        ├── KPI Row (3–5 critical metrics)
        └── Content Grid / Table / Map
```

### KPI Row Pattern

All primary dashboards open with a KPI row of 3–5 metrics. Rules:
- 3 metrics minimum, 5 maximum (cognitive load threshold)
- Each metric shows: label, value, trend indicator (up/down/neutral)
- Critical metrics use semantic colors (red for danger, amber for warning, green for healthy)
- KPI row is always above the fold — never below a chart or table

### Table Pattern

All data tables follow:
- Row hover state: `rgba(255,255,255,0.03)` background
- Selected row: `rgba(accent, 0.10)` background with accent-colored left border
- Empty state: Icon + headline + action (never just "No data")
- Loading state: Skeleton rows matching the expected column layout
- Sorting: Indicated by chevron in column header, ascending by default

### Card Pattern

Information cards use:
- Background: `colors.surface` (not `colors.background`)
- Border: `colors.border`
- Hover (if interactive): `colors.borderStrong` border + slight background lift
- Header: Label in `colors.muted`, value in `colors.foreground`
- Status dot: Semantic color, top-right corner of card

### Modal / Sheet Pattern

Modals for **destructive actions** — use `Dialog` with explicit Cancel + Confirm buttons.
- Confirm button: Uses `colors.danger` (red) for destructive, `colors.primary` for constructive
- Always require explicit confirmation — no auto-close on outside click for destructive dialogs

Modals for **detail views / context** — use `Sheet` (sliding panel from right).
- Sheet width: `max-w-xl` (context) or `max-w-3xl` (full workflow)
- Sheets can be closed by clicking outside

---

## Empty State Specifications

### Standard Empty State

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center gap-4">
  <IconComponent className="w-10 h-10 opacity-20" style={{ color: accentColor }} />
  <div>
    <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
      {headline}
    </p>
    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
      {guidanceText}
    </p>
  </div>
  {actionLabel && <Button variant="outline" size="sm" onClick={onAction}>{actionLabel}</Button>}
</div>
```

### Domain-Specific Empty State Guidelines

Two-branch pattern: distinguish **all-clear** (entire data source is empty — operator should feel reassured) from **filter-empty** (data exists but current filters exclude everything — offer a reset action).

- **All-clear:** green accent `#10b981`, `CheckCircle` / `CheckCircle2` icon, no action button. Reassuring copy ("the queue is clear", "no exposure").
- **Filter-empty:** pack accent (Aegis violet `#8b7ac8`, Vessels sky `#38bdf8`, Terra copper `#c87941`), `Filter` icon, and a `Reset filters` / `Show all` action that clears the state hooks driving the filter.

| Surface | All-clear headline | Filter-empty headline | Reset action |
|---------|---------------------|------------------------|--------------|
| Aegis alerts | "No active alerts" | "No alerts match these filters" | Reset severity/status |
| Aegis cases | "All cases triaged" | "No cases match these filters" | Reset filters |
| Aegis investigations (timeline/entities/signals/evidence) | "No timeline activity yet" / "No entities linked yet" / "No correlated signals" / "No evidence collected yet" | — | — (live case data only) |
| Aegis watchlists | "No watchlists configured" | "No watchlists match this type" | Show all types |
| Aegis hunt agents | "No hunts in flight" | — | — |
| Aegis threat desk | "No active threat twins" | — | — |
| Vessels fleet | "No vessels matching filters" | "Adjust date range or vessel class filters" | Reset filters |
| Vessels exception queue | "Fleet is exception-free" | "No {filter} exceptions" | Show all |
| Vessels voyage P&L | "No voyages awaiting modeling" | — | — |
| Vessels demurrage | "No demurrage exposure" | — | — |
| Vessels charter party | "No charter fixtures on the books" | "No fixtures match these filters" | Reset filters |
| Terra distress | "No distressed properties in pipeline" | "The pipeline is clear" | Reset filters |
| Terra offers | "No live offers" | "No offers match these filters" | Reset filters |
| Terra transactions | "No transactions in flight" | — | — |
| Terra inquiries | "No inquiries waiting" | "No {status} inquiries" | Show all inquiries |
| Terra listings | "No active listings" | "No listings match these filters" | Reset filters |
| Command action queue | "Action queue is clear" | — | — |
| Carlota Jo inquiries | "No active inquiries" | — | — |

---

## Loading State Specifications

### Page-Level Loading (`PageLoader`)

Used as Suspense fallback and initial page load:

```tsx
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div
        className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{ borderColor: `${accentColor}30`, borderTopColor: accentColor }}
      />
    </div>
  );
}
```

### Skeleton Loading (Tables and Lists)

Used for data tables and lists after initial page mount when refetching:

```tsx
{[...Array(5)].map((_, i) => (
  <div key={i} className="h-10 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
))}
```

Skeleton rows should match the column count of the expected table.

### Inline Loading (Buttons and Actions)

Used when a user-triggered action is in-flight:

```tsx
<Button disabled>
  <div className="w-4 h-4 border-2 rounded-full animate-spin mr-2"
    style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
  {loadingLabel}
</Button>
```

---

## Error State Specifications

### Page-Level Error

```tsx
function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <AlertTriangle className="w-8 h-8 text-amber-400/60" />
      <div className="text-center">
        <p className="text-sm font-medium text-white/60">Something went wrong</p>
        <p className="text-xs text-white/30 mt-1 max-w-sm">{error.message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
```

### API Error Toast

Use `Sonner` toast for non-blocking errors:

```tsx
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

// Error
toast.error("Could not load vessel data", { description: "Check your connection and try again." });

// Success
toast.success("Decision approved", { description: "Proof Chain entry recorded." });

// Warning
toast.warning("Stale data", { description: "Last updated 5 minutes ago. Refreshing..." });
```

---

## Iconography

All icons use `lucide-react`. Icon sizes follow this scale:
- `w-3 h-3` (`12px`) — Micro indicators, nav badge icons
- `w-4 h-4` (`16px`) — Sidebar nav icons (primary usage)
- `w-5 h-5` (`20px`) — Card action icons, button icons
- `w-6 h-6` (`24px`) — Section header icons, empty state
- `w-8 h-8` (`32px`) — Page-level empty state, error state
- `w-10 h-10` (`40px`) — Hero / marketing icons

**Do not use:** FontAwesome, Material Icons, or custom SVG icons inline. All domain-specific custom icons should be added to `lib/shared-ui/src/icons.tsx`.

---

## Typography Scale

| Use | Class | Size | Weight |
|-----|-------|------|--------|
| Page title | `text-2xl font-semibold` | 24px | 600 |
| Section header | `text-lg font-medium` | 18px | 500 |
| Card title | `text-sm font-semibold` | 14px | 600 |
| Body / default | `text-sm` | 14px | 400 |
| Caption / label | `text-xs` | 12px | 400 |
| Micro label / badge | `text-[10px] font-mono uppercase tracking-wider` | 10px | 500 |
| KPI value (large) | `text-3xl font-bold tabular-nums` | 30px | 700 |
| KPI value (medium) | `text-xl font-semibold tabular-nums` | 20px | 600 |

Monospace font (`Geist Mono`) is used for:
- Route strings, IDs, hashes
- Timestamps in audit trails
- Metric values in dense data tables
- Badge labels and status indicators

---

## Sidebar Sections Reference

### Standard Sidebar Structure

```
[App Name Badge]
  [Primary Section - No heading]
    Dashboard / Overview
    [Top 4-6 operator actions]
  ---
  [Section 2 heading]
    ...items
  ---
  [Section N heading]
    ...items
  ---
  [System - Always last]
    Settings
```

### Section Naming Conventions

| Section Purpose | Canonical Heading |
|-----------------|-----------------|
| Primary overview | *(no heading)* |
| Real-time signals and alerts | `Intelligence` or `Signals` |
| Risk and compliance | `Risk & Compliance` |
| Commercial / financial | `Commercial` |
| Governance and audit | `Governance` |
| Crisis and incident response | `Crisis Response` |
| Analytics and reporting | `Analytics` |
| Admin tools | `Administration` |
| Settings | *(no heading — just the Settings item)* |

---

## Accessibility Requirements

- All interactive elements must have `aria-label` when the visible label is insufficient
- Color alone must not convey meaning — use icons, labels, or patterns alongside color
- Focus rings must be visible on all interactive elements (do not suppress `:focus-visible`)
- All status badges must have screen-reader text matching their visible label
- Keyboard navigation must work for: sidebar, command palette, modals, and data tables

---

## Anti-Patterns (Do Not Implement)

| Anti-pattern | Impact | Correct approach |
|-------------|--------|-----------------|
| Inline `style` for colors not in token system | Breaks dark mode resilience | Use CSS tokens or Tailwind classes |
| `alert()` or `confirm()` for user confirmation | Breaks UX and accessibility | Use `Dialog` component |
| Hardcoded `z-index` values | Creates stacking conflicts | Use z-index scale from tokens |
| `setTimeout` for UI state | Creates race conditions | Use React state and transitions |
| Loading spinners on every micro-interaction | Creates visual noise | Use optimistic UI; only spin on slow ops (>500ms) |
| Empty navigation items (no route) | Creates dead ends and broken trust | Remove or add `disabled` + tooltip |
| Generic "Error" page with no recovery action | Strands operators | Always provide retry or navigation option |

---

## Related Documents

| Document | Path |
|----------|------|
| Brand guidelines | [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) |
| Navigation strategy | [NAVIGATION_STRATEGY.md](NAVIGATION_STRATEGY.md) |
| Route inventory | [ROUTE_INVENTORY.md](ROUTE_INVENTORY.md) |
| Platform primitives | [PLATFORM_PRIMITIVES.md](PLATFORM_PRIMITIVES.md) |
| Product surface map | [PRODUCT_SURFACE_MAP.md](PRODUCT_SURFACE_MAP.md) |
