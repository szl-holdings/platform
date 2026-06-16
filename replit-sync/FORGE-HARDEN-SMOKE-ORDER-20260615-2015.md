# FORGE ORDER — HARDEN + SMOKE-TEST THE NEW WORK (industry launch-readiness) — 2026-06-15 20:15 ET

Founder: "research what companies do to debug/harden/smoke the whole 9 yards ... do that to the new work ... push us." This applies Google-SRE / Netflix / Sigstore launch-hardening practices (full playbook: replit-sync/research/LAUNCH_HARDENING_PLAYBOOK.md if mirrored; source /home/user/workspace/research/LAUNCH_HARDENING_PLAYBOOK.md) to the new mesh + UDS + energy work. Doctrine v11: never fabricate a 200/joule/signature; reachable=REAL-PROBE-ONLY; NEVER claim fused VRAM (horizontal scale only); never commit a key; never touch lutar-lean; honest BLOCKED beats fake green; never weaken a CI gate. FREEZE now 2026-06-18 15:00 ET — these are hardening (additive/observability), land before freeze.

## SCOPE = the NEW work since today: 3-GPU mesh (rtx laptop travels / OMEN home 24/7 anchor / chaski), OMEN-anchor routing (PR #458 merged 8738a92), UDS bundle (published+keyless-signed oci://ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.3.0), energy lungs, governance backend, ~15 demo surfaces.

## TASK 1 — GOLDEN-PATH SMOKE SUITE (must run < 5 min, all green)
Create/confirm a box-resident smoke script `ops/smoke_warhacker.sh` that probes, records HTTP code + a content marker (not just 200 — catch SPA-shell/white-screen), and exits non-zero on any red:
- All demo box surfaces (the go/no-go list) + killinchu/elite.
- Energy truth: /energy/operator/status (running, stub_mode=false, joules MEASURED), /energy/ledger (chain ok), /energy/jtoken (label MEASURED).
- Mesh: /compute-pool gpu_nodes_reachable + each node reachable (REAL probe).
- For each web surface, grep the body for an expected marker (e.g. canvas id, page H1) so a 200-with-white-screen FAILS the smoke. WebGPU surfaces: confirm the JS has a navigator.gpu null-check fallback to a static image/video (add if missing — additive).
PROVE: paste a smoke run output (all green, runtime).

## TASK 2 — HEALTH/READINESS HARDENING
- Confirm /healthz (liveness) AND a /readyz (readiness — deps reachable) exist and are distinct. If /readyz is missing, add it (additive): returns 200 only when energy operator + at least one GPU lung + ledger are healthy; 503 otherwise (honest).
- Timeouts/retries/breaker on inter-node calls (box→GPU node Ollama): confirm a sane timeout (not infinite), bounded retries with backoff+jitter, and that a dead node yields a clean `offline` + failover to a live lung — never a hang. The box rate-limit must return honest 429 (not 500) under load.

## TASK 3 — GRACEFUL DEGRADATION (demo-gods insurance)
- Confirm the energy loop keeps breathing if the LAPTOP (rtx, traveling) drops: OMEN+chaski carry it; operator shows the dropped node `offline` cleanly, no alarm, no starve. TEST IT: simulate the laptop dropping (or temporarily remove it from the eligible set) and confirm jobs keep minting on the remaining lungs, then restore. Paste before/after operator/status.
- Confirm the dynamic resolver re-finds the laptop at a NEW IP when it reconnects (hostname-based) — critical for tomorrow's travel.

## TASK 4 — SUPPLY-CHAIN VERIFY (prove the signature like a defense auditor would)
The UDS bundle is keyless-signed via GitHub OIDC/Sigstore + SBOM-attested. PROVE it verifies (no key needed — this is verification, not signing):
- `cosign verify ghcr.io/szl-holdings/szl-uds-bundle:uds-v0.3.0 --certificate-identity-regexp '.*szl-holdings.*' --certificate-oidc-issuer https://token.actions.githubusercontent.com` → paste the real verify output.
- `cosign verify-attestation` for the SBOM → paste result.
- Save an OFFLINE verification bundle (the cert + sig + rekor proof) to ops/ so verification works even if the demo venue can't reach rekor.sigstore.dev. Paste the rekor tlog indices (we have 1829681791 sig + 1829686081 SBOM).
- Confirm prove-bundle-install (clean k3d) is GREEN; if its latest run isn't green, report the failing step.

## TASK 5 — OBSERVABILITY + DEMO WATCHDOG
- Confirm structured logs carry node_id for the mesh; /metrics exposes the 4 golden signals (latency, traffic, errors, saturation) for the box + each lung.
- Add `ops/demo_watchdog.sh` (30s loop) the founder can run on a 2nd screen during the demo: probes the surface + energy + mesh, prints a one-line GREEN/RED status, beeps on any RED. Paste a sample tick.

## TASK 6 — DEPENDENCY HARDENING (0 runtime CDN — doctrine)
- Scan all ~15 demo surfaces for runtime CDN/external dependencies (script/link/font/img to non-self hosts). Doctrine = 0 runtime CDN. Report any found; if any surface pulls an external JS/CSS/font at runtime, vendor it locally (additive feat/* PR) so the demo survives a flaky venue network. Paste the scan result.

## REPORT
Append a dated section to replit-sync/forge-perplexity-update-20260615.md + AUTO_STATE.json (`hardening` key) with per-task DONE/BLOCKED + real output. Honest doctrine v11. These are additive/observability/verification — none should weaken a gate or claim more than is true. If any task needs a founder machine step (e.g. OMEN), give the exact command and mark founder-gated.
