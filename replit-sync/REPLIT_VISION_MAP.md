# REPLIT VISION → CONSOLIDATED a11oy (deep-dive findings)

Source of truth: the original Replit build at `a11oy/web/src/` (92 components) + `platform.replit` roadmap.
This is what a11oy was ALWAYS meant to be. The consolidated HF a11oy must reflect THESE surfaces
(plain-language, real live data, genius viz). Do NOT invent generic tabs — map to these real intents.

## ORIGINAL ARCHITECTURE (platform.replit)
- pnpm monorepo, an **API server** (`artifacts/api-server`) behind a **substrate gateway** (port 8077)
  + an **AEF gateway** (port 4200, tenant szl-holdings) with **GUARDIAN_ENFORCE=true**, Postgres-16,
  OTEL, push (VAPID), PostHog analytics, Resend email.
- a11oy artifact = "Brand Orchestration Layer", routes `/`, `/nexus/`, `/command/` — a11oy already
  absorbed `/command/` (task #5090). a11oy is the front door; sentra/amaru(conduit)/vessels/counsel/
  terra/carlota-jo are sibling artifacts behind the same router.
- Real API surface (rosie/packages/api Hono server): tiered auth — operatorAuth on /v1/ask,/v1/receipts,
  /v1/mesh,/v1/doctrine,/v1/formulas,/v1/about ; executorAuth + step-up on /v1/execute,/v1/execute/confirm.

## ORIGINAL a11oy PAGES (from App.tsx lazy routes) — the intended tabs/surfaces
Command/ops:
- CommandSurface, NowBoard, SignalMesh, ActionRail, OperationalStatus, SzlOperationalCore, Ecosystem
Governed decision (the core product loop — components exist under operations/governed-decision/):
- decision-summary, policy-gate-panel, monte-carlo-panel, proof-provenance-panel, outcome-panel
Proof / provenance:
- ProofLedger, ProofEnvelope, ProofPacketDetail, CodexReceipts, RightToAudit, TrustCenter, Constitution
Reasoning / eval:
- LoopReasoner, ReasoningAudit, EvalEvolution, LessonGraph, MirrorEval, AdaptiveGovernance
Fleet / agents / workcells:
- AlloyFleet, Agents, Workcells, WorkcellDetail, WorkcellReplayDetail
Intelligence:
- IntelligenceCommand, IntelligenceDeepDive, IntelligenceRoiLens, OrgIntelligence, OrgRepoDeepDive
Models / routing / connectors:
- ModelRouter, RoutingWeights, ConnectorFirewall
Governance / security / compliance:
- AlloyGovernance, Governance, SecurityCompliance
Foundry / twins / lab:
- AlloyFoundry, TwinFoundry, Lab, PatternAtlasNative, PromptRegistryNative, EvalConsoleNative
Codex / formulas:
- Codex, CodexEntry, Formulas
Cross-organ:
- SentraOps (sentra inside a11oy)

## KEY COMMAND-CENTER COMPONENTS (components/command/) — already-designed panels to mirror
command-bar, voice-command-panel, correlation-map-viz, demo-launchpad-panel, ecosystem-pulse,
fusion-bar, guardian-decisions-tile, helios-proposals-inbox, intelligence-panel, ops-center-grid,
service-status-panel, signal-chains-panel, timeline, atlas-kpi-section, ambient-signal-ranker.
Plus: KnowledgeGraphViz, HeroCanvas, GovernancePanels, DefenseCrossNav.

## HOW TO MAP INTO THE CONSOLIDATED ~24-TAB a11oy (keep plain language)
- "Command Center" = ops-center-grid + atlas-kpi + service-status + ecosystem-pulse + demo-launchpad.
- "Governed Decision" (NEW, core loop) = decision-summary -> policy-gate -> monte-carlo -> proof-provenance
  -> outcome, wired to a11oy /v1/reason + sentra /verdict + signed receipt. THE product story.
- "Proof Ledger / Receipt Chain" = ProofLedger + CodexReceipts + RightToAudit -> the 3D hash-chain DAG.
- "Trust Center / Constitution" = TrustCenter + Constitution + What-We-Claim (honest doctrine).
- "Reasoning Audit" = LoopReasoner + ReasoningAudit + flame/waterfall.
- "Model Router / Routing Weights" = ModelRouter + RoutingWeights.
- "Agents / Workcells / Fleet" = Agents + Workcells + AlloyFleet -> roster + replay.
- "Intelligence" = IntelligenceCommand + correlation-map (Cytoscape ontology graph).
- "Connector Firewall" = ConnectorFirewall (governed tool/MCP access).
- "Signal Mesh / Living Organism" = SignalMesh -> the 3D organism with a11oy at center.
- "Ecosystem" = ecosystem-apps-grid (the surfaces: Command Platform + Drones&Vessels).

## HONEST NOTE
Many Replit pages used local seed data (a11oy/web/src/data/*.ts). In the consolidated app we replace
seed with LIVE endpoints (a11oy/sentra/amaru/rosie) + keyless public feeds (USGS/NVD/KEV/MITRE).
Where a surface has no live backend yet, show an honest "roadmap" state — do NOT fabricate numbers.
