# FORGE exec — 3 box items DONE-AND-VERIFIED (Replit session, verify-live-first)

**Order:** `replit-sync/FORGE-INSTRUCTION-EXECUTE-box-gitsha-frontend-stub-20260615-1640.md` (GO.txt 16:40 EDT)
**Executor:** Forge (Replit session, Rosa in-session re-auth). **Box:** 167.233.50.75 / a-11-oy.com.

## VERDICT: all 3 items VERIFIED GREEN live — no second rebuild needed
Root cause (box image older than a11oy `main` HEAD) is ALREADY RESOLVED. The box was rebuilt
**2026-06-15T17:28:41Z** from a11oy `main` HEAD `b9d11b8207ab083755730c93fcd22c90c82eaccb`
— which is AHEAD of the order's `eb97206` and CONTAINS it (`eb97206 fix(a11oy): add git_sha to
/honest (be-hardening winning handler)`) — built WITH `--build-arg SZL_GIT_SHA=b9d11b82` and run
with `A11OY_ENERGY_ALLOW_STUB=0`. I did NOT rebuild again: verify-live-first / no-bandaids — a
duplicate rebuild would race the active actor and risk the healthy MEASURED stream pre-demo.

## PROVE (live, 2026-06-15 ~17:33Z; direct box port :7861 AND public a-11-oy.com)
**Item 2 — git_sha present AND == a11oy main HEAD (NOT <MISSING>/unknown):**
- `127.0.0.1:7861/api/a11oy/v1/honest` -> 200, `git_sha=b9d11b8207ab083755730c93fcd22c90c82eaccb`
- `https://a-11-oy.com/api/a11oy/v1/honest` -> 200, `git_sha=b9d11b8207ab083755730c93fcd22c90c82eaccb`
- box `git rev-parse HEAD` == `origin/main` == `b9d11b82`.

**Item 3 — /energy is the CURRENT page (not the stale 9065B shell):**
- `/energy` bytes=**34956** (>= 27443), `grep -c energy/operator/status` = **1** (>= 1)
- `/energy-ops` `grep -c energy/operator/status` = **3** (already current)

**Item 1 — meter live + honest after redeploy:**
- `/api/a11oy/v1/energy/operator/status` -> `running=True`, `stub_mode=False`,
  `joules_measured_total=480599.766` (>= 466685 target, climbing across sweeps),
  `by_node=['rtx-betterwithage']` (NO `local-stub`),
  `node_status={rtx-betterwithage: computing, chaski: DEGRADED}`
- live process env: `A11OY_ENERGY_ALLOW_STUB=0`.

## DOCTRINE
No joules/receipts reset. GPU-gone => DEGRADED + loud, never a silent stub. No key committed.
locked=8 {F1,F4,F7,F11,F12,F18,F19,F22}, Λ=Conjecture 1, trust never 100%.

Signed-off-by: Forge <forge@szlholdings.local>
