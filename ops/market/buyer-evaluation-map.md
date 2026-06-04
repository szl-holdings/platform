# Buyer Evaluation Map

**Last updated:** April 2026  
**Purpose:** Maps evaluation criteria, questions, and asset routing for each buyer persona through the SZL Holdings evaluation process.

---

## Persona Overview

| Persona | Entry Point | Primary Concern | Decision Influence |
|---|---|---|---|
| Executive Buyer | Demo request, warm intro | Strategic fit, commercial risk | Final decision authority |
| Technical Evaluator | Docs, GitHub, API | Integration feasibility, security | Strong veto power |
| Domain Practitioner | Domain pack pages, referrals | Workflow fit, day-to-day usability | Champion or blocker |
| Security Reviewer | Trust Center, CISO referral | Risk posture, compliance gap | Veto power |
| Procurement / Legal | Contract request | Terms, DPA, liability | Process gate |

---

## Persona 1: Executive Buyer

**Typical titles:** CTO, COO, VP Operations, Managing Partner, CISO (when also budget holder)

**Evaluation journey:**

```
Problem recognition → Category understanding → Platform credibility → Commercial model → Pilot commitment
```

**Evaluation questions by stage:**

*Problem recognition:*
- Do we have the accountability gap described?
- Is our domain (security / maritime / real estate / legal) covered?
- Is this the right moment to evaluate decision infrastructure?

*Category understanding:*
- What is the difference between this and our current tools?
- Is this replacing something or adding a layer?
- What does "governed decision infrastructure" mean in practice for our operations?

*Platform credibility:*
- Is this a real platform? Is the team credible?
- What stage is this (pre-revenue, alpha, beta)?
- Who else is using this?

*Commercial model:*
- What does a pilot cost?
- What does production commercialization look like?
- What is the lock-in risk?

*Pilot commitment:*
- What do we commit? What do we get?
- What does success look like?
- What happens after 90 days?

**Assets to serve each question:**

| Question | Asset |
|---|---|
| Problem fit | category-story-final.md, /trust, homepage |
| Category difference | no-commodity-positioning-pass.md, CATEGORY_POSITIONING.md |
| Platform credibility | COMPANY_FACT_SHEET.md, GitHub release history, investor-overview.md |
| Commercial model | packaging-model-final.md, design-partner-offer.md |
| Pilot terms | design-partner-operating-model.md, first-30-days-partner-plan.md |

**Objection handling (executive tier):**

| Objection | Response |
|---|---|
| "We already have dashboards and BI tools." | Dashboards solve visibility. Governed decision infrastructure solves accountability. These are complementary layers, not substitutes. |
| "We're in the middle of other IT initiatives." | Design partner participation is scoped — one domain, one pilot window. It does not compete with ongoing infrastructure projects. |
| "You have no customers." | Correct. Design partner program is how first commercial relationships are structured — and why partners get preferred pricing and roadmap input. |
| "We need SOC 2 before we can evaluate." | SOC 2 audit is targeted for Phase 3. We can discuss what diligence we can provide now and what controls are currently in place. |

---

## Persona 2: Technical Evaluator

**Typical titles:** Principal Engineer, Solutions Architect, DevOps/Platform Lead, VP Engineering

**Evaluation journey:**

```
API exploration → Architecture review → Integration feasibility → Security review → Build vs buy judgment
```

**Evaluation questions:**

*API:*
- What is the base URL and authentication mechanism?
- What error format is used?
- What rate limits apply?
- Is there a sandbox?

*Architecture:*
- What is the data model? How is multi-tenancy enforced?
- What is the deployment model?
- What is the tech stack?
- How are WebSocket connections handled?

*Integration:*
- What high-value integration patterns exist?
- What webhooks or event triggers are available?
- What does an integration typically take to build?

*Security:*
- How is the internal service token managed?
- How is cross-org isolation enforced at the data layer?
- What is the auth token lifecycle?

**Assets:**

| Question | Asset |
|---|---|
| API overview | api-commercial-readiness.md, /api/docs |
| Architecture | COMPANY_FACT_SHEET.md (tech stack), deployment-decision.md |
| Integration | integration-priority-map.md |
| Security | diligence-fast-path-final.md (tech path), ops/backend/authz-matrix.md |
| One-page brief | technical-evaluator-brief.md |

---

## Persona 3: Domain Practitioner

**Typical titles:** Security Analyst, Fleet Manager, Property Director, Litigation Partner, Operations Lead

**Evaluation journey:**

```
Domain discovery → Feature fit → Workflow mapping → Pilot participation
```

**Evaluation questions:**

- Does this cover the specific problems I face day-to-day?
- How does this fit into how my team works?
- Does the AI assistance actually help, or just add complexity?
- Can I try it before we commit?

**Assets:**

| Domain | Asset |
|---|---|
| Security (Aegis) | /aegis demo, docs/buyer/aegis-governance-summary.md, executive-tour.md |
| Maritime (Vessels) | /vessels demo, operator-tour.md |
| Real Estate (Terra) | /terra demo |
| Legal | docs/buyer/prism-counsel-executive-overview.md |
| Advisory (Carlota Jo) | /carlota-jo |

**Practitioner-specific consideration:**
Domain practitioners often become internal champions or blockers. Their buy-in is required for successful pilots even when they lack budget authority. Spend time on workflow fit demonstrations, not just category positioning.

---

## Persona 4: Security Reviewer

**Typical titles:** CISO, Information Security Manager, Compliance Officer, Security Architect

**Evaluation journey:**

```
Trust Center review → Threat model review → Controls validation → Gap acceptance or escalation
```

**Evaluation questions:**

- What is the security architecture?
- What is the encryption posture?
- What are the known gaps?
- What is the compliance certification roadmap?
- What is the incident response process?

**Assets:**

| Question | Asset |
|---|---|
| Security architecture | trust-center-launch-pass.md, /trust pages |
| Threat model | ops/security/threat-model-summary.md (sanitized) |
| Known gaps | diligence-fast-path-final.md (security path, proactive disclosure section) |
| Compliance roadmap | trust-center-launch-pass.md (compliance section) |
| Incident response | docs/internal/ops/incident-response-runbook.md (public-safe sections) |

**Key principle for security reviewers:** Disclose gaps proactively. Security reviewers are trained to find them — and if they find them before you mention them, you lose credibility. If you mention them first with a mitigation plan, you build credibility.

---

## Persona 5: Procurement / Legal

**Typical titles:** Head of Procurement, General Counsel, Vendor Manager, Legal Ops

**Evaluation journey:**

```
Vendor questionnaire → DPA review → Terms review → Compliance check → Contract negotiation
```

**Evaluation questions:**

- Do you have standard DPA terms?
- What is the data retention and deletion policy?
- What is the liability cap in the MSA?
- Are you GDPR-compliant?
- What is the termination process?

**Assets:**

| Question | Asset |
|---|---|
| DPA | Available on request — legal@szlholdings.com |
| Privacy policy | /legal/privacy |
| Terms of service | /legal/terms |
| Compliance status | trust-center-launch-pass.md (compliance section) |

**Procurement process note:**
Procurement typically enters after the executive and technical evaluation have concluded positively. They should not need to re-evaluate the platform — only the contract terms. Have standard DPA and MSA templates ready before any evaluation enters the procurement phase.

---

## Evaluation Completion Criteria

Before advancing a buyer to the design partner offer, confirm:

- [ ] Executive buyer understands the stage (pre-revenue, functional alpha)
- [ ] Technical evaluator has confirmed integration feasibility
- [ ] Domain practitioner has seen a live demo relevant to their domain
- [ ] Security reviewer has reviewed Trust Center and acknowledged known gaps
- [ ] No procurement/legal blockers exist for a pilot agreement

If any item is unchecked, address it before making the design partner offer. A pilot that stalls in legal review after three months wastes everyone's time.

---

*See also: `diligence-fast-path-final.md` (persona routing), `design-partner-offer.md` (partner terms)*
