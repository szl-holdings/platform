# Forge report — P0 HOTFIX: a-11-oy.com "/" WHITE SCREEN — DONE (PROVEN)

Doctrine v11. PROVE-OR-DOWNGRADE in force. Status: **DONE** with checkable artifacts (HTTP 200 + byte counts + headless render).

## Order
`replit-sync/NEXT_ORDER.md` TOP ORDER (P0 HOTFIX, re-pinned 2026-06-14 05:34 EDT): a-11-oy.com "/" served an
83-byte stub (only the Chaski operator-widget script) -> blank page + tiny bubble. Restore a real landing
page at "/" with the widget as an OVERLAY, on BOTH the box and the HF Space.
GATE: root returns >1KB real markup + headless render shows visible content.

## Root cause
`spa_root()` returned a `FileResponse(/app/cathedral.html)` (142KB real content). Under uvicorn's
pathsend FileResponse path the response body is lost inside the `BaseHTTPMiddleware` operator-widget
injector stack -> empty body -> only the 83-byte widget `<script>` tag survived. In-memory `Response`
objects are unaffected.

## Fix (already on main)
origin/main rewrote `spa_root()` to READ the front-door file bytes and return an in-memory `Response`
(with the operator widget baked in), fallback chain cathedral.html -> console.html -> INDEX_HTML.
No code edit was needed — the fix was committed on main but the running box container and the HF Space
were STALE (still serving the 83-byte stub). The work was DEPLOY-ONLY.

## Deployment
- Box `/opt/szl/a11oy`: `git reset --hard origin/main`; ran `/root/forge-deploy.sh` (build a11oy:local ->
  atomic container swap + rollback). NOTE: several concurrent `docker build` procs from interrupted SSH
  foreground runs had accumulated and were thrashing the 2-vCPU box; killed all stale builds, ran ONE
  clean build to completion, container swapped.
- HF Space `szlholdings/a11oy`: auto-mirrored from main via `hf-sync-backend.yml` (mirrors serve.py +
  backend modules to the Space). No manual push required; Space rebuilt and now serves the full front door.

## PROOF (checkable artifacts)
Box  — `https://a-11-oy.com/`            : HTTP 200, **142766 bytes** (was 83). Has `<body>`, hero
       "Governed intelligence, proven at the frontier.", full nav, CTAs, and the operator widget as a
       floating OVERLAY. Headless render captured = full landing page (not a blank page).
HF   — `https://szlholdings-a11oy.hf.space/` : HTTP 200, **142715 bytes** (was 83). Has `<body>`,
       widget tag, hero text. Same front-door content.

GATE: PASS on both surfaces (root >1KB real markup + visible headless render + widget present as overlay).

## Doctrine / honesty
No fabrication. The fix shipped via deploy of an existing main commit; byte counts and HTTP 200 are
live-verified on both surfaces. healthz `commit` field is the doctrine LOCK id, not the deploy SHA.

— Forge
