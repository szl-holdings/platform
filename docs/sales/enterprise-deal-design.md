# Enterprise Deal Design — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Founder, sales lead, deal desk, finance, legal counsel
**Companion docs:** [PLATFORM_EDITIONS.md](../product/platform-editions.md) · [PRICING_PACKAGING.md](../investor/pricing-packaging.md) · [PRODUCT_PACKAGING.md](../product/packaging.md) · [TENANT_TIERS.md](../product/tenant-tiers.md)

---

## What an "Enterprise Deal" Is

An Enterprise deal is any contract that:

- Sells the Enterprise edition (multi-tenant, all packs available, custom controls)
- Has an ACV ≥ $300K
- Includes custom MSA terms beyond our standard
- Requires founder + finance approval

This document is the structured approach for designing, negotiating, and signing those deals.

---

## Enterprise Deal Components

Unlike Starter and Pro, Enterprise pricing is **built up**, not packaged. The order form composes from these components:

| Component | Description | Pricing |
|-----------|-------------|---------|
| Enterprise platform fee | Base license; multi-tenant, unlimited seats | Negotiated; starts at $360K/yr |
| Domain packs | Per pack | Per [PRICING_PACKAGING.md](../investor/pricing-packaging.md) |
| Implementation | Standard implementation; up to 80 hours included | $50K+; built into Year 1 |
| Custom integration | Per SOW | $1,500/day, 10-day minimum |
| Premium support | 24×7 pager, < 4hr SEV1 response | 20% of platform fee |
| Extended retention (> 7 years) | Per year of additional retention | $12K/yr per additional year |
| Customer-supplied AI model | From allow-list | $36K/yr |
| Custom data residency | Outside default region | $24K/yr |
| Air-gapped option (FY27 roadmap) | Customer-controlled environment | Bespoke |
| Custom domain pack co-development | Engineering engagement | Starts at $250K |
| Dedicated TAM | Named relationship lead | Included at Enterprise |

---

## Deal Sizing Framework

Enterprise deal sizing is a build-up, not a discount table. Approximate sizing brackets:

| Profile | Components | Year 1 ACV |
|---------|-----------|-----------:|
| Single-tenant Enterprise | Base + 2 packs + impl + premium support | $400K – $550K |
| Multi-tenant mid-Enterprise | Base + 3 packs + impl + premium support + SCIM | $550K – $800K |
| Strategic Enterprise | Base + 4–5 packs + custom AI model + custom residency + multi-tenant | $800K – $1.5M |
| Co-development Enterprise | Above + custom pack co-dev | $1.2M – $3M+ |

These are guidance, not constraints. Every Enterprise deal is built up from line items.

---

## The Enterprise Deal Lifecycle

```
Identification → Discovery → Architecture → Pricing → Legal → Signature → Implementation
   (week 0)     (weeks 1–4)  (weeks 4–8)   (weeks 6–10) (weeks 8–14) (weeks 12–16) (weeks 16+)
```

### Stage 1: Identification

| Trigger | Source |
|---------|--------|
| Customer asks about multi-tenant | Sales |
| Customer asks about SCIM / Azure AD | Sales |
| Customer's CISO requires diligence packet | Sales |
| Customer's deal would exceed Pro caps (seats / packs / tenants) | Account review |
| Customer is in sovereign / GovTech profile | Founder |
| Customer expansion crosses Enterprise threshold | CSM |

### Stage 2: Discovery (weeks 1–4)

| Item | Owner |
|------|-------|
| Identify all three personas (operator, executive, technical) | Sales lead |
| Understand procurement process and timeline | Sales lead |
| Confirm budget authority and signing authority | Sales lead |
| Run executive demo + technical demo + operator demo | Founder + sales lead |
| Receive completed diligence packet review | Customer's technical buyer |
| Capture custom requirements (residency, retention, AI model, multi-tenancy) | Sales lead |

Disqualification check: if no engaged operator champion, no sponsor, no technical buyer, the deal is not Enterprise-ready.

### Stage 3: Architecture (weeks 4–8)

| Item | Owner |
|------|-------|
| Confirm tenant topology (how many tenants, what data resides where) | Founder + customer architect |
| Confirm identity integration (SCIM, Azure AD, custom OIDC) | DevOps + customer IT |
| Confirm signal sources and connectors | Customer architect + integration support |
| Confirm regulatory regime and applicable controls | Founder + customer compliance |
| Confirm data residency and key custody | Founder + customer security |
| Confirm SLA requirements | Founder + customer ops |
| Confirm support model and named contacts | Founder + customer ops |
| Document the architecture in a one-page summary | Sales lead + founder |

### Stage 4: Pricing (weeks 6–10)

| Item | Owner |
|------|-------|
| Build the line-item proposal from the components above | Sales lead |
| Founder approval on the proposal | Founder |
| Finance approval if discount > 25% off list components | Finance |
| Multi-year terms designed with escalator (default 7% annual) | Founder + finance |
| Service credits structure (per [PLATFORM_EDITIONS.md](../product/platform-editions.md) SLA) | Sales lead |
| Payment terms (Net 60 default; quarterly billing optional with surcharge) | Finance |

### Stage 5: Legal (weeks 8–14)

| Item | Owner |
|------|-------|
| MSA from our standard template | Founder + counsel |
| DPA (Data Processing Agreement) if EU customer | Counsel |
| BAA (Business Associate Agreement) if PHI in scope | Counsel |
| Customer's redlines reviewed | Founder + counsel |
| Negotiation rounds (typical: 2–3) | Founder + counsel |
| Final MSA + DPA + Order Form | Founder + counsel |

### Stage 6: Signature (weeks 12–16)

| Item | Owner |
|------|-------|
| Internal approvals on customer side | Customer's process |
| Final order form signed by both parties | Founder + customer signatory |
| Procurement record opened | Customer procurement |
| Booking confirmed in CRM | Sales lead |
| Implementation kickoff scheduled | DevOps + CSM |

### Stage 7: Implementation (weeks 16+)

Per the SOW. Standard Enterprise implementation: 6–10 weeks.

---

## MSA Structure

Our standard MSA covers:

| Section | Standard position |
|---------|-------------------|
| Scope of services | Per Order Form |
| Subscription term | 1, 2, or 3 years |
| Payment terms | Net 60 default |
| SLA | 99.9% with service credits |
| Confidentiality | Mutual, 3-year term post-contract |
| IP | Customer owns customer data; SZL owns platform |
| Liability cap | 12 months of fees, mutual |
| Indemnification | IP indemnification by SZL; data indemnification by customer |
| Termination | Notice period; data export per [DATA-RETENTION.md](../security/data-retention.md) |
| Force majeure | Standard |
| Governing law | Delaware (default; negotiable for international customers) |

### Common redlines and our positions

| Redline | Our position |
|---------|--------------|
| Liability cap > 12 months of fees | Negotiable up to 18 months for large customers |
| Customer indemnification on AI outputs | Defer to product warranty section; AI is advisory and outputs are reviewable |
| Source code escrow | Available; standard third-party escrow agent at customer cost |
| Audit rights on our infrastructure | We provide SOC 2 (when available) and Trust Center; physical audit not granted |
| Data localization beyond default regions | Available at custom data residency add-on pricing |
| BAA / HIPAA-aligned terms | Available; HIPAA-ready posture roadmap (FY27 full alignment) |
| Custom DPA with SCCs | Standard |
| Right of first negotiation on acquisitions | Decline |
| MFN clauses | Decline (unsustainable) |

---

## Risk-Based Approval Matrix

| Risk factor | Approver |
|-------------|----------|
| Discount 0–10% on Enterprise | Sales lead |
| Discount 11–25% on Enterprise | Founder |
| Discount > 25% | Founder + finance + board (if material) |
| Liability cap > 12 months fees | Founder + counsel |
| Service credits in addition to standard | Founder |
| Custom AI model commitments | Founder + product |
| Custom residency outside US/EU | Founder + DevOps |
| Multi-year prepay > $1M | Finance |
| Payment terms > Net 60 | Finance |
| Sovereign / air-gapped commitment | Founder + board |
| Source code escrow | Founder + counsel |
| Indemnification beyond standard | Founder + counsel |
| MFN clause | Decline (no approval path) |

---

## Margin Discipline

Enterprise deals must hold a baseline margin profile:

| Component | Target gross margin |
|-----------|--------------------:|
| Subscription | ≥ 75% |
| Premium support | ≥ 60% |
| Implementation services | ≥ 30% |
| Custom integration | ≥ 25% |
| Custom domain pack co-dev | Cost-plus 25% |

Deals that fall below baseline require founder + finance approval with explicit rationale.

---

## Multi-Year Deal Design

| Term | Discount available | Escalator |
|------|-------------------:|----------|
| 1 year | 0% | n/a |
| 2 years | 5% off Year 1 list, 5% off Year 2 list | 7% on Year 2 |
| 3 years | 5% off Year 1 list, 7% off Year 2 list, 9% off Year 3 list | 7% Year 2, 7% Year 3 |
| 5 years | Custom | Custom |

Multi-year prepay (cash-up-front for entire term) earns an additional 5% off.

---

## Customer Success Wrap-Around

Enterprise customers receive:

| Wrap-around | Detail |
|-------------|--------|
| Named TAM | Single point of accountability |
| Quarterly business review | Sponsor + champion + TAM + founder |
| Monthly product input session | Champion + product team |
| Dedicated Slack channel | TAM + customer's operator team |
| Architecture review (annual) | TAM + customer's architect |
| Renewal motion start | 120 days pre-renewal |

---

## Special Considerations

### Government / GovTech (IMPERIUM roadmap)

Government deals require additional considerations:

| Area | Approach |
|------|----------|
| Procurement vehicle | GSA / cooperative purchasing investigated for FY27 |
| Security clearance | Not required for current platform; air-gapped roadmap |
| FedRAMP | Roadmap (post-revenue) |
| FISMA | Roadmap (post-revenue) |
| ITAR | Customer-controlled environment for ITAR-regulated workloads (FY27) |

We do not pursue government deals in 2026 outside of state/local + private-sector adjacent. Federal deals are 2028+.

### International

International Enterprise deals require:

| Area | Approach |
|------|----------|
| Currency | EUR/GBP available at Enterprise on request |
| Tax | VAT / GST handled per jurisdiction; customer responsibility for indirect tax |
| Data residency | Per Enterprise residency add-on |
| Governing law | Delaware default; willing to negotiate to UK, Ireland, Singapore |
| Local representative | Required for EU GDPR; we appoint when needed |

---

## Deal Kickoff Sequence

When an Enterprise deal closes:

| Day | Action | Owner |
|-----|--------|-------|
| 0 | Order form countersigned | Founder |
| 1 | Internal kickoff: TAM, DevOps, founder | Founder |
| 3 | Customer kickoff call scheduled | TAM |
| 5 | Tenant provisioning begins | DevOps |
| 7 | Identity integration kickoff | DevOps + customer IT |
| 14 | Customer kickoff call held | TAM + Founder + customer sponsor |
| 30 | First operator training cohort | TAM |
| 60 | First production decisions | Customer + TAM |
| 90 | First QBR | TAM + Founder + customer sponsor |

---

## Related Documents

| Document | Path |
|----------|------|
| Editions | [PLATFORM_EDITIONS.md](../product/platform-editions.md) |
| Pricing | [PRICING_PACKAGING.md](../investor/pricing-packaging.md) |
| Product packaging | [PRODUCT_PACKAGING.md](../product/packaging.md) |
| Tenant tiers | [TENANT_TIERS.md](../product/tenant-tiers.md) |
| Tenancy model | [TENANCY-MODEL.md](../architecture/tenancy-model.md) |
| Access control matrix | [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) |
| Data retention | [DATA-RETENTION.md](../security/data-retention.md) |
| Backup & restore | [BACKUP-RESTORE.md](../operations/backup-restore.md) |
| AI governance | [AI_GOVERNANCE.md](../architecture/ai-governance.md) |
| Technical diligence packet | [TECHNICAL_DILIGENCE_PACKET.md](../investor/technical-diligence-packet.md) |
| Land & expand | [LAND_AND_EXPAND.md](land-and-expand.md) |
| Revenue model | [REVENUE_MODEL.md](../investor/revenue-model.md) |
| Go-to-market motion | [GO_TO_MARKET_MOTION.md](go-to-market.md) |
