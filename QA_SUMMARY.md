# QA Summary — SZL Holdings Platform

> Overview of all quality gates, QA scripts, and validation processes for the SZL Holdings platform.

---

## QA Philosophy

Quality assurance is continuous, not a pre-release gate. The platform maintains quality through:
1. Automated scripts that can be run anytime
2. Pre-release checklists that must be completed before deployments
3. Post-deployment smoke tests to verify production health

---

## QA Scripts

All QA scripts live in `scripts/qa/`. Run individually or via workspace commands.

### Quick Reference

```bash
pnpm qa:site     # Full site QA (all checks)
pnpm qa:routes   # Route smoke tests
pnpm qa:links    # Broken link detection
pnpm qa:a11y     # Accessibility baseline
```

---

### Route Smoke Tests (`scripts/qa/smoke-routes.js`)

**Purpose:** Verify all registered public routes return HTTP 200 and load without errors.

**What it checks:**
- All PUBLIC routes in ROUTE_INVENTORY.md return 200
- No 404 or 500 responses on expected routes
- Response time < 3s per route

**When to run:** Before every deployment, after any route changes.

```bash
BASE_URL=https://szlholdings.com node scripts/qa/smoke-routes.js
```

---

### Broken Link Detection (`scripts/qa/check-links.js`)

**Purpose:** Crawl all public pages and identify broken external and internal links.

**What it checks:**
- All `<a href>` links on public pages
- Internal route links return 200
- External links are reachable (HTTP check, not full render)
- No `href="#"` placeholder links on public-facing content

**When to run:** Weekly, and before any release.

```bash
BASE_URL=https://szlholdings.com node scripts/qa/check-links.js
```

---

### Metadata Checks (`scripts/qa/check-metadata.js`)

**Purpose:** Verify all public pages have required SEO and OG metadata.

**What it checks:**
- `<title>` tag present and non-empty
- `<meta name="description">` present and non-empty (50–160 chars)
- `<meta property="og:title">` present
- `<meta property="og:description">` present
- `<meta property="og:image">` present and image is reachable
- No duplicate titles across pages

**When to run:** Before releases, after adding new public pages.

```bash
BASE_URL=https://szlholdings.com node scripts/qa/check-metadata.js
```

---

### Accessibility Baseline (`scripts/qa/check-a11y.js`)

**Purpose:** Run automated accessibility checks against public pages.

**What it checks (WCAG 2.1 AA):**
- All images have `alt` attributes
- All form inputs have associated `<label>` elements
- Color contrast ratio ≥ 4.5:1 for normal text
- No missing ARIA roles or attributes
- Keyboard navigation paths are logical
- Focus indicators visible

**When to run:** Before releases, after major UI changes.

```bash
BASE_URL=https://szlholdings.com node scripts/qa/check-a11y.js
```

---

### Trust & Legal Page Existence (`scripts/qa/check-trust.js`)

**Purpose:** Verify all trust and legal pages exist and are accessible.

**What it checks:**
- `/legal/privacy` returns 200
- `/legal/terms` returns 200
- `/accessibility` returns 200
- `/trust-center` returns 200
- `/trust/*` routes return 200
- `/status` returns 200
- `SECURITY.md` is accessible at the expected path
- No "Coming Soon" or placeholder content on trust pages

**When to run:** Before every release.

```bash
BASE_URL=https://szlholdings.com node scripts/qa/check-trust.js
```

---

### Demo Seed Integrity (`scripts/qa/check-demo-seed.js`)

**Purpose:** Verify the demo environment is properly seeded and functional.

**What it checks:**
- Demo org exists in database
- Demo user accounts accessible
- Product-specific demo data present (signals, fleet, deals, matters)
- Alloy workflows configured
- No production data in demo org

**When to run:** Before every demo.

```bash
node scripts/qa/check-demo-seed.js
```

---

## Quality Gates by Release Type

### Patch Release

- [ ] `pnpm test` passes
- [ ] `pnpm typecheck` passes
- [ ] Route smoke tests pass
- [ ] Manual verification of changed areas

### Minor Release

- [ ] All patch requirements
- [ ] `pnpm qa:routes` passes
- [ ] `pnpm qa:links` passes
- [ ] `pnpm qa:a11y` passes (for any changed pages)
- [ ] Metadata checks pass for new pages
- [ ] Screenshots refreshed if UI changed

### Major Release

- [ ] All minor requirements
- [ ] Full `pnpm qa:site` pass
- [ ] Trust and legal page existence check
- [ ] Demo seed integrity check
- [ ] Lighthouse ≥ 85 on landing page
- [ ] Mobile view verified (physical device or BrowserStack)
- [ ] Full [DEPLOYMENT_READINESS.md](DEPLOYMENT_READINESS.md) completed

---

## QA Coverage Matrix

| Area | Automated | Manual | Frequency |
|------|-----------|--------|-----------|
| Public routes (smoke) | Yes | No | Every release |
| Internal routes | No | Yes | Every release |
| Broken links | Yes | No | Weekly |
| Metadata/SEO | Yes | No | Every release |
| Accessibility | Yes (automated baseline) | Yes (manual for complex flows) | Pre-release |
| Performance (Lighthouse) | No | Yes | Pre-release |
| Mobile layout | No | Yes | Pre-release |
| Auth flows | No | Yes | Every release |
| Contact form end-to-end | No | Yes | Every release |
| Analytics events | No | Yes | Every release |
| Trust/legal pages | Yes | No | Every release |
| Demo data integrity | Yes | No | Before demos |

---

## Known QA Gaps (Backlog)

- [ ] End-to-end (E2E) test suite with Playwright (playwright.config.ts exists but tests not written)
- [ ] Automated performance regression testing
- [ ] Cross-browser automated testing
- [ ] API endpoint contract testing
- [ ] Mobile-specific accessibility testing

---

## Running Full QA Suite

```bash
# Full suite (run before any release)
pnpm qa:site

# Individual checks
pnpm qa:routes   # Smoke tests
pnpm qa:links    # Link checks
pnpm qa:a11y     # Accessibility

# Development: check against local dev server
BASE_URL=http://localhost:$PORT node scripts/qa/smoke-routes.js
```
