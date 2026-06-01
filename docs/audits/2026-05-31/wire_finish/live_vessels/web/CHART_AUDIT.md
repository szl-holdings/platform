# Vessels — Page → Chart → Data Contract → Route → Table

Working document for step 3 of project task #5181. Every page in
`artifacts/vessels/src/pages/` is listed in one of three buckets:

- **operator** — must render a chart with real numerics on first paint.
- **editorial** — marketing / landing / legal; exempt from the chart rule.
- **utility** — settings / billing / team panels; chart only where it
  carries information (e.g. usage billing).

The audit captures the current state and the target state. Implementer
agents work down this table.

Legend: ✅ already real • ⚠️ partial / mocked • ❌ stub / placeholder.

## Operator pages — core (from #5180 plan)

| Page | Chart(s) | Data contract | Route | Table | Status |
|---|---|---|---|---|---|
| `risk-scoring.tsx` | composite Λ KPI, per-driver bars, 90-day trend | `VesselRiskScoreSnapshot`, `VesselRiskScoreHistoryPoint` | `GET /api/vessels/risk-score/:vesselId`, `POST .../recompute` | `vessel_risk_scores` | ❌ stub (hardcoded `riskTrend`) |
| `bunkering.tsx` | station price grid, vessel→station ETA, quote breakdown | `BunkerStation`, `BunkerQuote` | `GET /api/vessels/bunkering/stations`, `POST .../quote` | `bunker_stations` | ❌ uses `MOCK_BUNKER_STATIONS` |
| `route-anomaly-engine.tsx` | live SSE feed, severity histogram, type breakdown | `RouteAnomaly` | `GET /api/vessels/anomalies?vesselId=`, `POST .../resolve`, `SSE .../stream` | `vessel_route_anomalies` | ⚠️ in-memory only |
| `voyage-desk.tsx` | recent voyage analyses, P&L distribution | `VoyageCalculation` | `POST /api/vessels/voyage-calc/compute`, `GET .../history` | `voyage_calculations` | ⚠️ compute is real, no persistence |
| `voyage-calculator.tsx` | inputs → outputs panel, Monte Carlo cost distribution | `VoyageCalculation`, `VoyageMonteCarloRun` | as above + `POST .../monte-carlo` | as above | ⚠️ no MC yet |
| `voyage-economics.tsx` | weekly P&L bars, exposure pie | `VoyageCalculation` aggregation | `GET /api/vessels/voyage-calc/aggregate` | as above | ❌ stub |
| `voyage-pnl.tsx` | per-voyage P&L table with sparkline column | `VoyageCalculation` row | reuses history | as above | ❌ stub |
| `voyage-twin.tsx` | scenario branches with delta charts | `VoyageCalculation` × scenarios | `POST .../scenario` | as above + `voyage_scenarios` | ❌ stub |
| `voyage-risk-twin.tsx` | risk-overlay onto twin | composite of risk + voyage | reuses both | both | ❌ stub |
| `voyage-carbon-passport.tsx` | CO2 timeline | `VoyageCarbonRow` | `GET /api/vessels/carbon/:voyageId` | `voyage_carbon` | ⚠️ partial |
| `vessel-detail-enhanced.tsx` | KPI strip, recent decisions, anomaly feed | composite | several | several | ⚠️ KPIs real, panels stubbed |
| `vessel-detail.tsx` | legacy single-page detail | as above | as above | as above | ⚠️ partial |
| `vessels-list.tsx` | sortable list with risk sparkline column | `VesselRow` + sparkline | `GET /api/vessels?include=riskSnapshot` | `vessels` + `vessel_risk_scores` | ⚠️ list real, sparkline missing |
| `sanctions-screening.tsx` | OFAC status badge, screen history | `SanctionsScreening` | `POST /api/vessels/sanctions/screen`, `GET .../history` | `vessel_sanctions_screening` | ⚠️ partial |
| `sanctions-heat.tsx` | geographic heatmap of hits | `SanctionsHeatCell` | `GET .../heat` | as above aggregated | ❌ stub |
| `sanctions-chain-explorer.tsx` | network graph of ownership chains | `SanctionsChainNode/Edge` | `GET .../chain/:vesselId` | `vessel_sanctions_network` | ⚠️ partial |
| `fleet-dashboard.tsx` | fleet KPI grid, top-risk strip | aggregations | `GET /api/vessels/fleet/summary` | composite | ⚠️ partial |
| `fleet-map.tsx` | live AIS markers, anomaly overlay | `AisPosition`, `RouteAnomaly` | `GET /api/vessels/positions/latest`, SSE stream | `vessel_positions` | ⚠️ partial |
| `ais-live-tracking.tsx` | per-vessel track + ghost trail | `AisTrackPoint` | `GET /api/vessels/track/:vesselId?since=` | `vessel_positions` | ⚠️ partial |
| `alert-center.tsx` | alert table + severity distribution | `Alert` | `GET /api/vessels/alerts` | `vessel_alerts` | ⚠️ partial |
| `exception-queue.tsx`, `exceptions-center.tsx` | open vs closed exception trend | `FleetException` | `GET /api/vessels/exceptions` | `fleet_exceptions` | ⚠️ partial |

## Operator pages — extended (audit pending)

The remaining ~80 operator pages live in the same bucket. Each needs the
same five-column row filled in. Tracked as work for the implementer
agents under step 3 of #5181:

`agent-insights, ais-decode, applied-intelligence, atlas-*, audit-log-panel,
autonomous-routing, benchmarks, blockchain-bol, bunker-optimizer,
cargo-tracking, charter-party, co2-emissions, command-*, commodities-tracking,
commodity-flow-intelligence, constellation, corridor-routes, cortex-*,
counterparty-risk-map, cps-lane-console, crew-tracker, cyber-threat-panel,
dark-fleet-economics, dark-vessel-detection, decarbonization, decision-center,
demurrage, digital-twin, disruption-forecast, document-engine, evidence,
field-atlas, fleet-apm, fleet-assessment, fleet-what-changed, forecast,
freight-rates, geo-decision-center, governed-cockpit, incident-reporting,
infrastructure, insurance-panel, intelligence(-briefs), logs-explorer,
maintenance-readiness, maritime-intelligence, observability,
owner-cargo-graph, performance-analytics, piracy-sanctions, platform,
port-analytics, port-congestion, port-twin, predictive-maintenance,
psc-inspector, pulse, replay, risk-simulation, route-planning, route-risk,
satellite-rf-intelligence, scenario-branches, simulations-page, sts-detection,
synthetics-compliance, trade-flow-heatmap, trading-desk, trust-provenance,
vessels-approval-review, weather-page, weather-routing`

## Editorial pages (exempt from chart-on-first-paint)

`marketing-home, marketing-platform, marketing-capabilities,
marketing-pricing, marketing-security, marketing-use-cases, marketing-demo,
marketing-sign-in, vessels-landing, vessels-home, legal-privacy,
legal-terms, med-shadow-fleet-case-study, intelligence`

These pages carry one live KPI strip pulled from the same operator
backend, per the `Editorial` template in `DESIGN_SYSTEM.md`.

## Utility pages

`settings, team-panel, billing-panel, account-billing, digital-experience`

Chart only where it carries information (billing usage trend, team
activity sparkline).

## Acceptance per row

A row is "done" when:
1. The TS contract type is exported from `artifacts/vessels/src/types/contracts/`.
2. The route returns that shape on a fresh DB (seeder plants enough rows).
3. The page renders the chart with real numerics on first paint.
4. The chart token system (`ChartFrame`) is applied.
5. If a formula drives a number on the page, `ShowTheMath` is wired and
   compute emits a receipt.

## How to use this file

Implementer agents claim rows from the table, land the work behind a
single page-scoped PR, and tick the status column. The PM agent uses
the count of ❌ → ⚠️ → ✅ transitions per week as the progress signal.
