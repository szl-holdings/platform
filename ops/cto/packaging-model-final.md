# Packaging Model — Final
Generated: 2026-04-16

## Purpose
The commercial packaging structure for SZL Holdings products. This document defines how the platform is broken into sellable units, what each tier includes, and how the design-partner pilot maps to the commercial model. This is an internal planning document — not for publication.

---

## Packaging Philosophy

The SZL platform is not a SaaS app with a pricing table. It is an operational intelligence platform sold to enterprise buyers. The packaging model reflects that:

1. **Entry is through the domain** — buyers come in through a problem (legal ops, maritime, security, real estate), not through a generic platform pitch
2. **The core is always Lyte + Alloy** — domain packs are the go-to-market layer on top of a shared platform
3. **Pilots are the sales motion** — not trials. Pilots have defined scope, commitment, and success criteria
4. **Expansion is the revenue model** — land with one domain, expand to others, add seats and integrations over time

---

## Core Platform Tiers

### Tier 1 — Foundation

**Target buyer:** Mid-market operator (100–500 employees) with a single high-consequence domain  
**Entry motion:** Design-partner pilot converting to paid  
**What's included:**

| Component | Detail |
|-----------|--------|
| Lyte core | Signal ingestion, visibility surface, explainable forecast |
| Alloy connector mesh | Up to 3 integration connectors |
| 1 domain pack | Counsel, Vessels, Aegis, or Terra |
| Seats | Up to 10 named users |
| Proof chain | Full audit trail, standard retention |
| Weekly review | Async support; no dedicated CSM |
| SLA | Business-hours response; no uptime guarantee |

**Pilot-to-paid path:** Partner converts at end of 90-day pilot. First-mover pricing locked.

---

### Tier 2 — Operator

**Target buyer:** Enterprise operator (500–2,000 employees) with 1–2 active domains and cross-team usage  
**Entry motion:** Direct sales or upgrade from Foundation  
**What's included:**

| Component | Detail |
|-----------|--------|
| Lyte core | Full feature set including custom signal definitions |
| Alloy connector mesh | Up to 8 integration connectors |
| 1–2 domain packs | Cross-domain signal correlation |
| Seats | Up to 50 named users |
| Proof chain | Full audit trail, extended retention (24 months) |
| SCIM provisioning | SSO + directory sync |
| Dedicated review | Monthly cadence with SZL account lead |
| SLA | 99.5% uptime; 4-hour response |

---

### Tier 3 — Enterprise Command

**Target buyer:** Large enterprise or multi-entity holding with multiple domains, compliance requirements, and procurement process  
**Entry motion:** Structured sales cycle with legal + security review  
**What's included:**

| Component | Detail |
|-----------|--------|
| Lyte core | Custom deployment options (cloud-prem, VPC) |
| Alloy connector mesh | Unlimited connectors; custom connector development |
| All domain packs | Full platform access across domains |
| Seats | Unlimited named users |
| Proof chain | Custom retention and export policy |
| SCIM + advanced SSO | Okta, Azure AD, SAML 2.0 |
| Dedicated CSM | Named customer success manager |
| SLA | 99.9% uptime; 1-hour P0 response; quarterly business review |
| Security review | Shared responsibility model doc, VAPT on request |
| BAA / DPA | Available for regulated industries |

---

## Domain Pack Add-Ons

Domain packs are sold as add-ons to the core platform tiers. Each pack includes:

| Pack | Domain | Core Capabilities |
|------|--------|-------------------|
| Counsel | Legal ops | Matter twins, deadline tracking, demand workflow governance |
| Vessels | Maritime | Voyage twins, fleet risk surface, port ops routing |
| Aegis | Security & defense | Threat twins, SOC command, policy-gated action |
| Terra | Real estate | Property twins, distress signals, underwriting flow governance |

**Pricing note:** Domain packs are priced as a percentage uplift on the base tier. First design-partner converts receive the domain pack at reduced rate for the first contract term.

---

## Seat Model

Seats are named user licenses. Unlike usage-based SaaS, seats represent deliberate operational access.

| Role | Seat Type |
|------|-----------|
| Read-only viewer | View signals and forecasts; cannot approve actions |
| Operator | Full platform use including Alloy action approval |
| Admin | Configuration, integration management, user provisioning |
| Auditor | Read-only access to proof chain and audit exports |

**Seat packages:** Sold in blocks (10, 25, 50, 100+). Overages billed quarterly.

---

## Pilot Motion

The design-partner pilot maps to the commercial model as follows:

| Pilot Phase | Commercial Equivalent |
|-------------|----------------------|
| Kickoff through Day 30 | Foundation tier provisioned at no charge |
| Day 30–90 | Full tier access continues at no charge |
| Day 90 success review | Convert to paid Foundation or Operator |
| Post-conversion | First-mover pricing locked for 24 months |

**Pilot scope:** One domain pack, up to 10 users, 3 connectors. Expansion beyond these limits during the pilot is negotiated case-by-case.

---

## Integration & API Packaging

API access is separate from seat licenses.

| Level | What's Included |
|-------|----------------|
| Standard API | REST endpoints for signal read, action status, proof chain export |
| Advanced API | Webhook subscriptions, event streaming, GraphQL control plane |
| Custom connectors | SZL-built integration to proprietary or legacy systems (SOW basis) |

---

## Enterprise Support Packaging

| Level | What's Included | When |
|-------|----------------|------|
| Standard | Business-hours email, 24-hour response, knowledge base | Foundation tier |
| Priority | 4-hour response, named support contact, escalation path | Operator tier |
| Dedicated | 1-hour P0 response, dedicated CSM, monthly QBR | Enterprise tier |
| Professional Services | Custom onboarding, training, implementation | SOW basis, all tiers |

---

## What Is Not in the Packaging Model

- **Public pricing page:** Not planned for design-partner stage. All pricing is conversation-based.
- **Freemium or self-serve trial:** Not appropriate for this buyer profile or sales motion.
- **Usage-based billing:** May be introduced later for API/data volume; not in scope now.
- **Marketplace listing:** Future consideration for Azure or cloud marketplace.

---

## Version History
- 2026-04-16: Initial draft, CTO Pass Phase G
