# Series-A Round 8 — Full Smoke & Demo Standby
**Date:** 2026-05-18  **Mode:** top-to-bottom smoke + demo readiness

## TL;DR — Demo Status: GREEN
- **4/4 focus product surfaces UP** — a11oy, sentra, vessels, conduit
- **5/5 amaru proxy endpoints UP** — state, tripwires, scheduler/wiring, overwatch/snapshot, receipts
- **4/4 core sidecars UP** — amaru :6810, agent-gateway :6800, mcp-gateway :8099, api-server :8080
- **19/20 demo page routes UP** — only `/api/` itself returns 401 (auth-protected; expected)
- **Amaru brain is producing real receipts** — 47 in chain, 5 scheduler ticks, all 7 chakras evaluated OK, huklla-10 = 9 pass / 1 warn / 0 trip

## Process tree (confirmed alive)
```
api-server      PID 39633   /api/* on :8080
├── amaru       PID 39659   FastAPI 7-chakra brain on :6810
├── agent-gw    PID 39643   policy gateway on :6800
└── mcp-gw      PID 39687   substrate MCP on :8099
```

## Sidecar smoke — every endpoint returned 200 with real bytes
| Endpoint | Bytes |
|---|---|
| GET /api/amaru/state | 5170 |
| GET /api/amaru/tripwires | 984 |
| GET /api/amaru/scheduler/wiring | 452 |
| GET /api/amaru/overwatch/snapshot | 1023 |
| GET /api/amaru/receipts?limit=10 | 5177 |
| GET /v1/capabilities (agent-gateway) | 330 |

JSON evidence saved under `screenshots/round8/*.json`.

## Demo page smoke — 19/20 OK
Routes verified via proxy at localhost:80:
- a11oy: `/`, `/organism`, `/operational-status`, `/now`, `/command-surface` → 200
- sentra: `/sentra/`, `/dashboard`, `/agentic-soc`, `/autonomous-soc`, `/alerts` → 200
- vessels: `/vessels/`, `/decision-center`, `/fleet`, `/voyages`, `/atlas-execute`, `/cortex/portfolio` → 200
- conduit: `/conduit/`, `/conduit/brain`, `/conduit/operational-core` → 200
- `/api/` root → 401 (expected; protected)

## Workflow status — what's red and why
| Workflow | Status | Reality | Action |
|---|---|---|---|
| `api: agent-gateway` | red | **Alive** as PID 39643 sidecar of api-server | None — workflow standalone is redundant |
| `api: amaru` | red | **Alive** as PID 39659 sidecar of api-server | None — workflow standalone is redundant |
| `api: temporal-worker` | red | Needs local Temporal Frontend on :7233 (not in this env) | Out of scope for demo |
| `api: temporal-approval-worker` | red | Same Temporal :7233 dependency | Out of scope for demo |
| `vessels-pitch: web` | red | Vite v7.3.2 binds :24631 successfully in foreground; workflow port-probe is flaky | Patched `--host ::` (IPv6 dualstack); probe still timing out — pitch deck can be served standalone for demo |

The amaru/agent-gateway "failed" indicators are **purely cosmetic** — both services run as child processes of api-server's start.sh and are confirmed serving HTTP 200 on their bound ports. The redundant standalone workflows have `autoStart=false` in `artifact.toml` for exactly this reason.

## Amaru brain — proof of life
- **7 chakras registered:** root, sacral, solar, heart, throat, third_eye, crown
- **Receipt chain:** 47 hash-chained receipts, no breaks
- **Scheduler:** 5 ticks executed
- **Huklla-10 tripwires:** 9 pass / 1 warn / 0 trip
  - PASS: all_chakras_registered (7/7), receipt_chain_intact, proofs_present
- Screenshot: `screenshots/round8/conduit-brain-live.jpg` shows RUNTIME UP with live JSON per chakra

## Fix applied this round
1. **`artifacts/conduit/src/pages/brain.tsx`** — changed `AMARU_BASE` from `/amaru` to `/api/amaru` so the brain panel hits the api-server proxy instead of the (nonexistent) bare `/amaru` route. This is what flipped the page from "RUNTIME DOWN · POLL FALLBACK" with zeros to "RUNTIME UP" with 47 receipts and all 7 chakras evaluated.
2. **`artifacts/vessels-pitch/package.json`** — `dev` script now uses `--host ::` (IPv6 dualstack) to match the other 4 artifacts' binding convention. Workflow probe still flaky but vite itself runs fine.

## Demo standby checklist
- [x] All 4 product surfaces screenshotted live (`screenshots/round8/*.jpg`)
- [x] Amaru brain panel showing real chakra outputs and receipt chain
- [x] All amaru proxy endpoints returning real JSON
- [x] Process tree captured (sidecars alive)
- [x] Workflow false-positives documented (won't cause panic during demo)
- [ ] Vessels-pitch slide deck — vite binds OK in foreground but workflow probe flaky; serve standalone if needed

## What is OUT OF SCOPE (honest)
- Temporal workers — require Temporal Frontend on :7233; not deployable in this env
- Vessels-pitch workflow probe — vite works, probe doesn't; can serve directly
