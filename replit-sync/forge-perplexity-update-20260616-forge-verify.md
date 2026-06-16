# Forge verify+execute report — 2026-06-16 (re: NEXT_ORDER 2026-06-16 02:10 ET, founder green-light)

Doctrine v11. Verified-live, no fabrication. Box-side Forge. AUTO_STATE.json left to the loop.

## (1) TASK 1 — .static probe URLs  [ALREADY LANDED on canonical; no edit needed]
- killinchu `.github/workflows/smoke-monitor.yml` (canonical main): probes `https://szlholdings-anatomy.hf.space/` (docker). 0 occurrences of `szlholdings-anatomy.static.hf.space`.
- Live killinchu `/elite` console embeds `szlholdings-anatomy.hf.space` x3 (docker), all 200.
- Org code-search for the two `.static` hosts: hits are ONLY `platform/replit-sync/*.md` historical reports + NEXT_ORDER + orders-archive copy — left untouched per order ("do NOT touch historical bare-vs-static notes").
- `szlholdings-energy.static.hf.space`: 0 live/executable refs (historical .md only) -> nothing to fix.
- Files changed: NONE. The box working copy /opt/szl/killinchu was a stale checkout, not canonical/serving.

## (2) TASK 2 — surfaces (real probes)
- a11oy.net/healthz 200; /frontier 200; /orbital 200; /energy-ops 200
- szlholdings-anatomy.hf.space 200 (docker); .static 404 (expected/retired)
- szlholdings-energy.hf.space 200 (docker); .static 404 (expected/retired)
- killinchu /elite serves; anatomy embed 200

## (3) TASK 3 — receipt persistence
Config = HF /data mount, survives_redeploy:true, chain length 264+ (per CTO 2:09 ET). NOT empirically re-proven via a forced redeploy this pass: a deliberate prod redeploy 2 days pre-demo is founder-timed. Recommend running the redeploy-continuity check (before/after seq) at a low-risk window. Honest: config-evidenced, not re-proven this pass.

## (4) TASK 4 — OMEN
Real probe http://100.70.130.45:11434/api/tags => 000 (unreachable). STILL founder-side bind (Action B). NOT marked up. Honest BLOCKED-need-founder-bind.

## (5) TASK 5 — chaski durability  [EXECUTED + PROVEN]
chaski = real Ubuntu VM (ubuntu-16gb-ash-1, tailnet), reachable from box via offbox key. Durable systemd unit already in place + verified:
- UnitFileState=enabled (survives reboot); Restart=always, RestartSec=3s (survives crash); OLLAMA_HOST=0.0.0.0:11434 (tailnet-reachable); models: llama3, mistral:7b-instruct-v0.3-q4_0, deepseek*.
- KILL-RECOVER PROOF: SIGKILL the unit -> MainPID 1566195 -> 1748781, is-active=active, chaski-local /v1/models 200.
- FABRIC post-restart: box -> http://chaski:11434/v1/models 200 (x3 stable). (Raw tailnet IP 100.76.58.50 not routed from box; fabric uses `chaski` hostname per A11OY_CHASKI_BASE_URL.)
- NOTE: Founder Action D (Replit "Always On" for chaski) is NOT needed — chaski is a real systemd VM, not a recycling Repl. Durability is native systemd.

## (6) TASK 6 — frontier evolution PR
Not opened this pass. Current /frontier 200 / demo-ready (order's own assessment). A front+back change to a demo-critical prod surface 2 days pre-freeze is deferred pending founder scope/timing (order marks it parkable).

## (7) TASK 7 — GitHub/HF/UDS alignment
UDS bundle published + keyless-signed (Sigstore OIDC) + SBOM-attested: oci://ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.3.0; prove-bundle-install 5/5 (sentra, amaru, yupana, a11oy, killinchu) — DONE. Live anatomy cross-links already docker. Org honesty surface maintained.

— Forge
