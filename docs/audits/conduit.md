# Amaru (Conduit) — Series A Polish Audit

**Date:** 2026-05-05
**Scope:** `artifacts/conduit/`

## Summary
The Andean Ouroboros cockpit demonstrates the data-fabric and Sovereign AI Hub story well. Largest risk is hardcoded "demo adapter" language in shipped copy and several Hub subpages that 404 against `/api/*` when API server is not proxied.

## Findings

### Tier 1 — Broken / visibly wrong
| ID | File | Issue | Status |
|----|------|-------|--------|
| C1 | `src/pages/dashboard.tsx:66` | `now` was hardcoded to `2026-05-05T03:55:00Z` — would freeze throughput chart after today | **FIXED** → `Date.now()` |
| C2 | `src/pages/sovereign-ai-hub/distillery.tsx` | Fetches `/api/fine-tuning/jobs`, `/api/ml/training/runs` — empty state when API server not running |
| C3 | `src/lib/shared.ts` (`fetchHub`) | Prepends `/api` — fails silently in static preview |

### Tier 2 — Copy / positioning
| ID | File | Issue |
|----|------|-------|
| C4 | `src/data/roadmap.ts:13` | "Source connectors (24 demo adapters, contract-typed)" leaks "demo" framing |
| C5 | `src/data/adapters.ts:4-6` | Comment "demo adapters here are deterministic stand-ins" — fine internally, but tone implies non-product |
| C6 | Search inputs (`sources.tsx`, `policies.tsx`, `outcomes.tsx`, `observability.tsx`) | Generic "Search…" placeholders inconsistent with rest of cockpit copy |

### Tier 3 — Visual harmonization
- Dashboard hero uses `-mx-6 -mt-6` to bleed glow; brittle if parent padding changes.
- `SyncsDetail` uses raw Lucide icons while Dashboard uses `FabricCard`/`FabricStat` primitives — visual weight drift.
- `A11OY_GOLD = '#c9b787'` constant duplicated locally in Hub; should consume the shared token.

## Fixes applied this pass
- **C1** — Throughput chart now uses `Date.now()` so the rolling 12-hour window stays current.

## Demo readiness
- ✅ Dashboard, Roadmap, Sources — investor-ready
- ⚠ Sovereign AI Hub subpages — only demo when API server workflow is running
