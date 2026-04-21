# GI Design Language v2 — Design System Reference

**Version:** 2.0 (April 2026)  
**Package:** `@szl-holdings/design-system`  
**Token file:** `packages/design-system/src/tokens/gi-tokens.css`

---

## Overview

The Governed-Intelligence (GI) Design Language v2 is the single source of visual truth for the SZL Holdings platform ecosystem. It defines tokens, components, and interaction patterns that give every web artifact a calm, premium, institutional character — closer to Apple clarity and major-financial-firm composure than gamer aesthetics.

**Core philosophy:**
- Dark-first with a full usable light mode for investor decks and screenshots
- Neutral bases with sparing, intentional enterprise accents (no neon/glow)
- Evidence-backed: every AI output carries a proof envelope
- Density-aware: comfortable, compact, and dense modes supported
- Accessible: WCAG AA contrast on primary text, visible focus rings, semantic landmarks

---

## Package Structure

```
packages/design-system/src/
  tokens/
    gi-tokens.css        ← CSS custom properties (import this in every artifact)
    index.ts             ← JS/TS token exports (color, spacing, typography…)
    vars.ts              ← CSS var() string references for inline styles
    semantic.ts          ← Status/severity/confidence tokens
    domain-accents.ts    ← Per-product accent overrides
  shell/
    AppShell.tsx         ← Main application layout shell
    SideNav.tsx          ← Collapsible sidebar navigation
    TopBar.tsx           ← Top bar with command palette trigger
    PageHeader.tsx       ← Page-level heading + breadcrumb area
    Breadcrumb.tsx       ← Breadcrumb navigation component (v2 new)
    SectionPanel.tsx     ← Content section container
    CommandBar.tsx       ← Inline command bar
    GlobalCommandPalette.tsx ← ⌘K command palette overlay
    TenantIndicator.tsx  ← Multi-org context indicator
  feedback/
    EmptyState.tsx       ← Zero-data placeholder
    ErrorState.tsx       ← Error / failure state
    LoadingState.tsx     ← Spinner-based loading indicator
    SkeletonLoader.tsx   ← Skeleton shimmer variants (v2 new)
    Toast.tsx            ← Toast notification system (v2 new)
  form/
    Button.tsx           ← Button hierarchy (v2 new)
    FormField.tsx        ← Labelled form field wrapper
    SearchInput.tsx      ← Search / filter input
    SegmentedControl.tsx ← Segmented toggle
    Select.tsx           ← Select dropdown
    Stepper.tsx          ← Numeric stepper
  data/
    DataGrid.tsx         ← Dense data table with sorting/filtering
    FilterBar.tsx        ← Filter row for data surfaces
    MetricStat.tsx       ← KPI stat tile with delta
    StatusBadge.tsx      ← Status / state badge
    TableToolbar.tsx     ← Data table toolbar
  cockpit/              ← Specialised command-surface components
  proof/                ← AI evidence components (ProofEnvelope, ConfidenceMeter…)
  detail/               ← Drawer and inspector panels
  evidence/             ← Evidence display components
  timeline/             ← Timeline and audit rail components
  layout/               ← Split pane, side inspector
  providers/            ← DesignSystemProvider (theme + density context)
  hooks/                ← useDensity, useScreenMode
```

---

## Token Reference

### Color — Dark Theme (default)

| Token | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| Background base | `--gi-bg-base` | `#060b12` | Page background |
| Background surface | `--gi-bg-surface` | `#0d1520` | Cards, sidebar |
| Background overlay | `--gi-bg-overlay` | `#111c2a` | Dropdowns, modals |
| Background raised | `--gi-bg-raised` | `#162030` | Inputs, hover areas |
| Border subtle | `--gi-border-subtle` | `#1a2535` | Dividers, section borders |
| Border default | `--gi-border-default` | `#243040` | Card/input borders |
| Border strong | `--gi-border-strong` | `#304055` | Emphasis borders |
| Text primary | `--gi-text-primary` | `#c8d8e8` | Body text, headings |
| Text secondary | `--gi-text-secondary` | `#7a99b8` | Labels, metadata |
| Text muted | `--gi-text-muted` | `#4a6070` | Placeholders, disabled |

### Accent Family (enterprise — no neon)

| Name | CSS Variable | Hex | Used by |
|------|-------------|-----|---------|
| Blue | `--gi-accent-blue` | `#4d8fcc` | Command, Vessels |
| Teal | `--gi-accent-teal` | `#3ea89a` | Holdings |
| Green | `--gi-accent-green` | `#5baa8a` | Terra |
| Amber | `--gi-accent-amber` | `#c9a85c` | Pulse, Lyte |
| Red | `--gi-accent-red` | `#c96070` | Sentra |
| Violet | `--gi-accent-violet` | `#9b7cc8` | Counsel, Aegis, Carlota-jo |
| Slate | `--gi-accent-slate` | `#7a99b8` | Neutral emphasis |

### Light Theme

Apply the `gi-light` class or `data-theme="light"` attribute to enable the light theme. Used for investor decks (Aegis), editorial surfaces (Carlota-jo in editorial mode), and screenshots.

```html
<div class="gi-light">...</div>
<!-- or -->
<div data-theme="light">...</div>
```

Light theme uses the same enterprise accent hues adjusted for WCAG AA contrast on white backgrounds.

### Semantic Status

| State | Text | Background | Border |
|-------|------|-----------|--------|
| success | `--gi-success-text` | `--gi-success-bg` | `--gi-success-border` |
| warning | `--gi-warning-text` | `--gi-warning-bg` | `--gi-warning-border` |
| error | `--gi-error-text` | `--gi-error-bg` | `--gi-error-border` |
| info | `--gi-info-text` | `--gi-info-bg` | `--gi-info-border` |
| neutral | `--gi-neutral-text` | `--gi-neutral-bg` | `--gi-neutral-border` |

### Chart Palette (executive-quiet)

Six-series palette optimised for dark backgrounds. Muted, distinguishable, institutional:

`#4d8fcc` · `#5baa8a` · `#c9a85c` · `#9b7cc8` · `#c97a64` · `#6bb5c2`

Dark grid: `--gi-chart-grid` (#1a2535) · Dark axis: `--gi-chart-axis` (#4a6070)

### Typography Scale

| Token | CSS Var | Value | Semantic use |
|-------|---------|-------|-------------|
| 2xs | `--gi-text-2xs` | 10px | Micro labels, status dots |
| xs | `--gi-text-xs` | 12px | Captions, secondary metadata |
| sm | `--gi-text-sm` | 13px | UI default, table cells |
| base | `--gi-text-base` | 14px | Body text |
| md | `--gi-text-md` | 16px | Section titles |
| lg | `--gi-text-lg` | 18px | Sub-headings |
| xl | `--gi-text-xl` | 20px | Page headings (authenticated) |
| 2xl | `--gi-text-2xl` | 24px | **Max** for authenticated surfaces |
| 3xl | `--gi-text-3xl` | 30px | Marketing / investor copy only |
| 4xl | `--gi-text-4xl` | 36px | Marketing / investor copy only |

Fonts: `--gi-font-sans` (Inter/DM Sans), `--gi-font-display` (DM Sans), `--gi-font-mono` (JetBrains Mono)

### Spacing Scale (4px base)

`--gi-space-0` · `--gi-space-0-5` (2px) · `--gi-space-1` (4px) · `--gi-space-2` (8px) · `--gi-space-3` (12px) · `--gi-space-4` (16px) · `--gi-space-6` (24px) · `--gi-space-8` (32px) · `--gi-space-12` (48px) · `--gi-space-16` (64px)

### Density Modes

| Mode | Page Padding | Row Height | Font |
|------|-------------|-----------|------|
| comfortable (default) | 32px | 56px | 13px |
| compact `[data-density="compact"]` | 24px | 40px | 12px |
| dense `[data-density="dense"]` | 16px | 32px | 11px |

### Elevation / Shadow

| Level | CSS Var | Value |
|-------|---------|-------|
| 0 | `--gi-shadow-0` | none |
| 1 | `--gi-shadow-1` | 0 1px 3px rgba(0,0,0,0.50) |
| 2 | `--gi-shadow-2` | 0 4px 12px rgba(0,0,0,0.60) |
| 3 | `--gi-shadow-3` | 0 8px 24px rgba(0,0,0,0.70) |
| 4 | `--gi-shadow-4` | 0 16px 48px rgba(0,0,0,0.80) |

### Motion Constraints

- Max duration for product interactions: **200ms** (`--gi-duration-normal`)
- No decorative animations on authenticated surfaces
- `--gi-ease-standard: cubic-bezier(0.4, 0, 0.2, 1)` for most transitions
- Reduced-motion media query enforced in every artifact's CSS

---

## Importing in an Artifact

Every web artifact must include these two imports:

```css
/* index.css */
@import "@szl-holdings/design-system/tokens/css";
```

```tsx
// main.tsx or App.tsx
import '@szl-holdings/design-system/tokens/css'; // if not via CSS
```

Then wrap the app root with `DesignSystemProvider` to enable density/theme context:

```tsx
import { DesignSystemProvider } from '@szl-holdings/design-system';

<DesignSystemProvider theme="dark" density="compact">
  <App />
</DesignSystemProvider>
```

---

## New in v2

| Feature | Details |
|---------|---------|
| Light theme | `[data-theme="light"]` / `.gi-light` selector |
| Typography CSS vars | `--gi-font-*`, `--gi-text-*`, `--gi-weight-*`, `--gi-leading-*` |
| Spacing CSS vars | `--gi-space-*` |
| Elevation system | `--gi-shadow-0` through `--gi-shadow-4` |
| Density CSS vars | `--gi-density-*` via attribute selectors |
| Semantic shorthand | `--gi-success-*`, `--gi-warning-*`, `--gi-error-*`, `--gi-info-*` |
| Chart CSS vars | `--gi-chart-grid`, `--gi-chart-axis`, `--gi-chart-tooltip-*` |
| `Button` component | Primary, secondary, ghost, destructive, outline × xs–lg |
| `SkeletonLoader` | SkeletonText, SkeletonCard, SkeletonKPI, SkeletonTable |
| `Toast` system | ToastContainer + useToast hook, 5 variants, auto-dismiss |
| `Breadcrumb` | Accessible breadcrumb with icon slots |
| Extended `v` object | CSS var references for all new tokens in `vars.ts` |
| Neon palette deprecated | All `accent.neon.*` values removed from product surfaces |
