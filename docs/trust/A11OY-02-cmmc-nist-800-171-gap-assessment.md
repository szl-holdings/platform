# A11oy — CMMC 2.0 / NIST SP 800-171 Rev. 3 Gap Assessment

**Document ID:** A11OY-COMP-CMMC-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** NYSTEC, prime contractors handling CUI, DoD subcontracting officers
**Classification:** Public summary; full control workbook provided under NDA

---

## 1. Purpose

This document is SZL Holdings' self-assessment of A11oy against NIST SP 800-171 Rev. 3 controls and CMMC 2.0 Level 1 / Level 2 maturity. It is intended for buyers who must determine whether A11oy can be placed inside a CUI boundary and what conditions apply.

## 2. Scope of assessment

- **System assessed:** A11oy control plane and the AEF (Agent Evidence Framework) packages it ships with: `aef-contracts`, `aef-evidence-ledger`, `aef-policy-guard`, `aef-storage-adapters`, `aef-workflow-runtime`, `aef-evals`, `aef-retrieval-core`, `aef-domain-profiles`, `aef-sdk`.
- **System NOT assessed (out of scope):** Customer-supplied tools, customer-supplied data sources, customer infrastructure, third-party LLM providers consumed at runtime.
- **CUI handling claim:** A11oy does **not currently process or store CUI in production**. This assessment establishes readiness for buyers planning a CUI-bearing pilot.
- **Assessment type:** Self-assessment. Not yet validated by a CMMC Third-Party Assessment Organization (C3PAO).

## 3. CMMC 2.0 maturity claim

| CMMC Level | Status | Notes |
|---|---|---|
| Level 1 (Foundational, 17 practices) | **Self-attested compliant** for non-CUI deployments | Annual self-attestation aligns with DoD's CMMC 2.0 framework |
| Level 2 (Advanced, 110 NIST SP 800-171 practices) | **Partial — see §5** | C3PAO assessment required for federal CUI workloads; not yet pursued |
| Level 3 (Expert) | Not in scope | Requires NIST SP 800-172; not pursued |

## 4. NIST SP 800-171 Rev. 3 family-level summary

| Family | Practices | Implemented | Partially | Planned | Not applicable | Notes |
|---|---|---|---|---|---|---|
| 03.01 Access Control | 22 | 17 | 3 | 2 | 0 | RBAC enforced via `auth-shared`; ABAC via `aef-policy-guard`. Gaps: 03.01.16 (mobile device control), 03.01.20 (external system connections — partial). |
| 03.02 Awareness and Training | 3 | 1 | 1 | 1 | 0 | Founder-only org today; formal program planned with first hire. |
| 03.03 Audit and Accountability | 9 | 8 | 1 | 0 | 0 | Append-only ledger covers most. Gap: 03.03.04 (audit failure response — alerting on log loss). |
| 03.04 Configuration Management | 9 | 7 | 2 | 0 | 0 | IaC via Replit + GitHub. Gaps: 03.04.06 (least functionality — partial), 03.04.08 (deny-by-default). |
| 03.05 Identification and Authentication | 12 | 10 | 2 | 0 | 0 | MFA enforced for SZL operators. Gaps: 03.05.07 (PKI for service accounts — planned), 03.05.11 (replay-resistant auth — partial). |
| 03.06 Incident Response | 6 | 5 | 1 | 0 | 0 | See `A11OY-05-incident-response-72hr.md`. Gap: 03.06.05 (info sharing) — formal partner playbook drafted, not exercised. |
| 03.07 Maintenance | 6 | 5 | 1 | 0 | 0 | Automated patch cycle. Gap: 03.07.05 (nonlocal maintenance — partial). |
| 03.08 Media Protection | 9 | 7 | 1 | 1 | 0 | Encrypted at rest. Gap: 03.08.07 (removable media use — N/A in cloud-only ops, formally documented). |
| 03.09 Personnel Security | 2 | 1 | 1 | 0 | 0 | Background check policy adopted; not yet exercised (single-founder). |
| 03.10 Physical Protection | 6 | 0 | 0 | 0 | 6 | Cloud-only; inherited from underlying cloud provider (AWS for US deployments; commercial provider TBD otherwise). |
| 03.11 Risk Assessment | 5 | 4 | 1 | 0 | 0 | Threat model maintained in `docs/`. Gap: 03.11.04 (risk response) — formalization needed. |
| 03.12 Security Assessment | 5 | 3 | 2 | 0 | 0 | Self-assessment cadence quarterly. Gap: independent assessment not yet performed. |
| 03.13 System and Communications Protection | 17 | 14 | 2 | 1 | 0 | TLS 1.3 enforced. Gaps: 03.13.11 (FIPS 140-3 validated crypto — using FIPS-capable libs but not validated module), 03.13.16 (CUI at rest — N/A until CUI handling). |
| 03.14 System and Information Integrity | 9 | 8 | 1 | 0 | 0 | Hash-chain verification on all artifacts. Gap: 03.14.06 (monitoring for unauthorized use — partial). |
| **Total** | **120** | **90 (75%)** | **19 (16%)** | **5 (4%)** | **6 (5%)** | |

## 5. Top 5 gaps to a clean Level 2 self-attestation

These are the controls SZL Holdings is committing to close in the next 90 days as part of the NYSTEC documentation track:

1. **03.01.16 / 03.01.20** — Formal mobile and external-system connection policy. Current state: implicit. Target: written policy + technical enforcement via `aef-policy-guard` egress allowlist.
2. **03.05.07** — PKI for service-to-service auth between A11oy components. Current state: shared secrets + JWTs. Target: short-lived mTLS with rotated CA, deployed to staging by D+45.
3. **03.13.11** — FIPS 140-3 validated cryptographic modules. Current state: OpenSSL 3 with FIPS provider available but not enforced. Target: FIPS-only mode toggle in `packages/auth-shared`, default ON for US gov pilots, by D+30.
4. **03.12.x** — Independent security assessment. Current state: self-assessment. Target: engage 3PAO/C3PAO for Level 2 assessment by Q2 2027.
5. **03.06.05** — Incident information-sharing exercise. Current state: documented procedure, not exercised. Target: tabletop exercise with at least one design partner by D+60.

## 6. Practice-by-practice workbook

A complete workbook with one row per 800-171 Rev. 3 practice, evidence references, and current implementation status is maintained at `docs/compliance/nist-800-171-workbook.xlsx`. Released to active procurements under NDA.

## 7. Buyer guidance

- **Non-CUI pilots:** A11oy can be deployed today with the documented compensating controls.
- **CUI pilots:** Require (a) deployment to AWS GovCloud (US), (b) FIPS-only mode (D+30 milestone), (c) signed CUI-handling addendum, and (d) buyer risk acceptance for the open gaps in §5.
- **DFARS 252.204-7012 flowdown:** SZL will accept the standard flowdown clause for non-CUI-bearing components today, and for CUI-bearing components after the §5 gaps close.

## 8. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. Self-assessment as of this date. |

## 9. Contact

Stephen P. Lutar Jr. · inquiries@szlholdings.com
