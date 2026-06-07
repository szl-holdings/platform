# Event & Webhook Map

**Generated:** 2026-04-16  
**Scope:** DreamStack Platform API — `artifacts/api-server`

---

## Overview

This document maps the platform's event-worthy workflows — operations that produce state changes significant enough to notify external systems, trigger downstream automations, or drive audit trails. The API supports outbound webhooks via `POST /api/webhooks` registration.

---

## Webhook Infrastructure

### Registration

```bash
POST /api/webhooks
Authorization: Bearer <token>
Content-Type: application/json
X-Idempotency-Key: <unique-key>

{
  "url": "https://your-endpoint.com/hook",
  "events": ["billing.subscription.created", "ai.job.completed"],
  "secret": "your-signing-secret"
}
```

### Delivery Format

```http
POST https://your-endpoint.com/hook
Content-Type: application/json
X-Event-Type: billing.subscription.created
X-Correlation-Id: uuid
X-Signature: sha256=<hmac-sha256-hex>
X-Delivery-Timestamp: ISO-8601

{
  "event": "billing.subscription.created",
  "id": "evt_...",
  "timestamp": "2026-04-16T00:00:00Z",
  "data": { ... }
}
```

### Signature Verification

```javascript
import { createHmac } from "crypto";

function verifySignature(rawBody, signature, secret) {
  const expected = "sha256=" + createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}
```

### Retry Policy
- Up to 3 retries on non-2xx responses
- Exponential backoff: 10s, 60s, 300s
- Failures logged to audit trail

---

## Event Catalog

### 1. Auth & User Lifecycle

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `auth.user.registered` | New user registration | — | Triggers welcome email via Alloy |
| `auth.user.login` | Successful login | — | Rate-limited per user |
| `auth.user.logout` | Session invalidation | — | |
| `auth.password.reset_requested` | Password reset flow initiated | — | PII-safe: user ID only in payload |
| `auth.session.expired` | 24h session TTL hit | — | |

### 2. Billing & Subscriptions

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `billing.subscription.created` | New subscription checkout | Required | High-value; idempotency enforced at `/api/billing/checkout` |
| `billing.subscription.updated` | Plan upgrade/downgrade | Required | |
| `billing.subscription.cancelled` | Cancellation confirmed | Required | |
| `billing.invoice.paid` | Payment succeeded | — | Downstream: unlock feature flags |
| `billing.invoice.failed` | Payment declined | — | Triggers dunning workflow |
| `billing.terra.subscription.created` | Terra domain pack purchased | Required | |

### 3. AI / Alloy Engine

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `ai.job.queued` | AI task enqueued in durable queue | — | |
| `ai.job.completed` | AI task finishes successfully | — | Payload includes result summary |
| `ai.job.failed` | AI task max-retried | — | Payload includes error context |
| `ai.tool.executed` | AI tool call resolved | Required | `/api/ai/tools/execute` |
| `ai.research.completed` | Deep research request resolved | Optional | `/api/alloy/research` |
| `ai.content.filtered` | AI output blocked by safety filter | — | |

### 4. Documents & Workflows

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `documents.created` | New document saved | Optional | |
| `documents.updated` | Document revision committed | Optional | |
| `documents.signed` | Document signed via proof-chain | — | Immutable audit record created |
| `proof_chain.record_added` | Cryptographic audit record appended | — | Immutable; fires on sign/approve actions |

### 5. Approval Workflows

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `approvals.requested` | Approval workflow initiated | Optional | |
| `approvals.approved` | Approver signs off | — | |
| `approvals.rejected` | Approver declines | — | |
| `approvals.expired` | Approval window closed without action | — | |

### 6. Alloy Communication

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `alloy.digest.generated` | Daily/weekly AI briefing created | — | |
| `alloy.channel.message_sent` | Message dispatched via channel | Optional | |
| `alloy.email.sent` | Email delivered via Alloy | Optional | |
| `alloy.voice.call_completed` | AI voice call resolved | — | |

### 7. Terra (Real Estate Intelligence)

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `terra.property.created` | Property record added | Optional | |
| `terra.property.updated` | Property data refreshed | Optional | |
| `terra.distress.alert` | Distressed asset signal detected | — | High-priority; triggers CRM follow-up |
| `terra.broker.matched` | Broker-property match identified | — | |
| `terra.crm.contact_created` | New CRM contact added | Optional | |

### 8. Vessels (Maritime Intelligence)

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `vessels.tracking.position_updated` | AIS position received | — | High-frequency; batch-friendly |
| `vessels.voyage.created` | New voyage record | Optional | |
| `vessels.voyage.completed` | Voyage arrived at destination | — | |
| `vessels.trading.order_placed` | Trade order submitted | Required | |
| `vessels.insurance.claim_filed` | Insurance claim initiated | Required | |

### 9. Aegis (Defense & Cybersecurity)

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `aegis.incident.created` | Security incident logged | — | |
| `aegis.incident.resolved` | Incident closed | — | |
| `aegis.alert.triggered` | SOC alert fired | — | High-priority |
| `aegis.vulnerability.detected` | CVE scan finds new finding | — | |
| `aegis.compliance.violation` | Compliance check fails | — | |

### 10. Legal & Compliance Events

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `legal.matter.created` | New legal matter opened | Optional | |
| `legal.document.filed` | Court document submitted | Required | |
| `legal.deadline.approaching` | Court deadline within 48h | — | Automated calendar alert |
| `legal.review.completed` | Document review finished | — | |

### 11. Governance & Compliance

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `governance.policy.created` | New governance policy published | Optional | |
| `governance.policy.violated` | Policy breach detected | — | |
| `audit_chain.record_appended` | Immutable audit entry written | — | Every state-changing action |

### 12. Tenant & Org Management

| Event | Trigger | Idempotency | Notes |
|---|---|---|---|
| `tenant.provisioned` | New tenant workspace created | Required | |
| `tenant.deprovisioned` | Tenant workspace deleted | — | |
| `org.invitation.sent` | Member invite dispatched | Optional | |
| `org.invitation.accepted` | Invitee joined org | — | |
| `org.member.removed` | Member removed from org | — | |

---

## Event Filtering

When registering a webhook, specify an array of event types to receive:

```json
{
  "events": ["billing.*", "ai.job.*", "terra.distress.alert"]
}
```

Wildcard `*` scopes to all events in a namespace. Omit `events` to receive all events.

---

## Idempotency Notes for Event Consumers

- Each event carries a unique `id` (`evt_...`)
- Consumers should deduplicate on `id` to handle retry deliveries
- Retries carry the original `id` — not a new one

---

## Priority Classification

| Priority | Events | Recommended Action |
|---|---|---|
| Critical | `aegis.alert.triggered`, `billing.invoice.failed`, `legal.deadline.approaching` | Alert on-call immediately |
| High | `ai.job.failed`, `billing.subscription.cancelled`, `governance.policy.violated` | Queue for review within 1h |
| Normal | All other events | Standard processing |
