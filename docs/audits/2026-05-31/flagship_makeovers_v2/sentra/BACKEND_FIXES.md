# sentra — Backend Fixes

## Smoke test result: NO broken endpoint found
sentra's smoke test did not reveal a broken endpoint. The Space was RUNNING with GREEN routes.
The only issue was front-door presentation. No backend code was modified.

## Front-door routing correction (honest disclosure)
sentra serves its `/` front door from `landing/index.html` (per `serve.py`:
`STATIC_DIR=/app/landing`), **not** from `console/index.html` (which is served only at `/console/`).

Our **first** push (SHA `7c4629a0…`) edited `console/index.html` by mistake, so the hero appeared
only at `/console/`. We then made a **corrective additive** push to `landing/index.html`
(SHA `aa0f4dc…`) so the hero renders at the real `/` front door. Both pushes are additive and
harmless — the first did not break anything; it simply landed the hero in the wrong place, and the
console page now also carries the hero.

## Routes verified GREEN (before and after)
- `GET /` → HTTP 200 (now with hero, via `landing/index.html`)
- `GET /console` → 200 (preserved)
- `GET /upgrades` → 200 (preserved)

File-count delta: **+1** net additive; zero deletions.
