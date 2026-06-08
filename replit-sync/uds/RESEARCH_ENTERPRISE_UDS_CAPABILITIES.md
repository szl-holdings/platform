# Enterprise + UDS Capability Research
## For SZL Holdings — a11oy & killinchu Platform Design Intelligence
**Date:** June 2026 | **Classification:** Internal Strategy Research  
**Purpose:** Extract buildable capability patterns + open standards from enterprise platforms; map each to honest reimplementations for a11oy (governed-AI decision infra) and killinchu (maritime + drone governed C2). We adopt patterns, open standards, and permissively-licensed open code with attribution. We do NOT copy proprietary code.

---

## TABLE OF CONTENTS
1. [Palantir Foundry + Gotham + AIP](#1-palantir-foundry--gotham--aip)
2. [New Relic + Datadog — Enterprise Observability](#2-new-relic--datadog--enterprise-observability)
3. [BOSS Technologies — Vendor Disambiguation](#3-boss-technologies--vendor-disambiguation)
4. [Defense Unicorns UDS + Zarf (PRIMARY FOCUS)](#4-defense-unicorns-uds--zarf)
5. [Open Enterprise Data Sources](#5-open-enterprise-data-sources)
6. [Master Capability → Tab → App → Data Source → Formula → Library Table](#6-master-table)

---

## 1. Palantir Foundry + Gotham + AIP

### 1.1 Platform Overview

Palantir operates three tightly integrated platforms:

- **Foundry** — enterprise data integration, pipeline orchestration, ontology management, and workflow applications for commercial operators ([Palantir Foundry docs](https://www.palantir.com/docs/foundry/ontology/overview/))
- **Gotham** — defense/intelligence variant: investigative analysis across multi-INT data, geospatial, network graph, CDR analysis, federated sources, mission planning, with MAC/DAC security clearance models ([UK Digital Marketplace](https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/801146272055049))
- **AIP (AI Platform)** — orchestration, governance, testing, and reasoning layer that connects LLMs bidirectionally to the Ontology; released agentic capabilities including AIP Analyst (GA April 2026), AIP Autopilot (Beta March 2026), AIP Logic, AIP Agent Studio ([Towards AI, May 2026](https://towardsai.net/p/machine-learning/inside-palantir-aip-how-the-worlds-most-controversial-ai-platform-actually-works))

### 1.2 Capability Deep-Dives

---

#### CAPABILITY P-1: The Ontology (Object Model)

**What Palantir does:**  
The Ontology is a governed, typed, live, bidirectional knowledge graph that unifies the entire enterprise. It has three layers:
- **Semantic elements** — Object Types (typed entities with typed properties), Link Types (directed, typed edges between objects), Interfaces (polymorphic type contracts)
- **Kinetic elements** — Action Types (write operations that mutate state), Functions (arbitrary business logic, TypeScript/Java)
- **Backend services** — OMS (Ontology Metadata Service: schema source of truth, versioning, integrity), OSS (Object Set Service: high-throughput read layer, sub-50ms queries), Funnel (Object Data Funnel: validates all write operations against governance policies, MAC/DAC, schema constraints before mutating)

The Ontology acts as a digital twin of the organization. Example: a logistics system might have `Unit` objects, `Route` objects, and `Supplied_By_Route` link types. Traversal: `target_unit.traverse("Deployed_To").traverse("Supplied_By_Route").get_all()` is a first-class API call.

**The real concept:**  
A labeled property graph (LPG) with typed nodes and directed typed edges, accessed through a governed read/write API. Enforces schema at write time (Funnel = schema-validating write broker). Conceptually identical to a knowledge graph with ontology constraints (OWL/RDF family, but bespoke). The "secret sauce" is tight coupling of the graph to the build system, access controls, and LLM read layer — not the graph structure itself.

**IP/License note:** Proprietary. The PATTERN (typed graph + governed API) is standard knowledge-graph design. The implementation is Palantir's.

**Our honest version — a11oy tab: "Mission Ontology" or "Entity Graph"**
- Build a typed entity registry in Postgres (or Dgraph/Neo4j AGPL with attribution): define `EntityType`, `PropertySchema`, `LinkType` tables
- Write layer validates against schema before commit (our Funnel equivalent = a simple schema-validating API gateway in Go/Python)
- Read layer: entity-set queries with typed traversal using GraphQL (open standard)
- Actions: define `ActionType` records; execution goes through an audit log (Postgres JSONB event table)
- **Data source:** Our own operational data (maritime tracks, drone telemetry), enriched with open feeds (AIS, OSV, KEV)
- **Formula:** Graph traversal = adjacency list traversal (BFS/DFS); object-set cardinality filter = SQL WHERE
- **Libraries:** Neo4j Community (GPL, note license), Dgraph (Apache 2.0), or plain Postgres graph queries (MIT/BSD); GraphQL via [graphql-go](https://github.com/graph-gophers/graphql-go) (MIT)
- **UI pattern:** Force-directed graph (D3.js, BSD-3-Clause) for link visualization; table view for property inspection

---

#### CAPABILITY P-2: Data Integration Pipelines + Lineage

**What Palantir does:**  
Foundry's "build system for data" treats datasets as artifacts with declared inputs and outputs, like a Makefile for data. Key concepts:
- **Pipeline Builder** — visual DAG editor; transforms written in Python (PySpark), SQL, Java; compute-agnostic (Spark, DuckDB, etc.)
- **Incremental builds** — only recomputes changed branches of the DAG
- **Data lineage** — every dataset has full version lineage: every row can be traced to its source transform and input row
- **Health checks** — quality checks gate production release; diagnostics surfaced on failure
- **Access control** — permissions enforced at dataset level; propagated through lineage so downstream datasets inherit upstream restrictions

([Palantir Foundry data integration docs](https://www.palantir.com/docs/foundry/data-integration/overview/))

**The real concept:**  
A DAG-based data orchestrator (same concept as Apache Airflow/Prefect/dbt) with column-level lineage tracking. Lineage is solved via OpenLineage standard (LF project). The "governed" aspect is just role-based access at every node in the DAG.

**IP/License note:** Pattern is adoptable. OpenLineage (Apache 2.0) is the open standard.

**Our honest version — a11oy tab: "Pipeline Lineage"**
- Data orchestration: [Apache Airflow](https://github.com/apache/airflow) (Apache 2.0) or [Prefect](https://github.com/PrefectHQ/prefect) (Apache 2.0)
- Lineage tracking: [OpenLineage](https://github.com/OpenLineage/OpenLineage) (Apache 2.0) + [Marquez](https://github.com/MarquezProject/marquez) (Apache 2.0) as the metadata server
- Visualize: Marquez's lineage graph UI, or embed [lineage-vis](https://github.com/bryanyang0528/lineage-vis) (MIT)
- Dataset versioning: [Delta Lake](https://github.com/delta-io/delta) (Apache 2.0) or DuckDB snapshots
- **Data source:** Our own pipeline runs, Prometheus pipeline health metrics
- **Formula:** Topological sort for build ordering (Kahn's algorithm); change propagation = reverse-reachability in DAG

---

#### CAPABILITY P-3: Access Control — MAC/DAC + Attribute-Based Clearance

**What Palantir does (Gotham):**  
Implements Mandatory Access Control (MAC), Discretionary Access Control (DAC), and dynamic attribute-based clearance. A user may see an object's properties but lack clearance to traverse a link to classified related objects. The Funnel validates every write against these policies. AIP is architecturally prohibited from kinetic actions; LLMs cannot trigger write operations without human confirmation.

**The real concept:**  
ABAC (Attribute-Based Access Control) as defined in NIST SP 800-162. The clearance on a link edge is just an attribute policy. OPA (Open Policy Agent) implements this pattern fully in open source.

**IP/License note:** The ABAC pattern is a NIST standard. OPA is Apache 2.0.

**Our honest version — a11oy + killinchu tab: "Access Governance Panel"**
- [Open Policy Agent (OPA)](https://github.com/open-policy-agent/opa) (Apache 2.0) for policy evaluation
- Rego policies expressing clearance rules on entity types and link traversals
- Every API call passes through OPA sidecar before returning data
- Audit log: all decisions logged with principal, resource, action, policy outcome
- **Data source:** Keycloak (part of UDS Core) groups as the attribute source; LDAP/AD attributes if applicable
- **Formula:** ABAC decision = `f(subject_attrs, resource_attrs, action, environment_attrs) → permit/deny`

---

#### CAPABILITY P-4: AIP — LLM Orchestration over Governed Data (Ontology-Augmented Generation)

**What Palantir does:**  
AIP is NOT an LLM. It is an orchestration + governance layer. Key architecture:
- **OAG (Ontology-Augmented Generation):** LLMs retrieve typed objects with deterministic properties and explicit relational edges from OSS before generation. Forces structured context, not free-text RAG.
- **k-LLM routing:** Model-agnostic; hot-swaps between xAI, OpenAI, Anthropic, Meta, Google based on task complexity + governance constraints
- **AIP Logic:** No-code/low-code step-by-step LLM workflow builder; builders explicitly dictate which tools/ontology types an LLM can access
- **AIP Agent Studio:** Agentic networks of multiple specialized LLMs for multi-step operational tasks; each agent has scoped ontology access
- **AIP Evals:** Deterministic testing framework (exact-match, Levenshtein distance, LLM-as-a-judge) before production promotion
- **Apollo (deployment engine):** Declarative pull-model deployment; cryptographically signed bundles for air-gapped networks
- **Human-in-the-loop:** Required for all critical actions; every recommendation traceable

Workflow example:
```python
# 1. Ontology Retrieval (OAG)
target_unit = Ontology.Objects.Unit.search(id=unit_id).get_first()
linked_routes = target_unit.traverse("Deployed_To").traverse("Supplied_By_Route").get_all()
# 2. Anomaly detection
compromised = [r for r in linked_routes if r.properties["status"] == "destroyed"]
# 3. Deterministic tool execution
bypass_plan = cuOpt_Routing_Tool.calculate_optimal_bypass(
    start_node=target_unit.supply_depot, end_node=target_unit.location, avoid_nodes=compromised)
# 4. LLM synthesis
response = LLM.invoke(model="llama-nemotron-super-49b",
    prompt=f"Generate SITREP: compromised routes {compromised}, bypass plan {bypass_plan}",
    temperature=0.0)  # Maximum determinism
```
([Towards AI, May 2026](https://towardsai.net/p/machine-learning/inside-palantir-aip-how-the-worlds-most-controversial-ai-platform-actually-works))

**The real concept:**  
This is RAG (Retrieval Augmented Generation) with structured graph retrieval instead of vector search — sometimes called "GraphRAG" or "KG-RAG." The governance is just ABAC applied to what the LLM tool calls can access. The eval framework is standard LLM evaluation. The deterministic tool execution is standard function-calling (OpenAI spec).

**IP/License note:** The patterns are all open. LangGraph (MIT) + OPA + any LLM = honest equivalent. GraphRAG is now also open (Microsoft, MIT license).

**Our honest version — a11oy tab: "Governed AI Reasoning"**
- Graph retrieval: query our Mission Ontology (P-1) as structured context before LLM call
- LLM routing: [LiteLLM](https://github.com/BerriAI/litellm) (MIT) for model-agnostic routing
- Agent orchestration: [LangGraph](https://github.com/langchain-ai/langgraph) (MIT) for multi-step workflows
- Tool calling: each tool registered with access policy (OPA check before execution)
- Evals: [RAGAS](https://github.com/explodinggradients/ragas) (Apache 2.0) for RAG evaluation
- Human-in-the-loop: action confirmation queue (Postgres + WebSocket notification)
- **Formula:** OAG = structured_context = `query_graph(entity_id, link_types, depth)` fed as system prompt; not vector similarity

---

#### CAPABILITY P-5: Operational Workflows + Simulation / Courses of Action

**What Palantir does:**  
Actions (write operations defined in the Ontology) can be bundled into decision workflows. The system can generate courses of action (COA) by: (a) retrieving current state from Ontology, (b) running simulation against a deterministic model, (c) surfacing ranked COAs to human operators. Gotham specifically supports mission planning: identifying assets, pairing effects, simulating engagements, tracking outcomes. AIP generates SITREPs and COA recommendations.

**The real concept:**  
COA generation is Operations Research (decision trees, simulation, linear programming). SITREP generation is templated LLM synthesis over structured state. This is the pattern used by Anduril's Lattice and Scale AI's Thunderforge.

**Our honest version — killinchu tab: "Course of Action Planner"**
- State: pull current maritime tracks, drone positions from our entity graph
- COA simulation: lightweight Monte Carlo simulation (NumPy, BSD) over threat scenarios
- Route optimization: [OR-Tools](https://github.com/google/or-tools) (Apache 2.0) for optimal routing (open equivalent of NVIDIA cuOpt)
- SITREP generation: LLM synthesis with structured state context (see P-4 pattern)
- **Formula:** COA ranking = multi-criteria decision analysis (TOPSIS or weighted sum); simulation = Monte Carlo sampling over threat probability distributions

---

### 1.3 Summary — Palantir

| Capability | UI/UX Pattern vs Deep Concept | Our Honest Version |
|---|---|---|
| Ontology/Object Model | DEEP — typed LPG with governed API | Mission Ontology tab (Neo4j/Postgres + GraphQL) |
| Data Pipelines + Lineage | DEEP — DAG build system + OpenLineage | Pipeline Lineage tab (Airflow + Marquez) |
| MAC/DAC/ABAC | DEEP — NIST ABAC, open pattern | Access Governance Panel (OPA + Keycloak) |
| OAG / AIP Agent | DEEP — GraphRAG + function-calling | Governed AI Reasoning tab (LangGraph + LiteLLM) |
| COA / Simulation | DEEP — OR + Monte Carlo + LLM synthesis | COA Planner (OR-Tools + NumPy + LLM) |
| Workshop/Object Views | UI/UX PATTERN | Custom dashboards in our app |
| AIP Analyst / chat UI | UI/UX PATTERN | Chat panel over governed entity graph |

---

## 2. New Relic + Datadog — Enterprise Observability

### 2.1 Platform Overview

Both platforms implement the SRE observability stack: metrics, traces, logs, events, SLOs, anomaly detection, incident management, entity governance. Their conceptual foundations are public (Google SRE Book; OpenTelemetry; Prometheus). The patterns are 100% adoptable with open tooling.

---

#### CAPABILITY O-1: The Four Golden Signals

**What they do:**  
Both platforms instrument services on four metrics ([New Relic](https://newrelic.com/blog/apm/monitoring-golden-signals), [SRE Monitoring guide](https://gartsolutions.com/sre-monitoring/)):
- **Latency** — P50/P95/P99 request duration per service
- **Traffic** — requests per second (RPS), message throughput
- **Errors** — 4xx/5xx rate + application exception rate
- **Saturation** — CPU%, memory%, thread pool depth, queue depth

These are the universal language of SRE. All four auto-appear in dashboards per service. Alerts fire on thresholds derived from baselines.

**The real concept:**  
Time-series aggregation (sum/rate/percentile) over labeled metric streams. Defined in Google's Site Reliability Engineering book. Prometheus implements this natively with PromQL.

**Our honest version — a11oy tab: "Golden Signals Monitor"**
- Collect: [OpenTelemetry Collector](https://github.com/open-telemetry/opentelemetry-collector) (Apache 2.0) from all services
- Store: [Prometheus](https://github.com/prometheus/prometheus) (Apache 2.0) + [Thanos](https://github.com/thanos-io/thanos) (Apache 2.0) for long retention
- Visualize: [Grafana](https://github.com/grafana/grafana) (AGPL-3.0, note; or use Grafana OSS embed)
- Alert: Prometheus AlertManager (Apache 2.0)
- **Formula:** `rate(http_requests_total{status=~"5.."}[5m])` = error rate; `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` = P95 latency; saturation = `1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m]))` by node
- **Data source:** Prometheus metrics from our services; OTEL spans for latency; system metrics from node_exporter

---

#### CAPABILITY O-2: SLOs, Error Budgets, and Burn Rate Alerts

**What they do:**  
Define Service Level Objectives (SLOs) as target values for SLIs over a rolling window ([Datadog SLO](https://www.datadoghq.com/product/service-level-objectives/), [Datadog blog](https://www.datadoghq.com/blog/establishing-service-level-objectives/)):
- **SLI** — specific metric (e.g., % of requests with latency < 300ms)
- **SLO** — target (e.g., 99.5% of requests under 300ms over a 28-day rolling window)
- **Error budget** — `1 - SLO_target` × total_requests = allowable unreliability
- **Burn rate alert** — `current_error_rate / (1 - SLO_target)`. A burn rate > 1 means depleting budget; alert at 3x or 6x burn rate for fast-depleting scenarios
- When error budget is healthy → ship features. When depleted → freeze releases, focus reliability.

**The real concept:**  
SLO = threshold + window + compliance ratio. Error budget = simple subtraction. Burn rate = ratio of current error rate to allowed rate. Fully expressible in PromQL.

**Our honest version — a11oy tab: "SLO Dashboard"**
- [Sloth](https://github.com/slok/sloth) (Apache 2.0) — Prometheus-native SLO generator from YAML; produces multi-burn-rate alerts automatically
- Or [OpenSLO](https://github.com/openslo/openslo) (Apache 2.0) — vendor-neutral SLO spec
- **Formula:** `burn_rate = error_rate_1h / (1 - target)`. Alert if `burn_rate > 14.4` (1h fast-burn) or `burn_rate > 6` (6h slow-burn) — Google's recommended thresholds
- **Data source:** Prometheus; any OpenTelemetry-compatible metric

---

#### CAPABILITY O-3: Anomaly Detection

**What they do:**  
New Relic uses a seasonality-aware model: detects anomalies by computing a rolling prediction from past 7 days, then alerting when actual value is `N` standard deviations from prediction, with configurable direction (upper/lower/both) ([New Relic anomaly detection docs](https://docs.newrelic.com/docs/alerts/create-alert/set-thresholds/anomaly-detection/)). Datadog Watchdog + Bits AI performs autonomous anomaly detection across logs, metrics, and traces simultaneously, correlating issues across data types for root cause analysis ([incident.io, Aug 2025](https://incident.io/blog/sre-ai-tools-transform-devops-2025)).

**The real concept:**  
Seasonal decomposition (STL decomposition) + rolling z-score threshold. For multivariate: Isolation Forest (sklearn) or LSTM-Autoencoder for time-series. The "correlation across data types" is multi-modal anomaly fusion (join anomaly timestamps across metric/log/trace streams).

**Our honest version — a11oy tab: "Anomaly Detection Engine"**
- [Facebook Prophet](https://github.com/facebook/prophet) (MIT) — seasonality-aware forecasting; compute predicted band, alert on deviation
- Or [PyOD](https://github.com/yzhao062/pyod) (BSD-2) — anomaly detection library with 40+ algorithms including Isolation Forest, HBOS, AutoEncoder
- Multivariate correlation: temporal join anomalies across Prometheus + Loki log events using timestamps
- **Formula:** STL decomposition: `y_t = T_t + S_t + R_t`; anomaly if `|R_t| > k × σ(R)` where k=3 typical. Rolling z-score: `z = (x - μ_window) / σ_window`
- **Data source:** Prometheus metrics; Loki (part of UDS Core) for logs; Tempo/Jaeger for traces

---

#### CAPABILITY O-4: Change Tracking / Deployment Correlation

**What they do:**  
New Relic Change Tracking stores deployment events as NRDB markers that appear overlaid on all performance charts. Correlation: automatically surfaces "what anomalous activity was identified since this deployment?" Metadata includes commit SHA, changelog, deep links ([New Relic change tracking](https://docs.newrelic.com/docs/change-tracking/change-tracking-introduction/)). Datadog correlates deployments with golden signal changes, SLO burn rate acceleration, and new error groups.

**The real concept:**  
Temporal event join: deployment event at time `t`, then compute `Δmetric = metric[t+window] - metric[t-window]`. Annotate charts with vertical markers at event timestamps. Standard Grafana annotations implement this.

**Our honest version — a11oy tab: "Deployment Correlation"**
- Grafana Annotations API (AGPL): `POST /api/annotations` with deployment metadata; annotations auto-appear on all dashboards
- Store deployment events in Postgres with git hash, image digest, operator, timestamp
- Compute: for each deployment, pull metric snapshots ±30min and compute delta; surface regressions
- **Formula:** Regression detection = one-sample t-test (p < 0.05) on post-deploy metric window vs baseline; or simple median shift detection

---

#### CAPABILITY O-5: Entity Governance + Software Catalog

**What they do:**  
New Relic Entity Synthesis: any telemetry stream can be synthesized into a typed entity by providing a `definition.yml` with match rules, golden metrics, summary metrics, and a dashboard template. Entity types: APM, Infrastructure, Browser, Mobile, custom. Entities tagged with key-value pairs; alertable; related entities auto-discovered from OTel semantic conventions ([New Relic entity synthesis blog](https://newrelic.com/blog/observability/entity-synthesis)).

Datadog Software Catalog: service, datastore, queue, API, system entity types with ownership, scorecard rules (e.g., "all libraries must have no critical CVEs"), custom entity types for pipelines/AI agents ([Datadog software catalog blog](https://www.datadoghq.com/blog/software-catalog-custom-entities/)).

**The real concept:**  
Service catalog = CMDB (Configuration Management Database) + OTel semantic conventions for auto-discovery. Entity graph = OTel's `service.name`, `service.namespace`, `host.id` resource attributes as primary identifiers. Scorecards = policy-as-code evaluated against catalog entries.

**Our honest version — a11oy + killinchu tab: "Asset Catalog / Service Health"**
- [Backstage](https://github.com/backstage/backstage) (Apache 2.0) — CNCF-hosted software catalog; define entity types via YAML
- Or build a lightweight catalog: Postgres entity registry + Prometheus golden metrics per entity + OPA policy scorecards
- **Data source:** OTel resource attributes; Kubernetes pod labels; Zarf package metadata
- **Formula:** Health score = weighted sum of golden signal SLI values over 1h window; 0–100 RAG score

---

#### CAPABILITY O-6: Incident Workflow

**What they do:**  
Datadog Incident Response ([Datadog incident response](https://www.datadoghq.com/product/incident-response/)): automated war-room creation (Slack channel + Jira ticket + status page) on alert fire; live observability context attached to incident; bi-directional Jira/ServiceNow sync; structured postmortem with auto-captured timeline; MTTD/MTTR tracking; AI summaries.

**The real concept:**  
Event-driven workflow: alert fires → webhook → create incident record → notify channels → assign responder → track actions → close + postmortem. Standard runbook automation.

**Our honest version — a11oy + killinchu tab: "Incident Manager"**
- [incident.io open API](https://api-docs.incident.io/) or [PagerDuty open standards](https://developer.pagerduty.com/) pattern; or build custom
- Core: Postgres incident table + WebSocket real-time updates + Slack/Teams webhook
- Timeline: append-only event log per incident
- MTTD = `first_alert_timestamp - anomaly_start_timestamp` (from golden signals); MTTR = `resolved_timestamp - incident_created_timestamp`
- **Libraries:** [Escalator](https://github.com/twilio/escalator) or custom; alertmanager webhook receiver (Apache 2.0)

---

### 2.2 Summary — Observability

| Capability | Underlying Concept | Open Implementation |
|---|---|---|
| Golden Signals | Time-series rate/percentile/sum | Prometheus + OTEL (Apache 2.0) |
| SLO + Error Budget | Ratio threshold + rolling window compliance | Sloth + Prometheus (Apache 2.0) |
| Anomaly Detection | STL + rolling z-score; Isolation Forest | Prophet (MIT) + PyOD (BSD) |
| Change Tracking | Temporal event join + metric delta | Grafana Annotations (AGPL) |
| Entity Governance | OTel semantic synthesis + scorecard policy | Backstage (Apache 2.0) + OPA |
| Incident Workflow | Event-driven state machine + audit log | Custom on Postgres + Alertmanager |

---

## 3. BOSS Technologies — Vendor Disambiguation

The name "BOSS" is used by multiple defense vendors. Three distinct systems were found:

---

### 3.1 BOSS = Curtiss-Wright TCG BOSS (Battlefield Operations Support System)

**Vendor:** Curtiss-Wright Defense Solutions (TCG division)  
**What it is:** The leading Link 16-compliant Tactical Data Link (TDL) simulation and test software ([Military Embedded Systems, Jan 2026](https://militaryembedded.com/radar-ew/rugged-computing/tcg-battlefield-operations-support-system-boss-for-tactical-data-link-tdl-network-testing-and-simulation))  
**Capabilities:**
- **TDL Simulation** — creates complete virtual C2 environments with Link 16, Link 11, JREAP, SIMPLE, SADL, VMF, DIS network participants
- **Message scripting** — generates, receives, and logs TDL messages in real-time
- **Network terminal emulation** — emulates ground/airborne C2 platforms
- **Post-test analysis** — captures and replays network traffic for debugging
- **Standards certification** — used by JITC, AFSIT, Boeing, Lockheed Martin, Northrop Grumman

**Status:** Widely deployed (400+ systems globally). Used by Air Force, Navy (China Lake, SAIL, NELO), and prime contractors. Upgraded in 2012 to add VMF/CNR support. Closed proprietary software.

**Relevance to killinchu:**  
- **Pattern:** Link 16 message format library (STANAG 5516 / MIL-STD-3011) + TDL message broker  
- **Open equivalent:** [OpenDIS](https://github.com/open-dis/open-dis) (BSD) implements DIS protocol; [Link16-utils](https://github.com) — search for open implementations; TDL standards are public MIL-STDs  
- **killinchu tab idea:** "TDL Network View" — visualize simulated TDL tracks, J-series message flows on a tactical map using DIS/JREAP open libraries  

---

### 3.2 BOSS = USAF Battlefield Operations Support System (historical)

A broader Air Force operational support system predating Curtiss-Wright's TCG BOSS product. Used to certify link-enabled airborne and ground C2 communication platforms. Largely subsumed by the TCG BOSS commercial product.

---

### 3.3 Other Defense AI Vendors (Possible Confusion)

If "Boss technologies" referred to a newer AI/autonomy vendor, the following are the closest matches active in 2025-2026:

| Vendor | Platform | Relevance |
|---|---|---|
| **Anduril Industries** | **Lattice** — AI-powered sensor fusion, C2, autonomous systems; selected by Space Force for surveillance networks ([Wikipedia](https://en.wikipedia.org/wiki/Anduril_Industries)) | COA/autonomy patterns for killinchu |
| **Scale AI + Anduril** | **Thunderforge** — AI-powered military planning, multi-COA generation, AI wargaming ([Elbit Systems blog](https://www.elbitsystems.com/blog/how-ai-changing-defense-landscape)) | Decision support pattern for killinchu |
| **Palantir** | **Maven Smart System** — DoD targeting/intelligence; designated "program of record" by Pentagon 2026 ([BBC, April 2026](https://www.bbc.com/news/articles/cdrm52g4pl2o)) | Covered in Section 1 |

**Conclusion:** "Boss technologies" most likely refers to **Curtiss-Wright TCG BOSS** in the defense C2/TDL context. If the founder meant a different vendor, the most relevant newer entrant is Anduril Lattice.

---

## 4. Defense Unicorns UDS + Zarf

> **This section is the primary focus. The founder is standing up a UDS environment NOW. Read this deeply.**

---

### 4.1 Architecture Overview

The Defense Unicorns ecosystem has three open-source components that compose into a full airgap-native software delivery and runtime platform:

```
┌─────────────────────────────────────────────────────┐
│                 UDS ECOSYSTEM                        │
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Zarf   │  │  UDS CLI     │  │  UDS Core    │  │
│  │ Package  │  │  Bundle      │  │  Runtime     │  │
│  │ Format   │  │  Orchestrate │  │  Platform    │  │
│  └──────────┘  └──────────────┘  └──────────────┘  │
│       ↑               ↑                  ↑          │
│  zarf.yaml      uds-bundle.yaml    UDS Package CR   │
│  components     packages list      (Pepr/Operator)  │
└─────────────────────────────────────────────────────┘
```

**Products as of June 2026:**
- **Zarf** — air-gapped Kubernetes package manager (open source, MIT license) ([GitHub](https://github.com/zarf-dev/zarf))
- **UDS CLI** — bundle orchestrator on top of Zarf ([GitHub](https://github.com/defenseunicorns/uds-cli))
- **UDS Core** — FOSS secure runtime platform (Apache 2.0) ([GitHub](https://github.com/defenseunicorns/uds-core))
- **UDS Registry** — Launched June 30, 2025: OCI artifact registry for Zarf packages with CVE scanning, SBOM enrichment, crypto signing ([Defense Unicorns press release, June 2025](https://defenseunicorns.com/defense-unicorns-launches-uds-registry/))
- **UDS Tactical Edge** — March 2025: edge deployment for submarines, aircraft, drones, Raspberry Pi in D/D/A environments ([PR Newswire, March 2025](https://www.prnewswire.com/news-releases/defense-unicorns-transforms-software-delivery-to-the-tactical-edge-for-us-department-of-defense-302406139.html))
- **UDS Fleet** — June 2, 2026: fleet-wide management of distributed tactical systems; UDS Fleet Connect (Android/browser app) + UDS Fleet Command (unified observability across all systems) ([PR Newswire, June 2026](https://www.prnewswire.com/news-releases/defense-unicorns-launches-uds-fleet-to-put-mission-operators-in-command-at-the-tactical-edge-302787564.html))
- **UDS Enterprise** — platform engineers and cybersecurity teams managing cloud/on-prem data centers
- Deployed in: US Navy, Air Force, Space Force ([Defense Unicorns co-founders, LinkedIn Live 2024](https://www.youtube.com/watch?v=n1OIVddIao8))

---

### 4.2 ZARF — Deep Dive

**Repository:** [github.com/zarf-dev/zarf](https://github.com/zarf-dev/zarf) | **License:** MIT  
**What it is:** "Airplane mode for your application delivery" — declarative air-gapped Kubernetes package manager with zero external dependencies at deploy time.

#### The Core Problem Zarf Solves

In an air-gapped environment, Kubernetes cannot pull images from the internet. The bootstrapping paradox: you need a registry to host the registry image. Zarf solves this with the `zarf-injector` pattern ([truefullstaq.com, Jan 2026](https://www.truefullstaq.com/en/blog/zarf-air-gapped-kubernetes-bootstrapping)).

#### The `zarf.yaml` Schema

The fundamental unit is the Zarf Package, defined by `zarf.yaml`:

```yaml
kind: ZarfPackageConfig          # Always this for a package
metadata:
  name: my-package               # Package name
  version: 1.0.0                 # Required for publishing to OCI
  description: "..."
  architecture: amd64            # Optional; Zarf detects if omitted

# Package-level variables (overrideable at deploy time)
variables:
  - name: DOMAIN
    default: "uds.dev"
    sensitive: false
    prompt: false

# Package-level constants (baked in at create time)
constants:
  - name: REGISTRY
    value: "ghcr.io/my-org"

components:
  - name: my-app                 # Component name
    required: true               # If false → optional, user prompted
    only:
      flavor: upstream           # Component-level flavor filter
      cluster:
        architecture: amd64      # OS/arch filter
    
    # OCI images to bundle (Zarf pulls at create time, pushes at deploy)
    images:
      - "docker.io/nginx:1.25"
      - "ghcr.io/stefanprodan/podinfo:6.4.0"
    
    # Git repos to mirror into Gitea
    repos:
      - "https://github.com/my-org/my-repo.git@main"  # Tag-based clone recommended
    
    # Files to place on disk
    files:
      - source: "./configs/app.conf"     # Local or http(s) URL
        target: "/opt/app/app.conf"
        shasum: "abc123..."              # Optional integrity check
        executable: false
    
    # Helm charts
    charts:
      - name: my-chart
        version: 1.2.3
        url: "oci://ghcr.io/my-org/charts"      # OCI, HTTPS, or git URL
        # OR:
        localPath: "./chart"
        namespace: my-namespace
        valuesFiles:
          - "values/upstream-values.yaml"
    
    # Raw Kubernetes manifests (wrapped in generated Helm chart at deploy)
    manifests:
      - name: my-manifests
        namespace: my-namespace
        files:
          - "./manifests/deployment.yaml"
          - "./manifests/service.yaml"
        kustomizations:
          - "https://github.com/my-org/kustomize-base"
    
    # Component lifecycle actions
    actions:
      onCreate:                          # Runs during `zarf package create`
        before:
          - cmd: "make build"
      onDeploy:                          # Runs during `zarf package deploy`
        before:
          - cmd: "kubectl create namespace my-ns --dry-run=client -o yaml | kubectl apply -f -"
        after:
          - cmd: "kubectl rollout status deployment/my-app -n my-ns"
            maxTotalSeconds: 300
      onRemove:                          # Runs during `zarf package remove`
        before:
          - cmd: "kubectl delete namespace my-ns"
    
    # [Deprecated] Data injection into running containers
    dataInjections:
      - source: "./data/"
        target:
          namespace: my-ns
          selector: "app=my-app"
          container: "my-container"
          path: "/app/data"
    
    # Import from another package (compose packages)
    import:
      path: "./base-component"           # Local directory
      # OR:
      url: "oci://ghcr.io/my-org/skeleton:1.0.0"
    
    # Health checks (wait for resource reconciliation before proceeding)
    healthChecks:
      - apiVersion: apps/v1
        kind: Deployment
        name: my-app
        namespace: my-ns
```

([Zarf Components docs](https://docs.zarf.dev/ref/components/), [Zarf Packages docs](https://docs.zarf.dev/ref/packages/))

#### The Zarf Init Package

The init package is deployed FIRST and bootstraps the air-gapped cluster. It contains four required components ([Zarf init package docs](https://docs.zarf.dev/ref/init-package/)):

| Component | What it does |
|---|---|
| `zarf-injector` | Statically compiled Rust binary; injected as ConfigMap chunks; reassembles `registry:3` image inside the cluster; hosts temporary pull-only Docker registry in Rust |
| `zarf-seed-registry` | Deploys `docker-registry` Helm chart using the injector as image source; available in NodePort mode (default) or Proxy mode (mTLS, newer) |
| `zarf-registry` | Long-lived container registry; pulls its own image from seed registry; makes itself the permanent airgap image source |
| `zarf-agent` | Kubernetes **Mutating Webhook** that intercepts all pod creation; rewrites image references from `docker.io/nginx:1.25` → `127.0.0.1:31999/nginx:1.25-zarf-{CRC32}`; also mutates Flux GitRepository, HelmRepository, OCIRepository, ArgoCD resources |

**Optional components:**
- `k3s` — installs lightweight Kubernetes on bare metal (requires root)
- `git-server` — deploys Gitea for GitOps-compatible source control in the airgap

```bash
# Bootstrap a new air-gapped cluster
zarf init --components k3s,git-server --confirm

# With external registry (skip injector entirely)
zarf init --registry-url=myregistry.local:5000 \
          --registry-push-username=admin \
          --registry-push-password=secret
```

#### Key CLI Commands

```bash
# PACKAGE CREATION
zarf package create [dir]          # Bundle zarf.yaml into .tar.zst package
zarf package create . -o ./output  # Specify output dir
zarf package create . --differential=old-package.tar.zst  # Delta package

# PACKAGE DEPLOYMENT
zarf package deploy my-pkg.tar.zst [--confirm] [--components=comp1,comp2]
zarf package deploy oci://ghcr.io/my-org/my-pkg:1.0.0  # Deploy from OCI

# OCI REGISTRY OPERATIONS
zarf package publish my-pkg.tar.zst oci://ghcr.io/my-org/
zarf package pull oci://ghcr.io/my-org/my-pkg:1.0.0
zarf package inspect my-pkg.tar.zst           # View package contents
zarf package inspect oci://ghcr.io/... --sbom  # View SBOM

# REMOVAL
zarf package remove my-pkg.tar.zst [--confirm]

# INITIALIZATION
zarf init                          # Bootstrap cluster
zarf tools registry                # Local OCI registry tool
zarf connect registry              # Tunnel to Zarf registry

# DEVELOPMENT HELPERS
zarf dev find-images ./chart       # Discover images from Helm chart
zarf dev generate-config           # Generate zarf-config.toml template
zarf dev lint .                    # Validate zarf.yaml schema
zarf dev deploy                    # Dev-mode deploy (no SBOM, faster)

# INTROSPECTION
zarf tools monitor                 # Launch K9s dashboard
zarf version                       # Show CLI version
```

#### Image Mutation Mechanics (zarf-agent)

When the agent mutates a non-digest-pinned image, it appends a CRC32 hash:
- Original: `ghcr.io/stefanprodan/podinfo:6.4.0`
- Mutated: `127.0.0.1:31999/podinfo:6.4.0-zarf-298505108`

The CRC32 hash is computed from the original registry+repo name, preventing collisions from identically-named images across different registries. Original image reference preserved in annotation: `zarf.dev/original-image-<container-name>`.

To exclude a namespace/resource from mutation: label it `zarf.dev/agent: ignore`.

---

### 4.3 UDS CLI + Bundle System

**Repository:** [github.com/defenseunicorns/uds-cli](https://github.com/defenseunicorns/uds-cli)  
**License:** Apache 2.0

A bundle is a composition of multiple Zarf packages into a single deployable unit.

#### `uds-bundle.yaml` Schema

```yaml
kind: UDSBundle
metadata:
  name: my-mission-bundle
  description: "Complete mission capability bundle"
  version: 0.1.0
  architecture: amd64

packages:
  - name: init
    repository: ghcr.io/defenseunicorns/packages/init
    ref: v0.33.0
    optionalComponents:
      - git-server

  - name: uds-core
    repository: ghcr.io/defenseunicorns/packages/uds/core
    ref: 0.40.1-upstream
    # Override Helm values within the package at bundle deploy time
    overrides:
      istio-controlplane:
        values:
          - path: "global.proxy.resources.requests.cpu"
            value: "100m"
      keycloak:
        values:
          - path: "realmInitEnv.EMAIL_DOMAIN"
            value: "mission.gov"
        variables:
          - name: KEYCLOAK_ADMIN_PASSWORD
            description: "Keycloak admin password"
            path: "auth.adminPassword"

  - name: my-mission-app
    repository: ghcr.io/my-org/mission-app
    ref: 1.2.0
    # OR local path:
    path: ./packages/mission-app

# UDS config variables (set at bundle deploy time)
# File: uds-config.yaml (auto-discovered)
```

**Bundle file naming:** `uds-bundle-{name}-{arch}-{version}.tar.zst`  
**SBOM output:** `bundle-sboms.tar` embedded in bundle; `bundle-sboms/` folder extracted

#### Bundle CLI Commands

```bash
# Create bundle from uds-bundle.yaml
uds create [dir]

# Deploy bundle (local file or OCI URL)
uds deploy uds-bundle-my-mission-0.1.0-amd64.tar.zst
uds deploy oci://ghcr.io/my-org/bundles/my-bundle:0.1.0

# Publish to OCI registry
uds publish uds-bundle-*.tar.zst oci://ghcr.io/my-org/bundles/

# Bundle inspection
uds inspect uds-bundle-*.tar.zst --sbom           # View SBOMs
uds inspect oci://ghcr.io/.../bundle:tag

# Dev workflow
uds run dev-setup        # From uds-tasks.yaml
uds run dev-deploy --set LAYER=identity-authorization

# Monitoring
uds monitor pepr denied  # Watch Pepr policy denial events in real time

# Passthrough to Zarf
uds zarf dev deploy      # Deploy in dev mode
uds zarf tools monitor   # K9s dashboard
```

---

### 4.4 UDS Core — Runtime Platform Deep Dive

**Repository:** [github.com/defenseunicorns/uds-core](https://github.com/defenseunicorns/uds-core)  
**License:** Apache 2.0  
**Baseline:** Evolved from Platform One Big Bang; expands security with UDS Operator + Policy Engine

#### Core Applications (Functional Layers)

| Layer | Application | Purpose |
|---|---|---|
| Service Mesh | **Istio** | mTLS everywhere (STRICT mode), Layer 4 + Layer 7 policies, ingress gateways (tenant + admin), automatic sidecar or ambient mode |
| Identity | **Keycloak** | OIDC/OAuth2 SSO provider; opinionated realm/client defaults; group-based access |
| Authorization | **Authservice** | Protects apps that don't natively speak OIDC (adds SSO via Istio filter) |
| Policy Engine | **Pepr** | UDS Operator + admission controller + policy engine (TypeScript) |
| Monitoring | **Prometheus Stack** | Metrics collection + AlertManager |
| Monitoring | **Grafana** | Dashboards |
| Logging | **Loki** | Log aggregation |
| Logging | **Vector** | Log pipeline (collection/transformation) |
| Container Security | **NeuVector** | Runtime security scanning, network monitoring |
| Backup | **Velero** | Cluster state backup |
| Metrics | **Metrics Server** | Kubernetes resource metrics (HPA) |

UDS Core is packaged as a **single Zarf package** (`zarf.yaml`) and recommended to be deployed as a **UDS Bundle** via `uds deploy`.

Quick start:
```bash
# Full UDS Core (all layers)
uds deploy k3d-core-demo:0.40.1

# Slim dev (just Istio + Keycloak + Pepr)
uds deploy k3d-core-slim-dev:0.40.1
```

---

### 4.5 The UDS Operator + CRDs

The UDS Operator is implemented as a **Pepr module** (TypeScript) that watches for UDS Custom Resources and automatically provisions platform integrations.

#### Three CRDs ([UDS Core CRD docs](https://docs.defenseunicorns.com/core/concepts/configuration--packaging/crd-overviews/))

**1. `Package` CRD** — "The request form for the platform"

An application declares what it needs; the Operator provisions it automatically:

```yaml
apiVersion: uds.dev/v1alpha1
kind: Package
metadata:
  name: my-app
  namespace: my-app
spec:
  network:
    expose:
      - service: my-app-svc           # Service name to expose
        selector:
          app: my-app                 # Pod label selector
        gateway: tenant               # tenant | admin | passthrough
        host: my-app                  # → my-app.uds.dev
        port: 8080
        targetPort: 8080              # Optional, defaults to port
    allow:
      - direction: Ingress            # Ingress | Egress
        selector:
          app: my-app
        remoteNamespace: istio-system # Source/destination namespace
        remoteSelector:
          app: ingressgateway
        port: 8080
        description: "Allow ingress from gateway"
      - direction: Egress
        selector:
          app: my-app
        remoteNamespace: keycloak     # Allow SSO validation
        port: 8080
      - direction: Egress
        selector:
          app: my-app
        remoteGenerated: KubeAPI     # Generated policy for K8s API access
  sso:
    - name: "My App"
      clientId: my-app               # Keycloak client ID
      redirectUris:
        - "https://my-app.uds.dev/callback"
      groups:
        anyOf:
          - /my-app-users
      secretName: my-app-sso-secret  # Where to store OIDC credentials
      secretTemplate:                # Custom secret structure
        CLIENT_ID: "{{ .clientId }}"
        CLIENT_SECRET: "{{ .secret }}"
        OIDC_ISSUER: "{{ .issuerUrl }}"
      protocol: openid-connect       # openid-connect | saml
      enableAuthserviceSelector:     # Use Authservice instead of native OIDC
        app: my-app
  monitor:
    - portName: metrics
      selector:
        app: my-app
      targetPort: 9090
      path: /metrics                 # Prometheus scrape path
      description: "My app metrics"
  # Service mesh mode
  serviceMesh:
    mode: sidecar                    # sidecar | ambient
```

**What the Operator auto-provisions from a single Package CR:**
- Istio VirtualService + DestinationRule for ingress
- Kubernetes NetworkPolicies (200+ auto-deployed) 
- Istio AuthorizationPolicy (Layer 7)
- Keycloak client registration
- Kubernetes Secret with OIDC credentials
- Prometheus ServiceMonitor
- Authservice configuration (if enableAuthserviceSelector set)

([UDS Core how-to create a package](https://docs.defenseunicorns.com/core/v1-2/how-to-guides/packaging-applications/create-uds-package/), [UDS Core CRD overview](https://docs.defenseunicorns.com/core/concepts/configuration--packaging/crd-overviews/))

**2. `Exemption` CRD** — "The permission slip"

```yaml
apiVersion: uds.dev/v1alpha1
kind: Exemption
metadata:
  name: privileged-app
  namespace: uds-policy-exemptions   # Only allowed in this namespace
spec:
  title: "Privileged workload exception"
  description: "Reason for exemption"
  policies:
    - DisallowPrivileged
    - RequireNonRootUser
  matcher:
    namespace: my-special-app
    name: my-pod
```

**3. `ClusterConfig` CRD** — Cluster-wide settings

```yaml
apiVersion: uds.dev/v1alpha1
kind: ClusterConfig
metadata:
  name: uds-config
  namespace: uds
spec:
  domains:
    tenant: uds.dev                  # Tenant gateway domain
    admin: admin.uds.dev             # Admin gateway domain
  caCertificates: []                 # Custom CA bundles
  networking:
    kubeApiCIDR: "10.96.0.1/32"      # For NetworkPolicy generation
    nodeCIDR: "10.0.0.0/8"
  policy:
    allowExemptionsOutsideNs: false  # Lockdown exemptions namespace
```

---

### 4.6 Pepr — Policy Engine + Operator Framework

**Repository:** [github.com/defenseunicorns/pepr](https://github.com/defenseunicorns/pepr)  
**License:** Apache 2.0  
**Language:** TypeScript (Node.js 20+)

Pepr is a **type-safe Kubernetes middleware framework** that generates and manages Mutating/Validating webhooks from TypeScript code.

#### Core Concepts

```
Module       → top-level TypeScript project; produces one MutatingWebhookConfiguration + one ValidatingWebhookConfiguration
Capability   → set of related Actions grouped by purpose (e.g., "UDS Package Operator")
Action types:
  Mutate()   → admits + modifies a resource before storage
  Validate() → admits or denies a resource with an error message
  Watch()    → reacts to changes in existing resources (leader-elected)
  Reconcile() → like Watch() but queues/batches for operator pattern
  Finalize() → cleanup on resource deletion
```

#### Example Pepr Module (TypeScript)

```typescript
import { Capability, a } from "pepr";

const UDSPackageOperator = new Capability({
  name: "uds-package-operator",
  description: "Watches UDS Package CRs and provisions platform integrations",
  namespaces: [],  // All namespaces
});

const { When, Store } = UDSPackageOperator;

// Watch for Package CR creation/update → provision NetworkPolicies
When(a.Package)
  .IsCreatedOrUpdated()
  .Reconcile(async (pkg) => {
    // 1. Create NetworkPolicies from pkg.spec.network.allow
    await provisionNetworkPolicies(pkg);
    // 2. Register Keycloak clients from pkg.spec.sso
    await provisionKeycloakClients(pkg);
    // 3. Create ServiceMonitors from pkg.spec.monitor
    await provisionPrometheusMonitors(pkg);
    // Update package status
    await updatePackageStatus(pkg, "Ready");
  });

// Validate: block over-privileged workloads
When(a.Pod)
  .IsCreated()
  .Validate(request => {
    if (request.Raw.spec?.containers?.some(c => c.securityContext?.privileged)) {
      return request.Deny("Privileged containers not allowed");
    }
    return request.Approve();
  });
```

**How Pepr is deployed:**
```bash
# Generate Pepr webhook configurations
npx pepr build

# Dev mode (real-time TypeScript compilation, hot reload)
npx pepr dev

# Deploy to cluster
npx pepr deploy

# Monitor policy denials
uds monitor pepr denied
```

**Pepr in UDS Core:** The UDS Operator is the core Pepr module — it watches Package, Exemption, ClusterConfig CRs and reconciles all platform integrations.

**License:** Apache 2.0. The entire Pepr framework is adoptable.

---

### 4.7 Air-Gap Delivery Architecture

The complete air-gap delivery flow:

```
[CONNECTED SIDE]                         [AIR-GAP SIDE]
─────────────────                        ────────────────
1. Author zarf.yaml
2. zarf package create
   → pull all images from internet
   → clone git repos
   → generate SBOM (CycloneDX/SPDX)
   → cosign sign package
   → output: zarf-pkg-myapp-1.0.tar.zst

3. uds create (uds-bundle.yaml)
   → compose multiple Zarf packages
   → embed SBOMs
   → sign bundle
   → output: uds-bundle-mission-0.1.tar.zst

4. Transfer via:
   - Removable media (USB/disk)
   - Cross-domain solution (XDS)
   - Starlink (UDS Tactical Edge)
   - UDS Registry (new June 2025)
                                         5. zarf init
                                            → zarf-injector (Rust) bootstraps registry
                                            → zarf-seed-registry up
                                            → zarf-registry up
                                            → zarf-agent (mutating webhook) active
                                         
                                         6. uds deploy bundle.tar.zst
                                            → Deploys Zarf packages in order
                                            → zarf-agent rewrites all image refs
                                            → UDS Operator provisions:
                                              NetworkPolicies, Istio routes
                                              Keycloak clients
                                              Prometheus monitors
                                            → All network traffic: mTLS via Istio
                                            → SSO: all apps → Keycloak OIDC
```

**OCI-native transport:** All Zarf packages and UDS bundles are valid OCI artifacts. They can be stored in any OCI-compliant registry (ghcr.io, Harbor, UDS Registry) and traverse cross-domain solutions that support OCI.

---

### 4.8 UDS Registry (June 2025)

The first airgap-native software registry ([Defense Unicorns launch announcement](https://defenseunicorns.com/defense-unicorns-launches-uds-registry/)):
- Stores Zarf packages, UDS bundles, OCI artifacts
- Every package: continuously scanned (CVE data), cryptographically signed, SBOM-enriched, procurement metadata
- Role-specific views: SREs, operators, program managers
- Integrates with UDS Core and UDS Tactical Edge
- Airgap-native architecture — functions without connectivity

---

### 4.9 UDS Fleet (June 2026)

**Just launched June 2, 2026** — critical for killinchu's distributed drone/maritime operations model ([PR Newswire, June 2026](https://www.prnewswire.com/news-releases/defense-unicorns-launches-uds-fleet-to-put-mission-operators-in-command-at-the-tactical-edge-302787564.html)):

- **UDS Fleet Connect** — mobile (Android) + browser app; connect to and manage individual systems; deploy software with "press of a button"
- **UDS Fleet Command** — unified fleet-wide observability and management; visibility and control across all systems

Positioning: UDS Fleet = edge/tactical management; UDS Enterprise = cloud/on-prem management. Both work together.

---

### 4.10 a11oy + killinchu Tab Ideas for UDS/Zarf World

These are the highest-priority tab ideas given the founder is standing up a UDS environment NOW:

---

#### TAB: "Bundle Composer" (a11oy + killinchu)

**What it does:**  
Visual composer for `uds-bundle.yaml`. Drag-and-drop Zarf packages into a bundle. Configure overrides via form UI (no YAML editing required). Show calculated SBOM union, CVE exposure, and signing status for the composed bundle.

**Backend:**
- Parse `uds-bundle.yaml` + each referenced Zarf package `zarf.yaml`
- UDS CLI: `uds inspect pkg.tar.zst --sbom` → parse SBOM JSON
- Display dependency graph: packages → images → charts → repos
- Real-time validation against `uds-bundle.yaml` schema

**Open data:** Package SBOMs (CycloneDX/SPDX, embedded in bundles); OSV.dev API for vuln lookup per package; CISA KEV for exploited status

---

#### TAB: "Package Lineage" (a11oy)

**What it does:**  
Full provenance chain for any deployed UDS package: source repo → CI build → Zarf package creation → SBOM generation → cosign signature → OCI registry → bundle inclusion → cluster deployment. Click any node to see the artifact hash, signer identity, and Rekor log entry.

**Backend:**
- `kubectl get packages -A -o json` → list all deployed Package CRs
- Parse `spec` fields to extract: package source, version, images
- Verify signatures: `cosign verify` against Rekor (`https://rekor.sigstore.dev`) transparency log
- Trace back to git commit: read SLSA provenance attestation from OCI

**Concept:** Software supply chain transparency — in-toto attestation + Rekor inclusion proof = cryptographic proof that the deployed artifact matches its source

**Open data:** Rekor API `https://rekor.sigstore.dev/api/v1/log/entries/retrieve`; SLSA provenance predicates (in-toto.io format); SPDX/CycloneDX SBOM from packages

---

#### TAB: "Air-Gap Deploy Status" (killinchu)

**What it does:**  
Real-time and historical view of package deployment status across all clusters/edge nodes. Show:
- Which bundles are deployed where (drone cluster, ship cluster, edge node)
- Deployment timestamp, version, health check status
- Pending vs. applied vs. failed
- CRC32 mutation map: original images → airgap-local refs for debugging ImagePullBackOff

**Backend:**
- `kubectl get packages -A -o json` per cluster (use Kubeconfig per cluster or UDS Fleet API)
- `kubectl get pods -A -o json | jq` to extract `zarf.dev/original-image-*` annotations
- Parse Zarf state ConfigMap: `kubectl get cm/zarf-state -n zarf -o yaml`
- Diff: package version deployed vs. latest available in UDS Registry

**Formula:** Deploy health = ratio of `Ready` Package CRs to total Package CRs; `health_score = len(ready_packages) / len(all_packages)`

---

#### TAB: "Mission Package Health" (killinchu)

**What it does:**  
Per-UDS-Package health dashboard combining:
1. Package CR status (Ready/Pending/Failed from Pepr)
2. Prometheus metrics scraped via the Package's `monitor` spec
3. Active NetworkPolicy allow/deny events (from NeuVector or Istio access logs)
4. Keycloak SSO status (active sessions, auth failures) for the package's SSO clients
5. CVE exposure for the package's images (OSV.dev + KEV)

**Backend:**
- `kubectl get package my-app -n my-ns -o yaml` → extract `status` conditions
- Prometheus query: `{service="my-app"}` golden signals
- Keycloak Admin API: `/auth/admin/realms/{realm}/clients/{id}/user-sessions/count`
- NeuVector API or Istio Prometheus metrics: `istio_requests_total{destination_workload="my-app",response_code=~"5.."}`
- OSV.dev: POST `https://api.osv.dev/v1/query` with package versions from SBOM

---

#### TAB: "Pepr Policy Inspector" (a11oy)

**What it does:**  
Live view of Pepr webhook decisions: mutations applied, validations denied, watch reconciliation events. Show:
- Policy rule name → resource → namespace → decision (admit/mutate/deny) → timestamp
- Exemption CR browser: which workloads have policy bypasses and why
- Policy coverage map: which namespaces/workloads are protected vs. exempt

**Backend:**
- `kubectl logs -n pepr-system deployment/pepr-... --follow`
- Parse Pepr structured logs (JSON) for `allowed`, `mutated`, `denied` events
- `kubectl get exemptions -A -o json` for exemption registry

---

#### TAB: "Zarf Dev Workbench" (a11oy — developer tab)

**What it does:**  
IDE-like tab for iterating on `zarf.yaml` packages:
- Schema-validated YAML editor (real-time validation against Zarf JSON schema)
- `zarf dev find-images` runner — paste a Helm chart URL, get back the image list
- `zarf dev lint` output inline
- Image list with CVE status from OSV
- SBOM preview before package creation
- Package create/deploy status tracking

**Commands internally:**
```bash
zarf dev find-images ./chart --kube-version=1.28.0
zarf dev lint .
zarf dev generate-config
```

---

### 4.11 Key Architecture Insights for SZL Holdings

1. **The UDS Package CRD is the integration point.** Every application deployed into UDS must have a `Package` CR. Build your a11oy/killinchu tabs to READ and WRITE Package CRs — this gives you real integration vs. just visualization.

2. **Pepr is the operator framework.** Write your own Pepr module for killinchu-specific policies (e.g., block egress from mission-critical namespaces, enforce image signature requirements on tactical edge). It's MIT-licensed TypeScript — entirely adoptable.

3. **Zarf's SBOM output is automatic.** `zarf package create` auto-generates CycloneDX SBOMs for all images. You get supply chain transparency for free. Build UI to surface this.

4. **UDS Fleet (June 2026) = your killinchu fleet tab's direct competitor and template.** Study the UDS Fleet Connect + UDS Fleet Command feature set closely — these are the patterns to adopt for multi-drone/ship management.

5. **UDS Registry (June 2025) = your package catalog backend.** Your a11oy tabs can query the UDS Registry API for package metadata, CVE status, signing status. Build a "Mission App Store" view on top of it.

6. **Air-gap-first means no runtime external dependencies.** Everything — Prometheus, Grafana, Loki, Keycloak, Istio — is bundled in UDS Core and deployed offline. Your UI must work offline too (serve from cluster, no CDN calls).

---

## 5. Open Enterprise Data Sources

### For a11oy and killinchu UI prototyping and production integration

---

| Source | What It Provides | Endpoint / Access | License | Fits Which App/Tab | Notes |
|---|---|---|---|---|---|
| **Prometheus** (CNCF) | Time-series metrics; golden signals; custom metrics from any service | `http://prometheus:9090/api/v1/` (cluster-internal); or remote_write to external | Apache 2.0 | a11oy Golden Signals, SLO Dashboard, Mission Package Health | Already in UDS Core; zero-config for apps with Package CR `monitor` spec |
| **OpenTelemetry Collector** | Unified traces, metrics, logs from any source; OTLP protocol | `http://otel-collector:4317` (gRPC) / `4318` (HTTP); remote_write to Prometheus | Apache 2.0 | a11oy Anomaly Detection; killinchu sensor fusion | Deploy as DaemonSet; auto-instrument via OTEL SDKs |
| **Loki** (Grafana) | Log aggregation; label-based querying; LogQL | `http://loki:3100/loki/api/v1/query_range` | AGPL-3.0 (note) / AGPLv3 for cloud; Apache 2.0 for core libs | a11oy Anomaly Detection; killinchu Package Health | Already in UDS Core |
| **CISA KEV** (Known Exploited Vulnerabilities) | CISA's authoritative list of exploited CVEs; JSON feed | `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json` | CC0 (public domain) ([CISA KEV GitHub mirror](https://github.com/cisagov/kev-data)) | a11oy Package Lineage; killinchu CVE triage | Updated daily; free, no auth |
| **OSV.dev** | Open Source Vulnerability database aggregating NVD, GitHub Advisory, etc. | `https://api.osv.dev/v1/query` (POST, no auth) ([OSV.dev](https://osv.dev)) | Apache 2.0 (API free) | a11oy Package Lineage; killinchu Mission Package Health | Query by package version + ecosystem; returns CVE list |
| **Sigstore Rekor** | Software supply chain transparency log; verify artifact signatures + provenance | `https://rekor.sigstore.dev/api/v1/log/entries/retrieve` (POST, no auth) ([Sigstore Rekor docs](https://docs.sigstore.dev/logging/overview/)) | Apache 2.0 | a11oy Package Lineage | Returns: entry UUID, signed metadata, inclusion proof. Use `cosign` CLI or Rekor SDK |
| **SLSA / in-toto** | Build provenance attestation format; cryptographically links artifact to build process | Embedded in OCI artifacts as `application/vnd.in-toto+json` layer ([SLSA spec](https://slsa.dev/spec/v0.1/provenance)) | Apache 2.0 | a11oy Package Lineage | Read via `cosign download attestation`; predicate type: `https://slsa.dev/provenance/v1` |
| **SPDX 3.0** | SBOM format: ISO standard; strong license compliance; profiles: Licensing, Security, Build, AI | Embedded in Zarf packages as `sboms.tar` (also: JSON/XML files) | Apache 2.0 for tooling; SPDX spec open | a11oy Bundle Composer; killinchu Mission Package Health | `syft` (Apache 2.0) generates; `spdx-tools` (Apache 2.0) parses |
| **CycloneDX** | SBOM format: security-focused; VEX support; lighter than SPDX | Zarf auto-generates CycloneDX SBOM per package | Apache 2.0 tooling | All tabs needing SBOM | Zarf's native SBOM format; parse `bom.json` from package |
| **NVD / CVE** | National Vulnerability Database; CVE details, CVSS scores | `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-XXXX` (free, rate-limited) | U.S. Government — public domain | a11oy Package Lineage | Pair with OSV.dev for richer data |
| **OpenSky Network** | Real-time ADS-B aircraft tracks; JSON API | `https://opensky-network.org/api/states/all` (anonymous: 400 req/day; registered: more) | CC BY 4.0 | killinchu Maritime/Air Track | Research/non-commercial; good for prototype |
| **AIS Marine Traffic** | AIS vessel positions; open data from MarineTraffic or AISHub | `https://www.aishub.net/ais-dispatcher` (AISHub cooperative); `https://api.marinetraffic.com` (paid tier) | Varies | killinchu Maritime Track | AISHub: free cooperative feed; need decoder for NMEA |
| **Prometheus AlertManager** | Alert routing, grouping, silencing; webhook receiver API | `http://alertmanager:9093/api/v2/` | Apache 2.0 | a11oy Incident Manager | Already in UDS Core via Prometheus Stack |
| **Grafana Annotations** | Mark time-series events (deployments, incidents) on dashboards | `POST http://grafana:3000/api/annotations` | AGPL-3.0 (core OSS) | a11oy Deployment Correlation | Already in UDS Core |
| **Keycloak Admin API** | User sessions, client activity, realm events, audit logs | `http://keycloak:8080/auth/admin/realms/{realm}/events` | Apache 2.0 | a11oy Access Governance; killinchu SSO health | Already in UDS Core |
| **NeuVector API** | Container security: runtime threats, network connections, policy violations | `https://neuvector:10443/v1/` | Apache 2.0 | killinchu Mission Package Health; Security Policy | Already in UDS Core |

---

## 6. Master Table

### Master Capability → Tab → App → Data Source → Formula → Library

| # | Capability | Our Tab Name | App | Data Source | Core Formula / Algorithm | Library (License) | IP Note |
|---|---|---|---|---|---|---|---|
| 1 | Ontology / Object Model | **Mission Ontology** | a11oy | Our own entity data + AIS + OSV | Labeled property graph; adjacency list traversal (BFS/DFS) | Dgraph (Apache 2.0) or Postgres + graphql-go (MIT) | Pattern only; no Palantir code |
| 2 | Data Pipeline + Lineage | **Pipeline Lineage** | a11oy | OpenLineage events from our pipelines | DAG topological sort (Kahn's); change propagation = reverse-reachability | Apache Airflow (Apache 2.0) + Marquez (Apache 2.0) | Pattern only |
| 3 | MAC/DAC/ABAC Access Control | **Access Governance** | a11oy + killinchu | Keycloak groups/attributes (UDS Core) | ABAC = f(subject_attrs, resource_attrs, action) → permit/deny (NIST SP 800-162) | OPA / Rego (Apache 2.0) | NIST standard; OPA open |
| 4 | LLM over Governed Data (OAG) | **Governed AI Reasoning** | a11oy | Mission Ontology graph + Prometheus metrics | GraphRAG: structured context retrieval → LLM synthesis; function-calling pattern | LangGraph (MIT) + LiteLLM (MIT) + OPA (Apache 2.0) | Pattern only; GraphRAG open |
| 5 | COA / Simulation | **Course of Action Planner** | killinchu | Entity graph state + AIS tracks | Monte Carlo simulation; TOPSIS multi-criteria ranking; optimal routing (Dijkstra variant) | OR-Tools (Apache 2.0) + NumPy (BSD-3) | Pattern only |
| 6 | Golden Signals | **Golden Signals Monitor** | a11oy + killinchu | Prometheus (UDS Core) + OTEL | `rate()`, `histogram_quantile()`, `avg()` in PromQL | Prometheus (Apache 2.0) + Grafana (AGPL note) | All open standards |
| 7 | SLO + Error Budget | **SLO Dashboard** | a11oy | Prometheus metrics | `burn_rate = error_rate / (1 - target)`; multi-burn-rate alerts | Sloth (Apache 2.0) + OpenSLO (Apache 2.0) | Google SRE pattern; all open |
| 8 | Anomaly Detection | **Anomaly Detection Engine** | a11oy | Prometheus + Loki (UDS Core) | STL decomposition + rolling z-score: `z = (x - μ_window) / σ_window`; Isolation Forest | Prophet (MIT) + PyOD (BSD-2) | All open |
| 9 | Change / Deployment Correlation | **Deployment Correlation** | a11oy | Prometheus + Postgres event log | Temporal event join; metric delta: `Δ = metric[t+30m] - metric[t-30m]`; t-test for regression | Grafana Annotations (AGPL) + SciPy (BSD-3) | All open |
| 10 | Entity Governance + Software Catalog | **Asset Catalog** | a11oy | OTel resource attrs + K8s labels + Zarf package metadata | Entity synthesis: match telemetry attrs → typed entity GUID; scorecard = policy-as-code | Backstage (Apache 2.0) + OPA (Apache 2.0) | All open |
| 11 | Incident Workflow | **Incident Manager** | a11oy + killinchu | Prometheus Alertmanager + Postgres | MTTD = `first_alert_ts - anomaly_start_ts`; MTTR = `resolved_ts - created_ts` | Alertmanager (Apache 2.0) + custom Postgres | All open |
| 12 | TDL Simulation / Network Testing | **TDL Network View** | killinchu | DIS/JREAP simulated tracks + Link 16 messages | N/A for simulation; message decode = MIL-STD-3011 bit fields | OpenDIS (BSD-2) | TCG BOSS = proprietary; DIS standard = open |
| 13 | Zarf Bundle Composer | **Bundle Composer** | a11oy + killinchu | UDS Registry API + package SBOMs (CycloneDX) | SBOM union = merge component lists; CVE = JOIN SBOM with OSV API | uds-cli (Apache 2.0) + CycloneDX-py (Apache 2.0) | Fully open |
| 14 | Package Provenance / Lineage | **Package Lineage** | a11oy | Rekor transparency log + SLSA attestation + cosign | Inclusion proof = Merkle tree root verification; provenance chain = recursive attestation traversal | cosign (Apache 2.0) + rekor-cli (Apache 2.0) | Fully open; sigstore ecosystem |
| 15 | Air-Gap Deploy Status | **Air-Gap Deploy Status** | killinchu | kubectl Package CRs + Zarf state ConfigMap + UDS Registry | Deploy health score = `len(ready_pkgs) / len(all_pkgs)`; version delta = semver compare | kubernetes client-go (Apache 2.0) | Fully open |
| 16 | Mission Package Health | **Mission Package Health** | killinchu | Prometheus + Keycloak Admin API + OSV + NeuVector API | Health composite = weighted sum(golden signals SLI, SSO health, CVE severity score, NeuVector policy violations) | Prometheus client (Apache 2.0) + requests (Apache 2.0) | Fully open; all UDS Core APIs |
| 17 | Pepr Policy Inspector | **Pepr Policy Inspector** | a11oy | Pepr structured logs + kubectl Exemption CRs | Policy coverage = `protected_workloads / total_workloads`; denial rate = `denied_events / admission_events` | kubectl (Apache 2.0) + Pepr SDK (Apache 2.0) | Fully open |
| 18 | Zarf Dev Workbench | **Zarf Dev Workbench** | a11oy | Zarf JSON schema + OSV API + local file system | Schema validation = JSON Schema Draft-07; image CVE = OSV batch query | Zarf CLI (MIT) + ajv (MIT) | Fully open |

---

## Summary Notes for SZL Holdings

### What to Build First (Prioritized by Founder's UDS Environment)

**Week 1-2 (UDS environment is live):**
1. **Air-Gap Deploy Status tab** — `kubectl get packages -A` → parse → display health grid. Immediate value.
2. **Mission Package Health tab** — combine Package CR status + Prometheus golden signals per package. Directly wires to UDS Core's Prometheus.
3. **Pepr Policy Inspector** — stream Pepr logs → parse → show policy decisions. No extra infrastructure.

**Week 3-4 (Building on UDS Core data):**
4. **Bundle Composer** — parse `uds-bundle.yaml` + Zarf package SBOMs → show composition + CVEs
5. **Package Lineage** — cosign verify + Rekor lookup → provenance chain UI
6. **Golden Signals Monitor** — Prometheus queries → Grafana-style charts (use `uplot` or Chart.js, MIT license)

**Month 2 (a11oy intelligence layer):**
7. **Mission Ontology** — typed entity graph; wire to AIS + drone tracks
8. **SLO Dashboard** — Sloth-generated alerts + burn rate visualization
9. **Governed AI Reasoning** — GraphRAG over Mission Ontology; LangGraph agent with OPA tool gating

### License Summary for IP Safety

| What We Adopt | License | Attribution Required |
|---|---|---|
| Zarf (create, deploy, SBOM) | MIT | Yes — attribution in docs |
| UDS Core, UDS CLI, Pepr | Apache 2.0 | Yes — NOTICE file |
| OpenLineage, Marquez | Apache 2.0 | Yes |
| Airflow, Prefect | Apache 2.0 | Yes |
| OPA / Rego | Apache 2.0 | Yes |
| LangGraph, LiteLLM | MIT | Yes |
| OR-Tools | Apache 2.0 | Yes |
| Prophet | MIT | Yes |
| PyOD, NumPy, SciPy | BSD-2/BSD-3 | Yes — LICENSE file |
| Prometheus, Alertmanager, Thanos | Apache 2.0 | Yes |
| OTEL Collector | Apache 2.0 | Yes |
| Grafana (OSS) | **AGPL-3.0** | **Do not embed in proprietary product; run as separate service** |
| Loki (core) | **AGPL-3.0** | **Same — separate service** |
| Backstage | Apache 2.0 | Yes |
| cosign, rekor-cli | Apache 2.0 | Yes |
| CycloneDX-py, spdx-tools | Apache 2.0 | Yes |
| Neo4j Community | **GPL-3.0** | **Do not embed; use as separate service or use Dgraph Apache 2.0** |

**Critical:** Grafana and Loki are AGPL-3.0. Do NOT embed them in a closed-source product. Deploy as separate services (which UDS Core already does) and call their APIs from your tabs. This is fine legally.

### Palantir — What Is Just UI vs. Deep Concept

| Item | Type | Note |
|---|---|---|
| Workshop UI builder | **UI/UX pattern** | We build our own tab system |
| Object Explorer | **UI/UX pattern** | Standard search UI over typed entities |
| Ontology itself | **DEEP concept** | Knowledge graph — adopt the pattern |
| OAG (structured retrieval) | **DEEP concept** | GraphRAG — adopt the pattern |
| Apollo (air-gap deployment) | **DEEP concept** | Zarf/UDS IS our Apollo |
| AIP Analyst chat UI | **UI/UX pattern** | Build chat panel over our own agent |
| k-LLM routing | **DEEP concept** | LiteLLM implements this — adopt it |
| AIP Evals framework | **DEEP concept** | RAGAS/custom eval suite — adopt it |
| Rubix zero-trust runtime | **DEEP concept** | This IS UDS Core (Istio + NeuVector + Pepr) |

---

*Research compiled June 2026. All cited sources linked inline. No proprietary code examined or reproduced.*
