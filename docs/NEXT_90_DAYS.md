# SZL Holdings — Next 90 Days

> Updated: April 28, 2026
> Weekly milestones, owners, risk checkpoints, demo milestones, and release gates.

---

## Week 1 (Days 1–7): Foundation Repair

| Milestone | Owner | Status | Risk |
|-----------|-------|--------|------|
| Configure Redis session store | DevOps | In Progress | Low |
| Wire Sentry error monitoring | DevOps | In Progress | Medium |
| Fix migration ordering warnings | Engineering | In Progress | Low |
| Add SBOM generation to CI | Engineering | Not Started | Low |

**Risk Checkpoint:** API server boots with zero warnings. Health endpoint returns healthy.

---

## Week 2 (Days 8–14): CI Hardening

| Milestone | Owner | Risk |
|-----------|-------|------|
| Add external link check workflow | Engineering | Low |
| Automate platform metrics regeneration in CI | Engineering | Low |
| Run full dependency audit and remediate critical findings | Security | Medium |
| Generate SLSA provenance attestation in release workflow | Engineering | Medium |

**Risk Checkpoint:** CI pipeline covers install → typecheck → lint → build → test → security → metrics → provenance.

---

## Week 3 (Days 15–21): Arena Expansion

| Milestone | Owner | Risk |
|-----------|-------|------|
| Add 10 golden scenarios to Command Arena | Engineering | Low |
| Add 5 regression scenarios from known failure modes | Engineering | Low |
| Implement arena results diffing (run-over-run comparison) | Engineering | Medium |
| Run full security scan and remediate findings | Security | Medium |

**Risk Checkpoint:** 20+ arena scenarios, 90%+ pass rate. Provenance in build.

---

## Week 4 (Days 22–28): Production Readiness

| Milestone | Owner | Risk |
|-----------|-------|------|
| Full security scan and remediation | Security | Medium |
| Production deployment with monitoring | DevOps | Medium |
| Hardening audit for all domain pack endpoints | Engineering | Low |

**Release Gate:** First production-monitored deployment with Sentry active.

---

## Week 5 (Days 29–35): Proof Chain Hardening

| Milestone | Owner | Risk |
|-----------|-------|------|
| Proof Chain integrity verification API | Engineering | Medium |
| Chain repair tooling for broken links | Engineering | Medium |
| Proof Chain UI in Command portal | Frontend | Medium |

**Risk Checkpoint:** Proof chain verification endpoint returns pass/fail with evidence. Any decision verifiable end-to-end.

---

## Week 6 (Days 36–42): Outcome Calibration

| Milestone | Owner | Risk |
|-----------|-------|------|
| Outcome Graph calibration loop (predicted vs. actual) | Engineering | High |
| Calibration dashboard in Pulse | Frontend | Medium |
| Outcome tracking for 2+ domains | Engineering | Medium |

**Demo Milestone:** Show outcome calibration loop — "this is what the AI predicted, this is what happened."

---

## Week 7 (Days 43–49): Analyst Layer

| Milestone | Owner | Risk |
|-----------|-------|------|
| Analyst query interface (NL → evidence-backed answer) | AI Engineering | High |
| Source entity linking in responses | Engineering | Medium |
| Policy-aware recommendation in query results | Engineering | Medium |

**Risk Checkpoint:** Analyst layer returns evidence-backed answers with confidence scoring and source citations.

---

## Week 8 (Days 50–56): Cross-Domain Intelligence

| Milestone | Owner | Risk |
|-----------|-------|------|
| 3 new cross-domain signal chains | Engineering | Medium |
| Decision Theater UI (visual replay) | Frontend | High |
| Monte Carlo simulation UI for Terra | Frontend | Medium |
| Policy Registry UI (visual governance dashboard) | Frontend | Medium |

**Demo Milestone:** Walk through a cross-domain cascade in Decision Theater — signal → cascade → approval → outcome.

---

## Week 9 (Days 57–63): Enterprise Readiness

| Milestone | Owner | Risk |
|-----------|-------|------|
| Initiate SOC 2 Type II audit | Compliance | Medium |
| Acquire Mapbox subscription | Business | Low |
| Acquire AIS data subscription | Business | Low |
| Build Trust Center web page (live) | Frontend | Medium |

**Risk Checkpoint:** SOC 2 auditor engaged. Data subscriptions active. Trust Center live and indexed.

---

## Week 10 (Days 64–70): Live Data

| Milestone | Owner | Risk |
|-----------|-------|------|
| Terra map visualization with Mapbox | Frontend | Low |
| Vessels real-time tracking with AIS | Engineering | Medium |
| Live data flowing through signal chains | Engineering | Medium |

**Demo Milestone:** Show live data flowing through governed decision loop — not simulated data.

---

## Week 11 (Days 71–77): Demo Execution

| Milestone | Owner | Risk |
|-----------|-------|------|
| Execute Demo Path 1: Maritime Delay Cascade (live) | Product | Medium |
| Execute Demo Path 2: Security Incident Response (live) | Product | Medium |
| Execute Demo Path 3: Platform Governance Walk-Through | Product | Low |
| Execute Demo Path 4: Registry & Release Confidence | Product | Low |
| Record demo videos | Marketing | Low |

**Demo Milestone:** 4 demo paths recorded with live data. Ready for investor presentation.

---

## Week 12 (Days 78–84): Market Entry

| Milestone | Owner | Risk |
|-----------|-------|------|
| Publish documentation site | Engineering | Low |
| Publish category thesis as thought leadership | Marketing | Low |
| Prepare investor data room | Business | Medium |
| Submit analyst briefing requests (Gartner, IDC) | Business | Medium |

**Release Gate:** Public-ready documentation, data room complete, analyst outreach initiated.

---

## Week 13 (Days 85–90): Assessment

| Milestone | Owner | Risk |
|-----------|-------|------|
| Regenerate platform metrics — compare to Day 1 baseline | Engineering | Low |
| Run full arena evaluation — compare to Day 1 scores | Engineering | Low |
| Update release readiness scorecard | Engineering | Low |
| Executive review of 90-day results | Leadership | Low |

**Final Checkpoint:** Scorecard comparison Day 1 vs Day 90. Category position validated.

---

## Success Metrics at Day 90

| Metric | Target |
|--------|--------|
| Command Arena pass rate | ≥ 90% across 20+ scenarios |
| Domain packs with live data | 5 of 6 (Maritime pending AIS subscription) |
| Demo paths executable | 4 paths, all with live data where available |
| Production error monitoring | Sentry active, zero untracked P0s |
| SOC 2 status | Audit initiated |
| Investor data room | Complete and reviewed |
