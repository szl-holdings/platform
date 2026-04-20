# AEEP Design System Component Inventory

_Generated from `packages/design-system/src/` — Phase 3 output_

---

## Shell Components (`src/shell/`)

| Component | Description | Key Props |
|---|---|---|
| `AppShell` | Root application shell with SideNav, TopBar, content area, optional right inspector | `navItems`, `tenantLabel`, `defaultCollapsed`, `rightInspector` |
| `SideNav` | Left navigation with sections and items | `sections`, `activeItemId`, `collapsed` |
| `TopBar` | Application top bar with breadcrumbs and action slots | `breadcrumbs`, `tenantLabel`, `left/center/right` |
| `PageHeader` | Page-level header with title, meta, and actions | `title`, `subtitle`, `meta`, `actions`, `badge` |
| `SectionPanel` | Bordered section container | `title`, `subtitle`, `actions`, `noPadding` |
| `GlobalCommandPalette` | ⌘K command palette | `open`, `onClose`, `items` |
| `TenantIndicator` | Tenant + environment badge | `tenantName`, `environment` |

**Nav Structure (AEEP standard):**
Overview | Operations | Search | Workflows | Evidence | Memory | Reports | Admin

---

## Layout Components (`src/layout/`)

| Component | Description |
|---|---|
| `SplitPane` | Horizontal split pane (search/investigation screens) |
| `SideInspector` | Right inspector panel for record detail |
| `InspectorTabs` | Tabbed navigation inside inspector |

**Standard tab set:** Summary | Activity | Evidence | Governance | Artifacts

---

## Data Components (`src/data/`)

| Component | Description |
|---|---|
| `MetricStat` | KPI/metric block with delta and trend |
| `MetricStatGrid` | Auto-fill grid wrapper for MetricStat |
| `StatusBadge` | Semantic status indicator (10 variants) |
| `FilterBar` | Horizontal filter tabs + search + action slots |
| `DataGrid` | High-density grid with density-aware row heights |
| `TableToolbar` | Toolbar for DataGrid (count, export, refresh) |

---

## Detail Components (`src/detail/`)

| Component | Description |
|---|---|
| `DetailDrawer` | Slide-in side drawer for record detail with optional tabs |

---

## Timeline Components (`src/timeline/`)

| Component | Description |
|---|---|
| `Timeline` | Workflow run / event timeline with status indicators |
| `ActivityFeed` | Chronological activity log |
| `AuditTrailList` | Immutable audit event list with policy and trace context |

---

## Evidence Components (`src/evidence/`)

| Component | Description |
|---|---|
| `EvidencePanel` | Evidence-first transparency panel (traceId, sources, policy, approval) |

---

## Form Components (`src/form/`)

| Component | Description |
|---|---|
| `SearchInput` | Search field with clear button |
| `FormField` | Labeled form field wrapper with error and hint |
| `Select` | Enterprise-styled select control |
| `SegmentedControl` | Mutually exclusive option selector |
| `Stepper` | Multi-step workflow progress indicator |

---

## Feedback Components (`src/feedback/`)

| Component | Description |
|---|---|
| `EmptyState` | Standard empty state with icon and action |
| `ErrorState` | Error display with traceId and retry |
| `LoadingState` | Loading indicator (inline or centered) |

---

## Providers & Hooks (`src/providers/`, `src/hooks/`)

| Export | Description |
|---|---|
| `DesignSystemProvider` | Root provider for density and screen mode |
| `useDesignSystem()` | Access full design system context |
| `useDensity()` | Current density config values + setter |
| `useScreenMode()` | Current screen mode (executive/operator) + setter |

---

## Tokens (`src/tokens/`)

| Export | Description |
|---|---|
| `color` | Full color palette (bg, border, text, accent, state, confidence, freshness) |
| `productAccent` | Per-product accent colors |
| `typography` | Font families, scale, weight, leading |
| `spacing` | 4px-base spacing scale |
| `radius` | Border radius tokens |
| `elevation` | Box shadow tokens |
| `motion` | Duration and easing tokens |
| `densityConfig` | comfortable / compact / dense config |
| `chartPalette` | Executive-quiet chart color series |
| `semanticColors` | success / warning / error / info / neutral semantic tokens |
| `injectTokens()` | CSS custom property injection helper |
