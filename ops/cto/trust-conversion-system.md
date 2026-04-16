# Trust Conversion System

**Owner:** CTO / Founding team  
**Date:** 2026-04-16  
**Status:** Active — Phase B complete

---

## Purpose

Turn trust from a decorative page into a revenue accelerant. Buyers in high-consequence sectors (legal, maritime, defense, real estate) need a fast, self-serve diligence path before they can commit to a pilot or investment. This document describes the system in place to serve that need.

---

## Design Principles

1. **Honest current state only.** No aspirational certifications are presented as existing. No future roadmap items are described as active controls. If it isn't implemented today, it isn't on the trust pages.

2. **Audience-specific entry.** Different evaluators need different materials. The trust center separates diligence paths by role so each person finds the right content without navigating the whole site.

3. **Under 3 clicks from homepage.** An evaluator can reach their relevant diligence materials in 2 clicks: homepage trust evaluator strip → trust center audience card → specific material page.

4. **No gating.** All trust and diligence materials are publicly accessible without a form, login, or sales call. The goal is to remove friction, not add it.

5. **Cross-linked, not siloed.** Each trust sub-page links to related materials. Security links to governance and architecture. Architecture links to docs. Legal links to security disclosure. No dead ends.

---

## Coverage Areas

The trust center currently covers seven areas:

| Area | Route | What it covers |
|------|-------|----------------|
| Security | `/trust/security` | RBAC, infrastructure, credential management, disclosure |
| Governance | `/trust/governance` | AI HITL model, decision lineage, override records |
| AI Policy | `/trust/ai` | Model usage, source grounding, client data isolation |
| Approvals | `/trust/approvals` | Tiered approval paths, dual-approval model, escalation |
| Exports | `/trust/exports` | Export governance, proof chain on documents, audit trail |
| Operations | `/trust/operations` | Service health, runbooks, external data policy |
| Architecture | `/trust/architecture` | Trust and auditability view of the system architecture |

Supporting materials:

| Area | Route | What it covers |
|------|-------|----------------|
| Legal terms | `/legal/terms` | Terms of service |
| Privacy policy | `/legal/privacy` | Data collection, retention, user rights |
| Cookie policy | `/legal/cookies` | Cookie types and consent |
| Acceptable use | `/legal/acceptable-use` | Platform use restrictions |
| Security disclosure | `/legal/security-disclosure` | Responsible disclosure policy and process |
| Accessibility | `/accessibility` | WCAG posture and known gaps |

---

## Audience Diligence Paths

Four audience-specific paths are surfaced at `/trust#evaluators`:

| Audience | Primary question | Key materials |
|----------|-----------------|---------------|
| **Executive Buyer** | Is this safe to operate at scale? | Governance, approvals, architecture, operating doctrine |
| **Technical Evaluator** | How is this actually built? | Architecture, security, control plane docs, proof chain docs |
| **Security Reviewer** | What controls are in place today? | Security posture, AI governance, disclosure policy, architecture trust layer |
| **Investor** | What makes this defensible? | Architecture moat, operating doctrine, investor relations, governance audit trail |

---

## Evaluator Entry Flow

The fastest path from homepage to diligence materials:

1. Homepage → Trust and control section → "Evaluating SZL?" strip with 4 audience chips
2. Click audience chip → `/trust#evaluators` → audience-specific path card with direct material links
3. Click material link → specific trust/docs page

Maximum: 3 clicks. Typical: 2 clicks for a prepared evaluator who knows what they need.

---

## Accuracy Commitments

The following statements are intentionally **absent** from all trust pages because they are not currently true:

- SOC 2 Type II certification
- ISO 27001 certification
- FedRAMP authorization
- PCI DSS compliance
- HIPAA BAA availability
- Penetration test results (not yet conducted)
- Bug bounty program (not yet active)

When any of these become true, the trust pages must be updated to reflect the real status and the document supporting it.

---

## Maintenance

**Review trigger:** Any security incident, major infrastructure change, or new compliance milestone.  
**Responsible party:** CTO or designated security lead.  
**Update cadence:** At minimum quarterly, or within 30 days of any material change to actual controls.
