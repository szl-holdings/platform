# ISO/IEC 42001:2023 Gap Analysis

**Status:** Gap analysis complete; certification not claimed
**Assessment date:** 2026-07-25
**Scope assessed:** SZL Holdings' repository-level AI governance and evidence
controls; no formal organizational AIMS scope has yet been approved.
**Owner:** Engineering / Governance

## Claim boundary

ISO/IEC 42001 specifies requirements for establishing, implementing,
maintaining, and continually improving an AI management system. This document
is an internal gap analysis against the Clause 4-10 management-system families.
It is **not** an accredited audit, certificate, declaration of conformity, or
evidence that SZL is certified.

Official reference:
[ISO/IEC 42001:2023 — AI management systems](https://www.iso.org/standard/42001)

Certification is targeted only after the organization has approved an AIMS
scope, operated the system long enough to produce evidence, completed an
internal audit and management review, closed material nonconformities, and
authorized an external certification engagement.

## Rating scale

- **IMPLEMENTED** — controlled organizational process exists and current
  evidence covers the assessed scope.
- **PARTIAL** — relevant controls or artifacts exist, but organizational
  coverage, approval, operation, or evidence is incomplete.
- **OPEN** — the required management-system process is not established.

## Clause-family gap analysis

| Clause family | Rating | Evidence found | Gap to close |
|---|---|---|---|
| 4 — Context of the organization | **OPEN** | Product, architecture, buyer, security, and risk documents identify many internal and external concerns. | Approve the AIMS scope and boundaries; identify interested parties and their requirements; maintain an applicable legal/contractual obligations register; define AIMS processes and interfaces. |
| 5 — Leadership | **PARTIAL** | Governance doctrine, public-claim rules, approval gates, and engineering ownership are documented. | Executive approval of an AI policy; named AIMS accountable executive; assigned roles, responsibilities, and authorities; evidence that the policy is communicated and integrated into business processes. |
| 6 — Planning | **PARTIAL** | Risk registers, validators, known-gaps tracking, and policy gates exist. | Establish the organizational AI risk-and-opportunity method; define measurable AIMS objectives; approve treatment plans; select applicable controls and record justification in a controlled Statement of Applicability; define an AI impact-assessment process. |
| 7 — Support | **PARTIAL** | Extensive technical documentation, runbooks, CI evidence, and security guidance exist. | Competence matrix and training records; awareness program; controlled internal/external communications; document-control rules for approval, versioning, access, retention, and disposal of AIMS records; resourcing decision. |
| 8 — Operation | **PARTIAL** | Governed runtime loops, approvals, receipts, replay, policy enforcement, and incident procedures are implemented in parts of the platform. | One authoritative AI-system inventory; per-system lifecycle controls; AI impact assessments; supplier/model-provider controls; operational criteria and retained records; consistent production deployment coverage; completed Annex A control selection and evidence. |
| 9 — Performance evaluation | **PARTIAL** | CI gates, runtime audits, security scans, telemetry, proof packets, and gap registers create useful monitoring evidence. | Approved AIMS KPIs and cadence; evaluation of compliance and control effectiveness; risk-based internal-audit program with auditor independence; scheduled management reviews with required inputs, decisions, and retained minutes. |
| 10 — Improvement | **PARTIAL** | Known gaps, incident follow-up, regression registers, and code-review remediation workflows exist. | Formal nonconformity and corrective-action process; root-cause requirements; effectiveness review; trend analysis; controlled continual-improvement backlog tied to AIMS objectives and management-review decisions. |

No clause family is marked **IMPLEMENTED** because a repository-level control is
not, by itself, evidence of an approved and operating organizational management
system.

## Priority evidence plan

| Target | Action | Accountable role | Required evidence |
|---|---|---|---|
| 30 days | Approve AIMS scope, interested parties, accountable executive, AI policy, and one authoritative AI-system inventory. | Executive sponsor + Governance lead | Signed scope; role assignment; policy approval; inventory with owners, purpose, model/provider, data categories, deployment, risk classification, and lifecycle state. |
| 60 days | Approve the AI risk method, AI impact-assessment template, objectives, control applicability decision, document-control procedure, and supplier controls. | Governance lead + Security + Legal/Compliance | Completed pilot assessments; objective register; Statement of Applicability; controlled templates; provider due-diligence records. |
| 90 days | Operate monitoring, run an independent internal audit, hold a management review, and close or formally accept material findings. | AIMS owner + Independent internal auditor + Executive sponsor | KPI record; audit plan/report; nonconformity/CAPA records; management-review minutes and decisions; updated improvement plan. |
| Post-evidence | Decide whether to engage an accredited certification body. | Executive sponsor | Readiness decision, budget authorization, certification scope, and engagement record. |

## Evidence already reusable

- Canonical inventory and vocabulary: `SOURCE_OF_TRUTH.md`,
  `audit/source-of-truth.json`, and `docs/GLOSSARY.md`
- Governance and replay primitives: `packages/codex-kernel/`
- Cross-system receipt contracts: `packages/anatomy-contracts/`
- Article 12 evidence export: `packages/a11oy-cli/src/article12.ts`
- Security and retention documents: `docs/security/` and `docs/aef/`
- Audit and improvement registers: `audit/` and
  `docs/operations/known-gaps.md`

These artifacts reduce the work required to establish an AIMS. They do not
replace organizational approval, operation, internal audit, management review,
or accredited certification.
