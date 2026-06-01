# Risk Register — SZL Holdings Platform
## Series A Investor Readiness

**Produced:** Phase D, April 2026
**Scope:** All material risks relevant to a Series A investment decision — technical, operational, commercial, regulatory, and public-surface risks.
**Classification:** HONEST — this document is not a marketing artifact. It is written for investor due diligence.

---

## Risk Severity Framework

| Level | Definition |
|-------|------------|
| **Critical** | Would block a funding decision or require immediate remediation before investor conversations |
| **High** | Material concern that requires a credible mitigation plan and disclosure |
| **Medium** | Real gap with a clear remediation path; does not block investment but requires transparency |
| **Low** | Acknowledged technical debt or deferred feature; does not affect core platform credibility |

---

## Technical Risks

### T-01: In-Memory Session Store (Medium)

**Description:** The production API server uses in-process session storage. Under load balancing or multi-instance deployment, sessions would not be shared across instances.

**Impact:** Cannot horizontally scale the API server without session stickiness or a shared session store.

**Mitigation:** Redis session store is documented in `## [Unreleased]` in CHANGELOG.md. Architecture for the switch is straightforward (express-session with connect-redis). No data migration required.

**Status:** Planned; not yet implemented. Single-instance deployment is unaffected.

---

### T-02: Some Screenshots May Not Reflect Current UI (Low)

**Description:** The README and public assets include screenshots produced at design-completion time. If the UI has diverged significantly since capture, screenshots may mislead evaluators about current visual state.

**Impact:** Low — the underlying functionality is unchanged. An investor doing code review will see working software; the screenshot discrepancy affects only the visual impression.

**Mitigation:** Screenshot regeneration is planned as a follow-up after the current UI redesign task merges. The public-screenshot-manifest.json identifies which images have been verified as current captures.

**Status:** Acknowledged; follow-up task queued.

---

### T-03: Test Coverage Gaps (Medium)

**Description:** Unit test coverage is incomplete across some domain packs and shared libraries. Integration tests exist but have pre-existing DB migration failures that artificially inflate the failure count. The CI gate does not currently block on integration test failures.

**Impact:** Reduces confidence in regression safety for future changes to core shared libraries.

**Mitigation:** Documented in `docs/operations/known-gaps.md`. CI gates on lint, typecheck, and build are solid. Integration test remediation is tracked in the project task backlog.

**Status:** Active remediation in progress.

---

### T-04: No Error Tracking (Sentry) in Production (Low)

**Description:** Sentry error tracking is not yet integrated. Production error visibility relies on structured logging (pino) and platform-level logs.

**Impact:** Incident response time may be slower for subtle runtime errors that don't immediately surface in logs.

**Mitigation:** Sentry integration is on the roadmap (`## [Unreleased]` in CHANGELOG.md). Pino structured logging provides a baseline until then.

**Status:** Planned.

---

### T-05: GraphQL and MCP Gateway (Low)

**Description:** Apollo GraphQL and MCP Gateway are implemented as platform infrastructure but are not yet used by all domain packs. Coverage is uneven.

**Impact:** Not a blocker — REST API is the primary interface. GraphQL provides optional query flexibility for complex data shapes.

**Mitigation:** Adoption is domain-pack driven; it expands as packs are updated.

**Status:** Ongoing.

---

## Operational Risks

### O-01: Revenue Activation Incomplete (High)

**Description:** Stripe billing is live for a subset of domain packs (Vessels, Lyte, Terra, Carlota Jo) but is not fully activated across all surfaces. The platform does not yet have recurring revenue from paying customers.

**Impact:** Pre-revenue status is the most material fact for a Series A investor. The platform is investor-funded and founder-operated at this stage.

**Mitigation:** Revenue activation plan is in `docs/investor/go-to-market.md`. Design partner conversations are the primary commercial motion before first ARR.

**Status:** In progress.

---

### O-02: Enterprise SSO / SCIM 2.0 Not Yet GA (Medium)

**Description:** Enterprise SSO (Azure AD multi-tenant) and SCIM 2.0 provisioning are architected and partially implemented but not yet GA. Enterprise buyers who require SSO for procurement approval cannot be fully onboarded without this.

**Impact:** Blocks enterprise-tier sales motions that require SSO as a procurement prerequisite.

**Mitigation:** Architecture is in place. Completing SSO/SCIM is a near-term engineering priority.

**Status:** In progress.

---

### O-03: CORTEX Mobile App Store Submission Pending (Low)

**Description:** The CORTEX mobile app (Expo/React Native) is feature-complete and runs on TestFlight / Play Internal Testing but has not been submitted to the App Store or Play Store for public listing.

**Impact:** Does not affect enterprise deployments (distributed via MDM or internal testing). Affects consumer-facing perception if mobile is part of the pitch.

**Mitigation:** App store submission readiness tracked in `ops/mobile/flagship-release-readiness.md`.

**Status:** Pre-submission; checklist complete; blocked on final UI/UX sign-off.

---

### O-04: Single Founder / Key-Person Risk (High)

**Description:** The platform is founder-built by Stephen Lutar. There is no current second technical co-founder or equivalent engineering lead.

**Impact:** Key-person risk is a material concern for Series A investors. Loss or incapacitation of the founder would materially affect development velocity.

**Mitigation:** The platform architecture, documentation, and decision doctrine (`docs/doctrine/szl-doctrine.md`) are explicitly designed to reduce key-person dependency — all decisions are documented, all architecture is written, all conventions are codified. A Series A hire plan includes a VP Engineering or CTO co-hire.

**Status:** Acknowledged; addressed in investor thesis.

---

### O-05: No Paid Customer Proof Points (High)

**Description:** There are no current design partners or paying customers with documented case studies or testimonials.

**Impact:** Reduces the strength of the commercial thesis. A Series A without customer proof requires the investor to rely on the platform thesis and technical quality alone.

**Mitigation:** Design partner conversations are the priority for Q2 2026. The platform is demo-ready and investor-demonstrable. The investor pitch deck (`artifacts/aegis/`) contains the go-to-market narrative.

**Status:** Active outreach.

---

## Public Surface Risks

### P-01: Numeric Claims Drift Risk (Medium — Mitigated)

**Description:** Historic public surfaces (org profile README, founder README) contained specific numeric claims (artifact counts, endpoint counts, table counts) that would drift as the platform evolves without a regeneration pipeline.

**Impact:** Stale numeric claims in public-facing surfaces undermine investor credibility if they cannot be verified from the codebase.

**Mitigation:** All specific counts have been removed from org profile README and founder README (Phase D, April 2026). The authoritative numeric record is `docs/platform-facts.md` (machine-generated via `pnpm metrics:generate`; validated via `pnpm metrics:validate`).

**Status:** Resolved — Phase D.

---

### P-02: Archived Product Confusion (Low — Mitigated)

**Description:** PRISM Counsel and IMPERIUM are archived products whose API routes remain active. If their presence in public documentation is not clearly labeled, evaluators may assess them as active products and form incorrect impressions.

**Impact:** Overstates active surface; creates confusion during due diligence.

**Mitigation:** README product table explicitly marks both with "Archived" status and task reference numbers. SECURITY.md In Scope list has been updated to remove archived products. Archive-candidates report clarifies the disposition.

**Status:** Resolved — Phase D.

---

### P-03: Screenshot Verification (Low — Partially Mitigated)

**Description:** Not all README screenshots have been verified as current live captures. Screenshots from `assets/readme/products/` are classified in `audit/media/public-screenshot-manifest.json`.

**Impact:** Low — screenshots affect visual impression, not technical substance.

**Mitigation:** The screenshot manifest classifies each image as verified/live-capture or pending-regeneration. Screenshots of archived products have been removed from the README Screens section. Post-redesign regeneration is a documented follow-up.

**Status:** Partially mitigated; regeneration follow-up pending.

---

## Regulatory and Legal Risks

### R-01: Data Sovereignty (Medium)

**Description:** The platform processes signals from maritime, real estate, legal, and financial domains. Some signal sources (OFAC, SEC EDGAR, STIX/TAXII) involve regulated data. Data residency requirements for enterprise customers vary by jurisdiction.

**Impact:** Enterprise customers in regulated jurisdictions (GDPR, HIPAA, FedRAMP) may have additional procurement requirements.

**Mitigation:** Azure deployment supports data residency configurations. FedRAMP readiness track is documented as a Phase 2 roadmap item for Aegis. GDPR considerations are addressed in the architecture (no PII in signal normalization by default).

**Status:** Architecturally addressed; formal certification is a post-Series A priority.

---

### R-02: AI Governance Regulatory Evolution (Medium)

**Description:** The EU AI Act, emerging U.S. federal AI guidance, and sector-specific regulations (financial services, defense) are evolving. Requirements for explainability, human oversight, and audit trails may become mandatory in the platform's target verticals.

**Impact:** Positive tailwind — the platform's structural governance (Proof Chain, Covenant Policy, Outcome Graph) maps directly to regulatory requirements for high-risk AI systems. However, specific certification paths are not yet completed.

**Mitigation:** Platform design anticipates regulatory requirements. Compliance track documentation is in `docs/trust/`. No immediate blocking risk.

**Status:** Monitored; no immediate action required.

---

## Summary Dashboard

| Risk | Severity | Status |
|------|----------|--------|
| T-01: In-memory sessions | Medium | Planned remediation |
| T-02: Screenshot currency | Low | Follow-up queued |
| T-03: Test coverage gaps | Medium | Active remediation |
| T-04: No Sentry | Low | Planned |
| T-05: GraphQL coverage | Low | Ongoing |
| O-01: Pre-revenue | High | Active outreach |
| O-02: SSO/SCIM not GA | Medium | In progress |
| O-03: Mobile not in stores | Low | Pre-submission |
| O-04: Single founder | High | Disclosed; hire plan |
| O-05: No customer proof | High | Active outreach |
| P-01: Numeric claims drift | Medium | Resolved — Phase D |
| P-02: Archived product confusion | Low | Resolved — Phase D |
| P-03: Screenshot verification | Low | Partially mitigated |
| R-01: Data sovereignty | Medium | Architecturally addressed |
| R-02: Regulatory evolution | Medium | Positive tailwind |

---

*This register is updated at each major audit phase. Next review: post-Series A close or first design partner contract.*
*For the manual action checklist, see `audit/investor/manual-next-steps.md`.*
*For the full readiness scorecard, see `audit/investor/public-readiness-scorecard.md`.*
