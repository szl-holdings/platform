# Packaging Model — SZL Holdings

**Phase:** F · **Audience:** Founder, internal commercial planning · **Last reviewed:** 2026-04-16

**Note:** This document defines the internal packaging model. Public pricing is not published. See `founder-pricing-notes.md` for the rationale.

---

## Purpose

A clear packaging model so that when a buyer asks "what's it cost?" the founder has a structured answer that reflects scope, value, and commitment level — not a guess. Packaging defines the units (per workspace, per workflow, per signal volume, per outcome), the tiers, and the boundaries between them.

---

## The Three-Tier Packaging Model

```
Tier 1 — Pilot         Tier 2 — Production           Tier 3 — Enterprise
(90 days, scoped)      (annual, single domain pack)  (annual, multi-pack, custom)
```

Every commercial conversation starts with which tier the buyer is in.

---

### Tier 1 — Pilot (Design Partner)

**Purpose:** Prove the loop on the buyer's specific operation. Generate proof artifacts.

**Scope:**
- 1-3 specific use cases (narrow)
- 1 domain pack
- Up to 5 operators in the loop
- Read-only or limited write integrations to buyer's systems
- Founder-led white-glove engagement

**Term:** 90 days (renewable for 90 days at SZL's discretion)

**Commercial form:** See `pilot-vs-production-commercial-model.md` — typically free or nominal fee for design partners

**What's included:**
- Hosted instance (Replit Cloud or shared dev environment)
- Founder responsiveness (24h on weekdays)
- Weekly partner review
- Full audit trail and proof artifacts
- Day 90 case study draft

**What's not included:**
- Custom integrations beyond the agreed scope
- Multi-org / multi-tenant config
- SLA-backed uptime commitments
- Direct ops support (founder is the ops support during pilot)

---

### Tier 2 — Production (Single Domain Pack)

**Purpose:** Run the platform in real production for one domain pack with one organization.

**Scope:**
- 1 domain pack (Lyte OR Aegis OR Vessels OR Terra OR Carlota Jo)
- Unlimited use cases within the pack
- Up to 25-50 operators (tiered by seat band)
- Standard integrations (the connectors that exist for that pack)
- Standard SLA (defined per contract)

**Term:** Annual

**Commercial form:**
- Base platform fee + per-seat OR usage-based component
- Discount for multi-year (10-15%)
- Discount for upfront annual payment (5%)

**What's included:**
- Dedicated tenant
- Production SLA (uptime, support response, incident review)
- Standard integrations
- Standard onboarding (4-6 weeks)
- Standard support (email + Slack/Teams shared channel)
- Quarterly business review
- Standard audit trail and reporting

**What's not included:**
- Multi-domain pack (that's Tier 3)
- Custom on-prem / private cloud (that's Tier 3)
- Custom integrations (priced separately)
- Dedicated customer success (that's Tier 3)

---

### Tier 3 — Enterprise (Multi-Pack, Custom)

**Purpose:** Multi-domain pack deployment for an organization with enterprise procurement, security, and compliance requirements.

**Scope:**
- Multiple domain packs (e.g., Lyte + Aegis for a security-conscious enterprise; Lyte + Vessels for a maritime trading firm)
- Unlimited operators (negotiated)
- Custom integrations (negotiated)
- Custom SLA (negotiated)
- Dedicated infrastructure (Azure tenant or on-prem deployment)

**Term:** Annual or multi-year (typically 2-3 years)

**Commercial form:**
- Custom pricing based on scope, scale, and commitment
- Typically annual upfront with payment terms negotiated
- Often includes professional services for integration / migration

**What's included:**
- Dedicated infrastructure or tenant
- Enterprise SLA (uptime, support response, incident review, escalation path)
- Custom integrations (within scope of SOW)
- Dedicated onboarding (8-12 weeks)
- Dedicated customer success contact
- Monthly business review
- Custom reporting and audit trail formats
- Compliance attestations (SOC 2, DPA, etc. — when achieved)
- Private security review and architecture review
- Optional: founder-level engagement on strategic reviews

**What's not included:**
- Anything not in the SOW (negotiated separately)

---

## Cross-Cutting Packaging Dimensions

### Per-Domain-Pack vs. Multi-Pack
- Buyer in Tier 2 picks one pack. Adding a second pack triggers re-packaging (typically into Tier 3 or a separately-priced Tier 2 add-on).
- Multi-pack discounts apply at Tier 3 only.

### Per-Seat vs. Usage-Based
- **Per-seat** for operator-driven packs (Lyte, Aegis Defense, Carlota Jo)
- **Usage-based** for signal-driven packs (Vessels — per vessel, Terra — per region/portfolio size)
- **Hybrid** for mixed packs (e.g., per-seat for operators + per-signal for high-volume domain packs)

### Mobile (CORTEX)
- Included with any tier at no additional charge
- Not separately licensed — every operator with a web seat gets the mobile app

### Add-Ons (priced separately at any tier)
| Add-on | Why |
|--------|-----|
| Custom integration (per integration) | Buyer-specific source or sink |
| Premium support tier | Faster response, dedicated CS |
| Dedicated single-tenant deployment | Compliance / sovereignty |
| Professional services (migration, training) | One-time engagement |
| AI inference cost pass-through (if usage exceeds plan) | Variable, transparent |

---

## Packaging Boundaries (When to Move a Buyer Between Tiers)

| Signal | Move from | Move to |
|--------|-----------|---------|
| Pilot completed, buyer wants to continue | Tier 1 | Tier 2 (default) |
| Tier 2 buyer wants a second domain pack | Tier 2 | Tier 3 |
| Tier 2 buyer hits 50+ operators | Tier 2 | Tier 3 |
| Tier 2 buyer needs SOC 2, custom SLA, or on-prem | Tier 2 | Tier 3 |
| Tier 2 buyer churns | Tier 2 | Out (capture lessons; if recoverable, restart from Tier 1) |
| Tier 1 buyer doesn't continue at Day 90 | Tier 1 | Out (capture lessons; case study if Tier 1 reference granted) |

---

## Packaging Discipline

- **Never sell what isn't in the tier.** If the buyer needs something not in their tier, propose moving them up — don't bolt it on.
- **Never undercut your own tier structure.** If Tier 2 starts at $X, never sell Tier 2 at $X/2. That destroys pricing integrity.
- **Always quote the tier first, then the price.** Buyers should understand they are buying a package, not a la carte.
- **Add-ons are explicit.** Don't bundle add-ons into base price; itemize them.

---

## Packaging Refresh Cadence

- **Quarterly:** Review pilot → production conversion rate; adjust Tier 1 scope if conversions are weak
- **Bi-annually:** Review Tier 2 pricing vs. observed value delivered (case studies); adjust as needed
- **Annually:** Review Tier 3 commercial structure based on enterprise close patterns

---

## Anti-Patterns

- **Custom-tier-of-one for every deal.** That isn't packaging; it's pricing chaos. Three tiers, finite add-ons.
- **Pricing the pilot like production.** The pilot is to prove the loop, not to extract revenue. Tier 1 pricing should reflect that.
- **Multi-pack at Tier 2 pricing.** That destroys the path from Tier 2 → Tier 3.
- **Hiding the tier you'd put them in.** Tell the buyer their tier in the proposal. Transparency builds trust.

---

*Three tiers. Clear boundaries. Explicit add-ons. The packaging model is the spine of the commercial engine — without it, every deal is a one-off negotiation.*
