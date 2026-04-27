# Accessibility Audit — Findings Register

**Audit date:** 2026-04-27 (initial audit 2026-04-21; conduit/a11oy added 2026-04-27)
**Tool:** `@axe-core/playwright` v4.11.3 (Playwright v1.58.2, Chromium 138)
**Method:** Live axe-core scan against all running artifact dev servers — WCAG 2.1 AA rule set (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`)
**Standard:** WCAG 2.1 Level AA (baseline; full AA certification is out of scope for this round)

**Scan command (live proxy — all artifacts including aegis):**
```bash
PLAYWRIGHT_BASE_URL=http://localhost:9090 \
PLAYWRIGHT_CHROMIUM_PATH=$(which chromium) \
pnpm exec playwright test tests/e2e/a11y.spec.ts \
  --grep "Per-Artifact Root Page" --reporter=list
```

---

## Summary — Per-Artifact Scorecard

### CI Matrix (11 artifacts — built + scanned on every PR)

**33/33 tests passing — zero critical or serious violations on all 11 CI-scanned artifacts.**

| Artifact | Critical | Serious | Moderate | Minor | CI Build | Status |
|----------|:--------:|:-------:|:--------:|:-----:|:--------:|--------|
| szl-holdings | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |
| carlota-jo | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |
| command | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |
| conduit | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |
| counsel | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |
| lyte-command-center | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |
| pulse | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |
| sentra | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |
| terra | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |
| vessels | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |
| a11oy | 0 | 0 | 0 | 0 | ✅ | ✅ PASS |

**Totals across 11 CI-scanned artifacts:** 0 critical, 0 serious, 0 moderate, 0 minor

### Live Proxy Scan Only (not in CI matrix)

| Artifact | Critical | Serious | Status | Note |
|----------|:--------:|:-------:|--------|------|
| aegis | 0 | 0 | ✅ PASS | No package.json/build config — can only be scanned via live monorepo proxy, not CI build |

---

## Resolved Findings (2026-04-21 — original 10 artifacts)

### A11Y-CRIT-001 — `button-name`: Icon-only clear button with no accessible text ✅ FIXED

- **Artifact:** `command`
- **axe-core rule:** `button-name`
- **WCAG criterion:** 4.1.2 Name, Role, Value (Level A)
- **Fix:** Added `aria-label="Clear search"` to the fusion-bar search clear button in
  `artifacts/command/src/components/fusion-bar.tsx`

---

### A11Y-SER-001 — `color-contrast`: Muted text below 4.5:1 contrast ratio ✅ FIXED

- **axe-core rule:** `color-contrast`
- **WCAG criterion:** 1.4.3 Contrast Minimum (Level AA)
- **Artifacts originally affected:** All 10 artifacts
- **Fixes applied:**
  - `packages/design-system/src/tokens/gi-tokens.css`: `--gi-text-muted: #4a6070` → `#7090a8` (contrast 3.2:1 → 6.7:1)
  - `artifacts/counsel/src/index.css`: `--muted-foreground: 260 10% 48%` → `260 10% 60%`
  - `artifacts/lyte-command-center/src/index.css`: `--muted-foreground: 218 10% 48%` → `218 10% 60%`
  - `artifacts/sentra/src/index.css`: `--muted-foreground: 210 12% 48%` → `210 12% 60%`
  - `artifacts/vessels/src/index.css`: `--muted-foreground: 210 12% 48%` → `210 12% 60%`
  - Bulk opacity bumps across aegis, counsel, sentra, vessels, terra: text opacity classes `/25`–`/65` raised to `/75`–`/90`
  - `artifacts/terra/src/pages/marketing-landing.tsx`: `ACCENT_LIGHT = '#40856a'` → `'#5a9e82'` (contrast 2.4:1 → 4.6:1), `rgba(0.6)` solid opacity fix, Enterprise tier accent fix
  - `artifacts/aegis/src/pages/aegis-home.tsx`: convergence badge text → white, red-400/50→/85, red-400/60→/90, `text-white/15`→`/60`, decorative overlines `aria-hidden`
  - `artifacts/command/src/components/unified-layout.tsx`: SectionHeader opacity 0.2→0.6, Domain Packs 0.2→0.65, breadcrumb span 0.2→0.65
  - `artifacts/command/src/pages/dashboard.tsx`: loading text `animate-pulse` element given explicit `text-white` class (fixes contrast at all animation states)
  - `lib/shared-ui/src/cortex-voice.tsx`: keyboard badge given white text
  - `lib/shared-ui/src/multiplayer-session.tsx`: participant avatar initials given white text

### A11Y-SER-002 — `link-in-text-block`: Inline links not visually distinguishable ✅ FIXED

- **axe-core rule:** `link-in-text-block`
- **WCAG criterion:** 1.4.1 Use of Color (Level A)
- **Fix:** Added `text-decoration: underline; text-underline-offset: 2px` rules to `p a`, `li a`, `td a` selectors in `artifacts/szl-holdings/src/index.css`, `artifacts/carlota-jo/src/index.css`, `artifacts/terra/src/index.css`

### A11Y-SER-003 — `document-title` / `html-has-lang`: szl-holdings proxy 503 on root ✅ FIXED

- **Root cause:** `packages/proxy-routes.ts` had `CANONICAL_FALLBACK_PORT = 5173` but szl-holdings
  actually binds to `PORT` env (assigned 21130 by Replit). Stale proxy instances served a bare 503
  error page with no `<title>` or `lang` attribute.
- **Fix:** Updated `CANONICAL_FALLBACK_PORT` to `21130` and restarted all 10 artifact workflows
  so all SO_REUSEPORT-shared proxy listeners picked up the corrected port.

---

## Resolved Findings (2026-04-27 — conduit & a11oy)

### A11Y-CRIT-002 — `button-name`: Sidebar toggle button has no accessible name ✅ FIXED

- **Artifact:** `conduit`
- **axe-core rule:** `button-name`
- **WCAG criterion:** 4.1.2 Name, Role, Value (Level A)
- **Fix:** Added `aria-label` (`"Collapse sidebar"` / `"Expand sidebar"`) and `aria-expanded` to the
  icon-only `<Menu>` toggle button in `artifacts/conduit/src/components/layout.tsx`.
  Also marked the `<Menu>` icon `aria-hidden="true"`, added `aria-label` to collapsed nav links
  (replacing `title`-only), `aria-current="page"` to active links, and `aria-label="Main navigation"` to the `<nav>` element.

### A11Y-SER-004 — `color-contrast`: Muted text below 4.5:1 in conduit ✅ FIXED

- **Artifact:** `conduit`
- **axe-core rule:** `color-contrast`
- **WCAG criterion:** 1.4.3 Contrast Minimum (Level AA)
- **Root cause:** `--muted-foreground: 220 8% 40%` rendered as ~#5c6370 on background #050508
  (contrast ≈ 3.9:1, below 4.5:1 required for normal text).
- **Fix:** `artifacts/conduit/src/index.css`: `--muted-foreground: 220 8% 40%` → `220 8% 62%`
  (contrast ≈ 7.2:1).

### A11Y-SER-005 — `color-contrast`: Ghost text below 4.5:1 in a11oy ✅ FIXED

- **Artifact:** `a11oy`
- **axe-core rule:** `color-contrast`
- **WCAG criterion:** 1.4.3 Contrast Minimum (Level AA)
- **Root cause:** `--color-a11oy-text-ghost: #5e5e5e` on near-black background `#0e0e0e`
  (contrast ≈ 3.25:1, below 4.5:1 required for normal text at 10–11 px).
- **Fix:** `artifacts/a11oy/src/index.css`: `--color-a11oy-text-ghost: #5e5e5e` → `#888888`
  (contrast ≈ 5.7:1 on `#0e0e0e`).

### A11Y-SER-006 — `interactive-supports-focus`: Org switcher not keyboard-accessible in a11oy ✅ FIXED

- **Artifact:** `a11oy`
- **WCAG criterion:** 2.1.1 Keyboard (Level A)
- **Root cause:** The org switcher in `TopBar.tsx` used a CSS-hover-only `<div>` trigger,
  making the dropdown unreachable via keyboard.
- **Fix:** Replaced the hover `<div>` trigger with a proper `<button>` element using
  `useState` to control the open/closed state, `aria-haspopup="listbox"`, `aria-expanded`,
  an `aria-label` describing the current selection, `role="listbox"` on the dropdown,
  `role="option"` + `aria-selected` on each item, and keyboard `Escape` support to close
  and return focus to the trigger. Added click-outside-to-close via `useEffect`.

### Build fix — a11oy Vite alias for `@szl-holdings/shared-ui/billing` ✅ FIXED

- **Artifact:** `a11oy`
- **Root cause:** `billing-account.tsx` imported from `@szl-holdings/shared-ui/billing` — a subpath
  export defined in `lib/shared-ui/package.json` but not yet aliased in a11oy's Vite config, so
  Rollup couldn't resolve the TypeScript source during build.
- **Fix:** Added `{ find: /^@szl-holdings\/shared-ui\/billing$/, replacement: ... }` to
  `artifacts/a11oy/vite.config.ts`, matching the pattern used for omnia-shell subpaths.
  `pnpm --filter @workspace/a11oy run build` now succeeds.

---

## CI Integration

The automated axe check runs on every PR via `.github/workflows/a11y.yml`:
- Builds each of the **11 CI-buildable web artifacts**, serves with `serve --single` (SPA fallback)
- Runs `pnpm exec playwright test tests/e2e/a11y.spec.ts --grep "Per-Artifact Root Page"`
- The spec asserts **zero critical AND zero serious violations** — hard fail (exit 1)
- The `a11y-gate` job fails the workflow if any per-artifact scan job fails
- **CI gate status: HARD GATE (flipped from advisory on 2026-04-27)**

> **Note on aegis:** `artifacts/aegis/` has no `package.json` or Vite config, so it cannot be built
> in CI. It remains in `tests/e2e/a11y.spec.ts` for live-proxy scans (via `PLAYWRIGHT_BASE_URL`)
> and passed the last live scan (2026-04-21, 0 critical/serious violations).
> See follow-up task #4398 for expanding sub-route coverage.

To add a new artifact to the CI scan:
1. Add an entry to `ARTIFACTS` in `tests/e2e/a11y.spec.ts`
2. Add a matrix entry to `.github/workflows/a11y.yml` (name, filter, dist, unique port 4100+)
3. Run the scan locally and fix any findings before merging

## How to Re-run

```bash
# Scan all running artifacts (requires live dev servers on port 9090):
PLAYWRIGHT_BASE_URL=http://localhost:9090 \
PLAYWRIGHT_CHROMIUM_PATH=$(which chromium) \
pnpm exec playwright test tests/e2e/a11y.spec.ts --grep "Per-Artifact Root Page" --reporter=list
```
