# a11oy.net Full-Stack Audit — Eyes-On Defect List (2026-06-15, verified via screenshots)

Auditor verified each item visually. Demo June 18. killinchu/elite is the BAR — a11oy must match its polish.
Doctrine v11: every value labeled MEASURED/MODELED/SAMPLE; 0 runtime CDN; never fabricate; honest BLOCKED ok.

## CONFIRMED DEFECTS (eyes-on)

### D1 — /holographic 3D renderer DEAD (HIGH, demo-critical)
- Header badge reads `renderer: _` (blank — never initialized). The entire canvas under the tab row
  (Energy/Fabric/PNT/Counter-UAS/Governance/PINN/Router/Anatomy/Estate) is BLACK/EMPTY. No 3D renders.
- CONTRAST: /estate-hologram renders fine (WebGL2, globe+organism+light-flow, Λ 0.420 live). So the szl3d
  toolkit works; /holographic specifically fails to boot its renderer (likely a JS init error or the per-tab
  loader never mounts). FIX: get the renderer to initialize and each of the 9 tabs to draw its 3D scene bound
  to real data (energy=MEASURED joules, pnt=MODELED, pinn=MEASURED cert, counter-uas=killinchu signal, etc).

### D2 — /energy-ops not wired to live operator data (HIGH, demo-critical)
- Page says "RUNNING — computing non-stop" but shows nodes: 0, active jobs: —, "no node telemetry — DEGRADED",
  TOKENS GENERATED —, JOULES —, receipt feed all dashes.
- CONTRADICTS the live API: /api/a11oy/v1/energy/operator/status returns running:true, joules ~281,872 climbing,
  jobs ~10,549, node rtx-betterwithage computing, 286 signed receipts. The PAGE is not reading the live operator
  endpoint (or reading a wrong/empty field). FIX: wire the page to the live operator/status + ledger so JOULES,
  TOKENS, nodes-computing, and the receipt feed POPULATE with the real MEASURED values.

### D3 — Command Center async loads hang (MED-HIGH)
- /pinn (Command Center): Trust-posture 13-axis radar DOES render; but SERVICES UP stuck "probing…",
  CONNECTIONS —, DECISIONS TODAY —, Safety-gate-posture panel EMPTY (legend only), Service health stuck
  "probing 5 services…", Performance constants stuck "loading measured constants…". Async fetches never resolve
  or error silently. FIX: make these resolve (or show an honest error state), populate the counts + safety panel.

### D4 — /pnt and /pinn both render the generic Command Center (MED, routing)
- /pnt and /pinn show the SAME "Command Center" page, not distinct PNT (MODELED nav math) or PINN (MEASURED
  certificate) surfaces. Tabs that should be unique are falling back to the command center. FIX: route each to
  its real surface with its own 3D panel + data. (PNT API /pnt/limits + /pnt/sensor exist; PINN cert API exists.)

### D5 — 2 HF Spaces "down" = wrong URL form (MED)
- SZLHOLDINGS/energy and SZLHOLDINGS/anatomy are RUNNING, but they serve on the BARE host
  (szlholdings-energy.hf.space = 200, szlholdings-anatomy.hf.space = 200), NOT the `.static.hf.space` subdomain
  (both 404). Anything (page links, failover config, docs) pointing at `*.static.hf.space` for these two is
  broken. FIX: repoint every reference from `<x>.static.hf.space` to `<x>.hf.space` for energy + anatomy.
  (khipu/llm-router/mechanics do NOT exist as Spaces — ignore; not down, never created.)

## PARITY TARGET — what killinchu/elite has that a11oy should match
killinchu/elite is fully wired: live PPI radar 3D scope, auto-refresh intel feed (scheduler ENABLED, last-run,
next-run, interval), populated cards (active threats, total tracks, trust gate, signed receipts), rich left nav
(HERO 3D, Fleet Health 3D, Tamper-a-Receipt 3D, Determinism, UDS Package, 27 Warhacker demos, MESH, Restraint,
6DOF dynamics, Real-Data Provenance). a11oy's surfaces should populate + render to THIS standard.

## SURFACES STILL TO SPOT-CHECK (team: screenshot each, note empty/works)
From a11oy left nav: Ask&Act, Run-a-Demo, System-Health, Live-System-Map, Living-Organism, Reciprocity,
Receipt-Chain, Global-Pulse, Trust-Space, Service-Map, Knowledge-Ontology, Formulas, Vertical-Policies,
Trust-Score, Governed-Decision, Safety-Gates, Live-Decisions, Readiness&Compliance, Compliance/GRC.
Plus routes: /governance /restraint /defense-readiness /signature-is-not-proof /harvest /nemo /autoreview /factory.
