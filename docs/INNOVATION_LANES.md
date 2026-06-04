# SZL Holdings — Innovation Lanes

**Date:** April 22, 2026
**Purpose:** Current product reality per lane, immediate hardening, and differentiation roadmap

---

## LYTE — Decision Intelligence

### Current State
- **Artifact:** `artifacts/lyte-command-center` (Beta)
- **Backend:** Full API surface — actions, signals, fusion, surfaces, onboarding
- **Key features:** Action queue with acceptance rates, signal fusion engine, decision theater, Monte Carlo simulation, live SSE feeds
- **Packages:** `packages/planner`, `packages/simulation`, `lib/decision-engine`, `lib/decision-fabric`, `lib/outcome-graph`

### Immediate Hardening
- Wire remaining action outcomes to Outcome Graph persistence (Task #2094)
- Surface decision replay in the UI (Task #2096)
- Add automated tests for recommendation decision flow (Task #2095)

### Near-Term Differentiator: Governed Execution Intelligence
Move beyond "observable → actionable" into "actionable → executed → verified → learned."
- Live Outcome Graph view showing closed-loop metrics per agent and per domain
- ROI attribution: tag decisions with financial outcomes (revenue protected, cost avoided, time saved)
- Confidence drift alerts: notify operators when agent accuracy drops below calibrated threshold

### Medium-Term Moat
"Every decision has a receipt." No competing BI/observability platform can produce an end-to-end proof chain from signal to outcome with human approval gates and policy enforcement at every step. This is the structural moat.

### Proof Requirements
- Outcome Graph persistence with queryable history
- Acceptance/achievement rate calculations from real data
- Agent performance benchmarks with calibration curves

---

## AEGIS — Security / Defense / Resilience

### Current State
- **Artifact:** `artifacts/aegis` (Beta) + `artifacts/sentra` (Beta)
- **Backend:** SOC, MSP, Intelligence workspaces; alert management; incident lifecycle; MITRE ATT&CK v14 mapping
- **Live feeds:** CISA KEV, NVD CVE, MITRE ATT&CK, AbuseIPDB
- **Packages:** `packages/guardian` (policy engine)

### Immediate Hardening
- Wire 8 new security modules to live API/case management
- Connect detection drift visibility to the AI Ops Dashboard
- Add SOAR playbook execution with approval gates

### Near-Term Differentiator: Trustworthy Autonomous Assistance
- Control coverage mapping: every security control mapped to policy → detection → response chain
- Alert-to-decision-to-remediation traceability via Proof Chain
- Policy-gated response actions: AI recommends, human approves, system executes, proof records
- Detection drift visibility: show when detection rules are stale relative to current threat landscape

### Medium-Term Moat
"Autonomous defense with explicit human control." No SOAR/SIEM platform offers governed execution with full decision replay and policy enforcement. The Guardian engine evaluates every response action against organizational policy before execution.

### Risks
- Live SIEM/EDR integrations needed for production use (Sentinel, CrowdStrike, SentinelOne)
- SOC-scale data volumes require Redis/streaming infrastructure

---

## VESSELS — Maritime Intelligence

### Current State
- **Artifact:** `artifacts/vessels` (Partial)
- **Backend:** Fleet management, voyage lifecycle, S&P workflow, demurrage, freight economics
- **Live feeds:** NOAA CO-OPS, Open-Meteo Marine, GDELT
- **Gap:** AIS telemetry simulated (live AIS requires paid subscription: $15-40K/year)

### Immediate Hardening
- Wire 3 commercial modules (insurance, trading, platform) to DB/API
- Add DB-backed voyage P&L persistence
- Connect anomaly detection to Signal Mesh for cross-domain triggers

### Near-Term Differentiator: Voyage Decision Intelligence
- Exception graph: every anomaly (delay, diversion, sanctions risk) linked to economic impact and legal exposure
- Proof-backed risk explanation: "This vessel was flagged because [AIS gap + sanctions list match + weather deviation], confidence 0.87, source references: [OFAC SDN entry, AIS track, weather forecast]"
- Demurrage action recommendation with Monte Carlo on recovery probability

### Medium-Term Moat
"Voyage decision intelligence with legal/economic replayability." No maritime platform connects AIS anomaly detection to legal exposure assessment to financial impact simulation to governed execution — all with proof chain.

### Proof Requirements
- Live AIS data (paid subscription)
- Charter party clause extraction (NLP)
- Demurrage calculation engine validated against industry standards

---

## TERRA — Real Estate Intelligence

### Current State
- **Artifact:** `artifacts/terra` (Beta)
- **Backend:** Distress pipeline (NYC Open Data), ownership graph, deal workflow, diligence room, portfolio management
- **Live feeds:** NYC Open Data, Census ACS, BLS, FEMA, SEC EDGAR
- **Gap:** No live MLS/CoStar; Mapbox token missing

### Immediate Hardening
- Configure Mapbox token for map rendering
- Surface diligence evidence validation errors in UI (Task #3141)
- Wire diligence lifecycle smoke into CI (Task #3142)

### Near-Term Differentiator: Property Command Intelligence
- Entity convergence graph: ownership, risk, filing history, project status, and open issues in a single queryable view
- Distress-to-acquisition pipeline: automated distress signal → risk assessment → deal recommendation → approval gate → execution tracking
- Proof chain on every deal decision: "This property was flagged because [3 DOB violations + tax lien + owner LLC dissolved], assessed at $X with Y% confidence"

### Medium-Term Moat
"Property command intelligence" — not passive analytics. Every distress signal generates a governed decision loop. NYC distress data is the live differentiator; national expansion via additional municipal data feeds.

### Proof Requirements
- NYC Open Data distress pipeline validated and documented
- Diligence room with evidence persistence
- Deal workflow with approval gates

---

## PRISM COUNSEL / LEGAL

### Current State
- **Artifact:** `artifacts/counsel` (Beta) — supersedes legacy `prism-counsel`
- **Backend:** Matter management, court filings, recovery operations, evidence tracking
- **Legacy:** PRISM domain API routes retained in api-server; `artifacts/prism-counsel` archived

### Immediate Hardening
- Complete Counsel UI migration from legacy PRISM
- Wire obligation tracking to deadline alerts
- Add citation/evidence management (Tasks #3139, #3140)

### Near-Term Differentiator: Matter Command with Proof-Backed Execution
- Obligations + deadlines → automatic recommendation → approval gate → execution
- Evidence chain: every filing linked to source documents, clause references, and risk lineage
- Matter health score: automated assessment based on filing status, deadline proximity, and evidence completeness

### Medium-Term Moat
"Matter command with proof-backed operational execution." Every legal action has a full audit trail from the triggering event through the filing to the outcome.

---

## CARLOTA JO — Premium Advisory

### Current State
- **Artifact:** `artifacts/carlota-jo` (Beta)
- **Backend:** Client management, service catalog, engagement management, billing
- **Gap:** Task #1367 fixing middleware blocking public endpoints

### Immediate Hardening
- Fix public endpoint middleware (Task #1367)
- Save sent invoice emails for audit trail (Task #1368)
- Add vendor workflow tracking

### Near-Term Differentiator: White-Glove Operations Command
- Concierge operations with rigorous accountability: every client interaction logged, every service request tracked through governed workflow
- Vendor management with approval gates: engagement → approval → execution → proof
- Issue resolution traceability: from client report through investigation to resolution with full evidence chain

### Medium-Term Moat
"White-glove operations command layer." Premium advisory with the same governance infrastructure as enterprise operations.

---

## PULSE — AI Executive Briefing

### Current State
- **Artifact:** `artifacts/pulse` (Beta)
- **Backend:** Signal synthesis, narrative briefing generation, drift tracking, saved briefings
- **Integration:** Pulls from all domain signal feeds

### Immediate Hardening
- Wire drift trend chart to continuous background sampling (already scheduled at 15-min intervals)
- Add briefing version history with diff view

### Near-Term Differentiator: Synthesized Intelligence with Provenance
Every statement in a briefing is linked to its source signals with confidence scores. The reader can click any claim and trace it back to the raw data that generated it.

### Medium-Term Moat
"AI briefing with full attribution." No executive briefing tool provides provenance for every synthesized claim.
