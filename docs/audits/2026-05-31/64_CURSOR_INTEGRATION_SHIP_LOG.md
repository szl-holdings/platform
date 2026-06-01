# 64 — CURSOR RE-INSTILL · INTEGRATION SHIP LOG

**Session:** OPUS 4.8 — "Cursor re-instill + ship all"
**Date:** 2026-05-31 → 2026-06-01 (America/New_York)
**Mode:** ADDITIVE only · ZERO BANDAID · Doctrine v9 honest numbers everywhere
**Auth:** `HfApi.create_commit` with token at `.secret/hf_token` (never GitHub Actions secret)

---

## MASTER VERDICT TABLE

| # | Space | HF SHA (final) | Cursor PRs re-instilled | Smoke/Verify | Verdict |
|---|-------|----------------|-------------------------|--------------|---------|
| A | **a11oy** | `2380841141a5c7783f44dc66a63775fc42b61ba8` | 29 | 40/40 routes, healthz 200, 46 gates | 🟢 **GREEN** |
| B | **amaru** | `92164b8396ba250188281dbdeaa090c2bf0713c5` | 3 (#56/#55/#64) | battery 18/18, reasoner POST 200, 7 chakras | 🟢 **GREEN** |
| C | **sentra** | `a57bde9f529eafc916bb80d670c389d917514c2f` | 2 (#56/#65) | healthz/gates(8)/console 200, Wire B POST 200, forecast endpoints 200 (honest partial) | 🟢 **GREEN** |
| D | **vessels** | `a4452a2e04966b9ea6bed9aee0658b4f7641bf59` | 3 (#41/#51/#52) | 7 dashboard routes 200, fleet API w/ MMSI+IMO, health 200 | 🟢 **GREEN** |
| E | **rosie** | `29deb433fcf288af441e34596c07e10a35e93fb2` | 2 (#32/#39) | 11 tabitems (7 primary + 4 reasoner), SPDX header, config v9 | 🟢 **GREEN** |
| F | **uds-demo** | `bc5fa292356082e6498352fdd24bea51042780e6` | 3 (#31/#45/#44) | 18 mesh mentions, all 5 organs, body_graph 200, v9 markers | 🟢 **GREEN** |
| G | **README** (org card) | `3d6989a551f7a5917741749d92146f8ead3f0e2e` | 15 (recorded provenance) | zero banned tokens, v9 numbers live, banner+5 avatars+emoji preserved | 🟢 **GREEN** |

**MASTER VERDICT: 🟢 GREEN — 7/7 Spaces shipped and verified.**
**Total Cursor PRs re-instilled: 57** (29 + 3 + 2 + 3 + 2 + 3 + 15).

**Doctrine v9 honest numbers enforced everywhere:** 456 declarations / 14 unique axioms / 6 tracked sorries / 12 MCP tools / 46 policy gates / 44 anchor gates.
**HONESTY:** The v18 "zero sorry" claim was NOT propagated — there are 6 real tracked sorries (PACBayes.lean:265,281; MadhavaBound.lean:126,145; TwoWitness.lean:163; Uniqueness.lean:120).
**IP-HOLD PRs a11oy#57 / amaru#46 / sentra#45:** confirmed NOT in merged dataset — never touched.
**Founder-locked assets:** HF banner, 5 painterly hero avatars, animated emojis on org card — all preserved.

---

## A) a11oy — Λ-gate router

- **HF SHA:** `2380841141a5c7783f44dc66a63775fc42b61ba8`
- **Cursor PRs integrated (29):** full a11oy target set (ranks 1–29) including #134/#130/#75/#69/#83/#139/#123/#118/#136/#74/#94/#89/#127/#105/#93/#108/#133/#99/#119/#107/#111 and the remainder of the 29-PR a11oy bundle.
- **Files added:** additive `cursor/` evidence bundle + 3 new `serve.py` endpoints (registered BEFORE the catch-all route).
- **Smoke:** 40/40 routes 200, `/healthz` 200, **46 policy gates** confirmed. Doctrine numbers corrected to v9 throughout.
- **Screenshots:** `cursor_ship_screenshots/a11oy/` — landing, `/governance`, `/fabric`, `/investor-demo`.
- **Verdict:** 🟢 GREEN.

## B) amaru — memory cortex

- **HF SHA:** `92164b8396ba250188281dbdeaa090c2bf0713c5`
- **Cursor PRs integrated (3):** #56 (standalone web frontend + HF deploy), #55, #64.
- **Files added:** `cursor_reinstill.json` provenance manifest; doctrine corrections.
- **Smoke:** battery 18/18, reasoner `POST` 200, **7 chakras** present, Watunakuy routes intact.
- **Screenshots:** `cursor_ship_screenshots/amaru/` — console, console/reasoner, console/overwatch, console/watunakuy.
- **Verdict:** 🟢 GREEN.

## C) sentra — immune system / dual-use filter

- **HF SHA:** `a57bde9f529eafc916bb80d670c389d917514c2f`
- **Cursor PRs integrated (2):** #56 (dev-env, recorded), #65 (witnessed forecasting, INTEGRATED).
- **Files added:** vendored witnessed forecasting into `serve.py` as 3 new endpoints — `GET /api/sentra/v1/forecast` (info), `GET /api/sentra/v1/forecast/run` (query), `POST /api/sentra/v1/forecast` — all registered BEFORE catch-all `/{path:path}`. Also vendored `src/forecasts/witnessed.py` + `__init__.py`. Doctrine corrected in serve.py header, Dockerfile, README.md.
- **CRITICAL HONESTY:** forecast endpoints report `lean_status:"partial"`, `lean_sorry_lines:[126,145]` + honesty_note (MadhavaBound.lean carries 2 of the 6 sorries; NOT "zero sorry").
- **Smoke:** `/healthz`, `/gates` (8), `/console`, `/` all 200; Wire B inspect + verdict `POST` 200; forecast endpoints return JSON with correct Madhava math; Rosie widget present (53 root / 39 console); try-it anchor present; **no banned tokens**.
- **Screenshots:** `cursor_ship_screenshots/sentra/` — 01_landing, 02_console, 03_forecast_run, 04_forecast_info.
- **Verdict:** 🟢 GREEN.

## D) vessels — deployment fabric / maritime intelligence

- **HF SHA:** `a4452a2e04966b9ea6bed9aee0658b4f7641bf59`
- **Cursor PRs integrated (3):** #41 (dev-env, PRESENT), #51 (showcase link, PRESENT), #52 (URL fix, PRESENT).
- **Files added:** README doctrine corrections + `cursor_reinstill.json`.
- **Real API surface:** `/api/vessels/fleet` (4 vessels w/ MMSI + IMO + lat/lon), health, receipts, ops-core/snapshot, exceptions, voyage-economics, config/mapbox-token (`configured:false`, simulated AIS).
- **Smoke:** 7 dashboard routes 200 — `/dashboard`, `/dashboard/fleet`, `/dashboard/vessels`, `/dashboard/routes`, `/dashboard/alerts`, `/dashboard/audit-log`, `/dashboard/reports`. NOTE: `/fleet-map` is 404 by design; the real Fleet Map (Live AIS / Mapbox GL controls) renders at `/dashboard/fleet`. SPA routes live in `web/src/App.tsx`; deep dashboard routes lazy-hydrate.
- **Screenshots:** `cursor_ship_screenshots/vessels/` — 01_landing, 02_fleet_map_dashboard, 03_fleet_api_mmsi, 04_health_api.
- **Verdict:** 🟢 GREEN.

## E) rosie — operator console + Khipu DAG ingest (Gradio)

- **HF SHA:** `29deb433fcf288af441e34596c07e10a35e93fb2`
- **Cursor PRs integrated (2):** #32 (AGENTS, recorded), #39 (SPDX, INTEGRATED — added `SPDX-License-Identifier` header to `app.py`).
- **Files:** Gradio Space (`app.py` / `README.md` / `requirements.txt` only).
- **Tabs:** 7 primary + 4 reasoner sub-tabs = **11 tabitems** — Span Explorer, Receipt Verifier, Mesh Health, Doctrine Sweep, Live Formulas, About, Cross-Space Helper, + 🧠 Ask a11oy / 📜 Ledger / 🔐 Verify / ⚖️ Policy.
- **Doctrine corrections:** numbers fixed in `app.py` (renamed `DOCTRINE_V7_BANNED` → `DOCTRINE_V9_BANNED` — that list is LLM-slop phrases, not numbers) + README (tab count 6→7).
- **Verify:** `/config` JSON shows 11 tabitems, "456 decl", "Doctrine v9", no banned tokens. Rosie floating widget confirmed cross-Space (bottom-right on sentra, vessels, rosie console).
- **Screenshots:** `cursor_ship_screenshots/rosie/` — 01_console_7tabs, 02_config_v9, 03_console_alt, 04_hf_space_running.
- **Verdict:** 🟢 GREEN.

## F) uds-demo — the bridge (STATIC Space)

- **HF SHA:** `bc5fa292356082e6498352fdd24bea51042780e6`
- **Cursor PRs integrated (3):** uds-mesh #31 (AGENTS), #45 (SPDX), #44 (release-please) — all recorded as provenance (static Space ships HTML/CSS only).
- **IMPORTANT:** uds-demo is a STATIC Space served at `https://szlholdings-uds-demo.static.hf.space/index.html` (the plain `.hf.space` subdomain returns a 404 HF placeholder).
- **Files:** `index.html`, `README.md`, `style.css`, `assets/body_graph.png`, `.orig` backups (untouched), `.tests/`.
- **Doctrine corrections:** extensive v9 corrections to index.html + README (749→456, 168/163→6, 11 MCP→12 MCP, Doctrine v7→v9). Preserved TH10 honesty narrative (Conjecture 1, axiomatized at CAUCHY_ND, not a closed theorem).
- **NOTE:** `body_graph.png` still shows "Doctrine v6 · 0 violations" text baked INTO the painterly image — left untouched (founder-locked asset).
- **Verify:** 18 mesh mentions, all 5 organs present, `body_graph.png` 200, no banned tokens, v9 markers present.
- **Screenshots:** `cursor_ship_screenshots/uds-demo/` — 01_mesh_top_v9, 02_hf_space_running, 03_mesh_anatomy, 04_readme_v9.
- **Verdict:** 🟢 GREEN.

## G) README — organization card (STATIC org-card Space)

- **HF SHA:** `3d6989a551f7a5917741749d92146f8ead3f0e2e` (commit VERIFIED, Space Running)
- **Live HEAD prior:** d758f7d5 / packet 97b69bd8.
- **Cursor PRs (15, recorded as provenance):** coordination/SDK/AGENTS docs across source repos — szl-holdings/.github #74/#86/#97/#83/#82/#89/#90/#73/#79/#72/#68/#56/#81 + szl-brand #40/#39. The org card is a static HTML/markdown Space, so these are recorded in `cursor_reinstill.json`; the integration itself is the un-doctrine correction.
- **Integration mode:** un-doctrine corrections ONLY (additive metadata fix), per task scope.
- **Files corrected:**
  - `README.md`: `749 declarations` → `456 declarations`; `168 tracked sorries` → `6 tracked sorries`; `11 MCP tools` → `12 MCP tools`; footer `Doctrine v7` → `Doctrine v9`.
  - `index.html`: 3× `Doctrine v7` → `Doctrine v9` (meta description, og:description, footer).
  - Added `cursor_reinstill.json` provenance manifest (v9 numbers + honesty note + 15 PR records + founder-locked preservation list).
- **FOUNDER-LOCKED — NOT TOUCHED (verified live):** HF banner `assets/szl_banner.png`; 5 painterly hero avatars (rosie/a11oy/amaru/sentra/vessels `_avatar.png`); animated emoji layer (`assets/emoji/*_emoji.png`, 14 ambient-emoji references intact). "0 violations" claim left as-is (out of correction scope).
- **Verify (live, post-rebuild):** README.md and index.html return **zero banned tokens** (749 / 168 tracked / 11 MCP / Doctrine v7); README has "456 declarations", "6 tracked sorries", "12 MCP tools", Doctrine v9; index.html has 3× Doctrine v9 + emoji-layer + 14 ambient-emoji; banner + 5 avatars present.
- **Screenshots:** `cursor_ship_screenshots/readme/` — 01_org_card_landing_founder_locked (banner + 5 heroes + chibi emojis + unicorn), 02_readme_blob_3d6989a_verified, 03_readme_raw_v9_numbers, 04_cursor_reinstill_manifest.
- **Verdict:** 🟢 GREEN.

---

## CONSTRAINTS COMPLIANCE (final)

- ✅ **Founder-locked preserved:** HF banner, 5 painterly hero avatars, animated emojis — untouched and live-verified on org card. IP-HOLD PRs a11oy#57 / amaru#46 / sentra#45 confirmed absent from merged dataset and never touched.
- ✅ **ADDITIVE only:** no existing Watunakuy-passing route broken; new endpoints registered before catch-all routes.
- ✅ **ZERO BANDAID:** all builds verified live post-rebuild via markers (forecast JSON, config tabs, v9 chips, raw file scans).
- ✅ **HF auth:** all commits via `HfApi.create_commit` with `.secret/hf_token`. No GitHub Actions secret used.
- ✅ **Doctrine v9 honest numbers** (456/14/6, 12 MCP, 46 gates, 44 anchor gates) propagated everywhere.
- ✅ **HONESTY:** v18 "zero sorry" claim NOT propagated; 6 real tracked sorries documented (PACBayes:265,281; MadhavaBound:126,145; TwoWitness:163; Uniqueness:120).

## ARTIFACTS

- Deliverable: `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/64_CURSOR_INTEGRATION_SHIP_LOG.md`
- Screenshots (28 total, 4 per Space): `cursor_ship_screenshots/{a11oy,amaru,sentra,vessels,rosie,uds-demo,readme}/`
- Provenance manifests shipped to: amaru, sentra, vessels, rosie, uds-demo, README (`cursor_reinstill.json`).

**END — 7/7 GREEN — 57 Cursor PRs re-instilled.**
