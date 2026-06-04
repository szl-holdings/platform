# Demo & Proof Engine Finalization
**Phase C — CTO Pass**
*Completed: April 16, 2026*
*Owner: Founder*

---

## Summary

This document finalizes the SZL demo infrastructure and proof engine. It covers: what the product can demonstrably show today, where the operating loop is already visible, how demo mode is surfaced, and what materials exist to support pilot conversion.

---

## Operating Loop — Where It Lives in the Product

The core SZL operating thesis is a six-stage loop: **Observe → Evaluate → Decide → Approve → Act → Prove**.

Every stage is now visible in the product. The table below maps each stage to the specific screen and component that surfaces it.

| Stage | What It Means | Where It Lives | Key Screen |
|-------|---------------|---------------|------------|
| **Observe** | Cross-domain signals are ingested and live-counted | Operating Loop Rail (counter: 44 active) | `/operations` — Executive Command header rail |
| **Evaluate** | Signals are classified, correlated, and scored | PRISM Intelligence + Risk dimensions | `/operations/prism/intelligence`, `/operations/prism/risk` |
| **Decide** | Structured decisions are produced with evidence and confidence | Alloy Intelligence Triage Engine + Recommendations | `/operations/recommendations`, `/operations/alloy/intelligence` |
| **Approve** | Human-in-the-loop gate before any consequential action | Approvals Center — shows chain, evidence, confidence per item | `/operations/approvals` |
| **Act** | Actions are routed to owners with full lineage | Action Queue + Alloy Action Console | `/operations/action-queue`, `/operations/alloy/actions` |
| **Prove** | Every action produces a receipt linking back to the original signal | Trust Receipts + Trust Audit | `/operations/alloy/receipts`, `/operations/trust-audit` |

The Operating Loop Rail at the top of Executive Command (`/operations`) makes the entire loop visible in a single glance — six steps, six live counts, always in view.

---

## Demo Mode — Current State

Demo mode is implemented and visually distinct from production. Key indicators:

**When demo mode is ON:**
- Full amber pulsing banner across top of workspace: `DEMO MODE — Synthetic data only · No live systems connected`
- Header background tints amber
- Header border shifts to amber
- Sidebar toggle shows `DEMO MODE ON` with pulsing amber dot
- Executive Command page shows a `DemoModeBanner` component with `SEEDED` badge
- All data values are synthetic and clearly labeled

**When demo mode is OFF (production):**
- No banner, no amber tint
- Dark glass header, subtle border
- Live data sources connected

**How to activate demo mode:**
- Sidebar toggle in Lyte layout (bottom of left nav)
- URL parameter: `?demo=true`
- Sandbox mode provider activated in App shell

This distinction was finalized in Phase B (Operator WOW). The product is fully ready to demo without ambiguity about what is real and what is synthetic.

---

## What the Demo Proves

The demo is designed to prove three things to three audiences:

| Claim | Evidence in Demo | Audience |
|-------|-----------------|----------|
| The full operating loop is live — signal to proof | Operating Loop Rail shows all 6 stages with live counts | All |
| Human-in-the-loop is structural, not decorative | Approvals Center shows chain + evidence + confidence — approval cannot be bypassed | Enterprise buyer, compliance-focused |
| Every AI action is attributable and auditable | Trust Receipts link back to the signal → decision → action chain | CTO, CISO, compliance |

---

## Demo Routes — Summary

| Duration | Audience | Entry Point | Route |
|----------|----------|------------|-------|
| 5-minute | Founder/investor pitch | `/operations` | Operating loop → Approvals → Proof receipt |
| 15-minute | Enterprise buyer, IT leader | `/operations` | Full loop traversal with evidence rails and audit |

Full scripts are in:
- `ops/cto/founder-demo-script.md`
- `ops/cto/enterprise-demo-script.md`

---

## Pre-Demo Checklist

Run this before every demo session:

- [ ] Navigate to `/command/` and verify the app loads
- [ ] Activate demo mode via sidebar toggle — confirm amber banner appears
- [ ] Confirm Operating Loop Rail shows counts on all 6 stages
- [ ] Confirm Pack Signal cards (PRISM, Terra, Vessels, Aegis) are populated
- [ ] Confirm `/operations/approvals` shows at least 3 pending approvals with full audit chains
- [ ] Confirm `/operations/alloy/receipts` shows Trust Receipts
- [ ] Confirm `/operations/trust-audit` loads audit trail
- [ ] Screen resolution: 1440×900 or higher
- [ ] Use a fresh browser profile or clear localStorage
- [ ] Close all unrelated browser tabs

---

## Gap Register

| Gap | Status | Notes |
|-----|--------|-------|
| Operating Loop Rail live counts | ✓ Complete | Seeded data, visually compelling |
| Demo mode / prod distinction | ✓ Complete | Amber banner, sidebar toggle |
| Approval audit chain visual | ✓ Complete | Chain with checkmarks, clock, eye icons |
| Trust Receipts page | ✓ Complete | `/operations/alloy/receipts` |
| Trust Audit page | ✓ Complete | `/operations/trust-audit` |
| Proof engine template | ✓ Complete | See `proof-engine-final.md` |
| Pilot-to-case-study path | ✓ Complete | See `pilot-to-case-study-system.md` |

---

*See also: [Founder Demo Script](./founder-demo-script.md) · [Enterprise Demo Script](./enterprise-demo-script.md) · [Proof Engine](./proof-engine-final.md) · [Pilot to Case Study](./pilot-to-case-study-system.md) · [Operator WOW](./operator-wow-final.md)*
