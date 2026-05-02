# Amaru — Privacy Impact Assessment (PIA) Template

**Document ID:** AMARU-COMP-PIA-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** NYSTEC, agency privacy officers, customers subject to E-Government Act §208 / GDPR DPIA / state privacy law obligations
**Classification:** Public template; per-customer instances under NDA

---

## 1. Purpose

When a government agency procures or modifies a system that handles personally identifiable information, it is typically required to publish a Privacy Impact Assessment under the E-Government Act of 2002 §208 (federal) or analogous state law. Many state agencies follow OMB M-03-22 / OMB Circular A-130 forms. EU equivalents are Data Protection Impact Assessments (DPIAs) under GDPR Article 35.

This document is the SZL Holdings PIA *template* for Amaru. A customer agency's own privacy officer fills it in for their specific deployment. SZL provides this template, the underlying answers it pre-populates, and consultation during completion.

## 2. Section A — System characterization

| Field | Pre-populated answer (SZL) |
|---|---|
| System name | Amaru — convergent multi-source data sync |
| System owner (vendor side) | SZL Holdings, Stephen P. Lutar Jr. |
| System owner (agency side) | _to be filled by customer_ |
| Authority to operate (agency side) | _to be filled by customer_ |
| Operational date for this deployment | _to be filled by customer_ |
| Hosting environment | AWS GovCloud (US) for "A11oy US" deployments; commercial cloud provider TBD otherwise |
| Architecture summary | Connector-based ingest from sources, classification, hash-verified delta log, policy-guarded routing to destinations |

## 3. Section B — Information collected

| Field | Template answer |
|---|---|
| Categories of individuals | Determined per source: employees (HR sync), constituents (program data), patients (where HIPAA), students (where FERPA) |
| Categories of information | Determined by customer connector configuration; classified per `AMARU-01-data-classification.md` |
| Source of information | Customer-supplied source systems (ERP, EHR, SIS, CRM, public-data feeds) |
| Sensitive PII categories handled | SSN, medical, financial, biometric — when present in the source schema and the customer has classified them |
| New information created by the system | Hash-anchors over source records; classification metadata; reconciliation deltas |

## 4. Section C — Authority and purpose

| Field | Template answer |
|---|---|
| Statutory authority for collection | Customer-declared (Amaru does not initiate collection) |
| Purpose of collection | Customer-declared per integration |
| Necessity of collection | Customer-declared; SZL's role is processor, not controller |
| Consent mechanism | Customer-managed at the source system |

## 5. Section D — Information sharing

| Field | Template answer |
|---|---|
| Internal sharing within agency | Per customer-declared destination connectors |
| External sharing with other agencies | Disabled by default; per customer-declared and classified routing |
| External sharing with private entities | Disabled by default; requires signed customer policy |
| Method of sharing | API + queue + delta log; policy-guarded routing |
| Sub-processors involved | AWS (infrastructure); LLM providers (only where customer has enabled AI features and has approved the model endpoints); per-deployment sub-processor list provided |

## 6. Section E — Notice and access

| Field | Template answer |
|---|---|
| Notice to individuals | Customer's responsibility at the source system; SZL provides the deletion/access machinery to honor notice commitments |
| Right of access | Provided via customer's existing process; Amaru provides API/UI for the customer's privacy officer to honor data-subject access requests |
| Right of correction | Honored at the source system; Amaru re-syncs corrections through the same delta log |
| Right of deletion | Honored per `AMARU-02-retention-deletion.md` |

## 7. Section F — Data quality and integrity

| Field | Template answer |
|---|---|
| Accuracy mechanisms | Hash-verified ingest; reconciliation against source; flag-on-mismatch |
| Integrity mechanisms | Append-only delta log; cryptographic anchors; replay attestation via `codex-kernel` |
| Quality monitoring | Continuous reconciliation; quality metrics surfaced to operator |
| Update propagation | Documented per connector; typical seconds to minutes |

## 8. Section G — Security

| Field | Template answer |
|---|---|
| Encryption at rest | AES-256, customer-managed keys for Tier C/D |
| Encryption in transit | TLS 1.3 |
| Access control | RBAC + ABAC via `aef-policy-guard`; tenant isolation |
| Auditing | Every action anchored in the evidence ledger; replay verifiable |
| Incident response | Per `A11OY-05-incident-response-72hr.md` |
| Penetration testing | Per `SENTRA-04-penetration-testing-plan.md` |
| Vulnerability management | Per SOC 2 plan |
| Logging | Per `docs/security/data-retention.md` and `AMARU-02-retention-deletion.md` |

## 9. Section H — Data minimization

| Field | Template answer |
|---|---|
| Are only necessary fields ingested? | Customer-controlled via field selection in connector config; SZL provides default minimization templates per ERP |
| Is data tokenized/redacted where possible? | Per `AMARU-01-data-classification.md` §5; recommended defaults are restrictive |
| Is retention bounded? | Per `AMARU-02-retention-deletion.md` |

## 10. Section I — Risk analysis

This section is the substantive privacy-risk analysis, completed jointly by the customer's privacy officer and SZL during the deployment intake. It enumerates:

- Specific privacy risks for the data categories in scope
- Likelihood and impact of each risk
- Existing controls that mitigate
- Residual risk
- Risk-acceptance decision and authority
- Re-assessment trigger conditions

A worked example for a representative deployment (HR-sync between a state ERP and a downstream reporting warehouse) is provided as Annex A on request.

## 11. Section J — Approvals

| Approver | Role | Signature/date |
|---|---|---|
| Customer Privacy Officer | Acceptance | _customer_ |
| Customer System Owner | Acceptance | _customer_ |
| Customer CIO/CISO | Acceptance | _customer_ |
| SZL Holdings | Acknowledgement | Stephen P. Lutar Jr. |

## 12. Re-assessment

A PIA is re-assessed when:

- New record classes are added
- New destinations are added
- New sub-processors are added
- A breach affects in-scope data
- The customer's privacy law changes
- Annually, regardless

## 13. Honest disclosures

- **SZL is a processor, not a controller** in nearly every Amaru deployment. The customer agency is the controller and the PIA is the customer's instrument; SZL provides the technical answers.
- **No data-subject correspondence by SZL** unless contractually required.
- **No surprise data uses.** Amaru does not aggregate cross-customer data. SZL does not train models on customer data. SZL does not derive new datasets for resale.
- **Honest scope.** Amaru's PIA covers Amaru. The downstream destination's PIA is the destination owner's responsibility.

## 14. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 15. Contact

Stephen P. Lutar Jr. · `privacy@szlholdings.com` · `inquiries@szlholdings.com`
