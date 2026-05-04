# Sentra — Penetration Testing Plan

**Document ID:** SENTRA-COMP-PT-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** Empire APEX, customer security teams, sponsor agencies
**Classification:** Public plan; per-engagement reports under NDA

---

## 1. Statement

SZL Holdings commissions external penetration testing of Sentra and the underlying A11oy control plane on a published cadence. This document describes the cadence, scope, methodology, vendor selection, finding-management, and disclosure posture so that a buyer's security team can verify the program exists and is operating.

A redacted attestation letter for the most recent test is published at `docs/internal/security/pentest-attestation-letter-2026-05.md` and is shared with active procurements under NDA.

## 2. Cadence

| Test | Frequency | Trigger |
|---|---|---|
| External application penetration test | Annual, baseline | Calendar |
| External application penetration test (re-test) | After every major release with material attack-surface change | Release-driven |
| Internal architecture review | Annual | Calendar |
| Cloud configuration review (AWS GovCloud) | Annual | Calendar |
| Mobile application penetration test | Annual once mobile artifact is in production | Calendar |
| Red-team engagement (full-scope, objective-based) | Every 24 months minimum | Calendar |
| Bug bounty | Continuous (private invite-only program at v1) | — |

The next dated tests:

- 2026-05 — application penetration test (in progress; attestation letter under §1)
- 2026-05 — mobile penetration test scoping
- 2027-Q1 — full-scope red-team engagement (planned)

## 3. Scope

### 3.1 In scope

- Sentra application layer: web UI, APIs, WebSocket layer, agent-action surfaces
- A11oy control plane: orchestration APIs, evidence ledger APIs, policy guard APIs, replay-attestation endpoint
- Authentication and authorization: SZL-managed IdP integration, RBAC/ABAC, tenant-isolation boundary
- Cloud configuration: AWS GovCloud account hardening, CloudTrail completeness, GuardDuty coverage, network segmentation, secrets handling
- Supply chain: build pipeline integrity, Sigstore signing, dependency provenance
- Data handling: encryption at rest, encryption in transit, key management, backup integrity, residency enforcement

### 3.2 Out of scope

- Customer-side configuration of Sentra
- Customer-deployed connectors and integrations
- Third-party LLM provider infrastructure
- AWS-managed services below the customer-responsibility boundary

## 4. Methodology

The engagement instructs the testing vendor to use, at minimum:

- **OWASP ASVS Level 2** verification baseline for web/API
- **OWASP MASVS** for mobile (when mobile is in scope)
- **OWASP LLM Top 10** for AI-specific surfaces (prompt injection, model denial-of-service, training-data poisoning where applicable, sensitive-information disclosure, insecure plugin design, excessive agency, overreliance, model theft)
- **NIST SP 800-115** as the technical guideline
- **MITRE ATT&CK** for tactic/technique alignment of red-team objectives
- **CIS AWS Foundations Benchmark** for cloud configuration review

The engagement is white-box for application testing (source-code access) and gray-box for cloud and red-team objectives (limited account, no source).

## 5. AI-specific test cases

Beyond standard ASVS, the test plan requires explicit coverage of:

- Prompt-injection attempts against agent surfaces (direct and indirect)
- Tenant-isolation bypass via crafted prompts referencing other tenants
- Excessive-agency exploitation of `aef-policy-guard` and tool-call boundaries
- Model output exfiltration (training-data extraction attempts)
- Replay-attestation tamper attempts (modify a ledger row, attempt replay)
- Bias-test poisoning (introduce data designed to skew bias-test results)
- LLM-router bypass (force calls outside the residency allowlist)
- Cost-exhaustion attacks (unlimited prompt loops, tool-call recursion)

These tests are mapped to `aef-evals` regression tests so a once-found issue cannot regress without test-suite failure.

## 6. Vendor selection

Vendors must:

- Have CREST or equivalent firm-level certification
- Have at least one OSCP / OSWE-credentialed lead tester per engagement
- Have prior experience with cloud-native + AI-system testing
- Sign a vendor MSA + SOW + NDA before any access
- Be cleared as a sub-processor in the SZL sub-processor register

A short panel of three vendors is maintained. Engagements rotate to maintain testing diversity.

## 7. Finding management

| Severity | Time to acknowledge | Time to fix |
|---|---|---|
| Critical | < 24 hours | < 7 calendar days |
| High | < 72 hours | < 30 calendar days |
| Medium | < 7 calendar days | < 90 calendar days |
| Low / Info | At backlog grooming | Best-effort |

- All findings are anchored in the evidence ledger.
- All fixes ship with a regression test.
- A re-test or scoped re-pen is performed for every Critical and High before the engagement is closed out.
- A summary is included in the next quarterly customer trust update (without naming details that would inform an attacker).

## 8. Disclosure

- **Customers** receive an attestation letter on every engagement and the executive-summary report under NDA.
- **Active procurements** receive the same on request.
- **Researchers** can report findings via `security@szlholdings.com` under the published Coordinated Disclosure policy (`docs/security/disclosure.md`).
- **Public** receives a high-level statement that an annual penetration test was completed; specific findings are not publicly disclosed unless they meet the public-interest threshold under SZL's disclosure policy.

## 9. Bug bounty (planned)

A private bug bounty program is planned for 2027-Q1. The plan:

- Hosted via an established platform (HackerOne, Bugcrowd, Intigriti — vendor TBD)
- Initial scope: production Sentra and A11oy public-facing endpoints
- Initial reward range: $250 (low) to $10,000 (critical)
- Researchers in private invite cohort first; public expansion after 90 days of program operation

## 10. Honest disclosures

- **Founder cost.** External penetration testing is the single largest non-payroll line item in SZL's compliance budget. The cadence above is the maximum SZL can sustain at current revenue. Increasing cadence further (e.g., quarterly red-team) is contingent on customer demand and revenue.
- **Pen test ≠ secure.** A pen test is a point-in-time exercise. Continuous controls — `aef-policy-guard`, hash-chain integrity, replay attestation, dependency scanning, IR exercises — carry the load between tests. SZL does not market pen-test attestations as substitutes for the controls.
- **Confidentiality of findings is a commitment, not a mask.** The non-disclosure of detail is to protect customers from attacker advantage, not to hide the existence of issues. Every finding is anchored in the evidence ledger; auditors see them.

## 11. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 12. Contact

Stephen P. Lutar Jr. · `security@szlholdings.com` · `inquiries@szlholdings.com`
