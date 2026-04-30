# Domain Pack System

**Last updated:** April 2026
**Purpose:** Define how domain packs compose on shared governance infrastructure

---

## Architecture

Domain packs are vertical intelligence applications built on shared platform primitives. The key insight from competitive research:

### Palantir Pattern
Palantir's Foundry modules (defense, healthcare, supply chain) all build on the same Ontology. The data model is shared; the domain logic is modular.

### Rippling Pattern
Rippling's HR, IT, Finance, and Benefits apps all share an employee record as the system of record. Platform capabilities (identity, permissions, workflows) are shared; domain logic is modular.

### SZL Pattern
SZL's domain packs (Aegis, Sentra, Vessels, Terra, Counsel, Carlota Jo) all build on six shared primitives. The governance infrastructure is shared; the domain intelligence is modular.

---

## Domain Pack Contract

Every domain pack must:

| Requirement | Description | Primitive |
|-------------|-------------|-----------|
| Publish signals | Domain-specific events through Event Fabric | PrismEventBus |
| Accept recommendations | AI-generated suggestions with source attribution | Agent Gateway |
| Support simulation | Domain-specific scenario definitions for Monte Carlo | Decision Simulation |
| Enforce policy | Domain-scoped policies through Covenant engine | Covenant Policy |
| Produce proof | Immutable records for every AI output and decision | Proof Chain |
| Track outcomes | Predicted vs. actual with variance metrics | Outcome Graph |

---

## Current Domain Packs

| Pack | Domain | Signal Types | Scenario Definitions | Policy Scope |
|------|--------|-------------|---------------------|-------------|
| Aegis | Defense & Intelligence | IDS alerts, SCADA events, threat intel | Threat response cost, incident timeline | aegis, global |
| Vessels | Maritime | AIS anomalies, sanctions hits, cargo events | Voyage cost, charter rate, fuel consumption | vessels, global |
| Terra | Real Estate | Property filings, market data, distress signals | Acquisition cost, renovation timeline, IRR | terra, global |
| Carlota Jo | Advisory Consulting | Client events, booking changes, deliverable status | Engagement cost, client satisfaction | carlota, global |

---

## Cross-Domain Correlation Value

The structural advantage of shared primitives: any signal from any domain can correlate with signals from any other domain.

| Correlation | Example | Value |
|-------------|---------|-------|
| Aegis + Vessels | Cyber intrusion at port + vessel AIS anomaly | Detects coordinated maritime-cyber threats |
| Terra + Counsel | Property filing + regulatory change | Identifies compliance-sensitive acquisitions |
| Vessels + Terra | Port congestion + waterfront property value | Reveals maritime-driven real estate opportunities |
| Aegis + IMPERIUM | Security event + infrastructure anomaly | Distinguishes attack from system failure |

No competitor offers cross-domain correlation across defense, maritime, real estate, legal, and consulting in a single governed platform.
