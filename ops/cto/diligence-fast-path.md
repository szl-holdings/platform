# Diligence Fast-Path

**Owner:** CTO / Founding team  
**Date:** 2026-04-16  
**Status:** Active

---

## What This Is

A mapped set of routes that take any evaluator from first contact to the most relevant diligence materials in under 3 clicks. This document describes the paths, the logic behind them, and how to maintain them.

---

## The 3-Click Rule

Every diligence path must be reachable from the homepage in under 3 clicks. Currently:

- **Click 1:** Trust evaluator strip on homepage (or "Trust" nav → "Diligence Paths →")
- **Click 2:** Audience-specific card on `/trust#evaluators`
- **At card:** Direct links to material — no further click required for most content

In practice, prepared evaluators who know what they want get there in 1–2 clicks.

---

## Fast-Path Map by Audience

### Executive Buyer

**Entry:** Homepage trust strip → "Executive brief" chip → `/trust#evaluators`

**Materials (2 clicks from homepage):**
- AI Governance model → `/trust/governance`
- Approval & HITL gates → `/trust/approvals`
- System architecture → `/architecture`
- Operating doctrine → `/operating-doctrine`

**What they care about:** Will this create liability? Who is accountable when something goes wrong? Can I explain this to my board?

---

### Technical Evaluator

**Entry:** Homepage trust strip → "Technical review" chip → `/trust#evaluators`

**Materials (2 clicks from homepage):**
- Platform architecture → `/architecture`
- Security controls → `/trust/security`
- Control plane docs → `/docs/control-plane`
- Proof chain docs → `/docs/proof-chain`

**What they care about:** How is this built? What does the data model look like? How do integrations work? Where are the trust boundaries?

---

### Security Reviewer

**Entry:** Homepage trust strip → "Security posture" chip → `/trust/security` (direct, 1 click)

**Materials (1 click from homepage via strip, or 2 via trust center):**
- Security posture → `/trust/security`
- AI governance → `/trust/governance`
- Responsible disclosure → `/legal/security-disclosure`
- Architecture trust layer → `/trust/architecture`

**What they care about:** RBAC model, data isolation, credential handling, encryption in use, what happens when a vulnerability is found.

---

### Investor

**Entry:** Homepage trust strip → "Investor materials" chip → `/trust#evaluators`

**Materials (2 clicks from homepage):**
- Architecture defensibility → `/architecture`
- Operating doctrine → `/operating-doctrine`
- Investor relations → `/investor-relations`
- Governance audit trail → `/trust/governance`

**What they care about:** Why is this architecture hard to replicate? What is the governance moat? How does this scale across domains?

---

## Navigation Entry Points

Evaluators can reach diligence materials through multiple entry points:

| Entry | Route | Audience |
|-------|-------|----------|
| Homepage trust section "Evaluating SZL?" strip | `/` | All |
| SiteNav → Trust → "Diligence Paths →" | `/trust#evaluators` | All |
| SiteNav → Trust → Security | `/trust/security` | Security reviewers |
| Trust center hero CTA | `/trust` | All (generic) |
| Direct URL (if shared by sales/BD) | `/trust#evaluators` | All |

---

## Content Freshness Requirements

Each fast-path destination must remain accurate:

| Page | Last verified | Verification required when |
|------|--------------|---------------------------|
| `/trust/security` | 2026-04-16 | Any infrastructure change |
| `/trust/governance` | 2026-04-16 | Any AI model or HITL change |
| `/architecture` | 2026-04-16 | Any significant architectural change |
| `/docs/control-plane` | 2026-04-16 | API breaking changes |
| `/docs/proof-chain` | 2026-04-16 | Audit model changes |
| `/legal/security-disclosure` | 2026-04-16 | Any disclosure process change |
| `/operating-doctrine` | 2026-04-16 | Quarterly |

---

## What Must Not Be on These Pages

- Certifications not yet achieved (SOC 2, ISO 27001, FedRAMP, etc.)
- Pen test results that do not exist
- "Enterprise-grade" security claims without grounding
- SLA commitments not backed by contractual terms
- Uptime guarantees not backed by monitoring

If any of this is inadvertently added during site updates, it must be removed immediately.
