# Design System Hardening — SZL Holdings Public Site

**Source:** `BRAND_GUIDELINES.md`, `lib/shared-ui/`, `artifacts/szl-holdings/src/index.css`  
**Last updated:** April 2026

---

## Color tokens in use

All public site colors must use the CSS custom properties defined in `index.css`. Do not hardcode hex or HSL values that are not also token-referenced.

### Core color tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--color-szl-bg` | `hsl(214,16%,4%)` | Page background |
| `--color-szl-surface` | `hsl(214,12%,8%)` | Card / panel backgrounds |
| `--color-szl-accent` | `hsl(192,72%,48%)` | Primary actions, active links, accents |
| `--color-szl-text` | `hsl(38,8%,92%)` | Primary body text |
| `--color-szl-text-secondary` | `hsl(214,7%,55%)` | Secondary text, labels |
| `--color-szl-text-faint` | `hsl(214,7%,42%)` | Faint / helper text |
| `--color-szl-border` | `hsla(0,0%,100%,0.08)` | Standard borders |
| `--color-szl-border-hover` | `hsla(0,0%,100%,0.14)` | Hover-state borders |

### Domain pack accent colors

| Domain | Token | Hex reference |
|--------|-------|--------------|
| Aegis | `var(--color-aegis)` | `hsl(222,60%,58%)` |
| Vessels | `var(--color-vessels)` | `hsl(206,72%,52%)` |
| Terra | `var(--color-terra)` | `hsl(140,52%,46%)` |
| PRISM Counsel | `var(--color-prism)` | `hsl(260,60%,65%)` |
| Carlota Jo | `var(--color-carlota)` | `hsl(36,48%,58%)` |
| SZL / Lyte | `var(--color-szl-accent)` | `hsl(192,72%,48%)` |

---

## Typography scale

| Element | Font | Weight | Size range | Line height |
|---------|------|--------|-----------|------------|
| Hero h1 | System UI / Plus Jakarta Sans | 700 | clamp(2.5rem, 5.5vw, 4.25rem) | 1.06 |
| Section h2 | System UI / Plus Jakarta Sans | 700 | clamp(1.75rem, 3vw, 2.25rem) | 1.10–1.15 |
| Card h3 | System UI / Plus Jakarta Sans | 600 | clamp(1.1rem, 2vw, 1.4rem) | 1.2 |
| Body large | System UI | 400 | clamp(1rem, 1.8vw, 1.125rem) | 1.72 |
| Body standard | System UI | 400 | 0.9375rem | 1.65–1.72 |
| Body small | System UI | 400 | 0.875rem | 1.6 |
| Label / eyebrow | System UI | 600–700 | 0.6875rem | 1.0 |
| Mono / code | Geist Mono / var(--font-mono) | 400–600 | 0.6875rem–0.875rem | 1.0 |

### Letter spacing rules

| Element | Letter spacing |
|---------|--------------|
| Hero / display h1 | `-0.028em` |
| Section h2 | `-0.022em` |
| Eyebrow / label (mono) | `+0.10em` to `+0.12em` |
| Body | `0` (default) |

---

## Spacing system

All section padding uses `clamp()` for responsive scaling.

| Breakpoint context | Pattern |
|-------------------|---------|
| Section vertical padding | `clamp(4rem,8vw,6rem) var(--space-content-x)` |
| Hero vertical padding | `clamp(7rem,14vw,10rem) var(--space-content-x) clamp(4rem,8vw,6rem)` |
| Small section (strip) | `clamp(2.5rem,4vw,3rem) var(--space-content-x)` |
| Content max-width | `1280px` — consistently applied |
| Content horizontal padding | `var(--space-content-x)` — defined in CSS |

---

## Motion system

### Principles

- **Once per element:** All `whileInView` animations use `viewport={{ once: true }}`
- **No loops:** No infinite or repeating animations on the public site
- **Stagger cap:** Maximum stagger delay increment is `0.07s` per item
- **Duration cap:** Entry animations 0.4–0.55s; no animation over 0.6s
- **Ease curve:** `[0.16, 1, 0.3, 1]` for primary entries (ease-out spring feel)
- **Reduced motion:** CSS `prefers-reduced-motion: reduce` disables all transitions at the browser level (set in `index.html` critical CSS)

### Standard entry variant

```typescript
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.07,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};
```

Use `custom={i}` + `variants={fadeUp}` for staggered grids. Use `initial/whileInView` directly for single elements.

---

## Component conventions

### Cards

```
padding: 1.75rem
border-radius: 0.875rem
background: hsla(0,0%,100%,0.025)
border: 1px solid hsla(0,0%,100%,0.07)
```

On hover: `borderColor` updates to `${accent}35`, `background` updates to `${accent}06`.

### Eyebrow labels

```
font-size: 0.6875rem
font-weight: 600–700
letter-spacing: 0.10em–0.12em
text-transform: uppercase
font-family: var(--font-mono)
color: var(--color-szl-text-faint)  [or accent for highlighted labels]
```

### Primary CTA button

```
padding: 0.75rem 1.5rem
background: hsl(192,72%,48%)
color: hsl(214,18%,4%)
border-radius: 0.375rem
font-size: 0.875rem
font-weight: 600
hover: background hsl(192,72%,54%)
```

### Secondary CTA button (ghost)

```
padding: 0.75rem 1.5rem
background: transparent
border: 1px solid var(--color-szl-border-hover)
color: var(--color-szl-text-secondary)
border-radius: 0.375rem
font-size: 0.875rem
font-weight: 500
hover: borderColor hsla(0,0%,100%,0.25), color hsl(38,8%,90%)
```

### Icon containers

```
width: 28–36px
height: 28–36px
border-radius: 0.375rem–0.5rem
background: {accent}12–14
border: 1px solid {accent}28
display: flex; align-items: center; justify-content: center
```

---

## Accessibility baseline

### Required on every page

- [ ] `<main id="main-content">` on every page
- [ ] Skip-to-content link in `index.html` (already present)
- [ ] `aria-label` on all `<section>` elements
- [ ] `aria-hidden="true"` on all decorative icons (Lucide icons used as decoration)
- [ ] `aria-label` on icon-only links and buttons
- [ ] `focus-visible` outline applied globally (already in `index.html` critical CSS)
- [ ] Color contrast: body text `hsl(38,8%,92%)` on `hsl(214,16%,4%)` — passes WCAG AA (ratio ~14:1)
- [ ] Color contrast: secondary text `hsl(214,7%,55%)` on dark background — passes WCAG AA (ratio ~4.7:1)
- [ ] `lang="en"` on `<html>` (already present)
- [ ] All form inputs have associated `<label>` elements

### Do not

- Do not use color as the only distinguishing factor for interactive state
- Do not use `div` or `span` as interactive elements without `role` and `tabindex`
- Do not use `aria-label` redundantly when visible text is sufficient
- Do not suppress `:focus-visible` without a replacement

---

## Mobile responsiveness rules

### Breakpoints

| Name | Min-width | Usage |
|------|-----------|-------|
| sm | 640px | Two-column grids |
| md | 768px | Three-column grids, two-column layouts |
| lg | 1024px | Full desktop layouts |

### Grid patterns

```css
/* 2-col at sm */
className="sm:grid-cols-2"

/* 5-col at lg */  
className="sm:grid-cols-2 lg:grid-cols-5"

/* 2-col at md */
className="md:grid-cols-2"
```

### Mobile-first rules

- All padding uses `clamp()` — mobile sizes are the lower bound
- `flexWrap: "wrap"` on all flex rows that contain CTAs or multi-item horizontal groups
- Navigation collapses to hamburger — handled by `SiteNav.tsx`
- Max-width constraints (22ch, 32ch, 52ch) maintain readability at all sizes

---

## Known technical debt (as of Phase 6)

1. **Inline styles vs. Tailwind:** The public site uses a hybrid of inline styles (for dynamic values) and Tailwind classes (for responsive breakpoints). This is intentional for the current stage but should be moved to CSS custom properties or a component library in Phase 8+.
2. **OG images:** `/og/` directory is referenced but images not yet generated. A static fallback image should be placed at `/og/og-home.jpg` before launch.
3. **Sitemap:** `robots.txt` references `sitemap.xml` — not yet auto-generated. Add to build step or create static file.
4. **Font loading:** Two font families (Plus Jakarta Sans + Inter) load via Google Fonts. Consider self-hosting for better LCP and privacy.
