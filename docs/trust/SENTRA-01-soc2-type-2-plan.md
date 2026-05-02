# Sentra — SOC 2 Type II Plan

**Document ID:** SENTRA-COMP-SOC2-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** NYSTEC, security-conscious enterprise/government buyers
**Classification:** Public

---

## 1. Statement of intent

SZL Holdings will pursue a SOC 2 Type II report for Sentra (and the underlying A11oy control plane that Sentra rides on). This document is the public-facing plan including scope, trust services criteria selected, observation window, auditor selection criteria, and milestone dates.

Sentra is the cyber-resilience product. SOC 2 is the most-asked-for trust evidence by Sentra's intended buyers (mid-market regulated, US public sector, healthcare, financial services). It is therefore the first formal third-party attestation SZL is committing to.

## 2. Scope

| Element | In scope |
|---|---|
| Product | Sentra (incident command, recursive threat modeling, action queue, adversary engine) |
| Underlying control plane | A11oy (the substrate Sentra runs on, including the AEF packages) |
| Hosting environment | AWS GovCloud (US) for SOC-scoped tenants; non-SOC-scoped commercial deployments are **out of scope** of the report |
| Data | Customer-supplied threat data, security telemetry, alerts, runbooks, incident artifacts |
| Operations | SZL Holdings operations: provisioning, change management, access control, vulnerability management, incident response, vendor management |

| Element | Out of scope |
|---|---|
| Customer-side configuration of Sentra | Customer responsibility |
| Customer-deployed connectors | Customer responsibility |
| Third-party LLM providers consumed at runtime | Vendor reports inherited where available |
| Marketing site `szlholdings.com` | Distinct from the product plane |

## 3. Trust Services Criteria selected

| TSC | In scope | Why |
|---|---|---|
| **Security (Common Criteria)** | Yes | Required for any SOC 2 report. |
| **Availability** | Yes | Buyers procure Sentra to detect and respond; uptime is a buying criterion. |
| **Confidentiality** | Yes | Sentra processes sensitive security telemetry. |
| **Processing Integrity** | Yes | Sentra's outputs (alerts, recommended actions) must be produced reliably and verifiably; the evidence ledger underwrites this. |
| **Privacy** | No (Type II observation window) | Privacy criteria are addressed by `AMARU-04-privacy-impact-assessment.md` and `docs/security/privacy-overview.md`; will be added in a future Type II refresh after PIA program matures. |

## 4. Auditor selection criteria

The selected CPA firm must:

- Be AICPA-licensed and have an active peer review.
- Have at least 5 years of cloud-native SOC 2 audit experience.
- Have prior experience auditing organizations using AWS GovCloud.
- Provide a single named partner-in-charge for the engagement.
- Provide fixed-fee or capped pricing for a Stage 1 readiness + Stage 2 Type I + Stage 3 Type II sequence.

A shortlist of three candidate firms has been prepared. Final selection by 2026-Q3.

## 5. Observation window plan

| Stage | Window | Calendar target |
|---|---|---|
| Pre-readiness (control design + evidence pipeline) | T-180d to T-90d | 2026-Q3 |
| Readiness assessment (Stage 1) | 30 days | 2026-Q4 |
| **Type I "as of" report** | Single date | 2027-Q1 |
| **Type II observation window** | 6 months | 2027-Q1 → 2027-Q3 |
| **Type II report issued** | + ~60 days post-window | 2027-Q4 |

Subsequent Type II reports will use a 12-month rolling window thereafter.

## 6. Control universe

Day-one controls are mapped to the AICPA TSP 100 framework. Below is the family-level summary; the full row-level workbook is shared with the auditor and with active procurements under NDA.

| Family | Coverage |
|---|---|
| CC1 — Control Environment | Founder code-of-conduct, vendor code-of-conduct, hiring policy v1 |
| CC2 — Communication & Information | Public trust pages; customer change-management notifications |
| CC3 — Risk Assessment | Annual risk assessment + threat-model review per release |
| CC4 — Monitoring | Continuous monitoring via `cognitive-observability` + monthly control self-tests |
| CC5 — Control Activities | Documented in this and adjacent compliance docs |
| CC6 — Logical and Physical Access | RBAC + ABAC via `aef-policy-guard`; hardware-key MFA; AWS GovCloud physical inheritance |
| CC7 — System Operations | Change-management via GitHub PR + protected branches; vulnerability management via Dependabot + CodeQL; incident response per `A11OY-05-incident-response-72hr.md` |
| CC8 — Change Management | Branch protection + signed commits + required reviews + automated tests |
| CC9 — Risk Mitigation | Vendor-risk reviews; insurance program (in procurement) |
| A1 — Availability | Multi-AZ; documented RPO/RTO; DR runbook quarterly tabletop |
| C1 — Confidentiality | Encryption at rest + in transit; classification per `AMARU-01-data-classification.md` |
| PI1 — Processing Integrity | Append-only evidence ledger; replay attestation; deterministic-replay tests |

## 7. Evidence pipeline

A SOC 2 audit requires evidence at every observation. SZL is building evidence collection into the product itself rather than as a side process:

- **Access reviews** — quarterly export from AWS IAM Identity Center, signed by the IC, anchored in the evidence ledger.
- **Change records** — every merged PR is automatically anchored in the evidence ledger with reviewer, tests, and deploy outcome.
- **Incident records** — `incident-record` rows from §5 of the IR procedure are evidence-grade by construction.
- **Backup tests** — monthly automated restore-into-DR followed by integrity check; result anchored.
- **Vulnerability cadence** — Dependabot + CodeQL findings reconciled monthly; remediation evidence anchored.
- **Vendor reviews** — annual sub-processor review with risk score and evidence link.

This pipeline will be presented to the auditor and is intended to also serve as the evidence platform for FedRAMP, ISO 27001, and HITRUST in future cycles.

## 8. Compensating evidence offered today

Until the SOC 2 Type II is issued, buyers may request:

- The Sentra threat model (NDA)
- Penetration-test attestation letter (next dated 2026-05; see `docs/internal/security/pentest-attestation-letter-2026-05.md`)
- Vulnerability-scan summary (current month)
- Access-review export (most recent quarter)
- IR tabletop summary (most recent exercise)
- Sub-processor list and risk register

## 9. Honest disclosures

- A SOC 2 Type II report is **not** the same as a FedRAMP authorization. Buyers should not treat them as substitutes.
- The earliest defensible Type II coverage period ends mid-2027. Procurement officers planning earlier go-lives should rely on §8 in the meantime.
- Any commitment to a sponsor or first reference customer that Sentra **must** be SOC 2 Type II at go-live shifts the timeline only via parallel investment in audit hours; SZL will quote that incremental cost on request.

## 10. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 11. Contact

Stephen P. Lutar Jr. · stephen@szlholdings.com
