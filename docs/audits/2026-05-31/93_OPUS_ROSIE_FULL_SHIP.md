# 93 — OPUS rosie FULL SHIP — Operator Console v2.0 (11 tabs + full a11oy /v1/* mirror)

**Verdict:** 🟢 **GREEN — SHIP CONFIRMED.**

**Space:** `SZLHOLDINGS/rosie` · Live: <https://szlholdings-rosie.hf.space/>
**Final working commit SHA:** `304b9e0882bd621b17be4404a4415065289606d0`
**Pre-deploy SHA (Doctrine-v9 baseline):** `29deb433fcf288af441e34596c07e10a35e93fb2`
**Deploy mechanism:** `HfApi.create_commit` (HF auth, user `betterwithage`)
**Squad:** Opus coordinator + DEV-R1/R2 (builders peer-pair) + DEV-R3/R4 (testers peer-pair) — replicating the a11oy winning pattern (report `42_OPUS_A11OY_FULL_SHIP.md`).

| Return field | Value |
|---|---|
| **Verdict** | 🟢 GREEN |
| **HF SHA** | `304b9e0882bd621b17be4404a4415065289606d0` |
| **Tabs** | **11 / 11** reachable live |
| **Endpoints mirrored** | **51** distinct `/v1/*` (× 3 namespaces = 153 live 200s; **162/162** total incl. health/preview) |
| **Screenshots** | **6 / 6** (each a distinct major tab / live API surface) |
| **Deliverable** | `/home/user/workspace/szl/audit_2026-05-30_cursor_offline/round2/full_reaudit_2026-05-31/93_OPUS_ROSIE_FULL_SHIP.md` |

---

## 1. Mandate

Replicate the a11oy winning pattern for rosie with a 4-dev squad (2 peer pairs). Per the locked
Rosie Full-Capability Brief (`ROSIE_FULL_CAPABILITY_BRIEF_2026-05-31_2135.md`), Rosie must inherit
**every a11oy `/v1/*` endpoint**, add **EXCLUSIVE** self-learning + active inference + cognitive
maps (T8 thesis) + cross-session memory, expose **4 NEW Gradio tabs**, integrate **5 LLM tiers**,
inherit **11 skills**, and **preserve** the 7 existing tabs + widget v2.0 on 5 Spaces. ADDITIVE only;
Doctrine v9 numbers; honesty pass on `thm:*` (no false "fully verified"); ZERO BANDAID.

## 2. Source-of-truth files (read, confirmed)

- `ROSIE_FULL_CAPABILITY_BRIEF_2026-05-31_2135.md` — locked brief (4 tabs, /v1/* mirror, 5 tiers, 11 skills).
- `42_OPUS_A11OY_FULL_SHIP.md` — a11oy winning pattern (Docker + serve.py, ended GREEN, SHA `6ba1a2f0…`).
- `00_A11OY_ORCHESTRATOR_SPEC.md` — the a11oy `/v1/*` contract (34 endpoints) Rosie must mirror.
- `DOCTRINE_V9_LOCKED_2026-05-31_2210.md` — canonical numbers (below); banned v8 numbers.
- Live deployed `app.py` / `README.md` (downloaded to `szl/rosie_live_deployed/`) — the Doctrine-v9
  honest base (979 lines) used as the build base, NOT the older local v7 artifact.

**Doctrine v9 canonical numbers (used verbatim):** **456 declarations · 14 unique axioms ·
6 tracked sorries · 12 MCP tools · 46 policy gates · 44 anchor formula gates · SLSA L1 (honest).**
6 sorry locations: PACBayes×4, TwoWitness×1, Uniqueness×1. Banned v8 numbers (749 decl / 168 sorries /
11 MCP / 45 gates) are forbidden as claims.

## 3. Root-cause fix — NO bandaids

### The killer bug: `sdk: gradio` never ran our FastAPI app
The first deploy (`c63cb4d4…`, then `5ce49ee2…` mid-investigation) was correct **locally**
(11/11 tabs, all endpoints 200) but **failed live**: only **7/11 tabs** in `/config`, and **all
POST/DELETE `/v1/*` returned 405** (GET worked). Root cause, confirmed: under `sdk: gradio`, HF's
runtime calls `demo.launch()` on its own (serving Gradio's internal FastAPI on port 7861) and
**never executes** our `if __name__ == "__main__": uvicorn.run(app, port=7860)` block. Therefore the
separate `app` object built by `gr.mount_gradio_app(...)` — which carries our 51 `/v1/*` routes plus
the new tabs mounted via `_r2.build_new_tabs` — was never the served process.

### Fix (matches the proven a11oy pattern): switch `sdk: gradio` → `sdk: docker`
- Added `Dockerfile`: `python:3.12-slim`, non-root uid 1000, `pip install -r requirements.txt`,
  `EXPOSE 7860`, `CMD ["python", "app.py"]`. This hands control to our `__main__` uvicorn block, so
  the **single** served process is the Gradio+FastAPI hybrid `app` — 11 tabs at `/` AND the full
  `/v1/*` contract at root + `/api/rosie` + `/api/a11oy`. (a11oy used the same `python:3.12-slim` +
  `CMD python serve.py` + `PORT 7860` recipe.)
- `README.md` frontmatter: `sdk: gradio` → `sdk: docker`, added `app_port: 7860`. Body updated
  "seven tabs" → "eleven tabs" + `/v1/*` mirror note. Everything else preserved.
- No code workaround, no route hacks — the *runtime contract* was wrong; we corrected it at the root.

The 405s and missing tabs were a single symptom of this one root cause. After the Docker switch the
live build went `RUNNING_BUILDING → RUNNING_APP_STARTING → RUNNING` and **every** symptom cleared.

## 4. Build (ADDITIVE)

- `app.py` (50,554 B): `import rosie_v2_additions as _r2`; `_r2.build_new_tabs(gr, demo)` inserted as
  siblings inside the existing `with gr.Tabs():` after the 7th tab; `__main__` builds
  `_rosie_api = _r2.build_rosie_api()`, mounts the same contract under `/api/rosie` and `/api/a11oy`
  **before** `app = gr.mount_gradio_app(_rosie_api, demo, path="/")`, then `uvicorn.run(app, 7860)`.
- `rosie_v2_additions.py` (≈40 KB): 5 LLM tiers (`ROSIE_LLM_TIERS`, default `claude_sonnet_4_6`),
  11 skills (`ROSIE_SKILLS`), deterministic self-learning bookkeeper, Unay cross-session memory,
  cognitive-map recorder, `build_rosie_api()` (FastAPI factory: 51 `/v1/*` + healthz/readyz + per-tab
  `/preview/{slug}`), 4 tab render functions + `build_new_tabs(gr, demo)`. Doctrine-v9 `DV9` dict.
- `requirements.txt`: `gradio>=6.0,<7`, `pydantic>=2.7.0`, `fastapi>=0.110`, `uvicorn>=0.29`, `markdown>=3.5`.

**7 preserved tabs:** Span Explorer · Receipt Verifier · Mesh Health · Doctrine Sweep · Live Formulas ·
About · Cross-Space Helper. **4 new tabs:** 8) Self-Learning Loop · 9) Active Inference ·
10) Cognitive Maps · 11) Cross-Session Memory (Unay).

## 5. Deploy

`deploy_rosie_full_ship.py` (`HfApi.create_commit` + `CommitOperationAdd`) uploaded `app.py`,
`rosie_v2_additions.py`, `requirements.txt`, `Dockerfile`, `README.md`.

- Commit: <https://huggingface.co/spaces/SZLHOLDINGS/rosie/commit/304b9e0882bd621b17be4404a4415065289606d0>
- **Final commit SHA:** `304b9e0882bd621b17be4404a4415065289606d0`
- Build polled to `RUNNING` (Docker rebuild ≈70 s).

## 6. Exhaustive verification — live, GREEN

Reusable smoke test `smoke_test.py` introspects the real registered routes, then exercises tabs +
every endpoint across all three namespaces (`""`, `/api/rosie`, `/api/a11oy`).

### Tabs — 11/11 (live `/config`)
Span Explorer · Receipt Verifier · Mesh Health · Doctrine Sweep · Live Formulas · About ·
Cross-Space Helper · **Self-Learning · Active Inference · Cognitive Maps · Cross-Session** — all FOUND.

### Endpoints — 162/162 returned 200
- **51 distinct `/v1/*` endpoints** per namespace (a11oy-contract subset all present: policy×4,
  lambda×3, ledger×3, verify/receipts×3, mesh×8, cite×3, doctrine×3, memory×3 + DELETE evict-stale,
  workflows×3, mcp×2, fleet×2, reason×1, deploy×3) **plus Rosie exclusives** (canonicalize,
  receipts/stream, self-learn step/state, active-inference tick, cognitive-map record/state,
  unay write/query, llm/tiers, skills).
- 54 routes/ns (51 `/v1/*` + healthz + readyz + `/preview/{slug}`) × 3 namespaces = **162** calls,
  **all 200** (GET, POST, **and DELETE** — the 405s are gone).

### Live data honesty spot-checks
- `/v1/policy/gates` → `count: 46`, `doctrine: v9`.
- `/v1/cite/thm:lambda_monotone` → honest `status` + real DOI; unknown thms say so (no false claim).
- `deploy/status` reports the real 5-organ ecosystem state.

### Widget v2.0 — preserved on all 5 Spaces (UNTOUCHED)
Canonical asset <https://szlholdings-readme.static.hf.space/assets/rosie/rosie-widget.js> → **200,
34,137 bytes, v2.0 "Wasichaq-III"** (identical to local `rosie-widget-v2.js`). All 5 Spaces reachable
(HTTP 200): a11oy, amaru, sentra, vessels, uds-demo. amaru/sentra/vessels embed the widget inline
(refs in root HTML); a11oy + uds-demo load it via JS bundle. This work did not touch the widget —
additive constraint honored.

## 7. Screenshots — 6/6 (saved to `szl/rosie_full_ship_build/screenshots/`)

1. `01_main_console_11tabs.png` — live console root; tab bar shows the 11 tabs (overflow "…" holds 10–11).
2. `02_tab08_self_learning.png` — Self-Learning Loop: free-energy table + honesty banner ("not a verified theorem; no claim of 'fully verified'").
3. `03_tab09_active_inference.png` — Active Inference (T8): backing theorems with **real** statuses (PROVEN / SORRY-TRACKED(4) / SORRY-TRACKED(1) / AXIOM) + Doctrine v9 numbers (456/14/6).
4. `04_tab10_cognitive_maps.png` — Cognitive Maps: visits-per-Space, transition edges, recent events.
5. `05_tab11_cross_session_unay.png` — Cross-Session Memory (Unay): hits table + honesty banner.
6. `06_live_api_docs_swagger.png` — live `rosie-api 2.0.0` Swagger UI listing `/v1/*` GET/POST endpoints.

(Per-tab previews are served live at `/preview/{slug}` from the same render functions as the Gradio
tabs, so the screenshots show genuine live content.)

## 8. Honesty pass — clean, no false claims

- `"fully verified"` appears ONLY as negations / comments / the doctrine-sweep **detector** banned-list:
  `app.py`/`rosie_v2_additions.py` lines — "NEVER claim global 'fully verified'", "NOT fully verified",
  "No claim of 'fully verified' is made", and the `banned=[…, "fully verified"]` detector.
- Self-learning loop is explicitly **deterministic in-process bookkeeping, not an LLM, not a verified
  theorem**; belief persists to a11oy Yuyay when reachable, in-memory otherwise (and it says so).
- Theorem table carries **real lutar-lean statuses** (`PROVEN` / `SORRY-TRACKED` with sorry counts /
  `AXIOM (vacuous — under review)`); corpus-wide 456/14/6 stated honestly.
- Banned v8 numbers (749 / 168 / 11 / 45) appear ONLY inside the detector — never as claims.

## 9. Final verdict

🟢 **GREEN — SHIP CONFIRMED.**

- 11/11 tabs live; 7 originals preserved + 4 new (Self-Learning, Active Inference, Cognitive Maps, Unay).
- 51 `/v1/*` endpoints mirrored across root + `/api/rosie` + `/api/a11oy`; 162/162 live 200s incl. POST/DELETE.
- 5 LLM tiers + 11 skills inherited; widget v2.0 (Wasichaq-III, 34,137 B) preserved on all 5 Spaces.
- Doctrine v9 numbers throughout; honesty pass clean; ZERO BANDAID (the one root cause — wrong HF
  runtime — was fixed at the root by switching to `sdk: docker`, exactly as a11oy did).
- Final SHA `304b9e0882bd621b17be4404a4415065289606d0`.

### Source / evidence URLs
- Live Space: <https://szlholdings-rosie.hf.space/>
- Commit: <https://huggingface.co/spaces/SZLHOLDINGS/rosie/commit/304b9e0882bd621b17be4404a4415065289606d0>
- Live API docs: <https://szlholdings-rosie.hf.space/docs>
- Widget v2.0 asset: <https://szlholdings-readme.static.hf.space/assets/rosie/rosie-widget.js>
- a11oy winning pattern: `42_OPUS_A11OY_FULL_SHIP.md`
- Locked brief: `ROSIE_FULL_CAPABILITY_BRIEF_2026-05-31_2135.md`
- Doctrine v9: `DOCTRINE_V9_LOCKED_2026-05-31_2210.md`
- Build dir: `/home/user/workspace/szl/rosie_full_ship_build/` (app.py, rosie_v2_additions.py, Dockerfile, README.md, requirements.txt, smoke_test.py, screenshots/)
