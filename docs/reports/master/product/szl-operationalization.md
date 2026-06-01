# SZL Holdings — Operationalization Report

**Date:** April 2026  
**Scope:** SZL Holdings web artifact (`artifacts/szl-holdings`) and mobile app (`artifacts/szl-holdings-mobile`)  
**Status:** Active — design-partner stage, investor relations active

---

## What SZL Holdings Is

SZL Holdings is a focused technology holding company. The entity that owns, operates, and funds the product platforms in the portfolio. It is not itself a product — it is the organizational structure and brand beneath the software.

**Founder:** Stephen Lutar  
**Operating from:** Washington D.C. · London · Singapore  
**Current commercial focus:** Lyte + Alloy (business observability wedge)

---

## Portfolio Map (April 2026)

### Live — design-partner mode
| Platform | Description | Stage |
|----------|-------------|-------|
| Lyte | Business observability command surface | Live — design partners |
| Alloy | Execution fabric (workflow, signals, audit) | Live — design partners |
| Carlota Jo | Premium advisory and services practice | Live — accepting clients |

### On roadmap
| Platform | Description | Stage |
|----------|-------------|-------|
| Lyte commercial pilot | Paid pilot programme | Opening 2025 |
| Vessels | Maritime intelligence | Expansion — post-wedge |
| Aegis / Firestorm | Security command surface | Expansion — post-wedge |
| Terra | Real-estate intelligence | Expansion — post-wedge |

---

## What Is Operationally Real

### Web presence
- Landing page: complete, investor-safe, positions Lyte + Alloy as the commercial wedge
- Platform overview page (`/platform`)
- Design partners page (`/design-partners`)
- Investor story page (`/investor-story`)
- Investor relations page (`/investor-relations`)
- Ventures / platform map (`/ventures`)
- Contact page: working form with inquiry type routing (design-partner, pilot, advisory, investor, general)
- Trust Center (`/trust`, `/trust-security`, `/trust-governance`, `/trust-architecture`)
- Docs page (`/docs`)
- Demo page (`/demo`)
- Legal pages in place

### Alloy internal platform
- Alloy command surface is live at `/alloy/` with multiple operational pages (factory floor, signal feed, workflow orchestration, governance audit, execution history)
- This is an internal command surface — not customer-facing

### Contact and inquiry flow
- Contact form posts to `/api/contact/submit` with inquiry type, name, email, org, message
- Honeypot anti-spam in place
- Success state handled with follow-up navigation
- Design partner criteria shown in sidebar

---

## Trust Section — What Changed

### Previous (removed)
- "$180M+ Capital deployed" — unverifiable and likely inaccurate for this stage
- "6 platforms live" — not accurate; most platforms are in design-partner or prototype stage
- "3 continents market reach" — misleading when framed as deployed revenue

### Current (accurate)
- "Signal-first" architecture philosophy — accurate
- "Founder-led" execution model — accurate, Stephen operates directly
- "Built in" audit posture — accurate, core architecture
- "Design-partner" stage — accurate and honest about current commercial maturity

---

## Landing Page — What Changed

### Added
- **Live-vs-roadmap honest status section** showing what is actually live vs. what is on the roadmap
- **Founder / company separation block** — distinguishes SZL Holdings (the holding structure) from Stephen Lutar (the founder and operator)
- **"Design-partner stage" badge** on hero — replaces "Focused company narrative" to accurately describe current stage
- **CTA updated** to "Request a design-partner session" — more specific and accurate than generic "See the investor story"

### Retained
- Problem framing (Invisible execution risk, No command layer, AI without accountability) — accurate
- Lyte + Alloy product descriptions — accurate
- Target buyer profile — accurate
- Expansion lanes with "Expansion lane" stage labels — retained as honest positioning

---

## Copy Audit

### Claims that are investor-safe and accurate
- "SZL Holdings is building a focused business observability company" ✓
- "Lyte helps operators see execution risk, ownership drift, and workflow friction before they compound" ✓
- "Alloy is the execution fabric: signals, routing, workflows, audit trail, and accountable action" ✓
- "Design-partner mode. Working directly with operators to validate the command model" ✓
- "Your message lands directly with the founder — not a sales queue" ✓

### Claims that were tightened
- Removed inflated traction numbers from TrustSection
- Removed "enterprise scale" headline when no enterprise customers exist yet
- Changed "Focused company narrative" badge to "Design-partner stage" — more honest about current stage

---

## Recommendations

1. **Confirm contact form routing** — submissions from the contact page should reach Stephen directly and trigger immediate notification.
2. **Design partner page** (`/design-partners`) should explicitly list what the design-partner programme involves, what's expected of the partner, and what they get in return.
3. **Demo page** (`/demo`) — confirm what is actually demoable. If it's a walkthrough or prototype, label it as such rather than implying a production live demo.
4. **Investor relations page** — confirm the content on this page matches the current fundraising status and does not make representations about revenue or AUM that aren't supportable.
5. **Mobile app** (SZL Executive Command) — define scope. Is this for Stephen's own operational use? For investor access? Clarify before making it externally visible.
