# Dev 3 — Elevate a-11-oy.com (Mosaic Governance Oversight)

**Identity:** Dev 3 (Opus 4.8, full-stack) · SZL Holdings (org `szl-holdings`)
**Branch:** `feat/mosaic-governance-oversight`
**PR:** [#356](https://github.com/szl-holdings/a11oy/pull/356) — `feat(mosaic): governance-over-anomalies + COP oversight surface in a11oy console`
**Status:** OPEN · `mergeable: MERGEABLE` (no conflicts) · `mergeStateStatus: BLOCKED` (awaiting human review approval — branch protection requires a review; **NOT** blocked by checks). **Did NOT `--admin` merge** (per instruction).
**Checks:** 43 PASS · 6 skipping · **0 failing**.
**Screenshot:** `/home/user/workspace/estate_audit/dev3_a11oy_mosaic.png` (390px) + `/home/user/workspace/estate_audit/dev3_a11oy_mosaic_ledger.png` (taller, shows approval gate + ledger).

---

## Goal

ELEVATE a-11-oy.com into the **governance-over-anomalies brain** + **Common-Operating-Picture (COP) oversight surface** for SZL's sovereign answer to True Anomaly's Mosaic. a11oy is the **orchestrator that governs killinchu's anomaly/SDA detections** — every detection passes through a Λ-advisory verdict, a signed (or honestly UNSIGNED) provenance receipt, a Khipu BFT multi-witness quorum, and (for high-impact ROE actions) a human-approval gate.

---

## What was built (additive, GitHub-aligned, mobile-elegant)

### Backend — `szl_mosaic_governance.py` (NEW, 253 lines, pure stdlib, no network)
- `register(app, ns="a11oy")` adds **`GET /api/a11oy/v1/mosaic/governed`**.
- `governed_view()` / `_snapshot()` return a **governed-anomaly COP view**:
  - **13-axis Λ advisory verdict** (`LAMBDA_AXES`): `allow` < 0.35, `advisory` < 0.65, `deny` ≥ 0.65 (`_ALLOW_THR=0.35`, `_DENY_THR=0.65`).
  - **DSSE-shaped signed provenance receipt**, schema `szl.mosaic.receipt/v1` — **shape byte-compatible** with Dev 1's `ProvenanceReceipt` (`/home/user/workspace/mosaic_szl/szl_mosaic_core.py`): `schema, inputs_sha256, track_id, timestep, detector_ensemble, component_scores, anomaly_score, confidence_interval, confidence_method, lambda_verdict, lambda_note, verified, walltime_s, signing, doctrine`.
  - **Khipu BFT 3-of-4** multi-witness quorum (Conjecture 2; `witnesses >= 3`).
  - **Conformal / bounded** confidence intervals.
  - **Human-approval gate** for high-impact ROE deny advisories (PENDING tracks `104`, `105`).
  - Honest **deterministic SNAPSHOT**: `source="snapshot"`, receipts `verified=false`, signing UNSIGNED. 6 tracks across air / maritime / orbital(roadmap) domains.
  - Self-test output: 6 tracks · verdicts `{allow:3, advisory:1, deny:2}` · quorum 5/6 · pending approvals `[104,105]`.

### Backend wiring — `serve.py`
- Additive `try/except` register block after the evidence-research block — imports `szl_mosaic_governance` and calls `register(app, ns="a11oy")`. On boot, stderr prints:
  `[a11oy] Mosaic governance registered: /api/a11oy/v1/mosaic/governed`
- Does **NOT** alter existing routing. Import test: **722 routes**, governed route present.

### Container — `Dockerfile`
- Added `szl_mosaic_governance.py` to the COPY line (after `szl_quantum_bio.py`). `dockerfile-copy-check` / `COPY/ADD sources exist` CI passes.

### Frontend — `pages/console.html` (CSS-first, 0 CDN, vendored fonts)
- New **"Governed Anomalies"** nav tab + `window.VIEWS['mzgov']` (badge `DOMAIN-SUPERIORITY OVERSIGHT · Λ ADVISORY · KHIPU 3-OF-4`), injected next to `nav-item[data-view="govern"]` (icon ◈).
- Fetches `/api/a11oy/v1/mosaic/governed` with **honest client-side SNAPSHOT fallback** on 404 (route not live until Forge deploys — see below).
- Renders: 5 COP KPIs (tracks fused / anomalies scored / Λ verdict mix / Khipu quorum / pending approvals), human-approval gate card (disabled "Approve (signed)" buttons for DENY·PENDING tracks 104/105), governed anomaly ledger (`.tbl-scroll`), and an honesty banner.
- Reuses existing `.kpi/.card/.row/.badge/.honesty/.tbl-scroll` classes — inherits the estate mobile floor.
- IIFE block markers: `(function mzGovTab(){` … `<!-- end governed-anomalies-mosaic-oversight -->`.

### Readiness harness — `tools/readiness-harness/gen_tabs_matrix.py` (+ regenerated `tabs.json`, `stress/stress-targets.json`)
- **Why:** a real backed tab MUST be contracted in the Tab Contract Matrix, else `Contract matrix + link gate` CI fails (`DRIFT: tabs.json is stale vs the console`).
- Registered `/api/a11oy/v1/mosaic/governed` in the ENDPOINT registry as a **derived/deterministic** governance surface (like `/v1/lambda`): `sla=None`, `citationsRequired=False`; `degradedRules.allowLabels` extended with `"snapshot"`/`"sample"` so the honest fallback is **never branded a lie**.
- Added `mosaic_governed` response schema (`anyKey: cop/receipts/lambda_axes/thresholds/doctrine/status/source`).
- Mapped tab `mzgov` → the governed endpoint in `TAB_ENDPOINTS` (real, non-static, contracted tab).
- Regeneration also reconciled **pre-existing registry drift** (chain/cuas/entangle/neuro/unified endpoints were already in the generator but their committed artifacts were stale).

---

## Honesty doctrine v11 — compliance

- Λ = **Conjecture 1** (advisory, never "proven trust") — stated in UI banner, receipt `lambda_note`, and code.
- Khipu BFT = **Conjecture 2** (open) — multi-witness quorum, not a proven theorem.
- Organs **EXPERIMENTAL**; SLSA L1 honest; **joules MEASURED only** (none claimed here); sovereign own-metal-only; **no free-energy**.
- **No fabricated live numbers** — snapshot is deterministic, `source="snapshot"`, `verified=false`, signing UNSIGNED.
- Every $/credit = ESTIMATE (none asserted here). Cite-never-plagiarize: clean-room, inspired only by **publicly described** True Anomaly Mosaic.
- **No banned codenames** in user-visible copy (amaru/sentra/rosie/jarvis); `szl-router` PRIVATE.
- **0 runtime CDN**, vendored Space Grotesk + JetBrains Mono.
- `Signed-off-by: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>` on both commits.
- Additive / CSS-first; serve.py routing and the drift guard intact.

---

## Tests (all PASS)

| Test | Result |
|---|---|
| `py_compile` (governance + serve + generator) | OK |
| `import serve` | OK — 722 routes, `/api/a11oy/v1/mosaic/governed` present |
| `node --check` (extracted console JS) | OK |
| shared-file **drift guard** (`a11oy` vs `killinchu`) | **0 blocking** — `OK: no un-allowed shared-file drift` |
| **Playwright @390px** | scrollW 390 · overflow **0px** · sub-12px fonts **0** · sub-44px taps **0** · pageErrors **0** · KPIs 5 · ledger rows 6 |
| **CI on PR #356** | 43 PASS · 6 skipping · **0 fail** (incl. `Contract matrix + link gate` PASS, `API probe ("Lies?" verdict)` PASS, `overclaim / Governed surfaces are honest` PASS, `Shared source files in sync with killinchu` PASS) |

> Note: the `console.html` is **not** a shared drift candidate (killinchu only copies `pages/integrations.html`); `serve.py` is in EXCLUDE_GLOBS + allow-list (accepted divergence). Earlier, a transient `__pycache__/*.pyc` artifact set (created by an `import serve` test) caused 32 false drift-guard blocks; cleaned and resolved — committed tree contains no bytecode.

---

## Live fabric (probed, honest)

- `GET https://a-11-oy.com/healthz` → `{"status":"ok","organ":"a11oy","doctrine":"v11","lock":"749/14/163","commit":"c7c0ba17"}`
- `GET https://a-11-oy.com/api/a11oy/v1/compute-pool` → multi-node fabric (live).
- `GET https://a-11-oy.com/api/a11oy/v1/mosaic/governed` → **404** (route not deployed to the live HF Space yet — console falls back to honest SNAPSHOT until Forge deploys).

---

## FORGE DEPLOY INSTRUCTION

**Deploy PR #356 to the live a11oy Hugging Face Space.** Two files carry the backend:

1. `szl_mosaic_governance.py` (NEW) — pure stdlib, no extra deps, no network.
2. `serve.py` (additive register block) — registers the route at import time.
   (`Dockerfile` already COPYs the new module.)

**On boot, confirm stderr shows:**
```
[a11oy] Mosaic governance registered: /api/a11oy/v1/mosaic/governed
```

**Post-deploy verification:**
```
curl -s https://a-11-oy.com/api/a11oy/v1/mosaic/governed | python3 -m json.tool
```
Expect top-level keys `cop, receipts, lambda_axes, thresholds, doctrine ("v11"), status, source`. Until the live engine is wired, `source` will be `"snapshot"` and receipts `verified:false` — that is the honest state; the console upgrades the badge automatically when the route returns live, verified data. To wire the **live** governed feed, point `governed_view()` at killinchu's Mosaic engine receipts (Dev 1's `szl.mosaic.receipt/v1`) instead of `_snapshot()`.

**Do NOT `--admin` merge** — PR #356 is `MERGEABLE` and awaits a human review approval (the only remaining gate; all checks green).

---

## Files (in `/tmp/mz_a11oy`, branch `feat/mosaic-governance-oversight`)

- NEW `szl_mosaic_governance.py`
- `serve.py` (additive register block)
- `Dockerfile` (COPY)
- `pages/console.html` (Governed Anomalies tab IIFE)
- `tools/readiness-harness/gen_tabs_matrix.py` (+ regenerated `tabs.json`, `stress/stress-targets.json`)

Commits (both `Signed-off-by: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>`):
- `82a8f08` feat(mosaic): governance-over-anomalies + COP oversight surface in a11oy console
- `74a4818` feat(mosaic): contract the Governed Anomalies tab in the readiness harness
