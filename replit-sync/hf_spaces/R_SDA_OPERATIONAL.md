# R-SDA-OPERATIONAL (TOP) — make killinchu SDA / khipu-sda-core fully operational · full admin · green light · GO

Founder order: "Make this fully operational. Create the repo + signing, start chaski, do it if you can — else send instructions to Forge who has full access + green light." Status: I (agent) DID what admin allows; the rest is yours, Forge. Execute now.

## ALREADY DONE BY THE AGENT (no action needed)
- **Repo created + pushed:** `szl-holdings/khipu-sda-core` (PRIVATE — defensive IP; founder may flip public later). Contains the clean-room engine (szl_mosaic_core, szl_track_fusion, szl_sda_orbit, szl_sda_envelope, szl_confidence, szl_mosaic_validate), tests/, Apache-2.0 LICENSE, ATTRIBUTION.md + THIRD_PARTY_NOTICES, requirements.txt, and CI (pytest + a gate that FORBIDS alibi-detect (BSL-1.1) + a no-fabricated-signature gate).
- **Merged across the eco (6 PRs):** killinchu #118, a11oy #356, uds-mesh #87, uds-bundles #37 (szl-sda bundle, canonical uds-v0.4.0), szl-uds-deployment #85, platform #380 (FE-NO).
- Honest synthetic-data baselines today: point detector P=0.44/R=0.74, graph P=1.00/R=0.35, fused P=0.40/R=0.70 — REAL numbers, improve with real training (your step 4).

## FORGE — EXECUTE (you have full box access + the box-SSH/GitHub/HF credentials)
### 1. BUILD + SIGN the engine image (this is FA-001)
- Clone `szl-holdings/khipu-sda-core`, build `ghcr.io/szl-holdings/khipu-sda-core:uds-v0.4.0`.
- **cosign sign** + **cosign attest --type slsaprovenance** the image. Upload to Rekor. → this earns the SLSA L2 attestation that the szl-sda bundle's digest field is honestly BLANK waiting for. Populate the digest in `bundles/szl-sda/zarf.yaml` / `uds-bundle.yaml` + `khipu-sda-core.cosign-verify.txt` ONLY after the real signature exists. NEVER fabricate a digest or signature.
- **FOUNDER GATE if you lack the cosign signing key:** if the FA-001 signing key isn't in your secret store, STOP at sign, report `needs: cosign signing key (FA-001)` in AUTO_STATE.json, and leave the digest blank. Do NOT fake it.

### 2. REBUILD + DEPLOY the product images FROM MAIN (readiness-gated)
- **killinchu** image from main → ships `/api/killinchu/v1/mosaic/*` (anomaly score, receipt, COP, conjunction stub, hull-stress) + the new Mosaic/Domain-Superiority COP view. After deploy GET those endpoints → confirm 200 + honest Λ-advisory verdicts. Redeploy the killinchu HF Space.
- **a11oy** image from main → ships `/api/a11oy/v1/mosaic/governed` + the Governed-Anomalies console tab. Confirm 200; redeploy the a11oy HF Space. (These routes 404 until you deploy — that's expected.)

### 3. PUSH the new SDA HF Space
- A static surface source will be in `replit-sync/hf_spaces/hf_sda_space/` — push it to a new HF static space **SZLHOLDINGS/sda** (sdk: static, app_file: index.html). Confirm 200 + the COP visual renders.

### 4. TRAIN on real data + capture MEASURED metrics (on the GPU fabric)
- Run `szl_mosaic_validate.py` on the real fabric; train the detectors/Point-graph on a real multi-track dataset (start with any real sensor/track logs available; else a higher-fidelity simulated set). Capture MEASURED precision/recall/F1 + walltime + emit a REAL signed DSSE receipt via the szl_lake/khipu Ed25519 path. Report the real numbers — do NOT fabricate; replace the synthetic baselines honestly.
- **FOUNDER GATE:** real-GPU runs need the **chaski Repl started** (2nd SAMAY lung, 100.76.58.50 — needs the Replit boot credential you lack). If chaski is offline, run on rtx-betterwithage (the live sovereign node) and report; flag `needs: founder start chaski Repl` for the orbital/scale runs.

### 5. BUILD + AIRGAP-TEST the szl-sda UDS bundle
- `build_sign_all.sh` → `airgap_test.sh` for `bundles/szl-sda/`. Confirm the bundle deploys air-gapped, the cosign-image-policy + λ-gate VAP + Section-889 denylist apply, and a detection emits a signed span onto the Khipu DAG (uds-mesh `sda.detection.yaml`). Same FA-001 signing gate as step 1.

### 6. VAST_API_KEY (verified-compute marketplace) — FOUNDER GATE
- Listing SDA solves as verified-compute on the marketplace needs the founder's `VAST_API_KEY`. Do NOT attempt earning without it. Flag `needs: VAST_API_KEY` when everything else is green.

## DOCTRINE (v11 — never violate)
Λ = Conjecture 1 (advisory, never "proven trust") · locked-proven = 8 · Khipu BFT = Conjecture 2 · killinchu effectors SIMULATED · orbital-SDA/TW&A = ROADMAP (air/maritime/counter-UAS live) · SLSA L1 honest (L2 = roadmap until step 1 signs it) · sovereign:true own-metal only · 0 runtime CDN · NO free-energy · NEVER fabricate signatures/digests/numbers · every $/credit = ESTIMATE · cite-never-plagiarize (inspired by True Anomaly Mosaic, NOT affiliated; clean-room from permissive lineage; alibi-detect BSL excluded) · no banned codenames (amaru/sentra/rosie/jarvis) in user-visible copy · szl-router PRIVATE.

## REPORT into AUTO_STATE.json
repo built+signed? (or needs cosign key) · killinchu+a11oy images rebuilt + routes live? · SDA HF space pushed? · MEASURED metrics from real/fabric run (or needs chaski) · szl-sda bundle airgap-tested? · marketplace (needs VAST_API_KEY). Anything you can't do = a clear `needs:` line, never a fake.
