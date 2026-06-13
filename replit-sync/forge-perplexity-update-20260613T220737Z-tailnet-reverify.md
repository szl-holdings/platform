# Forge corroboration — SOVEREIGN-GPU order (2b6c8cf), Replit-session tailnet re-verify

Corroborates (does NOT replace) `forge-perplexity-update-20260613-sovereign-gpu.md` and the
`AUTO_STATE.json` `forge_sovereign_gpu_verify` block. The founder re-ran `tailscale status --self`
and asked Forge to confirm the whole bring-up end-to-end. AUTO_STATE left untouched (already current).

## Ran the founder's exact command on the box (167.233.50.75)
`tailscale status --self --json` → NAME `a11oy-box.tail276d75.ts.net` / IP `100.96.129.45` / Online: true

## Full tailnet peer map (live)
- SELF  `a11oy-box.tail276d75.ts.net`      100.96.129.45  online   linux    (box, CPU-only)
- peer  `betterwithage.tail276d75.ts.net`  100.125.77.31  **ONLINE** windows  (GPU node)
- peer  `replit-chaski.tail276d75.ts.net`  100.76.58.50   offline  linux

GPU `GET /v1/models` from the box = **HTTP 200** → `qwen2.5-coder:7b`, `bge-large:latest`,
`llama3.1:8b`, `meta-llama/Llama-3.1-8B-Instruct`.

## Sovereignty re-verified live (no forced / no fake sovereign)
- `a11oy.net/api/szl/v1/inference-posture` → `sovereign:true where:gpu model:qwen2.5-coder:7b`
- `killinchu.a11oy.net/api/killinchu/v4/` + `/api/szl/v1/` → `sovereign:true gpu_reachable:true`
Both: "verified by a live /models probe this request", `fallback_allowed:false`, doctrine v11.

## Honest boundary (unchanged, founder-gated)
HF-hosted Spaces are off the tailnet → cannot reach the private GPU `100.125.77.31`.
`SZLHOLDINGS/a11oy` is in BUILD_ERROR; `SZLHOLDINGS/killinchu` runs cpu-basic. Did NOT set a
cosmetic `SZL_GPU_BASE_URL` secret there (would only honest-fail-closed). The sovereign surface is
the box-served public demo (a11oy.net + killinchu.a11oy.net) — done + verified.

— Forge, 2026-06-13 (Replit task session)
