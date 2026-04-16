# Evaluator Entry Map

**Owner:** CTO / Founding team  
**Date:** 2026-04-16  
**Status:** Active

---

## Purpose

A reference map of every entry point, route, and material destination for evaluators doing diligence on SZL Holdings. Use this document to:
- Verify that all entry points are working
- Identify dead links or outdated content
- Brief sales/BD on what to share with specific evaluator types
- Plan trust infrastructure improvements

---

## Entry Point Inventory

### Homepage (/)

| Surface | Element | Destination | Audience |
|---------|---------|-------------|----------|
| Hero CTA row | "Request a demo" | `/demo` | All |
| Hero CTA row | "Explore the platform" | `/platform` | Technical |
| Trust section | "View the Trust Center" link | `/trust` | All |
| Trust section | "Evaluating SZL?" strip | See chips below | — |
| Trust section chip | "Executive brief" | `/trust#evaluators` | Executive |
| Trust section chip | "Technical review" | `/trust#evaluators` | Technical |
| Trust section chip | "Security posture" | `/trust/security` | Security |
| Trust section chip | "Investor materials" | `/trust#evaluators` | Investor |

---

### SiteNav (present on all pages)

| Menu | Item | Destination | Audience |
|------|------|-------------|----------|
| Trust dropdown | Trust Center | `/trust` | All |
| Trust dropdown | Diligence Paths → | `/trust#evaluators` | All evaluators |
| Trust dropdown | Security | `/trust/security` | Security |
| Trust dropdown | Architecture | `/architecture` | Technical |
| Trust dropdown | AI Governance | `/trust/ai` | Executive / Compliance |
| Trust dropdown | Governance | `/trust/governance` | Executive / Compliance |
| Docs dropdown | Documentation | `/docs` | Technical |
| Docs dropdown | Architecture | `/docs/architecture` | Technical |
| Docs dropdown | Control Plane | `/docs/control-plane` | Technical |
| Docs dropdown | Proof Chain | `/docs/proof-chain` | Technical |

---

### Trust Center (/trust)

| Section | Element | Destination | Audience |
|---------|---------|-------------|----------|
| Hero | "Start a diligence conversation" | `/contact` | All |
| Hero | "System architecture →" | `/architecture` | Technical |
| Diligence paths (#evaluators) | Executive Buyer card | Inline links | Executive |
| Diligence paths (#evaluators) | Technical Evaluator card | Inline links | Technical |
| Diligence paths (#evaluators) | Security Reviewer card | Inline links | Security |
| Diligence paths (#evaluators) | Investor card | Inline links | Investor |
| Coverage grid | Security card | `/trust/security` | Security |
| Coverage grid | Governance card | `/trust/governance` | Executive |
| Coverage grid | AI Policy card | `/trust/ai` | Compliance |
| Coverage grid | Approvals card | `/trust/approvals` | Executive |
| Coverage grid | Exports card | `/trust/exports` | Technical / Legal |
| Coverage grid | Operations card | `/trust/operations` | Technical |
| Coverage grid | Architecture card | `/trust/architecture` | Technical |
| Architecture CTA | "View architecture" | `/architecture` | Technical |
| Bottom CTA | "Request a diligence package" | `/contact` | All |

---

## Material Inventory by Audience

### Executive Buyer

| Material | Route | Format | Status |
|----------|-------|--------|--------|
| AI Governance model | `/trust/governance` | Web page | Live |
| HITL approval model | `/trust/approvals` | Web page | Live |
| System architecture overview | `/architecture` | Web page | Live |
| Operating doctrine | `/operating-doctrine` | Web page | Live |
| Demo request | `/demo` | Form | Live |

**Gaps:** No one-page executive summary PDF. Recommend adding for Phase D.

---

### Technical Evaluator

| Material | Route | Format | Status |
|----------|-------|--------|--------|
| Platform architecture | `/architecture` | Web page | Live |
| Security controls | `/trust/security` | Web page | Live |
| Architecture trust view | `/trust/architecture` | Web page | Live |
| Control plane docs | `/docs/control-plane` | Web page | Live |
| Proof chain docs | `/docs/proof-chain` | Web page | Live |
| API overview | `/api` | Web page | Live |

**Gaps:** No integration spec download. No API reference (OpenAPI). Recommend for Phase C/D.

---

### Security Reviewer

| Material | Route | Format | Status |
|----------|-------|--------|--------|
| Security posture | `/trust/security` | Web page | Live |
| AI governance | `/trust/governance` | Web page | Live |
| Responsible disclosure | `/legal/security-disclosure` | Web page | Live |
| Architecture trust layer | `/trust/architecture` | Web page | Live |

**Gaps:** No pen test summary. No CVE history. No security questionnaire template. These are appropriate gaps for current stage — do not claim they exist.

---

### Investor

| Material | Route | Format | Status |
|----------|-------|--------|--------|
| Platform architecture | `/architecture` | Web page | Live |
| Operating doctrine | `/operating-doctrine` | Web page | Live |
| Investor relations hub | `/investor-relations` | Web page | Live |
| Governance audit trail | `/trust/governance` | Web page | Live |
| Founder page | `/founder` | Web page | Live |

**Gaps:** No investor data room (appropriate for current stage). No audited financials (appropriate for current stage).

---

## Click Depth Audit

| Start | End | Clicks | Path |
|-------|-----|--------|------|
| Homepage | Security posture | 1 | Trust strip → "Security posture" chip |
| Homepage | Diligence paths | 2 | Trust strip → "Technical review" chip |
| Homepage | AI Governance | 2 | Nav → Trust → Governance |
| Homepage | Control plane docs | 2 | Nav → Docs → Control Plane |
| Homepage | Architecture | 2 | Nav → Platform → Architecture |
| Trust center | Security controls | 1 | Coverage grid → Security card |
| Trust center | Executive diligence path | 1 | Scroll to #evaluators → card |

All primary diligence destinations are reachable in ≤ 2 clicks. ✓

---

## Maintenance

Review this map when:
- New pages are added to the trust center or docs
- Navigation items change
- New audience types are identified through sales conversations
- Any route is deprecated or redirected
