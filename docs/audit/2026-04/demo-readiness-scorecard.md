# SZL Holdings — Demo Readiness Scorecard
**Audit date:** April 18, 2026  
**Seven gates:** Truthfulness · Reliability · Data Integrity · Security · Observability · Demo Readiness · Release Discipline  
**Grading:** A = production-ready | B = demo-ready with caveats | C = presentable with clear labeling | D = significant gaps | F = not presentable

---

## Grading Key

| Grade | Meaning |
|---|---|
| A | Gate is fully satisfied; no blockers |
| B | Gate is mostly satisfied; minor gaps or caveats noted |
| C | Gate is partially satisfied; presenter must manage expectations |
| D | Gate has significant gaps; not advisable to demo this gate |
| F | Gate is not met; do not expose to investors or prospects |

---

## Scorecards

### API Server (`api-server`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | B | Claims in health endpoint are accurate; route count and auth coverage are documented honestly |
| Reliability | B | Single-process Express on real PostgreSQL; no job queue persistence; session store is DB-backed (gap closed) |
| Data Integrity | A | Tenant isolation enforced; Drizzle ORM migrations tracked; no cross-org leakage in design |
| Security | C | Auth enforced on 155/170 routes (91%); Zod validation on only 21/170 (12%) — material risk |
| Observability | C | Sentry SDK present; external uptime monitor setup documented but not confirmed live |
| Demo Readiness | A | Health endpoint, CSRF, versioned routes all work; seed scripts produce consistent state |
| Release Discipline | C | No integration tests in CI; manual deploy; no canary/rollback automation |

**Overall: C+** — Backend is solid structurally; validation gap is the biggest risk before enterprise demos.

---

### SZL Holdings (`szl-holdings`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | D | 4 of 8 tracked claims are unverified (52K vessels, 2.4M signals, 31,200 sims, 34-day lead time); no live instrumentation |
| Reliability | B | React app loads; OIDC auth works; live feeds (CISA, BLS) are real |
| Data Integrity | C | Dashboard KPIs are seed data; no demo badge on primary KPI strip |
| Security | B | OIDC auth in place; admin tools behind auth; leftover backup files present (P2-012) |
| Observability | C | No error boundary telemetry confirmed; generic empty states not universally applied |
| Demo Readiness | C | Decision Theater is interactive and impressive; hardcoded KPIs break credibility under scrutiny |
| Release Discipline | C | No CI integration tests; leftover admin imports flagged in open tasks |

**Overall: C** — The flagship needs its hardcoded claims replaced or properly labeled before investor demos.

---

### Carlota Jo (`carlota-jo`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | C | Live integrations (World Bank, BLS, HBR, Outlook) are real; 98% retention and 18-yr experience are unverified hardcoded claims |
| Reliability | A | GA status; no reported blockers; booking workflow and OIDC work |
| Data Integrity | C | Consulting OS (Engagement P&L, capacity, client health) is entirely hardcoded fixture data with no demo label |
| Security | A | Full OIDC auth; no known auth gaps reported |
| Observability | B | `sentinel-analytics` integrated; conversion events confirmation pending |
| Demo Readiness | B | Most complete artifact; impressive advisory UI; Consulting OS fixture data needs labeling |
| Release Discipline | A | GA; no blocking issues; best-maintained artifact |

**Overall: B** — Closest to demo-ready; fix truthfulness gaps in retention/experience claims and label Consulting OS data.

---

### Pulse (`pulse`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | B | Real AI model call when keys are present; fallback synthesis is not labeled in UI (P1-004) |
| Reliability | B | DB writes are real; briefing generation is live; fallback prevents blank screen |
| Data Integrity | B | Real PostgreSQL for dissents and custom briefs; demo briefings clearly marked in route code but not UI |
| Security | B | OIDC auth on all routes; no known gaps |
| Observability | C | Nuro Mesh system health page exists but depends on mock agent status data |
| Demo Readiness | B | Most compelling AI feature; PDF export dead button (P2-008) is a presentation risk |
| Release Discipline | C | No CI tests; PDF export stub not removed from UI |

**Overall: B-** — High value demo feature; fix the silent fallback label and the dead PDF button.

---

### Aegis (`aegis`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | C | CISA/NVD/MITRE feeds are real and impressive; 8 new modules are stubs; "200+ ATT&CK" claim is aspirational |
| Reliability | B | Core SOC modules load and wire to real security feeds |
| Data Integrity | C | Scenario and event data is seeded; no demo labels on scenario-driven views |
| Security | B | OIDC auth; no known gaps reported |
| Observability | D | CISO Executive Dashboard not yet aggregated; no cross-module observability |
| Demo Readiness | C | Core cyber threat intelligence is presentable; 8 unwired modules must be hidden or labeled |
| Release Discipline | C | Investor pitch deck (same artifact directory) mixes demo app with static slides — structural risk |

**Overall: C** — Strong real feeds; hide unwired modules behind flags before demos.

---

### Terra (`terra`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | C | NYC Open Data distress pipeline is live and the real differentiator; portfolio CRM is seed data |
| Reliability | C | Maps are blank (Mapbox token missing) — a visible failure in demos |
| Data Integrity | B | `DataProvenance` component shows live/demo status per module — best practice in codebase |
| Security | B | OIDC auth; no known gaps |
| Observability | C | No confirmed event tracking for terra-specific conversion actions |
| Demo Readiness | D | Blank maps are a demo-killer; fix Mapbox token before any presentation |
| Release Discipline | C | No MLS/CoStar integration; market data views are seed data |

**Overall: C-** — Set the Mapbox token; Terra's live distress data is the genuine differentiator and should anchor demos.

---

### Vessels (`vessels`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | C | NOAA/Open-Meteo/GDELT are live; AIS is explicitly labeled as simulated; "52K vessels" claim on parent site is not labeled |
| Reliability | C | 3 commercial modules are stubs; core fleet/voyage views load |
| Data Integrity | B | `DemoModeBanner` for AIS is honest and clear |
| Security | B | OIDC auth; cross-tenant vessel isolation enforced |
| Observability | D | No voyage replay or dark fleet detection confirmed as live; predictive maintenance is seed data |
| Demo Readiness | C | Core voyage economics and sanctions screening are presentable; hide stub modules |
| Release Discipline | D | No AIS subscription; no ML-backed predictive maintenance; commercial modules are shells |

**Overall: C-** — Vessels is the most over-claimed artifact. Scope demos to sanctions screening and voyage economics; be explicit about AIS.

---

### Command (`command`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | D | All dashboard KPIs and badge counts are seed data; "99.98% uptime" on status page is fabricated |
| Reliability | B | UI loads; Governed Decision Loop wires to api-server |
| Data Integrity | D | No live data integration for cross-domain badge counts; business-data.ts is entirely fixture |
| Security | B | OIDC auth; no known gaps |
| Observability | D | No live metric aggregation across domains |
| Demo Readiness | C | Governed Decision Loop is the compelling piece; everything else is theater |
| Release Discipline | D | Status page with hardcoded uptime is actively misleading if presented as real |

**Overall: D+** — Govern the Command demo scope: lead with Governed Decision Loop only. Remove or clearly badge everything else before investor use.

---

### SZL Holdings Mobile (`szl-holdings-mobile`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | C | Core screens are wired; push notification deep links not implemented |
| Reliability | B | Expo build is functional; OIDC auth works |
| Data Integrity | C | Pulls from same seeded API as web; no mobile-specific demo labeling |
| Security | B | Biometric auth documented; OIDC in place |
| Observability | D | No mobile-specific crash reporting confirmed |
| Demo Readiness | C | Functional but lacks polish (default splash/icon, no push links) |
| Release Discipline | C | Beta status is accurate; App Store submission not started |

**Overall: C** — Functional demo platform; not App Store ready.

---

### Mockup Sandbox / NEXUS (`mockup-sandbox`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | B | Clearly an internal prototype; no inflated claims |
| Reliability | C | Prototype quality; API stubs not production-backed |
| Data Integrity | C | Research and ingestion are prototype workflows |
| Security | D | Listed as Internal but registered at `/nexus/` with no auth guard confirmed |
| Observability | F | No telemetry; internal tool |
| Demo Readiness | D | Not a customer-facing demo surface |
| Release Discipline | F | Not a product; should not be in public preview path |

**Overall: D** — Move off public preview path or add auth guard.

---

### SZL Demo Video (`szl-demo-video`)

| Gate | Grade | Justification |
|---|---|---|
| Truthfulness | C | Contains unverified stats (31,200+ sims, 200+ ATT&CK) in video overlay |
| Reliability | A | Static video artifact; loads reliably |
| Data Integrity | B | Video medium makes claim verification less urgent; $4.2B labeled as AUM (demo context) |
| Security | A | No auth required; read-only static asset |
| Observability | N/A | Not applicable for video artifact |
| Demo Readiness | B | High-production value; stats should be reviewed before investor use |
| Release Discipline | B | No active development; stable |

**Overall: B-** — Review stat claims before investor presentations.

---

## Summary Table

| Artifact | Truthfulness | Reliability | Data Integrity | Security | Observability | Demo Readiness | Release Discipline | Overall |
|---|---|---|---|---|---|---|---|---|
| api-server | B | B | A | C | C | A | C | **C+** |
| szl-holdings | D | B | C | B | C | C | C | **C** |
| carlota-jo | C | A | C | A | B | B | A | **B** |
| pulse | B | B | B | B | C | B | C | **B-** |
| aegis | C | B | C | B | D | C | C | **C** |
| terra | C | C | B | B | C | D | C | **C-** |
| vessels | C | C | B | B | D | C | D | **C-** |
| command | D | B | D | B | D | C | D | **D+** |
| szl-holdings-mobile | C | B | C | B | D | C | C | **C** |
| mockup-sandbox | B | C | C | D | F | D | F | **D** |
| szl-demo-video | C | A | B | A | N/A | B | B | **B-** |
