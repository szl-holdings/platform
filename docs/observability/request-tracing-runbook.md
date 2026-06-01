# Request Tracing Runbook

How to find a specific request across logs and Sentry when debugging a production issue.

---

## Key Identifiers

Every HTTP request through the API server carries two identifiers from the moment it enters the stack:

| Header / Field | Purpose |
|---|---|
| `X-Request-Id` | Unique per-request UUID, always freshly generated |
| `X-SZL-Correlation-ID` / `X-Correlation-Id` | Caller-supplied (or generated). Propagated across downstream service calls to tie a multi-hop workflow together |

Both are set as **response headers** and written into every structured log line for that request.

---

## Finding a Request in Logs

All API server logs are emitted as JSON to stdout. In production, pipe them to your log aggregator (Datadog, CloudWatch, etc.) or grep the workflow output directly.

### By Request ID

```bash
# In raw stdout / log file
grep '"requestId":"<UUID>"' /var/log/api-server.log

# Or in jq
cat /var/log/api-server.log | jq 'select(.requestId == "<UUID>")'
```

### By Correlation ID (multi-hop trace)

```bash
grep '"correlationId":"<UUID>"' /var/log/api-server.log | jq .
```

### Typical log line fields

```json
{
  "level": 30,
  "time": "2026-04-27T10:23:41.123Z",
  "service": "szl-api-server",
  "version": "1.2.3",
  "env": "production",
  "req": {
    "id": "<requestId>",
    "method": "POST",
    "url": "/api/decisions",
    "requestId": "<requestId>",
    "correlationId": "<correlationId>"
  },
  "res": {
    "statusCode": 500
  },
  "responseTime": 142,
  "msg": "request completed"
}
```

Key fields to look for:

- `req.requestId` — the unique per-request ID
- `req.correlationId` — the correlation ID (spans service calls)
- `responseTime` — duration in milliseconds
- `res.statusCode` — HTTP status
- `msg` — human-readable summary; errors include `err.message` and `err.stack`

---

## Finding the Error in Sentry

All 5xx errors are automatically sent to Sentry via `Sentry.setupExpressErrorHandler(app)`, which is registered as an Express error-handling middleware in `src/app.ts` (before the final global error handler). Any unhandled error that propagates up to Express is captured automatically.

For errors that are **caught and handled** inside a route without re-throwing (e.g. a graceful fallback that returns 200 or a structured 4xx), use `captureServerException` explicitly so the exception still surfaces in Sentry:

```typescript
import { captureServerException } from '../lib/sentry';

try {
  await riskyOperation();
} catch (err) {
  captureServerException(err, { route: 'POST /api/decisions', orgId: req.orgId });
  res.status(500).json({ error: 'Internal Server Error' });
}
```

### Searching Sentry by Request ID

In the Sentry dashboard:

1. Go to **Issues → Search**
2. Search by `X-Request-Id` — this header is **not** redacted and appears in the event's request headers under the `Request` section.
   - Note: `X-SZL-Correlation-ID` is redacted in Sentry events by the `beforeSend` hook (see Scrubbed Fields below). Use `X-Request-Id` for Sentry lookups; use `correlationId` for log searches only.
3. Alternatively search by the route path: `url:/api/decisions`

### Matching a log line to a Sentry event

Both use the same timestamp window. To correlate:

1. Note the timestamp from the log line (`time` field, ISO 8601).
2. In Sentry, filter events to ±30 seconds around that timestamp.
3. Match on URL path and status code.

---

## Propagating the Request ID to Downstream Calls

When the API server calls another internal service, attach the correlation header:

```typescript
import { getRequestContext } from '../lib/request-context';

const ctx = getRequestContext();
const headers = {
  'X-SZL-Correlation-ID': ctx?.correlationId ?? '',
  'X-Request-Id': ctx?.requestId ?? '',
};
```

The `correlationMiddleware` stores both IDs in an AsyncLocalStorage context (`runWithRequestContext`) so they are accessible anywhere in the request lifecycle without threading them through every function signature.

---

## Scrubbed / Redacted Fields

The following are **never** sent to Sentry or written to logs in plain text:

**Request headers:**
`authorization`, `cookie`, `x-internal-token`, `x-api-key`, `x-csrf-token`, `x-szl-correlation-id`, `set-cookie`, `proxy-authorization`

**Request body fields (recursive):**
`password`, `currentPassword`, `newPassword`, `token`, `accessToken`, `access_token`, `refreshToken`, `refresh_token`, `idToken`, `id_token`, `apiKey`, `api_key`, `secret`, `clientSecret`, `client_secret`, `sessionToken`, `session_token`, `privateKey`, `private_key`, `webhookSecret`, `webhook_secret`, `ssn`, `creditCard`, `credit_card`, `cardNumber`, `card_number`, `cvv`, `pin`

These are replaced with `[REDACTED]` in Sentry (via `beforeSend`) and in pino logs (via the `redact` list in `lib/logger.ts`).

---

## Deliberately Testing the Error Pipeline

To verify that an error appears end-to-end in Sentry:

```bash
# Trigger a test 500 from a route that calls captureServerException
curl -X POST https://<host>/api/... \
  -H "Content-Type: application/json" \
  -d '{"__test_throw": true}'
```

Then:
1. Check the API server stdout for a log line with `"level":"error"` and `"statusCode":500`.
2. Open Sentry → Issues and confirm the event appears within ~30 seconds.
3. Verify the event **does not** contain any `authorization`, `cookie`, or `password` values.

---

## Quick Reference

| I want to find… | Where to look |
|---|---|
| All logs for a specific request | `grep '"requestId":"<UUID>"'` on stdout |
| All logs for a multi-service workflow | `grep '"correlationId":"<UUID>"'` on stdout |
| The Sentry event for a 500 | Sentry Issues → filter by URL + timestamp |
| Whether a secret was leaked | Check Sentry event request headers/body for `[REDACTED]` |
| Response time for a request | `responseTime` field in the JSON log line (milliseconds) |
