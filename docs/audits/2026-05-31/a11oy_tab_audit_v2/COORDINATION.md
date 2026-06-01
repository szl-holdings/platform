# A11oy Tab-By-Tab Audit v2 — COORDINATION

**Created by:** Auditor #2 (Yachay) · 2026-06-01
**Space:** SZLHOLDINGS/a11oy · live HEAD at audit start: `a44b38bd`
**Push path:** HfApi direct (admin token .secret/hf_token) — NEVER betterwithage connector, NEVER GitHub Actions.

## Authoritative tab numbering (LOCKED for this audit run)

Source of truth = szl_hub.py `TABS` (18) + Doctrine v13 edge-organ tabs + pages/ governance consoles + SPA proof pages.
Ordered master list below. Slices: A1=1-15, A2=16-30, A3=31+.

| # | Route | Tab | Server | Auditor |
|---|---|---|---|---|
| 1 | / | Orchestrator (SPA landing) | serve.py spa_root | A1 |
| 2 | /a11oy.code | a11oy.code orchestrator | a11oy_code_orchestrator | A1 |
| 3 | /docs | Docs | szl_hub | A1 |
| 4 | /pricing | Pricing | szl_hub | A1 |
| 5 | /api-keys | API Keys | szl_hub | A1 |
| 6 | /sdk | SDK | szl_hub | A1 |
| 7 | /status | Status | szl_hub | A1 |
| 8 | /observability | Observability | szl_hub | A1 |
| 9 | /security | Security | szl_hub | A1 |
| 10 | /compliance | Compliance | szl_hub | A1 |
| 11 | /cued-engagement | Cued Engagement | szl_hub | A1 |
| 12 | /uds | UDS | szl_hub | A1 |
| 13 | /counter-uas | Counter-UAS | szl_hub | A1 |
| 14 | /evidence | Evidence Ledger | serve.py + pages/evidence.html | A1 |
| 15 | /upgrades | Upgrades showcase | pages/upgrades.html | A1 |
| 16 | /audit | Audit (Khipu DAG visualizer) | szl_hub + pages/audit.html | **A2** |
| 17 | /gap-report | Gap Report heatmap | szl_hub + pages/gap-report.html | **A2** |
| 18 | /hub | Hub Index | szl_hub + pages/hub.html | **A2** |
| 19 | /wayra | WAYRA (lungs) firehose | wayra_serve | **A2** |
| 20 | /chaski | Chaski (reception) | szl_chaski + pages/chaski.html | **A2** |
| 21 | /wallpa | Wallpa (voice/TTS) | szl_wallpa + pages/wallpa.html | **A2** |
| 22 | /wasi-rikuq | Wasi-Rikuq (house-watch) | szl_wasi_rikuq + pages/wasi-rikuq.html | **A2** |
| 23 | /live-wires | Live 3D Wires | szl_live_wires + live_wires.html | **A2** |
| 24 | /run-all | Ouroboros Run-All | serve.py + pages/run-all.html | **A2** |
| 25 | /brain | szl_brain LLM router | pages/brain.html + /v1/brain/* | **A2** |
| 26 | /brain-jack | Brain-jack mesh | pages/brain-jack.html + /v1/brain/jack | **A2** |
| 27 | /mesh | Wire mesh state | pages/mesh.html + /v1/mesh/state | **A2** |
| 28 | /wires | Khipu DAG / Wire C | pages/wires.html | **A2** |
| 29 | /substrate | Receipt substrate console | pages/substrate.html + /v1/policy/* | **A2** |
| 30 | /codex-kernel | Governed-loop validators | pages/codex-kernel.html | **A2** |
| 31+ | (SPA governance + product routes) | ... | console SPA | A3 |

## Live findings already confirmed (serve.py @ a44b38bd)
- `/api/a11oy/v1/policy/evaluate` + `/api/a11oy/{path}` STILL proxy to dead Node :8081 → 503 (G1 open).
- `szl_receipt_substrate.py` present in repo but NOT imported by serve.py (orphaned).
- LOCKED-NUMBER REGRESSION: serve.py `healthz`/`reason` report Doctrine v9 = 456 decl / 6 sorries / 12 MCP — but LOCKED = 749/14/163. `/v1/evidence` correctly reports 749/14/163. Header comment says v9.

## Sign-off
All internal artifacts signed **Yachay**; commit trailer "Perplexity Computer Agent". Additive only. IP-HOLD a11oy#57 untouched.
