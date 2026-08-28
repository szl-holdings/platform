# Lighthouse Performance Baseline (Historical Snapshot)

**Established:** 2026-04-21  
**Tool:** Lighthouse 12.4.0 (via `@lhci/cli` v0.15.1)  
**Runner:** Replit NixOS container — Chromium 138.0.7204.100  
**Chrome flags:** `--headless=new --no-sandbox --disable-gpu --ignore-certificate-errors --disable-dev-shm-usage`  
**Historical capture config:** `.lighthouserc.json` as of 2026-04-21 (preset: `lighthouse:no-pwa`, warn-mode thresholds)
**Historical capture runs:** 1 single-measurement run per artifact

> **Current operational boundary (2026-08-26):** The measurements below remain a historical
> ten-artifact dev-server snapshot; they are not a current CI result. The live workflow matrix now
> audits six built web artifacts with one run each. Accessibility ≥ 90 is enforced as an error,
> while performance ≥ 80, best-practices ≥ 90, and SEO ≥ 90 remain advisory warnings. The
> aggregate Lighthouse check is not currently a required branch-protection context.

> **Dev-server measurement note:** All scores below were captured against live Vite **dev servers**
> (non-minified JS, no tree-shaking, hot-reload client included). This inflates LCP and TBT
> dramatically vs production. **Performance scores are dev-server baselines only.**
> Accessibility, Best-Practices, and SEO scores *are* production-representative (unaffected by build mode).

---

## Measured Results — All 10 Artifacts (2026-04-21, Vite dev server)

| Artifact | Perf | A11y | Best Practices | SEO | FCP | LCP | TBT | CLS |
|----------|:----:|:----:|:--------------:|:---:|-----|-----|-----|-----|
| **aegis** | 27 | 95 | 93 | 90 | 55.7 s | 108.8 s | 2,220 ms | 0.000 |
| **carlota-jo** | 29 | 82 | 93 | 100 | 24.5 s | 51.1 s | 1,550 ms | 0.000 |
| **command** | 29 | 88 | 89 | 100 | 25.0 s | 78.4 s | 1,640 ms | 0.000 |
| **counsel** | 41 | 89 | 93 | 100 | 23.5 s | 45.6 s | 570 ms | 0.000 |
| **lyte-command-center** | 24 | 84 | 93 | 100 | 11.2 s | 21.7 s | 1,570 ms | 0.140 |
| **pulse** | 46 | 100 | 93 | 100 | 35.2 s | 68.0 s | 370 ms | 0.001 |
| **sentra** | 28 | 89 | 93 | 100 | 23.5 s | 46.1 s | 1,730 ms | 0.010 |
| **szl-holdings** | 31 | 89 | 93 | 100 | 32.7 s | 65.5 s | 1,260 ms | 0.013 |
| **terra** | 38 | 86 | 93 | 92 | 27.7 s | 55.3 s | 690 ms | 0.000 |
| **vessels** | 25 | 91 | 93 | 100 | 31.0 s | 59.9 s | 5,630 ms | 0.000 |

> Performance dev-server scores are dramatically lower than production: Vite dev servers include
> the HMR runtime client, serve un-minified modules, and do not tree-shake or code-split.
> Production Performance scores (post `pnpm run build`) are typically 3–5× higher.
>
> Note: `command` was measured by starting its Vite dev server manually on port 15000 (its workflow
> lacks the shared-proxy plugin that other artifacts use to open port 9090).

---

## Historical Baseline Thresholds (2026-04-21)

| Category | Historical warn ≥ | Passing (10/10) | Needs attention |
|----------|:------:|:---------------:|:----------------|
| Performance | 70 | — (dev numbers) | Validate against production builds |
| Accessibility | 85 | 10/10 ✓ (axe-core zero-violation baseline achieved) | — |
| Best Practices | 88 | 10/10 ✓ | All ≥ 89 |
| SEO | 85 | 10/10 ✓ | All ≥ 90 |

> **Note:** Lighthouse A11y scores are measured against dev-server builds and lag behind the
> axe-core baseline. The axe-core scan (`tests/e2e/a11y.spec.ts`) is the authoritative
> zero-critical/serious-violation gate. Lighthouse A11y scores for carlota-jo and
> lyte-command-center are expected to improve on the next production-build re-run after
> the contrast and link fixes from this baseline pass.

### Current Workflow Configuration (2026-08-26)

| Category | Current minimum | Workflow behavior |
|----------|:---------------:|-------------------|
| Performance | 80 | Advisory warning |
| Accessibility | 90 | Enforced error |
| Best Practices | 90 | Advisory warning |
| SEO | 90 | Advisory warning |

The current matrix in `.github/workflows/lighthouse.yml` covers `terra`, `vessels`,
`carlota-jo`, `sentra`, `counsel`, and `a11oy`, with one run per artifact. This section describes
workflow configuration, not a claim that the check is required by branch protection.

---

## A11y Scores by Artifact (Lighthouse dev-server snapshot)

| Artifact | A11y Score | axe-core (authoritative) |
|----------|:----------:|:------------------------:|
| aegis | 95 | ✅ 0 violations |
| carlota-jo | 82 | ✅ 0 violations |
| command | 88 | ✅ 0 violations |
| counsel | 89 | ✅ 0 violations |
| lyte-command-center | 84 | ✅ 0 violations |
| pulse | 100 | ✅ 0 violations |
| sentra | 89 | ✅ 0 violations |
| szl-holdings | 89 | ✅ 0 violations |
| terra | 86 | ✅ 0 violations |
| vessels | 91 | ✅ 0 violations |

The historical axe-core record reports no critical or serious violations across the measured
artifacts. It is a point-in-time accessibility record, not canonical platform-wide evidence.
See `audit/a11y/findings.md` for full remediation history.

---

## Open Performance Issues

### PERF-001 — vessels high TBT (dev)
- **Observed (dev):** TBT 5,630 ms
- **Root cause:** Likely heavy Mapbox GL / deck.gl synchronous main-thread load
- **Remediation:** Defer map initialisation; use dynamic `import()` for deck.gl layers
- **Target:** Q2 2026

### PERF-002 — aegis high LCP (dev)
- **Observed (dev):** LCP 108.8 s; TBT 2,220 ms
- **Root cause:** Three.js / Framer Motion animation libs load synchronously
- **Remediation:** Dynamic `import()` for 3D scene; load on viewport-enter
- **Target:** Q3 2026

### PERF-003 — lyte-command-center CLS 0.14
- **Observed:** CLS 0.140 (above 0.10 threshold)
- **Root cause:** Layout shift from async data load causing reflow
- **Remediation:** Reserve space for async content with `min-height` / skeleton placeholders
- **Target:** Q2 2026

---

## How to Reproduce

```bash
# Dev-server measurement (what these baselines represent)
artifact=szl-holdings
CHROMIUM=/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium
LHCI=/home/runner/workspace/.config/npm/node_global/bin/lhci

# Start dev server (get port from workflow log)
port=21130

$LHCI collect \
  --url="http://localhost:$port/" \
  --numberOfRuns=1 \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu --ignore-certificate-errors --disable-dev-shm-usage" \
  --chromePath="$CHROMIUM"

# Production measurement (CI workflow)
pnpm --filter=@workspace/$artifact run build
SERVE=$HOME/.npm/_npx/aab42732f01924e5/node_modules/.bin/serve
$SERVE artifacts/$artifact/dist/public -p 19876 --single &
sleep 3
$LHCI collect --url="http://localhost:19876/" --numberOfRuns=3 \
  --chrome-flags="--headless=new --no-sandbox --disable-gpu --ignore-certificate-errors"
```

CI (`.github/workflows/lighthouse.yml`) runs production builds automatically on every PR
and uploads reports as GitHub Actions artifacts (14-day retention).
