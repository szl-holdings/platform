# Product Packaging — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Product, sales, finance, partners, prospective buyers
**Companion docs:** [PRICING_PACKAGING.md](../investor/pricing-packaging.md) · [PLATFORM_EDITIONS.md](platform-editions.md) · [TENANT_TIERS.md](tenant-tiers.md) · [DOMAIN_PACK_CATALOG.md](domain-pack-catalog.md) · [REVENUE_MODEL.md](../investor/revenue-model.md)

---

## Purpose

Define how SZL Holdings sells its platform: what is bundled, what is sold separately, how customers move from evaluation to expansion, and which artifacts map to which commercial SKU.

This is the canonical source. Sales decks, pricing pages, MSAs, and order forms all reference these definitions.

---

## Packaging Principles

1. **Platform first, packs second.** Every customer buys the SZL platform (the six primitives + Alloy + Lyte + CORTEX). Domain packs (Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo, IMPERIUM) are entitlements layered on top.
2. **Outcomes over modules.** SKUs reflect what the customer can decide and prove, not which screens they can open.
3. **One platform, three motions.** Self-serve (small teams), guided pilot (mid-market), enterprise (regulated, multi-tenant).
4. **Governance is not optional.** Every edition includes Proof Chain, Covenant Policy, and Outcome Graph. We do not sell a "lite" governance tier — that would defeat the category claim.
5. **Pricing is published.** Editions, list prices, and pack prices live on the public pricing page (`/pricing`) so buyers can self-qualify before contact.

---

## The Three-Layer Product Model

```
┌────────────────────────────────────────────────────────┐
│  LAYER 3 — Domain Packs (entitlement-gated)            │
│  Aegis · Vessels · Terra · PRISM Counsel · Carlota Jo │
│  IMPERIUM (later)                                      │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│  LAYER 2 — Platform Surfaces (included in all editions)│
│  Lyte (operator command) · Alloy (execution fabric)    │
│  CORTEX (mobile) · Command Portal (cross-domain)       │
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│  LAYER 1 — Six Primitives (the platform itself)        │
│  Event Fabric · Outcome Graph · Proof Chain ·          │
│  Covenant Policy · Monte Carlo · Workflow Engine       │
└────────────────────────────────────────────────────────┘
```

Customers cannot disable Layer 1. They can choose how many domain packs they entitle (Layer 3). Layer 2 surfaces are always available; usage limits scale with edition.

---

## SKU Catalog

| SKU | Layer | Sold As | Notes |
|-----|-------|---------|-------|
| `SZL-PLATFORM-STARTER` | 1 + 2 | Annual | Single tenant, single domain pack, ≤ 25 seats |
| `SZL-PLATFORM-PRO` | 1 + 2 | Annual | Single tenant, up to 3 domain packs, ≤ 100 seats |
| `SZL-PLATFORM-ENTERPRISE` | 1 + 2 | Annual or multi-year | Multi-tenant, all packs available, SCIM, custom SLA |
| `SZL-PACK-AEGIS` | 3 | Annual add-on | Threat intel + incident response |
| `SZL-PACK-VESSELS` | 3 | Annual add-on | Maritime intelligence + AIS |
| `SZL-PACK-TERRA` | 3 | Annual add-on | Real estate distress + ownership graph |
| `SZL-PACK-PRISM-COUNSEL` | 3 | Annual add-on | Legal matter + recovery |
| `SZL-PACK-CARLOTA-JO` | 3 | Annual add-on | Advisory & client portal |
| `SZL-PACK-IMPERIUM` | 3 | Roadmap (FY27) | Sovereign / GovTech edition |
| `SZL-PROFSVC-ONBOARDING` | — | One-time | Standard onboarding (Starter/Pro) |
| `SZL-PROFSVC-IMPLEMENTATION` | — | One-time | Enterprise implementation |
| `SZL-DESIGN-PARTNER` | 1 + 2 + N packs | 12-month, discounted | See `DESIGN_PARTNER_PROGRAM.md` |

See [PRICING_PACKAGING.md](../investor/pricing-packaging.md) for list prices.

---

## Edition Comparison

| Capability | Starter | Pro | Enterprise |
|---|:---:|:---:|:---:|
| Six platform primitives | ✅ | ✅ | ✅ |
| Lyte operator console | ✅ | ✅ | ✅ |
| Alloy workflow engine | ✅ | ✅ | ✅ |
| CORTEX mobile | ✅ | ✅ | ✅ |
| Command Portal (cross-domain) | — | ✅ | ✅ |
| Domain packs included | 1 | up to 3 | all available |
| Tenants | 1 | 1 | unlimited |
| Seats | ≤ 25 | ≤ 100 | unlimited |
| RBAC roles | 11-role hierarchy | 11-role hierarchy | 11-role hierarchy + custom |
| SCIM 2.0 / Azure AD | — | optional add-on | included |
| Custom data residency | US (Replit) | US (Replit/Azure) | Azure region of choice |
| Audit retention | 90 days | 1 year | 7 years (configurable) |
| Support | Email, business hours | Email + Slack, 12×5 | Pager, 24×7, named TAM |
| SLA | None | 99.5% | 99.9% with credits |
| AI model selection | Default stack | Default stack | Customer choice (allow-list) |
| Custom domain pack | — | — | Co-development engagement |

See [PLATFORM_EDITIONS.md](platform-editions.md) for the long-form edition sheet.

---

## Domain Pack Composition

Each domain pack is itself a defined bundle. From [DOMAIN_PACK_CATALOG.md](domain-pack-catalog.md):

| Pack | Signal Sources | Action Vocabulary | Surfaces |
|------|---------------|-------------------|----------|
| Aegis | STIX/TAXII, EDR, SIEM | Triage, contain, escalate, dismiss | `/aegis`, Command Portal Aegis tile |
| Vessels | AIS, sanctions lists, port data | Sanction-screen, route-flag, hold, release | `/vessels`, CORTEX maritime view |
| Terra | Property records, ownership graphs, liens | Pursue, qualify, walk, close | `/terra`, CORTEX deal view |
| PRISM Counsel | Court records, document review pipeline | File, settle, escalate, recover | `/prism-counsel` |
| Carlota Jo | Bookings, advisory engagements | Schedule, deliver, invoice | `/carlota-jo` |
| IMPERIUM (roadmap) | TBD — sovereign sources | TBD | TBD |

A pack always brings: domain agents, signal connectors, action templates, scenario library entries for Monte Carlo, role definitions for RBAC, and pre-built proof chain templates.

---

## What Is Always Included

Every edition includes:

- All six platform primitives (no "lite" governance tier)
- Lyte, Alloy, CORTEX
- 11-role RBAC and tenant isolation (`org_id` scoping enforced at the query layer; bypass requires `super_admin` role with audit logging)
- OIDC authentication
- Immutable Proof Chain audit trail
- Covenant Policy approval gates
- Monte Carlo simulation engine and the domain scenario library entries for entitled packs
- Mobile access via CORTEX
- Standard documentation, knowledge base, and onboarding materials

---

## What Is Sold Separately

- Each domain pack beyond what is included in the edition
- Professional services (onboarding, implementation, custom integrations)
- SCIM/SSO setup beyond the included tier
- Custom domain pack co-development
- Premium support tiers (named TAM, dedicated Slack)
- Data residency outside the included region
- Long retention (> edition default)

---

## Add-Ons and Modifiers

| Add-On | Description | Editions |
|--------|-------------|----------|
| Extra seats | Increment of 25 | Starter, Pro |
| Extra domain pack | One additional pack | Pro |
| Extended retention | +6 years audit retention | Pro |
| Premium support | 24×7 pager, < 4hr SEV1 response | Pro, Enterprise |
| Custom AI model | Customer-supplied / region-isolated | Enterprise |
| Air-gapped option | Customer-managed deployment | Enterprise (roadmap, FY27) |

---

## Lifecycle Touchpoints

| Stage | Customer Action | Platform Surface | Internal Owner |
|-------|----------------|------------------|----------------|
| Evaluate | Hits `/pricing`, requests demo | Marketing site, demo flow | Founder |
| Pilot | Signs design partner agreement | Design partner playbook | Founder + design partner mgr |
| Land | Subscribes to Starter or Pro | Self-service or guided | Sales |
| Expand | Adds packs, seats, tenants | Account manager + Lyte usage data | CSM |
| Renew | Annual or multi-year | Renewal motion | CSM |
| Refer | Co-marketing, case study | `CASE_STUDY_TEMPLATE.md` | Marketing |

---

## Governance over the Catalog

The packaging catalog (this file, plus the four companion files) is the single source of truth. Any pricing page, sales deck, contract, or order form that contradicts these documents must be corrected against these documents.

Changes to the catalog require:

1. Founder approval (CEO sign-off)
2. Update to all four companion docs in the same change
3. Update to the public pricing page
4. Notification to existing customers if any change affects their entitlements

---

## Related Documents

| Document | Path |
|----------|------|
| Pricing | [PRICING_PACKAGING.md](../investor/pricing-packaging.md) |
| Editions | [PLATFORM_EDITIONS.md](platform-editions.md) |
| Tenant tiers | [TENANT_TIERS.md](tenant-tiers.md) |
| Domain pack catalog | [DOMAIN_PACK_CATALOG.md](domain-pack-catalog.md) |
| Revenue model | [REVENUE_MODEL.md](../investor/revenue-model.md) |
| Land & expand | [LAND_AND_EXPAND.md](../sales/land-and-expand.md) |
| Enterprise deal design | [ENTERPRISE_DEAL_DESIGN.md](../sales/enterprise-deal-design.md) |
| Company fact sheet | [COMPANY_FACT_SHEET.md](../sales/company-fact-sheet.md) |
