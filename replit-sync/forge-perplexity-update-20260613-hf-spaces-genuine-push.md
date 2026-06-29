# Forge ⇄ Perplexity update — 2026-06-13 (genuine HF static-space push, no band-aid)

Founder re-issued: "check github for instructions from perplexity and get forge and replit handle it all no bandaids."

## Audited
Active order **R-MOBILE-ELEGANT** (506aee3d) + R-FLY-HIGH-2 (8a97ca9c) + R-FLY-HIGH-DEPLOY (484a6532).
forge-auto marked 506aee3d `state=done` @21:07Z — but with a SINGLE probe (`a-11-oy.com/healthz:200`), `dispatch_mode=none`. It did NOT verify or perform the FORGE-owned HF static-space pushes.

## Band-aid found → genuinely fixed
HF `SZLHOLDINGS/cathedral` was STALE at **locked-proven = 5** (served app.js 21KB) while the GitHub source AND a-11-oy.com/cathedral were already **locked = 8**. The order flagged this 3×; the auto-loop never pushed it.

## FORGE action — 5 HF static spaces pushed from `replit-sync/hf_spaces/`
Content files only; HF Space README/config preserved (cathedral source README was a corrupted HTML render — intentionally NOT pushed, to avoid breaking the static-space config).

| Space | Source | Commit | Verified live |
|---|---|---|---|
| cathedral | cathedral_live_src/ | d8d998a7 | app.js **34195b, Locked proven kernel = 8**, all vendor/ present |
| energy | hf_energy_space/ | 24380513 | verify-widget; **0 runtime CDN** (three vendored) |
| khipu-constellation | hf_khipu_space/ | 23a400a2 | verify-widget; **0 runtime CDN** (3d-force-graph vendored) |
| llm-router-live | hf_llmrouter_space/ | 019db85f | verify-widget; PUBLIC-STATUS-ONLY (router internals stay PRIVATE) |
| anatomy | anatomy/ | a719df88 | verify-widget; V8/V9 dual-body lens intact |

## Confirmed ALREADY LIVE on the box (no image rebuild needed)
- a-11-oy.com/cathedral = **locked 8** (268KB)
- a-11-oy.com/console = mobile-live (**65** clamp/44px/safe-area hints, 1.5MB)
- killinchu /elite = mobile-live (**49** hints, 1.15MB)
- hatun-mcp content-negotiates: `Accept: text/html`→HTML console 200; `application/json`→original JSON 200
- a11oy main push-CI all green @ ee9fa6e8 (hf-module-drift is delegated to org `.github`, not an a11oy workflow)

The box already serves the merged mobile/elegance + locked=8 work, so a blind a11oy/killinchu/hatun image rebuild was **not a genuine gap** and was **not** performed — no needless production risk in the pre-freeze window (FREEZE activates 2026-06-16; today 2026-06-13 = normal work).

## FOUNDER-ONLY (honest blockers — NOT faked)
- **replit-chaski** Repl (2nd SAMAY lung) = **STILL POWERED OFF** (`curl http://100.76.58.50:11434/v1/models` → 000). Forge lacks the Replit boot credential.
- **VAST_API_KEY** flip (marketplace earning) = founder holds.
- **amaru/sentra/rosie** codename table (uds-bundles/a11oy_uds_tab) = founder ruling needed (load-bearing real artifact ids; rename = coordinated repo-wide).

## Doctrine v11 respected
locked=8 · Λ = Conjecture 1 (advisory) · Khipu BFT = Conjecture 2 · 0 runtime CDN · system fonts · honest SNAPSHOT · no banned codenames in new copy · szl-router PRIVATE.
