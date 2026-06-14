# Dev 2 — killinchu Mosaic / Domain-Superiority elevation

**Agent:** Dev 2 (Opus 4.8, full-stack) · SZL Holdings (org `szl-holdings`)
**Date:** 2026-06-13
**Branch:** `feat/mosaic-sda-elevation`
**PR:** **#118** — https://github.com/szl-holdings/killinchu/pull/118
**Title:** `feat(mosaic): wire SZL-native anomaly/SDA engine + domain-superiority COP onto killinchu`
**State:** OPEN · **mergeable = MERGEABLE** · mergeState = BLOCKED (branch protection requires a human review approval — **NOT** admin-merged, per instruction)
**Diff:** +1355 / −0 across 5 files · **all CI checks GREEN**
**Screenshot:** `/home/user/workspace/estate_audit/dev2_killinchu_mosaic.png` (390px, Mosaic view, live endpoints)

---

## What shipped (ELEVATE — additive, GitHub-aligned, no bandaids)

SZL's sovereign answer to True Anomaly's **Mosaic**, built **ON** killinchu's existing flagship `/elite` console — not a rewrite, not polish.

### Backend (NEW organ)
- **`killinchu_mosaic.py`** (574 lines) — the Mosaic/Domain-Superiority organ. Registers under `/api/killinchu/v1/mosaic/*`:
  - `GET  /mosaic/health` — engine + doctrine status.
  - `POST /mosaic/score` — multivariate + graph anomaly **SCORE** per track, **bounded conformal confidence interval**, **Λ-advisory** verdict (allow / advisory / deny). Channels: speed, altitude, range, closing angle, side. Seed reference population.
  - `POST /mosaic/receipt` — **DSSE** signed provenance statement (real ECDSA-P256 when the cosign key is provisioned, else an **honest placeholder — never fabricated**); ties to `emit_receipt` / the Khipu BFT DAG.
  - `GET  /mosaic/cop` — fused **Common Operating Picture**: air + maritime LIVE-capable today, orbit = ROADMAP.
  - `GET  /mosaic/sda/conjunction` — **REAL** `python-sgp4` propagation over public demo TLEs (ISS + sample debris); honest ROADMAP skeleton when `sgp4` is absent (no conjunction fabricated).
  - `POST /mosaic/hull-stress` — Euler-Bernoulli hull-girder **ESTIMATE** for a flagged vessel; **cites** the SZL FE-NO solid-mechanics vertical (`platform: services/verticals/szl_mechanics`; method arXiv:2606.08796, CC BY 4.0). Returns bending moment, section modulus, max bending stress (MPa), utilisation, band.
  - **Pure-numpy fallback** (`_NumpyMosaicCore`: robust-z + PCA-autoencoder) matching Dev 1's engine contract, used when sklearn/torch are absent — endpoints never hard-fail.
- **`szl_mosaic_core.py`** (vendored, byte-identical to Dev 1's engine at `/home/user/workspace/mosaic_szl/szl_mosaic_core.py`) — clean-room anomaly ensemble (`RobustZScoreDetector`, `AutoencoderDetector`, `IsolationForestDetector`, `GraphDeviationDetector`), `conformal_interval`, `hash_inputs`, `ProvenanceReceipt`, `SZLMosaicCore(...).fit().score()` / `.lambda_verdict()` / `.emit_receipt()`.
- **`serve.py`** (MODIFIED) — `try/except import killinchu_mosaic as _mosaic; _mosaic.register(app, ns="killinchu", emit_receipt=_emit_receipt)` inserted right before the elite-console registration. Confirmed at boot: `[killinchu] Mosaic organ registered: [...6 routes...]`.
- **`Dockerfile`** (MODIFIED) — `COPY killinchu_mosaic.py szl_mosaic_core.py ./` + `RUN pip install --no-cache-dir "sgp4>=2.20" || true` (the `|| true` means a wheel hiccup never breaks the image — the engine falls back to the honest ROADMAP skeleton).

### Frontend (`killinchu_elite_console.py`, MODIFIED)
Additive post-hoc IIFE on the `VIEWS` object (the same proven mechanism as the putnam / innovation-wave patches — original render fns stay untouched, the block mutates `VIEWS` in place so the top-level `const VIEWS` dispatcher sees the new key):
- **Anomaly overlay** appended to **Live Track Board** (`tracks`), **Sensor-Fusion** (`fusion`), and **Threat-Class-DB** (`threats`): every track gets a live **score**, a **Λ-advisory** badge, a **confidence interval**, and a one-click **"verify receipt"** button that renders the signed DSSE provenance statement + Khipu node.
- New **"Mosaic / Domain-Superiority"** view (nav item injected next to the track board): the COP — fused domains, attribution banner, live anomaly overlay, SGP4 conjunction **ROADMAP** stub, FE-NO-cited hull-stress estimate.

---

## Honesty doctrine v11 — compliance

| Rule | Status |
|---|---|
| Λ = **Conjecture 1** (advisory allow/advisory/deny, never "proven trust") | ✓ labelled everywhere |
| Khipu BFT = **Conjecture 2** (proposed-not-proven) | ✓ labelled |
| Anomaly outputs are **ESTIMATES** with bounded conformal CI | ✓ |
| Effectors **SIMULATED** | ✓ stated |
| Space-domain = **ROADMAP** (today = counter-UAS / drone / vessel) | ✓ gold-flagged |
| **SLSA L1** honest | ✓ |
| **Never fabricate** live numbers (honest fallback / skeleton) | ✓ COP/SDA/overlay all show "unreachable — honest fallback" when the API is down; the hull-stress + SGP4 numbers are real computations |
| DSSE receipt — real ECDSA-P256 or **honest placeholder**, never a fake signature | ✓ |
| **cite-never-plagiarize** — inspired by True Anomaly **Mosaic**'s _public_ capability (https://www.trueanomaly.space/mosaic); **clean-room** engine from the permissive lineage (PyOD BSD-2, Merlion BSD-3, TODS Apache-2, tsod MIT, GDN MIT, PyGOD BSD-2, python-sgp4 MIT); **no proprietary code**; alibi-detect (BSL-1.1) deliberately NOT used | ✓ in-product banner + PR body |
| FE-NO citation (arXiv:2606.08796, CC BY 4.0; `services/verticals/szl_mechanics`) | ✓ |
| No banned codenames (amaru/sentra/rosie/jarvis) in **new** user-visible copy | ✓ (legacy nav data-views pre-exist and are out of scope) |
| Sovereign **0 runtime CDN**, system fonts | ✓ no new external requests |
| `Signed-off-by: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>` | ✓ DCO check passes |

---

## Tests (all green)

| Test | Result |
|---|---|
| `py_compile` (elite console, serve, killinchu_mosaic, szl_mosaic_core) | **PASS** |
| Full `serve:app` import + `[killinchu] Mosaic organ registered` | **PASS** |
| Endpoint smoke (score → adversary strike-run = deny; receipt; cop=3 domains; sgp4 sep≈10726 km; hull≈77 MPa within-envelope) | **PASS** |
| `node --check` on the embedded console `<script>` | **PASS** |
| Shared-file **drift guard** (`shared-file-drift-check.py`) | **PASS — blocking=0** |
| `dockerfile-copy-check.py` (154 sources) | **PASS** |
| Playwright @ 320/360/390/768 px — overflow=0, fonts≥12px, Mosaic taps≥44px, view renders | **PASS** |
| Playwright @ 390px with live local endpoints — COP 3 domains, SGP4 real sep, overlay 8 scored tracks | **PASS** (screenshot saved) |

CI on PR #118: Conventional-commit title lint, DCO sign-off, doctrine, overclaim/Theorem-U honesty, shared-source sync, COPY-sources, Gitleaks, TruffleHog, Trivy, Grype CVE gate, CodeQL — **all PASS**.

---

## Notes / known limits (honest)
- The console's `const BASE = 'https://szlholdings-killinchu.hf.space'` is intentional production config (same-origin on the Space). In local Playwright testing the calls were route-redirected to the local server to capture a live screenshot; in production on the HF Space they resolve same-origin to the new `/mosaic/*` endpoints landing in this PR.
- Hull-stress is an **ESTIMATE** (fast Euler-Bernoulli), not the receipt-verified FE-NO solve — the canonical solver lives in the platform monorepo (`services/verticals/szl_mechanics`), not importable from the killinchu HF Space; the view cites it and labels the estimate honestly. A TODO marks where to wire the canonical solve if the vertical is later vendored.
- `data/killinchu_backend.sqlite3` and `__pycache__/*.pyc` are runtime artifacts created when the server ran locally — deliberately **NOT** committed.

---

## Forge instruction

**For Forge (deploy/merge orchestrator):**

1. **Review & merge PR #118** (https://github.com/szl-holdings/killinchu/pull/118) — `feat/mosaic-sda-elevation` → `main`. All checks are green and the PR is MERGEABLE; it is BLOCKED only on the required human review approval. **Do NOT admin-merge** — obtain the review approval, then squash-or-merge per the killinchu house policy. Dev 2 did not self-approve or `--admin` merge.
2. **After merge, redeploy the killinchu HF Space** (`szlholdings-killinchu`) so the new `/api/killinchu/v1/mosaic/*` endpoints land. The Dockerfile already `COPY`s the two new modules and installs `sgp4` (`|| true`). Verify post-deploy:
   - `GET /api/killinchu/v1/mosaic/health` → `ok:true`.
   - `/elite` → the **"Mosaic / Domain-Superiority"** nav item appears; the COP, SDA stub, anomaly overlay, and hull-stress card render same-origin.
3. **Provision the cosign key** (`SZL_COSIGN_*`) on the Space if real DSSE ECDSA-P256 receipts are desired in production; absent it, receipts remain honest placeholders (no fake signatures) — acceptable per doctrine.
4. **Optional future work:** vendor the FE-NO `szl_mechanics` vertical (or expose it as an internal service) so `/mosaic/hull-stress` can call the canonical receipt-verified solve instead of the Euler-Bernoulli estimate; extend the SGP4 stub from demo TLEs to a live (cached, sovereign) catalog when the space-domain roadmap matures.
