# A11oy — StateRAMP Authorization Disclosure

**Document ID:** A11OY-COMP-FR-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** Empire APEX, state/federal procurement evaluators, prime contractors
**Classification:** Public (intended for buyer-facing publication at `szlholdings.com/trust/fedramp`)

---

## 1. Purpose

This document discloses A11oy's current StateRAMP authorization posture in plain language so that procurement officers, prime contractors, and risk reviewers can make accurate sourcing decisions without inference.

A11oy is the cross-domain AI agent fabric that powers SZL Holdings' Sentra (cyber resilience) and Amaru (data sync) products. Wherever Sentra or Amaru is procured, the underlying A11oy control plane is in scope for this disclosure.

## 2. Current authorization status (2026-04-30)

| Item | Status |
|---|---|
| StateRAMP Marketplace listing | **Not listed.** A11oy is not currently a StateRAMP-authorized service. |
| StateRAMP Ready designation | Not yet pursued. |
| StateRAMP In-Process | Not yet pursued. |
| StateRAMP Authorized | Not authorized at any impact level. |
| Agency ATO inheritance | None at this time. |
| StateRAMP | Not listed. Pre-application research underway. |
| TX-RAMP | Not listed. |

A11oy is **not** marketed, sold, or represented as StateRAMP-authorized. Any reseller, partner, or prime that represents otherwise is doing so without SZL Holdings' authorization.

## 3. What this means for buyers

- **Federal high / StateRAMP-required workloads:** A11oy may not be procured for systems where StateRAMP authorization is a hard contractual requirement until the program is completed.
- **State and local workloads with no StateRAMP mandate:** A11oy may be evaluated on a case-by-case basis under the buyer's own risk framework. The compensating controls in §6 are the basis for that evaluation.
- **Hybrid procurement:** Some agencies allow a non-StateRAMP component if the system boundary excludes it from federal-data flows. SZL will execute a written boundary statement on request.

## 4. Authorization roadmap

The roadmap below is the authorization plan SZL Holdings is committing to in writing. Dates reflect SZL-owned milestones; StateRAMP PMO and 3PAO timelines are outside SZL's control and are stated as best-effort targets.

| Phase | SZL milestone | Target window | Owner |
|---|---|---|---|
| Pre-readiness | Complete NIST SP 800-53 Rev. 5 control mapping for A11oy boundary | Q3 2026 | SZL Compliance |
| Pre-readiness | Engage StateRAMP-recognized 3PAO for Readiness Assessment | Q4 2026 | SZL Compliance |
| StateRAMP Ready | Submit Readiness Assessment Report (RAR) | Q1 2027 | 3PAO + SZL |
| StateRAMP In-Process | Sponsor agency identified and PMO kickoff | Q2 2027 (sponsor-dependent) | Sponsor agency |
| StateRAMP Authorized (Moderate) | Final ATO issuance | Q4 2027 – Q2 2028 (best-effort) | Sponsor agency + PMO |

The target impact level is **Moderate**. A11oy's control plane does not currently process classified data and is not seeking IL4/IL5/IL6 DoD authorization at this time.

## 5. Hosting and StateRAMP-inheritable boundary

A11oy's production control plane runs on the following infrastructure:

| Layer | Provider | StateRAMP status |
|---|---|---|
| Compute (production) | Hetzner Cloud (EU) — non-government deployments | Not StateRAMP authorized |
| Compute (US-only deployments) | AWS GovCloud (US) — pilot-scoped, on request | StateRAMP High inheritable |
| Database | Neon (Postgres) — non-government deployments | Not StateRAMP authorized |
| Database (US gov pilots) | AWS RDS Postgres in GovCloud — pilot-scoped, on request | StateRAMP High inheritable |
| CI/CD | GitHub Actions (commercial) | Not StateRAMP authorized |
| Object storage | AWS S3 (commercial or GovCloud per deployment) | Variable |

For pilot deployments where the buyer requires US-only StateRAMP-inheritable infrastructure, SZL will deploy A11oy into AWS GovCloud (US) under the buyer's own AWS account or a SZL-managed GovCloud account, with the boundary statement in §3 attached.

## 6. Compensating controls (today)

Until StateRAMP authorization is complete, A11oy's customers are protected by the following compensating controls. These are the controls a buyer's risk framework should evaluate against in lieu of an authorization letter:

1. **Append-only evidence ledger** — Every agent action, decision, and output is hash-chained and persisted to the `aef-evidence-ledger` package. Tampering produces a verifiable hash mismatch.
2. **Replay attestation** — Any historical run can be re-executed deterministically through `codex-kernel`'s `replay()` function. The replay hash must match the original or the run is flagged.
3. **Policy guard** — `aef-policy-guard` enforces per-tenant allow/deny on tools, models, data sources, and egress targets before any agent action runs.
4. **Tenant isolation** — Each customer is a hard tenant boundary at the database, queue, and storage layers. Cross-tenant data flow requires an explicit signed policy.
5. **Documented data classification** — See `AMARU-01-data-classification.md`.
6. **Documented incident response** — See `A11OY-05-incident-response-72hr.md`.
7. **Documented data residency** — See `A11OY-04-us-data-residency.md`.
8. **Documented bias-testing methodology** — See `A11OY-03-bias-testing-methodology.md`.
9. **NIST SP 800-171 self-assessment** — See `A11OY-02-cmmc-nist-800-171-gap-assessment.md`.

## 7. Inheritance and shared-responsibility statement

When deployed on AWS GovCloud (US), A11oy inherits the AWS StateRAMP High baseline for the IaaS/PaaS layer. SZL Holdings is responsible for application-layer controls and the controls in §6. A complete shared-responsibility matrix is published as Annex A on request.

## 8. Buyer attestation

For any active procurement, SZL Holdings will execute a written "StateRAMP Status Attestation" on request, signed by the founder, that contains:

- Current authorization status as of the attestation date
- Roadmap milestone status
- Specific hosting region and account ID for the buyer's deployment
- Compensating-controls list applicable to the buyer's workload
- Notification commitment for status changes

Request: `inquiries@szlholdings.com`, subject line `StateRAMP Status Attestation request — [agency name]`.

## 9. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 10. Contact

Stephen P. Lutar Jr.
Founder, SZL Holdings
inquiries@szlholdings.com
