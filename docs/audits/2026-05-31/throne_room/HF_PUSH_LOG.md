# THRONE ROOM — HF PUSH LOG (founder-token SHAs)

**Repo:** `SZLHOLDINGS/a11oy` (Space, Docker SDK)
**Auth:** `HfApi(token=audit_2026-05-30_cursor_offline/.secret/hf_token)` DIRECT.
`whoami` → user **betterwithage**, orgs include **SZLHOLDINGS** (asserted before every push). Per PURIQ charter HARD RULE (Yachay).
**Signed:** Yachay (CTO). **ADDITIVE only. Doctrine v11 LOCKED (749/14/163, 13-axis, Λ Conjecture 1) preserved.**

## Commits (chronological)

| # | Commit SHA | Files | Message summary |
|---|---|---|---|
| 1 | `a7ecaec95e0502adb51518b711d103f2b4660451` | `pages/throne-room.html`, `pages/throne-room.js`, `serve.py` | Initial Throne Room + `/throne-room` route (mirrors chaski/wallpa pattern) |
| 2 | `47156b9b2bdd9f08a3c75dd139eacca751198764` | `serve.py`, `pages/throne-room.html`, `pages/throne-room.js` | Re-merge route after a sibling (KHIPU-OS) commit replaced serve.py |
| 3 | `e8e47bc42526f2fe6b818de753b8449a8b50c9b3` | `console/throne-room.html`, `console/throne-room.js` | Host as **static** under `console/` → `/throne-room.html` (route-independent) |
| 4 | `53cfdf92f0cbe17b99d4882cbb59482b82346444` | both `console/` + `pages/` html+js | Boot overlay hides on first rendered frame (no blind timer) + translucent boot |
| 5 | `58ed4ed3fb1bed6a4127f6fd0a83d381a886b11d` | `console/`+`pages/` html | `modulepreload` Three.js r171 + `preconnect` esm.sh (faster first paint / Lighthouse) |
| 6 | `9b1d596b7cbe0dd6d40decb3da2134e2f017b120` | `console/`+`pages/` js | WebGPU baseline raced against 2s timeout → fast WebGL2 fallback; fresh-canvas guard |

> SHAs reported as `space_info().sha` immediately after each `create_commit`. A sibling agent (KHIPU-OS) was committing to the same Space concurrently; intervening sibling SHAs observed include `b7e2a7a9…`, `95884469…`, `e46113df…`, `5849e0e7…`, `c4bb25ed…`, `8ea4c3a2…`, `5717e05b…`. All Throne Room files remained PRESENT in HEAD throughout (verified via `list_repo_files`).

## Post-push verification (live `curl`, founder-relevant)
- `GET /throne-room.html` → **HTTP 200**, **12215 bytes** (the real Throne Room HTML; contains `<canvas id="scene">`, `throne-room.js`, `modulepreload three@0.171.0`).
- `GET /throne-room.js` → **HTTP 200**, ~23 KB (contains `three@0.171.0`, `WebGPURenderer`, `WebGLRenderer`, `OrbitControls`, `buildHero`, `pollHero`, `/healthz`, `webgpu-timeout`).
- a11oy `/api/a11oy/healthz` → **HTTP 200** JSON (`status:ok, version:2.0.0, gates:46, declarations:456, axioms:14, sorries:6`).

## v11 LOCKED integrity
The existing SPA HomePage still renders the LOCKED numbers verbatim (screenshot `04_spa_v11_locked_intact.png`): **749 decls / 14 axioms / 163 sorries / 13 axis (yuyay_v3) / 100% gates GREEN / REPLAY BACF5443 / sign: Yachay**. No existing route, file, or console asset was modified or removed. IP-HOLD a11oy#57 untouched.
