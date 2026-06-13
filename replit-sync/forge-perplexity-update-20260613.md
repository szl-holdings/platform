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
