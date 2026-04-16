# Platform Editions — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Buyers, partners, sales, customer success
**Companion docs:** [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) · [PRICING_PACKAGING.md](PRICING_PACKAGING.md) · [TENANT_TIERS.md](TENANT_TIERS.md) · [DOMAIN_PACK_CATALOG.md](DOMAIN_PACK_CATALOG.md)

---

## The Three Editions

The SZL Holdings platform is sold in three editions: **Starter**, **Pro**, and **Enterprise**. Every edition includes the full six-primitive governance layer and the Lyte / Alloy / CORTEX surfaces. Editions differ in scale, isolation, support, and configurability — not in governance posture.

---

## Starter

**Built for:** A single team running a single domain. The first commercial customers, design partners, and operators who want to validate the loop before expanding scope.

**Included:**

- Six platform primitives (Event Fabric, Outcome Graph, Proof Chain, Covenant Policy, Monte Carlo, Workflow Engine)
- Lyte operator console
- Alloy execution fabric
- CORTEX mobile (read + approve)
- One domain pack of choice
- 11-role RBAC
- OIDC authentication (Replit Auth or generic OIDC)
- Single tenant
- Up to 25 seats
- 90-day audit retention
- Email support, business hours

**Not included (without add-on):**

- Cross-domain Command Portal
- SCIM provisioning
- Custom data residency
- Premium support
- Multi-tenancy
- Multi-pack entitlement (additional packs are sold as add-ons)

**Operational profile:**

- Hosted in Replit's US infrastructure
- Default audit retention: 90 days
- Backup cadence: nightly snapshots, 30-day retention
- Standard onboarding: 1 week

---

## Pro

**Built for:** Mid-market organizations running 2–3 domains, professional-services firms, regional operators with regulatory exposure.

**Included:**

- Everything in Starter
- Cross-domain Command Portal
- Up to 3 domain packs
- Up to 100 seats
- 1-year audit retention
- Email + Slack support, 12×5
- 99.5% SLA
- Optional SCIM 2.0 add-on

**Not included (without add-on):**

- Multi-tenancy (single tenant only)
- Custom data residency outside US
- 24×7 pager support
- Customer-supplied AI model
- Custom domain pack co-development

**Operational profile:**

- Hosted in Replit US (Azure US optional add-on at GA)
- Default audit retention: 1 year (extendable)
- Backup cadence: nightly snapshots + weekly cross-region copy
- Standard onboarding: 2–3 weeks
- Quarterly business review

---

## Enterprise

**Built for:** Regulated, multi-tenant, multi-domain operators. Companies that require named ownership, custom controls, and contractual SLA. Sovereign and government candidates start here.

**Included:**

- Everything in Pro
- All available domain packs (Aegis, Vessels, Terra, PRISM Counsel, Carlota Jo)
- Multi-tenancy with org-scoped administration
- Unlimited seats
- 7-year audit retention (configurable)
- 24×7 pager, named TAM
- 99.9% SLA with service credits
- SCIM 2.0 + Azure AD SSO included
- Custom data residency (Azure region of choice at GA)
- Customer-supplied AI model (allow-list managed by customer)
- Custom RBAC roles in addition to the standard 11
- Dedicated Slack channel
- Priority feature input

**Optional, contracted separately:**

- Custom domain pack co-development
- Air-gapped deployment (FY27 roadmap)
- Long-term retention beyond 7 years
- Bespoke integration work
- On-site training and workshops

**Operational profile:**

- Hosted in Azure region of customer's choice (US, EU, sovereign on roadmap)
- Default audit retention: 7 years
- Backup cadence: nightly snapshots + cross-region replication + customer-controlled export
- Standard implementation: 6–10 weeks
- Quarterly business review + monthly product input session

---

## Side-by-Side Capability Matrix

| Capability | Starter | Pro | Enterprise |
|---|:---:|:---:|:---:|
| **Platform** | | | |
| Six primitives | ✅ | ✅ | ✅ |
| Lyte | ✅ | ✅ | ✅ |
| Alloy | ✅ | ✅ | ✅ |
| CORTEX mobile | ✅ | ✅ | ✅ |
| Command Portal | — | ✅ | ✅ |
| **Scale** | | | |
| Tenants | 1 | 1 | unlimited |
| Seats | ≤ 25 | ≤ 100 | unlimited |
| Domain packs | 1 | up to 3 | all |
| **Identity** | | | |
| OIDC | ✅ | ✅ | ✅ |
| SCIM 2.0 | — | add-on | ✅ |
| Azure AD SSO | — | add-on | ✅ |
| Custom RBAC roles | — | — | ✅ |
| **Compliance** | | | |
| Audit retention | 90 d | 1 y | 7 y configurable |
| Data residency | US (Replit) | US (Replit / Azure) | Azure region of choice |
| AI model selection | Default | Default | Customer allow-list |
| **Support** | | | |
| Channel | Email | Email + Slack 12×5 | Pager 24×7 |
| Named TAM | — | — | ✅ |
| SLA | None | 99.5% | 99.9% with credits |
| Quarterly business review | — | ✅ | ✅ |
| **Onboarding** | | | |
| Duration (typical) | 1 week | 2–3 weeks | 6–10 weeks |
| Implementation services | Optional | Optional | Included up to 80 hours |

---

## Edition Selection Guide

| If the customer needs… | Recommend… |
|------------------------|------------|
| One team, one domain, evaluating the loop | Starter |
| Multi-domain command across one organization | Pro |
| Multi-tenant SaaS for their own customers | Enterprise |
| Government / sovereign deployment | Enterprise + IMPERIUM roadmap conversation |
| Custom AI model with private data | Enterprise |
| Air-gapped deployment | Enterprise (roadmap; commit timeline before signing) |
| < 25 seats, standard support | Starter |
| > 100 seats | Enterprise |
| Existing Azure tenant with SSO | Pro (with SSO add-on) or Enterprise |

---

## Migration Between Editions

| From → To | Mechanism | Downtime |
|-----------|-----------|----------|
| Starter → Pro | Account upgrade in admin console | None |
| Pro → Enterprise | Migration runbook executed by SZL | Up to 1 hour scheduled window |
| Enterprise → Pro | Allowed at renewal only | Possible data archival |
| Cancel | 90-day data export window | Per [DATA-RETENTION.md](DATA-RETENTION.md) |

Edition upgrades preserve all data, audit history, and configuration. Edition downgrades may require reducing scope (seats, packs, tenants) to fit the lower edition's limits.

---

## What Stays Constant Across Editions

These are non-negotiable platform invariants — they are present at Starter and identical at Enterprise:

- All six primitives are active
- The Proof Chain records every consequential action
- Covenant Policy enforces approval gates at the same layer
- Tenant isolation via `org_id` query scoping is enforced (bypass requires `super_admin` role with audit logging)
- All AI outputs carry provenance metadata
- The 11-role RBAC hierarchy (custom roles in Enterprise are *additions*, not replacements)
- WebSocket tickets HMAC-signed with `SESSION_SECRET`, 5-minute TTL
- TLS 1.3 in transit, encryption at rest
- All Layer 1 source code is identical across editions

What differs is *scale*, *isolation*, *support*, and *configurability* — never *governance posture*.

---

## Related Documents

| Document | Path |
|----------|------|
| Product packaging | [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) |
| Pricing | [PRICING_PACKAGING.md](PRICING_PACKAGING.md) |
| Tenant tiers | [TENANT_TIERS.md](TENANT_TIERS.md) |
| Domain pack catalog | [DOMAIN_PACK_CATALOG.md](DOMAIN_PACK_CATALOG.md) |
| Tenancy model | [TENANCY-MODEL.md](TENANCY-MODEL.md) |
| Access control matrix | [ACCESS-CONTROL-MATRIX.md](ACCESS-CONTROL-MATRIX.md) |
| Data retention | [DATA-RETENTION.md](DATA-RETENTION.md) |
