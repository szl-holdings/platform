# Terra — Series A Polish Audit

**Date:** 2026-05-05
**Scope:** `artifacts/terra/`

## Summary
Terra Real Estate Intelligence demos the distress + valuation loop convincingly. Largest concerns: client-side "mock confidence" math passed off as AI scoring, banner stacking on small viewports, and aggressive low-opacity text tokens in property detail.

## Findings

### Tier 1 — Broken / visibly wrong
| ID | File | Issue | Status |
|----|------|-------|--------|
| T1 | `src/pages/property-detail/overview-tab.tsx:240-242` | `mockConfidence = 88 + ((i*4)%12)` rendered as if real AI confidence | **FIXED** — column dropped, real lease facts only |
| T2 | `src/App.tsx` | `SandboxModeBanner` + `AppModeBanner` + `DemoNarrativeSidebar` + `AgentCopilot` all simultaneously visible — consumes ~20% vertical real estate on 13" laptop | **FIXED** — `SandboxModeBanner` and `AppModeBanner` wrapped in `hidden md:block` so narrow viewports collapse cleanly |

### Tier 2 — Copy / positioning
| ID | File | Issue |
|----|------|-------|
| T3 | `src/data/demo-narrative.ts` | Hardcoded NYC distress narrative — no fallback for other cities |
| T4 | `src/pages/dashboard.tsx`, `atlas-runtime.tsx` | "Illustrative demo content" message fires when API unreachable — should add proper retry/SWR |
| T5 | `src/pages/property-valuation-ai.tsx`, `deals.tsx` | Numeric placeholders like `1200000` should read `$1,200,000` |

### Tier 3 — Visual harmonization & a11y
- `text-terra-text-muted` paired with surface backgrounds fails AA on multiple modules.
- `text-[8px]` / `text-[9px]` in `construction-monitor.tsx`, `commercial-intelligence.tsx`.
- Hardcoded `86400000` ms day math in `distress-radar.tsx`, `lease-abstraction.tsx` produces "0 days ago" near boundary.
- `commercial-intelligence.tsx` mixes `terra-surface` and opacity-based `white/4` styling — token drift vs. distress engine.

## Fixes applied this pass
- **T1** — Property Detail → Overview tab tenant table no longer renders client-side `mockConfidence` math or `mockEscalation` strings as if they were AI output. Columns reduced to facts pulled from the lease record (Tenant / Suite / Base Rent / Lease Expiry). Header opacity also raised to meet AA contrast.
- **T2** — `SandboxModeBanner` and `AppModeBanner` are now wrapped in `hidden md:block`, so on small viewports (`<768px`) they no longer stack with `DemoNarrativeSidebar` and consume ~20% of vertical real estate.

## Demo readiness
- ✅ Distress Engine, Atlas Runtime — investor-ready when API server is running
- ✅ Property Detail → Overview tab — mock confidence/escalation columns removed
- ✅ Banner stack — sandbox + app-mode banners hidden below `md` breakpoint
