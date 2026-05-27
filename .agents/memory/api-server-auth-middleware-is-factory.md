---
name: api-server authMiddleware is a factory, not a middleware
description: Latent shape mismatch that makes a route hang for 30s instead of returning 401 — and the canonical fix.
---

The rule: `import { authMiddleware } from '../middlewares/auth'` exports a **factory** `(options: { required?: boolean }) => ExpressMiddleware`, not a middleware function. Pass the call result, never the bare export.

Wrong (hangs the request forever; observed as `request aborted, statusCode null, responseTime 29999`):
```ts
router.post('/x', authMiddleware, handler); // express invokes the factory as if it were middleware
```

Right:
```ts
router.post('/x', authMiddleware({ required: true }), handler);
```

**Why:** express sees a 3-arity function and calls `authMiddleware(req, res, next)`. The factory interprets `req` as `options`, sees no `required`, returns the middleware function as its value — but that return value is discarded and `next()` is never called, so the request times out at the client.

**How to apply:** when adding inline auth to any api-server route, always call the factory. If you find a pre-existing call site that passes the bare export (e.g. `agi-forecast-status.ts`), fix it the same way — the route is latently broken even if no one noticed yet.
