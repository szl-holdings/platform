# FOUNDER ACTION LIST — unblock the rest — 2026-06-12

The estate is code-complete (Forge's recon: zero TODO/FIXME, all 18 agent tools real, every "gap" an honest label). The CTO agent has executed everything closeable with GitHub admin. **What remains is credentials + ops that only you (or Forge with your keys) can provide** — none of it is missing code. Ranked by demo impact. Each is a secret/env or a gated ops flip; the CTO agent cannot set HF-Space/Hetzner secrets or hold private keys.

> Honest boundary: the agent has GitHub org admin (merges, CI, code) but NOT the HF Space secret store, the Hetzner box, the cosign private key, or third-party API keys. Those are below.

## DONE already (no action) — for context
- Chronic **Operational Validation** CI red → FIXED + merged (a11oy #321: removed-Node-flag + stale deploy manifest). a11oy board now all-green.
- GPU brain label (#319) + embeddings backend probe (#320) shipped — both flip to live on a pure env switch (below).
- lutar-lean #234/#235 merged by Forge (honest; Λ stays Conjecture 1, locked=8).

## TIER 1 — biggest visible jump, lowest effort
1. **GPU sovereign brain** (the #1 "wow"): on the a11oy deployment set
   `A11OY_MODEL_BASE_URL=http://127.0.0.1:8000/v1` + `A11OY_GPU_TOKEN=<vLLM key>`, restart.
   Forge has the RTX 5000 vLLM bring-up script (`replit-sync/forge_gpu_bringup.py`). Verify: `/api/a11oy/v1/code/health` → `inference: self-hosted-gpu`.
2. **GPU embeddings** (live vertical semantic search): set
   `A11OY_EMBED_BASE_URL=http://127.0.0.1:8001/v1` + `A11OY_EMBED_MODEL=BAAI/bge-large-en-v1.5` + `A11OY_EMBED_TOKEN=<key>`.
   Verify: `/api/a11oy/v1/alloy-embed-fabric/health` → `backend.kind: self-hosted-gpu, reachable: true`.
3. **Cosign signing key → non-repudiable receipts** (HARD-LIMIT: founder approves key handling; inject as secret, NEVER commit):
   `SZL_COSIGN_PRIVATE_KEY_PEM` (a11oy receipts) and/or `COSIGN_ECDSA_KEY` (UDS). Flips every `DSSE_PLACEHOLDER` to a Rekor-verifiable signature.

## TIER 2 — light up cross-organ tools (env only, code already honest)
4. On the a11oy deployment set `AMARU_BASE`, `SENTRA_BASE`, `ROSIE_BASE`, `KILLINCHU_BASE` → activates `flagship_call`/`drone_command`/`app_command` (today honest `gap:true`). Code already reads these envs; no code change needed.
5. Scoped **GitHub token** as an a11oy Space secret (read + issues + PR on szl-holdings) → enables the live `github_read_file/open_issue/open_pr` demo (2-person-gated PR end-to-end).

## TIER 3 — cluster proofs (run on the tower; Forge)
6. Offline air-gap deploy proof: `cosign verify` + `verify-attestation` on `szl-uds-bundle:uds-v0.3.0` → cut cable → `uds deploy` → member `Available`.
7. Dispatch the cluster proof workflows (`Prove Bundle Install`, `Prove Organs`, `test-install/upgrade`, SSO proof) on the real cluster.
8. UDS cosign policy `warn → enforce` (HARD-LIMIT: founder confirms before any prod-facing ns).

## TIER 4 — supply-chain (fast-follow; mostly Forge/runtime)
9. liboqs/oqs-python in the image → PQC ROADMAP→LIVE.  10. Iron Bank base images (#164).  11. Wire D cross-mesh traceparent (needs ≥2 organs live — mesh/Hetzner).  12. HSM/KMS key custody.

## Doctrine (every item honors)
locked-proven = 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17; Λ = Conjecture 1; SLSA L1 honest; never commit a key; keep SAMPLE/SIMULATED labels until the real feed is wired; killinchu effector stays SIMULATED.

**Fastest path to a sovereign-GPU demo: items 1 + 2 (two env sets + restart on the box Forge already has).**
