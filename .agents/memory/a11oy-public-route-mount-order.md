---
name: A11oy public POST routes need early mount + triple allowlist
description: Why anonymous POSTs under /api/a11oy/* 401 even with PUBLIC_EXACT_PATHS
---

A new anonymous-demo POST under `/api/a11oy/*` will 401 unless **all three** of these are done. GET reads usually only need #1 + #2; POSTs hit #3.

1. **PUBLIC_EXACT_PATHS** in `artifacts/api-server/src/middlewares/global-auth-enforcer.ts` — add the exact path. (The method-agnostic `PUBLIC_PREFIXES` is intentionally narrow for a11oy and doesn't cover most demo routes.)
2. **EXEMPT_PATHS** in `artifacts/api-server/src/middlewares/csrf.ts` — POSTs need this or you get `CSRF_TOKEN_MISSING` before auth even runs.
3. **Mount order in `routes/index.ts`** — `a11oyDoctrineRouter` (mounted at `/a11oy`) applies a router-level `authMiddleware` to every POST/PUT/PATCH/DELETE. Any `/api/a11oy/*` POST mounted **after** it 401s with the doctrine guard's message (`"Authentication required"` from `sendUnauthorized`'s default), not from the global enforcer. Mount the new router **before** `a11oyDoctrineRouter` — the conventional slot is right after the `/a11oy` chat mount.

**Why:** The doctrine router's auth wall doesn't consult `isAllowlistedPublicPath`, so #1 alone isn't enough — the request never reaches the global enforcer. The symptom is identical-looking 401s on `POST /api/a11oy/foo` while `GET /api/a11oy/foo` works (GETs slip past the doctrine guard's method filter).

**How to apply:** When adding a new `/api/a11oy/*` route for the public demo surface, check the doctrine-router line in `routes/index.ts` and mount your `lazyMatch(...)` above it. The `forgeSkillsRouter` comment in `routes/index.ts` documents the same trap from the other direction.
