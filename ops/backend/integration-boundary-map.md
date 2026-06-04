# Integration Boundary Map

Generated: 2026-04-16

## Overview

This document maps all service integration boundaries across the SZL Holdings platform. Each boundary defines ownership, protocol, authentication method, and failure behavior.

## Platform Services

### Internal Services (same process / monorepo)

| Service Package | Owner | Protocol | Notes |
|-----------------|-------|----------|-------|
| `@szl-holdings/db` | Platform | Drizzle ORM / PostgreSQL | Primary data store |
| `@szl-holdings/forge-runtime` | Platform | In-process job queue | Durable job scheduling |
| `@szl-holdings/observability` | Platform | In-process telemetry | Server-side metrics/traces |
| `@szl-holdings/services` | Platform | In-process service registry | Health matrix, live config |
| `@szl-holdings/shared-ui` | Platform | React components | Frontend only |
| `@szl-holdings/analytics` | Platform | In-process events | Client analytics |
| `@szl-holdings/prism-bus` | Platform | In-process pub/sub | Real-time event bus |

### External Dependencies (API calls)

| Service | Protocol | Auth | Failure Mode |
|---------|----------|------|--------------|
| OpenAI | HTTPS REST | Bearer (AI Integrations proxy) | Fallback to degraded mode |
| Anthropic | HTTPS REST | Bearer (AI Integrations proxy) | Fallback to OpenAI |
| Gemini | HTTPS REST | Bearer (AI Integrations proxy) | Fallback to OpenAI |
| SendGrid | HTTPS REST | API key (env secret) | Queue + retry |
| Twilio | HTTPS REST | SID/token (env secret) | Log + silent fail |
| Stripe | HTTPS REST | Secret key (env secret) | Hard fail, surface error |
| GitHub | HTTPS REST | OAuth token | Graceful degradation |
| Replit Object Storage | HTTPS S3-compat | Access key (env secret) | Fallback to local FS |

## Cross-Artifact Boundaries

### Frontend → API Server

```
Frontend App  →  /api/<route>
Protocol: HTTPS (proxied in dev, direct TLS in prod)
Auth: Cookie session (SameSite=Lax) or Bearer token
CORS: Configured per CORS_ORIGINS env var
```

### Service-to-Service (Internal Token)

```
Scheduler / Background Jobs  →  /api/<route>
Header: X-Internal-Token: <ALLOY_INTERNAL_TOKEN>
Role granted: super_admin
Used by: job-queue.ts, agent-scheduler.ts, cross-service calls
```

### Real-time (WebSocket / SSE)

```
Frontend  →  WebSocket /ws
            SSE /api/sse/<channel>
Auth: Session cookie validated on upgrade
Channels: prism-bus pubsub topics
```

### Push Notifications (Mobile → Push Infrastructure)

```
CORTEX Mobile App  →  Expo Push Notifications  →  APNs / FCM
Registration: POST /api/push-tokens
Delivery: expo-server-sdk in background job
Auth: Bearer token (mobile client)
```

## Lyte-to-Domain Handoffs

Lyte cross-domain signals are aggregated from domain APIs via the PRISM bus:

```
Aegis API       ──┐
Vessels API     ──┤
Terra API       ──┤  →  PRISM Bus  →  Lyte Signals Feed
PRISM Counsel   ──┤
Carlota Jo      ──┘
```

Each domain publishes events to the PRISM bus. Lyte subscribes to:
- `domain.signal.new`
- `domain.incident.created`
- `domain.action.required`
- `domain.approval.pending`

## Data Residency Boundaries

| Data Class | Storage | Encryption | Retention |
|------------|---------|------------|-----------|
| PII (user emails, names) | PostgreSQL | AES-256 at rest | Per GDPR policy |
| API keys / secrets | Environment vars | Platform-managed | Never stored in DB |
| AI model outputs | PostgreSQL `ai_outputs` | At rest | 90 days default |
| Audit logs | PostgreSQL `audit_log` | At rest | 2 years |
| Object storage (files) | Replit Object Storage | TLS in transit | Per policy |
| Session data | Cookie (HttpOnly) | TLS in transit | 24h TTL |

## Failure Propagation Rules

1. **AI Provider failure** → Surface `DegradedModeBanner` in UI, log `AI_PROVIDER_ERROR`, continue with cached/mock response
2. **Database failure** → API returns `503 SERVICE_UNAVAILABLE`, health probe returns 503
3. **Job queue backpressure** → Warn in health endpoint, new jobs still accepted
4. **External webhook failure** → Queue + exponential backoff (max 5 retries), then dead-letter
5. **CORS rejection** → Return 403 with CORS headers, log origin
6. **Rate limit hit** → Return 429 with `Retry-After` header

## Dependency Health Checks

Health check order at startup:

1. Database connectivity (`SELECT 1`)
2. Job queue initialization
3. Scheduled job registration
4. Demo seed (dev only)
5. Ingestion framework init
6. Startup validation matrix
