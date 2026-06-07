# Billing System Runbook

## Overview

This system provides a unified Stripe-based payment infrastructure across all 9 SZL Holdings web products:
**Sentra, Counsel, Pulse, Terra, Vessels, Command, SZL Holdings, Carlota Jo, Lyte**.

It covers:
- Subscription checkout via Stripe Checkout Sessions
- Webhook-driven subscription state management
- Feature entitlement gating via `useEntitlement` / `RequireEntitlement`
- One-time purchases for Carlota Jo (Strategy Session, Portfolio Review, Advisory Retainer)
- Per-product Billing Account page (`/account/billing`)
- Admin Billing Console in SZL Holdings (`/admin/billing`)

---

## Architecture

### Database Tables (`lib/db/src/schema/billing.ts`)

| Table | Purpose |
|---|---|
| `subscriptionsTable` | One row per org×product. Tracks `stripeSubscriptionId`, `planTier`, `status`, `currentPeriodEnd`, `cancelAtPeriodEnd`. |
| `fulfillmentsTable` | One-time purchase records keyed by `stripeSessionId`. Tracks `product`, `itemKey`, `status` (`pending` → `fulfilled`). |
| `entitlementOverridesTable` | Admin-granted feature entitlements scoped to an org+product+featureKey. Support/sales bypass for paywall gating. |

The `organizationsTable` carries a `billingCustomerId` (Stripe Customer ID) column for lookup.

### API Routes (`artifacts/api-server/src/routes/billing.ts`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/billing/subscribe/:product` | Creates a Stripe Checkout Session (subscription mode). Returns `{url}`. |
| `POST` | `/api/billing/one-time/:product` | Creates a Stripe Checkout Session (payment mode). Returns `{url}`. |
| `POST` | `/api/billing/portal` | Opens Stripe Customer Portal for the session user. |
| `GET` | `/api/billing/subscription` | Returns the current subscription for the authenticated org. |
| `POST` | `/api/billing/webhook` | Stripe webhook endpoint (must be unprotected, raw body). |
| `GET` | `/api/billing/entitlements/check` | Checks a feature key against subscription tier + overrides. |
| `GET` | `/api/billing/fulfillments` | Returns fulfilled one-time purchases for the org. |
| `GET` | `/api/billing/admin/subscriptions` | **Admin only.** List all org subscriptions. |
| `GET` | `/api/billing/admin/entitlement-overrides` | **Admin only.** List all active overrides. |
| `POST` | `/api/billing/admin/resync` | **Admin only.** Resync a subscription from Stripe. |
| `POST` | `/api/billing/admin/entitlement-overrides` | **Admin only.** Grant an override. |
| `DELETE` | `/api/billing/admin/entitlement-overrides/:id` | **Admin only.** Revoke an override. |

### Shared UI (`lib/shared-ui/src/billing/`)

| Export | Description |
|---|---|
| `useEntitlement(featureKey, product?)` | Hook returning `{ allowed, loading }`. Calls `/api/billing/entitlements/check`. |
| `RequireEntitlement` | Component wrapper — renders children if entitlement is granted, otherwise renders an upgrade prompt or redirects to `/pricing`. |
| `PricingPage` | Generic pricing page accepting `plans[]`, `accentColor`, `productName`, `subscribeEndpoint`. Each plan's CTA calls the API and redirects to Stripe Checkout. |
| `BillingAccount` | Generic account billing page. Shows current plan, next renewal, portal link, and entitlements. |

---

## Environment Variables

All secrets are managed via Replit environment variables. The following must be set in production:

```
STRIPE_SECRET_KEY            # sk_live_...
STRIPE_WEBHOOK_SECRET        # whsec_...
STRIPE_PUBLISHABLE_KEY       # pk_live_... (frontend)

# Subscription price IDs per product+tier+interval
STRIPE_PRICE_SENTRA_STARTER_MONTHLY
STRIPE_PRICE_SENTRA_STARTER_ANNUAL
STRIPE_PRICE_SENTRA_PRO_MONTHLY
STRIPE_PRICE_SENTRA_PRO_ANNUAL
STRIPE_PRICE_SENTRA_ENTERPRISE_MONTHLY
STRIPE_PRICE_SENTRA_ENTERPRISE_ANNUAL

STRIPE_PRICE_COUNSEL_STARTER_MONTHLY
STRIPE_PRICE_COUNSEL_STARTER_ANNUAL
STRIPE_PRICE_COUNSEL_PRO_MONTHLY
STRIPE_PRICE_COUNSEL_PRO_ANNUAL
STRIPE_PRICE_COUNSEL_ENTERPRISE_MONTHLY
STRIPE_PRICE_COUNSEL_ENTERPRISE_ANNUAL

STRIPE_PRICE_PULSE_STARTER_MONTHLY
STRIPE_PRICE_PULSE_STARTER_ANNUAL
STRIPE_PRICE_PULSE_PRO_MONTHLY
STRIPE_PRICE_PULSE_PRO_ANNUAL
STRIPE_PRICE_PULSE_ENTERPRISE_MONTHLY
STRIPE_PRICE_PULSE_ENTERPRISE_ANNUAL

STRIPE_PRICE_SZL_STARTER_MONTHLY
STRIPE_PRICE_SZL_STARTER_ANNUAL
STRIPE_PRICE_SZL_PRO_MONTHLY
STRIPE_PRICE_SZL_PRO_ANNUAL
STRIPE_PRICE_SZL_ENTERPRISE_MONTHLY
STRIPE_PRICE_SZL_ENTERPRISE_ANNUAL

STRIPE_PRICE_VESSELS_STARTER_MONTHLY
STRIPE_PRICE_VESSELS_STARTER_ANNUAL
STRIPE_PRICE_VESSELS_PRO_MONTHLY
STRIPE_PRICE_VESSELS_PRO_ANNUAL
STRIPE_PRICE_VESSELS_ENTERPRISE_MONTHLY
STRIPE_PRICE_VESSELS_ENTERPRISE_ANNUAL

STRIPE_PRICE_TERRA_STARTER_MONTHLY
STRIPE_PRICE_TERRA_STARTER_ANNUAL
STRIPE_PRICE_TERRA_PRO_MONTHLY
STRIPE_PRICE_TERRA_PRO_ANNUAL
STRIPE_PRICE_TERRA_ENTERPRISE_MONTHLY
STRIPE_PRICE_TERRA_ENTERPRISE_ANNUAL

STRIPE_PRICE_COMMAND_STARTER_MONTHLY
STRIPE_PRICE_COMMAND_STARTER_ANNUAL
STRIPE_PRICE_COMMAND_PRO_MONTHLY
STRIPE_PRICE_COMMAND_PRO_ANNUAL
STRIPE_PRICE_COMMAND_ENTERPRISE_MONTHLY
STRIPE_PRICE_COMMAND_ENTERPRISE_ANNUAL

STRIPE_PRICE_LYTE_STARTER_MONTHLY
STRIPE_PRICE_LYTE_STARTER_ANNUAL
STRIPE_PRICE_LYTE_PRO_MONTHLY
STRIPE_PRICE_LYTE_PRO_ANNUAL
STRIPE_PRICE_LYTE_ENTERPRISE_MONTHLY
STRIPE_PRICE_LYTE_ENTERPRISE_ANNUAL

# One-time purchase price IDs for Carlota Jo
STRIPE_PRICE_CARLOTA_STRATEGY_SESSION
STRIPE_PRICE_CARLOTA_PORTFOLIO_REVIEW
STRIPE_PRICE_CARLOTA_ADVISORY_RETAINER
```

---

## Stripe Webhook Setup

1. In the Stripe Dashboard, create a webhook endpoint pointing to:
   ```
   https://<your-domain>/api/billing/webhook
   ```
2. Subscribe to the following events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
3. Copy the signing secret and set `STRIPE_WEBHOOK_SECRET` in Replit secrets.

> **Note:** The webhook route bypasses authentication middleware and uses raw body parsing for signature verification.

---

## Entitlement Gating

### Feature Key Conventions

Feature keys follow the pattern `<product>:<feature>`, e.g.:

- `sentra:threat-intel`
- `counsel:matter-ai`
- `vessels:predictive-eta`
- `command:signal-correlation`
- `terra:distress-engine`
- `pulse:governed-cockpit`
- `lyte:decision-twin`
- `szl:alloy-workflows`

### Tier-to-feature mapping

Tiers grant cumulative features: `enterprise` ⊇ `pro` ⊇ `starter`. The mapping lives in `artifacts/api-server/src/routes/billing.ts` under `TIER_FEATURES`.

### Admin Overrides

Admins can grant feature access outside of subscription status via the Admin Billing Console at `/admin/billing` or via the API:

```http
POST /api/billing/admin/entitlement-overrides
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "orgId": "org_abc",
  "product": "sentra",
  "featureKey": "sentra:threat-intel",
  "expiresAt": "2026-12-31T00:00:00Z"  // optional
}
```

---

## One-Time Purchases (Carlota Jo)

Carlota Jo offers three one-time engagements:

| Item Key | Stripe Price Env |
|---|---|
| `strategy-session` | `STRIPE_PRICE_CARLOTA_STRATEGY_SESSION` |
| `portfolio-review` | `STRIPE_PRICE_CARLOTA_PORTFOLIO_REVIEW` |
| `advisory-retainer` | `STRIPE_PRICE_CARLOTA_ADVISORY_RETAINER` |

On `checkout.session.completed` with `mode === 'payment'`, the webhook creates a `fulfillment` record with `status: 'fulfilled'`. The frontend checks `/api/billing/fulfillments` to gate access to session deliverables.

---

## Admin Billing Console (SZL Holdings)

Route: `/admin/billing` — accessible to `admin` and `super_admin` roles.

Features:
- **Subscriptions tab**: Search by org name/ID, filter by product and status. View current plan, period end, cancel-at-period-end flag. Resync any subscription from Stripe via the API.
- **Entitlement Overrides tab**: View all active overrides with expiry dates. Revoke overrides instantly.

---

## Per-Product Routing Summary

| Product | Pricing Page | Billing Account |
|---|---|---|
| Sentra | `/pricing` | `/account/billing` |
| Counsel | `/pricing` | `/account/billing` |
| Pulse | `${BASE}/pricing` | `${BASE}/account/billing` |
| Terra | `/pricing` | `/account/billing` |
| Vessels | `/pricing` | `/account/billing` |
| Command | `/marketing/pricing` | `/account/billing` |
| SZL Holdings | `/pricing` | `/account/billing` |
| Carlota Jo | `/pricing` | `/account/billing` |
| Lyte | `/pricing` | `/account/billing` |

---

## Common Runbook Operations

### Manually resync a subscription

```http
POST /api/billing/admin/resync
{ "orgId": "org_xxx", "product": "sentra" }
```

This fetches the latest subscription state from Stripe and updates the DB.

### Grant a trial entitlement

```http
POST /api/billing/admin/entitlement-overrides
{ "orgId": "org_xxx", "product": "counsel", "featureKey": "counsel:matter-ai", "expiresAt": "2026-07-01T00:00:00Z" }
```

### Check what a user can access

```http
GET /api/billing/entitlements/check?featureKey=sentra:threat-intel&product=sentra
```

Returns `{ allowed: true|false, source: "subscription"|"override" }`.

### Downgrade an org immediately

Update the subscription in Stripe Dashboard (change plan or cancel). Stripe will emit `customer.subscription.updated` which the webhook handles automatically.
