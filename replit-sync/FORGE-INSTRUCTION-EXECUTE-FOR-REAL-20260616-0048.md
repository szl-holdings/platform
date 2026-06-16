# FORGE — EXECUTE FOR REAL (founder: "Forge is in full control, do it")

Founder 2026-06-15 20:47 ET: you have FULL CONTROL + full box+repo access. EXECUTE the box shell commands — do NOT write a "Plan/Decisions/DONE" narrative without a real live curl behind each DONE. The prior pass (8e836d1d) marked items DONE but the estate did not move (box still git_sha b73d7709, OMEN still timeout). That is the failure mode to avoid: narrated-DONE is forbidden; only a real curl proves DONE. Honest BLOCKED beats fake DONE.

Doctrine v11: locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17; Λ=Conjecture 1; never commit a key; never fused VRAM; orbital=ROADMAP; effectors SIMULATED.

## RUN THESE ON THE BOX (a11oy.net / 167.233.50.75), in order. Paste the REAL output into your forge-report.
1) REDEPLOY to current main:
   cd /opt/szl/a11oy && git fetch origin && git reset --hard origin/main
   GIT_SHA=$(git rev-parse HEAD)   # expect current a11oy main HEAD
   docker build --build-arg SZL_GIT_SHA="$GIT_SHA" --build-arg SZL_BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" -t a11oy:latest .
   # recreate the container with its existing env (reuse A11OY_* + HF_TOKEN + A11OY_ENERGY_ALLOW_STUB=0); re-press the energy operator.
   PROVE: curl -s https://a11oy.net/api/a11oy/v1/honest | grep git_sha  (must == GitHub HEAD)

2) OMEN + chaski env-pins (add to the container env, then restart):
   A11OY_GPU_NODE_OMEN_BETTERWITHAGE_IP=100.70.130.45
   A11OY_GPU_NODE_CHASKI_IP=100.102.173.88
   PROVE: curl -s https://a11oy.net/api/a11oy/v1/compute-pool-hardened  -> omen-betterwithage reachable:true (REAL probe). If the box cannot TCP-connect 100.70.130.45:11434, paste the failing `curl -v http://100.70.130.45:11434/api/tags` and report it as an honest tailnet-route block — do NOT bluff reachable.

3) COORDINATOR:
   fetch szl-router mesh_coordinator.py + docs/MESH_COORDINATOR.md; run it on the box port 11500; set A11OY_MODEL_BASE_URL=http://127.0.0.1:11500/v1; restart a11oy.
   PROVE: curl a /v1 chat/completions through the box -> response carries x-szl-serve-tier + served_by + sovereign honest; a down node is never claimed serving.

4) COSIGN (founder FA-001 key — if you do not have the key, mark BLOCKED-founder and stop here, do not fake): uds publish + cosign sign tawantin + szl-warhacker bundles; cosign verify --key .github/cosign.pub PASS.

## REPORT: per item DONE-with-curl / BLOCKED(exact failing command). gpu_nodes_reachable target 3. NEVER narrate DONE without a live curl. NEVER commit a key.
