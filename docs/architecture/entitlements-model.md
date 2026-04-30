# Entitlements Model — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Product, engineering, finance, enterprise evaluators

---

## Overview

The entitlements model defines how platform features, modules, limits, and governance controls are mapped to plan tiers. Entitlements are enforced at the API layer — not in the UI — so they cannot be bypassed by client-side manipulation.

---

## Entitlement Dimensions

Every entitlement falls into one of four dimensions:

| Dimension | Description | Examples |
|-----------|-------------|---------|
| **Feature access** | Binary — feature is on or off | AI recommendations, Monte Carlo simulation |
| **Usage limits** | Numeric cap per billing period | Seats, workflow executions, AI agent calls |
| **Domain pack access** | Binary per pack | Aegis, Vessels, Terra, Counsel included or not |
| **Governance controls** | Depth of governance features | Proof Chain retention, Covenant Policy complexity, audit export |

---

## Plan Tiers

The platform has four commercial tiers plus a free trial:

| Tier | Intended Buyer | Commercial Model |
|------|---------------|-----------------|
| **Trial** | All new tenants | 14-day full access, no card required |
| **Starter** | Small teams (1–10 seats) | Monthly SaaS, self-service |
| **Professional** | Mid-size orgs (11–50 seats) | Monthly or annual SaaS |
| **Enterprise** | Large orgs (50+ seats), custom domains | Annual contract, custom pricing |
| **Command** | Multi-domain operator, MSP | Annual contract, usage-based add-ons |

---

## Feature Entitlements

### Core Platform Features

| Feature | Trial | Starter | Professional | Enterprise | Command |
|---------|:-----:|:-------:|:------------:|:----------:|:-------:|
| Governed Decision Loop | ✅ | ✅ | ✅ | ✅ | ✅ |
| Action Queue | ✅ | ✅ | ✅ | ✅ | ✅ |
| Alloy Workflow Engine | ✅ | ✅ | ✅ | ✅ | ✅ |
| Proof Chain (basic) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Proof Chain (extended retention) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Proof Chain export (CSV/JSON) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Covenant Policy (basic) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Covenant Policy (custom rules) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Monte Carlo simulation | ✅ | ❌ | ✅ | ✅ | ✅ |
| Outcome Graph | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI recommendations (standard) | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI recommendations (custom model) | ✅ | ❌ | ❌ | ✅ | ✅ |
| SSO (Google, Microsoft) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Enterprise SSO (Azure AD OIDC) | ✅ | ❌ | ❌ | ✅ | ✅ |
| SCIM provisioning | ✅ | ❌ | ❌ | ✅ | ✅ |
| API access | ✅ | ✅ | ✅ | ✅ | ✅ |
| MCP gateway access | ✅ | ❌ | ✅ | ✅ | ✅ |
| White-label (custom branding) | ✅ | ❌ | ❌ | ✅ | ✅ |
| Dedicated infrastructure | ❌ | ❌ | ❌ | Optional | ✅ |
| SLA commitment | ❌ | ❌ | ❌ | ✅ | ✅ |
| Compliance exports (SOC 2, ISO) | ✅ | ❌ | ✅ | ✅ | ✅ |
| IP allowlisting | ✅ | ❌ | ❌ | ✅ | ✅ |
| Audit trail | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audit trail (immutable export) | ✅ | ❌ | ✅ | ✅ | ✅ |

### Domain Pack Access

| Domain Pack | Trial | Starter | Professional | Enterprise | Command |
|-------------|:-----:|:-------:|:------------:|:----------:|:-------:|
| Command surface | ✅ | ✅ | ✅ | ✅ | ✅ |
| Aegis (Security & Defense) | ✅ | Add-on | Add-on | Add-on / Bundled | ✅ |
| Vessels (Maritime) | ✅ | Add-on | Add-on | Add-on / Bundled | ✅ |
| Terra (Real Estate) | ✅ | Add-on | Add-on | Add-on / Bundled | ✅ |
| Counsel (Legal) | ✅ | Add-on | Add-on | Add-on / Bundled | ✅ |
| Carlota Jo (Advisory) | ✅ | ❌ | ❌ | By engagement | By engagement |
| IMPERIUM (Cloud Sovereignty) | ✅ | ❌ | ❌ | By arrangement | ✅ |

**Add-on pricing:** Domain packs are available as add-ons to Starter and Professional plans at an incremental monthly fee. Enterprise plans include a negotiated pack bundle. See `PRICING_PACKAGING.md` for indicative pricing.

---

## Usage Limits

| Limit | Trial | Starter | Professional | Enterprise | Command |
|-------|:-----:|:-------:|:------------:|:----------:|:-------:|
| **Active seats** | 5 | 10 | 50 | Unlimited | Unlimited |
| **Workflow executions / month** | 500 | 1,000 | 10,000 | Unlimited | Unlimited |
| **AI agent calls / month** | 200 | 500 | 5,000 | Negotiated | Negotiated |
| **Signal events / month** | 10,000 | 25,000 | 250,000 | Unlimited | Unlimited |
| **Storage (files / documents)** | 5 GB | 10 GB | 100 GB | Negotiated | Negotiated |
| **Proof Chain retention** | 30 days | 30 days | 12 months | Configurable | Configurable |
| **Audit trail export** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **API rate limit** | 100 req/min | 200 req/min | 1,000 req/min | Custom | Custom |
| **Concurrent workflows** | 10 | 20 | 100 | Unlimited | Unlimited |
| **Alloy workflow complexity** | Basic | Basic | Advanced | Full | Full |
| **Monte Carlo iterations** | 1,000 | — | 10,000 | 100,000 | 100,000 |

---

## Governance Control Depth

| Control | Trial | Starter | Professional | Enterprise |
|---------|:-----:|:-------:|:------------:|:----------:|
| Approval chains | Up to 3 steps | Up to 3 steps | Up to 10 steps | Unlimited |
| Covenant Policy rules | Up to 5 | Up to 5 | Up to 50 | Unlimited |
| Policy evaluation logging | ✅ | ✅ | ✅ | ✅ |
| Policy version history | 5 versions | 5 versions | Unlimited | Unlimited |
| Human-in-the-loop configuration | Basic | Basic | Advanced | Full |
| Outcome Graph learning cycle | Manual | Manual | Scheduled | Automated |
| Decision receipt export | ❌ | ❌ | ✅ | ✅ |

---

## Entitlement Enforcement Architecture

### Feature Flag System

Platform features are gated via the `feature_flags` table. Flags are set at two levels:

1. **Platform level** — set by internal admin, applies globally unless overridden
2. **Org level** — overrides platform level for a specific org (for trial extensions, enterprise customizations)

```typescript
// Checking a feature flag in route handler
const isEnabled = await isFlagEnabled('monte_carlo_simulation', orgId);
if (!isEnabled) {
  return sendForbidden(res, 'Feature not available on your current plan');
}
```

### Usage Limit Enforcement

Usage counters are maintained in real-time per org. Limits are checked before permitting resource creation:

```typescript
// Before creating a new workflow execution
const used = await getMonthlyUsage(orgId, 'workflow_executions');
const limit = await getOrgLimit(orgId, 'workflow_executions');
if (used >= limit) {
  return res.status(402).json({
    error: 'LIMIT_EXCEEDED',
    message: 'Monthly workflow execution limit reached. Upgrade to continue.',
    upgradeUrl: '/settings/billing/upgrade',
  });
}
```

### Domain Pack Gate

Domain pack access is checked on every request to a domain-specific route:

```typescript
// Vessels-specific route middleware
const hasPack = await orgHasDomainPack(orgId, 'vessels');
if (!hasPack) {
  return res.status(402).json({
    error: 'PACK_NOT_ACTIVE',
    message: 'Vessels domain pack is not included in your plan.',
    upgradeUrl: '/settings/billing/packs/vessels',
  });
}
```

### Plan Determination

Plan is determined from the org's active subscription:

```typescript
async function getOrgPlan(orgId: number): Promise<Plan> {
  const subscription = await db.select()
    .from(subscriptionsTable)
    .innerJoin(billingPlansTable, eq(subscriptionsTable.planId, billingPlansTable.id))
    .where(and(
      eq(subscriptionsTable.orgId, orgId),
      inArray(subscriptionsTable.status, ['active', 'trialing'])
    ))
    .limit(1);
  
  return subscription[0]?.plan ?? DEFAULT_PLAN;
}
```

---

## Trial Entitlements

The 14-day trial provides full Enterprise-tier access. This is intentional:

- New users experience the full platform — including features that differentiate Premium and Enterprise
- The trial period is long enough to walk the full governed decision loop multiple times
- Conversion from trial is to a specific paid plan — feature reduction on downgrade creates natural upgrade pressure

**Trial-to-paid conversion:**
- If card provided at signup: Stripe automatically converts at trial end
- If no card: Stripe cancels subscription; org loses access to paid features (data retained for 90 days)
- Trial extension: Available for design partners via internal admin

---

## Entitlement Change Events

When a tenant's plan changes (upgrade, downgrade, pack add/remove):

1. Stripe webhook fires `customer.subscription.updated`
2. Platform syncs subscription record
3. Feature flags recalculated for org
4. Usage counters reset if billing period changed
5. Affected users see updated feature access on next page load

**Immediate effect:** Upgrades take effect immediately. Downgrades take effect at the end of the current billing period (users retain current-tier access until period end).

---

## Internal Admin Entitlement View

Internal admins can view and override entitlements per org at `/admin/entitlements`:

| Capability | Admin Access |
|------------|-------------|
| View org plan and status | Read |
| Override specific feature flags | Write (logged) |
| Extend trial period | Write (logged) |
| Grant temporary pack access | Write (logged) |
| View usage vs. limits | Read |
| Reset usage counters | Write (logged) — emergency only |

All overrides are logged in the audit trail with the admin user, timestamp, and reason.

---

## Related Documents

| Document | Path |
|----------|------|
| Billing architecture | `BILLING_ARCHITECTURE.md` |
| Pricing & packaging | `PRICING_PACKAGING.md` |
| Plan matrix | `PLAN_MATRIX.md` |
| Revenue model | `REVENUE_MODEL.md` |
| Access control matrix | `ACCESS-CONTROL-MATRIX.md` |
