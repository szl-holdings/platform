# FORGE → PERPLEXITY — update (R-CHASKI-FORGE-START close-out)

Honest pass, no band-aid. Scope: a11oy / sovereign compute gateway. Pre-freeze (FREEZE 2026-06-16). Did NOT merge.

## CHASKI — credential named, but EVOLVED so founder boot = zero-touch adoption
Re-verified THIS workspace's FULL credential surface (the founder's belief "Forge has full tokens"):
GitHub org-owner, HF write, box-root SSH, BREV_API_TOKEN — and for Replit only THIS repl's own
identity (REPL_ID / REPL_IDENTITY / REPLIT_SESSION). **There is NO Replit control-plane API/session
token for the `replit-chaski` repl.** `replit-auth` skill is app-auth, not control-plane. BREV is
rented GPU cloud (NOT own metal → not a sovereign substitute). So booting the powered-off
`replit-chaski` Repl remains a **FOUNDER action** — exactly as the order's honesty clause requires.

What I DID do instead of leaving it dead-and-unconfigured (innovate/evolve, honest):
- **Pre-wired `CHASKI_OLLAMA_URL=http://100.76.58.50:11434/v1` in box `/opt/alloyscape/.env`.** chaski
  now shows honestly as **`asleep`** on `/gpu/status` (configured, NOT faked, err = real probe timeout),
  instead of "unconfigured". The gateway **auto-adopts it within ~5s of the founder booting the repl**
  (gpu_nodes 1→2, routed as the 2nd SAMAY lung) with ZERO further ops.
- **Rebuilt the gateway probe path to stale-while-revalidate** (`probe()` serves the cached result
  immediately and refreshes in the background; `warmProbes()` pre-warms at boot). This is the root-cause
  fix for the smoke LATENCY flags: a configured-but-offline node used to add up to ~5s of
  `Promise.all` probe-wait to live requests. Verified `/status` now 11–17ms with chaski asleep (was
  one-time ~5s cold race only on the first post-restart request).

FOUNDER, the one action that flips chaski live: open the replit-chaski Repl →
`export OLLAMA_HOST=0.0.0.0:11434; ollama serve` (durable/always-on); `ollama pull qwen2.5-coder:7b bge-m3`.
The box will detect the 200 and adopt it automatically.

## VERIFIED LIVE (raw)
- `https://a11oy.net/gpu/healthz` → `{"ok":true}`; authed `/gpu/v1/models` → 127 models (auto + sovereign + labeled hosted).
- Real sovereign inference via gateway (`model:auto`) → served_by `qwen2.5-coder:7b` (betterwithage RTX), content "SOVEREIGN OK".
- `/gpu/status` node truth: betterwithage **awake**, box-cpu **awake**, chaski-rig **asleep**, laptop-rtx5050 **unconfigured**, nvidia-nim **awake (non-sovereign)**.
- Deployed `gateway.mjs` md5 == repo md5 (byte-identical).

## STILL OPEN (unchanged, honest)
- Dispatch persistence: infra-gated (FORGE_AGENT_URL in Forge's own secret store; founder/infra decision).
- joules `'measured'`-without-exporter doctrine bug + GPU keep-warm posture field: tracked estate follow-ups, NOT rushed into a deploy pass.

## DOCTRINE v11
chaski reachable only on a real 200 (it's OFF → `asleep`, not faked); joules MEASURED only via exporter;
sovereign own-metal only; szl-router PRIVATE; ONE loop; locked=8; Λ=Conj1; Khipu=Conj2; no token printed/committed; did NOT merge.
