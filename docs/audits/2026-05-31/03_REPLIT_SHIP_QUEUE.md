# 03 — REPLIT SHIP QUEUE
> Audit date: 2026-05-31  
> Founder priority order: a11oy → amaru → sentra → vessels → rosie  
> All items treat Replit source as canonical ground truth ("REAL").

---

## DEPENDENCY GRAPH

```
SHIP-00 (fix a11oy Docker BUILD_ERROR)
    ↓
SHIP-01A (a11oy 133 pages auto-live)
SHIP-01B (a11oy backend API endpoints)
    ↓
SHIP-01C (fabric 9 sub-pages — auto from 01A)
SHIP-01D (mesh Wire B: a11oy→sentra env vars)
    ↓
SHIP-02A (amaru conduit-landing.tsx verify)
SHIP-02B (amaru moat integration test)
    ↓
SHIP-03A (sentra route audit — 118+ routes)
SHIP-03B (sentra Wire B acceptance POST /v1/verdict)
    ↓
SHIP-04A (vessels route audit — 95+ routes)
SHIP-04B (vessels mined landing TSX)
    ↓
SHIP-05A (rosie widget demo page)
SHIP-05B (rosie Wire C/D activation)
```

---

## QUEUE — ORDERED BY PRIORITY

---

### SHIP-00 — Fix SZLHOLDINGS/a11oy BUILD_ERROR [P0 · BLOCKING]

**Target Space:** `SZLHOLDINGS/a11oy`  
**Current status:** BUILD_ERROR  
**Effort:** Low (Dockerfile fix only, no new code)  
**Impact:** CRITICAL — unblocks all 133 pages + mesh Wire B

**What to do:**
1. Pull current HF Space Dockerfile from `SZLHOLDINGS/a11oy`
2. Add to COPY scope: `packages/anatomy-contracts` (Cursor PR #263)
3. Add to COPY scope: `packages/codex-kernel` (Cursor PR #266)
4. Add all `lib/` sub-path exports: `lib/shared-ui/sentient-layer`, `lib/observability`, `lib/config`, `lib/analytics`, `lib/api-client-react`, `lib/api-zod`, `lib/i18n`, `lib/mcp-client`
5. Rebuild and push to HF Space
6. Confirm `/a11oy/` loads in browser

**Replit source:** `repos/a11oy/web/.replit-artifact/artifact.toml` — paths=["/", "/nexus/", "/command/"]

---

### SHIP-01A — a11oy Core Pages Live (auto on SHIP-00) [P0 · Auto]

**Target Space:** `SZLHOLDINGS/a11oy`  
**Current status:** All 133 pages BLOCKED by build error  
**Effort:** Zero (auto-deploys when build passes)

**P0 pages to spot-check immediately post-build-fix:**
- `/a11oy/` — HomePage (investor entry)
- `/a11oy/command` — CommandSurface (operator console)
- `/a11oy/governance` — Governance
- `/a11oy/proof` — ProofLedger (receipt chain)
- `/a11oy/trust` — TrustCenter
- `/a11oy/constitution` — Constitution
- `/a11oy/investor-demo` — InvestorDemo
- `/a11oy/boardroom` — BoardroomMode

**Replit source:** `round2/a11oy_replit_coder/build/src/pages/` (133 .tsx files)

---

### SHIP-01B — a11oy Operator Backend (API surface) [P1 · Medium effort]

**Target Space:** `SZLHOLDINGS/a11oy` or new `SZLHOLDINGS/a11oy-api`  
**Effort:** Medium — add Gradio/FastAPI wrapper or dedicated Space

**Endpoints to expose:**
- `GET /healthz` — liveness
- `GET /readyz` — readiness  
- `POST /v1/ledger` — receipt ledger write
- `GET /v1/verify` — receipt verification
- `POST /v1/policy` — policy evaluation
- `GET /v1/audit` — audit trail query

**Depends on:** SHIP-00

---

### SHIP-01C — a11oy Fabric Section 9 Sub-Pages (auto on SHIP-00) [P1 · Auto]

**Target Space:** `SZLHOLDINGS/a11oy`  
**Effort:** Zero (auto-deploys with build fix)

**Routes:**
- `/a11oy/fabric` — FabricCockpit
- `/a11oy/fabric/verticals` — VerticalsCommand
- `/a11oy/fabric/twins` — DomainTwins
- `/a11oy/fabric/signals` — FabricSignalMesh
- `/a11oy/fabric/risks` — RiskMatrix
- `/a11oy/fabric/decisions` — DecisionQueue
- `/a11oy/fabric/outcomes` — OutcomeMemory
- `/a11oy/fabric/evidence` — EvidenceLedger
- `/a11oy/fabric/roadmap` — EcosystemRoadmap

**Replit source:** `round2/a11oy_replit_coder/build/src/pages/fabric/` (9 files)

---

### SHIP-01D — Mesh Wire B Env Vars [P1 · Low effort]

**Target Space:** `SZLHOLDINGS/a11oy` HF Space secrets  
**Effort:** Low — env var configuration only

**Set in HF Space secrets:**
```
SENTRA_VERDICT_URL=https://szlholdings-sentra.hf.space/v1/verdict
AMARU_OBSERVE_URL=https://szlholdings-amaru.hf.space/v1/observe
ROSIE_EVENTS_URL=https://szlholdings-rosie.hf.space/v1/events
```

**Depends on:** SHIP-00, SHIP-01B

---

### SHIP-01E — a11oy Landing Page: Sync Post-Cron Version [P2 · Low effort]

**Target Space:** `SZLHOLDINGS/a11oy-platform` (static landing)  
**Effort:** Low — push updated HTML/CSS

**What:** The `_post_cron/a11oy/index.html` (hash `515e6efe`) and `_live_a11oy-platform/index.html` (hash `74b40f69`) are two distinct versions. The live HF uses the `74b40f69` version (Cinzel font, "44 Gates" nav). The Replit `_post_cron` version uses Space Grotesk. Confirm the live version is canonical and sync accordingly.

**Replit source:** `replit_landings/_live_a11oy-platform/index.html` + `replit_landings/_post_cron/a11oy/index.html`

---

### SHIP-02A — amaru: Conduit Landing TSX Verification [P1 · Low effort]

**Target Space:** `SZLHOLDINGS/amaru`  
**Current status:** RUNNING  
**Effort:** Low — smoke test

**What:** Verify that the `conduit-landing.tsx` source (hash `dfde8dc4`, 26927 bytes) is correctly bundled in the live amaru SPA. Check that `@szl-holdings/shared-ui/contact-modal` import resolves.

**Replit source:** `replit_landings/amaru/mined/conduit-landing.tsx`

Key elements to verify are live:
- 6 PILLARS (DLT.01 through GOV.06)
- SIGNAL_FEED live ticker
- Λ floor 0.90 convergence loop display
- Proof chain stages

---

### SHIP-02B — amaru: Moat Integration Test (a11oy policy) [P2 · Low effort]

**Target Space:** `SZLHOLDINGS/amaru` → `SZLHOLDINGS/a11oy`  
**Effort:** Low — test only

**Test:** Confirm amaru orchestration client can reach a11oy `/v1/policy` endpoint after SHIP-00/01B resolve.

**Depends on:** SHIP-00, SHIP-01B

---

### SHIP-02C — amaru: Landing Rosie Widget Embed [P2 · Low effort]

**Target Space:** `SZLHOLDINGS/amaru`  
**What:** `amaru/index_inline_rosie.html` (hash `5be457ad`, 10214 bytes) is the rosie-embedded version of the amaru landing. Verify the rosie widget appears on the live amaru space.

**Replit source:** `replit_landings/amaru/index_inline_rosie.html`

---

### SHIP-03A — sentra: Route Audit (118+ routes) [P1 · Low effort]

**Target Space:** `SZLHOLDINGS/sentra`  
**Current status:** RUNNING  
**Effort:** Low — spot-check

**Key routes to verify:**
- `/sentra/dashboard`
- `/sentra/agentic-soc`
- `/sentra/mitre`
- `/sentra/phantom-war-room`
- `/sentra/crisis-arena/architect/:id`
- `/sentra/slides`
- `/sentra/intel/darpa-mto`
- `/sentra/intel/pqc-readiness`
- `/sentra/intel/photonic-inference`
- `/sentra/intel/adversarial-defense`

**Replit source:** `repos/sentra/web/.replit-artifact/artifact.toml` — paths=["/sentra/"], VITE_PORT=4099

---

### SHIP-03B — sentra: Wire B Acceptance Test [P1 · Low effort]

**Target Space:** `SZLHOLDINGS/sentra` `/v1/verdict`  
**Test:** POST to `/v1/verdict` with policy payload; confirm `sentra_immune` function responds.  
**Depends on:** SHIP-01D

---

### SHIP-03C — sentra: Rosie Embed on Landing [P2 · Low effort]

**What:** The `sentra/index_rosie.html` (hash `45470654`, 3924 bytes) is the rosie-embedded sentra landing variant. Verify rosie widget is live on sentra HF Space.

**Replit source:** `replit_landings/sentra/index_rosie.html`

---

### SHIP-04A — vessels: Full Route Audit (95+ routes) [P2 · Low effort]

**Target Space:** `SZLHOLDINGS/vessels-app`  
**Current status:** RUNNING  
**Effort:** Low — spot-check

**Key routes:**
- `/vessels/` — marketing home
- `/vessels/dashboard` — command overview
- `/vessels/dark-vessel-detection`
- `/vessels/sanctions-screening`
- `/vessels/voyage-carbon-passport`
- `/vessels/blockchain-bol`
- `/vessels/sts-detection`
- `/vessels/ais-live`
- `/vessels/port-analytics`
- `/vessels/economics`

**Replit source:** `repos/vessels/web/.replit-artifact/artifact.toml` — paths=["/vessels/"], VITE_PORT=8099

---

### SHIP-04B — vessels: Mined Landing TSX (vessels-landing.tsx) [P2 · Medium effort]

**Target Space:** `SZLHOLDINGS/vessels-app` or `SZLHOLDINGS/vessels-platform`  
**What:** Build the `vessels/mined/vessels-landing.tsx` (hash `c0d1f225`, 29606 bytes) into a deployable landing. This is the full marketing landing with 6 PILLARS (SCN.01–GOV.06), SIGNAL_FEED, CAPABILITIES array, and fallback vessel data.

**Replit source:** `replit_landings/vessels/mined/vessels-landing.tsx`

---

### SHIP-04C — vessels: PQC Dual-Sign Backend [P2 · Low effort]

**Target Space:** `SZLHOLDINGS/vessels-app`  
**What:** ML-DSA-65 dual-sign (FIPS 204 / NSM-10 / CNSA 2.0) added in Cursor PR #58. Verify backend endpoint live.

---

### SHIP-05A — rosie: Widget Demo Page [P2 · Low effort]

**Target Space:** `SZLHOLDINGS/rosie-platform`  
**What:** Push `rosie/mined/index.html` (hash `e4386fed`, 4314 bytes) as a demo endpoint. This is the official `<rosie-widget>` Web Component demo page (Apache-2.0, complete with host-app switcher and accent controls).

**Replit source:** `replit_landings/rosie/mined/index.html`

---

### SHIP-05B — rosie: Wire C/D Activation [P2 · Low effort]

**Target Space:** `SZLHOLDINGS/rosie-platform`  
- Wire C: `/v1/events` — confirm rosie receives events from mesh-router
- Wire D: "Propose Action" panel — confirm a11oy policy check succeeds

**Depends on:** SHIP-00, SHIP-01B

---

### SHIP-05C — rosie: Embed in All 4 SPAs [P2 · Zero effort]

**Target:** `SZLHOLDINGS/sentra`, `SZLHOLDINGS/vessels-app`, `SZLHOLDINGS/amaru`, `SZLHOLDINGS/a11oy`  
**Effort:** Zero — auto from build fix

Verify rosie floating widget appears in all 4 SPAs post SHIP-00.

---

### SHIP-06 — Thesis / per-DOI: Replit Executables [P3 · Documentation]

**Target:** Zenodo DOI chain (already published), HF README links  
**What:** The `replit_per_doi/` executables (v14–v17) are already DOI-published. Ensure HF Space READMEs link to the correct Zenodo DOIs:
- v14: `10.5281/zenodo.20424992`
- v15: `10.5281/zenodo.20424995`
- v16: `10.5281/zenodo.20424996`
- v17: `10.5281/zenodo.20431181`
- Concept: `10.5281/zenodo.19944926`

---

## SHIP QUEUE SUMMARY TABLE

| Order | Ship ID | Target | Effort | Impact | Depends On |
|-------|---------|--------|--------|--------|-----------|
| 1 | SHIP-00 | Fix a11oy BUILD_ERROR (Dockerfile) | Low | CRITICAL | — |
| 2 | SHIP-01A | a11oy 133 pages auto-live | Zero | HIGH | SHIP-00 |
| 3 | SHIP-01C | a11oy Fabric 9 sub-pages | Zero | HIGH | SHIP-00 |
| 4 | SHIP-01B | a11oy backend API endpoints | Medium | HIGH | SHIP-00 |
| 5 | SHIP-01D | Mesh Wire B env vars | Low | HIGH | SHIP-01B |
| 6 | SHIP-01E | a11oy landing page sync | Low | Medium | — |
| 7 | SHIP-02A | amaru conduit-landing verify | Low | Medium | — |
| 8 | SHIP-02B | amaru moat integration test | Low | Medium | SHIP-01B |
| 9 | SHIP-02C | amaru rosie embed | Low | Low | SHIP-05A |
| 10 | SHIP-03A | sentra 118+ route audit | Low | Medium | — |
| 11 | SHIP-03B | sentra Wire B acceptance | Low | High | SHIP-01D |
| 12 | SHIP-03C | sentra rosie embed | Low | Low | SHIP-05A |
| 13 | SHIP-04A | vessels 95+ route audit | Low | Medium | — |
| 14 | SHIP-04B | vessels mined landing TSX | Medium | Medium | — |
| 15 | SHIP-04C | vessels PQC backend verify | Low | Medium | — |
| 16 | SHIP-05A | rosie widget demo page | Low | Medium | — |
| 17 | SHIP-05B | rosie Wire C/D | Low | Medium | SHIP-01B |
| 18 | SHIP-05C | rosie embed in all 4 SPAs | Zero | High | SHIP-00 |
| 19 | SHIP-06 | Thesis DOI links in READMEs | Low | Low | — |

---

## NOTES

- The `warhacker/usb/replit-sources/replit-sources.tar.gz` (7.95MB) ships on the USB diligence bundle — no HF upload needed.
- The Ouroboros `replit_payload_final/` parts (6 files, ~4.8M chars) deploy to Zenodo/Replit runtime, not HF Spaces directly.
- `reports/p1_replit_payload/` and `round2/phd_replit_archaeology/` are internal audit artifacts — no HF deploy.
- `_template/index.html` + `_template/style.css` (hash `c1a1338e`, `410cae30`) are the shared template for all landings — keep in sync when any landing updates.
