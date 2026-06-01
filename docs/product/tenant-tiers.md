# Tenant Tiers — SZL Holdings

**Version:** 1.0 · **Last updated:** April 2026
**Audience:** Engineering, customer success, finance, prospective enterprise buyers
**Companion docs:** [TENANCY-MODEL.md](../architecture/tenancy-model.md) · [PLATFORM_EDITIONS.md](platform-editions.md) · [PRODUCT_PACKAGING.md](packaging.md)

---

## Purpose

Define the tenancy posture, isolation guarantees, and operational treatment for each tier of customer. This complements [TENANCY-MODEL.md](../architecture/tenancy-model.md), which describes the technical architecture; this document specifies the *commercial* and *operational* tiering applied on top.

---

## Tier Definitions

| Tier | Description | Edition mapping | Tenants per org |
|------|-------------|-----------------|-----------------|
| Demo | Synthetic, no PII, scheduled reset | n/a | 1 shared |
| Pilot | Design partner or first commercial deployment | Starter or Pro | 1 |
| Standard | Mid-market commercial customer | Pro | 1 |
| Enterprise | Multi-tenant, regulated, contractual SLA | Enterprise | unlimited |
| Sovereign (roadmap) | Single-customer, customer-controlled hosting | Enterprise + IMPERIUM | 1, customer-managed |

---

## Demo Tier

**Purpose:** Public, low-friction evaluation of the platform.

**Tenant model:** A shared `demo` organization. Multiple users can be authenticated into the demo org concurrently.

**Data:** Synthetic only. No real customer data, no real PII. Data resets on a documented schedule (currently weekly during pre-commercial; will be daily at GA).

**Access:** Anonymous-on-rails (specific allowlisted routes) and authenticated demo users with the `demo` role.

**Limits:**

- No write access to platform-level configuration
- No outbound notifications, webhooks, or external API calls
- Approval workflows execute in dry-run mode and surface the result without side effects
- Outcome Graph entries are tagged `demo: true` and excluded from aggregate metrics

**Operational treatment:** Best-effort. No SLA. Demo issues are P3 by default.

---

## Pilot Tier

**Purpose:** First production deployment with a design partner or early commercial customer; intent is to graduate to Standard or Enterprise within 90 days.

**Tenant model:** Single tenant per customer. Hosted alongside other pilot tenants on the shared production infrastructure.

**Data:** Real customer data with full isolation (`org_id` scoping). Customer is responsible for what they ingest.

**Access:** Customer's own users via OIDC (default) or Azure AD (if pilot includes SSO trial).

**Limits:**

- Seat caps per [PLATFORM_EDITIONS.md](platform-editions.md)
- Audit retention per edition
- Custom RBAC roles not available
- Custom data residency not available

**Operational treatment:**

- Email + dedicated Slack channel
- Founder + onboarding owner directly involved
- Weekly check-ins for first 4 weeks, biweekly thereafter
- All changes captured in the design partner playbook (see [DESIGN_PARTNER_PROGRAM.md](../sales/design-partner-program.md))

---

## Standard Tier

**Purpose:** Production commercial customer at Pro edition.

**Tenant model:** Single tenant per customer. Hosted on production infrastructure.

**Data:** Real, isolated by `org_id`. Customer can configure feature flags, tenant branding, and notification preferences.

**Access:** OIDC + optional SCIM/SSO add-on.

**Limits:** Per Pro edition.

**Operational treatment:**

- Email + Slack 12×5
- 99.5% SLA
- Quarterly business review
- Renewal motion at month 9

---

## Enterprise Tier

**Purpose:** Regulated, multi-tenant or large-seat operator with contractual SLA and dedicated relationship.

**Tenant model:** One organization may have multiple tenants. Each tenant is fully isolated; users may belong to multiple tenants with distinct roles per tenant.

**Data:** Real, isolated. Customer-controlled retention up to 7 years (longer with add-on). Customer-controlled data residency (Azure region of choice at GA).

**Access:** SCIM 2.0 + Azure AD SSO included. Custom RBAC roles allowed in addition to the standard 11.

**Limits:** None on tenants or seats. Customer-supplied AI model permitted from approved allow-list.

**Operational treatment:**

- 24×7 pager
- Named TAM
- 99.9% SLA with service credits
- Monthly product input session + quarterly business review
- Dedicated Slack channel
- Customer-managed escalation path documented in MSA

---

## Sovereign Tier (Roadmap, FY27)

**Purpose:** Single-customer deployment in a customer-controlled environment (sovereign cloud, government enclave, or air-gapped).

**Tenant model:** One customer per deployment. The platform code is identical to the commercial editions; the operating environment is customer-controlled.

**Data:** Customer-managed entirely. SZL provides operational runbooks, monitoring agents, and update channels.

**Access:** Customer-managed identity provider, with platform-side OIDC bridging.

**Limits:** No platform-imposed limits. Customer infrastructure capacity is the binding constraint.

**Operational treatment:**

- Joint operations agreement signed before deployment
- Update cadence and approval flow defined in the agreement
- Incident response shared between SZL and customer ops
- Bespoke MSA

---

## Tenant Isolation Across Tiers

| Isolation Layer | Demo | Pilot | Standard | Enterprise | Sovereign |
|-----------------|:----:|:-----:|:--------:|:----------:|:---------:|
| Query-level `org_id` scoping | ✅ | ✅ | ✅ | ✅ | ✅ |
| Storage path prefixed by `org_id` | ✅ | ✅ | ✅ | ✅ | ✅ |
| WebSocket channel `org_id` prefix | ✅ | ✅ | ✅ | ✅ | ✅ |
| HMAC-signed connection tickets | ✅ | ✅ | ✅ | ✅ | ✅ |
| Encryption at rest | ✅ | ✅ | ✅ | ✅ | ✅ |
| Per-region database (multi-region) | — | — | — | optional | ✅ |
| Customer-controlled keys (BYOK) | — | — | — | roadmap | ✅ |
| Air-gapped option | — | — | — | roadmap | ✅ |
| Per-tenant Row-Level Security | — | — | — | optional | ✅ |

The shared infrastructure isolation model is identical at Pilot, Standard, and Enterprise — what differs is hosting region, key custody, and database topology, not the per-query enforcement.

See [TENANCY-MODEL.md](../architecture/tenancy-model.md) for the technical detail.

---

## Tier Transition Mechanics

| From → To | Trigger | Mechanism | Customer impact |
|-----------|---------|-----------|-----------------|
| Demo → Pilot | Customer signs design partner or commercial agreement | Provision new org; migrate any sandbox state if applicable | New URL prefix; net-new login |
| Pilot → Standard | Pilot completion + commercial conversion | Update edition tier; remove pilot annotations | None visible |
| Standard → Enterprise | Commercial upgrade | Migration runbook (multi-tenant enablement, SCIM setup, retention extension, SLA activation) | Up to 1-hour scheduled window |
| Enterprise → Sovereign | Bespoke engagement | Joint operations agreement; net-new deployment | Customer-driven |
| Any → cancellation | Notice period per MSA | Data export window per [DATA-RETENTION.md](../security/data-retention.md), then deletion | 90-day export window |

---

## Operational SLAs by Tier

| Metric | Demo | Pilot | Standard | Enterprise |
|--------|:----:|:-----:|:--------:|:----------:|
| Uptime target | best-effort | 99% | 99.5% | 99.9% |
| Service credits | — | — | — | ✅ |
| SEV1 response | best-effort | 1 hr | 30 min | 15 min |
| SEV1 restoration target | best-effort | 4 hr | 2 hr | 1 hr |
| Status page subscription | — | ✅ | ✅ | ✅ |
| Maintenance window notice | n/a | 48 hr | 7 days | 14 days |

See [INCIDENT_RESPONSE.md](../operations/incident-response.md) for the response runbook.

---

## Provisioning Flow Summary

| Tier | Approval | Lead time | Owner |
|------|----------|-----------|-------|
| Demo | Self-service via demo button | Immediate | Product |
| Pilot | Founder approval | 1–3 business days | Founder |
| Standard | Sales lead approval | 1 business day after contract | CSM |
| Enterprise | Founder + CSM lead approval | 5–10 business days for full provisioning | CSM + DevOps |
| Sovereign | Joint program kickoff | Custom; 60–120 days typical | Founder + customer ops |

---

## Related Documents

| Document | Path |
|----------|------|
| Tenancy model (technical) | [TENANCY-MODEL.md](../architecture/tenancy-model.md) |
| Editions | [PLATFORM_EDITIONS.md](platform-editions.md) |
| Product packaging | [PRODUCT_PACKAGING.md](packaging.md) |
| Access control matrix | [ACCESS-CONTROL-MATRIX.md](../security/access-control-matrix.md) |
| Data retention | [DATA-RETENTION.md](../security/data-retention.md) |
| Incident response | [INCIDENT_RESPONSE.md](../operations/incident-response.md) |
| Design partner program | [DESIGN_PARTNER_PROGRAM.md](../sales/design-partner-program.md) |
