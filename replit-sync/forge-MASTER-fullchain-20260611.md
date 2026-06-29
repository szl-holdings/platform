# FORGE MASTER ORDER — Full Deployment-Chain Alignment (2026-06-11, T-5 to Warhacker)

**From:** CTO/Computer · **To:** Forge · **Priority:** make every surface current & coherent. NO BANDAIDS, full Series-A posture.

This order zooms out across the WHOLE chain: GitHub → Hugging Face → Hetzner/a-11-oy.com → killinchu → UDS deployment → UDS mesh. It records exactly what is ALREADY correct (so you don't redo it) and what is OUTSTANDING (with who-can-do-what).

---

## STATE OF THE ESTATE (verified live by CTO this session, 2026-06-11 ~19:40 UTC)

### ✅ ALREADY CORRECT — do not touch
- **GitHub→HF chain WORKS.** szl_scaling.py wired LIVE both apps; all 7 `/api/<ns>/v1/scaling/*` endpoints return 200 on BOTH a11oy + killinchu HF Spaces. Heartbeats invariant verified: mouse 0.02kg→1.495B beats == human 70kg→1.495B beats (the showpiece). 0 CDN, 0 codenames, byte-identical.
- **a11oy HF Space module-drift guard = GREEN** (re-verified; all COPY'd modules byte-identical GitHub↔HF via authoritative paths-info oid compare). Earlier transient reds were GitHub-API flakiness during rapid pushes, not real drift.
- **killinchu CI = fully GREEN** (the only churn is the founder-gated GHCR uds-v0.2.0 build, expected). Space RUNNING.
- **anatomy** refactored: 3D-first, decluttered, responsive desktop+mobile, investor-ready. Live + Playwright-verified. GitHub 539cc2df / HF 95476d57.
- **szl-uds-deployment repo = ALL GREEN** (20+ guards: cosign identity pin, receipt chain, SBOM, doctrine, version coherence, DNS drift, teardown, etc.). MESH_READY.md honest.
- **UDS mesh** `ghcr.io/szl-holdings/szl-mesh:0.4.0` VERIFIED-LIVE; killinchu-bundle:0.5.0 VERIFIED CURRENT. All 5 organ images published + cosign-signed (Fulcio/Rekor) + SLSA-attested at uds-v0.2.0. Honest scope held: organs deploy individually; cross-organ mTLS = v0.5.0 roadmap.
- **a-11-oy.com (Hetzner) is UP** (200; brain endpoint serving real gate composition; healthz doctrine v12 / deterministic_stub / T0-T6).

### 🔴 OUTSTANDING — ranked, no bandaids

**1. HETZNER IS STALE vs HF (founder-gated — needs you/root).**
`https://a-11-oy.com/api/a11oy/v1/scaling/summary` → **404** ("/v1/scaling/summary not found"), while the HF Space serves it 200. The Hetzner box has NOT been redeployed since the scaling-tab + recent module pushes. ACTION: run the a-11-oy.com autodeploy/rebuild on the box (box-scripts/a11oy-rebuild) so Hetzner pulls current main and serves the scaling endpoints + new console tab. Then re-verify `/api/a11oy/v1/scaling/summary` = 200 and the Scaling tab renders on a-11-oy.com/console. This is the single most visible "Hetzner properly" gap. Requires sudo on 167.233.50.75 → FORGE/founder.

**2. a11oy UDS bundle is STALE (env-gated — you CAN do).**
`a11oy-bundle:0.5.0` (sha256:d801f8e4…) was built against an OLD a11oy organ image; the organ image was rebuilt (sha256:99e4ded1…). RE-PUBLISH via `.github` workflow `uds-canonical-bundles-publish.yml` (bundle=a11oy), then re-verify the NEW digest BEFORE anyone deploys it. Update MESH_READY.md's a11oy-bundle digest line once re-published. (cosign re-sign of the bundle is the only sub-step that may need the founder key — flag it if so, do NOT self-sign.)

**3. platform CI reds (you CAN do — root-cause, not bandaid).**
On platform main head 7fb83da6 ("migrate otel-init template to OpenTelemetry JS 2.x"): RED on **CI, Build Check, E2E Tests, Trivy+Grype, dependabot otel-exporter-prometheus bump**. These are downstream of your own otel 2.x migration not yet completing green. ACTION: finish the otel 2.x migration so CI/Build/E2E pass (the exporter-prometheus dependabot bump #1408781345 likely needs the same 2.x API alignment); re-run Trivy+Grype after deps settle. Confirm Doctrine + Tests stay green (you already fixed those). No gate weakening.

**4. Hetzner currency guard (you CAN do — prevents recurrence).**
Add/confirm a lightweight CI or smoke-monitor check that compares a-11-oy.com's served module/endpoint set against the HF Space (e.g. assert `/api/a11oy/v1/scaling/summary` returns 200 on BOTH, or compare a build marker), so a stale Hetzner box trips a WARN instead of being discovered by hand. Honest WARN, not a hard gate (Hetzner redeploy is sudo-gated).

### 🟡 STILL FOUNDER-GATED (unchanged — itemize, never auto-do)
- Hetzner root redeploy (#1 above) · Zenodo DOI token for thesis v8 (CITATION.cff + .zenodo.json staged) · oqs-python PQ keys (PQ-provenance PROXY→real ML-DSA-65) · cosign/Rekor signing for uds-v0.3.0 re-sign · `SZL_LOCAL_LLM_URL` brain secret (flips Chaski stub→live) · any MAJOR dep bump.

---

## DOCTRINE (unchanged hard gate — honor on every push)
locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17. Λ uniqueness = Conjecture 1 (never theorem; conditional Theorem U fine). Khipu BFT = Conjecture 2. SZL-Φ / Λ-v5 = PROPOSED engineering gate, NOT formal Λ. SLSA never bare L3/FedRAMP/IronBank/CMMC/ATO without "roadmap". No user-visible codenames (amaru/rosie/sentra/jarvis — internal API-alias OK); agent surface = Chaski. Trust never 100%; 0 runtime CDN; no fabricated data (SAMPLE/SIMULATED/PROXY/NARRATIVE); killinchu effector SIMULATED; GitHub↔HF byte-identical on shared modules; ast.parse .py before push; NEVER commit a key; NEVER weaken a gate; no Lean self-merge of red/unverified proofs (founder merges Lean only).

## REPORTING
Append your results to `platform/replit-sync/forge-report-2026-06-11.md` (or a new dated report): per item — what you did, the verifying command/run-id, and any founder-gated sub-step you stopped at. For HF-served file changes, add the SYNC_STATUS.md entry per convention.
