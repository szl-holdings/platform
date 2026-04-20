# Billing Architecture — SZL Holdings Platform

**Version:** 1.0 · **Date:** April 2026
**Audience:** Engineers, finance, enterprise evaluators, investors

---

## Overview

The SZL Holdings platform billing architecture is built on Stripe as the payment processor and subscription manager, with a platform-native entitlements layer that maps Stripe subscription state to feature access. This document covers the complete billing architecture — from Stripe integration through entitlement enforcement at the API layer.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  CUSTOMER / TENANT                                          │
│  Browser or API client                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  PLATFORM ENTITLEMENT LAYER                                 │
│  ─────────────────────────────────────────────────────────  │
│  Entitlement check at API route (middleware)                │
│  Plan limit enforcement (seats, workflows, AI calls)        │
│  Feature flag gate (plan-scoped flags)                      │
│  Domain pack access gate                                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │                         │
              ▼                         ▼
┌─────────────────────┐   ┌────────────────────────────────────┐
│  PLATFORM DATABASE  │   │  STRIPE                            │
│  ─────────────────  │   │  ──────────────────────────────    │
│  billing_plans      │   │  Products & Prices                 │
│  subscriptions      │   │  Customers                         │
│  invoices           │   │  Subscriptions                     │
│  revenue_events     │   │  Invoices                          │
│  organizations      │   │  Payment Intents                   │
│  feature_flags      │   │  Customer Portal                   │
└─────────────────────┘   └────────────────────────────────────┘
              ▲                         │
              │                         │
              └───────── WEBHOOKS ───────┘
                    (checkout.session.completed,
                     customer.subscription.updated,
                     invoice.paid, etc.)
```

---

## Components

### 1. Stripe Integration

The platform uses Stripe for:

| Function | Stripe Feature | Platform Route |
|----------|---------------|----------------|
| Checkout session creation | Checkout Sessions | `POST /api/billing/checkout` |
| Subscription management | Customer Portal | `POST /api/billing/customer-portal` |
| Subscription status lookup | Subscriptions API | `GET /api/billing/subscription-status` |
| Invoice history | Invoices API | `GET /api/billing/stripe-invoices` |
| Plan listing | Products API | `GET /api/billing/products` |
| Webhook event processing | Webhooks | `POST /api/billing/webhooks` |

**Stripe mode:** Determined by `STRIPE_SECRET_KEY` prefix:
- `sk_live_*` → live mode (production)
- `sk_test_*` → test mode (development/staging)
- Not set → mock mode (local development without Stripe)

### 2. Platform Billing Database

Four tables manage billing state within the platform:

#### `billing_plans`
Catalog of available plans. Seeded from `lib/db/src/seed/`. One row per plan tier.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| name | text | Human-readable plan name |
| slug | text | Machine-readable identifier |
| description | text | Plan description |
| monthly_price_cents | integer | Monthly price in cents |
| annual_price_cents | integer | Annual price in cents |
| stripe_price_id_monthly | text | Stripe price ID for monthly |
| stripe_price_id_annual | text | Stripe price ID for annual |
| features | jsonb | Feature flags included in this plan |
| limits | jsonb | Usage limits for this plan |
| is_active | boolean | Whether plan is available for new signups |

#### `subscriptions`
Tracks which organizations are subscribed to which plans.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| org_id | integer | Foreign key to organizations |
| plan_id | integer | Foreign key to billing_plans |
| status | enum | active, trialing, past_due, canceled |
| stripe_subscription_id | text | Stripe subscription ID |
| current_period_start | timestamp | Billing period start |
| current_period_end | timestamp | Billing period end |
| canceled_at | timestamp | Cancellation timestamp if applicable |

#### `invoices`
Mirrors Stripe invoice records for internal reporting.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| org_id | integer | Foreign key to organizations |
| stripe_invoice_id | text | Stripe invoice ID |
| amount | decimal | Invoice amount |
| currency | text | ISO currency code |
| status | text | paid, open, void, uncollectible |
| paid_at | timestamp | Payment timestamp |

#### `revenue_events`
Immutable log of billing events for internal revenue reporting and idempotency.

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| event_type | text | invoice.paid, invoice.payment_failed, etc. |
| product | text | Which product line this event belongs to |
| customer_id | text | Stripe customer ID |
| subscription_id | text | Stripe subscription ID |
| invoice_id | text | Stripe invoice ID |
| amount | text | Amount in base currency units |
| currency | text | ISO currency code |
| idempotency_key | text | Unique — prevents duplicate processing |
| metadata | jsonb | Additional context |

### 3. Webhook Processing

Stripe webhooks are the authoritative source of truth for subscription state changes. The platform processes:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription record, record in revenue_events |
| `customer.subscription.created` | Log subscription state |
| `customer.subscription.updated` | Sync status, period dates |
| `customer.subscription.deleted` | Mark subscription canceled |
| `invoice.paid` | Create invoice record, create revenue event |
| `invoice.payment_failed` | Mark subscription past_due |
| `payment_intent.succeeded` | Log payment success |

**Idempotency:** All webhook processing uses `idempotencyKey` to prevent duplicate processing on replay. The `revenue_events.idempotency_key` column has a unique constraint.

**Signature verification:** All incoming webhooks are verified using `STRIPE_WEBHOOK_SECRET`. Events with invalid signatures are rejected with 400.

### 4. Entitlement Enforcement

Entitlements are enforced at the API layer via middleware. Three enforcement mechanisms:

#### Plan Feature Gate
```typescript
// Route-level feature flag check
const isEnabled = await isFlagEnabled('feature_name', orgId);
if (!isEnabled) {
  return sendForbidden(res, 'Feature not available on your current plan');
}
```

#### Usage Limit Check
```typescript
// Before permitting a new resource creation
const usage = await getOrgUsage(orgId, 'workflow_executions');
const limit = await getPlanLimit(orgId, 'workflow_executions');
if (usage >= limit) {
  return sendForbidden(res, 'Monthly workflow execution limit reached');
}
```

#### Domain Pack Gate
```typescript
// Domain-pack-specific route protection
const hasPack = await orgHasDomainPack(orgId, 'aegis');
if (!hasPack) {
  return sendForbidden(res, 'Aegis domain pack not included in your plan');
}
```

### 5. Price Configuration

Domain-specific Stripe price IDs are set as environment variables:

| Variable | Plan |
|----------|------|
| `STRIPE_PRICE_TERRA_STARTER_MONTHLY` | Terra Starter — monthly |
| `STRIPE_PRICE_TERRA_STARTER_ANNUAL` | Terra Starter — annual |
| `STRIPE_PRICE_TERRA_PRO_MONTHLY` | Terra Pro — monthly |
| `STRIPE_PRICE_TERRA_PRO_ANNUAL` | Terra Pro — annual |
| `STRIPE_PRICE_TERRA_ENTERPRISE_MONTHLY` | Terra Enterprise — monthly |
| `STRIPE_PRICE_TERRA_ENTERPRISE_ANNUAL` | Terra Enterprise — annual |
| `STRIPE_PRICE_FIRESTORM_ENTERPRISE` | Aegis/Firestorm Enterprise |
| `STRIPE_PRICE_STRATEGY_SESSION` | Carlota Jo — Strategy Session |
| `STRIPE_PRICE_PORTFOLIO_REVIEW` | Carlota Jo — Portfolio Review |
| `STRIPE_PRICE_ADVISORY_RETAINER` | Carlota Jo — Advisory Retainer |
| `STRIPE_PRICE_COMMAND_PRO_MONTHLY` | Command Pro — monthly |
| `STRIPE_PRICE_COMMAND_PRO_ANNUAL` | Command Pro — annual |

---

## Billing Flows

### Self-Service Subscription Flow

```
User selects plan → POST /api/billing/checkout
  → Stripe Checkout Session created
  → User redirected to Stripe hosted page
  → Payment completed
  → Stripe fires checkout.session.completed webhook
  → Platform creates subscription record
  → Entitlement flags updated for org
  → User redirected to success URL
```

### Subscription Modification Flow

```
User accesses Customer Portal → POST /api/billing/customer-portal
  → Stripe Customer Portal session created
  → User redirected to Stripe portal
  → User upgrades / downgrades / cancels
  → Stripe fires customer.subscription.updated webhook
  → Platform syncs subscription record
  → Entitlement flags updated for org
```

### Failed Payment Flow

```
Invoice payment fails
  → Stripe fires invoice.payment_failed webhook
  → Platform marks subscription as past_due
  → User sees "Payment required" banner in dashboard
  → Reminder email sent (Stripe handles retry schedule)
  → If not resolved after grace period: subscription canceled
  → Org loses access to paid features
  → Data retained per retention policy (90 days)
```

---

## Trial Architecture

### Trial Period

- All new tenants receive a 14-day free trial with full platform access (all features, all domain packs included in the intended plan tier)
- Trial status is reflected in `subscriptions.status = 'trialing'`
- Stripe handles trial period expiry and conversion

### Trial Expiry

- At trial end: Stripe fires `customer.subscription.updated` with `status: 'trialing'` → `'active'` (if card provided) or `'canceled'` (if no card)
- No card at signup required — card collected on conversion or at checkout
- Trial extension available for design partners: contact support

### Proof-of-Value Extension

For enterprise evaluations, trial periods can be extended beyond 14 days via Stripe subscription modification. This is managed by the internal admin team.

---

## Internal Admin View

Internal admins can view tenant billing state at `/admin/billing`:

| View | Description |
|------|-------------|
| Tenant plan status | Current plan, status, period dates per org |
| Usage dashboard | Real-time usage vs. limits per org |
| Revenue events | Full log of billing events |
| Stripe sync status | Webhook processing health |
| Failed payments | Tenants in past_due state |

Access requires `super_admin` platform role.

---

## Security

| Control | Implementation |
|---------|---------------|
| Webhook signature verification | HMAC-SHA256 via Stripe SDK |
| Price IDs | Environment variables — never client-side |
| Customer data | Never stored beyond Stripe customer ID |
| Payment methods | Never stored on platform — Stripe tokenizes |
| PCI compliance | Stripe handles all card data (PCI DSS Level 1) |
| Billing routes | Authenticated — `requireRole('ops', 'analyst')` on admin routes |

---

## Configuration Checklist

Before activating live billing:

- [ ] `STRIPE_SECRET_KEY` set to live key
- [ ] `STRIPE_WEBHOOK_SECRET` set and webhook endpoint registered in Stripe dashboard
- [ ] All `STRIPE_PRICE_*` variables set for your product line
- [ ] Stripe products and prices created in Stripe dashboard
- [ ] Webhook endpoint verified (test event sent from Stripe dashboard)
- [ ] Customer portal configured in Stripe settings
- [ ] Trial period configured in Stripe product settings
- [ ] Admin billing view tested with a test subscription

---

## Related Documents

| Document | Path |
|----------|------|
| Entitlements model | `ENTITLEMENTS_MODEL.md` |
| Pricing & packaging | `PRICING_PACKAGING.md` |
| Plan matrix | `PLAN_MATRIX.md` |
| Revenue model | `REVENUE_MODEL.md` |
| Billing routes (code) | `artifacts/api-server/src/routes/billing.ts` |
| DB schema | `lib/db/src/schema/` |
