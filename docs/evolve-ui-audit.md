# AEEP UI Audit — Phase 1

**Version:** 1.0 | **Date:** April 2026 | **Scope:** Visual stack, design language, component inventory, UX anti-patterns

---

## 1. Visual Stack Inventory

### Styling Technologies

| Technology | Usage | AEEP Verdict |
|-----------|-------|-------------|
| Tailwind CSS v4 | Primary utility framework across all artifacts | Keep; enforce token-only usage |
| CSS-in-JS (none) | Not used | N/A |
| Framer Motion 12 | Animations in multiple surfaces | Reduce to utility transitions only; remove decorative motion |
| Recharts 2.15 | Chart library across all artifacts | Keep; restrict to executive-quiet palette |
| Lucide React 0.545 | Icon library | Keep |
| clsx + tailwind-merge | Class utilities | Keep |
| class-variance-authority | Component variant system | Keep |

### Design Token Status

The `packages/design-system/src/tokens/index.ts` (165 lines) defines:

**Color tokens present:**
- `bg`: base `#060b12`, surface `#0d1520`, overlay `#111c2a`, raised `#162030`
- `border`: subtle `#1a2535`, default `#243040`, strong `#304055`
- `text`: primary `#c8d8e8`, secondary `#7a99b8`, muted `#4a6070`, inverse `#060b12`
- `accent`: cyan `#00d4ff`, green `#00e878`, amber `#ffb700`, red `#ff4455`

**Missing from token system:**
- Spacing scale (8px base, comfortable/compact/dense modes)
- Typography scale (font families, sizes, weights, line heights)
- Elevation / shadow tokens
- Border radius tokens
- Motion / transition tokens
- Chart palette tokens (executive-quiet line/bar/stacked/heatmap/timeline)
- Semantic state tokens (success/warning/error/info)
- Density mode tokens (comfortable = default, compact, dense)

### Current Component Inventory

**`packages/design-system/src/tokens/`**
- Color tokens (partial — as above)
- No spacing, typography, radius, elevation, motion, or chart tokens

**`packages/design-system/src/proof/`**
- `EvidenceBadge` — badge showing evidence presence
- `FreshnessChip` — data freshness indicator
- `ConfidenceMeter` — AI confidence visualization
- `PolicyStateChip` — policy verdict chip
- `AutonomyModeToggle` — autonomy level switcher
- `ProofEnvelope` — wrapper showing full proof context

**`packages/design-system/src/cockpit/`**
- `ApprovalDialog` — approval/rejection modal
- `AuditRail` — scrollable audit event list
- `DenseTable` — high-density data table
- `EvidenceDrawer` — evidence side drawer
- `GraphCanvas` — entity graph visualization
- `NarrativePanel` — AI narrative text surface
- `RecommendationCard` — AI recommendation card
- `RunTimeline` — workflow run timeline
- `TimelineLane` — multi-lane timeline
- `MapSurface` — geographic map surface

**`packages/ui-command/src/` (DEPRECATED)**
- `ActionControlPanel` — deprecated
- `CausalTimeline` — deprecated
- `EntityGraph` — deprecated
- `ExecutiveSummary` — deprecated
- `KPIBlock` — deprecated
- `RecommendationQueue` — deprecated
- `RiskHeatmap` — deprecated
- `ValueLedger` — deprecated

**`lib/shared-ui/`** — Cross-app component library including:
- `DashboardShell` — collapsible sidebar chrome
- `EcosystemNav` — cross-surface navigation bar
- `CommandPalette` — ⌘K keyboard search (wired to 13 surfaces)
- `SentientLayer` — ⌘J AI intelligence rail (Now/Next/Links tabs)
- `AgentRunCard` — compact trace card
- `IncidentCommander` — full incident shell
- `ScenarioBranchesPanel` — Monte Carlo branch comparison

---

## 2. Missing AEEP Component Set

The following components are required by the AEEP brief and do not yet exist in `packages/design-system`:

### Shell Components
| Component | Status |
|-----------|--------|
| `AppShell` | Missing (DashboardShell in lib/shared-ui) |
| `SideNav` | Missing (EcosystemNav partial in lib/shared-ui) |
| `TopBar` | Missing |
| `CommandBar` | Missing (CommandPalette exists) |
| `PageHeader` | Missing |
| `SectionPanel` | Missing |

### Data Display
| Component | Status |
|-----------|--------|
| `MetricStat` | Missing (KPIBlock deprecated) |
| `StatusBadge` | Missing |
| `FilterBar` | Missing |
| `DataGrid` | Missing (DenseTable partial) |
| `TableToolbar` | Missing |
| `DetailDrawer` | Missing (EvidenceDrawer partial) |

### Layout
| Component | Status |
|-----------|--------|
| `SideInspector` | Missing |
| `SplitPane` | Missing |
| `InspectorTabs` | Missing |

### Timeline / Activity
| Component | Status |
|-----------|--------|
| `Timeline` | Missing (RunTimeline partial) |
| `ActivityFeed` | Missing |
| `EvidencePanel` | Missing |

### Dialog / State
| Component | Status |
|-----------|--------|
| `ApprovalDialog` | **Present** |
| `EmptyState` | Missing |
| `ErrorState` | Missing |
| `LoadingState` | Missing |

### Form
| Component | Status |
|-----------|--------|
| `SearchInput` | Missing |
| `GlobalCommandPalette` | Missing (lib/shared-ui partial) |
| `FormField` | Missing |
| `Select` | Missing |
| `SegmentedControl` | Missing |
| `Stepper` | Missing |
| `AuditTrailList` | Missing (AuditRail partial) |

---

## 3. Visual Anti-Patterns Inventory

### Anti-patterns requiring remediation

| Anti-pattern | Evidence | Severity |
|-------------|----------|----------|
| Neon / glow accents | `accent.cyan: #00d4ff`, `accent.green: #00e878` used as primary UI accents in multiple surfaces | High |
| Hard-coded hex colors outside token files | Scattered inline `className="text-[#00d4ff]"` and similar in artifact components | High |
| Decorative Framer Motion | Entry animations on data tables, floating hero sections, particle effects in marketing surfaces | Medium |
| Oversized display text in product UX | Hero-style font sizes (text-7xl, text-8xl) in authenticated dashboards | Medium |
| Oversaturated chart palettes | Multiple pie charts with high-chroma multi-color fills | Medium |
| Inline box-shadow overrides | `style={{ boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' }}` patterns in multiple surfaces | Medium |
| Mixed icon libraries | Lucide + custom SVGs + emoji mixed without system | Low |
| Inconsistent border-radius | Tailwind rounded-xl mixed with rounded-sm without token basis | Low |

### Surfaces with highest anti-pattern density

1. `artifacts/lyte-command-center` — dark amber design language; neon amber accents
2. `artifacts/sentra` — cyber-blue glow aesthetics
3. `artifacts/pulse` — marketing-grade hero text in authenticated views
4. `artifacts/command` — particle motion effects
5. `artifacts/szl-holdings` — oversaturated investor deck palette

---

## 4. Screen Mode Gap Analysis

### Executive Mode (required by AEEP)
**Target:** Top risks, trends, approvals needed, exceptions, clean summaries. High signal-to-noise ratio. No tables by default.

**Current state:** No platform-wide Executive Mode contract exists. `pulse` artifact approximates an executive briefing but does not share primitives with other surfaces. `lib/shared-ui`'s `SentientLayer` provides an AI rail but is not wired to an explicit executive mode toggle.

### Operator Mode (required by AEEP)
**Target:** High-density, filter/table-first, drawers, trace + evidence + workflow event visibility.

**Current state:** `artifacts/lyte-command-center` and `artifacts/command` operate in a de-facto operator mode but lack a unified density contract. No `compact` or `dense` spacing modes exist in the token system.

---

## 5. Navigation Architecture Audit

### Current nav structure (varies by artifact)
- No single primary nav contract exists across all surfaces
- `EcosystemNav` in lib/shared-ui provides cross-surface navigation but is not evidence-first
- Navigation items vary per surface with no AEEP primary nav structure

### AEEP target primary nav
Required nav items: Overview | Operations | Search | Workflows | Evidence | Memory | Reports | Admin

**Gap:** None of the current surfaces implement this nav structure. Migration required for all 13 authenticated surfaces.

---

## 6. Traceability UX Audit

### Current traceability surface coverage

| Artifact | Has traceId display | Has source citations | Has policy check visibility | Has tool call visibility |
|----------|--------------------|--------------------|----------------------------|--------------------------|
| `lyte-command-center` | Partial (agent trace logs screen) | Partial (evidence explorer) | Partial (policy center) | Partial (trace logs) |
| `command` | Partial (substrate console) | No | No | No |
| `vessels` | No | No | No | No |
| `terra` | No | No | No | No |
| `sentra` | Partial | No | No | No |
| `pulse` | No | No | No | No |
| All others | No | No | No | No |

**AEEP target:** All material screens surface traceability — why result appeared, source backing, policy checks, tools used, approval status, traceId.

---

## 7. Typography Audit

Current artifacts use a mix of:
- `font-sans` (Tailwind default, falls back to system sans)
- Inline `font-family` overrides in some components
- No premium enterprise sans stack defined in the design system

**AEEP target:** Premium enterprise sans stack defined as tokens. No raw `font-family` values outside token files.

---

## 8. Keep / Refactor / Replace / Remove Matrix — UI Layer

| Item | Decision | Reason |
|------|----------|--------|
| `packages/design-system` tokens (bg/border/text/accent) | Refactor | Expand to full token set; remove neon accents |
| `packages/design-system` proof components | Keep | Already enterprise-quality |
| `packages/design-system` cockpit components | Keep + extend | Good foundation; need density modes |
| `packages/ui-command` | Remove (phase out) | Already deprecated; migration docs exist |
| `lib/shared-ui` DashboardShell/EcosystemNav/CommandPalette | Refactor into design-system shell | Consolidate shell into single package |
| Neon accent colors | Replace | Replace with disciplined cool-neutral accent family |
| Decorative Framer Motion | Remove | Replace with utility transitions ≤200ms |
| Hard-coded hex | Replace | Enforce token-only; lint rule to block |
| Oversized display text in auth UX | Replace | Cap at text-2xl in authenticated product |
| Chart palette | Replace | Executive-quiet line/bar/stacked/heatmap preferred |
