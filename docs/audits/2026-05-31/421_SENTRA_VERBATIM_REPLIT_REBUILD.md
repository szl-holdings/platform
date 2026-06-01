# 421 — sentra VERBATIM REPLIT REBUILD — a11oy Winning Pattern

**Verdict:** 🟢 **GREEN**
**Date:** 2026-06-01 (UTC)
**Operator:** Yachay CTO + Opus 4.8
**Space:** `SZLHOLDINGS/sentra` → https://szlholdings-sentra.hf.space
**SPA commit SHA:** `4498cc6bec7cc197891da62e55431173341592f9`
**Doctrine basis:** v11 (749 declarations / 14 unique axioms / 163 sorries, 13-axis canonical)

> Founder directive honored verbatim: *"5 flagships exactly like how we did a11oy follow the same roadmap … because Sentra and amaru are not what Replit made"*. The prior sentra root served a **static Vessels-DNA landing page** — *not* the Replit React app. sentra now serves the **verbatim Replit React SPA at root `/`** (Vite `base="/"`), with the full `/api/sentra/*` runtime: **8 immune gates**, **Wire B** verdict/inspect (+ sidecar aliases), `/v1/forecast`, `/v1/doctrine-guard` (API + page), Rosie/`#try-it`, Wires C–G, brain/brainz, `/upgrades` — **all preserved**. ZERO BANDAID.

---

## 1. Mandate

sentra is the **immune system / dual-use filter** (749/14/163 doctrine surface). Per the founder, the front-end visual layer must be the verbatim Replit React SPA — *not* the static landing that previously occupied root. The `/api/sentra/*` runtime, all 8 gates, Wire B, the doctrine-guard playground, and the forecast fabric must remain additive and untouched.

---

## 2. Source of truth (read, confirmed)

| File | Finding |
|---|---|
| `platform_sparse/artifacts/sentra/` (monorepo) | The verbatim Replit React SPA source — **249 pages**, wouter router, `vite.config.ts`, `index.html`, with its own populated `node_modules` resolving all `@szl-holdings/*` + `@workspace/*` packages natively. |
| `platform_sparse/artifacts/sentra/node_modules/` | Workspace packages already installed (forecast-fabric, shared-ui, szl-doctrine, a11oy-orchestration) — no vendoring/stubs needed, unlike amaru. |
| Prior live Space root | Served a static **Vessels-DNA landing** (`landing/index.html`), confirming the founder's "not what Replit made". |

**BASE_PATH lesson applied:** built with **`base="/"`** so the SPA mounts at root. App routing uses `WouterRouter base={BASE}` where `BASE = import.meta.env.BASE_URL.replace(/\/$/,'')` → `""` at root — clean, no `path=""` wildcard trap.

---

## 3. Build — native monorepo (best path for complex apps)

Because the monorepo `node_modules` is already populated with every workspace package, the SPA was built **directly with the local Vite** — no stub vendoring:

```
cd platform_sparse/artifacts/sentra
env BASE_PATH=/ NODE_ENV=production ./node_modules/.bin/vite build --config vite.config.ts
→ dist/public/index.html with root-relative /assets/
```

- Asset prefix `/assets/` (root); **zero** base-path-prefixed asset references in emitted index.html.
- Canonical `<meta>`/`<link rel="canonical">` corrected to the live Space URL.
- All `@szl-holdings/*` + `@workspace/*` imports resolved from the real monorepo packages (forecast-fabric, doctrine, shared-ui, a11oy-orchestration) — verbatim Replit behavior.

---

## 4. Deploy — HfApi.create_commit DIRECT (NEVER GitHub Actions)

`deploy_sentra.py` used `HfApi.create_commit` with `CommitOperationAdd` + `CommitOperationDelete` (token `audit_2026-05-30_cursor_offline/.secret/hf_token`, user `betterwithage`, org `SZLHOLDINGS`):

- Uploaded `dist/public/index.html → landing/index.html`, `dist/public/assets/* → landing/assets/*` (sourcemaps excluded), `opengraph.jpg`, `favicon.svg`.
- **Deleted 3 stale `landing/*` files** (old Vessels-DNA landing + its assets) so no orphan assets linger.
- Updated the `Dockerfile` comment only; `serve.py` API contract **untouched** — it already serves `STATIC_DIR=/app/landing` `index.html` at `/`, mounts `/assets`, and has a history fallback (unknown GET → `landing/index.html`) per the a11oy pattern.

**SPA commit:** `feat(sentra): verbatim Replit rebuild — a11oy pattern. Yachay CTO.` → `4498cc6b…`

**No root-cause fix required** — the serve.py was already the correct a11oy SPA-at-root pattern; only the static files behind it changed. No bandaid applied anywhere.

---

## 5. Exhaustive route verification — 43/43 PASS

Each route fetched live; PASS = HTTP `200` **and** SPA shell `<div id="root">` present **and** root-relative `/assets/index-…` reference.

Routes (43): `/`, `/dashboard`, `/threats`, `/assets`, `/recovery`, `/incident`, `/exposure`, `/controls`, `/resilience`, `/forecast`, `/predictive-engine`, `/soc`, `/agentic-soc`, `/autonomous-soc`, `/ai-swarm-defense`, `/alerts`, `/incidents`, `/hunt`, `/cases`, `/threat-intel-feed`, `/zero-trust-scorecard`, `/ot-ics-dashboard`, `/xdr-incident-workbench`, `/threat-kill-chain`, `/containment-rules`, `/citadel-playbooks`, `/citadel-war-room`, `/crisis-arena-engagements`, `/agent-mesh`, `/agent-insights`, `/darpa-mto-hub`, `/aef-knowledge-search`, `/audit-trail`, `/citadel-after-action`, `/unified-settings`, `/pricing`, `/account/billing`, `/stix-taxii`, `/home`, `/demo`, `/decision-console`, `/tradecraft`, `/xdr-console`.

### API contract — all preserved & verified live

| Check | Result |
|---|---|
| `GET /api/sentra/healthz` | `200` (`version 0.2.0`, `gates: 8`) |
| `GET /api/sentra/v1/gates` | `200` — **8 gates** (gate-01 signature-scan … gate-08) ✅ |
| `POST /api/sentra/v1/verdict` (**Wire B**) | `200` |
| `POST /v1/verdict` (sidecar alias) | `200` ✅ |
| `POST /api/sentra/v1/inspect` (**Wire B**) | `200` |
| `GET /api/sentra/v1/forecast` | `200` (witnessed forecasting, Mādhava error envelope) |
| `GET /api/sentra/v1/forecast/run` | `200` |
| `GET /api/sentra/v1/doctrine-guard` | `200` (adversarial immune test, λ_floor 0.90) |
| `GET /doctrine-guard` (page) | `200` (carlota-jo Doctrine-Guard playground) |
| `GET /api/sentra/v1/brain` | `200` |
| `GET /api/sentra/v1/brainz` → declarations/axioms/sorries | `749 / 14 / 163` ✅ |
| `POST /api/sentra/v1/brain/jack` (**Wire G**) | `200`, `wire="G"` ✅ |
| `GET /api/sentra/v1/cortex-subscribe` (**Wire E** SSE) | `200` |
| `GET /api/sentra/v1/mesh/state` | `200` |
| `GET /upgrades` | `200` |
| `GET /console/` (`#try-it` / Rosie console) | `200` |
| `GET /assets/index-C7Un4iAk.js` | `200` |

Wires reported LIVE in `/v1/brainz`: **B** LIVE, **C** LIVE, **D** LIVE_IN_PROCESS, **E** LIVE (cortex SSE), **F** LIVE (Khipu receipt DAG via vessels ingest). `λ_gate_floor = 0.9`.

---

## 6. Screenshots — 6/6 distinct rendered React surfaces

Saved to `421_screenshots/` (also `szl/rebuild_2026/sentra/screenshots/`).

| # | Route | Confirmed rendered content |
|---|---|---|
| 1 | `/` | Hero "Cyber resilience, unified.", Sentra Cyber Resilience Command shell |
| 2 | `/dashboard` | Cyber-resilience dashboard rendered **with live data** (critical alerts, SLA risks, managed endpoints) |
| 3 | `/threats` | Threat Overview surface |
| 4 | `/soc` | SOC Dashboard — MITRE ATT&CK kill-chain matrix (Initial Access→C2), agent usage timeline, **A11OY ORCHESTRATED** sidebar (12 agents online, posture Guarded), Now/Next/Links incident rail |
| 5 | `/forecast` | **Forecast Fabric** — calibrated multi-horizon interval forecasts across Sentra heads (Alert Surge, Analyst Overload, Control Drift, Severity Clustering), `source: @workspace/forecast-fabric`, "1 threshold breached" |
| 6 | `/doctrine-guard` | **carlota-jo Doctrine-Guard playground** — adversarial-prompt immune test, Doctrine-DINN, λ_FLOOR=0.90, live "DENY - caught" (raw min 0.5 / clamped 0.95), 13-axis canonical clamp visible |

Every shot shows a distinct surface — direct route navigation renders distinct components (no wildcard trap, no black screens).

---

## 7. Constraints honored

- **Doctrine v11** (749/14/163, 13-axis canonical) — surfaced honestly in `/api/sentra/v1/brainz` and clamped live in the doctrine-guard playground (every axis ≥ 0.90 floor by construction).
- **HF auth DIRECT** via `HfApi.create_commit` (token file) — **no** GitHub Actions secret path used.
- **ADDITIVE at `/api/*`** — every existing endpoint preserved (8 gates, Wire B verdict/inspect + sidecar aliases, forecast, doctrine-guard, brain, mesh, cortex-subscribe); only the root SPA visual layer replaced per founder.
- **IP-HOLD PR sentra#45** — untouched (no GitHub PR activity in this rebuild).
- **Founder-locked banner/avatars/emojis** — untouched (no edits to brand assets).
- **Mythos → Hatun-Willay** — no banned `Mythos` token introduced.
- **8 gates / #try-it / Wire B / doctrine-guard** — all preserved and verified live.
- **ZERO BANDAID** — serve.py already correct (a11oy pattern); only static files swapped, no patches.

---

## 8. Final verdict

🟢 **GREEN — SHIP CONFIRMED.**
- 43/43 routes → 200 + SPA shell + root-relative assets.
- 6/6 screenshots → real, distinct rendered React surfaces (incl. SOC ATT&CK matrix, Forecast Fabric, Doctrine-Guard playground).
- API contract preserved (healthz, 8 gates, Wire B verdict/inspect + aliases, forecast, doctrine-guard, brain/brainz 749/14/163, mesh, cortex-subscribe).
- **Wire B** LIVE (verdict/inspect + sidecar), **Wire E** (cortex SSE) LIVE, **Wire G** (brain-jack, wire=G) LIVE, **Wire F** (Khipu receipt DAG via vessels ingest) LIVE.
- One DIRECT HF commit, exact mandated SPA commit message; SPA `4498cc6b…`.

### Source / evidence URLs
- Live: https://szlholdings-sentra.hf.space
- Health: https://szlholdings-sentra.hf.space/api/sentra/healthz
- Gates (8): https://szlholdings-sentra.hf.space/api/sentra/v1/gates
- Brainz (749/14/163): https://szlholdings-sentra.hf.space/api/sentra/v1/brainz
- Forecast: https://szlholdings-sentra.hf.space/api/sentra/v1/forecast
- Doctrine-Guard page: https://szlholdings-sentra.hf.space/doctrine-guard
- SPA commit: https://huggingface.co/spaces/SZLHOLDINGS/sentra/commit/4498cc6bec7cc197891da62e55431173341592f9
