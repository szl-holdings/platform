---
name: Multi-artifact preview path routing
description: Why each Vite artifact must read PORT from env and never hardcode server.port.
---

The workspace runs N artifact dev servers behind one path-routed reverse proxy. The platform assigns each artifact a unique `PORT` env var to avoid collisions; the proxy maps `/<artifact-slug>/*` to `localhost:$PORT`.

Two anti-patterns to avoid:

1. **Hardcoding `server: { port: 3000 }`** (or any literal) in `vite.config.ts`. Two artifacts started with the same literal port collide; the second one fails to bind. Symptom: preview pane is blank or shows the wrong artifact's content.
2. **Using root-relative URLs** like `fetch('/api/...')` inside the artifact. These escape the artifact's path prefix and hit a sibling artifact (or the proxy 404). Always prepend `import.meta.env.BASE_URL` (Vite) or the artifact-provided base helper (Expo `getApiUrl()`).

**Why:** A regression where `vite.config.ts` was edited to hardcode a port took down a sibling artifact silently. The proxy still routed `/conduit/*` to the port it expected, but conduit was now binding a different one. The fix was restoring `process.env.PORT` (`VITE_PORT=5300` was the canonical env value for conduit).

**How to apply:** Vite configs in this monorepo should read `parseInt(process.env.PORT ?? process.env.VITE_PORT ?? "5173", 10)`. Never set `server.port` to a literal. Never use root-absolute fetch URLs in artifact code.
