# Frontend Performance Plan

Generated: 2026-04-15

## Current Architecture

All web artifacts use:
- React 18 with Vite
- Tailwind CSS
- Framer Motion for animations
- React Router for client-side routing
- Shared UI components from `lib/shared-ui`

## Bundle Size Concerns

| App | Risk | Reason |
|-----|------|--------|
| szl-holdings | Medium | Large shared-ui imports, many routes |
| firestorm | Medium | Complex workspace switching, map components |
| terra | High | Map libraries (Mapbox/Leaflet), data visualization |
| vessels | High | Map libraries, real-time tracking |
| command | Medium | Multiple mode switching, dashboard data |

## Performance Optimization Plan

### P0 — Quick Wins
1. **Route-based code splitting** — `React.lazy()` for all route components
2. **Image optimization** — WebP format, proper sizing, lazy loading
3. **Tree shaking audit** — verify unused exports are eliminated
4. **Font optimization** — preload critical fonts, use `font-display: swap`

### P1 — Structural
5. **Shared UI barrel export audit** — avoid importing entire shared-ui
6. **Map library lazy loading** — load Mapbox/Leaflet only on map pages
7. **Animation budget** — limit Framer Motion to above-the-fold elements
8. **Prefetch critical routes** — prefetch likely navigation targets

### P2 — Advanced
9. **Service worker** — cache static assets for repeat visits
10. **SSG for marketing pages** — pre-render flagship landing pages
11. **CDN for static assets** — serve images/fonts from edge
12. **Bundle analysis** — add `rollup-plugin-visualizer` to identify bloat

## Core Web Vitals Targets

| Metric | Target | Current (est.) |
|--------|--------|----------------|
| LCP | < 2.5s | Needs measurement |
| FID | < 100ms | Needs measurement |
| CLS | < 0.1 | Needs measurement |
| TTFB | < 600ms | Needs measurement |

## Lighthouse CI

Already have `lighthouse.yml` workflow. Verify it:
1. Runs against staging deployment
2. Tests at minimum: homepage, platform page, trust center
3. Fails build if performance score < 70
4. Reports Core Web Vitals metrics
