# Accessibility Audit — Findings Register

**Audit date:** 2026-04-21  
**Tool:** `@axe-core/playwright` v4.11.3 (Playwright v1.58.2, Chromium 138)  
**Method:** Live axe-core scan against all 10 running artifact dev servers — WCAG 2.1 AA rule set (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`)  
**Standard:** WCAG 2.1 Level AA (baseline; full AA certification is out of scope for this round)

**Scan command:**
```bash
PLAYWRIGHT_BASE_URL=http://localhost:9090 \
PLAYWRIGHT_CHROMIUM_PATH=$(which chromium) \
pnpm exec playwright test tests/e2e/a11y.spec.ts \
  --grep "Per-Artifact Root Page" --reporter=list
```

---

## Summary — Final Verified Results (2026-04-21)

**30/30 tests passing — zero critical or serious violations on all 10 artifacts.**

| Artifact | Critical | Serious | Moderate | Minor | Status |
|----------|:--------:|:-------:|:--------:|:-----:|--------|
| szl-holdings | 0 | 0 | 0 | 0 | ✅ PASS |
| aegis | 0 | 0 | 0 | 0 | ✅ PASS |
| carlota-jo | 0 | 0 | 0 | 0 | ✅ PASS |
| command | 0 | 0 | 0 | 0 | ✅ PASS |
| counsel | 0 | 0 | 0 | 0 | ✅ PASS |
| lyte-command-center | 0 | 0 | 0 | 0 | ✅ PASS |
| pulse | 0 | 0 | 0 | 0 | ✅ PASS |
| sentra | 0 | 0 | 0 | 0 | ✅ PASS |
| terra | 0 | 0 | 0 | 0 | ✅ PASS |
| vessels | 0 | 0 | 0 | 0 | ✅ PASS |

**Totals across all artifacts:** 0 critical, 0 serious, 0 moderate, 0 minor

---

## Resolved Findings

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

## CI Integration

The automated axe check runs on every PR via `.github/workflows/a11y.yml`:
- Builds each artifact, serves it with `serve --single` (SPA fallback)
- Runs `pnpm exec playwright test tests/e2e/a11y.spec.ts --grep "Per-Artifact Root Page"`
- The spec asserts **zero critical AND zero serious violations** (`tests/e2e/a11y.spec.ts` line 147)
- Advisory mode (CI workflow uses `continue-on-error: true`) — all 10 artifacts now pass; ready to flip to hard-gate

To flip to hard-fail (all 10 now clean, safe to enable):
```
# In .github/workflows/a11y.yml:
# 1. Remove continue-on-error: true from a11y-axe and a11y-gate jobs
# 2. Add 'a11y-gate' to the needs list in the ci-gate job in ci.yml
```

## How to Re-run

```bash
# Scan all running artifacts (requires live dev servers on port 9090):
PLAYWRIGHT_BASE_URL=http://localhost:9090 \
PLAYWRIGHT_CHROMIUM_PATH=$(which chromium) \
pnpm exec playwright test tests/e2e/a11y.spec.ts --grep "Per-Artifact Root Page" --reporter=list
```
