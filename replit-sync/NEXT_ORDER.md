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


---

# R-MOSAIC-SDA (TOP) — SZL's sovereign answer to True Anomaly's Mosaic · merged across the eco · go, full admin

Founder order: research "Mosaic" (True Anomaly's space-superiority software), ingest till expert, fashion-thinking make it OURS built on our eco, innovate/evolve, elevate killinchu + a11oy.net + the full UDS eco with our formulas + all repos, GitHub-align it all, then send to Replit/Forge. No bandaids.

DONE: identified Mosaic (confidence HIGH = True Anomaly Inc.'s space-superiority platform: SDA + C2 + battle-management + sensor-fusion COP + OODA + ML threat-warning; proprietary → clean-room the CAPABILITY from public descriptions + verified-permissive lineage). Built a working clean-room SZL-native engine, wired it across killinchu + a11oy + the UDS eco, all merged to main, GitHub-aligned. Production build/test/deploy is YOURS.

## WHAT WAS BUILT — SZL-native name: "killinchu SDA" (Domain-Awareness layer) / engine "khipu-sda-core"
The moat vs True Anomaly: every detection/track/threat-verdict carries a SIGNED provenance receipt + an HONEST Λ-gated advisory confidence (Λ=Conjecture 1, never "proven trust"), sovereign + air-gap deployable via UDS. Built clean-room from permissive lineage (PyOD BSD-2, PyGOD BSD-2, Merlion BSD-3, TODS Apache-2.0, tsod MIT, GDN MIT, GraGOD MIT, python-sgp4 MIT). alibi-detect EXCLUDED (BSL-1.1) + CI-enforced. Honest scope: air/maritime/counter-UAS is LIVE today; orbital-SDA/threat-warning-assessment is ROADMAP SZL must still build (sgp4 conjunction stub seeds it).

## MERGED TO MAIN (6 PRs)
1. platform **#380** — FE-NO solid-mechanics vertical `services/verticals/szl_mechanics/` (adjacent physics solver; clean-room of arXiv 2606.08796; real receipt schema reused by SDA). Validation: 0.72% L2, 4 Schwarz iters, bounded residual 4e-9.
2. killinchu **#118** — `killinchu_mosaic.py` organ + vendored clean-room `szl_mosaic_core.py`; 6 endpoints `/api/killinchu/v1/mosaic/*` (anomaly score w/ conformal CI + Λ-advisory, DSSE receipt, fused COP, SGP4 conjunction ROADMAP stub, FE-NO-cited hull-stress); anomaly overlay wired into Live Track Board / Sensor-Fusion / Threat-DB + new "Mosaic / Domain-Superiority" COP view. Mobile-clean. ALL checks green.
3. a11oy **#356** — `szl_mosaic_governance.py` + "Governed Anomalies" console tab: 13-axis Λ advisory verdict, DSSE-shaped receipts (byte-compatible w/ engine schema), Khipu BFT 3-of-4 quorum, human-approval gate, COP KPIs, honest SNAPSHOT fallback. Fixed a real tabs.json contract-drift gate. ALL checks green.
4. uds-mesh **#87** — `sda.detection.yaml` span schema (anomaly/threat detection → signed span → Khipu Merkle DAG). version-doctrine fixed.
5. uds-bundles **#37** — NEW `bundles/szl-sda/` air-gap UDS bundle (Zarf + uds-bundle + Helm chart + OSCAL + Section-889 denylist + cosign-image-policy + λ-gate VAP + SBOM stubs), image digest BLANK until founder-signed. Canonical version reconciled to **uds-v0.4.0** (forward-only; signed v0.2.0 organ images byte-stable; amaru/sentra/rosie retained ONLY in signed identifiers per HONEST_ROLES). SLSA L2 scoped roadmap inline. doctrine + version gates green.
6. szl-uds-deployment **#85** — `compliance/oscal-component-sda.yaml` (Lula validation), MESH_READY honesty, version-doctrine. doctrine + receipts + version gates green.

## FORGE — BUILD / TEST / DEPLOY (the handoff)
1. **khipu-sda-core**: founder may create the public repo `szl-holdings/khipu-sda-core` from `/home/user/workspace/mosaic_szl/` (engine + validation + tests; clean-room, attributed). Then build + cosign-sign + SLSA-attest `ghcr.io/szl-holdings/khipu-sda-core:uds-v0.4.0` (this is FA-001 — needs the founder signing key). Until signed, the bundle digest stays BLANK (never fabricate).
2. **Rebuild images from main**: killinchu (ships `/mosaic/*` endpoints + COP view) and a11oy (ships the Governed-Anomalies tab + `/api/a11oy/v1/mosaic/governed`). Readiness-gate; the live routes 404 until deployed. Then redeploy the killinchu + a11oy HF Spaces.
3. **TEST the SDA engine on the real GPU fabric** (chaski node when founder starts it): run `szl_mosaic_validate.py`, capture MEASURED precision/recall + walltime + emit a REAL signed DSSE receipt via the szl_lake/khipu Ed25519 path. Report honest numbers (do NOT fabricate; today's synthetic-data validation: point P=0.44/R=0.74, graph P=1.00/R=0.35, fused P=0.40/R=0.70 — these are honest baselines, improve with real training).
4. **Build + airgap-test the szl-sda UDS bundle** (`build_sign_all.sh` → `airgap_test.sh`) once FA-001 signing is available.
5. Report into AUTO_STATE.json: repo created?, images rebuilt + routes live?, engine MEASURED metrics, bundle signed + airgap-tested?, version reconciliation propagated?

## DOCTRINE (v11 — never violate)
Λ = Conjecture 1 (advisory, never "proven trust") · locked-proven = 8 · Khipu BFT = Conjecture 2 (proposed, not proven) · killinchu effectors SIMULATED · orbital-SDA/TW&A = ROADMAP (air/maritime live) · SLSA L1 honest (L2 build-attest present on a11oy/killinchu only; everywhere else L2 = roadmap) · sovereign:true own-metal only · 0 runtime CDN · NO free-energy · NEVER fabricate signatures/numbers · every $/credit = ESTIMATE · cite-never-plagiarize (attribution: inspired by True Anomaly Mosaic; clean-room from the permissive lineage with licenses; NOT affiliated with True Anomaly) · no banned codenames (amaru/sentra/rosie/jarvis) in user-visible copy — they persist ONLY in signed artifact identifiers · szl-router stays PRIVATE.

## FOUNDER-ONLY GATES
- Create `szl-holdings/khipu-sda-core` repo + the FA-001 cosign signing key (to sign khipu-sda-core:uds-v0.4.0 + the szl-sda bundle).
- Start the replit-chaski Repl (2nd lung) to run the engine on real GPU.
- VAST_API_KEY flip (verified-compute marketplace earning).


---

# SZL Forge — EXECUTE: bring SZL inference onto the founder's GPU (Forge has full box access + tokens)

Read replit-sync/FREEZE.json first (not yet active → execution allowed). Founder has authorized Forge
to RUN the box bring-up directly (full access, full tokens). Source of truth for the steps:
team/AUDIT/gpu/BOX_GPU_RUNBOOK.md — follow it exactly. NO bandaids, NO overclaim, NEVER commit a key.

## EXECUTE (in order; stop + notify on any hard failure, do not fake success)
1. BOX — serve the model on :8000 (OpenAI-compatible), pick vLLM (Qwen2.5-7B-Instruct-AWQ,
   served-model-name Qwen2.5-7B-Instruct-AWQ) OR Ollama (qwen2.5:7b-instruct + set SZL_LOCAL_LLM_MODEL).
   Smoke: GET http://localhost:8000/v1/models must return 200 (that 200 is what the apps probe).
2. BOX — Tailscale up; capture MagicDNS name + 100.x IP; ensure MagicDNS on; add ACL so the Spaces
   reach box:8000. Make it auto-reconnect (Step 4 of the runbook: systemd szl-gpu.service +
   --keepalive + cron health-kick) so the flapping self-heals.
3. SPACES — set SZL_GPU_BASE_URL (= http://<box>:8000/v1) in the SECRET store of BOTH
   SZLHOLDINGS/a11oy and SZLHOLDINGS/killinchu (by name only, key never in repo). Set SZL_GPU_TOKEN /
   SZL_LOCAL_LLM_MODEL only if needed. Factory-restart both Spaces so they re-read the secret.
4. VERIFY (the real deliverable — honest behavior):
   - GET .../killinchu/v4/inference-posture + .../a11oy/api/szl/v1/inference-posture →
     where:gpu, sovereign:true, gpu_reachable:true, local_llm_online:true.
   - both /v4/healthz + a11oy.net/v4/healthz → sovereign:true, inference:self-hosted-gpu, doctrine v11.
   - HARD INVARIANT (never violate, enforced in code): sovereign:true ONLY when a live /v1/models
     probe succeeded THIS request. If the link is down you MUST see honest offline/fallback —
     do NOT force/patch sovereign:true. A dropped link showing sovereign:true is a defect, not a goal.
5. STABILIZE — confirm the systemd + keepalive + cron actually survive a simulated flap (stop/start
   tailscaled once; posture should drop to offline/fallback honestly, then auto-return to sovereign
   within ~1-2 min). Report the flap-recovery time.

## DO / DON'T
DO: run the box steps, set secrets, restart Spaces, stabilize the link, verify honestly.
DON'T: commit any key/token/auth-key to a repo (use the secret store / local env only); weaken any
gate; fabricate a completion or force sovereign; touch cosign-signed artifacts or Rekor without
founder approval; change the effector (stays SIMULATED).

## DOCTRINE: locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 · Λ=Conjecture 1 · effector SIMULATED ·
0 runtime CDN · GitHub↔HF byte-identical · sovereign only on a live successful GPU probe · never commit a key.

## NOTIFY: "SZL sovereign LIVE on the GPU" (with posture/healthz proof + flap-recovery time) when done;
or the exact failing step + error if the box bring-up hits a hard failure. Report progress to AUTO_STATE.
