# Live vs Demo Data Matrix
**Audit Date:** April 19, 2026

> **Policy:** All demo data is explicitly labeled as seeded scenario data. No silent mocks. Live data sources are identified with provenance.

## Data Source Classification

| Surface | Data Source | Classification | Label Shown | Provenance Displayed | Notes |
|---|---|---|---|---|---|
| Lyte — Overview | Seeded (Vantex Acquisition narrative) | **SCENARIO** | Y (LYTE-SEED-v2) | Y | 6 critical signals, 47-signal feed |
| Lyte — Signals Console | Seeded | **SCENARIO** | Y | Y | Vantex Acquisition chain |
| Lyte — Decision Twin | Seeded | **SCENARIO** | Y | Y | Monte Carlo simulation |
| Lyte — Entity Graph | Seeded | **SCENARIO** | Y | Y | |
| Alloy — Policy Compiler | Seeded + live compilation | **LIVE (compilation engine)** | Y | Y | NLP→policy is live; policies are demo |
| Alloy — Workflow Canvas | Seeded | **SCENARIO** | Y | Y | |
| Alloy — Audit Trail | Seeded | **SCENARIO** | Y | Y | |
| Terra — Property Map | NYC Open Data + seeded | **LIVE (NYC OD) + SCENARIO** | Y | Y | Mapbox token configured |
| Terra — Why This Property Now | Seeded (with live scoring) | **SCENARIO** | Y | Y | Scoring engine is live |
| Terra — Ownership Graph | Seeded | **SCENARIO** | Y | Y | |
| Terra — NYC OD Ingestion | NYC Open Data (CC0) | **LIVE** | Y | Y | City-provided, no restrictions |
| Aegis — Threat Intelligence Feed | STIX/TAXII (public MISP) + seeded | **LIVE + SCENARIO** | Y | Y | Public MISP feed active |
| Aegis — Sanctions Screening | OFAC/EU/UN (live polling) | **LIVE** | Y | Y | 21600s poll interval |
| Aegis — SIEM Incidents | Seeded | **SCENARIO** | Y | Y | SIEM connectors stubbed |
| Aegis — Adversary Narrative | Seeded | **SCENARIO** | Y | Y | |
| Vessels — AIS Tracking | Demo AIS | **DEMO** | Y | Y | MarineTraffic API key not set |
| Vessels — Sanctions Screening | OFAC/EU/UN (live polling) | **LIVE** | Y | Y | |
| Vessels — Voyage Risk Twin | Seeded | **SCENARIO** | Y | Y | |
| Carlota Jo — Client Dossiers | Seeded | **SCENARIO** | Y | Y | |
| Carlota Jo — Service Requests | Seeded | **SCENARIO** | Y | Y | |
| Command — Cross-Platform | Seeded | **SCENARIO** | Y | Y | |
| Pulse — Briefings | Seeded | **SCENARIO** | Y | Y | AI generation pending live connection |

## Live Data Sources Active in Production

| Source | Domain | Update Frequency | Auth Required | Status |
|---|---|---|---|---|
| NYC Open Data | Terra | On-demand ETL | No (CC0) | Active |
| STIX/TAXII (MISP) | Aegis | 900s poll | No (public feed) | Active |
| OFAC SDN List | Aegis + Vessels | 21600s poll | No (public) | Active |
| EU Consolidated List | Aegis + Vessels | 21600s poll | No (public) | Active |
| UN Security Council List | Aegis + Vessels | 21600s poll | No (public) | Active |
| Stripe (test mode) | Platform | Real-time | Test keys | Active |
| NVD CVE Feed | Aegis | On-demand | No (public) | Dormant |
| CISA KEV | Aegis | On-demand | No (public) | Dormant |

## Demo Scenarios Used

| Scenario ID | Domain | Description | Surfaces |
|---|---|---|---|
| LYTE-SEED-v2 | Lyte / Alloy | Vantex Corp Acquisition — $4.2M / 47-day stalled approval | Lyte, Command, Alloy |
| TERRA-DEMO-01 | Terra | NYC distressed property portfolio — 847 properties scored | Terra |
| AEGIS-INC-2026-001 | Aegis | Phantom Purple — APT credential harvest campaign | Aegis |
| VESSELS-DEMO-01 | Vessels | Gulf of Aden route anomaly — 3 vessels flagged | Vessels |
| CJ-DEMO-01 | Carlota Jo | 8 VIP households, Q2 service calendar | Carlota Jo |
