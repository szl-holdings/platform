# SZL Forge — ORDER: REDEPLOY a11oy.net BOX to current main (today's builds missing) — PROVE with content-types

**Pinned 2026-06-14 ~20:05 EDT. Founder-directed. Demo June 18; freeze 2026-06-18 02:00 ET — land BEFORE freeze.**

## Evidence gathered by the CTO audit (live, just now)
The public box `a11oy.net` (Hetzner 167.233.50.75) is PARTIALLY STALE — it has older surfaces
but NOT today's new builds. Exact live results:

| Path | Box (a11oy.net) | HF (correct) | Verdict |
|---|---|---|---|
| `/api/a11oy/v1/restraint/info` | **200 JSON** (governed 6-rung ladder) | 200 JSON | ✅ box OK (loop-1 concern RESOLVED) |
| `/api/a11oy/v1/waqay/doctrine` | **404** | 200 (locked=8) | ❌ WAQAY NOT on box |
| `/api/a11oy/v1/yupay/doctrine` | **404** | 200 (locked=8) | ❌ Yupay NOT on box |
| `/willay`, `/mbse` | 200 (may be SPA shell — verify real reg) | 200 real | ⚠️ confirm real registration |
| `/api/a11oy/v1/honest` | 200, doctrine v11 @ c7c0ba17, but `git_sha` NOT exposed | exposes build | ⚠️ box can't prove its sha |

NOTE: `/holo3d.js` + `/restraint/info` return `text/html` (SPA shell, 272556 B) on BOTH box AND
HF — that is IDENTICAL behavior, NOT a box defect. The loop-1 "404 on box" for those paths is
RESOLVED. The real restraint data is at `/api/a11oy/v1/restraint/info` (JSON) and works on the box.

## DO
1. **git-pull + rebuild the box to CURRENT a11oy main** so today's shared modules land:
   `szl_waqay.py`, `a11oy_waqay_nav.py`, `szl_yupay.py`, `a11oy_yupay_nav.py`, `szl_willay_gateway.py`,
   `a11oy_willay_nav.py`, `szl_mbse_cosim.py`, `szl_mbse_nav.py` + the serve.py registration blocks +
   Dockerfile COPY lines for each. (These are all already on GitHub main + HF, byte-identical.)
2. **Expose the box build sha** at `/api/a11oy/v1/honest` (`git_sha` field) so the box can PROVE it is
   current — right now it returns `n/a`, which is why staleness keeps recurring undetected.
3. Same for killinchu on the box/host (its WAQAY+Yupay+MBSE surfaces).

## PROVE (paste in your report — content-types matter, not just 200)
- `curl -sD- a11oy.net/api/a11oy/v1/waqay/doctrine` → **200 application/json**, body has `locked_count:8`, `c7c0ba17`.
- `curl -sD- a11oy.net/api/a11oy/v1/yupay/doctrine` → **200 application/json**, locked=8.
- `curl -s a11oy.net/api/a11oy/v1/honest` → shows the CURRENT main `git_sha` (not n/a) == GitHub HEAD.
- `/willay`, `/mbse`, `/mbse-6dof`, `/mbse-pipeline`, `/waqay`, `/yupay` serve the REAL page (not the
  272KB SPA shell — check page size + WAQAY/Yupay markers), front-inserted before the catch-all.

## DOCTRINE (hard gates)
Byte-identical GitHub↔HF↔box on shared modules. locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17.
Λ=Conjecture 1. Trust never 100%. 0 runtime CDN. Never commit a key. Honest BLOCKED beats a fake "done".
Hetzner stays PRIMARY public host. If a pull/rebuild can't complete, report BLOCKED with the exact error.
