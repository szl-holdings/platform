# Forge report — MASTER "GET IT ALL DONE" order

- **Order:** `FORGE-INSTRUCTION-MASTER-getitdone-20260614.md` (top of `NEXT_ORDER.md`, blob `8200a2f6`, pin commit `785493d0` 2026-06-14T10:25:20Z)
- **Doctrine:** v11 · PROVE-OR-DOWNGRADE (DONE only with a checkable artifact: pushed SHA / HTTP 200 from a named endpoint / verifying signature). Never fabricate.
- **Mode:** deploy-only · isolated sandbox (no live-GPU execution from here)

## Dispositions

### P0 — killinchu DOWN → ✅ DONE (PROVEN)
- `GET https://szlholdings-killinchu.hf.space/healthz` → **200** `{"status":"ok","organ":"killinchu","doctrine":"v11","commit":"c7c0ba17","lock":"749/14/163"}`
- `GET .../elite/mesh` → **200** (56799 bytes). Root `/` → 307 (expected redirect to /elite).
- No fix needed — Space recovered. (`killinchu.hf.space` 404 is a *different/non-existent* slug; canonical is `szlholdings-killinchu`.) `killinchu.com` = third-party squatter (TLS host mismatch) → P3 FOUNDER.

### P1.1 — energy/metrics (404 both surfaces) → 🟡 SHIPPED as draft PR (route done; live-MEASURED founder-gated)
- **Artifact:** draft **PR #362** https://github.com/szl-holdings/a11oy/pull/362 · commit `e2734b5`
- Adds additive `GET /api/a11oy/v1/energy/metrics` in `szl_energy_sovereign.register()` (Dockerfile-COPY'd + hf-synced → lands on both surfaces on merge).
- **Honest by construction:** `live_exporter` returns MEASURED watts ONLY when the on-box GPU exporter is emitting power.draw now, else `OFFLINE` (no number). `measured_snapshot` reads the REAL on-metal NVML `avg_power_w` from the latest **signed** physical-bounds cert (ed25519+cosign) — a measured FACT with provenance, satisfying the "real watt value" gate without inventing a live stream. `py_compile`+`ast.parse` clean.
- **Remaining (RECOMMENDED):** full per-receipt MEASURED-live joules is gated on the founder wiring a live power exporter (nvidia-smi power.draw / DCGM) on the sovereign GPU. Until then route is honestly OFFLINE-live + MEASURED-snapshot.

### P1.2 — pinn/certificates history → ✅ DONE on box; 🟡 HF pending its own rebuild
- `GET https://a-11-oy.com/api/a11oy/v1/pinn/certificates` → **200**, real signed content-addressed history: `count:1`, `cert_sha256:586cc6cd…`, `label:MEASURED`, `signature_types:[ed25519_onmetal,cosign_anchored]`, `energy_joules_derived:5112.38`.
- Route is on `main` (`szl_pinn_bounds.py` `_h_certificates`/register) AND byte-identical on the HF Space (35615 bytes); serve.py registers it; Dockerfile COPYs it. HF still 404s **only** because the Space stage is `RUNNING_BUILDING` (serving a stale image, lastModified 10:24:25Z). No code action remains — it serves on build completion.

### P1.3 — 2D-heat + Burgers PINN solves → 🟦 RECOMMENDED
- Requires a live GPU solve on betterwithage; not executable/verifiable from the isolated sandbox. Scaffold exists (`run_measured_pinn.py`, `forge_pinn_measure.py`). Needs a founder/box-side run that emits a real per-round rel-L2 artifact before DONE.

### P1.4 — chaski 2nd-GPU role-split → 🟥 BLOCKED
- `betterwithage 100.125.77.31:11434/api/tags` → **200**; `chaski 100.76.58.50:11434/api/tags` → **000 (asleep/unreachable)**. Gate "both /api/tags=200" is unmeetable; a remote rig cannot be woken from here (founder power-state). betterwithage remains the live sovereign GPU.

### P2 — rescind 15 artifact-less DONEs → 🟦 RESCINDED → RECOMMENDED
- The `actionable`/`delegated_to_agent` items (agent-loop, τ-bench, BFT quorum, active-flux, SZL-NEMO, auto-review, FABRO, GPU-QUANT, platform-dynamics, NEMO-posttrain, 2-GPU serve, NIM cloud, energy exporter, OSCAL) were marked done with **no checkable artifact** → honestly downgraded. Each needs its own draft PR + real artifact before DONE. `delegated_to_agent` cleared in AUTO_STATE.

### P3 — FOUNDER-only → 🟥 BLOCKED
- killinchu.com domain (squatter confirmed), `VAST_API_KEY`, free-credit app signups — founder action required; nothing an agent can prove.

## Summary
P0 ✅ proven · P1.2 ✅ box-proven (HF rebuild-pending) · P1.1 🟡 draft PR #362 · P1.3 🟦 recommended · P1.4 🟥 blocked (chaski asleep) · P2 🟦 rescinded · P3 🟥 founder. No fabricated DONEs.
