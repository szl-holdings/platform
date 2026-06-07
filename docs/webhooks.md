# Inbound Webhook Security Reference

All inbound webhooks on the SZL Holdings API server are authenticated using
provider-specific signature schemes.  This document is the authoritative
inventory of every inbound webhook endpoint, its provider, the environment
variable that holds its shared secret, and the verification approach used.

---

## Quick-reference table

| Endpoint | Provider | Secret env var | Scheme | 401 on failure? |
|---|---|---|---|---|
| `POST /email-webhooks/sendgrid` | SendGrid | `SENDGRID_WEBHOOK_SECRET` | Timing-safe Authorization header comparison | ✓ |
| `POST /email-webhooks/resend` | Resend (Svix) | `RESEND_WEBHOOK_SECRET` | Svix HMAC-SHA256 | ✓ |
| `POST /billing/webhooks` | Stripe | `STRIPE_WEBHOOK_SECRET` | Stripe SDK `constructEvent` | ✓ |
| `POST /webhooks/plaid` | Plaid | `PLAID_WEBHOOK_SECRET` | HMAC-SHA256, `plaid-verification` header | ✓ |
| `POST /webhooks/coinbase` | Coinbase Commerce | `COINBASE_COMMERCE_WEBHOOK_SECRET` | HMAC-SHA256, `x-cc-webhook-signature` header | ✓ |
| `POST /lyte/billing/webhooks/failed-payment` | Internal | `LYTE_BILLING_WEBHOOK_SECRET` | HMAC-SHA256, `x-lyte-signature` header | ✓ |
| `POST /sentra/siem/ingest/:connectionId` | Generic SIEM | Per-connection `hmacSecret` | HMAC-SHA256, configurable header | ✓ (when configured) |
| `POST /webhooks/inbound/siem/splunk` | Splunk HEC | `SIEM_INGEST_TOKEN` | Bearer token | ✓ (when configured) |
| `POST /webhooks/inbound/siem/sentinel` | Microsoft Sentinel | `SIEM_INGEST_TOKEN` | Bearer token | ✓ (when configured) |
| `POST /webhooks/inbound/siem/cef` | CEF syslog | `SIEM_INGEST_TOKEN` | Bearer token | ✓ (when configured) |
| `POST /webhooks/inbound/siem/syslog` | Syslog | `SIEM_INGEST_TOKEN` | Bearer token | ✓ (when configured) |
| `POST /webhooks/inbound/siem/events` | Generic SIEM | `SIEM_INGEST_TOKEN` | Bearer token | ✓ (when configured) |
| `POST /webhooks/inbound/jira` | Jira | `JIRA_WEBHOOK_SECRET` | GitHub-style `X-Hub-Signature-256` (delegated to SDK) | ✓ |
| `POST /webhooks/inbound/pagerduty` | PagerDuty | `PAGERDUTY_WEBHOOK_SECRET` | `X-PagerDuty-Signature` (delegated to SDK) | ✓ |
| `POST /webhooks/inbound/slack/events` | Slack | `SLACK_SIGNING_SECRET` | Slack signing-secret HMAC-SHA256 | ✓ |
| `POST /webhooks/inbound/slack/interactions` | Slack | `SLACK_SIGNING_SECRET` | Slack signing-secret HMAC-SHA256 | ✓ |
| `POST /webhooks/inbound/slack/commands` | Slack | `SLACK_SIGNING_SECRET` | Slack signing-secret HMAC-SHA256 | ✓ |
| `POST /webhooks/inbound/salesforce/cdc` | Salesforce | `SALESFORCE_WEBHOOK_SECRET` | `X-Salesforce-Signature` (delegated to SDK) | ✓ |
| `POST /omnia/adoption/beacon` | Internal | _(none — intentionally public)_ | No signature (internal shell telemetry) | — |

---

## Per-provider details

### SendGrid (`/email-webhooks/sendgrid`)

- **Secret env var:** `SENDGRID_WEBHOOK_SECRET`
- **Scheme:** SendGrid V2 sends a static shared secret in the `Authorization` header.
  The implementation uses `timingSafeEqual` to prevent timing attacks.
- **Source:** `artifacts/api-server/src/routes/email-webhooks.ts` → `validateSendGridSignature`

### Resend (`/email-webhooks/resend`)

- **Secret env var:** `RESEND_WEBHOOK_SECRET`
- **Scheme:** Svix HMAC-SHA256.  The signed content is `{svix-id}.{svix-timestamp}.{raw-body}`.
  The key is base64-decoded from the `whsec_` prefixed secret.
- **Source:** `artifacts/api-server/src/routes/email-webhooks.ts` → `validateResendSignature`

### Stripe (`/billing/webhooks`)

- **Secret env var:** `STRIPE_WEBHOOK_SECRET`
- **Scheme:** Stripe's standard `Stripe-Signature: t=<timestamp>,v1=<hex>` format.
  Verification is performed by the official Stripe SDK (`stripe.webhooks.constructEvent`).
  Events older than 300 seconds are rejected. Returns 401 on invalid signature.
- **Source:** `artifacts/api-server/src/routes/billing.ts`

### Plaid (`/webhooks/plaid`)

- **Secret env var:** `PLAID_WEBHOOK_SECRET`
- **Scheme:** HMAC-SHA256; the signature is provided in the `Plaid-Verification` header as a plain hex digest.
  In demo mode (no `PLAID_CLIENT_ID` set), verification is skipped and requests are allowed through.
  When Plaid is configured live but `PLAID_WEBHOOK_SECRET` is absent, the request is rejected with 401.
- **Source:** `artifacts/api-server/src/lib/plaid-adapter.ts` → `verifyPlaidWebhookSignature`

### Coinbase Commerce (`/webhooks/coinbase`)

- **Secret env var:** `COINBASE_COMMERCE_WEBHOOK_SECRET`
- **Scheme:** HMAC-SHA256; the signature is provided in the `X-CC-Webhook-Signature` header.
  In demo mode (no `COINBASE_COMMERCE_API_KEY`), verification is skipped.
  When configured live but the secret is missing, the endpoint returns 503.
- **Source:** `artifacts/api-server/src/lib/coinbase-adapter.ts` → `verifyCoinbaseWebhookSignature`

### Lyte failed-payment (`/lyte/billing/webhooks/failed-payment`)

- **Secret env var:** `LYTE_BILLING_WEBHOOK_SECRET`
- **Scheme:** HMAC-SHA256 via the shared `webhookSignatureMiddleware`; signature in `x-lyte-signature` header.
  `allowWhenUnconfigured: false` — if the env var is absent the request is rejected with 401
  (fails closed).  Set `LYTE_BILLING_WEBHOOK_SECRET` in the production secrets store to enable
  the endpoint.
- **Source:** `artifacts/api-server/src/routes/lyte-billing.ts`

### SIEM ingest via connection (`/sentra/siem/ingest/:connectionId`)

- **Secret:** Per-connection `hmacSecret` stored in the SIEM connection config (not a global env var).
- **Scheme:** HMAC-SHA256; the signature header name is also per-connection (default: `x-signature-sha256`).
  Connections that do not have an `hmacSecret` are unauthenticated — this is an operational risk
  tracked in follow-up #4049.
- **Source:** `artifacts/api-server/src/routes/sentra-siem.ts`, `artifacts/api-server/src/siem/adapters/generic-webhook.ts`

### SIEM bulk ingest (`/webhooks/inbound/siem/*`)

Five endpoints share the same `verifySiemToken` middleware:
- `POST /webhooks/inbound/siem/splunk` — Splunk HEC format
- `POST /webhooks/inbound/siem/sentinel` — Microsoft Sentinel alert format
- `POST /webhooks/inbound/siem/cef` — Common Event Format (CEF)
- `POST /webhooks/inbound/siem/syslog` — Syslog format
- `POST /webhooks/inbound/siem/events` — Generic JSON array

- **Secret env var:** `SIEM_INGEST_TOKEN`
- **Scheme:** Bearer token in the `Authorization` header.  When the env var is absent,
  the check is skipped (open ingest, for dev / air-gapped setups without external provider auth).
- **Source:** `artifacts/api-server/src/routes/external-integrations.ts` → `verifySiemToken`

### Jira (`/webhooks/inbound/jira`)

- **Secret env var:** `JIRA_WEBHOOK_SECRET`
- **Scheme:** GitHub-style `X-Hub-Signature-256: sha256=<hex>`.  When the env var is set and the
  signature header is absent, the request is rejected with 401.  Cryptographic verification is
  delegated to `services.jira.handleWebhookEvent`.
- **Source:** `artifacts/api-server/src/routes/external-integrations.ts`

### PagerDuty (`/webhooks/inbound/pagerduty`)

- **Secret env var:** `PAGERDUTY_WEBHOOK_SECRET`
- **Scheme:** `X-PagerDuty-Signature` header.  When the env var is set and the header is absent,
  the request is rejected with 401.  Cryptographic verification is delegated to
  `services.pagerduty.handleWebhookEvent`.
- **Source:** `artifacts/api-server/src/routes/external-integrations.ts`

### Slack (`/webhooks/inbound/slack/*`)

Three endpoints (`/events`, `/interactions`, `/commands`) share the same verification:

- **Secret env var:** `SLACK_SIGNING_SECRET`
- **Scheme:** Slack signing-secret HMAC-SHA256 with timestamp replay protection.
  Headers: `X-Slack-Signature: v0=<hex>`, `X-Slack-Request-Timestamp: <unix-seconds>`.
  When the env var is not set, the check is skipped (development mode).
- **Source:** `artifacts/api-server/src/routes/external-integrations.ts`

### Salesforce CDC (`/webhooks/inbound/salesforce/cdc`)

- **Secret env var:** `SALESFORCE_WEBHOOK_SECRET`
- **Scheme:** `X-Salesforce-Signature` (or `X-SFDC-Signature`) header.  When the env var is set
  and the header is absent, the request is rejected with 401.  Cryptographic verification is
  delegated to `services.salesforce.processCdcEvent`.
- **Source:** `artifacts/api-server/src/routes/external-integrations.ts`

### Omnia adoption beacon (`/omnia/adoption/beacon` → registered as `/adoption/beacon`)

- **No secret required.**  This endpoint receives internal shell adoption telemetry from
  SZL platform apps.  The data is not security-sensitive (it reports which features are wired
  to which apps).  There is no external attacker motivation to forge these events.

---

## Shared helper library

The file `artifacts/api-server/src/middlewares/webhook-signature.ts` provides:

| Export | Purpose |
|---|---|
| `verifyHmacSha256(payload, secret, signature)` | Timing-safe HMAC-SHA256 comparison; signature may be `sha256=<hex>` or plain `<hex>` |
| `verifyGitHubStyle(rawBody, secret, signature)` | GitHub-style `sha256=<hex>` in `X-Hub-Signature-256` |
| `verifyStripeStyle(rawBody, secret, signature, toleranceSecs?)` | Stripe-style `t=<ts>,v1=<hex>` with timestamp tolerance |
| `webhookSignatureMiddleware(options)` | Express middleware factory — returns 401 on bad/missing signature |

Use `webhookSignatureMiddleware` when adding a new webhook endpoint.  Prefer the Stripe or GitHub styles
when the provider natively uses those formats.

---

## Adding a new inbound webhook

1. Implement the route handler and add `webhookSignatureMiddleware` (or a provider-specific equivalent).
2. Add an entry to `INBOUND_WEBHOOK_REGISTRY` in
   `artifacts/api-server/src/__tests__/webhook-signature-coverage.test.ts` with the **exact** route path.
   The CI test will fail if the detected path is not in the registry.
3. Document it in this file.
4. Set the secret env var in the production secrets store (see `docs/SECRETS_POLICY.md`).

---

## Scope

- **In scope:** All inbound webhook endpoints (external providers pushing events to the API server).
- **Out of scope:** Outbound webhooks (the platform pushing events to customer endpoints — those are
  signed at delivery time in `lib/webhooks.ts`).  Replay protection beyond timestamp tolerance is
  also out of scope here; idempotency keys are tracked in follow-up #4048.

## Known exceptions / follow-ups

| Route | Exception | Follow-up |
|---|---|---|
| `/lyte/billing/webhooks/failed-payment` | Now fails closed (401) when `LYTE_BILLING_WEBHOOK_SECRET` unset — no exception | — |
| `/sentra/siem/ingest/:connectionId` | Connections without `hmacSecret` accept unauthenticated payloads | #4049 — add UI warning |
| `/omnia/adoption/beacon` | Intentionally public; internal telemetry only | No action needed |
| All SIEM bulk ingest routes | `SIEM_INGEST_TOKEN` check skipped when env var absent | Set env var in production |
