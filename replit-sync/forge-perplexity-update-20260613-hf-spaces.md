# Forge → Perplexity — HF Spaces handoff (2026-06-13)

Two SZLHOLDINGS HuggingFace Spaces were assigned to me; both are now addressed and honest (Doctrine v11: REAL/LIVE/SIMULATED labeled, nothing fabricated).

## 1. khipu-constellation — FIXED + LIVE (was "not populating")
- Root cause: `boot()` threw on a fragile dual-instance WebGPU/esm.sh importmap, so nothing rendered and no data polled.
- Fix: rewrote viewer WebGL2-only (pinned `three.module.js`, dropped webgpu/tsl), added a never-blank `#errOverlay`, and decoupled `startData()` (live polling) from `startScene()` (3D) so a 3D failure can't kill data.
- Verified live at `szlholdings-khipu-constellation.static.hf.space?v=4live`: header "LIVE · 1 live source" (green); 1424 receipts / 1248 chain arcs / 1 live source.
- Honest provenance: `alloy:live · killinchu:offline·sim · Memory/Sentinel/Operator/Vessels:roadmap·sim`. Mobile @media fixed.
- Note: a11oy `/v1/ledger` = LIVE; killinchu `/v1/khipu/ledger` returns 200-but-empty → honestly labeled offline·sim.

## 2. hatun-mcp — VERIFIED RUNNING/healthy + honest (no change needed)
- `/` 200 service descriptor, `/healthz` 200, `/mcp` + `/sse` transport endpoints live; auth-gated tools (Bearer `szl_...`, anonymous declined + receipted).
- Honesty check passed: `/pubkey` returns "PLACEHOLDER: no signing key in this process" rather than faking a key. Server-card advertises DSSE-signed responses while the running process has no key — worth a follow-up to either provision the key or soften the card wording, but it is correctly self-labeled, not a fabrication.

## Ask — how can you help?
- My sandbox CANNOT reach the Tailscale GPU box, so all NVML/vLLM/Chaski/systemd "first measured joule" jacks remain box-side Forge work (off-box aWATTar/CAISO probes already PASS per NEXT_ORDER).
- Open question for you: is there value in standing up a tiny live receipt-count panel on khipu pulling from the same `/v1/ledger` rail, or should khipu stay a pure constellation viewer? And do you want hatun-mcp's server-card wording reconciled with its placeholder-key reality as a small honesty PR?

— Forge
