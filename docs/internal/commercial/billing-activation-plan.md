# Billing Activation Plan — Lyte Pilot Commercial Flow

**Status**: Infrastructure complete, pending Stripe credentials  
**Primary Product**: Lyte — AIOps Command  
**Date**: April 2026

---

## Overview

This document describes the canonical commercial flow for the Lyte pilot contract path. The system is built to collect revenue as soon as Stripe credentials are configured.

---

## Stripe Configuration

### Required Secrets

Set these environment variables/secrets in the deployment environment:

| Secret | Description |
|--------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API key (`sk_live_...` for production, `sk_test_...` for testing) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret from Stripe dashboard |
| `STRIPE_PRICE_LYTE_PILOT_MONTHLY` | Stripe Price ID for Lyte Pilot — Monthly ($2,500/month) |
| `STRIPE_PRICE_LYTE_PILOT_ANNUAL` | Stripe Price ID for Lyte Pilot — Annual ($25,000/year) |
| `STRIPE_PRICE_LYTE_GROWTH_MONTHLY` | Stripe Price ID for Lyte Growth — Monthly ($5,000/month) |
| `STRIPE_PRICE_LYTE_ENTERPRISE_ANNUAL` | Stripe Price ID for Lyte Enterprise — Annual ($60,000/year) |

### Stripe Product Setup (one-time)

1. Log in to Stripe Dashboard → Products
2. Create product: "Lyte Pilot"
   - Monthly price: $2,500/month (recurring)
   - Annual price: $25,000/year (recurring)
3. Create product: "Lyte Growth"
   - Monthly price: $5,000/month (recurring)
4. Create product: "Lyte Enterprise"
   - Annual price: $60,000/year (recurring)
5. Copy each Price ID and set corresponding env vars above
6. Configure webhook endpoint: `https://your-domain.com/api/billing/webhooks`
   - Events to enable: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`, `payment_intent.succeeded`
7. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Verify Configuration

```
GET /api/billing/stripe-config
```

Returns connection status, mode (live/test/mock), and which price IDs are configured.

---

## Commercial Flow — End-to-End

### 1. Customer Creation

**API**: `POST /api/lyte/billing/pilot-checkout`

```json
{
  "planId": "lyte-pilot-monthly",
  "email": "customer@company.com",
  "companyName": "Acme Corp",
  "contactName": "Jane Smith",
  "successUrl": "https://app.lyte.ai/welcome",
  "cancelUrl": "https://app.lyte.ai/pricing"
}
```

This endpoint:
- Looks up or creates a Stripe customer
- Logs a `pilot.created` revenue event
- Creates a Stripe Checkout session
- Returns `{ sessionId, url }` to redirect the customer

### 2. Checkout Session

Customer is redirected to Stripe's hosted checkout page. Payment is collected securely via Stripe.

### 3. Webhook Processing

On `checkout.session.completed`:
- Subscription created in local DB (`subscriptions` table)
- `subscription.activated` revenue event logged

On `invoice.paid`:
- Invoice recorded in DB
- `invoice.paid` revenue event logged (idempotent)

On `invoice.payment_failed`:
- Subscription marked `past_due`
- `invoice.payment_failed` revenue event logged (idempotent)
- **Action required**: contact customer within 24 hours

### 4. Customer Portal

Customers can manage their subscription via:

```
POST /api/billing/customer-portal
{ "customerId": "cus_...", "returnUrl": "https://app.lyte.ai/settings" }
```

(Requires `pilot_customer_portal_enabled` feature flag to be enabled)

### 5. Internal Invoice (for enterprise pilots)

For manual enterprise deals:

```
POST /api/lyte/billing/create-invoice
{
  "email": "cfo@enterprise.com",
  "companyName": "Enterprise Corp",
  "lineItems": [
    { "description": "Lyte Enterprise — 12-month pilot", "amount": 6000000 }
  ],
  "notes": "Net-30 payment terms"
}
```

---

## Revenue Monitoring

### Pilot Metrics

```
GET /api/lyte/billing/pilot-metrics
```

Returns: total pilots, active, trialing, past due, recent revenue events.

### Revenue Events Log

```
GET /api/lyte/billing/revenue-events?limit=50
```

All revenue events for the Lyte product, ordered by recency.

### Revenue Analytics

```
GET /api/billing/revenue-analytics
```

Returns MRR, ARR, subscription counts, churn data.

### Billing Admin UI

Navigate to: `[Lyte Command Center URL]/admin/billing`

Requires role: admin, super_admin, or ops.

---

## Failed Payment Handling

When a payment fails:

1. Stripe fires `invoice.payment_failed` webhook
2. Subscription status set to `past_due` in DB
3. `invoice.payment_failed` revenue event logged
4. Ops team should:
   - Email customer immediately (Stripe Smart Retries will retry automatically)
   - Follow up by phone if not resolved in 3 days
   - Offer to update payment method via customer portal
   - Cancel after 4 failed attempts if no response

Stripe Smart Retries retries over 8 days by default. Configure this in your Stripe Dashboard → Settings → Subscriptions.

---

## Policy Links

All customer-facing transactions link to:
- **Terms of Service**: https://lyte.ai/terms
- **Privacy Policy**: https://lyte.ai/privacy
- **Refund Policy**: https://lyte.ai/refunds

Refund policy: Full refund within 14 days of first payment for annual plans. No refunds on monthly plans after first billing cycle. Prorated refunds at discretion for enterprise contracts.

---

## Activation Checklist

- [ ] Set `STRIPE_SECRET_KEY` (use test key first: `sk_test_...`)
- [ ] Create Stripe products and prices
- [ ] Set all `STRIPE_PRICE_LYTE_*` env vars
- [ ] Configure webhook endpoint in Stripe and set `STRIPE_WEBHOOK_SECRET`
- [ ] Test end-to-end with Stripe test card `4242 4242 4242 4242`
- [ ] Verify revenue events appear in `/api/lyte/billing/revenue-events`
- [ ] Enable `pilot_customer_portal_enabled` feature flag for portal access
- [ ] Switch to live Stripe key (`sk_live_...`) when ready for production
- [ ] Run `POST /api/billing/sync-plans` to sync Stripe products to local DB
- [ ] Conduct first real pilot contract using the checkout flow

---

## Architecture Notes

- Idempotency: All webhook-triggered revenue events use `idempotencyKey` to prevent double-counting
- All revenue events stored in `revenue_events` table with product tag for multi-product reporting
- Subscriptions tracked in `subscriptions` table linked to `organizations`
- Invoices tracked in `invoices` table linked to subscriptions
- Stripe mode auto-detected from `STRIPE_SECRET_KEY` prefix (`sk_live_` vs `sk_test_`)
- In demo/mock mode (no key set), all endpoints return safe demo responses
