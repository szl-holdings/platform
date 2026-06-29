# Forge work-order — research-3D real-data wiring (verified ground truth) — 2026-06-11

**Author:** Forge (Replit). **For:** parent/CTO loop + Opus 4.8 dev pair (own a11oy `serve.py`/`console.html`) + box Forge.
**Trigger:** founder ask "make it real and operational, full wiring back/front; whatever I can't finish, Forge handles."

## What I verified LIVE (a-11-oy.com, 2026-06-11) — the tabs are already wired + honest
The 4 research-3D tabs in `pages/console.html` read REAL endpoints and honestly label SAMPLE/PROXY **only** where the
self-contained HF demo image genuinely has no source. Confirmed live (HTTP 200, real payloads):
- `/api/a11oy/v1/router/stats` -> `mode:live`, real per-tier routes (organ/tier/model/throughput/license).
- `/api/a11oy/v2/command-log` -> real verified hash chain (depth 24, chain_verified:true); receipts carry NO `loop_depth`.
- `/api/a11oy/v1/mcp/tools` -> 11 real tools. `/api/a11oy/v1/mesh/state` -> real wire states (doctrine v11).

## DONE this session (Forge)
- **gemstones_frontier** corrected: was claiming "no live router-metrics endpoint exists in this image" (STALE — `/router/stats`
  is live). Wired a REAL `<b>LIVE</b> /router/stats` fleet readout (per-tier throughput/model/license, honest unreachable fallback)
  + a "Live router" KPI; reworded prose. The width/depth surface POINT stays a clearly-labelled SAMPLE because `/router/stats`
  carries no model width/depth shape (fabricating one = Doctrine v11 violation). a11oy main `d7a8462`, banned-token GREEN, hf-sync mirrored.

## REMAINDER — needs a REAL data source; DO NOT fabricate (honest SAMPLE/PROXY stays until source exists)
1. **ouro_spiral loop_depth (PROXY -> LIVE).** Tab already uses receipt `loop_depth`/`loop`/`R`/`ut_step` if present, else an
   honest density PROXY. To make LIVE: the reasoning pipeline (`/reason`) must EMIT a real recurrent depth R per step and the
   command-log writer must persist it on each receipt. Only real if the engine measures recurrent depth; otherwise keep PROXY.
2. **abacus_manifold tripartite routing-graph (`/api/chaski/routing-graph`).** CAN be built from REAL endpoints with no
   fabrication: tasks <- command-log `kind`s; capabilities <- `/mcp/tools`; agents/tiers <- `/router/stats`. Add a server
   endpoint that joins these three live sources into {nodes:[task|capability|agent], edges:[...]} and point the tab at it.
3. **consensus_basin votes/round/confirmations.** No real per-receipt vote stream exists in the image. Either add a real
   consensus/quorum field to receipts (if a real BFT round happens) or keep SAMPLE. Khipu BFT = Conjecture 2; never imply proof.
4. **gemstones width/depth LIVE point.** Needs `/router/stats` (or a new endpoint) to expose the active model's actual
   (width, depth) params. Until then the point stays SAMPLE (already honest after my fix).

## Other open directives (ownership noted)
- killinchu codename route aliases (§A.3): rosie/amaru -> operator/osint 308 redirects; differentiate the two "Maritime Picture"
  titles. killinchu `serve.py` (god-file) — additive, no fabrication. Larger; box Forge / dev pair.
- Landing copy (§C): marketers/directors.
- Founder/Forge-gated (unchanged): Zenodo v8 DOI, GHCR push token, cosign/Rekor uds-v0.3.0 + FA-002 bundle cosign,
  SZL_LOCAL_LLM_URL brain secret, UDS cluster (no docker/k3d in sandbox), major dep bumps, Lean PR merges.

## Doctrine guard for ALL of the above
locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22}; Λ = Conjecture 1; Khipu = Conjecture 2; honest live/cached/unreachable
labels, NEVER present SAMPLE/PROXY as measured; GitHub<->HF byte-identical on shared szl_*.py; ast.parse before push.
