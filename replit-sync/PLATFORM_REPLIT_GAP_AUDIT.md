# PLATFORM / REPLIT — APP-CAPABILITY GAP AUDIT (deep-dive, build-ready)

**Auditor:** subagent (app-capability gap focus)
**Date:** 2026-06-06
**Scope (NEW, non-overlapping):** the `szl-holdings/platform` monorepo's **app-facing trees** that the prior
audits did NOT examine for app-capability gaps. Prior `audit_platform.md` covered CI/integrity/honesty only;
`REPLIT_DEEPDIVE_5PASS.md` + `CONSOLIDATION_LEDGER.md` covered the a11oy CLONE + organ ingest. This audit asks a
different question: **does the platform repo expose an app-facing capability (view/data/endpoint) that a11oy
(26 tabs) or killinchu (25 tabs) NEED but don't have — and is the source real enough to wire on real data?**

**Access used:** GitHub contents API `GET /repos/szl-holdings/platform/contents/<path>` (base64). Raw CDN is
private/empty; contents API returns content. All platform paths below are verified-present this session.

**Honesty doctrine carried through (ABSOLUTE):** Λ = **Conjecture 1**, never a theorem. Proved formulas = exactly
5 {F1,F11,F12,F18,F19}. SLSA **L1+L2** only (no L3/FedRAMP/Iron Bank/CMMC). No user-visible jargon. **No mock** —
every "make-real" below names a real source; where there's no live backend, the wiring is an HONEST "roadmap"
state, never fabricated numbers. Seed JSON from the platform repo is real, citable demo content (clearly labelled
"sample / not a live feed"), which is the same honest posture both apps already use today.

**Current app surfaces (authoritative, from `a11oy_qa_report.md` + `killinchu_qa_report.md`):**
- **a11oy (26 tabs):** Command Center, Ask & Act, Run a Demo, System Health, Live System Map | Living Organism,
  Receipt Chain, Global Pulse, Trust Space, Service Map | Knowledge Ontology, Formulas, Vertical Policies | Trust
  Score, Safety Gates, Live Decisions, Readiness & Compliance, Forecast | Signed Receipts, Threat Library | CVE
  Watch, Known-Exploited, Adversary Techniques | Model Router, Agent Tools, What We Claim.
- **killinchu (25 tabs):** Live Track Board, Sensor-Fusion, Multi-Track Priority | Maritime Picture, Sanctions &
  Dark-Vessel | Engagement Rules, Trust Score Monitor, Consensus (3-of-4), Autonomy Governance | Engagement Audit,
  Verify Signed Receipt, Quantum-Safe Signing | Protocol Decoders, Geofence Zones, Swarm Topology, Threat Class DB
  | Living Organism, Receipt Chain, Global Pulse | Knowledge & Formulas, Safety Gates, What We Claim | CVE Watch,
  Known-Exploited, Adversary Techniques.

---

## (1) COVERAGE TABLE — every app-facing platform capability, classified

| # | Capability (platform/Replit) | Where found (exact path) | a11oy status | killinchu status | Verdict | Make-real source |
|---|---|---|---|---|---|---|
| 1 | **Vessel fleet-management data** (20+ vessels: IMO/MMSI, CII rating+value, hull/engine health, TCE, utilization, EEXI, trade lane, operator, class society) | `seed-data/vessels/vessels.json` (17.9KB) | N/A (not maritime-commercial) | **MISSING & NEEDED** | **GAP** | Static JSON; serve directly as labelled sample feed |
| 2 | **Predictive maintenance** (component, failure probability %, predicted date, cost, risk level, confidence) | `seed-data/vessels/predictive-maintenance.json` | N/A | **MISSING & NEEDED** | **GAP** | Static JSON → table + risk chart |
| 3 | **Vessel compliance certificates** (SMC/IOPP/DOC, issuer, expiry, days-until-expiry, regulation cite) | `seed-data/vessels/compliance-certificates.json` | N/A | **MISSING & NEEDED** | **GAP** | Static JSON → "expiring soon" board |
| 4 | **Port-state-control deficiencies** (Paris/Tokyo MOU, deficiency code, SOLAS/MARPOL cite, severity, status) | `seed-data/vessels/port-state-deficiencies.json` | N/A | **MISSING & NEEDED** | **GAP** | Static JSON → deficiency register |
| 5 | **Fleet AI briefings** (regulation-cited, MARPOL Annex VI / IMO MEPC.352/355(78), confidence %, action items, affected vessels) | `seed-data/vessels/ai-briefings.json` | N/A | **MISSING & NEEDED** | **GAP** | Static JSON → briefing cards (HIGH demo value) |
| 6 | **Fleet forecast modules** (TCE, CII gCO2/DWT·nm, utilization %, Baltic Dry Index — ready-to-chart timeseries with forecast points + confidence) | `seed-data/vessels/forecast-modules.json` | N/A | **MISSING & NEEDED** | **GAP** | Static JSON → line charts (drop-in) |
| 7 | **Vessel event logs** (engine/critical, timestamp, K-Chief source, SMS section) + maintenance logs + shipments | `seed-data/vessels/{event-logs,maintenance-logs,shipment-records}.json` | N/A | **MISSING & NEEDED** (lower pri) | **GAP** | Static JSON → live ops log |
| 8 | **Vessels vertical "Voyage Risk Exchange" governed-decision loop** (signals→forecast→evidence→recommendation→brief, typed input/output classes, rollback path) | `services/verticals/vessels/{signals,forecast,evidence,recommendations,brief}.py` + `contracts.py` | **MISSING & NEEDED** (as the core "Governed Decision" loop) | **MISSING & NEEDED** | **GAP** | Real Python loop; port logic to a Governed-Decision view (a11oy) + voyage-risk panel (killinchu) |
| 9 | **Command Arena eval leaderboard** (5 multi-domain scenarios incl. maritime, 7 weighted score dimensions, pass/fail, agent leaderboard, run report MD+JSON) | `generated/arena-results/arena-*.{json,md}` + `evals/scenarios/smoke/*.json` + `apps/eval-runner/` (FastAPI harness, real graders) | **MISSING & NEEDED** (EvalEvolution/EvalConsole/MirrorEval were intended Replit pages, never built) | N/A (a11oy-side) | **GAP** | Static arena JSON renders now; eval-runner is a real backend for live runs (roadmap) |
| 10 | **Calibrated business-metric forecaster** (deterministic exp-smoothing, 80%/95% prediction intervals, calibration coverage score, determinism hash) | `services/meridian_forecast_lab/forecast_lab.py` | **PARTIAL** — Forecast tab exists but wires sentra's *Madhava math-series* convergence demo, not business metrics or prediction intervals | N/A | **PARTIAL GAP** | Real Python; produces `reports/forecast-baseline.json` → upgrade Forecast tab with PI bands |
| 11 | **Vertical policy moats registry** (13 verticals: id/title/purpose/owner/pack_status live·stub·roadmap/MCP capabilities) | `services/verticals/{registry.py,vertical_moats.json}` | **MISSING & NEEDED** (no "what governed surfaces exist" view; Vertical Policies tab is the 10–11 regulated-industry YAMLs, a different thing) | N/A | **GAP (minor)** | Static JSON → ecosystem/vertical-pack grid |
| 12 | **SRE/incident command data** (signals from CloudWatch/PagerDuty/Datadog, SEV-1 playbooks, command cards, recommendations) | `seed-data/lyte/*.json` | N/A (belongs to `lyte-command-center` artifact, a separate flagship) | N/A | **N/A** | Not an a11oy/killinchu need — own flagship |
| 13 | **Cross-domain cascade demo** (vessels port-delay → terra + prism-counsel cascade, expected-cascade assertions) | `evals/scenarios/smoke/maritime-delay-cascade.json` | possible (Live Decisions feed) | possible (maritime) | **GAP (minor)** | Static JSON → one scripted cascade in Run-a-Demo |
| 14 | Customer/commercial portal (OIDC sign-in, API keys, quotas, BoE export) | `services/customer-portal/` | N/A — README explicitly: "deliberately **not** an a11oy tab" | N/A | **N/A** | Correct KEEP-SEPARATE microservice |
| 15 | api-server / alloy-fabric-api / graphql-gateway / control-plane / workers / substrate inference | `services/*`, `apps/{alloy-*,substrate-inference}`, `workers/*`, `substrate/` | N/A (server-side) | N/A | **N/A** | Live backend, KEEP-SEPARATE (already in ledger) |
| 16 | Release-governance + feedback schemas (go/no-go, launch council, post-release, feedback status model) | `elite-layer/{release-governance,feedback}/*.md` | N/A (internal process docs, not a product surface) | N/A | **N/A** | Internal ops docs |
| 17 | Content/marketing/proof-pack (demo video, banners, investor summary, screenshot guides, org-profile README) | `content-package/`, `proof-pack/`, `org-profile/`, `profile-readme/` | N/A (collateral, not app capability) | N/A | **N/A** | Marketing collateral, not a tab |
| 18 | Observability (Grafana/Prometheus/cost dashboards), generated platform-metrics, M365 integration | `observability/*`, `generated/platform-metrics.json`, `integrations/m365` | partial (System Health/Service Map already cover the app's own live mesh) | N/A | **N/A** | Backend dashboards; app health already covered |
| 19 | Replit payload prompts (alloy-meridian agent prompt, mcp-activation, ecosystem) | `payloads/replit-*.{md,json}` | N/A (build-time agent prompts) | N/A | **N/A** | Historical Replit build prompts |

---

## (2) RANKED LIST OF TRUE GAPS TO CLOSE (build-ready)

Ranked by **demo / Warhacker value × ease-of-real**. Every item names the exact source path, the target app,
and how to wire it on REAL data with the honesty label. **None require a new backend except where marked
"roadmap".**

### GAP-1 — killinchu "Vessels" commercial fleet surface (the biggest hole). TARGET: **killinchu**. HIGH value.
**Problem (honest):** killinchu is branded "DRONES & **VESSELS**" but its only vessel content is 5 hardcoded
counter-UAS/dark-vessel sample ships in `killinchu/_live_elite.py` (`SAMPLE_VESSELS`, lines ~524–542). There is
**zero commercial fleet-management capability**, while the platform repo holds a complete, realistic dataset.
**Source (all real, present this session):**
- `seed-data/vessels/vessels.json` — 20+ vessels w/ CII rating+value, hull/engine health, TCE, utilization, EEXI, operator, class society.
- `seed-data/vessels/forecast-modules.json` — drop-in chart timeseries (TCE, CII, utilization, BDI) **with forecast points + confidence**.
- `seed-data/vessels/predictive-maintenance.json` — failure-probability/date/cost/risk per component.
- `seed-data/vessels/compliance-certificates.json` + `port-state-deficiencies.json` — expiring certs + Paris/Tokyo-MOU deficiencies w/ SOLAS/MARPOL cites.
- `seed-data/vessels/ai-briefings.json` — regulation-cited (MARPOL Annex VI, IMO MEPC.352/355(78)) briefings w/ confidence + action items.
**How to wire (real, no mock):** add a killinchu nav group **"FLEET (Vessels)"** with 2–3 tabs:
"Fleet Overview" (vessels table + the 4 forecast-module line charts), "Maintenance & Compliance" (predictive-maintenance
risk + expiring certs + PSC deficiencies), "Fleet Briefings" (ai-briefings cards). Serve the JSON verbatim from the
killinchu server as a static endpoint (mirror the existing `SAMPLE_VESSELS` pattern). **Honesty label (mandatory,
mirror existing maritime tab):** "Sample fleet dataset — not a live AIS/class-society feed." This converts
killinchu from "counter-UAS only" to a true **DRONES & VESSELS** dual surface and is the single highest-impact,
lowest-risk demo upgrade.

### GAP-2 — Governed-Decision loop as a first-class a11oy view. TARGET: **a11oy** (+ killinchu voyage-risk panel). HIGH value.
**Problem (honest):** `REPLIT_VISION_MAP.md` calls the signal→policy-gate→monte-carlo→proof-provenance→outcome loop
"THE product story / core loop," and Replit shipped components for it (`operations/governed-decision/*`), but the
live 26-tab a11oy has **no Governed-Decision tab**. The platform repo proves this loop is real backend code.
**Source (real Python):** `services/verticals/vessels/{signals.py,forecast.py,evidence.py,recommendations.py,brief.py}`
+ `services/verticals/contracts.py` (typed `Recommendation` w/ `input_class`/`output_class`/`rollback_path`/`evidence_ids`).
Reference run output: `generated/arena-results/arena-*.md` (shows the loop scoring on the `maritime-delay-cascade`
scenario at 0.858, PASS).
**How to wire:** add an a11oy **"Governed Decision"** tab under DECIDE & GOVERN that walks one real decision end-to-end:
collect signals → forecast → attach evidence ids → recommendation (with rollback path) → signed receipt. Port the
five-stage Python logic to the server (it's pure functions, ~5 small files) and bind the output through the
existing a11oy `/v1/reason` + sentra `/verdict` + receipt path that the app already calls. Show Λ = advisory
(Conjecture-1) on the gate, not a pass/fail oracle. This makes the "measurable governance operator" claim visibly
true. (killinchu reuse: same loop powers a "Voyage Risk" recommendation card on its Maritime tab.)

### GAP-3 — Command Arena / Eval leaderboard view. TARGET: **a11oy**. HIGH demo value.
**Problem (honest):** Replit intended `EvalEvolution` / `EvalConsoleNative` / `MirrorEval` pages (per
`REPLIT_VISION_MAP.md`); none exist in the live 26 tabs. The platform repo has a **finished, citable eval artifact**
and a real harness.
**Source:** `generated/arena-results/arena-1776831038439.{json,md}` (5 scenarios, 7 weighted dimensions —
correctness/evidence/approval/replay/policy/hallucination-resistance/tool-efficiency — agent leaderboard, 100% pass)
+ `evals/scenarios/smoke/*.json` (the 5 scenario definitions w/ pass thresholds) + `apps/eval-runner/` (FastAPI
harness with **real graders** `exact_match`/`contains`, deterministic content-hash, domain suites for
vessels/terra/aegis/sentra/counsel).
**How to wire (real now):** add an a11oy **"Eval Arena"** tab that renders the arena JSON as a leaderboard + a
per-scenario dimension breakdown (radar/bars), with each scenario linking to its definition. Label honestly:
"Run report from the SZL eval harness (`eval-runner`), 2026-04-22 — deterministic, content-hashed." **Roadmap line
(honest):** live re-runs require deploying `eval-runner` (FastAPI, CPU image exists); until then the tab shows the
recorded run, not a live button. This is a strong "we measure ourselves" Warhacker beat.

### GAP-4 — Upgrade a11oy Forecast tab to calibrated prediction intervals. TARGET: **a11oy**. MEDIUM value.
**Problem (honest):** the Forecast tab (#forecast) currently runs sentra's **Madhava math-series convergence** demo
(a π-series witness), which is a proof curiosity, not a forecast. The QA report flags it as "empty until triggered,
UX could be improved."
**Source (real):** `services/meridian_forecast_lab/forecast_lab.py` — deterministic exponential-smoothing baseline
producing per-metric **point forecast + 80% and 95% prediction intervals + calibration coverage score + determinism
hash** over 7 business metrics (revenue velocity, delivery risk, incident likelihood, cash runway, etc.). Emits
`reports/forecast-baseline.json`.
**How to wire:** run the lab once (pure Python, no network) to produce the baseline JSON, ship it as a static
endpoint, and render PI bands + calibration score. Keep the Madhava demo as an optional "math witness" sub-panel if
desired. Honesty label: "Deterministic calibrated baseline (exp-smoothing); intervals are model PIs, not
guarantees." Research-seam note already in the file (Darts/StatsForecast/Arize Phoenix) = honest roadmap.

### GAP-5 — Vertical-pack / "what governed surfaces exist" grid. TARGET: **a11oy**. MEDIUM value.
**Problem (honest):** the Ecosystem framing in `REPLIT_VISION_MAP.md` ("Command Platform + Drones&Vessels") is
under-told. The platform repo has a machine-readable registry of **13 vertical packs** with honest live/stub/roadmap
status — exactly the "breadth, honestly labelled" story.
**Source:** `services/verticals/vertical_moats.json` + `registry.py` — 9 live (Platform/AgentOps, Pulse,
Finance "Capital Weather", Lyte/KORA, Terra "Acquisition Time Machine", **Vessels "Voyage Risk Exchange"**, PRISM
Counsel, Marketing Growth, Sentra Cyber) + 4 stub/roadmap (Firestorm Ops, NuroForge, Meridian Infra,
Constellation Graph).
**How to wire:** a small grid on the a11oy Ecosystem/Command surface listing each vertical pack with its purpose and
a live/stub/roadmap chip (color-coded, honest). Pure static JSON. Low risk, reinforces "platform, not a toy."

#### Lower-priority gaps (real, but smaller demo lift)
- **GAP-6 (killinchu/a11oy):** scripted cross-domain cascade in "Run a Demo" using
  `evals/scenarios/smoke/maritime-delay-cascade.json` (port-delay → terra + prism-counsel). Static JSON, one canned
  walkthrough.
- **GAP-7 (killinchu):** vessel event/maintenance/shipment live-ops log from
  `seed-data/vessels/{event-logs,maintenance-logs,shipment-records}.json` — folds naturally into GAP-1's Fleet group.

---

## (3) "NOTHING MISSING" — categories where the apps are already complete (confidence statements)

These platform/Replit capabilities are **already fully represented** in the apps, or are correctly **N/A
(server-side / collateral)**. No action needed.

- **NOTHING MISSING — Receipts / proof / signing.** a11oy (Signed Receipts, Receipt Chain) and killinchu (Verify
  Signed Receipt, Quantum-Safe Signing, Receipt Chain) already implement DSSE verify + tamper-detect + PQC on real
  keys. The platform's `customer-portal` BoE export and api-server `/v1/receipts` are server-side equivalents
  (KEEP-SEPARATE). Both apps' receipt tabs are demo-proven (tamper test returns FAIL).
- **NOTHING MISSING — Knowledge / formulas / vertical policies.** a11oy (Knowledge Ontology, Formulas, Vertical
  Policies) and killinchu (Knowledge & Formulas) already serve the `knowledge.json` ontology + the 10–11 regulated-
  industry policy YAMLs. The platform's vertical *moats* registry (GAP-5) is a different, additive "pack catalog,"
  not the regulated-industry policies — so the policy capability itself is complete.
- **NOTHING MISSING — Threat / world intel.** Both apps carry CVE Watch, Known-Exploited (KEV), Adversary Techniques
  (MITRE ATT&CK), plus killinchu's Threat Class DB. The platform exposes no additional app-facing threat surface.
- **NOTHING MISSING — Trust score / safety gates / Λ.** a11oy (Trust Score, Safety Gates) and killinchu (Trust Score
  Monitor, Safety Gates, Autonomy Governance) already render the 13-axis Λ with the Conjecture-1 disclaimer and
  floor=0.90. The platform's `doctrine-runtime`/`a11oy-observability` Λ code is the same primitive, server-side.
- **NOTHING MISSING — Counter-UAS / sensor fusion / geofence / swarm / protocols.** killinchu fully covers Live
  Track Board, Sensor-Fusion, Multi-Track Priority, Engagement Rules, Engagement Audit, Geofence Zones, Swarm
  Topology, Protocol Decoders. The platform repo has **no** drone/counter-UAS app-facing capability beyond what
  killinchu already exposes (drone data lives in killinchu's own `drones_db.json`).
- **NOTHING MISSING — System health / mesh / organism / pulse (3D brain).** Both apps share the 3D organism, live
  mesh map, global pulse, and service/system health. Platform `observability/*` and `generated/platform-metrics.json`
  are backend dashboards, not an app gap. (3D-canvas rendering defects are tracked separately in the QA reports;
  that is a render bug, not a missing capability.)
- **N/A (correctly KEEP-SEPARATE), confirmed:** `services/{api-server,alloy-fabric-api,graphql-gateway,
  meridian_control_plane,substrate-mcp-gateway,substrate-py-workers,lyte-metrics-store,vsp-otel}`,
  `apps/{alloy-embedding-api,alloy-ingestion-orchestrator,alloy-runtime-api,substrate-inference}`, `workers/*`,
  `substrate/`, `services/customer-portal` (README explicitly "not an a11oy tab"). These are the live backend —
  the apps call organ REST endpoints directly (CORS-open), exactly as the consolidation ledger records. `seed-data/
  lyte/*` belongs to the separate `lyte-command-center` flagship, not a11oy/killinchu. `elite-layer/*` (release
  governance + feedback) are internal process docs. `content-package/`, `proof-pack/`, `org-profile/`,
  `profile-readme/`, `payloads/` are collateral / build prompts, not product capabilities.

---

## HONEST CAVEATS ON THE GAPS

- All `seed-data/vessels/*` and `generated/arena-results/*` are **sample/recorded** content. Wiring them is honest
  **only** with the visible "sample dataset — not a live feed" label (the same posture killinchu's Maritime tab
  already uses). Do not present them as live AIS/class-society/eval-runtime data.
- The `services/verticals/vessels/*` and `meridian_forecast_lab` logic is **real Python** but currently runs in the
  platform backend; porting it into the app server is a real wiring task (pure functions), not a fabrication. The
  live re-run paths (eval-runner re-runs, control-plane-backed forecasts) are **roadmap** until those services are
  deployed — state that honestly in-tab.
- Nothing here changes the doctrine: Λ stays **Conjecture 1**, proved-formulas stays **5**, SLSA stays **L1+L2**.
  The Governed-Decision gate (GAP-2) must show Λ as an **advisory** operator, never a pass/fail oracle.

## DO-NOT (per task)
This audit produced the build-ready list only. The apps were **not** modified. Parent dispatches builders.
Cited platform paths are exact and verified-present this session via the contents API.
