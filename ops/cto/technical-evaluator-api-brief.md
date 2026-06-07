# Technical Evaluator API Brief

**Product:** SZL Holdings DreamStack Platform  
**Document:** API Technical Evaluation Brief  
**Date:** 2026-04-16  
**Version:** Phase E — API Commercial Readiness  
**Audience:** CTOs, Engineering Leads, Integration Architects, Security Reviewers

---

## What Is the DreamStack API?

The DreamStack API is the unified backend for an enterprise AI platform that serves multiple intelligence domains — real estate, maritime, defense/cybersecurity, legal, AI operations, and executive command. It exposes a RESTful JSON API and GraphQL endpoint, backed by a PostgreSQL database, a durable job queue, and a multi-provider AI integration layer.

**Platform domains:**

| Domain | API Prefix | Description |
|---|---|---|
| Terra | `/api/terra` | Real estate intelligence, distress signals, CRM |
| Vessels | `/api/vessels` | Maritime tracking, voyage P&L, trading, insurance |
| Aegis | `/api/aegis` | Defense intelligence, SOC operations, cyber |
| Lyte | `/api/lyte` | E-commerce operations, billing, fulfilment |
| Alloy | `/api/alloy` | AI engine, chat, research, digests, voice |
| Holdings | `/api/holdings` | Fund ops, capital readiness, ownership |
| Command | `/api/command` | Unified executive command surface |

---

## Architecture Summary

| Concern | Decision | Rationale |
|---|---|---|
| Runtime | Node.js 22 / TypeScript | Type safety across 150+ routes |
| Framework | Express 5 | Stable, auditable middleware chain |
| Database | PostgreSQL + Drizzle ORM | Typed schema, migration-safe |
| Auth | Cookie sessions + Bearer + Internal token | Covers web, mobile, and service-to-service |
| Job queue | PostgreSQL-backed durable queue | Survives restarts, no external broker dependency |
| AI | OpenAI / Anthropic / Gemini (provider-agnostic) | Switchable via env config |
| Logging | Pino (structured JSON) | Parse-ready for ELK, Datadog, CloudWatch |
| Spec | OpenAPI 3.1.0 | Machine-readable contract for codegen |

---

## Security Posture

### Headers
- Helmet: CSP, HSTS (production), referrer policy, no-sniff, frame protection
- Permissions-Policy: camera, microphone, geolocation, payment all denied
- CORS: environment-aware; cross-origin credentials rejected without explicit allowlist in production

### Auth
- CSRF: double-submit cookie pattern; all mutation routes require `X-CSRF-Token`
- Session: HttpOnly, Secure, SameSite=Lax; 24h sliding refresh
- Timing-safe token comparison for internal token bypass
- `adminGuard` on `/api/admin/*`; tenant isolation via `tenantScope`

### Rate Limiting
- Global: 200 req / 15 min (per IP; health endpoints excluded)
- Auth: 5 req / 1 min per IP (POST only, fail-closed sliding window)
- Read: 100 req / 1 min per user (fail-open sliding window)
- Write: 60 req / 1 min per user (fail-closed sliding window)
- Public submissions (contact/demo): 5 req / 1 hour per IP
- AI and billing mutations additionally require idempotency keys

### No PII in Logs
- URL query strings stripped from log records
- Only opaque user IDs logged, never email or credentials
- Serializers explicitly limit what is captured per request/response

---

## Contract Confidence

| Signal | Status |
|---|---|
| OpenAPI 3.1.0 spec | ✅ Available at `/api/openapi` |
| Swagger UI | ✅ Available at `/api/docs` |
| Consistent error envelope | ✅ Single shape across all 150+ routes |
| Request ID on every response | ✅ `X-Correlation-Id` + `X-Request-Id` |
| API version negotiation | ✅ `X-Api-Version` header |
| Deprecation lifecycle | ✅ Sunset headers + deprecation notice |
| Idempotency on mutations | ✅ SHA-256 fingerprinted, LRU cached 24h |

---

## Health & Reliability Signals

```bash
# Liveness (Kubernetes probe)
GET /api/health/live
→ {"status":"ok"}  # always 200 if process is running

# Readiness (load balancer gate)
GET /api/health/ready   # or alias: GET /api/ready
→ {"status":"ready","checks":{"database":"connected"}}

# Full platform health (public)
GET /api/health
→ {
    "status": "healthy",
    "uptime": 86400,
    "services": {
      "database": {"status":"ok","latencyMs":3},
      "job_queue": {"status":"ok","depth":0},
      "auth": {"status":"ok"},
      "ai": {"status":"ok","mode":"live"}
    }
  }

# Build metadata (public)
GET /api/version
→ {"apiVersion":"2026-04-15","supportedApiVersions":["2025-01-01","2026-04-15"],...}
```

---

## Integration Patterns

### Pattern 1: Server-to-Server (Trusted Internal)

```bash
curl -H "X-Internal-Token: <ALLOY_INTERNAL_TOKEN>" \
     https://api.szlholdings.com/api/health/detailed
```

Use for infrastructure monitoring, data pipelines, migration tooling.

### Pattern 2: OAuth / Bearer (External API Client)

```bash
curl -H "Authorization: Bearer <token>" \
     -H "X-Api-Version: 2026-04-15" \
     -H "X-Correlation-Id: my-trace-id" \
     https://api.szlholdings.com/api/terra/properties
```

Standard pattern for third-party integrations and partner platforms.

### Pattern 3: Idempotent Mutations (Billing / AI)

```bash
curl -X POST \
     -H "Authorization: Bearer <token>" \
     -H "X-Idempotency-Key: $(uuidgen)" \
     -d '{"planId":"pro"}' \
     https://api.szlholdings.com/api/billing/checkout
```

Safe to retry — duplicate submissions return cached response with `X-Idempotency-Replayed: true`.

### Pattern 4: Webhook Consumer

```bash
# Register
POST /api/webhooks  { "url": "https://your.app/hook", "events": ["billing.*"] }

# Verify delivery (Node.js)
const sig = req.headers["x-signature"];
const expected = "sha256=" + hmac("sha256", secret).update(rawBody).digest("hex");
assert(sig === expected);
```

---

## Evaluation Checklist for Integrators

| Item | How to verify |
|---|---|
| API is live | `GET /api/health/live` → `200 {"status":"ok"}` |
| Version and deprecation status | `GET /api/version` |
| Full contract | `GET /api/openapi` or browse `/api/docs` |
| Error format | Any invalid request → envelope with `error`, `code`, `requestId` |
| Correlation tracing | Send `X-Correlation-Id: test-123` → confirm in response headers |
| Idempotency | POST billing checkout twice with same key → same response, `X-Idempotency-Replayed: true` |
| Rate limits | `429 RATE_LIMITED` with standard envelope after limit exceeded |
| Webhook delivery | Register endpoint, trigger event, verify `X-Signature` HMAC |
| CORS | Preflight `OPTIONS` returns configured allowed origins |

---

## Known Limitations & Roadmap Notes

| Item | Status | Notes |
|---|---|---|
| Zod validation on all public routes | Partial | High-traffic routes covered; remaining routes tracked |
| Persistent idempotency store (cross-restart) | In-memory LRU | Suitable for current scale; Redis upgrade path exists |
| Rate limit headers in response | Partial | Global limit headers present; per-route headers planned |
| Webhook delivery receipts dashboard | Planned | Track delivery status in UI |

---

## Contact & Further Reading

- Full readiness assessment: `ops/cto/api-commercial-readiness.md`
- Quickstart guide: `ops/cto/api-quickstart-final.md`
- Event & webhook catalog: `ops/cto/event-and-webhook-map.md`
- API standards reference: `ops/backend/api-standards.md`
- Error catalog: `ops/backend/error-catalog.md`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
