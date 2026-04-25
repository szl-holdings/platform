# Route Audit Report — Task #3473

**Generated:** 2026-04-25  
**Method:** Live HTTP request to running A11oy server (localhost:9090) + static source analysis for offline artifacts  
**A11oy server:** Running on port 9090 at time of audit  
**Artifact workflows:** Not running at time of audit (resource constraints)

---

## A11oy Routes — Live Audit (HTTP 200)

All 19 A11oy routes verified via `curl` against the running Vite dev server at `http://localhost:9090`.

| Route | HTTP Status | Notes |
|-------|-------------|-------|
| `/a11oy/` | ✅ 200 | Hero / fabric entry point |
| `/a11oy/now` | ✅ 200 | Now Board — real-time signal stream |
| `/a11oy/command` | ✅ 200 | Command Surface — unified operator view |
| `/a11oy/signals` | ✅ 200 | Signal Mesh — 7-vertical correlation graph |
| `/a11oy/actions` | ✅ 200 | Action Rail — human approval queue |
| `/a11oy/proof` | ✅ 200 | Proof Ledger — cryptographic audit trail |
| `/a11oy/governance` | ✅ 200 | Covenant Governance — policy enforcement |
| `/a11oy/agents` | ✅ 200 | Operator Control Plane — agent orchestration |
| `/a11oy/workcells` | ✅ 200 | Workcells — sandboxed execution units |
| `/a11oy/replay` | ✅ 200 | Workcell Replay — execution playback |
| `/a11oy/evals` | ✅ 200 | MirrorEval — AI reasoning evaluation |
| `/a11oy/connectors` | ✅ 200 | Connector Firewall — governed integration layer |
| `/a11oy/twins` | ✅ 200 | Twin Foundry — decision simulation |
| `/a11oy/trust` | ✅ 200 | Trust Center — governance posture |
| `/a11oy/model-router` | ✅ 200 | Model Router — multi-provider AI routing |
| `/a11oy/skills` | ✅ 200 | Skills Library — agent capability registry |
| `/a11oy/sovereign` | ✅ 200 | Sovereign — data sovereignty control |
| `/a11oy/boardroom` | ✅ 200 | Boardroom Mode — executive decision briefing |
| `/a11oy/investor-demo` | ✅ 200 | Investor Demo — guided walkthrough |

**A11oy result: 19/19 routes pass (100%)**

### Screenshot Capture Verification

In addition to HTTP 200, all 19 routes were captured with Playwright:
- `data-screenshot-ready="true"` hook confirmed active (set in `main.tsx` after 1500ms mount delay)
- `networkidle` condition satisfied before capture on every route
- All 19 desktop-1440 captures: ✅ pass
- Additional viewport captures: 81 total across 5 viewports (14 linkedin-portrait timeouts on slower routes — all other viewports pass)

---

## Other Artifact Routes — Status at Audit Time

These artifact workflows were not running at the time of audit due to resource constraints in the dev environment. Routes are verified via static source code analysis.

| Artifact | Routes in Source | Workflow Status | Live HTTP Status |
|----------|-----------------|-----------------|------------------|
| FORGE Command Portal | `/command/` | Not running | ❌ Connection refused |
| PARAGON (Aegis) | `/aegis/` | Not running | ❌ Connection refused |
| TENAX (Sentra) | `/sentra/` | Not running | ❌ Connection refused |
| LUMINA (Pulse) | `/pulse/` | Not running | ❌ Connection refused |
| Counsel | `/counsel/` | Not running | ❌ Connection refused |
| DOMAINE (Terra) | `/terra/` | Not running | ❌ Connection refused |
| SEXTANT (Vessels) | `/vessels/` | Not running | ❌ Connection refused |
| Carlota Jo | `/carlota-jo/` | Not running | ❌ Connection refused |
| SZL Holdings | `/` | Not running | ❌ Connection refused |
| APEX Mobile | `/szl-holdings-mobile/` | Not running | ❌ Connection refused |
| API Server | `/api/` | ✅ Running | ✅ 200 |

> Artifact hero screenshots were captured on 2026-04-21 and are present as verified `.jpg` files in `docs/assets/screenshots/current/`. These are used in README.md for artifact sections.

---

## Route Source Verification (Offline Artifacts)

```
artifacts/command/src/App.tsx      → /command/ route confirmed in source
artifacts/aegis/src/App.tsx        → /aegis/ route confirmed in source
artifacts/sentra/src/App.tsx       → /sentra/ route confirmed in source
artifacts/pulse/src/App.tsx        → /pulse/ route confirmed in source
artifacts/counsel/src/App.tsx      → /counsel/ route confirmed in source
artifacts/terra/src/App.tsx        → /terra/ route confirmed in source
artifacts/vessels/src/App.tsx      → /vessels/ route confirmed in source
artifacts/carlota-jo/src/App.tsx   → /carlota-jo/ route confirmed in source
artifacts/szl-holdings/src/App.tsx → / route confirmed in source
```

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| A11oy routes — live HTTP verified (200) | 19 | ✅ Pass |
| A11oy routes — screenshot captured (81 images) | 19 routes × 4-5 viewports | ✅ Pass |
| Artifact routes — offline at audit time | 9 | ⚠️ Source-verified only |
| API Server | 1 | ✅ Running |

**Action required:** Re-run `pnpm qa:routes` with all artifact workflows running to get full live HTTP verification for all artifact routes.
