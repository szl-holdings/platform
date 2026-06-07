# GI Design Language v2 — Design System Reference

**Version:** 2.1 (April 2026)
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
| Neon palette deprecated | All `accent.neon.*` values deprecated for product surfaces |
| `--gi-text-muted` corrected | Fixed: was `#7ba0bc` (matched secondary), now `#4a6070` (correct muted) |

---

## Typography

### Font Families

| Role | CSS Variable | Stack | When to use |
|------|-------------|-------|-------------|
| Sans (body) | `--gi-font-sans` | Inter → DM Sans → system-ui | All UI body text, labels, data |
| Display | `--gi-font-display` | DM Sans → Inter → system-ui | Marketing headlines, hero text |
| Mono | `--gi-font-mono` | JetBrains Mono → Fira Code → Cascadia Code | Code, hashes, IDs, timestamps |

**De-facto system standard:** `Space Grotesk` is used as the display/heading typeface across all command-surface artifacts (loaded from Google Fonts). This is an accepted de-facto standard and should be treated as the canonical display face for product headings until the token is updated.

**Intentional exceptions:**
- **Pulse** uses `Crimson Pro` (serif) for editorial prose blocks — deliberate intelligence memo aesthetic.
- **Carlota Jo** uses `Cormorant Garamond` (serif) for all headings — boutique consulting brand identity.

### Text Style Presets

| Preset | Size | Weight | Use |
|--------|------|--------|-----|
| `page-title` | 20px | 600 | Top-level page heading |
| `section-title` | 14px | 600 | Card/section heading |
| `card-title` | 13px | 600 | Card-level heading |
| `body` | 13px | 400 | General UI body |
| `body-sm` | 12px | 400 | Secondary UI body |
| `label` | 11px | 500 | Form labels, column headers |
| `caption` | 11px | 400 | Metadata, timestamps |
| `metric` | 24px | 600 | KPI headline number |
| `metric-sm` | 18px | 600 | Secondary KPI |
| `code` | 12px | 400 | Code, hashes (mono) |

**Rule:** Authenticated product headings must not exceed `text-2xl` (24px / `--gi-text-2xl`). Larger type belongs on landing pages, pitch decks, and marketing surfaces only.

---

## Density Rules

Density modes control spatial rhythm across all authenticated surfaces. Set via `data-density` attribute.

| Mode | Page Padding | Section Gap | Card Padding | Row Height | Input Height | Font |
|------|-------------|------------|-------------|-----------|-------------|------|
| `comfortable` | 32px | 24px | 20px | 56px | 40px | 13px |
| `compact` | 24px | 16px | 14px | 40px | 32px | 12px |
| `dense` | 16px | 12px | 10px | 32px | 28px | 11px |

**Default by surface type:**
- Command surfaces (Command, Sentra, Vessels, Lyte, Pulse): `compact`
- Landing / marketing pages: `comfortable`
- Log / audit surfaces: `dense`

---

## Motion Budget

| Case | Max duration | Easing | CSS Variable |
|------|-------------|--------|-------------|
| Color / opacity transitions | 100ms | standard | `--gi-duration-fast` |
| Panel open/close, slide-in | 200ms | decelerate | `--gi-duration-normal` |
| Page route transitions | 200ms | decelerate | `--gi-duration-normal` |
| Decorative / hero animations | **prohibited** | — | — |
| Looping pulse indicators | 2–4s, opacity only | ease-in-out | custom |
| Skeleton shimmer | 1.5s | ease | custom |

**Rules:**
- No `transform: scale()` animations on data content
- No `rotate()` or complex keyframe sequences in authenticated surfaces
- Prefer `opacity` + subtle `translateY` (≤8px) for appear/disappear
- `@media (prefers-reduced-motion: reduce)` enforced in every artifact's CSS
- Background glow / shadow pulsing animations are prohibited on product surfaces

---

## Navigation Patterns

### Sidebar Navigation

- Background: `--gi-bg-surface`
- Nav items: `--gi-density-row-height` tall, left-padded per density
- Active item: product-accent background at 8% opacity, accent-colored text, optional 2px left border
- Hover item: `--gi-bg-hover` background
- Section labels: 10px, semibold, uppercase, `--gi-text-muted`, 0.06em letter-spacing
- Icon size: 16px compact, 18px comfortable

### Top Bar

- Height: 44px compact, 52px comfortable
- Background: `--gi-bg-surface` / `--gi-bg-overlay`
- Border-bottom: `--gi-border-subtle`
- Contains: breadcrumb/context, search trigger, density toggle, user/org switcher

### Command Palette (⌘K)

- Full-overlay modal, `--gi-shadow-4` elevation
- Background: `--gi-bg-overlay`
- Search input: full-width, 16px, sans font
- Results: categorised list, max 8 visible before scroll
- Selected item: product-accent highlight at 10% opacity
- Dismiss: `Escape` or click-away

---

## Component Patterns

### Empty State

- Icon: 32px, `--gi-text-muted`
- Headline: 14px semibold, primary text
- Body: 13px secondary text, max 2 sentences
- CTA: optional ghost or secondary button
- No stock illustrations; no full-bleed background images

### Loading / Skeleton State

- Prefer skeleton shimmer over spinner for content placeholders
- Shimmer base: `#162030` → `#1e3248`, 1.5s ease loop
- Spinner: action feedback only (form submit, async in-progress)
- Loading text: "Loading…" 11px muted — never branded copy for loading states

### Error State

- `ErrorState` component: error icon (accent red), headline, message, optional retry CTA
- Inline form errors: `--gi-error-text`, 12px, below the field
- Full-page errors: centered panel on `--gi-bg-base`, never full-page red backgrounds

### Tables

- Header: 10–11px uppercase, `--gi-text-muted`, 0.06em letter-spacing
- Row height: `--gi-density-row-height`
- Row hover: `--gi-bg-hover`
- Row selected: product-accent at 6% opacity + 2px left accent border
- Borders: `--gi-border-subtle` horizontal only (no vertical grid lines)
- Numeric columns: right-aligned, monospace font
- Status column: `StatusBadge` component, not raw colored spans
- Zebra striping: discouraged; use hover highlight instead

### Forms

- Label: 11px semibold, `--gi-text-secondary`, 4px gap below
- Input height: `--gi-density-input-height`
- Border: `--gi-border-default`; focus → `--gi-border-focus`
- Helper text: 11px, `--gi-text-muted`, below the input
- Error text: 11px, `--gi-error-text`, below helper text
- Required marker: `*` in `--gi-accent-red`, after label
- Disabled: 50% opacity, `not-allowed` cursor
- Button row: right-aligned, primary + ghost cancel pattern

---

## Intentional Brand Exceptions

These deviations are documented and must not be reverted without design review.

| Artifact | Exception | Reason |
|---------|-----------|--------|
| Carlota Jo | Light theme, Cormorant Garamond, stone/cream palette | Boutique consulting brand — deliberately not SZL platform aesthetic |
| Pulse | Crimson Pro serif for prose blocks | Intelligence memo editorial voice |
| SZL Holdings marketing | Space Grotesk, gradient hero sections | Marketing surface — different register than product |
| Mobile (day mode) | Purple-toned light palette | Own light-mode theme distinct from gi-light |

---

## Per-Artifact Token Pattern

### Pattern A — Direct gi-tokens (preferred for new work)

Used by: SZL Holdings, Command, Aegis, Pulse

```css
@import "@szl-holdings/design-system/tokens/css";
/* reference --gi-* vars directly */
background: var(--gi-bg-surface);
color: var(--gi-text-primary);
border: 1px solid var(--gi-border-default);
```

### Pattern B — shadcn HSL bridge (legacy pattern)

Used by: Sentra, Vessels, Lyte, Terra, Counsel

Artifacts using shadcn `ui` components define a `--background`, `--foreground`, `--primary` etc. layer that remaps gi-token values to HSL variables. This is accepted where shadcn is already in use; new artifacts should prefer Pattern A.

```css
:root {
  --background: 216 30% 4%;   /* --gi-bg-base */
  --foreground: 205 18% 92%;  /* --gi-text-primary */
  --primary: 210 52% 55%;     /* product accent */
}
```
