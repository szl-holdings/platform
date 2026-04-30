# Packaging Model — Final

**Last updated:** April 2026  
**Purpose:** Canonical packaging model for SZL Holdings commercial offering. Covers platform access, operator seats, domain packs, design partner motion, enterprise support, and API capabilities.

---

## Packaging Philosophy

The packaging model follows the platform architecture: a shared governance infrastructure with domain-specific extensions. Pricing must reflect this — not obscure it.

Buyers should understand:
1. What they are paying for at the platform level (access to the governed decision infrastructure)
2. What they are paying for at the domain level (which domain packs)
3. How seats work (operator-level pricing, not per-user commodity)
4. How the design partner motion connects to commercial terms

No hidden fees. No surprise usage charges. No enterprise-only pricing that requires a negotiation to discover.

---

## The Four Pricing Dimensions

### 1. Platform Access

The base layer — access to the SZL Holdings governed decision infrastructure including Lyte command surface, Continuum execution fabric, CORTEX mobile, Proof Chain, Outcome Graph, Covenant Policy, Decision Simulation, and Workflow Engine.

Platform access is included with every commercial agreement. You cannot purchase a domain pack without platform access — the domain packs run on the shared infrastructure.

**Platform access is not sold separately.** It is the base of every agreement.

---

### 2. Operator Seats

An operator seat grants a named user access to the platform as a practitioner — the ability to review signals, evaluate AI recommendations, approve or reject actions, and access domain pack workspaces.

Seat types:

| Seat Type | Role Equivalent | Description |
|---|---|---|
| Operator | analyst, viewer | Read access + ability to review AI recommendations |
| Senior Operator | manager | All Operator rights + approve/reject workflows |
| Domain Admin | ops | All Senior Operator rights + user management within domain |
| Platform Admin | super_admin | Full platform access, all domains, all settings |

Pricing model: tiered by seat count, billed annually. Design partner pricing is locked at a minimum 30% discount vs. projected standard pricing.

**Note for founder:** Specific price points are not published in this document. Pricing is set per conversation at this stage. The packaging structure here is the sales framework, not the published price list.

---

### 3. Domain Packs

Domain packs extend the platform into specific operational domains. Each is priced as an add-on to the base platform access agreement.

| Domain Pack | Domain | Current Status |
|---|---|---|
| Aegis | Security & Defense | Functional alpha — available for design partners |
| Vessels | Maritime Intelligence | Functional alpha — available for design partners |
| Terra | Real Estate Intelligence | Functional alpha — available for design partners |
| Counsel | Legal Matter Command | Functional alpha — available for design partners |
| Carlota Jo | Premium Advisory | Available — advisory retainer model |
| IMPERIUM | Cloud Sovereignty | In development — not yet available for pilots |

Domain pack pricing is additive. A buyer who wants Aegis and Vessels pays for platform access + Aegis pack + Vessels pack.

Domain packs include:
- Domain-specific AI agents and scoring engines
- Domain-specific signal sources (as connected to real data in production)
- Domain-specific action vocabulary
- Domain-specific UI workspaces
- Integration with the shared Proof Chain, Continuum, and Event Fabric

---

### 4. Enterprise Support

Standard (included with all plans):
- Async support via email/Slack within 24-hour SLA
- Founder-direct for design partners
- Documented incident response process

Enterprise Support (premium add-on for production agreements):
- 4-hour response SLA for P0 incidents
- Named technical contact
- Quarterly platform review sessions
- Dedicated instance option (Reserved VM, isolated from other tenants)
- Custom SLA terms negotiated at contract level

---

## Design Partner Commercial Motion

Design partners enter at a structured discount vs. projected production pricing:

| Design Partner Tier | Discount vs. Production | Commercial Lock Duration |
|---|---|---|
| Standard | 30% minimum | 12 months post-pilot |
| Strategic | 40% minimum | 18 months post-pilot |
| Enterprise | Negotiated | 24 months post-pilot |

The design partner pricing lock is a commercial commitment — SZL Holdings commits not to raise prices above locked levels during the lock period, regardless of what standard pricing does.

---

## API Capabilities — Commercial Tier

API access is included with platform access agreements. Rate limits scale by tier:

| Tier | Global Rate Limit | Write Rate Limit | AI Endpoint Access |
|---|---|---|---|
| Design Partner | 200/15 min (standard) | 60/min | Standard |
| Production — Standard | 500/15 min | 150/min | Standard |
| Production — Enterprise | Custom | Custom | Priority routing |

API-specific agreements (for integration partners or embedded deployments):
- API-only agreements available for organizations that want to integrate without using the UI
- Priced on request based on call volume and endpoint scope

---

## Carlota Jo Advisory — Separate Model

Carlota Jo operates as a premium advisory practice, not a pure SaaS subscription.

Carlota Jo pricing model:
- Monthly retainer: advisory access, regular strategic sessions, platform-supported insights
- Project-based: defined scope, fixed fee, deliverable-gated
- Platform access: Carlota Jo SaaS component included with advisory retainer; priced separately for organizations that want platform access without advisory

---

## Expansion Motion

Commercial agreements grow through two mechanisms:

**Land:** Single domain pack, defined seat count, standard platform access.

**Expand — seat growth:** More users added as the platform proves value within the team.

**Expand — domain growth:** Additional domain packs added as the organization's operational scope expands (e.g., a security buyer adding maritime intelligence after initial Aegis deployment).

**Expand — enterprise upgrade:** Standard support upgraded to enterprise support as organizational reliance on the platform grows.

Expansion pricing:
- Additional seats: marginal pricing below base per-seat rate (volume discount)
- Additional domain packs: standard domain pack pricing; design partner lock applies to packs in the lock period
- Enterprise upgrade: negotiated separately

---

## What Is Not Included in Any Tier

- Penetration test reports — not yet conducted; available post-audit
- SOC 2 audit reports — not yet certified; on roadmap for Phase 3
- Bespoke feature development — roadmap is informed by design partners, not built to individual specs
- Custom model training on customer data — not in current offering
- 24/7 live support — asynchronous support only in current phase

These exclusions must be stated clearly in sales conversations. Do not overpromise support capabilities.

---

*See also: `founder-pricing-notes-final.md` (pricing considerations), `pilot-to-production-commercial-path.md` (conversion structure)*
