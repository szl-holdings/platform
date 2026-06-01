# AEEP Design System

**Version:** 1.0 | **Date:** April 2026 | **Status:** Canonical  
**Source of truth:** `packages/design-system/src/tokens/`

---

## Overview

The AEEP Design System is a dark-first, enterprise-grade visual language for all authenticated product surfaces in the platform. It is built for command-grade clarity: high information density, restrained motion, disciplined color, and evidence-first layout.

All design tokens are defined as TypeScript constants in `packages/design-system/src/tokens/` and injected as CSS custom properties at the application root via `injectTokens()`. No raw hex values, font stacks, or spacing values belong outside token files.

---

## 1. Color Tokens

**Token file:** `packages/design-system/src/tokens/index.ts`

### 1.1 Background Scale

| Token | CSS Variable | Value | Use |
|---|---|---|---|
| `color.bg.base` | `--gi-bg-base` | `#060b12` | Page background — darkest surface |
| `color.bg.surface` | `--gi-bg-surface` | `#0d1520` | Card and panel background |
| `color.bg.overlay` | `--gi-bg-overlay` | `#111c2a` | Inline overlays, input backgrounds |
| `color.bg.raised` | `--gi-bg-raised` | `#162030` | Raised elements, popovers |
| `color.bg.hover` | `--gi-bg-hover` | `#1a2a3a` | Interactive hover state |
| `color.bg.active` | `--gi-bg-active` | `#1e3248` | Active/pressed state |

**Rule:** No surface background in authenticated product UX may be lighter than `color.bg.raised`.

### 1.2 Border Scale

| Token | CSS Variable | Value | Use |
|---|---|---|---|
| `color.border.subtle` | `--gi-border-subtle` | `#1a2535` | Dividers, table rows, low-emphasis separators |
| `color.border.default` | `--gi-border-default` | `#243040` | Card borders, input outlines |
| `color.border.strong` | `--gi-border-strong` | `#304055` | Emphasis borders, active panels |
| `color.border.focus` | `--gi-border-focus` | `#4d8fcc` | Keyboard focus ring — 2px solid |

### 1.3 Text Scale

| Token | CSS Variable | Value | Use |
|---|---|---|---|
| `color.text.primary` | `--gi-text-primary` | `#c8d8e8` | Body copy, headings |
| `color.text.secondary` | `--gi-text-secondary` | `#7a99b8` | Supporting labels, metadata |
| `color.text.muted` | `--gi-text-muted` | `#4a6070` | De-emphasized content, placeholders |
| `color.text.inverse` | `--gi-text-inverse` | `#060b12` | Text on light/accent backgrounds |
| `color.text.link` | `--gi-text-link` | `#4d8fcc` | Hyperlinks, interactive text |
| `color.text.placeholder` | `--gi-text-placeholder` | `#3a5060` | Input placeholder text |

### 1.4 Enterprise Accent Family

The AEEP accent palette is disciplined and enterprise-quiet. Neon values (`accent.neon.*`) are **deprecated for product UX** and remain only for backward-compatibility. Never use neon accents in authenticated product screens.

| Token | CSS Variable | Value | Use |
|---|---|---|---|
| `color.accent.blue` | `--gi-accent-blue` | `#4d8fcc` | Primary interactive, links, focus rings, Command/Vessels |
| `color.accent.teal` | `--gi-accent-teal` | `#3ea89a` | Holdings/operational accent |
| `color.accent.green` | `--gi-accent-green` | `#5baa8a` | Success, allowed, high confidence, Terra |
| `color.accent.amber` | `--gi-accent-amber` | `#c9a85c` | Warning, pending, aging, Pulse/Lyte |
| `color.accent.red` | `--gi-accent-red` | `#c96070` | Error, blocked, low confidence, Sentra |
| `color.accent.violet` | `--gi-accent-violet` | `#9b7cc8` | Governance, legal, contradiction, Counsel/Aegis |
| `color.accent.slate` | `--gi-accent-slate` | `#7a99b8` | Neutral interactions, secondary actions |

### 1.5 Domain Accent Map

Each domain pack uses a single accent pulled from the enterprise palette. Mixed or custom per-surface accents are not permitted.

| Domain | Accent Token | Value |
|---|---|---|
| Command | `color.accent.blue` | `#4d8fcc` |
| Holdings | `color.accent.teal` | `#3ea89a` |
| Sentra | `color.accent.red` | `#c96070` |
| Counsel | `color.accent.violet` | `#9b7cc8` |
| Aegis | `color.accent.violet` | `#9b7cc8` |
| Vessels | `color.accent.blue` | `#4d8fcc` |
| Terra | `color.accent.green` | `#5baa8a` |
| Pulse | `color.accent.amber` | `#c9a85c` |
| Lyte | `color.accent.amber` | `#c9a85c` |
| Carlota Jo | `color.accent.violet` | `#9b7cc8` |

**Token file:** `packages/design-system/src/tokens/domain-accents.ts`

### 1.6 Semantic State Colors

**Token file:** `packages/design-system/src/tokens/semantic.ts`

#### Status

| Variant | Background | Border | Text/Icon |
|---|---|---|---|
| `success` | `#0d2a1a` | `#1a4a2a` | `#5baa8a` |
| `warning` | `#2a2010` | `#4a3810` | `#c9a85c` |
| `error` | `#2a0d12` | `#4a1a22` | `#c96070` |
| `info` | `#0d1a2a` | `#1a304a` | `#4d8fcc` |
| `neutral` | `#111c2a` | `#243040` | `#7a99b8` |

#### Severity

| Level | Color |
|---|---|
| `critical` | `#c96070` |
| `high` | `#c9a05c` |
| `medium` | `#c9a85c` |
| `low` | `#7a99b8` |
| `info` | `#4d8fcc` |

#### Approval

| State | Color |
|---|---|
| `pending` | `#c9a85c` |
| `approved` | `#5baa8a` |
| `rejected` | `#c96070` |
| `escalated` | `#9b7cc8` |

#### Evidence Strength

| Level | Color |
|---|---|
| `strong` | `#5baa8a` |
| `moderate` | `#c9a85c` |
| `weak` | `#c96070` |
| `unverified` | `#4a6070` |

---

## 2. Typography Tokens

**Token file:** `packages/design-system/src/tokens/typography.ts`

### 2.1 Font Families

| Token | Stack | Use |
|---|---|---|
| `fontFamily.sans` | Inter → ui-sans-serif → system-ui → -apple-system → BlinkMacSystemFont → "Segoe UI" → Roboto → "Helvetica Neue" → Arial → sans-serif | All product UI text |
| `fontFamily.mono` | "JetBrains Mono" → "Fira Code" → "Cascadia Code" → ui-monospace → SFMono-Regular → Menlo → Monaco → Consolas → "Courier New" → monospace | Trace IDs, JSON, code, metrics |

No decorative fonts. No system fallback alone (always lead with Inter or JetBrains Mono).

### 2.2 Font Size Scale

| Token | Size | Line Height | Letter Spacing | Use |
|---|---|---|---|---|
| `fontSize.2xs` | 10px | 14px | +0.04em | Micro labels, debug text |
| `fontSize.xs` | 11px | 16px | +0.02em | Captions, timestamps |
| `fontSize.sm` | 12px | 18px | +0.01em | Secondary body, table cells |
| `fontSize.base` | 13px | 20px | 0 | Primary body text |
| `fontSize.md` | 14px | 22px | 0 | Section labels, form fields |
| `fontSize.lg` | 16px | 24px | -0.01em | Card headings |
| `fontSize.xl` | 18px | 28px | -0.01em | Page sub-headings |
| `fontSize.2xl` | 20px | 30px | -0.02em | Page titles — maximum in authenticated UX |
| `fontSize.3xl` | 24px | 34px | -0.02em | Metric displays only |

**Rule:** The maximum heading size in authenticated product UX is `fontSize.2xl` (20px). Display sizes above this (`text-3xl`, `text-4xl`, `text-5xl`, etc.) are marketing-only and must not appear in authenticated dashboards, drawers, or admin surfaces.

### 2.3 Font Weights

| Token | Value | Use |
|---|---|---|
| `fontWeight.normal` | 400 | Body copy |
| `fontWeight.medium` | 500 | Labels, captions |
| `fontWeight.semibold` | 600 | Headings, metric values |
| `fontWeight.bold` | 700 | Emphasis — sparingly |

No weight below 400 (no `font-thin`, `font-light`). Bold (700) is reserved for exceptional emphasis only.

### 2.4 Text Style Presets

Use these named presets via the design system rather than composing font size + weight + line-height separately:

| Preset | Font Size | Weight | Line Height |
|---|---|---|---|
| `page-title` | 20px | 600 | 30px |
| `section-title` | 14px | 600 | 22px |
| `card-title` | 13px | 600 | 20px |
| `body` | 13px | 400 | 20px |
| `body-sm` | 12px | 400 | 18px |
| `label` | 11px | 500 | 16px |
| `caption` | 11px | 400 | 16px |
| `metric` | 24px | 600 | 34px |
| `metric-sm` | 18px | 600 | 28px |
| `code` | 12px mono | — | 18px |
| `mono-sm` | 11px mono | — | 16px |

---

## 3. Spacing Tokens

**Token file:** `packages/design-system/src/tokens/spacing.ts`

Base unit is **8px**. All spatial values are multiples of this unit.

| Token | Value | Common Use |
|---|---|---|
| `spacing.0` | 0px | — |
| `spacing.0.5` | 4px | Icon padding, micro gaps |
| `spacing.1` | 8px | Element gaps, tight padding |
| `spacing.1.5` | 12px | Compact padding |
| `spacing.2` | 16px | Standard padding |
| `spacing.2.5` | 20px | Card padding (comfortable) |
| `spacing.3` | 24px | Section gaps |
| `spacing.4` | 32px | Page padding (comfortable) |
| `spacing.5` | 40px | Large section separators |
| `spacing.6` | 48px | Major layout gaps |
| `spacing.7` | 56px | Row heights (comfortable) |
| `spacing.8` | 64px | Hero spacing |
| `spacing.10` | 80px | — |
| `spacing.12` | 96px | — |

### 3.1 Density Modes

Three density modes govern the entire shell and all components. Use the `useDensity()` hook — never hardcode spacing values in components.

| Property | `comfortable` (default) | `compact` | `dense` |
|---|---|---|---|
| Page padding | 32px | 24px | 16px |
| Section gap | 24px | 16px | 12px |
| Card padding | 20px | 14px | 10px |
| Row height | 56px | 40px | 32px |
| Input height | 40px | 32px | 28px |
| Icon size | 20px | 16px | 14px |
| Label font size | 13px | 12px | 11px |

`comfortable` is the default — executive-grade whitespace. `compact` is operator mode. `dense` is for maximum data density (audit logs, bulk tables).

---

## 4. Border Radius Tokens

**Token file:** `packages/design-system/src/tokens/radius.ts`

Enterprise preference: sharp to moderate corners. No pill-radius elements in data-dense contexts.

| Token | Value | Use |
|---|---|---|
| `radius.none` | 0px | Tables, full-bleed elements |
| `radius.sm` | 3px | Badges, chips, tags |
| `radius.base` | 4px | Buttons, inputs (default) |
| `radius.md` | 6px | Cards, panels |
| `radius.lg` | 8px | Drawers, modals |
| `radius.xl` | 10px | Overlay containers |
| `radius.2xl` | 12px | Large surfaces |
| `radius.full` | 9999px | Avatars, status dots only |

**Rule:** Mixed usage of Tailwind `rounded-xl` alongside `rounded-sm` without token basis is an anti-pattern. All border-radius values must trace to a radius token.

---

## 5. Elevation Tokens

**Token file:** `packages/design-system/src/tokens/elevation.ts`

Elevation is rendered as opacity-based drop shadows on dark surfaces. No glow, bloom, or neon box-shadow effects in product UX.

| Token | Shadow | Use |
|---|---|---|
| `elevation.none` | none | Flat elements, table rows |
| `elevation.card` | 0 1px 3px rgba(0,0,0,0.30), 0 1px 2px rgba(0,0,0,0.24) | Cards, stat blocks |
| `elevation.panel` | 0 2px 8px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.28) | Panels, sections |
| `elevation.overlay` | 0 4px 16px rgba(0,0,0,0.40), 0 2px 8px rgba(0,0,0,0.32) | Dropdowns, popovers |
| `elevation.modal` | 0 8px 32px rgba(0,0,0,0.50), 0 4px 16px rgba(0,0,0,0.40) | Modals, dialogs |
| `elevation.drawer` | 0 12px 48px rgba(0,0,0,0.55), 0 6px 24px rgba(0,0,0,0.44) | Side drawers, sheets |

**Anti-pattern:** `style={{ boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' }}` — glow shadows are forbidden in product UX.

---

## 6. Motion Tokens

**Token file:** `packages/design-system/src/tokens/motion.ts`

Minimal motion. All transitions must use these tokens. No decorative animations in product UX.

### 6.1 Duration

| Token | Value | Use |
|---|---|---|
| `motion.duration.instant` | 0ms | Immediate state changes |
| `motion.duration.fast` | 100ms | Color/opacity micro-transitions |
| `motion.duration.base` | 150ms | Default transitions |
| `motion.duration.slow` | 200ms | Drawer/panel open/close — **maximum** |

**Rule:** No transition in product UX exceeds 200ms. No bounce, spring, or particle effects.

### 6.2 Easing

| Token | Curve | Use |
|---|---|---|
| `motion.easing.standard` | cubic-bezier(0.2, 0, 0, 1) | Default interactions |
| `motion.easing.decelerate` | cubic-bezier(0, 0, 0.2, 1) | Elements entering the screen |
| `motion.easing.accelerate` | cubic-bezier(0.4, 0, 1, 1) | Elements leaving the screen |
| `motion.easing.sharp` | cubic-bezier(0.4, 0, 0.6, 1) | Quick precise movements |

### 6.3 Standard Transition Strings

Pre-composed transition values for common use cases:

| Constant | Value |
|---|---|
| `transition.fade` | `opacity 150ms cubic-bezier(0.2, 0, 0, 1)` |
| `transition.slideIn` | `transform 200ms decelerate, opacity 150ms standard` |
| `transition.expand` | `height 200ms standard` |
| `transition.color` | `color 100ms, background-color 100ms, border-color 100ms` |

**Rule:** All Framer Motion usage must be limited to utility transitions drawn from these tokens. Decorative entry animations on data tables, hero sections, and particle systems must be removed from authenticated product surfaces.

**Accessibility:** All motion must respect `prefers-reduced-motion`. When this media query is active, transitions should collapse to instant.

---

## 7. Chart Tokens

**Token file:** `packages/design-system/src/tokens/chart.ts`

Executive-quiet chart palette. Muted, distinguishable series on dark backgrounds.

### 7.1 Series Colors

| Position | Token | Value |
|---|---|---|
| 1st series | `chartColor.primary` | `#4d8fcc` |
| 2nd series | `chartColor.secondary` | `#5baa8a` |
| 3rd series | `chartColor.tertiary` | `#c9a85c` |
| 4th series | `chartColor.quaternary` | `#9b7cc8` |
| 5th series | `chartColor.quinary` | `#c97a64` |
| 6th series | `chartColor.senary` | `#6bb5c2` |

### 7.2 Semantic Chart Colors

| Token | Value | Use |
|---|---|---|
| `chartColor.positive` | `#5baa8a` | Upward trends, gains |
| `chartColor.negative` | `#c96070` | Downward trends, losses |
| `chartColor.neutral` | `#7a99b8` | Baseline, comparison lines |
| `chartColor.warning` | `#c9a85c` | Threshold breaches, caution zones |

### 7.3 Chrome Colors

| Token | Value | Use |
|---|---|---|
| `chartColor.gridLine` | `#1a2535` | Grid lines |
| `chartColor.axisLabel` | `#4a6070` | Axis labels |
| `chartColor.tickLine` | `#243040` | Tick marks |
| `chartColor.tooltip.bg` | `#0d1520` | Tooltip background |
| `chartColor.tooltip.border` | `#243040` | Tooltip border |
| `chartColor.tooltip.text` | `#c8d8e8` | Tooltip text |

**Preferred chart types:** line, bar, stacked bar, heatmap, timeline.  
**Avoid:** high-chroma pie/donut charts with many segments, neon fills, heavy gradient area charts.

---

## 8. Component Library

### 8.1 Package Structure

| Package | Status | Contents |
|---|---|---|
| `packages/design-system/src/tokens/` | **Canonical** | All design tokens |
| `packages/design-system/src/proof/` | **Keep** | Evidence-first proof components |
| `packages/design-system/src/cockpit/` | **Keep + extend** | Operator-mode cockpit components |
| `packages/design-system/src/shell/` | **Active** | AppShell, SideNav, TopBar, CommandBar, PageHeader |
| `packages/design-system/src/data/` | **Active** | DataGrid, StatusBadge, MetricStat, FilterBar |
| `packages/design-system/src/detail/` | **Active** | DetailDrawer |
| `packages/design-system/src/layout/` | **Active** | SplitPane, SideInspector, InspectorTabs |
| `packages/design-system/src/timeline/` | **Active** | Timeline, ActivityFeed, AuditTrailList |
| `packages/design-system/src/evidence/` | **Active** | EvidencePanel |
| `packages/design-system/src/feedback/` | **Active** | EmptyState, ErrorState, LoadingState, Toast, SkeletonLoader |
| `packages/design-system/src/form/` | **Active** | Button, SearchInput, Select, FormField, SegmentedControl, Stepper |
| `packages/design-system/src/providers/` | **Active** | DesignSystemProvider |
| `packages/ui-command/` | **Deprecated** | Legacy components — do not use for new work |
| `lib/shared-ui/` | **Active** | DashboardShell, EcosystemNav, CommandPalette, SentientLayer |

### 8.2 Shell Components

| Component | Location | Purpose |
|---|---|---|
| `AppShell` | `shell/AppShell.tsx` | Root layout with sidebar and top bar |
| `SideNav` | `shell/SideNav.tsx` | Collapsible primary navigation |
| `TopBar` | `shell/TopBar.tsx` | Global header with search and user menu |
| `CommandBar` | `shell/CommandBar.tsx` | ⌘K command palette trigger |
| `GlobalCommandPalette` | `form/GlobalCommandPalette.tsx` | Full command palette overlay |
| `PageHeader` | `shell/PageHeader.tsx` | Standardized page header with breadcrumb |
| `SectionPanel` | `shell/SectionPanel.tsx` | Labeled collapsible section container |
| `TenantIndicator` | `shell/TenantIndicator.tsx` | Active tenant context display |
| `Breadcrumb` | `shell/Breadcrumb.tsx` | Navigation breadcrumb trail |

### 8.3 Data Display Components

| Component | Location | Purpose |
|---|---|---|
| `StatusBadge` | `data/StatusBadge.tsx` | Semantic status rendering — use this, never custom status color |
| `MetricStat` | `data/MetricStat.tsx` | KPI / metric display block |
| `DataGrid` | `data/DataGrid.tsx` | High-density data table |
| `FilterBar` | `data/FilterBar.tsx` | Horizontal filter control row |
| `TableToolbar` | `data/TableToolbar.tsx` | Table header with actions and search |

### 8.4 Evidence & Proof Components

| Component | Location | Purpose |
|---|---|---|
| `EvidencePanel` | `evidence/EvidencePanel.tsx` | Full evidence surface — traceId, citations, policy, confidence |
| `EvidenceBadge` | `proof/EvidenceBadge.tsx` | Inline evidence presence indicator |
| `FreshnessChip` | `proof/FreshnessChip.tsx` | Data freshness indicator |
| `ConfidenceMeter` | `proof/ConfidenceMeter.tsx` | AI confidence visualization |
| `PolicyStateChip` | `proof/PolicyStateChip.tsx` | Policy verdict chip |
| `AutonomyModeToggle` | `proof/AutonomyModeToggle.tsx` | Autonomy level switcher |
| `ProofEnvelope` | `proof/ProofEnvelope.tsx` | Full proof context wrapper |
| `PolicyModeBadge` | `proof/PolicyModeBadge.tsx` | Policy mode indicator |

---

## 9. Accessibility Baseline

### 9.1 Contrast Ratios

All text must meet WCAG 2.1 AA contrast minimums:

| Use Case | Minimum Ratio |
|---|---|
| Normal text (< 18px) | 4.5:1 |
| Large text (≥ 18px or ≥ 14px bold) | 3:1 |
| UI component boundaries | 3:1 |

Verified combinations:
- `text.primary (#c8d8e8)` on `bg.base (#060b12)`: ~12.4:1 — exceeds AAA
- `text.secondary (#7a99b8)` on `bg.surface (#0d1520)`: ~6.2:1 — passes AA
- `accent.blue (#4d8fcc)` on `bg.surface (#0d1520)`: ~4.7:1 — passes AA
- `text.muted (#4a6070)` on `bg.surface (#0d1520)`: ~2.8:1 — **fails AA** — use muted only for truly non-essential decorative text

### 9.2 Keyboard Navigation

- All interactive elements must be keyboard focusable (natively or via `tabIndex="0"`)
- Focus ring: `color.border.focus (#4d8fcc)`, 2px solid, no `outline: none` without a visible replacement
- Focus order must follow the visual reading order
- Modal dialogs must trap focus while open
- Drawer close must return focus to the trigger element

### 9.3 ARIA Patterns

- Icon-only buttons must have `aria-label`
- Status badges must communicate state to screen readers (not color alone)
- Live data updates must use `aria-live="polite"` for non-critical updates, `aria-live="assertive"` for critical alerts only
- Data tables must use `<caption>`, `<th scope>`, and `aria-sort` on sortable columns
- Progress and loading states must use `role="progressbar"` or `aria-busy="true"`
- Disclosure patterns (accordion, collapsible) must use `aria-expanded`

### 9.4 Color Independence

Color alone must never be the sole indicator of state. Always pair:
- Status color + status icon + status label text
- Error color + error icon + error message text
- Severity color + severity label
- Confidence color + confidence text label

`StatusBadge` enforces this by design — use it rather than custom implementations.

---

## 10. Enterprise Visual Restraint Guidelines

### 10.1 Approved Patterns

- Dark-first surfaces with cool neutral backgrounds
- Restrained enterprise accent family (6 hues, muted)
- Single domain accent per product surface
- Clean information hierarchy: metric → label → supporting text
- Evidence-paired AI results with traceId and source citations
- Utility transitions ≤ 200ms (opacity, translate — no scale/rotate)
- Monospaced font for trace IDs, hashes, code, JSON
- StatusBadge for all status, approval, severity, and state rendering
- DataGrid and DenseTable for tabular data
- Consistent page headers via PageHeader component
- EvidencePanel on all material AI result screens

### 10.2 Anti-Patterns

| Anti-Pattern | Why It's Banned |
|---|---|
| Neon/glow accents in product UX (`#00d4ff`, `#00e878`) | Signals consumer/gaming product — destroys enterprise trust |
| Raw hex in component files | Breaks token system — prevents theme coordination |
| Display text (`text-4xl` and above) in authenticated dashboards | Violates information density and executive-grade aesthetic |
| Decorative Framer Motion (particles, hero floats, bounce springs) | Creates noise, delays comprehension, unprofessional in command surfaces |
| Glow box-shadows (`0 0 20px rgba(...)`) | Associated with consumer gaming/cyber aesthetics |
| High-chroma multi-color pie charts | Visually chaotic; use line/bar instead |
| Mixed icon libraries (Lucide + custom SVG + emoji mixed) | Creates visual noise and inconsistent sizing |
| Per-component border-radius without token basis | Creates inconsistent corner rounding |
| `font-thin`, `font-light` weights | Too fragile at small sizes on dark backgrounds |
| Oversaturated investor deck palette in product surfaces | Conflates marketing with product UI |

### 10.3 Screen Mode Contracts

**Executive Mode** — clean summary view, high signal-to-noise ratio:
- KPI grids, top risks, approval queues, exception summaries
- No tables by default; surface aggregates and outliers
- PageHeader + generous whitespace (comfortable density)
- Use `useScreenMode()` — mode value `'executive'`

**Operator Mode** — high-density, filter/table-first:
- DataGrid with FilterBar in default view
- Drawers for detail (EvidenceDrawer, DetailDrawer)
- Trace visibility: traceId, tool calls, policy audit trail
- Compact or dense spacing via `useDensity()`
- Use `useScreenMode()` — mode value `'operator'`

Components must adapt to both modes. Hard-coding to one mode is not permitted.

---

## 11. Token Usage Rules

1. **No raw hex outside token files.** All color values must reference a token or CSS variable.
2. **No raw `font-family` in component files.** Use `fontFamily.sans` or `fontFamily.mono` tokens.
3. **No hardcoded pixel spacing in components.** Use `useDensity()` or spacing tokens.
4. **No hardcoded `transition` strings.** Use `transition.*` constants from `motion.ts`.
5. **No decorative motion in authenticated product UX.** Limit to utility transitions.
6. **No neon accent values (`accent.neon.*`) in product UX.** Marketing surfaces only.
7. **No custom status coloring.** Use `StatusBadge` with a named variant.
8. **No display type sizes (`text-4xl` and above) in authenticated surfaces.**
9. **No glow box-shadows** in product UX — elevation tokens only.
10. **Import `injectTokens()` at the application root** to ensure CSS custom properties are available.
