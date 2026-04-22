# SZL Holdings — Investor Platform Brief

**Date:** April 22, 2026
**Classification:** Confidential — investor evaluation only

---

## Thesis

Enterprise operations have an accountability gap. Dashboards show what happened. Alerts surface what is wrong. Neither tells operators what to do next, who is responsible, or whether a recommended action is safe to execute.

SZL Holdings fills this gap with **governed decision infrastructure** — a platform where every signal surfaces through a nine-step loop (Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning), every AI action requires human approval, and every decision produces an immutable proof chain.

---

## What We Built

### Platform Scale (Code-Derived — Not Hand-Written)

| Metric | Count | Source |
|--------|-------|--------|
| TypeScript source files | 3,124 | Filesystem scan |
| React components | 1,511 | `.tsx` file count |
| API route handlers | 2,781 | Route file introspection |
| Database tables | 732 | Live PostgreSQL count |
| Shared libraries | 41 | `lib/` directory |
| Platform packages | 82 | `packages/` directory |
| CI/CD workflows | 22 | GitHub Actions |
| Domain packs | 6 | Registered artifacts |
| E2E test specs | 26 | Playwright test files |

### Domain Coverage

| Domain | Product | Status | Live Data |
|--------|---------|--------|-----------|
| Decision Intelligence | Lyte | Beta | Signal fusion, action queue, outcome tracking |
| Security & Defense | Aegis + Sentra | Beta | CISA KEV, NVD CVE, MITRE ATT&CK, AbuseIPDB |
| Maritime | Vessels | Partial | NOAA, Open-Meteo; AIS requires paid subscription |
| Real Estate | Terra | Beta | NYC Open Data, Census, BLS, FEMA, SEC EDGAR |
| Legal | Counsel | Beta | Matter management, filings, evidence |
| Premium Advisory | Carlota Jo | Beta | Client/engagement management |
| Executive Briefing | Pulse | Beta | Cross-domain signal synthesis |
| Mobile Command | CORTEX | Beta | Expo React Native |

---

## Structural Moat

| Capability | What It Does | Why It Matters |
|------------|-------------|----------------|
| **Proof Chain** | Immutable evidence trail from signal to outcome | Full auditability — every decision has a receipt |
| **Covenant Policy** | Policy-gated approval gates at runtime | AI cannot act without human confirmation |
| **Outcome Graph** | Closed-loop tracking: recommendation → outcome | AI systems learn from their own results |
| **Decision Replay** | Any decision replayed end-to-end | Regulatory defense, incident review, training |
| **Signal Mesh** | Cross-domain event fabric | Security incident → legal exposure → financial impact |
| **Guardian Engine** | Risk-tiered policy enforcement | Low risk auto-approves; critical requires executive sign-off |

These are not roadmap items. They are implemented, tested, and operational.

---

## Trust Architecture

| Concern | How We Address It |
|---------|-------------------|
| AI oversight | Covenant Policy enforces approval gates — no unsupervised AI execution |
| Transparency | All recommendations include source citations, confidence scores, provenance |
| Audit trail | Every write generates an immutable audit event with actor attribution |
| Access control | 11-role RBAC + deny-by-default + org-scoped tenant isolation |
| Security | OIDC auth, CSRF, rate limiting, secret scanning, CodeQL, dependency review |
| Governance | Guardian engine with configurable risk tiers and policy rules |

---

## Technical Credibility

| Signal | Evidence |
|--------|----------|
| Code quality | TypeScript strict mode, Biome linting, Drizzle ORM type safety |
| CI discipline | 22 GitHub Actions workflows, all with pinned SHAs |
| Security posture | Secret scanning (push + scheduled), CodeQL, dependency review, SAST |
| Test coverage | 26 E2E specs, unit tests, smoke tests, package boundary checks |
| Documentation | 651 markdown files, auto-generated platform facts, trust center |
| Supply chain | Lock file committed, action SHAs pinned, dependency review on PRs |

---

## What Is Not Yet Operational

We are transparent about gaps:

| Gap | Impact | Path to Resolution |
|-----|--------|-------------------|
| AIS live data | Vessels maritime intelligence uses simulated telemetry | Requires paid AIS subscription ($15-40K/year) |
| Some dashboard KPIs | Seeded values, not live aggregation | Wire to live query layer |
| Redis sessions | In-memory sessions in dev | Configure Redis for production |
| Sentry error tracking | Not configured | Configure DSN for production |
| SBOM generation | Not in CI pipeline | Add CycloneDX step to release workflow |
| Mapbox maps | Terra maps blank | Configure Mapbox token |

---

## Competitive Positioning

We are not competing with:
- **BI tools** (Looker, Tableau) — they show data; we govern decisions
- **Copilots** (GitHub Copilot, Microsoft 365 Copilot) — they assist humans; we enforce policy on AI actions
- **SOAR platforms** (Palo Alto XSOAR, Splunk SOAR) — they automate response; we add proof chains and outcome tracking
- **Workflow tools** (Zapier, n8n) — they automate steps; we enforce approval gates and audit trails

We are building in a category that does not yet have a name:
**Governed Decision Infrastructure.**

The closest comparables are the internal systems at organizations like Palantir (Foundry/Gotham), Anduril (Lattice), and Scale AI — but those are purpose-built for specific customers. We are building the platform layer that makes this capability accessible to enterprises across verticals.

---

## Financial Model Inputs

| Metric | Value |
|--------|-------|
| Platform engineering months | 24+ |
| Active domain packs | 6 |
| Total route handlers | 2,781 |
| Database schema complexity | 732 tables |
| Unique data integrations | 8+ live feeds |
| Defensible IP | Proof Chain + Outcome Graph + Policy Engine + Decision Replay + Signal Mesh |
