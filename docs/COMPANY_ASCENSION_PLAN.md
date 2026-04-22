# SZL Holdings — Company Ascension Plan

> April 22, 2026

## Platform Moat Statement

SZL Holdings is the only company with a governed decision operating system that implements the full decision lifecycle (Signal → Context → Recommendation → Simulation → Policy → Execution → Proof → Outcome → Learning) as shared infrastructure across six commercial domains, with immutable proof chains, full decision replay, and policy-governed AI — all implemented in code, not slide decks.

---

## Phase 1: Hardening (Days 0–30)

**Objective:** Make the platform production-trustworthy.

### Week 1–2: Infrastructure
- [ ] Fix migration ordering (Task #2886) — eliminate startup warnings
- [ ] Configure Redis session store — eliminate in-memory session risk
- [ ] Wire Sentry error monitoring — production observability
- [ ] Delete dead artifact directories (cortex-mobile, imperium, prism-counsel) — reduce cognitive overhead
- [ ] Add SBOM generation to CI pipeline

### Week 3–4: Quality
- [ ] Expand Command Arena from 5 to 20 scenarios (add golden + regression packs)
- [ ] Add external link check to CI
- [ ] Generate SLSA provenance attestation in release workflow
- [ ] Run full security scan and remediate findings
- [ ] Automate platform metrics regeneration in CI

### Deliverables
- API server boots cleanly with zero warnings
- Production error monitoring active
- 20+ Arena scenarios with 90%+ pass rate
- SBOM and provenance in every release

---

## Phase 2: Shared Platform Buildout (Days 30–60)

**Objective:** Make the shared primitives production-grade and demonstrate cross-domain intelligence.

### Week 5–6: Primitives
- [ ] Harden Proof Chain API — integrity verification endpoint, chain repair tools
- [ ] Implement Outcome Graph calibration loop — predicted vs. actual outcome tracking
- [ ] Build Analyst Layer query interface — structured business question → evidence-backed answer
- [ ] Add Document Fabric extraction pipeline for Counsel domain — automated clause extraction

### Week 7–8: Cross-Domain
- [ ] Build 3 new cross-domain signal chains (supply chain, insurance, energy)
- [ ] Implement Decision Theater UI in Command portal — visual replay walkthrough
- [ ] Add Monte Carlo simulation UI for Terra property risk scenarios
- [ ] Build Model Policy Registry UI — visual model/prompt governance dashboard

### Deliverables
- Proof Chain integrity verification live
- Outcome calibration loop running for 2+ domains
- Analyst Layer answering structured queries with evidence
- 6+ cross-domain signal chains active
- Decision Theater UI demonstrable

---

## Phase 3: Buyer/Investor Acceleration (Days 60–90)

**Objective:** Make the platform sellable and fundable.

### Week 9–10: Enterprise Readiness
- [ ] Initiate SOC 2 Type II audit
- [ ] Build Trust Center web page (live, not just markdown)
- [ ] Create guided demo mode — curated walkthrough for prospects
- [ ] Publish public documentation site from docs/
- [ ] Acquire Mapbox and AIS subscriptions for live data demos

### Week 11–12: Market Entry
- [ ] Execute 3 demo paths with live data (Maritime Cascade, Security Response, Platform Governance)
- [ ] Record demo videos for investor materials
- [ ] Publish CATEGORY_THESIS and COMPETITIVE_POSITIONING as public thought leadership
- [ ] Submit to analyst briefings (Gartner, IDC, Forrester)
- [ ] Prepare data room with: metrics, arena results, architecture docs, security posture

### Deliverables
- SOC 2 audit initiated
- Trust Center live on web
- 3 demo paths executable with live data
- Data room complete for investor review
- Analyst briefing materials ready

---

## Lane-by-Lane Priorities

| Lane | 0–30 Days | 30–60 Days | 60–90 Days |
|------|-----------|-----------|-----------|
| **LYTE** | Arena scenario expansion | Decision Theater UI | Demo path: governance walkthrough |
| **AEGIS** | Sentry integration | Incident replay UI | Demo path: security response |
| **VESSELS** | Fix boot warnings | AIS data integration | Demo path: maritime cascade |
| **TERRA** | Mapbox token | Monte Carlo UI | Property risk demo |
| **COUNSEL** | Document extraction pipeline | Clause-to-action lineage | Legal hold demo |
| **CARLOTA JO** | Endpoint auth fix (#1367) | Operations accountability UI | Client onboarding demo |

---

## Dependencies

| Dependency | Impact | Resolution |
|-----------|--------|-----------|
| Redis configuration | Session persistence | DevOps — Sprint 1 |
| Mapbox subscription | Terra map visualization | Business — Sprint 2 |
| AIS subscription | Vessels real-time data | Business — Sprint 3 |
| SOC 2 auditor engagement | Enterprise procurement | Compliance — Sprint 4 |
| 1 additional engineer | Accelerate Phase 2 primitives | Hiring — Immediate |
| 1 DevOps/SRE | Production monitoring + CI hardening | Hiring — Sprint 2 |
