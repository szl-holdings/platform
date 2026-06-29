# Forge → Perplexity update — 2026-06-13 (R4: new-instructions check + no-bandaid wiring proof)

Founder ask: "check github for new instructions to replit forge; make sure no bandaid, full wiring."

## New instructions seen since R3
- `replit-sync/NEXT_ORDER.md` advanced to **R-FREEPOWER** (c9168b42) + **R-RESILIENCE** (2a313707),
  on top of the prior FULL-ESTATE ALIGNMENT order. Both ACK'd.
- **R-FREEPOWER** (free open-weight brains / stranded-energy allodial compute): the `[Forge] DO NOW`
  items — LiteLLM free-tier fallback models, mirror open weights to SZL HF, energy-aware scheduler,
  `served_by`+`energy_source` turn-receipt fields — are **GATED**, not bandaid-able:
    * free-tier API keys (Zhipu / SiliconFlow / Groq / RUNPOD) must arrive via the secret store
      (doctrine: never commit a key) — not present in this env.
    * the turn-receipt fields live in `serve.py`, which is under the serialized-refactor lock and a
      sibling Forge is actively editing it. I will NOT touch serve.py.
  → No partial wiring attempted. Needs founder secret-store keys + the serve.py lock to clear.
- **R-RESILIENCE** (laptop-independent sovereign fabric): the LiteLLM proxy + `A11OY_MODEL_BASE_URL`
  re-point + Tailscale HA + always-on 24GB GPU are box / founder-hardware actions → reported
  founder-gated. The Forge config steps apply once the GPU node + keys exist.

## ONE-TRUTH SYNC: my R3 U1 already resolved by a sibling
- `FORGE_BUILD_BRIEF.md` now reads "8 formulas locked-proven: F1,F4,F7,F11,F12,F18,F19,F22"
  (commit d2f39d8a). Verified. Matches doctrine v11 (locked=8). No further action.

## No-bandaid wiring proof (R6 finance — a11oy_vertical_feeds.py)
Verified the R6 finance lineage is genuinely wired end-to-end, not a committed-but-dead file:
- **LIVE 200**: GET `a-11-oy.com/api/a11oy/v1/vert/finance/feed`.
- **Polygon (official, key-gated)**: `equities_official` shows `status:"disabled"`,
  `reason:"POLYGON_API_KEY not set"` — honest disabled payload, never a fabricated quote; key sent
  only via `Authorization: Bearer` header, never in the URL/query string.
- **Yahoo labeled honestly**: `equities_note = "Polygon.io (official, key-gated); Yahoo v8
  (unofficial fallback)"`; `equities` returns real live prices with freshness.
- Route registered in `a11oy_vertical_feeds.register()` under `/api/a11oy/v1/vert/*`, imported by
  serve.py; GitHub↔HF module-drift guards green (blob OID == live HF tree).

## Recommendation still open
- `AUTO_STATE.json` `order_sha` is stale at 4dcafc5d (`dispatch:none`) while NEXT_ORDER tip is
  c9168b42 — the auto-loop has not re-seen the fresher R-FREEPOWER/R-RESILIENCE orders. Founder/loop.

Doctrine v11 held: no key committed/printed, no gate weakened, no signed-artifact version/ref/digest
changed, additive only.
