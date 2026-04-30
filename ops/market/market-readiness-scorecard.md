# Market Readiness Scorecard

**Date:** April 2026  
**Purpose:** Honest assessment of SZL Holdings commercial readiness across 8 dimensions.

---

## Scoring Method

Each dimension is scored on a 5-point scale:

| Score | Label | Meaning |
|---|---|---|
| 5 | Production Ready | No gaps; ready for enterprise buyers without qualification |
| 4 | Near Ready | Minor gaps; manageable in commercial conversations |
| 3 | Functional | Core capability exists; known gaps that require disclosure |
| 2 | Early Stage | Foundational work done; significant gaps remain |
| 1 | Not Ready | Material gaps that block commercial engagement |

---

## Dimension 1: Platform Product Readiness

**Score: 4 / 5 — Near Ready**

| Criterion | Status |
|---|---|
| All domain packs functional | ✓ Functional alpha across Aegis, Vessels, Terra, Counsel, Carlota Jo |
| Proof Chain and governance primitives working | ✓ Built and functional |
| RBAC and multi-tenancy | ✓ Architectural, org-scoped |
| API documented | ✓ Swagger UI + OpenAPI spec |
| Mobile app functional | ✓ szl-holdings-mobile — needs real-device verification |
| Live production data | ✗ Demo/seeded data; no live external data feeds |
| Penetration test completed | ✗ Not yet |
| SOC 2 certified | ✗ Phase 3 |

**Gap:** Live data feeds (AIS, MLS, threat intel) are required for full production value. Pilots can validate workflows with seeded/demo data, but production will need real feeds.

---

## Dimension 2: Commercial Operating Model

**Score: 4 / 5 — Near Ready**

| Criterion | Status |
|---|---|
| Design partner program defined | ✓ ops/market/ suite complete |
| Buyer journey mapped | ✓ public-buyer-journey-final.md |
| Packaging model defined | ✓ packaging-model-final.md |
| Pricing framework documented | ✓ founder-pricing-notes-final.md |
| Pilot agreement template | ✗ Not yet drafted |
| DPA template | ✗ Not yet drafted |
| MSA template | ✗ Not yet drafted |

**Gap:** Legal templates (pilot LOI, MSA, DPA) are not yet drafted. This is the highest-priority commercial gap — no pilot can close without an agreement.

---

## Dimension 3: Trust and Diligence Infrastructure

**Score: 3 / 5 — Functional**

| Criterion | Status |
|---|---|
| Trust Center content specification | ✓ trust-center-launch-pass.md |
| Diligence paths by persona | ✓ diligence-fast-path-final.md |
| Threat model documented | ✓ ops/security/threat-model-summary.md |
| Secret inventory documented | ✓ ops/security/secret-inventory.md |
| Trust Center pages live at /trust | Needs verification |
| SOC 2 Type II | ✗ Phase 3 |
| Penetration test report | ✗ Not yet |
| Immutable log sink | ✗ On roadmap |

**Gap:** Known security gaps are documented and disclosed proactively, which is the right approach. The missing Trust Center verification and pending security certifications are the material gaps. Enterprise security reviewers will surface these — have answers ready.

---

## Dimension 4: Proof Engine and References

**Score: 1 / 5 — Not Ready (Expected: No Pilots Yet)**

| Criterion | Status |
|---|---|
| Proof model defined | ✓ proof-engine-final.md |
| Pilot-to-case-study playbook | ✓ pilot-to-case-study-playbook.md |
| Referenceability ladder defined | ✓ referenceability-ladder.md |
| Completed pilots | ✗ None yet |
| Anonymous case studies | ✗ None yet |
| Named case studies | ✗ None yet |
| Named testimonials | ✗ None yet |

**Gap:** This is expected at pre-design-partner stage. Score of 1 reflects reality, not failure. The infrastructure for proof capture is in place. Execution is what elevates this score.

**Path to 3:** Complete first pilot, capture baseline-to-delta data, publish anonymous case study.
**Path to 5:** 2+ named case studies across domains, peer references available.

---

## Dimension 5: Go-To-Market Motion

**Score: 3 / 5 — Functional**

| Criterion | Status |
|---|---|
| Category story clear | ✓ category-story-final.md |
| Buyer journey defined | ✓ public-buyer-journey-final.md |
| Design partner pipeline exists | Needs confirmation |
| Demo materials ready | ✓ content/demos/ |
| Qualified prospects in pipeline | Status unknown |
| Demo request flow working | Needs verification |
| Analytics tracking funnel | ✗ PostHog/analytics not yet configured |
| Sales playbook | Partially — objection handling in buyer-evaluation-map.md |

**Gap:** Analytics implementation is the operational gap (cannot track what is working without data). Pipeline status is unknown without seeing the actual state of the founder's outreach. The positioning and materials are ready; the execution of outreach and pipeline building is the variable.

---

## Dimension 6: Operational Readiness

**Score: 4 / 5 — Near Ready**

| Criterion | Status |
|---|---|
| Deployment process documented | ✓ environment-and-release-final.md |
| Post-deploy verification | ✓ post-deploy-verification-final.md |
| Rollback procedure | ✓ Defined and tested in principle |
| Incident response runbook | ✓ docs/internal/ops/incident-response-runbook.md |
| Founder control room | ✓ founder-support-control-room.md |
| Weekly operating rhythm | ✓ weekly-operating-pack.md |
| Staging environment | ✗ Not yet configured |
| CI/CD pipeline | ✗ Not yet configured |
| Monitoring / alerting | ✗ Not yet configured beyond health endpoints |

**Gap:** Staging environment and CI/CD are the operational gaps. Both are manageable at design partner stage where deploy frequency is controlled. Required before first production customer.

---

## Dimension 7: Mobile Readiness

**Score: 3 / 5 — Functional**

| Criterion | Status |
|---|---|
| Canonical app identified | ✓ szl-holdings-mobile |
| App builds and runs | ✓ (dev environment) |
| Auth flow functional | ✓ Biometric + PIN built |
| Beta lifecycle defined | ✓ mobile-beta-final.md |
| Real-device verification | ✗ Not yet confirmed |
| TestFlight build submitted | ✗ Not yet |
| Apple app configured in ASC | ✗ Not yet |
| EAS project linked | ✗ Not yet (placeholder UUID) |
| Firebase credentials real | ✗ Placeholder files only |

**Gap:** Mobile is functionally built but not yet submitted or verified on real devices. All blocking actions are console/configuration tasks, not code tasks.

---

## Dimension 8: API and Integration Readiness

**Score: 3 / 5 — Functional**

| Criterion | Status |
|---|---|
| API documented (Swagger) | ✓ /api/docs |
| OpenAPI spec exists | ✓ lib/api-spec/openapi.yaml |
| Error taxonomy documented | ✓ api-standards.md |
| Authentication documented | ✓ api-commercial-readiness.md |
| Integration priority map | ✓ integration-priority-map.md |
| Technical evaluator brief | ✓ technical-evaluator-brief.md |
| Real AIS data connected | ✗ Placeholder |
| Real property data connected | ✗ Placeholder |
| Webhooks available | ✗ On roadmap |
| Developer sandbox | ✗ On roadmap |
| OAuth 2.0 for third-party apps | ✗ On roadmap |

**Gap:** Live data feed connections and outbound webhooks are the material gaps. The API infrastructure is solid; it is the data sources behind it that need production-level connections.

---

## Overall Score

| Dimension | Score | Weight | Weighted Score |
|---|---|---|---|
| Platform Product Readiness | 4 | High | 4.0 |
| Commercial Operating Model | 4 | High | 4.0 |
| Trust and Diligence Infrastructure | 3 | High | 3.0 |
| Proof Engine and References | 1 | Medium | 1.0 |
| Go-To-Market Motion | 3 | High | 3.0 |
| Operational Readiness | 4 | Medium | 4.0 |
| Mobile Readiness | 3 | Medium | 3.0 |
| API and Integration Readiness | 3 | Medium | 3.0 |

**Composite average: 3.1 / 5.0**

**Assessment: Design Partner Phase Ready**

The platform is ready to run design partner pilots. It is not yet ready for unassisted enterprise commercial agreements. The gap between 3.1 and "production ready" (4.5+) is closed through: completing pilots, establishing proof, configuring legal templates, and building the operational infrastructure (staging, CI, monitoring) that production customers require.

---

*See also: `go-to-market-readiness-verdict.md` (founder-readable verdict), `founder-next-15-actions.md` (priorities)*
