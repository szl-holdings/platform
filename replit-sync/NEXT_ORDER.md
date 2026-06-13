# SZL Forge — ORDER: full alignment + maritime/GPU upgrades (Series-A push)

Read replit-sync/FREEZE.json FIRST and obey the freeze rule (below).

## CONTEXT (what just shipped — verify + keep aligned)
A 10+-Opus-dev wave shipped to killinchu (+ shared modules with a11oy):
- REAL live feeds: /feeds/aircraft (OpenSky+adsb.lol, theaters incl. China/Taiwan/SCS/ECS),
  /feeds/vessels (global AIS, 10 theaters, redundancy chain), /feeds/remoteid, /osint/intel (UN-1718+USGS).
- MARITIME INTEL: /maritime/{dark,spoof,riskarc,risk,forecast} (dark-fleet/AIS-spoof/going-dark
  detection + Λ governed risk score + vessel forecasting, advisory/human-on-loop, DSSE-signed).
- ASW (honest): /asw/{osint,forecast,negative-space} — OSINT-LIVE, FORECAST/INFERENCE labeled,
  NO fake sub tracks.
- 3D holographic maritime globe at /elite/globe + /jackin/globe (real tracks, China-Seas board).
- GPU ROUTING: shared operator_shell_v4.py now resolves LLM base from SZL_GPU_BASE_URL (Tailscale
  box GPU) with honest fallback + /inference-posture endpoints. Fails closed honestly when GPU down.
- CHAOS-001 fixed (/khipu/sign rejects garbage 4xx). locked=5→8 swept. v7→v11 swept. Pin Check green.

## YOUR ALIGNMENT JOB (keep the estate coherent)
1. GITHUB: confirm szl-holdings/killinchu + a11oy main are CI-green; the new maritime/ASW/globe/feeds
   modules are each in serve.py register + Dockerfile COPY + hf-sync.yml APP_FILES/on.push.paths
   (lockstep — a missing module in any of the three breaks the HF build). Fix any drift.
2. HF: confirm both Spaces RUNNING on the latest commit, byte-identical to GitHub for all shared
   szl_*.py + operator_shell_v4.py + a11oy_agent_loop.py + a11oy_org_rag.py + the new maritime/feeds
   modules. Re-mirror via workflow_dispatch if the per-push detect-gate skipped a module.
3. a11oy.net (box) — FOUNDER-GATED: do NOT touch. The founder runs BOX_GPU_RUNBOOK.md
   (team/AUDIT/gpu/) to bring up vLLM/Ollama + Tailscale + set SZL_GPU_BASE_URL secret in BOTH Spaces.
   Your part: once the secret is set, confirm /inference-posture flips to sovereign:true honestly.
4. killinchu: confirm the new /elite views + /jackin tabs all render; effector stays SIMULATED.

## UPGRADES TO CARRY (after freeze lifts / when founder approves)
- Promote Asia/chokepoint vessel theaters from SAMPLE→LIVE by adding SZL_AISSTREAM_API_KEY to the
  Space secret store (no code change). 
- Graduate HarvestBudgetWitness.lean (energy) from experimental branch to main (founder-gated, DO-NOT-MERGE tag).
- Author canonical .github DOCTRINE_V11.md (founder-gated); then the §N clause-ref sweep.
- Bundle-level SLSA attestation + air-gap proof run (founder-gated, see PROPOSALS.md).

## DOCTRINE HARD GATE (never violate)
locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 · Λ=Conjecture 1 (never "unique") · Khipu=Conjecture 2 ·
trust never 100% · SLSA "L1 honest · L2 attested · L3 roadmap" · no user-visible codenames · effector
SIMULATED human-on-loop · no vessel control · real data LIVE / projections FORECAST / SAMPLE labeled ·
0 runtime CDN · GitHub↔HF byte-identical · ast.parse/node --check before push · never commit a key · box=founder gate.

## FREEZE RULE
FREEZE.json activates 2026-06-16. BEFORE then: alignment + safe pushes allowed. FROM 06-16→06-19:
read-only; any change = hotfix requiring explicit founder approval. Report status to AUTO_STATE.
