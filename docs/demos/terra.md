# Terra — Real Estate Intelligence: Demo Script

**Duration:** 6–8 minutes  
**Persona:** Marcus Holt (Apex Capital) — real estate investment decision-maker  
**URL:** `/terra/`  
**Pre-requisite:** Demo seed loaded; NYC distress pipeline running; Mapbox token configured (if showing map)

---

## Pre-Demo Checklist

- [ ] Distress radar shows properties with active distress signals
- [ ] 1847 Flatbush Ave visible at top of distress queue (compounded: lis pendens + tax lien)
- [ ] Portfolio performance page shows seeded portfolio positions
- [ ] **If showing map:** confirm `MAPBOX_ACCESS_TOKEN` is set in secrets; map renders NYC tiles

> **If Mapbox token is NOT set:** Skip the distress map view. Show the distress table and property detail instead. Do NOT show a blank map.

---

## Step 1 — Dashboard Overview (1 min)

**URL:** `/terra/`

> "Terra is the real estate intelligence layer. The moment you open it, you see the portfolio health, active distress signals, and the properties that need attention today."

Point to the distress signal count and portfolio value at risk.

> "These numbers come from a live pipeline connected to NYC public records — lis pendens filings, tax lien certificates, deed transfers. The pipeline runs on a 24-hour schedule."

---

## Step 2 — Distress Radar (3 min)

**URL:** `/terra/distress`

> "The distress radar is the core of Terra. Every property with an active distress signal is plotted here — ranked by compound distress score."

Point to **1847 Flatbush Ave** at the top of the list.

> "This property has a compound signal: a lis pendens filed 12 days ago AND a tax lien from a delinquent municipal service provider. Either signal alone is a yellow flag. Together, they're a red flag."

Click the property to open the detail view.

> "Owner name, lien amount, filing date — all from NYC public records, pulled and enriched nightly. No manual research. A deal team can action this before the competition even finds it."

Point to the **Distress Score** breakdown.

> "The score is not a black box. Each component is shown: lien severity, days since filing, ownership transfer history. Auditors can trace every number."

*If Mapbox is configured:* Show the map view.

> "And here's the property on the map — plotted against the borough distress heat map. You can see the concentration of signals in specific census tracts."

---

## Step 3 — Portfolio View (2 min)

**URL:** `/terra/portfolio`

> "The portfolio view shows your current positions — acquisition cost, current estimate, maturity dates, and distress proximity."

Point to the three positions approaching maturity.

> "Three of our 12 positions have maturity dates in the next 90 days. Terra flagged this to Command two weeks ago. The CFO already has a disposition decision in the approval queue."

---

## Step 4 — Broker CRM (1 min)

**URL:** `/terra/broker-crm`

> "Terra integrates with the broker relationship layer. Every broker contact, active listing, and referral history is tracked here — no separate CRM."

---

## Avoidance Guide

- Do NOT show the map if `MAPBOX_ACCESS_TOKEN` is not set — show blank is worse than skipping
- Do NOT present broker CRM data as live — it is seeded
- Spatial Walkthrough and Scenario Branches are demo surfaces backed by seeded scene data — frame as "the AI scenario engine, powered by ATLAS"

---

## Questions to Anticipate

**"Is the NYC data really live?"**  
> "Yes — we ingest directly from NYC Open Data: ACRIS (deed transfers), DCAS (tax liens), Supreme Court eCourts (lis pendens). The pipeline runs nightly. The owner names and lien amounts you're seeing were last updated 6 hours ago."

**"How often does the distress score update?"**  
> "The score recalculates every time a new record is ingested — typically daily. We're working toward intraday ingestion for high-velocity filings."

**"Can this work for other markets outside NYC?"**  
> "The ingestion framework is market-agnostic — we chose NYC first because of the data quality. Adding a new market requires mapping the local court / recorder API to our schema. We're scoping Miami and LA for Q3."
