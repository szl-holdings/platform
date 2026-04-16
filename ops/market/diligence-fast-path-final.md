# Diligence Fast Path — Final

**Last updated:** April 2026  
**Purpose:** Self-serve diligence routing by buyer persona. Each path is designed to let buyers get their critical questions answered without requiring a founder call.

---

## Overview

Enterprise buyers conduct diligence before committing to a pilot. The goal is to make this self-serve through Stage 3 so the founder's time is protected for conversations that require judgment, not information transfer.

Four distinct diligence personas have distinct questions and distinct paths:

1. **Executive Buyer** — CTO, COO, VP Operations, Managing Partner
2. **Technical Evaluator** — Senior Engineer, Architect, DevOps Lead
3. **Security Reviewer** — CISO, Security Engineer, Compliance Lead
4. **Procurement / Legal** — Legal, Procurement, Vendor Management

---

## Path 1: Executive Buyer

**Primary questions:**
- Does this solve a real operational problem I have?
- What does the commercial path look like?
- What does a successful pilot produce?
- Who is accountable for making this work?

**Self-serve path:**

| Step | Asset | Location |
|---|---|---|
| 1 | Category positioning — what this is and why it matters | CATEGORY_POSITIONING.md, /trust, /platform |
| 2 | Platform hierarchy — how products relate | COMPANY_FACT_SHEET.md, /platform |
| 3 | Domain pack overview — which pack fits their domain | Domain pack pages (/firestorm, /vessels, /terra) |
| 4 | Design partner offer — what a pilot looks like | `design-partner-offer.md` |
| 5 | Packaging model — commercial range | `packaging-model-final.md` |
| 6 | Executive demo request | /demo |

**Estimated time to complete:** 45–90 minutes self-serve, then 45-minute founder call.

**Common executive concerns and honest answers:**

| Concern | Honest Answer |
|---|---|
| "Are you pre-revenue?" | Yes. Design partner program is how we structure first commercial relationships. |
| "Is this production-ready?" | Functional alpha across all domain packs. Design partners co-validate production readiness. |
| "What happens if you don't get funding?" | The platform is built. The codebase exists and runs. Commercial validation is the current focus. |
| "Do you have any references?" | Not yet. Design partners become our first references. That is the explicit purpose of the program. |

---

## Path 2: Technical Evaluator

**Primary questions:**
- How does the API work? Can we integrate with our systems?
- What is the data model? How is multi-tenancy handled?
- What is the deployment architecture? Who manages infrastructure?
- What are the authentication and authorization controls?
- How are AI models used and governed?

**Self-serve path:**

| Step | Asset | Location |
|---|---|---|
| 1 | API overview — base URLs, auth, error format | `api-commercial-readiness.md` |
| 2 | API documentation — full OpenAPI spec | /api/docs (Swagger UI) |
| 3 | Authorization matrix — role hierarchy, endpoint access | ops/backend/authz-matrix.md (sanitized version) |
| 4 | Deployment architecture — Replit hosting model, Reserved VM vs Autoscale | `environment-and-release-final.md` |
| 5 | Integration priority map — high-value integration patterns | `integration-priority-map.md` |
| 6 | Technical evaluator brief — one-pager summary | `technical-evaluator-brief.md` |

**Estimated time to complete:** 2–4 hours self-serve, then technical discovery call.

**Common technical concerns and honest answers:**

| Concern | Honest Answer |
|---|---|
| "What database?" | PostgreSQL 16, managed by Replit. Drizzle ORM, 700+ tables across 116 schema files. |
| "Is the API public?" | Read paths are available. Write paths require authentication with bearer token or session cookie. |
| "Is there a sandbox environment?" | Not currently. Demo access is provided post-pilot agreement for integration testing. |
| "What rate limits apply?" | 200 req/15min global, 60 writes/min per authenticated user. See api-standards.md. |
| "What AI models are used?" | OpenAI, Anthropic, Gemini with multi-provider fallback. All AI outputs include source citations and confidence scores. |

---

## Path 3: Security Reviewer

**Primary questions:**
- How is authentication handled? What session controls exist?
- How is data encrypted at rest and in transit?
- How is multi-tenant isolation enforced?
- What secrets management exists? Who has access?
- Has a penetration test been conducted?
- What is the incident response process?

**Self-serve path:**

| Step | Asset | Location |
|---|---|---|
| 1 | Trust Center overview — security posture summary | /trust (public-facing) |
| 2 | Threat model summary — STRIDE analysis, residual risks | ops/security/threat-model-summary.md (sanitized) |
| 3 | Authentication and session controls | ops/backend/api-standards.md (auth section) |
| 4 | Secret management summary | ops/security/secret-inventory.md (summary section only) |
| 5 | Incident response overview | docs/internal/ops/incident-response-runbook.md (public-safe sections) |
| 6 | Security contact for questions | security@szlholdings.com |

**Estimated time to complete:** 1–2 hours self-serve, then security discovery call if proceeding.

**What to disclose proactively (do not wait for them to ask):**

| Item | Current Status |
|---|---|
| SOC 2 Type II | Not yet. Targeted for Phase 3 post-funding (estimated 6–9 months after funding closes). |
| Penetration test | Not yet conducted. Planned for pre-production launch. |
| Immutable log sink | Not yet in place. Pino structured logging exists; external tamper-proof sink is on the roadmap. |
| Query timeouts | Database statement timeout enforcement is a known residual risk; on the engineering backlog. |

Proactive disclosure of known gaps builds more trust than letting the reviewer discover them. State gaps, state the mitigation plan, and invite follow-up questions.

---

## Path 4: Procurement / Legal

**Primary questions:**
- What are the data processing terms?
- Who owns data in the platform? How is it handled on contract termination?
- What is the privacy policy and data retention policy?
- What is the terms of service?
- What certifications or compliance frameworks apply?

**Self-serve path:**

| Step | Asset | Location |
|---|---|---|
| 1 | Privacy policy | /legal/privacy |
| 2 | Terms of service | /legal/terms |
| 3 | Data processing agreement (DPA) | Available on request — contact legal@szlholdings.com |
| 4 | Compliance status summary | Trust Center (/trust) |
| 5 | Data retention and deletion policy | Privacy policy (retention section) |

**Common procurement concerns and honest answers:**

| Concern | Honest Answer |
|---|---|
| "Is a DPA available?" | Yes, available on request. Enterprise pilots include a standard DPA. |
| "What certifications do you hold?" | None currently. SOC 2 Type II is targeted for Phase 3. |
| "What is your data retention policy?" | Defined in the privacy policy. Enterprise contracts can specify custom retention terms. |
| "What happens to our data if we terminate?" | Data export on termination, followed by deletion on a defined schedule. Specified in the DPA. |
| "Is this a US company?" | Yes. Headquartered in the United States. |

---

## Diligence Response SLA

Once a buyer is in active diligence:

| Inquiry Type | Response Time |
|---|---|
| General questions | Within 24 hours |
| Security questionnaires | Within 48 hours (founder reviews) |
| Legal/procurement requests | Within 48 hours (DPA delivery) |
| Technical integration questions | Within 24 hours |
| Custom enterprise diligence | Schedule call within 48 hours |

No inquiry should go unanswered beyond 48 hours during active evaluation. Slow responses signal operational immaturity to enterprise buyers.

---

*See also: `trust-center-launch-pass.md` (trust center content checklist), `buyer-evaluation-map.md` (persona-specific evaluation maps)*
