# Screenshot QA Report — Task #3473

**Generated:** 2026-04-25 (updated from 2026-04-25 initial draft)
**Phase:** Investor-grade screenshot audit and capture execution

---

## Status

**A11oy screenshots: 95 captures delivered** (19 routes × 5 viewports each — complete coverage).
All 95 captures are PNG, unmodified, with `data-screenshot-ready="true"` hook confirmed active on each. Three routes (workcells, workcell-replay, investor-demo) initially had only desktop captures due to intermittent hook timeouts; the 4 remaining viewports per route were re-captured in a follow-up pass. Two captures for operator-control-plane (linkedin-square and linkedin-portrait) were also completed in a follow-up pass. All 19 routes now have complete 5-viewport coverage.

**Artifact hero screenshots (7 surfaces):** Verified `.jpg` captures from 2026-04-21 are present, renamed to kebab-case + date suffix standard. These represent the current best captures for command/aegis/sentra/pulse/counsel/terra/vessels surfaces, which share port 9090 with the A11oy workflow and cannot run concurrently in this environment. Artifact heroes will be re-captured when each artifact workflow is started independently.

---

## A11oy Screenshots — Route Coverage

All 19 A11oy routes verified at `HTTP 200` via curl, confirmed in `audit/ROUTE_AUDIT_REPORT.md`.

| Route | Desktop | Wide | Social | Sq | Portrait | Notes |
|-------|---------|------|--------|----|----------|-------|
| `/a11oy/` (hero) | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/boardroom-mode` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/command-surface` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/proof-ledger` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/signal-mesh` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/brands` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/token-system` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/connectors` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/voice-library` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/component-registry` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/a11y-governance` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/evolution-radar` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/brand-detail` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/dag` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/execution-history` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/operator-control` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 |
| `/a11oy/workcells` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 (follow-up) |
| `/a11oy/workcell-replay` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 (follow-up) |
| `/a11oy/investor-demo` | ✅ | ✅ | ✅ | ✅ | ✅ | 5/5 (follow-up) |

**Total A11oy:** 95 captures × PNG, all with hook confirmation.

---

## Artifact Hero Screenshots — Current State

| File | Artifact | Captured | Format | Notes |
|------|----------|----------|--------|-------|
| `szl-holdings-dashboard-2026-04-21.jpg` | SZL Holdings Dashboard | 2026-04-21 | JPG | Verified present |
| `kora-praxis-command-2026-04-21.jpg` | KORA — PRAXIS Command | 2026-04-21 | JPG | Verified present |
| `sextant-fleet-command-2026-04-21.jpg` | SEXTANT — Fleet Command | 2026-04-21 | JPG | Renamed with date suffix |
| `domaine-deal-pipeline-2026-04-21.jpg` | DOMAINE — Deal Pipeline | 2026-04-21 | JPG | Renamed with date suffix |
| `carlota-jo-client-portal-2026-04-21.jpg` | Carlota Jo — Client Portal | 2026-04-21 | JPG | Renamed with date suffix |
| `forge-command-portal-executive-2026-04-21.jpg` | FORGE Command Portal | 2026-04-21 | JPG | Renamed with date suffix |
| `tenax-soc-command-2026-04-21.jpg` | TENAX — SOC Command | 2026-04-21 | JPG | Renamed with date suffix |

> Note: Artifact workflows (aegis, command, sentra, pulse, etc.) share port 9090 with the A11oy workflow and cannot run concurrently in this Replit environment. These JPG captures from 2026-04-21 remain the current best heroes for each artifact. New PNG captures at all 5 viewports will be generated when each workflow is started independently.

---

## Screenshot-Ready Hook

The `data-screenshot-ready="true"` hook is set on `document.documentElement` after a 1500ms mount delay in `artifacts/a11oy/src/main.tsx`. All A11oy captures confirm the hook was active at capture time (no captures are written if the hook times out — fail-closed).

---

## Rankings (Current Screenshots)

**Best investor-grade A11oy surfaces:**
1. `a11oy-hero-*-desktop-1440.png` — Seven-layer fabric overview with live seed data
2. `a11oy-boardroom-mode-*-desktop-1440.png` — Executive decision surface with proof chain
3. `a11oy-proof-ledger-*-desktop-1440.png` — Cryptographic audit trail, 5 proof packets
4. `a11oy-command-surface-*-desktop-1440.png` — Cross-vertical operator command
5. `a11oy-investor-demo-*-desktop-1440.png` — Dedicated investor pitch view
