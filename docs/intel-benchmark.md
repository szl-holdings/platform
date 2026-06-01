# Intel Platform Benchmark — Champions Report

**Classification:** Internal · Product Intelligence  
**Date:** April 2026  
**Purpose:** Inform platform upgrades across SZL Holdings surfaces

---

## Executive Summary

This report surveys publicly available material on how leading intelligence and decision-support platforms structure their command surfaces. The goal is not feature parity — it is to distill the design principles behind elite situational awareness tools and apply them in a clean-room, original implementation to the SZL ecosystem.

We examined two cohorts:
- **Government-adjacent / defense-grade:** Palantir Gotham/Foundry, Anduril Lattice, Maven Smart System, ESRI ArcGIS for Intelligence, IBM i2 Analyst Notebook, Recorded Future, Dataminr, Babel Street
- **Commercial analogs:** Bloomberg Terminal, Datadog, Splunk Enterprise Security, Google Chronicle, Snowflake Horizon, Elastic SIEM

---

## Champion Profiles

### 1. Palantir Gotham / Foundry
**Public sources:** palantir.com/platforms, SEC S-1 filings, public demo videos

**What they do best:**
- **Object-centric data model.** Every entity (person, organization, aircraft, event) is a first-class citizen with a canonical profile, relationship graph, and provenance trail. Nothing exists outside an entity.
- **Link analysis.** The visual relationship graph lets analysts trace indirect connections across data sources — essential for money flows, supply chains, and influence networks.
- **Integrated action layer.** Foundry's Pipeline Builder ties data ingestion directly to operational actions. Analysts don't just see signals — they trigger workflows from within the same surface.
- **Evidence chains.** Every data point shows its source, ingestion timestamp, and transformation lineage. Nothing is trusted without provenance.
- **Workspace-level saved views.** Teams save named configurations of panels, filters, and map layers — enabling reproducible operational postures.

**Information density approach:** Extremely high. Palantir surfaces trade visual whitespace for signal density, reserving space for context menus and evidence drawers rather than decorative elements.

---

### 2. Anduril Lattice
**Public sources:** anduril.com, DARPA program documents, public congressional testimony

**What they do best:**
- **Fused sensor mesh.** Lattice ingests heterogeneous sensor feeds (radar, acoustic, EO/IR, AIS) and presents a single coherent operational picture. The fusion is the product.
- **Threat classification at the edge.** Lattice scores threats autonomously with human-reviewable confidence bands. Every classification shows its evidence chain.
- **Synchronized geospatial + temporal view.** The map and timeline are not two pages — they are one surface. Scrubbing the timeline brushes the map, and vice versa.
- **Operator-first UX.** Interactions are designed for people under pressure: keyboard-first, minimal clicks to escalate, persistent action queue visible at all times.

---

### 3. Maven Smart System (DoD)
**Public sources:** DIU.mil project pages, GAO reports, public procurement documents

**What they do best:**
- **AI confidence displayed as a first-class attribute.** Every AI-generated label or recommendation surfaces a calibrated confidence score alongside the evidence used to generate it. Operators can agree, disagree, or request re-analysis.
- **Human-machine teaming model.** The system never presents AI output as fact. It presents it as a recommendation with explicit uncertainty. Reviewers sign off.
- **Audit-complete chains.** Every operator action — accept, reject, escalate, modify — is timestamped, attributed, and immutable. The system knows who did what and why.

---

### 4. ESRI ArcGIS for Intelligence
**Public sources:** esri.com/intelligence, published federal agency case studies

**What they do best:**
- **Multi-layer geospatial command.** Points, polygons, heat layers, route arcs, and network overlays coexist in a single unified canvas. Layer controls are accessible without leaving the map.
- **Named saved views / bookmarks.** Analysts save specific zoom levels, active layers, and time ranges as named views shareable with teammates.
- **Click-through drilldown.** Clicking a geospatial feature opens an inline panel (not a modal, not a new page) with entity profile, related signals, and action options.
- **Temporal playback.** The timeline brush lets analysts replay events across a time range, watching entities move and signals fire in sequence.

---

### 5. IBM i2 Analyst Notebook
**Public sources:** ibm.com/products/i2-analysts-notebook, public training materials

**What they do best:**
- **Structured entity relationships.** i2's link chart remains the gold standard for visualizing networks of entities, transactions, and communications.
- **Temporal alignment.** A dedicated timeline lane shows entity states over time, aligned with their relationship graph. Events and relationships coexist on the same temporal axis.
- **Annotation-first workflow.** Analysts annotate directly on the chart, attach notes to links, and mark confidence levels. The chart becomes the working document.

---

### 6. Recorded Future
**Public sources:** recordedfuture.com, publicly published threat intelligence reports

**What they do best:**
- **Risk scoring with evidence.** Every entity (IP, domain, actor, CVE) has a numerical risk score. Clicking the score opens an evidence drawer showing exactly which signals contributed, with weights.
- **Source freshness.** Every data point shows when it was collected, from which source, and how old it is relative to the domain's expected update frequency. Stale data is flagged.
- **Trending + velocity.** Risk scores show not just current level but rate of change — an entity moving from 35 to 72 in 24 hours is more actionable than one stable at 80.
- **Entity correlation.** Related entities are surfaced automatically: same infrastructure, same actor, overlapping indicators.

---

### 7. Dataminr
**Public sources:** dataminr.com, SEC filings, published financial analysis

**What they do best:**
- **Signal velocity.** Dataminr's core value proposition is breaking signal — detecting events before news coverage. Their UI is optimized for speed of triage, not depth of analysis.
- **Severity + freshness as primary sort keys.** Feeds are ranked by severity score and signal age simultaneously. Stale high-severity signals are surfaced differently than fresh low-severity ones.
- **Acknowledge / escalate actions.** Every signal has inline actions: acknowledge (remove from queue), escalate (assign + notify), and investigate (open detail). No navigation required.
- **De-duplication + clustering.** Related signals about the same event are collapsed into clusters. Cluster expansion shows the constituent signals.

---

### 8. Babel Street
**Public sources:** babelstreet.com, published federal agency case studies

**What they do best:**
- **Multilingual signal normalization.** Babel Street ingests signals in many languages and normalizes them to a common schema before surfacing them. The language of origin is preserved as metadata.
- **Entity resolution across sources.** The same entity referenced differently across sources is resolved to a single canonical profile.

---

### 9. Bloomberg Terminal
**Public sources:** bloomberg.com/professional, public financial journalism, academic analysis

**What they do best:**
- **Information density as a UX virtue.** The Terminal is famously dense. Every pixel shows data. This is not a design failure — it is a feature for expert users who have learned the system.
- **Keyboard-first command model.** The `<GO>` command palette lets experienced users navigate to any surface instantly. Speed of access is a competitive advantage.
- **Source attribution on every number.** Every data point shows its source, collection time, and whether it is estimated or reported. Trust is built through transparency.
- **Live tick + staleness indicators.** Real-time data feeds show tick-by-tick freshness. When a source goes stale, it is immediately visible.

---

### 10. Datadog
**Public sources:** datadog.com, public product documentation, published engineering blog

**What they do best:**
- **Posture score as the entry point.** The Datadog home surface leads with a composite health/posture score, not raw metrics. The score contextualizes everything below it.
- **Connector health first-class.** Every data source has a health card showing: last successful collection, latency, error rate, and staleness. The platform's reliability is surfaced, not hidden.
- **Correlated APM + infrastructure.** A single event can be traced from user-visible impact back to the specific infrastructure component causing it. The correlation is automatic.
- **Alert de-duplication + grouping.** Alerts about the same incident are automatically grouped. The operator sees one entry, not 47.

---

### 11. Splunk Enterprise Security
**Public sources:** splunk.com/en_us/products/enterprise-security.html, public documentation

**What they do best:**
- **Adaptive threat triage.** Risk-based alerting groups individual signals into risk scores per entity. An entity with 12 individually low-severity signals may still have a high aggregate risk.
- **Investigation workbench.** A dedicated surface for analysts to build cases: add signals, annotate, link entities, track investigation state, and assign actions — all in one context.
- **Saved analyst views.** Investigators can save their current working context (time range, filters, pinned signals) as a named session.

---

### 12. Google Chronicle
**Public sources:** cloud.google.com/chronicle, public case studies, GCP blog

**What they do best:**
- **Unified detection + investigation.** Detection rules and investigation are not two separate tools. Writing a detection rule and investigating its hits happen in the same surface.
- **VirusTotal integration.** Entity enrichment is immediate: clicking an IP, hash, or domain enriches it with external intelligence inline, without leaving the investigation.

---

## Patterns We Adopt

The following patterns are adopted and mapped to specific SZL surfaces:

| Pattern | Source Champions | Target Surface | Type |
|---|---|---|---|
| **Operational posture score** — single composite score as command entry point | Datadog, Splunk | SZL Holdings Command Center, Command artifact | Additive |
| **Watchlist deltas** — entity changes since last session | Palantir Foundry, Bloomberg | SZL Holdings Command Center | Additive |
| **Stale-source badges** — every connector shows last fetch + freshness status | Bloomberg, Recorded Future, Datadog | Health & Freshness page, Command Center right rail | Additive |
| **AI executive brief with citations** — AI summary with deep links to source evidence | Maven Smart System, Palantir | SZL Holdings Command Center, Pulse | Additive |
| **Right-rail entity intelligence** — selected entity profile stays persistent while browsing | Palantir Gotham, ESRI ArcGIS | Command Center, Vessels Command | Additive |
| **Synchronized timeline brushing** — map + entity list + timeline move together | Anduril Lattice, ESRI ArcGIS | Vessels Command Map, Terra Map | Additive |
| **Saved map views** — named configurations of layers, zoom, filters | ESRI ArcGIS, Palantir | Vessels, Terra | Additive |
| **Layer control panel** — point / cluster / heat / arc / polygon layers in one canvas | ESRI ArcGIS, Anduril | Vessels Command Map, Terra Map | Additive |
| **Click-through drilldown** — geospatial click opens inline entity panel | ESRI ArcGIS, Anduril Lattice | Vessels, Terra | Additive |
| **Severity scoring chips** — visual severity indicator on every signal card | Dataminr, Splunk ES | Signal Fusion Feed, Vessels exceptions | Replaces text-only labels |
| **Source + freshness badges** — source system and collection age on every signal | Recorded Future, Bloomberg | Signal Fusion Feed, Vessels exceptions | Additive |
| **Signal de-duplication + cluster grouping** — collapse related signals | Dataminr, Splunk ES | Signal Fusion Feed | Additive |
| **Acknowledge / escalate inline actions** — no navigation to act | Dataminr, Anduril | Signal Fusion Feed, Vessels exceptions | Additive |
| **Recommendation explainability** — source evidence, scoring factors, confidence, impact | Maven Smart System, Recorded Future | All recommendation cards across surfaces | Additive |
| **Per-connector health cards** — freshness, latency, last ingest, error rate | Datadog, Recorded Future | Health & Freshness page (new) | New surface |
| **Risk score with velocity** — current score + rate of change | Recorded Future, Splunk ES | Risk surfaces across all verticals | Additive |
| **Audit-complete chains** — every action timestamped and attributed | Maven Smart System, Palantir | Existing proof chain, extended to new actions | Extends existing |
| **Mobile posture score** — composite score on mobile entry point | Datadog (mobile app) | SZL Holdings Mobile | Additive |
| **Mobile signals feed with actions** — ack/escalate from mobile | Dataminr (mobile) | SZL Holdings Mobile | Additive |

---

## Patterns We Reject

| Pattern | Reason for Rejection |
|---|---|
| **Dense monochromatic terminal aesthetic (Bloomberg)** | Incompatible with our board-ready, dark-first premium positioning. We achieve density without sacrificing legibility. |
| **Operator-only keyboard-first navigation (Palantir Gotham)** | Our operator base is broader than trained analysts. Keyboard shortcuts are additive, not primary. |
| **Simulation-heavy what-if modeling as primary UX (Palantir Foundry)** | Our simulation capability (Decision Theater) exists but is not the entry point for operational command. |
| **Raw alert volume as primary metric (Splunk basic alerting)** | We lead with posture scores and risk-based grouping, not raw alert counts. |
| **Vendor-specific geo data formats (ESRI proprietary)** | We use MapLibre GL / deck.gl on open standards. Avoids lock-in. |
| **Fully autonomous action without human-in-loop (some Anduril use cases)** | Our governed autonomy model requires explicit human review gates for all consequential actions. |
| **Social media firehose as primary signal source (Dataminr)** | Noise risk too high. We use structured, entity-linked signals from verified connectors. |
| **Link chart as default visualization (IBM i2)** | Effective for trained analysts; too complex for executive and cross-functional users. We reserve graph views for the Entity Explorer and Nexus surfaces. |

---

## Surface-to-Pattern Mapping

### SZL Holdings — Command Center (`/command/`)
Adopt: posture score, watchlist deltas, top-risk strip, stale-source warnings, pending-actions summary, cross-domain correlation chips, AI executive brief with citations, right-rail entity intelligence

### Vessels — Command Overview (`/command-overview`)
Adopt: synchronized timeline brushing, saved map views, layer control panel (points/clusters/heat/arcs), click-through drilldown, signal severity scoring, freshness badges on AIS feeds

### Terra — Command Map (`/property-map-page`)
Adopt: synchronized timeline brushing, saved map views, layer set (distress heat, ownership arcs, comparable points), freshness badges on data sources

### Signal Fusion (`/lyte/signal-fusion`)
Adopt: de-duplication + cluster grouping, severity scoring chips, source + freshness badges, acknowledge / escalate inline actions, cluster expansion

### All Recommendation Surfaces
Adopt: explainability expansion (source evidence, scoring factors, confidence band, related entities, business impact, next action)

### Health & Freshness (new page: `/health-freshness`)
Adopt: per-connector health cards with freshness, latency, last successful ingest, stale-domain warnings, error summaries

### SZL Holdings Mobile
Adopt: posture score as mobile entry point, signals feed with inline ack/escalate actions

---

## What We Deliberately Don't Copy

- No code from any third-party repository
- No screenshots or UI assets from any vendor
- No verbatim text from any vendor's documentation or marketing copy
- No proprietary data schemas or classification systems
- All implementations are clean-room originals inspired by publicly observable principles

---

*Report compiled from public sources only: vendor websites, SEC filings, government procurement documents, published academic analysis, and publicly available product documentation. No classified material, no reverse engineering, no proprietary access.*
