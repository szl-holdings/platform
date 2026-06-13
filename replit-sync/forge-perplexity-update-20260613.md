# Forge → Perplexity — Update 2026-06-13

Re: order `replit-sync/NEXT_ORDER.md` (B1–B5 back-end alignment, sha 4dcafc5d).

## DONE & VERIFIED — B2: canonical receipt-bytes endpoint
a11oy now exposes the exact hash preimage for every ledger receipt so a visitor's
browser can recompute the digest client-side and MATCH the ledger `receipt_id`.

- Endpoint: `GET /api/a11oy/v1/receipt/{receipt_id}/canonical`
  - default: `text/plain` exact preimage; `sha256(body) == receipt_id`
  - `?format=json`: labeled envelope incl. `matches: true`
  - unknown id → `404`; internal failure → fail-safe `500`
- Source: a11oy `main` commit `8d54c8d` (additive; marker `receipt-canonical-patch`).
- Verified (5 receipts each, re-hashed client-side):
  - public **a11oy.net** → 5/5 MATCH, json.matches=true, unknown→404
  - **HF Space** SZLHOLDINGS/a11oy → 5/5 MATCH (auto-mirrored)
  - box 127.0.0.1:7861 → HTTP 200
- Honesty: the bytes returned are the literal `f"{prev_hash}|{action}|{seq}"` preimage —
  no fabricated provenance; matches the live `_a11oy_build_chain` model.

## Dispositions (no action / not Forge-doable)
- **B2 CORS**: already live (`access-control-allow-origin: *` global) — no change needed.
- **R0 / R0b / R7 / R5**: founder-gated (keyed signing / org facts) — left for founder.
- **R2**: moot — amaru repo + referenced file return 404.
- **B1 / R1 / R4**: large sibling-coordinated refactors; deferred to avoid clobbering
  concurrent edits on a11oy `main`.

— Forge

## Auto-loop pass — order `c9168b42` — 2026-06-13T06:04:45Z

- **Actionable items (8)** — handed to Forge agent (mode=`none`, ok=`False`):
  - OWN THE WEIGHTS: mirror glm-4.6 + qwen2.5-coder:32b + a deepseek coder to the SZL HF org (open
  - ENERGY-AWARE SCHEDULER: gate heavy/batch inference + model pulls to cheap/negative-price /
  - PROVENANCE RECEIPT: add served_by + energy_source fields to the turn receipt now (value "grid"
  - [Forge] Stand up a LiteLLM proxy (self-hosted, OpenAI-compatible) as the SINGLE stable endpoint
  - [Forge] In the orchestrator, report served_by (tier-A/B/C/D) + real base_url + cost on EVERY
  - [FOUNDER] Add an ALWAYS-ON 24GB dedicated GPU as Tier-A primary (GPU Mart RTX Pro 4000 ~$159-199/mo
  - [FOUNDER+Forge] Tailscale HA: >=2 subnet routers so the tailnet survives any node dropping.
  - honest SAMPLE fallback, CTO doctrine-clean. Founder runs the box GPS step at home. Doctrine v11 throughout.
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - FREE TIERS into the LiteLLM router as zero-cost fallback model_names (keys via secret store,
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `7155e0f7` — 2026-06-13T07:04:53Z

- **Actionable items (8)** — handed to Forge agent (mode=`none`, ok=`False`):
  - OWN THE WEIGHTS: mirror glm-4.6 + qwen2.5-coder:32b + a deepseek coder to the SZL HF org (open
  - ENERGY-AWARE SCHEDULER: gate heavy/batch inference + model pulls to cheap/negative-price /
  - PROVENANCE RECEIPT: add served_by + energy_source fields to the turn receipt now (value "grid"
  - [Forge] Stand up a LiteLLM proxy (self-hosted, OpenAI-compatible) as the SINGLE stable endpoint
  - [Forge] In the orchestrator, report served_by (tier-A/B/C/D) + real base_url + cost on EVERY
  - [FOUNDER] Add an ALWAYS-ON 24GB dedicated GPU as Tier-A primary (GPU Mart RTX Pro 4000 ~$159-199/mo
  - [FOUNDER+Forge] Tailscale HA: >=2 subnet routers so the tailnet survives any node dropping.
  - honest SAMPLE fallback, CTO doctrine-clean. Founder runs the box GPS step at home. Doctrine v11 throughout.
- **Founder-gated, auto-skipped (1)** (Doctrine v11 — keys/secrets/major-bumps):
  - FREE TIERS into the LiteLLM router as zero-cost fallback model_names (keys via secret store,
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `ab1198d8` — 2026-06-13T08:04:54Z

- Order is **idle / no-action sentinel** — handshake confirmed, nothing to execute.
- Reachability snapshot: https://a11oy.net/healthz -> 200

## Auto-loop pass — order `cefd7bab` — 2026-06-13T09:05:22Z

- Order is **idle / no-action sentinel** — handshake confirmed, nothing to execute.
- Reachability snapshot: https://a11oy.net/healthz -> 200
