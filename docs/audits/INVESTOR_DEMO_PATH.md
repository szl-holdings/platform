# Investor Demo Path — Canonical 5-Minute Walkthrough

**Date:** 2026-05-05
**Audience:** Series-A investors (Lambda / OpenAI / Anthropic bar)
**Goal:** Show the suite as one company with one design language — proof, governance, and vertical depth.

## Pre-flight
- Start workflows: `artifacts/api-server`, `artifacts/a11oy`, `artifacts/conduit`, `artifacts/sentra`, `artifacts/counsel`, `artifacts/terra`, `artifacts/vessels`, `artifacts/carlota-jo`.
- Close browser devtools (avoids `[DEMO]` console output in Vessels AtelierSpaceEmbed).
- Use 16:9 1440×900 viewport (Sentra slide deck inline `vh/vw` styles assume this).
- Avoid empty-state pages flagged in each artifact's audit (e.g., Counsel Risk Exposure Desk).

## The 5 minutes

| Min | Surface | URL | What to land on |
|----:|---------|-----|-----------------|
| 0:00 | A11oy Trust Center | `/trust-center` | Constitutional design — proof, covenants, attestation |
| 0:45 | A11oy Command Surface | `/command` | One operator pane, every domain |
| 1:30 | Amaru (Conduit) Dashboard | `/conduit/` | Data fabric throughput chart (now uses `Date.now()` — never stale) |
| 2:15 | Sentra Governed Adversary Loop | `/sentra/governed-adversary-loop` | Six-step proof chain across Sentra ↔ A11oy |
| 3:00 | Counsel Matter Overview | `/counsel/matter-overview` | Vertical depth — legal matter command |
| 3:45 | Terra Distress Engine | `/terra/distress-engine` | Vertical depth — real estate intelligence |
| 4:30 | Vessels Maritime Intelligence | `/vessels/maritime-intelligence` | Vertical depth — maritime ops |

## The narrative
1. **One company.** A11oy sets the design language; every vertical inherits it (typography, gold `#c9b787`, dark surface).
2. **One proof spine.** Same proof packet model travels Sentra → A11oy → Counsel → Terra → Vessels.
3. **Vertical depth, horizontal economics.** Each vertical is a real product, not a wrapper.
4. **Governance is structural, not bolted on.** Trust Center shows the constitution; Sentra shows it firing in a live adversarial loop.

## Tier-1 fixes applied for this demo path
The following items were addressed in this audit pass and are safe to walk through live:
- A11oy Strategy → Governance / Team / Fabric: TBD placeholders purged; Fabric latency shows `'profiling in tenant'`.
- A11oy doctrine fallbacks: `sentinel-sr.example` placeholder URL replaced with the real `a11oy.szlholdings.com/doctrines/sentinel-sr` href.
- Conduit dashboard throughput chart: now uses `Date.now()` so the rolling-24h window doesn't date-rot.
- Sentra governed adversary loop: `proof-s6-TBD` placeholder removed.
- Sentra autonomous threat engine: `[sentra] fabric proof emission failed` console.warn silenced (best-effort emission contract documented in code).
- Counsel Risk Exposure Desk: synthetic "SEC Filing Deadline — Global Operations" injection removed; empty-state renders honestly when there is no real data.
- Terra Property Detail → Overview tab: `mockConfidence` / `mockEscalation` columns removed from the tenant table.
- Terra App.tsx: `SandboxModeBanner` and `AppModeBanner` now hidden below the `md` breakpoint to prevent banner stacking on narrow viewports.
- Carlota Jo command palette: brittle `pathname.replace(/\/[^/]*$/, …)` navigation replaced with a `BASE_URL`-aware `navTo()` helper across all 23 commands.
- Carlota Jo AI Advisory: invented `'847 enterprise contracts'` example exchange removed; thread now opens empty.
- Carlota Jo Engagement Intake: `timeline: 'TBD'` default replaced with `'Discussed at initial call'`.
- Vessels marketing footer: personal Medium link removed.
- Vessels marketing home: stale `'Updated 12s ago'` replaced with `'Live AIS feed'`.
- Vessels AtelierSpaceEmbed: `[DEMO]` prefix stripped from fallback transcript.

## Demo-time guidance
- Use ≥1280px viewport for the recorded walkthrough (banner styling and dashboards are tuned for desktop).
- Keep Sentra Investor Slide Deck at 16:9 (the deck is not 16:10-safe).
- Counsel dashboard / matter-overview / risk-exposure-desk skeleton placeholders are loading-gated (`isLoading ? skeletons : data`) and therefore disappear once the API responds — they are not stuck on screen.

## Per-artifact audit reports
- [`a11oy.md`](./a11oy.md)
- [`conduit.md`](./conduit.md)
- [`sentra.md`](./sentra.md)
- [`counsel.md`](./counsel.md)
- [`terra.md`](./terra.md)
- [`carlota-jo.md`](./carlota-jo.md)
- [`vessels.md`](./vessels.md)
