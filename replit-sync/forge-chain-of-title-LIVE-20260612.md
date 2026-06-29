# Forge → CTO — L6 Chain-of-Title console tab LIVE + a-11-oy.com box redeploy — 2026-06-12

**Operator:** Forge (Replit task agent · org-owner token) · agent surface name **Chaski**
**Closes the deferred recommendation in** `replit-sync/forge-perplexity-update-20260612.md`
("a11oy app console honest-tab does not yet surface the experimental Lean index or the L6 receipt … recommend a dedicated serialized pass").

## What this pass confirms DONE (verified, not assumed)
- **#3 L6 chain-of-title — wired AND live.** `a11oy/serve.py` mounts the chain routes (`_szl_chain_of_title.register(app, ns="a11oy")`). The endpoint `/api/a11oy/v1/chain/summary` returns real JSON, byte-identical in spirit to killinchu's. Verified HTTP 200 on **both** HF Space and the public box.
- **#6 honest L6 Chain-of-Title console tab — DONE on both flagships.** Full honest L6 tab present in `a11oy/pages/console.html` and `killinchu/killinchu_elite_console.py`, NS auto-detected, byte-identical. Surfaces the three EXPERIMENTAL backbones (Allodial #229/783a38d0, Entanglement #230/7b344e11, Neuroplasticity #231/9a0dcc77) with correct honesty: not Λ-uniqueness, not in the locked-8, UNSIGNED/pending never faked. This is the surfacing pass the prior report deferred.
- **#8 cosmetic (killinchu KaTeX fonts) — OBSOLETE.** KaTeX is fully vendored zero-CDN (`_vendor_blobs.py` base64 + `static/vendor/fonts/` fallback); no missing-font bug. `A11OY_TABKEYS.txt` is phantom (only in two stale planning docs).

## The real action this pass: a-11-oy.com box was STALE → redeployed
- The box (`167.233.50.75`, container behind nginx :7861) was pinned at an old HEAD (`6c8d66a`); `a-11-oy.com/api/a11oy/v1/chain/summary` returned **404** even though GitHub main + HF already served it.
- Ran `a11oy-rebuild`: fetched `6c8d66a..5a8b4ad` (includes chain + contracted l6chain tabs), clean overlay, Docker build OK → `a11oy:local`, container recreated and running.
- **Front-door VERIFY OK** — baked `pages/console.html` and `console/index.html` md5 match published origin/main.
- **Live verification (post-deploy):**
  - `localhost:7861/api/a11oy/v1/chain/summary` → **HTTP 200**, real L6 JSON.
  - `https://a-11-oy.com/api/a11oy/v1/chain/summary` → **HTTP 200**, real L6 JSON.
- Lesson re-confirmed: GitHub main + HF being current does **not** mean the box is — verify all three surfaces; the box can silently serve 404 on newer routes until `a11oy-rebuild` runs.

## Everything else from the perplexity set is FOUNDER-GATED (unchanged)
- #1 UDS bundle env-gated; #2 Zenodo DOI; #4 cosign re-sign; #5 FairWave/Proxima propose-only; #7 PQ keys / real L6 signing. No fabrication; UNSIGNED/PROXY labels stay honest until founder signs.

## Honesty / invariants honored
- locked FORMULA set = **EXACTLY 8** {F1,F4,F7,F11,F12,F18,F19,F22}; Λ-uniqueness = **Conjecture 1** (OPEN, machine-checked FALSE) — never a theorem; Theorem U = **REAL·CONDITIONAL**; the 3 new theorems stay **EXPERIMENTAL**, never locked.
- No user-visible codenames; agent = **Chaski**. No key committed, no CI gate weakened, no Lean self-merge.

— Forge (Chaski)
