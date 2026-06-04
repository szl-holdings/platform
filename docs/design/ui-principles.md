# UI Principles — SZL Holdings Platform

**Version:** 2.0 (April 2026)

---

## Purpose

These principles govern every visual decision across the SZL Holdings product family. They are not aspirational — they are constraints. Every engineer and contributor must apply them before shipping UI to production.

---

## 1. Calm over Loud

**Do:** Use a single enterprise accent per product surface. Use neutral backgrounds. Let whitespace carry hierarchy.  
**Don't:** Use multiple saturated colors in competition. Don't let every element shout for attention.

Good: A red confidence indicator on a dark card with one teal metric.  
Bad: A card with neon cyan headers, amber badges, and green positive delta all at once.

---

## 2. Neutral Bases, Sparing Accents

The dark palette is `#060b12` → `#162030` (base through raised). These are cool neutrals that recede. Product accents exist to carry one meaning per surface:

| Product | Accent | Used for |
|---------|--------|---------|
| Sentra | `#c96070` (red) | Threat indicators, risk states |
| Counsel | `#9b7cc8` (violet) | Obligation states, legal risk |
| Vessels | `#4d8fcc` (blue) | Route data, operational status |
| Terra | `#5baa8a` (green) | Opportunity signals, positive equity |
| Pulse | `#c9a85c` (amber) | Uncertainty, attention, review |
| Lyte | `#c9a85c` (amber) | Decision confidence, signals |
| Aegis | `#9b7cc8` (violet) | Governance states, policy |
| Command | `#4d8fcc` (blue) | System status, coordination |
| Holdings | `#3ea89a` (teal) | Portfolio health, returns |

Rule: **One accent per product. Never mix product accents on one surface.**

---

## 3. No Neon/Glow on Authenticated Surfaces

Neon colors (`#00e878`, `#00d4ff`, `#ffb700`, `#ff4455`, etc.) are permanently retired from authenticated product UX. They exist in `color.accent.neon.*` only as deprecated backward-compatibility exports.

**Never use:**
- `text-shadow` for glow effects
- `box-shadow: 0 0 Xpx <color>` glow rings (decorative)
- Saturated `#ff`, `#00` prefix colors in UI components

**Exception:** `box-shadow: 0 0 4px color60` on interactive map vessel markers is acceptable because it's a functional density indicator on a dark map background, not a decorative glow.

---

## 4. Typography Hierarchy

- Max heading size on authenticated surfaces: **`--gi-text-2xl` (24px)**
- Page headings: `--gi-text-xl` (20px), Space Grotesk or DM Sans, weight 600
- Section headings: `--gi-text-md` (16px), weight 600
- Body / table cells: `--gi-text-sm` (13px), Inter, weight 400
- Metadata / captions: `--gi-text-xs` (12px), weight 400–500
- KPI values: `--gi-text-2xl` (24px), weight 600, letter-spacing -0.03em
- Mono / technical IDs: `--gi-font-mono`, `--gi-text-xs`

Marketing and investor-facing surfaces (Aegis, Carlota-jo home) may use `--gi-text-3xl` and `--gi-text-4xl` for display copy only.

---

## 5. Whitespace and Grid

- Page content max-width: `1440px`, centred
- Standard page padding: `--gi-density-page-padding` (32px default)
- Section gap: `--gi-density-section-gap` (24px default)
- Card padding: `--gi-density-card-padding` (20px default)
- Grid: 12-column at ≥1024px; 4-column at ≥640px; 1-column below

Never use arbitrary pixel padding in new components. Reference the spacing scale: `--gi-space-*`.

---

## 6. Motion Constraints

- **Standard interactions:** max 200ms (`--gi-duration-normal`)
- **Micro-interactions (hover, focus):** 120ms (`--gi-duration-fast`)
- **Panel/drawer open:** 350ms (`--gi-duration-slow`) decelerate easing
- **No decorative animations:** no auto-playing shimmer/pulse on static content
- **No arcade animations:** no rotate, bounce, or scale that isn't triggered by user action
- **Reduced-motion:** always include `@media (prefers-reduced-motion: reduce)` override

---

## 7. Loading, Empty, and Error States

Every route that fetches data must handle all three states. Use the shared components:

```tsx
import { LoadingState, EmptyState, ErrorState, SkeletonKPI, SkeletonTable } from '@szl-holdings/design-system';

// Loading — prefer skeleton for initial loads
<SkeletonKPI columns={4} />
<SkeletonTable rows={8} />

// Loading — spinner for secondary/in-page loads
<LoadingState message="Fetching fleet positions…" />

// Empty
<EmptyState
  title="No alerts found"
  description="All systems are operating within policy bounds."
  icon={<CheckCircle />}
  action={<Button variant="secondary">Refresh</Button>}
/>

// Error
<ErrorState
  title="Unable to load data"
  description="The intelligence layer could not be reached. Check your connection."
/>
```

Rule: never render a blank screen. Always show one of these states.

---

## 8. Accessibility Requirements

Primary surfaces must satisfy:

| Requirement | Target |
|-------------|--------|
| Text contrast | WCAG AA (4.5:1 for body, 3:1 for large text) |
| Focus ring | `2px solid <product-accent>` with `outline-offset: 2px` |
| Keyboard navigation | Tab order follows visual reading order |
| Interactive elements | Have `aria-label` or visible label |
| Skip link | `<a class="skip-to-content" href="#main">` present in shell |
| Semantic landmarks | `<main>`, `<nav>`, `<header>`, `<aside>` used correctly |
| Status changes | Use `aria-live="polite"` for async state changes |

---

## 9. Mobile Breakpoints

All primary surfaces must be usable at 375px viewport width:

| Breakpoint | Width | Behaviour |
|-----------|-------|-----------|
| mobile | < 640px | Single column, stacked nav |
| tablet | 640px–1024px | 2-col grid, collapsible sidebar |
| desktop | ≥ 1024px | Full shell with sidebar |

Sidebar collapses to bottom bar or hamburger on mobile. KPI grids collapse to 2-col or 1-col. Tables scroll horizontally with sticky first column.

---

## 10. Data Visualization

Charts must feel enterprise and legible:

- Use the chart palette (`--gi-chart-1` through `--gi-chart-6`) — never raw hex
- Axis lines: `--gi-chart-axis` (`#4a6070`)
- Grid lines: `--gi-chart-grid` (`#1a2535`), opacity 0.5
- Tooltip background: `--gi-chart-tooltip-bg` (`#0d1520`), border `--gi-chart-tooltip-border`
- Legend text: `--gi-text-secondary`
- Chart labels: `--gi-text-xs`, mono font for numeric labels
- No glow on chart series paths or dots
- Data bars/lines use the product accent as the primary series, chart palette for secondary

---

## Anti-Patterns Checklist

Before merging a PR with UI changes, verify none of these are present:

- [ ] Neon hex colors (`#00e878`, `#00d4ff`, `#ffb700`, `#ff4455`, etc.)
- [ ] `text-shadow` with `0 0 Xpx` glow
- [ ] `box-shadow: 0 0 Xpx <color>` decorative glow rings
- [ ] `animate-pulse` / `animate-bounce` on static content
- [ ] Heading size > `text-2xl` on authenticated surfaces
- [ ] Hardcoded hex colors outside of token files
- [ ] Missing `aria-label` on icon-only buttons
- [ ] Missing loading/empty/error state on async data surfaces
- [ ] Missing `@media (prefers-reduced-motion)` in custom animations
