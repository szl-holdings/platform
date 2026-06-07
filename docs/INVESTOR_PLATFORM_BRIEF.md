# SZL Holdings — Investor Platform Brief

**Date:** April 28, 2026
**Classification:** Confidential — investor evaluation only

---

## The Problem

Enterprises operating at scale face the same structural difficulty: too many systems, too few connections.

They have monitoring tools that see infrastructure but not business impact. They have analytics platforms that surface trends but not causes. They have workflow tools that execute tasks but don't understand the signals that triggered them. The result is a permanent state of reactive management — decisions made on partial information, problems identified after they compound, and executives spending most of their time synthesising fragmented signals manually.

This is not a data problem. Organisations have more data than they can use. It is a governance problem: the gap between what the system knows and what the people running it can act on — safely, quickly, and with accountability.

---

## The Category: Governed Decision Operating System

SZL Holdings is creating a new category. Not another dashboard. Not another copilot. Not another BI tool with AI bolted on.

A **Governed Decision Operating System** (GDOS) is infrastructure that makes every consequential business decision observable, explainable, approvable, replayable, and auditable — across every domain in an enterprise.

Three forces make this category inevitable now:

1. **AI is making decisions faster than humans can audit.** Without governance infrastructure, organisations cannot verify what their AI recommended, why, or whether policy was followed. The liability gap is widening.

2. **Regulators are demanding explainability.** EU AI Act (effective August 2025), SEC AI disclosure requirements, and NIST AI RMF all require traceable decision lineage, human oversight, and documented evidence chains. Dashboards cannot satisfy these requirements.

3. **Multi-domain enterprises need cross-cutting intelligence.** A port delay affects real estate timelines. A security incident triggers legal holds. A market shift requires portfolio rebalancing. No single-domain tool handles the cascade.

---

## What We Built

### Platform Scale (Code-Derived Metrics — Not Hand-Written)

| Metric | Count | Source |
|--------|-------|--------|
| TypeScript/TSX source files | 6,235+ | Filesystem scan |
| API route files | 347 | Route file introspection |
| Database schema tables | 1,047 | Live PostgreSQL count |
| Shared libraries (`lib/`) | 41 | Directory count |
| Domain/platform packages (`packages/`) | 82 | Directory count |
| Total packages | 123 | Audit source-of-truth |
| CI/CD workflows | 22 | GitHub Actions |
| Domain packs | 6 | Registered artifacts |
| E2E test specs | 26+ | Playwright test files |
| DB schema migration files | 165 | Schema file count |

*All figures derived from `audit/source-of-truth.json` and CI-verified counts.*

### Six Core Platform Primitives

| Primitive | Package(s) | What It Does | Status |
|-----------|-----------|-------------|--------|
| **Outcome Graph** | `lib/outcome-graph` | Full decision lifecycle tracking: recommendation → action → outcome. Closed-loop calibration. | **Operational** |
| **Proof Chain** | `lib/proof-chain` | Immutable hash-linked audit trail for every consequential action | **Operational** |
| **Decision Replay** | `packages/replay-core` + `packages/trace-graph` | Full reconstruction of any decision from trace, with integrity verification | **Operational** |
| **Human Approval Gates** | `lib/approvals` + `lib/covenant-policy` | Policy-enforced approval gates — AI cannot act without human confirmation | **Operational** |
| **Policy Engine** | `lib/policy-engine` + `packages/guardian` | Risk-tier rules evaluated at runtime; configurable per domain and role | **Operational** |
| **Event Fabric** | `packages/signal-mesh` + `lib/prism-bus` | Cross-domain event routing, normalization, and cascade orchestration | **Operational** |

These are implemented packages in the monorepo — not architecture diagrams.

### Domain Coverage

| Domain | Product | Status | Live Data Sources |
|--------|---------|--------|-------------------|
| Decision Intelligence | Lyte (Command Center) | **Beta** | Signal fusion, action queue, outcome tracking |
| Security | Sentra | **Beta** | CISA KEV, NVD CVE, MITRE ATT&CK, AbuseIPDB (live feeds) |
| Maritime | Vessels | **Partial** | NOAA, Open-Meteo (live); AIS telemetry simulated |
| Real Estate | Terra | **Beta** | NYC Open Data, Census, BLS, FEMA, SEC EDGAR (live feeds) |
| Legal | Counsel | **Beta** | Matter management, filings, obligation tracking |
| Advisory | Carlota Jo | **Beta** | Client and engagement management |
| Executive Briefing | Pulse | **Beta** | Cross-domain signal synthesis, AI narrative generation |
| Mobile Command | CORTEX | **Beta** | Expo React Native (iOS + Android) |

---

## What Is Not Yet Operational

We are transparent about gaps. Every investor/buyer deserves to know:

| Gap | Current State | Path to Resolution |
|-----|--------------|-------------------|
| AIS live data | Vessels uses simulated telemetry | Paid AIS subscription ($15–40K/year) |
| Dashboard KPIs | Some seeded values, not live aggregation | Wire to live query layer |
| Redis sessions | In-memory sessions in development | Configure Redis for production deployment |
| Sentry error tracking | Not configured | Configure DSN for production |
| Mapbox maps | Terra maps require token | Configure Mapbox subscription |
| SBOM generation | Not in CI pipeline | Add CycloneDX step to release workflow |
| SOC 2 Type II | Not yet initiated | Planned Phase 3 (Days 60–90) |

---

## Trust Architecture

| Concern | How We Address It |
|---------|-------------------|
| AI oversight | Covenant Policy enforces approval gates — no unsupervised AI execution |
| Transparency | All recommendations include source citations, confidence scores, provenance |
| Audit trail | Every write generates an immutable audit event with actor attribution |
| Access control | 12-role RBAC + deny-by-default + org-scoped tenant isolation |
| Security | OIDC auth, CSRF, rate limiting, secret scanning, CodeQL, dependency review |
| Governance | Guardian engine with configurable risk tiers and policy rules |
| AI observability | OpenTelemetry-native spans, cognitive observability across model/tool calls |

---

## Technical Credibility

| Signal | Evidence |
|--------|----------|
| Code quality | TypeScript strict mode, Biome linting, Drizzle ORM type safety |
| CI discipline | 22 GitHub Actions workflows, all with pinned SHAs |
| Security posture | Secret scanning (push + scheduled), CodeQL, dependency review, SAST |
| Test coverage | 26+ E2E specs (Playwright), unit tests, smoke tests, package boundary checks |
| Documentation | 650+ markdown files, auto-generated platform facts, trust center |
| Supply chain | Lock file committed, action SHAs pinned, dependency review on PRs |

---

## The Structural Moat

The moat is not any single feature. It is compounding:

1. **Shared primitives across domains** — Outcome Graph, Proof Chain, Decision Replay, Policy Engine, Event Fabric, and Simulation Engine are implemented once and inherited by every domain pack.

2. **Cross-domain signal cascading** — A signal in one domain triggers governed workflows in others, creating intelligence that no single-domain tool can replicate.

3. **Governance as infrastructure, not afterthought** — Policy enforcement, human approval gates, and audit trails are built into the decision lifecycle, not added as a compliance layer.

4. **Domain compounding** — Each new domain pack adds N*(N-1) new signal pathways. Six domains = 30 possible signal paths. Competitors cannot replicate the mesh.

---

## Competitive Position

| Dimension | Palantir | Dataiku | IBM watsonx | SZL |
|-----------|----------|---------|-------------|-----|
| Decision lifecycle | Ontology action types | ML pipeline | Model lifecycle | **Full 9-step governed loop** |
| Cross-domain cascade | Ontology links | Single-project | Cross-model monitoring | **Signal Mesh across 6 domains** |
| Proof chain | Audit logs | Experiment tracking | Model factsheets | **Hash-linked immutable chain** |
| Decision replay | Pipeline replay (partial) | Experiment replay | Model comparison | **Full trace reconstruction** |
| Human approval gates | Workflow actions | Manual review | Approval workflows | **Policy-governed risk-tier gates** |
| AI observability | AIP telemetry | Model monitoring | Model drift | **OTel-native span correlation** |

*Competitor assessments based on publicly available documentation and product pages as of April 2026.*

---

## Financial Model Inputs

| Metric | Value |
|--------|-------|
| Platform engineering investment | 24+ months |
| Active domain packs | 6 |
| Total route handlers (12 route groups) | 347 route files |
| Database schema complexity | 1,047 tables |
| Unique live data integrations | 8+ feeds |
| Defensible IP | Proof Chain + Outcome Graph + Policy Engine + Decision Replay + Signal Mesh |

---

## Expansion Logic

The platform was designed as a system that compounds — not a collection of independent products.

**Phase 1 — Core Engine:** Build the governed decision infrastructure and prove it in high-stakes verticals (Maritime, Security, Real Estate, Legal). ✓ *Achieved.*

**Phase 2 — Cross-domain intelligence:** Connect signal chains across domains so events in one vertical inform governed workflows in others. *In progress.*

**Phase 3 — Enterprise readiness:** SOC 2 audit, Trust Center, live data subscriptions, guided demo mode. *Days 60–90.*

**Phase 4 — Platform generalization:** The same architecture (Observe → Understand → Execute → Prove) applies across verticals. New domains inherit all primitives.

---

## The Thesis, Stated Plainly

The enterprises that will win the next decade are not the ones with the most data. They are the ones that can reason across their data, connect operational signal to strategic decision, and act with confidence — faster than competitors, and with more accountability than regulators require.

SZL Holdings is building the platform that makes that possible — in verticals where the stakes are high enough that the value is undeniable, with architecture explicit enough that it compounds as we scale.

---

*This document represents the verified platform state as of April 28, 2026. All code-derived metrics are sourced from `audit/source-of-truth.json` and CI-verified counts. For investor due diligence, see `docs/INVESTOR_DILIGENCE_READINESS.md`.*

*Strategic partnership and investment inquiries: inquiries@szlholdings.com*
