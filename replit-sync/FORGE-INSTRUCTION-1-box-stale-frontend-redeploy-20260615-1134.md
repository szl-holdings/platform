# SZL Forge — #1 ROOT-CAUSE (2026-06-15 11:34 EDT): box serves STALE FRONT-END — API fresh, UI not wired

Founder reported it precisely: "the tab energy + all these updates but the site does not update." DIAGNOSED:

## EVIDENCE (live, just now)
- box `/api/a11oy/v1/honest` -> **git_sha: MISSING** (box can't prove its build = it's stale, undetected).
- box `/energy-3d` -> 200 but **272,607-byte generic SPA shell**, ZERO refs to `energy/operator`, `joules_measured`,
  or `betterwithage`. The served page NEVER fetches the live energy API.
- box `/api/a11oy/v1/energy/operator/status` -> **FRESH** (joules 393,056 climbing, running:true). Backend fine.
- CURRENT GitHub a11oy main (HEAD e42082a6) HAS the real live-wired energy UI: `web/energy.html`,
  `pages/energy-ops.html`, `static/3d/energy_showcase/showcase.js` — these fetch energy/operator/status (8 files ref it).

## ROOT CAUSE
The prior "box redeploy" landed the BACKEND (API works) but NOT the current FRONT-END. The box is serving an
OLD console/pages build, so the energy tab (and likely WAQAY/Yupay/QHAWAQ/SAPA/MBSE tabs too) shows a stale SPA
shell that doesn't read the live endpoints. git_sha MISSING is why this kept slipping by undetected.

## DO (box-side, real deploy — the half-redeploy must be finished)
1. **Deploy the CURRENT main front-end to the box**: the served pages/static must match GitHub HEAD e42082a6 —
   especially `web/energy.html`, `pages/energy-ops.html`, `static/3d/energy_showcase/showcase.js`, the console
   SPA bundle, and the new-tab pages (willay/waqay/yupay/qhawaq/sapa/mbse). Rebuild/restart so the box serves
   the real pages, not the old SPA shell.
2. **Stamp git_sha**: make box `/api/a11oy/v1/honest` return git_sha == deployed HEAD (GIT_SHA build-arg or
   baked .git_sha read at startup). This is mandatory — without it staleness keeps slipping by.
3. Verify the energy tab on the box now FETCHES + renders the live operator status (joules number visible + updating).

## PROVE (paste real output)
- box /api/a11oy/v1/honest -> git_sha == e42082a6 (or current HEAD), NOT missing.
- `curl -s https://a11oy.net/energy-ops` (and /energy) -> served HTML CONTAINS `energy/operator/status` +
  the live joules wiring (NOT the 272KB blank SPA shell).
- Open the energy tab live -> shows joules_measured_total climbing (matches the API ~393k+).
- Spot-check willay/waqay/yupay/qhawaq/sapa/mbse tabs render REAL content on the box (not stale shell).

## DOCTRINE: byte-identical GitHub<->HF<->box on shared modules; never fabricate; never reset energy totals;
never commit a key; honest BLOCKED beats fake green. Hetzner stays primary public host. If a front-end build
step needs a tool not on the box, report the exact BLOCKED error — do not serve a stale shell and call it done.
