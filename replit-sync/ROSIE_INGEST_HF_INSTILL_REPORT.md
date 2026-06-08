# ROSIE INGEST + HF ASSETS INSTILL — FINAL REPORT

**Author:** Opus 4.8 (Dev3)
**Date:** 2026-06-08
**Scope:** Two unification jobs (Rosie→Operator ingest; HF org-asset instill) + a cleanup proposal, for SZL Holdings.
**Status:** ✅ COMPLETE — both apps deployed byte-identical (GitHub ↔ HF) and live-verified in a real browser.

---

## Executive summary
1. **JOB 1 — Rosie ingest:** The 3D infra-viz from HF Space `betterwithage/rosie-3d` is now ingested into **a11oy** as the **Operator organ** — a self-contained 3D infrastructure-topology surface at `/operator-organ`. Codename "rosie" is **NOT user-visible**; the surface is presented as **"Operator"**. Three.js is vendored in-image (0 runtime CDN). The `anatomy` Space needs no change (Operator already maps to the existing HATUN sovereign-orchestrator node).
2. **JOB 2 — HF asset instill:** A canonical manifest (`team/HF_ASSET_MANIFEST.json`) maps every org model/dataset/collection → what it is, which app+tab, and a real resolve URL. A new app-agnostic backend module (`a11oy_hf_assets.py`) serves Knowledge/Brain/Evidence/RAG asset data by fetching the real HF datasets **server-side** with an honest `live | cached | pending` degrade. Instilled into **both** a11oy and killinchu.
3. **JOB 3 — Cleanup proposal:** `team/CLEANUP_PROPOSAL.md` lists showpiece Spaces safe to delete (incl. `rosie-3d` after verification) and redundant/superseded datasets. **No deletions performed** — parent/founder handles those.

All work is **ADDITIVE** — I did NOT edit `pages/console.html` or any existing `serve.py` route block (those are owned by Dev1/Dev2). Coordination noted in `team/A11OY_BUILD_COORD.md`.

---

## JOB 1 — Operator organ (Rosie ingest)

### What was ingested
- **Source:** `betterwithage/rosie-3d` (3D infrastructure visualization).
- **Surface:** honest 3D topology of the governed platform — an **Operator core** orchestrating 6 service nodes: Trust Gate, Reasoning Cortex, Receipt Bus, Telemetry Spans, Service Mesh, Fleet C2. Live health, FPS, UTC clock, orbit/zoom controls.

### Files (a11oy)
| File | Action | Role |
|------|--------|------|
| `a11oy_operator_organ.py` | NEW | Backend organ. `register(app, ns="a11oy")`. Serves `/operator-organ`, `/operator-organ/app.js`, `/operator-organ/topology.json`. Honest 6-node topology + Operator core. Front-moves routes to win over SPA catch-all. Container+local path resolution. |
| `static/a11oy_operator_organ.js` | NEW (14060 bytes) | 3D infra-topology viz. Three.js r160 **vendored** via import map `{"three":"/hero/vendor3d/three.module.min.js",...}`. a11oy gold palette (`--gold:#c9b787`). 0 CDN. |
| `pages/operator_organ.html` | NEW | Operator page, gold style, import map. Title: "Operator — Live Infrastructure Topology · a11oy". |
| `serve.py` | EDITED (additive) | TWO try/except `register()` calls appended at END of file (~L5432 Operator organ, ~L5452 HF assets). **NOT route-block edits** — same pattern Dev1/Dev2 use. |
| `Dockerfile` | EDITED (additive) | COPY lines for the two `.py` modules + the `.js` (~L80–83). HTML copied via existing `COPY pages/`. |

### anatomy decision
**NO CHANGE.** The Operator role already = the existing **HATUN** node ("sovereign orchestrator + seal"). Adding a new node would be redundant and would break the Quechua-identity design. anatomy `app.js` renders `o.quechua`/`o.fn` (not internal `o.key`), so internal keys are non-visible. anatomy Space sha `f30a5bf` unchanged.
- **Flag to parent:** a latent, **non-rendered** string `'szl-sentra (egress)'` exists in anatomy `data.js` `SKELETON_REPOS.appendicular`. It is not drawn (the 3D bones are generated from a count, not these strings) and the `szl-sentra` repo is 404/removed. I did NOT edit it unprompted — flagging for parent to decide.

---

## JOB 2 — HF asset instill

### Canonical manifest — `team/HF_ASSET_MANIFEST.json` (20,550 bytes, valid JSON)
- `_meta`: title, author, hf_org=`SZLHOLDINGS`, resolve patterns, counts, doctrine block.
- **28 datasets + 3 models + 14 collections.** Each entry: `what`, `a11oy` tab, `killinchu` tab, real `resolve` URL(s), and wiring note where applicable.
- Doctrine embedded: locked = {F1,F11,F12,F18,F19}; Λ=Conjecture 1; SLSA "L1 honest; L2 build-attestation present; L2-verified/L3=roadmap"; banned user-visible codenames {amaru,sentra,rosie,jarvis}; runtime_cdn=0.

### Backend module — `a11oy_hf_assets.py` (app-agnostic via `ns` param)
- Routes: `/api/<ns>/v1/assets/manifest` + `/api/<ns>/v1/assets/{key}`.
- **13 canonical assets:** rag-corpus, lean-proofs, canonical-formulas, thesis-formula-index, lean-theorem-tree, lake-receipts, evidence, governance-receipts, spans-receipts, k-verify, yuyay-axis-labels, doctrine, thesis-corpus.
- **Server-side fetch** of real HF dataset files via resolve URLs (256 KB cap), honest degrade `live | cached | pending`, 4 KB preview cache.
- Front-moves its routes (wins over `/api/<ns>/{path}` proxy + SPA catch-all).
- Instilled into **a11oy** (ns="a11oy") and **killinchu** (ns="killinchu", byte-identical module copy) — wired to Knowledge/Brain/Evidence/RAG (a11oy) and Knowledge & Formulas / Evidence (killinchu) per `UNIFICATION_FORMULA_ORGAN_MAP.md` + `UNIFICATION_CAPABILITY_TAB_MAP.md`.

### killinchu files
| File | Action |
|------|--------|
| `a11oy_hf_assets.py` | NEW (byte-identical copy; registered ns="killinchu") |
| `serve.py` | EDITED (additive) — one register block ~L2956, after "END: OPERATIONAL CONTROL SURFACES — killinchu" marker, before ENTRYPOINT |
| `Dockerfile` | EDITED (additive) — one COPY ~L73 |

---

## Deploy — byte-identical GitHub ↔ HF

| App | GitHub (`szl-holdings/*`) | HF Space (`SZLHOLDINGS/*`) | Byte-identical |
|-----|--------------------------|---------------------------|----------------|
| a11oy | commit `99c95b2` (6 files, 745 insertions) | Space commit `89bf0945`, RUNNING | ✅ sha256 verified on all 6 files |
| killinchu | commit `4f1dd62` (parent `7ccf906`; 3 files, 204 insertions) | Space commit `cd57edbb`, RUNNING | ✅ sha256 verified on all 3 files |
| anatomy | (unchanged) | sha `f30a5bf`, unchanged | n/a |

- Both Spaces RUNNING on cpu-basic. Pushes succeeded (branch-protection "verified signatures" advisories are informational only; pushes confirmed).
- CRLF-churn files (`infra/hatun-mcp/.../PROOF_TRANSCRIPT.txt`, `runtime/ouroboros/docs/audit/szl-government-readiness.md`, `runtime/.../a11oy-ultimate-replit-payload.v6.json`) were **never staged** — they show as modified only due to `.gitattributes eol:lf` normalization, not my changes.

---

## Validation gates — ALL PASS

| Gate | Result |
|------|--------|
| Python syntax (`ast.parse` on serve.py + modules) | PASS |
| `register()` resolves + front-move wins over SPA/proxy (TestClient, stub catch-all) | PASS — no SPA leak |
| Doctrine: locked = EXACTLY 5 {F1,F11,F12,F18,F19} | PASS (in topology footer, manifest, asset doctrine block) |
| Λ = Conjecture 1 | PASS |
| No user-visible banned codenames (amaru/sentra/rosie/jarvis); rosie→Operator | PASS — rendered Operator page contains NO 'rosie' string |
| 0 runtime CDN (Three.js vendored) | PASS — import map points to in-image `/hero/vendor3d/` |
| CI doctrine-grep (marketing words + banned strings) | PASS — my files clean |
| dockerfile-copy-guard (every COPY source exists) | PASS |
| No fabricated data | PASS — asset previews are real server-side HF fetches |

---

## Eyes-on LIVE verification (real browser, Playwright)

Performed against the **live** RUNNING HF Spaces, not local copies. Proof screenshots saved to `team/`.

| Check | Result | Proof |
|-------|--------|-------|
| a11oy `/operator-organ` | HTTP 200; title **"Operator — Live Infrastructure Topology · a11oy"**; 1 WebGL canvas (1600×900); 6-node 3D topology renders (gold Operator core + 6 green service nodes with live wires); footer "Doctrine v11 · locked-proven = 5 {F1,F11,F12,F18,F19} · Λ = Conjecture 1 · 0 runtime CDN"; **mentionsOperator=true, mentionsRosie=false**; health panel all 6 "live"; **0 console errors** | `proof_a11oy_operator_organ.png` |
| a11oy `/api/a11oy/v1/assets/manifest` | HTTP 200, 13 assets, doctrine block correct | `proof_a11oy_assets_manifest.png` |
| a11oy `/api/a11oy/v1/assets/rag-corpus` | `source:"live"`, `fetch_status:"live"`, real preview (BAAI/bge-base-en-v1.5, 768-dim, 762 chunks, per-organ FAISS) | `proof_a11oy_ragcorpus_live.png` |
| killinchu `/api/killinchu/v1/assets/manifest` | HTTP 200, 13 assets, org=SZLHOLDINGS, doctrine correct | (curl verified) |
| killinchu `/api/killinchu/v1/assets/lean-proofs` | `source:"live"`, real preview of actual `Lutar/Bound.lean` Lean 4 theorem; killinchu_tab="13-axis Λ / Edge Formulas" | `proof_killinchu_leanproofs_live.png` |
| killinchu `/api/killinchu/v1/assets/rag-corpus` | `source:"live"`, real preview; killinchu_tab="Knowledge & Formulas (edge RAG)" | (curl verified) |

**Negative checks confirmed clean:** no 'rosie' user-visible string on the rendered Operator page; no console/import errors (vendored Three.js loads, 0 CDN); no SPA-catch-all leak (routes resolve to my handlers); no fabricated previews (all `source:"live"`).

---

## JOB 3 — Cleanup proposal (deliverable: `team/CLEANUP_PROPOSAL.md`)
- **Showpiece Spaces safe to delete:** a11oy-staging, killinchu-staging, a11oy-mirror, khipu-constellation, operator-shell-demo, szl-papers-live, **rosie-3d (after this verification)**.
- **`betterwithage/rosie-3d` is now confirmed SAFE TO DELETE** — its 3D infra-viz capability is fully ingested as the Operator organ and live-verified above. Per doctrine I did **NOT** delete it; the parent/founder performs the deletion.
- **Redundant datasets:** `szl-payloads` (empty), `usb-bundle-v1` (superseded by `uds-bundles-v1`), `thesis-v18-formal-verification` (overlaps `thesis-corpus-v18`), `org-card-assets` (review candidate).
- Collections: sweep for orphaned/empty groupings after the Space deletions.

---

## Deliverables (in `team/`)
- `ROSIE_INGEST_HF_INSTILL_REPORT.md` (this file)
- `HF_ASSET_MANIFEST.json` (final, valid — 28 datasets + 3 models + 14 collections)
- `CLEANUP_PROPOSAL.md`
- Proof screenshots: `proof_a11oy_operator_organ.png`, `proof_a11oy_assets_manifest.png`, `proof_a11oy_ragcorpus_live.png`, `proof_killinchu_leanproofs_live.png`
- Coordination note appended to `A11OY_BUILD_COORD.md` (DEV 3 DEPLOY-DONE NOTE)

## Notes / flags for parent
1. **rosie-3d safe to delete** — verified. Parent executes deletion.
2. **anatomy latent string** — non-rendered `'szl-sentra (egress)'` in `data.js` `SKELETON_REPOS.appendicular`; repo is 404. Not user-visible; left unedited per "don't touch unprompted." Parent may scrub for hygiene.
3. **Branch-protection advisories** on GitHub push (verified-signatures) are informational; pushes succeeded.
4. All edits additive; Dev1/Dev2 must pull latest live `serve.py`/`Dockerfile` before their next deploy (my additive blocks are now present, no region overlap).
