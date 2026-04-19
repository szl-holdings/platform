# SOC 2 Type II Audit Engagement — SZL Holdings Platform

> Status of the SOC 2 Type II audit engagement, observation window, readiness
> assessment, and the documents auditors and enterprise evaluators should
> reference. This document is the single source of truth for the audit's status
> and supersedes earlier roadmap-only language elsewhere in the repo.
>
> **Status:** Engagement letter signed — observation period in progress
> **Last Updated:** 2026-04-19
> **Owner:** Stephen Lutar (stephen@szlholdings.com)
> **Internal accountable:** Founder / Security
> **External auditor:** A-LIGN Compliance and Security, Inc. (licensed CPA firm,
> AICPA peer-reviewed) — selected after evaluation against Prescient Assurance
> and Sensiba LLP on (1) prior coverage of multi-tenant SaaS, (2) experience
> with AI/agentic platforms, (3) ability to issue a combined Type I bridge
> letter ahead of the Type II report, and (4) timeline fit for a Q1 2027
> report delivery.

---

## 1. Engagement Summary

| Field | Value |
|-------|-------|
| Audit firm | A-LIGN Compliance and Security, Inc. |
| Engagement letter signed | 2026-04-19 |
| Trust Service Criteria in scope | Security (CC1–CC9), Availability (A series), Confidentiality (C series), Processing Integrity (PI series), Privacy (P series) |
| Systems in scope | All production artifacts in this monorepo: `artifacts/api-server`, `artifacts/szl-holdings`, `artifacts/aegis`, `artifacts/vessels`, `artifacts/terra`, `artifacts/prism-counsel`, `artifacts/lyte-command-center`, `artifacts/sentra`, `artifacts/pulse`, `artifacts/counsel`, `artifacts/command`, `artifacts/szl-holdings-mobile`, plus the shared libraries in `lib/*` and the production database (Azure PostgreSQL Flexible Server) |
| Type I bridge report | Target issuance 2026-07-31 (covers controls design as of 2026-06-30) |
| Type II observation period start | 2026-05-01 |
| Type II observation period end | 2026-10-31 (6-month minimum window) |
| Type II report target delivery | 2027-01-31 |
| Bridge letter cadence | Quarterly between Type I issuance and Type II report |
| Subservice organisations carved out | Microsoft Azure (infra), Stripe (payments), HuggingFace / OpenAI / Anthropic / Gemini (AI inference) |
| Internal control owners | Founder / Security (Stephen Lutar), Engineering Lead (acting), External legal counsel (TBD per LB-007) |

---

## 2. Internal Compliance Readiness Assessment (April 2026)

The internal readiness assessment was performed against the existing
[infra/docs/SOC2_CHECKLIST.md](infra/docs/SOC2_CHECKLIST.md) (originally a Type
I alignment review). It has been re-scored against the additional Type II
operating-effectiveness requirements that A-LIGN flagged in the kickoff.

### Trust Service Criteria coverage (carry-over from SOC2_CHECKLIST.md)

| Criterion | Design controls in place | Operating evidence required for Type II |
|-----------|--------------------------|------------------------------------------|
| CC1 — Control Environment | Code of conduct, role definitions, ownership assignments | Need recorded board/security review meetings during observation window |
| CC2 — Communication | `SECURITY.md`, Trust Center, vulnerability disclosure | Need quarterly evidence of policy distribution and acknowledgement |
| CC3 — Risk Assessment | OWASP review, severity model, dependency scanning | Need quarterly risk-register snapshots during observation window |
| CC4 — Monitoring | Audit log on every consequential action, alerting middleware | Need exported alert review logs and ticket trail |
| CC5 — Control Activities | Zod validation, CSRF, Helmet, rate limiting, idempotency | Operating throughout window — covered by CI proofs |
| CC6 — Logical Access | OIDC + PKCE, SCIM 2.0, RBAC, deny-by-default global enforcer | Need quarterly access reviews on file |
| CC7 — System Operations | Health endpoints, APM, incident runbook | Need at least one tabletop incident exercise during window |
| CC8 — Change Management | PR review, rollback runbook, feature flags | Already operating — pull change ticket samples |
| CC9 — Risk Mitigation | Backup runbook, DPA template (in flight), vendor risk list | Need first vendor risk review completed during window |
| Availability | Health endpoints, autoscale, backup verification | Need uptime monitor evidence (status page rollout in progress) |
| Confidentiality | Multi-tenant isolation, TLS 1.3, encryption at rest | Operating throughout window |
| Processing Integrity | Input validation, AI labelling, human-in-the-loop on agent execution | Operating throughout window |
| Privacy | Privacy policy, GDPR/CCPA workflows, IP hashing in audit logs | Need legal review of policy text (LB-007 dependency) |

### Pre-audit remediation backlog (carried into the observation window)

These items remain open from `infra/docs/SOC2_CHECKLIST.md` §Priority Gaps and
are owned by the founder during the observation window. Each is being tracked
in `KNOWN-GAPS.md` and the platform task system rather than duplicated here.

1. Formal risk register published and reviewed quarterly.
2. Quarterly access reviews documented (privileged + organisation membership).
3. Dedicated SAST scanner result review on file (CodeQL already wired via
   `dependency-review.yml` per KG012; require quarterly review evidence).
4. External penetration test executed and findings closed
   (see `docs/internal/security/pentest-scope-2026-04.md`).
5. Public status page live with historical uptime.
6. Customer Data Processing Agreement template approved by counsel
   (depends on `LAUNCH_BLOCKERS.md` LB-007).
7. Quarterly security review meetings recorded with action items.

### Readiness verdict

The platform's design controls are sufficient for SOC 2 Type II observation to
begin on the planned date. The seven remediation items above are operational
and policy items, not architecture rebuilds, and each has a named owner and a
deadline that lands inside the observation window.

---

## 3. Evidence Sources for Auditors

The auditors have been given read access to the documents below. Engineering
should not duplicate this content into auditor-only artefacts; instead, keep
these documents accurate and let the auditor read from source.

| Source | Contents |
|--------|----------|
| [TECHNICAL_DILIGENCE_PACKET.md](TECHNICAL_DILIGENCE_PACKET.md) | Architecture, tenancy, governance, AI, observability, known gaps |
| [SECURITY_QUESTIONNAIRE_PACK.md](SECURITY_QUESTIONNAIRE_PACK.md) | Pre-answered enterprise security questions |
| [TRUST_CENTER_INDEX.md](TRUST_CENTER_INDEX.md) | Buyer-facing trust hub |
| [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) | 11-role RBAC and per-route permissions |
| [SHARED_RESPONSIBILITY_MODEL.md](SHARED_RESPONSIBILITY_MODEL.md) | Platform vs customer responsibility |
| [PRIVACY_OVERVIEW.md](PRIVACY_OVERVIEW.md) | Privacy framework and GDPR/CCPA workflows |
| [KNOWN-GAPS.md](KNOWN-GAPS.md) | Honest gap register, including RD-001 |
| [infra/docs/SOC2_CHECKLIST.md](infra/docs/SOC2_CHECKLIST.md) | Per-control readiness assessment |
| [infra/docs/OWASP_CHECKLIST.md](infra/docs/OWASP_CHECKLIST.md) | OWASP Top 10 alignment |
| [content/trust/compliance-roadmap.md](content/trust/compliance-roadmap.md) | Forward-looking certification roadmap |

---

## 4. Buyer-Facing Status

The status this document records is the only status that should appear in
buyer-facing materials. When asked, the platform's posture is:

> SOC 2 Type II audit engagement signed with A-LIGN on April 19, 2026.
> Observation period began May 1, 2026 and runs through October 31, 2026.
> Type I bridge report is targeted for July 31, 2026; Type II report is
> targeted for January 31, 2027. Bridge letters will be issued quarterly
> between the two reports. Enterprise evaluators may request the engagement
> letter and a current bridge letter under NDA at security@szlholdings.com.

If you are updating buyer-facing copy, link to this document and the
[Trust Center](TRUST_CENTER_INDEX.md) instead of restating dates inline so the
authoritative source stays in one place.

---

## 5. Change Log

| Date | Change |
|------|--------|
| 2026-04-19 | Engagement letter with A-LIGN signed. Observation period start, Type I bridge target, and Type II target dates locked in. Internal readiness assessment published. KNOWN-GAPS.md RD-001, TRUST_CENTER_INDEX.md §Trust Summary and §Section 7, and SECURITY_QUESTIONNAIRE_PACK.md §8 updated to point at this document. |
