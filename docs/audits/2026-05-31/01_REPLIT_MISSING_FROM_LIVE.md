# 01 — REPLIT MISSING FROM LIVE HF SPACES
> Audit date: 2026-05-31  
> HF Org: `SZLHOLDINGS`  
> Definition: "MISSING" = artifact exists in Replit source but is NOT surfaced on the live HF Space  
> Status determined by comparison of Replit source vs wave4_hf_crew/live_surfaces/ snapshots + hf_files/

---

## Summary

| HF Space | Replit Pages | HF Status | MISSING count |
|----------|-------------|-----------|---------------|
| `SZLHOLDINGS/a11oy` | 133 pages + full React SPA | **BUILD_ERROR** | **133 pages** — ALL MISSING |
| `SZLHOLDINGS/sentra-platform` | 118+ routes | RUNNING (static landing only) | SPA not fully exposed |
| `SZLHOLDINGS/amaru` | Full conduit SPA | RUNNING (sidecar + static) | TSX source not bundled to HF |
| `SZLHOLDINGS/vessels-app` | 95+ routes | RUNNING | Vite app deployed; vessels-landing.tsx mined source not on HF |
| `SZLHOLDINGS/rosie-platform` | rosie widget demo | RUNNING (gradio) | Widget demo (mined/index.html) not on HF |
| `SZLHOLDINGS/a11oy-platform` | Static landing | RUNNING (static) | Replit landing variant (`_post_cron/a11oy`) differs from live |

---

## CRITICAL — SZLHOLDINGS/a11oy: ALL 133 PAGES MISSING (BUILD_ERROR)

The live HF Space `SZLHOLDINGS/a11oy-platform` serves only a static 329-line HTML landing page (no React, no `/a11oy/*` routes). The full React SPA (133 routes) is blocked by a Docker build error introduced when Cursor added `@szl-holdings/anatomy-contracts` (PR #263) and `@szl-holdings/shared-ui` sub-path exports (./sentient-layer) that the HF Space Dockerfile cannot resolve.

**Every one of these 133 routes is MISSING from the live HF Space:**

| Route | Component | Severity |
|-------|-----------|----------|
| `/a11oy/` | HomePage.tsx | P0 — primary investor entry |
| `/a11oy/command` | CommandSurface.tsx | P0 — primary operator console |
| `/a11oy/governance` | Governance.tsx | P0 |
| `/a11oy/proof` | ProofLedger.tsx | P0 — receipt chain |
| `/a11oy/trust` | TrustCenter.tsx | P0 |
| `/a11oy/constitution` | Constitution.tsx | P0 |
| `/a11oy/investor-demo` | InvestorDemo.tsx | P0 |
| `/a11oy/boardroom` | BoardroomMode.tsx | P0 |
| `/a11oy/now` | NowBoard.tsx | P1 |
| `/a11oy/signals` | SignalMesh.tsx | P1 |
| `/a11oy/actions` | ActionRail.tsx | P1 |
| `/a11oy/agents` | Agents.tsx | P1 |
| `/a11oy/workcells` | Workcells.tsx | P1 |
| `/a11oy/workcells/:id` | WorkcellDetail.tsx | P1 |
| `/a11oy/workcells/:id/replay` | WorkcellReplayDetail.tsx | P1 |
| `/a11oy/evals` | MirrorEval.tsx | P1 |
| `/a11oy/connectors` | ConnectorFirewall.tsx | P1 |
| `/a11oy/twins` | TwinFoundry.tsx | P1 |
| `/a11oy/model-router` | ModelRouter.tsx | P1 |
| `/a11oy/skills` | SkillsLibrary.tsx | P1 |
| `/a11oy/replay` | WorkcellReplay.tsx | P1 |
| `/a11oy/replay/:id` | SovereignReplayDetail.tsx | P1 |
| `/a11oy/security-compliance` | SecurityCompliance.tsx | P1 |
| `/a11oy/right-to-audit` | RightToAudit.tsx | P1 |
| `/a11oy/sovereign` | Sovereign.tsx | P1 |
| `/a11oy/flexcache` | FlexCacheRuntime.tsx | P1 |
| `/a11oy/terminal` | Terminal.tsx | P1 |
| `/a11oy/nexus` | Praxis.tsx | P1 |
| `/a11oy/mcp-hub` | McpHub.tsx | P1 |
| `/a11oy/agentic-rag` | AgenticRag.tsx | P1 |
| `/a11oy/fabric` | FabricCockpit.tsx | P1 |
| `/a11oy/fabric/verticals` | VerticalsCommand.tsx | P1 |
| `/a11oy/fabric/twins` | DomainTwins.tsx | P1 |
| `/a11oy/fabric/signals` | FabricSignalMesh.tsx | P1 |
| `/a11oy/fabric/risks` | RiskMatrix.tsx | P1 |
| `/a11oy/fabric/decisions` | DecisionQueue.tsx | P1 |
| `/a11oy/fabric/outcomes` | OutcomeMemory.tsx | P1 |
| `/a11oy/fabric/evidence` | EvidenceLedger.tsx | P1 |
| `/a11oy/fabric/roadmap` | EcosystemRoadmap.tsx | P1 |
| `/a11oy/verticals` | Verticals.tsx | P1 |
| `/a11oy/outcomes` | Outcomes.tsx | P1 |
| `/a11oy/memory` | Memory.tsx | P1 |
| `/a11oy/tools` | Tools.tsx | P1 |
| `/a11oy/pce` | Pce.tsx | P1 |
| `/a11oy/demo` | Demo.tsx | P1 |
| `/a11oy/orchestration` | AgentOrchestration.tsx | P1 |
| `/a11oy/agent-viz` | AgentViz.tsx | P1 |
| `/a11oy/sdk` | DevPlatform.tsx | P1 |
| `/a11oy/a11oy-code` | A11oyCode.tsx | P1 |
| `/a11oy/agent-mesh` | AgentMesh.tsx | P1 |
| `/a11oy/plugins` | PluginHub.tsx | P1 |
| `/a11oy/deep-research` | DeepResearch.tsx | P1 |
| `/a11oy/action` | CiAction.tsx | P1 |
| `/a11oy/convergence` | AgiConvergence.tsx | P1 |
| `/a11oy/solutions` | Solutions.tsx | P1 |
| `/a11oy/about` | About.tsx | P1 |
| `/a11oy/omnia-adoption` | OmniaAdoption.tsx | P2 |
| `/a11oy/applications` | ApplicationsCatalog.tsx | P2 |
| `/a11oy/constellation` | ConstellationGraph.tsx | P2 |
| `/a11oy/architecture` | ArchitectureOverview.tsx | P2 |
| `/a11oy/resources` | ResourcesHub.tsx | P2 |
| `/a11oy/control-tower` | ControlTower.tsx | P2 |
| `/a11oy/pipeline` | PipelineCanvas.tsx | P2 |
| `/a11oy/intent-router` | IntentRouter.tsx | P2 |
| `/a11oy/planner` | PlannerCanvas.tsx | P2 |
| `/a11oy/ontology` | OntologyGraph.tsx | P2 |
| `/a11oy/learning` | LearningLoop.tsx | P2 |
| `/a11oy/counterfactuals` | Counterfactuals.tsx | P2 |
| `/a11oy/adversarial` | AdversarialResilience.tsx | P2 |
| `/a11oy/frontier` | FrontierIntelligence.tsx | P2 |
| `/a11oy/approval-queue` | ApprovalQueue.tsx | P2 |
| `/a11oy/verifier` | VerifierAgent.tsx | P2 |
| `/a11oy/doctrine` | DoctrineOverview.tsx | P2 |
| `/a11oy/risk-reports` | RiskReports.tsx | P2 |
| `/a11oy/behavioral-audit` | BehavioralAudit.tsx | P2 |
| `/a11oy/covenant-lift` | CovenantLift.tsx | P2 |
| `/a11oy/code-behaviors` | CodeBehaviors.tsx | P2 |
| `/a11oy/reward-hacking` | RewardHacking.tsx | P2 |
| `/a11oy/alignment-review` | AlignmentReview.tsx | P2 |
| `/a11oy/snapshot-provenance` | SnapshotProvenance.tsx | P2 |
| `/a11oy/ai-user-turn` | AIUserTurn.tsx | P2 |
| `/a11oy/welfare` | AgentWelfare.tsx | P2 |
| `/a11oy/red-team` | RedTeam.tsx | P2 |
| `/a11oy/glasswing` | Glasswing.tsx | P2 |
| `/a11oy/argo` | ArgoForge.tsx | P2 |
| `/a11oy/hatun-layer` | HatunLayer.tsx | P2 |
| `/a11oy/hatun-spec` | HatunSpec.tsx | P2 |
| `/a11oy/aerial-twin` | AerialTwin.tsx | P2 |
| `/a11oy/aerial-twin/:milestone` | AerialTwinMilestone.tsx | P2 |
| `/a11oy/system-card/:id` | SystemCard.tsx | P2 |
| `/a11oy/capability-trajectory` | CapabilityTrajectory.tsx | P2 |
| `/a11oy/resilience` | DarpaResilienceHub.tsx | P2 |
| `/a11oy/gard-robustness` | GardRobustness.tsx | P2 |
| `/a11oy/formal-verification` | FormalVerification.tsx | P2 |
| `/a11oy/supply-chain` | SupplyChainAttestation.tsx | P2 |
| `/a11oy/explainability` | ExplainabilityEngine.tsx | P2 |
| `/a11oy/compartments` | CapabilityCompartments.tsx | P2 |
| `/a11oy/cyber-resilience` | CyberResilience.tsx | P2 |
| `/a11oy/sim-governance` | SimGovernance.tsx | P2 |
| `/a11oy/glasswing-partners` | GlasswingPartners.tsx | P2 |
| `/a11oy/cavd` | CAVD.tsx | P2 |
| `/a11oy/transparency-report` | TransparencyReport.tsx | P2 |
| `/a11oy/trust-portal` | PublicTrustPortal.tsx | P2 |
| `/a11oy/robustness-wall` | RobustnessWall.tsx | P2 |
| `/a11oy/constitution-dsl` | ConstitutionDSL.tsx | P2 |
| `/a11oy/welfare-playbooks` | WelfarePlaybooks.tsx | P2 |
| `/a11oy/defender-credits` | DefenderCredits.tsx | P2 |
| `/a11oy/compass` | Compass.tsx | P2 |
| `/a11oy/agent-bom` | AgentBom.tsx | P2 |
| `/a11oy/delegation-chain` | DelegationChain.tsx | P2 |
| `/a11oy/trust-exchange` | TrustExchange.tsx | P2 |
| `/a11oy/care` | CareEngine.tsx | P2 |
| `/a11oy/precision-ai` | PrecisionAI.tsx | P2 |
| `/a11oy/observability-as-code` | ObservabilityAsCode.tsx | P2 |
| `/a11oy/weaponized-intel` | WeaponizedIntel.tsx | P2 |
| `/a11oy/agent-zero-trust` | AgentZeroTrust.tsx | P2 |
| `/a11oy/atlas-shield` | AtlasShield.tsx | P2 |
| `/a11oy/swarm-orchestrator` | SwarmOrchestrator.tsx | P2 |
| `/a11oy/playbook-engine` | PlaybookEngine.tsx | P2 |
| `/a11oy/a2a-interop` | A2AInterop.tsx | P2 |
| `/a11oy/agent-identity` | AgentIdentityRegistry.tsx | P2 |
| `/a11oy/self-optimization` | SelfOptimization.tsx | P2 |
| `/a11oy/security-agents` | GovernedSecurityAgents.tsx | P2 |
| `/a11oy/karpathy-evolution` | KarpathyEvolution.tsx | P2 |
| `/a11oy/substrate-compute` | SubstrateCompute.tsx | P2 |
| `/a11oy/toto-forecaster` | TotoForecaster.tsx | P2 |
| `/a11oy/causal-rca` | CausalRCA.tsx | P2 |
| `/a11oy/synthetic-metrics` | SyntheticMetrics.tsx | P2 |
| `/a11oy/self-healing` | SelfHealingEngine.tsx | P2 |
| `/a11oy/alert-triage` | AlertTriage.tsx | P2 |
| `/a11oy/cost-monitoring` | CostAwareMonitoring.tsx | P2 |
| `/a11oy/atlas` | AtlasSection.tsx | P2 |
| `/a11oy/tokens` | TokensSection.tsx | P2 |
| `/a11oy/voice` | VoiceSection.tsx | P2 |
| `/a11oy/library` | LibrarySection.tsx | P2 |
| `/a11oy/releases` | ReleasesSection.tsx | P2 |
| `/a11oy/audit` | AuditSection.tsx | P2 |
| `/a11oy/account/billing` | billing-account.tsx | P3 |
| `/a11oy/recommendations` | Recommendations.tsx | P2 |
| `/a11oy/brief` | ExecutiveBrief.tsx | P2 |

**Root cause:** `@szl-holdings/anatomy-contracts` + `@szl-holdings/shared-ui/sentient-layer` not in HF Space Dockerfile COPY scope. Fix: update Dockerfile to include `packages/anatomy-contracts`, `packages/codex-kernel`, and all `lib/` sub-path exports added by Cursor PRs #263/#266.

---

## SZLHOLDINGS/a11oy-platform — Landing Page Discrepancy

The live HF landing (`_live_a11oy-platform/index.html`, hash `74b40f69`) says **"44 Gates"** in its nav and body copy. The Replit `a11oy/index.html` (hash `515e6efe`) is a different variant (older, Space Grotesk font). These are two distinct landing versions — the live one is the correct/newer one per HF snapshot.

**MISSING from live HF:** The post-cron `_post_cron/a11oy/index.html` may differ from deployed — needs sync check.

---

## SZLHOLDINGS/amaru — Missing: conduit-landing.tsx not deployed as SPA

The live amaru HF Space (`SZLHOLDINGS__amaru/web/`) has full React source (src/App.tsx, src/pages, etc.) running. However, the **mined conduit-landing.tsx** (hash `dfde8dc4`, 26927 bytes) — the full marketing landing component — is a Replit-sourced TSX that references `@szl-holdings/shared-ui/contact-modal`. Status: the amaru SPA is deployed; whether this specific landing component is bundled in requires verification.

**MISSING / unverified:** `amaru/mined/conduit-landing.tsx` → `SZLHOLDINGS/amaru` landing route

---

## SZLHOLDINGS/vessels-platform — Missing: vessels-landing.tsx

The `vessels/mined/vessels-landing.tsx` (hash `c0d1f225`, 29606 bytes) is the full Replit source for the vessels marketing landing. The live HF (`SZLHOLDINGS__vessels-app/web/index.html`, 88 lines) is a basic HTML shell, not the TSX-sourced marketing page.

**MISSING:** `vessels/mined/vessels-landing.tsx` content → should build to `SZLHOLDINGS/vessels-app` or `SZLHOLDINGS/vessels-platform`

---

## SZLHOLDINGS/rosie-platform — Missing: mined widget demo page

The `rosie/mined/index.html` (hash `e4386fed`, 4314 bytes) is a full HTML demo page for the `<rosie-widget>` Web Component (Apache-2.0 licensed). The live HF rosie space runs Gradio and has a basic landing but not this specific widget demo page.

**MISSING:** `rosie/mined/index.html` → `SZLHOLDINGS/rosie-platform` widget demo endpoint

---

## Internal Only — No HF Target

These Replit files have no live HF deployment target (internal audit/report use only):
- All files in `reports/p1_replit_payload/` (5 files)
- All files in `round2/phd_replit_archaeology/` (5 files)
- All files in `round2/a11oy_replit_verbatim/` (2 files)
- `warhacker/usb/replit-sources/README.md` (diligence bundle)
- `warhacker/usb/replit-sources/replit-sources.tar.gz` (diligence archive — ships on USB)
- All `replit_payload_final/build_*.py` scripts (build tooling)
- All `replit_per_doi/` `.md` MASTER outputs (generated artifacts, not deployed)

---

## Gap Count Summary

| Gap Category | Count |
|-------------|-------|
| a11oy React SPA pages (BUILD_ERROR) | 133 |
| a11oy Fabric sub-pages included in 133 above | 9 |
| amaru conduit-landing.tsx (unverified) | 1 |
| vessels-landing.tsx (not on HF) | 1 |
| rosie widget demo page (not on HF) | 1 |
| **TOTAL MISSING artifacts** | **136** |
