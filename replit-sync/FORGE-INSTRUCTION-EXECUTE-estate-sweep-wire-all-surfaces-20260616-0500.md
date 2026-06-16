# ESTATE SWEEP — wire EVERY page-only surface to a REAL backing API (no half-state)

## THE PATTERN (same as immune was)
A sweep found ~14 a11oy surfaces serving a 200 PAGE but with NO backing `/api/a11oy/v1/<surface>/*` API (404). Pages read empty/shell. We fix this the immune way: wire each to REAL substance that already exists in the repo, with a signed Khipu receipt + honest doctrine labels. NEVER fabricate a fake status endpoint just to flip a 404 to 200 — if a surface has no real substance yet, label it honestly ROADMAP on the page and DO NOT mint a fake-LIVE API. Claiming more than is real is the only unacceptable outcome.

## GAPS (page=200, api=404) — verify each before wiring
sda, mbse, quant, holographic, qbio, nemo, factory, willay, qhawaq, waqay, yupay, autoreview, fabric, tawantin
(grc, constitution, restraint already have real APIs — leave them. sapa was rate-limited; re-check.)

## ASSIGNMENTS (5 Opus 4.8 devs). Each dev: read the repo for the REAL substance behind its surfaces, wire `/api/a11oy/v1/<surface>/{status,...}` to it, sign a Khipu receipt, add honest PROVEN/LIVE/ROADMAP labels, register EARLY in serve.py (mirror szl_kverify/szl_immune/szl_materials pattern), ast.parse before push, verify live. If a surface is genuinely empty, wire an HONEST `/status` that says ROADMAP with what's planned — never fake data.

### SWEEP DEV 1 — SDA (TOP PRIORITY, Warhacker defense centerpiece)
Real substance: a11oy_orbital_page.py, docs/vessels/* (warhacker-demo UDS package, AIS replay demo_ais_replay.sh, verify_receipts.sh), organs/sentra/sentra_drone_cyber.py, pages/counter-uas.html, static/3d/surfaces/counter-uas.js, the standalone SZLHOLDINGS/sda Space. Wire `/api/a11oy/v1/sda/{status,tracks,feed,verdict}`: real space/vessel/drone track objects (from the AIS replay sample data if present, labeled SAMPLE/REPLAY), a counter-UAS verdict path (reuse the real sentra_drone_cyber logic), each track/verdict signed into a Khipu receipt (SZL.SDA.*). status = honest summary (tracks count, source LIVE/REPLAY/SAMPLE, signed-receipt head). Wire the /sda page + counter-uas page to read it. New module szl_sda.py.

### SWEEP DEV 2 — MBSE + factory
mbse: read MBSE_FMI_RESEARCH (team/MASTERPLAN) + any mbse/fmi code in repo. Wire `/api/a11oy/v1/mbse/{status,models}` to the real Model-Based-Systems-Engineering / FMI substance if present; else honest ROADMAP status. factory: the agentic code-factory surface — wire `/api/a11oy/v1/factory/status` to the real a11oy_code_engine / agent-loop state (a11oy_agent_loop.py, a11oy_code_engine.py) honestly (agentic=true/labeled-stub). Khipu receipts. New module(s) szl_mbse.py / szl_factory.py.

### SWEEP DEV 3 — quant + qbio + holographic
quant: wire `/api/a11oy/v1/quant/status` to real quant substance (szl_formulas quant formulas / PNT / quantum-sensing pnt mesh which IS live at /pnt — link them honestly). qbio: the Quantum-Bio Λ-v5 surface (szl_quantum_bio register exists per serve.py) — find why /api/a11oy/v1/qbio/status 404s though qbio registered; wire the missing status. holographic: the 3D estate hologram — wire `/api/a11oy/v1/holographic/status` to the real mesh/3d data it renders. Honest labels, Khipu receipts. Modules szl_quant_surface.py etc. — or extend existing.

### SWEEP DEV 4 — nemo + the Quechua agent surfaces (qhawaq, waqay, yupay, willay)
nemo: SZL-Nemo = governed Qwen3-32B Apache (NEVER from-scratch/Ultra). Wire `/api/a11oy/v1/nemo/status` to the real governed-model registry (szl_llm_registry.py) honestly (model=Qwen3-32B-governed, Apache, served-tier). qhawaq/waqay/yupay/willay: these are honest Quechua-named agent/role surfaces — find their real backing (a11oy_org_rag, agent loop, the waqay/yupay doctrine endpoints that ARE live like /api/a11oy/v1/waqay/doctrine). Wire the missing /status for each to its REAL backing; if a role surface is pure-frontend, give it an honest ROADMAP status. Khipu receipts. NEVER a user-visible codename.

### SWEEP DEV 5 — fabric + tawantin + autoreview + verify/harden
fabric + tawantin: the Governed Distributed Compute Fabric — /tawantin + /fabric pages exist; the real data is /api/a11oy/v1/compute-pool-hardened (LIVE). Wire `/api/a11oy/v1/tawantin/status` + `/fabric/status` as honest aliases/summaries over the real compute-pool + energy + mesh data (do NOT duplicate; summarize the live sources). autoreview: wire `/api/a11oy/v1/autoreview/status` to the real autoreview/QA substance (TOP_TEAM_QA_PROCESS, any autoreview code). Then HARDEN: re-run the page-vs-api sweep after all devs land; confirm no NEW fake-LIVE; confirm doctrine grep + drift guards green.

## DOCTRINE HARD GATES (every dev)
locked=EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 (add NOTHING); Λ=Conjecture 1; Khipu=Conjecture 2; trust never 100%; SLSA L1/L2/L3-roadmap; effectors SIMULATED; 0 runtime CDN; NO user-visible codenames (amaru/rosie/sentra/jarvis); never commit a key; byte-identical shared modules; label every datum LIVE/MEASURED/SAMPLE/REPLAY/MODELED/ROADMAP. HONEST ROADMAP beats fake-LIVE.

## FILE-COLLISION DISCIPLINE
Each dev owns NEW modules (szl_sda.py, szl_mbse.py, etc.) + ONE register block each in serve.py. serve.py is shared → fetch FRESH sha right before each PUT, retry on 409 (8-12x), and NEVER clobber another dev's register block (re-apply onto newest content). ast.parse / node --check before push. Additive + try/except so nothing can take down the SPA. The console-tab-liveness CI guard FAILS on any fake-LIVE tab — respect it.

## DELIVERABLE
Each dev writes /home/user/workspace/team/MASTERPLAN/dev/RESULT_SWEEP_D{1..5}.md: surfaces wired, files+shas, LIVE curl proof (real json not shell), honest LIVE/ROADMAP labels per surface, any honest BLOCKED.
