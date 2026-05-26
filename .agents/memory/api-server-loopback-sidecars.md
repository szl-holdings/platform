---
name: api-server loopback sidecars
description: How sidecar POSTs into the api-server actually get authorized — three independent gates must each be satisfied.
---

A POST from a local sidecar process to `api-server` (e.g. `/api/sentra/detectors/sidecar-register`) passes through THREE independent gates, and each one rejects with a different error. Fixing only one leaves the next still rejecting, so failures cascade across restarts.

1. **CSRF middleware** (`artifacts/api-server/src/middlewares/csrf.ts`) — rejects with `403 CSRF_TOKEN_MISSING`. Fix: add the exact route path to `EXEMPT_PATHS`.
2. **globalAuthEnforcer** (`artifacts/api-server/src/middlewares/global-auth-enforcer.ts`) — rejects with `401 UNAUTHORIZED "This endpoint requires a valid session"`. The route handler's own `checkSidecarSecret` runs LATER, so the shared-secret check is never reached. Fix: add a bypass function that matches POST + exact path + loopback peer (use `req.socket.remoteAddress`, NOT `req.ip`, which is X-Forwarded-For-derived and spoofable under `trust proxy`), then wire it into the `globalAuthEnforcer` cascade alongside `isSentraSiemIngest` et al. Off-host deploys should set an `x-internal-token` instead (handled by `isValidInternalToken`).
3. **Route handler** (`checkSidecarSecret` / equivalent) — validates the shared-secret header. This is the only gate that authenticates the actual sidecar identity; the first two just make sure the request reaches it.

**Why:** the auth model is defense-in-depth — globalAuthEnforcer assumes every `/api/*` request has a session unless explicitly bypassed; CSRF assumes every state-changing request has a token unless explicitly exempt. The route handler can't override either because it runs after both.

**How to apply:** whenever adding a new server-to-server POST endpoint that must be reachable before any user logs in, you need ALL THREE: CSRF exempt + globalAuthEnforcer loopback bypass + route-level secret check. Missing any one of them produces a different rejection that masquerades as a different bug.
