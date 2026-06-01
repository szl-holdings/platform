# 00 — REPLIT REAL INVENTORY
> Audit date: 2026-05-31 (full re-audit run)  
> Founder directive: "If I have it in Replit files it means it's REAL."  
> Total Replit files across all scoped directories: **315**  
> Grouped by destination HF Space  
> Hash = sha256 first 16 chars | Size = bytes

---

## DESTINATION: SZLHOLDINGS/a11oy-platform

### Source: `replit_landings/_live_a11oy-platform/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 4a1da6d1d944d4ec | 5220 | `_live_a11oy-platform/README.md` | Landing README |
| 74b40f690aa14f97 | 18841 | `_live_a11oy-platform/index.html` | a11oy landing page (Cinzel font, "Governed Agentic Execution Fabric", 44-gate count) |
| 4c18007bfc92f145 | 13674 | `_live_a11oy-platform/style.css` | a11oy landing styles |

### Source: `replit_landings/a11oy/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 515e6efed0d6df1b | 3388 | `a11oy/index.html` | a11oy landing v2 (Space Grotesk font, CTA pill variant) |
| 410cae3024b275af | 6394 | `a11oy/style.css` | Shared landing stylesheet |
| 28f749cf9e2b88b3 | 1268449 | `a11oy/assets/hero_a11oy.png` | Hero image asset |
| b462fe9ba8cf4985 | 423106 | `a11oy/preview_a11oy.png` | Preview screenshot |
| 4fcff3d6124e04ec | 104612 | `a11oy/mined/App.tsx` | Full a11oy Replit App.tsx — 130+ lazy route definitions including MythosLayer, MythosSpec, FrontierMythos routes |
| afa551c875be7b07 | 2893 | `a11oy/mined/index.html` | Mined index entrypoint |

### Source: `replit_landings/_post_cron/a11oy/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 515e6efed0d6df1b | 3388 | `_post_cron/a11oy/index.html` | Post-cron deploy version of a11oy landing |
| 410cae3024b275af | 6394 | `_post_cron/a11oy/style.css` | Post-cron stylesheet (identical to shared) |

### Source: `repos/a11oy/web/.replit-artifact/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 80f1a631b2d30aba | 1021 | `.replit-artifact/artifact.toml` | Replit artifact config: paths=["/", "/nexus/", "/command/"], VITE_PORT=4110, title="A11oy — Brand Orchestration Layer" |

### Source: `a11oy_llm_deep_dive/a11oy_live/web/.replit-artifact/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 80f1a631b2d30aba | 1021 | `a11oy_live/.replit-artifact/artifact.toml` | Identical to repos/a11oy — confirmed live snapshot |

### Source: `round2/a11oy_replit_coder/build/` — FULL REACT SPA (194 files)

#### Core
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| f5b2781821b43f02 | 1895 | `build/index.html` | SPA entrypoint |
| e591a79d7cadbf03 | 1749 | `build/package.json` | NPM manifest |
| 25cf5198257c846e | 2951 | `build/vite.config.ts` | Vite build config |
| 29db34fdabe3cc85 | 478 | `build/tsconfig.json` | TypeScript config |
| a1126429c13909fe | 195 | `build/src/vite-env.d.ts` | Vite type defs |
| 69858e810023d8aa | 29369 | `build/src/App.tsx` | Root router — 133 routes |
| a03c86b9a7bc5ca9 | 2132 | `build/src/index.css` | Global styles |
| a6bcda51db54842c | 946 | `build/src/main.tsx` | React entry |

#### Components
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| a79deacde0146a1b | 2952 | `src/components/DefenseDataState.tsx` | Defense data state |
| ebae7b6918d8b7d0 | 14912 | `src/components/layout.tsx` | Layout |
| 9d7d800e71ec585d | 537 | `src/components/shell/AppShell.tsx` | App shell |
| 512766e9ed304b29 | 2314 | `src/components/shell/Sidebar.tsx` | Sidebar nav |
| cb10ca995c819f44 | 4195 | `src/components/shell/TopBar.tsx` | Top bar |
| 0a81d440fa153c74 | 15701 | `src/components/ui.tsx` | UI primitives |
| 755b9f17489c8a96 | 1497 | `src/components/ui/Badge.tsx` | Badge |
| 41347400f4c270bb | 2112 | `src/components/ui/DrawerPanel.tsx` | Drawer panel |

#### Data Layer
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| f5c39b65ed7d9819 | 21457 | `src/data/aerialTwin.ts` | Aerial twin data |
| 3c78984709f72bd2 | 47296 | `src/data/aerialTwinMilestones.ts` | Aerial twin milestones |
| 254338cbb39e13b9 | 23697 | `src/data/agiConvergenceData.ts` | AGI convergence data |
| b4e8cb51de9037fb | 19497 | `src/data/argoForge.ts` | ArgoForge — OpenMythos/HatunWillay data |
| 9b1b16b9a6147ade | 12395 | `src/data/blueprint.ts` | Blueprint data |
| 64b81395c78336f2 | 5132 | `src/data/brands.ts` | Brand registry |
| 6827e98c0c5f827f | 53029 | `src/data/codexData.ts` | Codex data |
| e2e5e1fcb146ff3b | 46754 | `src/data/complianceFabric.ts` | Compliance fabric |
| 38828fa525d3d190 | 4796 | `src/data/components.ts` | Components registry |
| 985e4a9a9069a298 | 142382 | `src/data/cookbookData.ts` | Cookbook data (largest data file) |
| e39cdb9ee9137237 | 29882 | `src/data/darpaResilience.ts` | DARPA resilience data |
| 78f2f7891776dc65 | 5591 | `src/data/fabric/agents.ts` | Fabric agents |
| a3567e35cf608965 | 8399 | `src/data/fabric/domainTwins.ts` | Domain twins |
| 556a46b4bfb9b8a8 | 38401 | `src/data/fabric/generated.ts` | Generated fabric data |
| 4af8a348b10cc3c4 | 3338 | `src/data/fabric/index.ts` | Fabric index |
| 75c6f832c7a64a37 | 3941 | `src/data/fabric/roadmap.ts` | Fabric roadmap |
| 244a4f256e248f63 | 7105 | `src/data/fabric/types.ts` | Fabric types |
| 66db4c45a6e8dcd0 | 15940 | `src/data/fabric/verticals.ts` | Fabric verticals |
| b181f8a9b1149c44 | 3298 | `src/data/findings.ts` | Findings data |
| 5c9d5d436e3df232 | 24600 | `src/data/glasswingDoctrine.ts` | Glasswing doctrine |
| 57bbb26d12fcbf28 | 95342 | `src/data/hatunDoctrine.ts` | Hatun doctrine (contains "Mythos Preview System Card" cite — REAL) |
| 277337d5ddbb3561 | 22100 | `src/data/hatunLayer.ts` | Hatun layer (contains Mythos vulnerability/threat refs — REAL) |
| 76330ea4c43fcff0 | 29497 | `src/data/pluginHubData.ts` | Plugin hub data |
| 1c7af395220c2758 | 2942 | `src/data/releases.ts` | Releases |
| 7ef2f1b05ebe1dec | 32223 | `src/data/solutionsData.ts` | Solutions data |
| 0f6ed03075e96181 | 3577 | `src/data/tokens.ts` | Token registry |
| 1a8062dc3d3391b9 | 2347 | `src/data/voice.ts` | Voice data |

#### GraphQL & Hooks
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 031827afeebd4a85 | 9615 | `src/graphql/hooks.ts` | GraphQL hooks |
| e3d99fc02c832a68 | 101 | `src/graphql/index.ts` | GraphQL index |
| b549f1f5e24cfd29 | 8231 | `src/graphql/operations.ts` | GraphQL operations |
| 35347a8d207452e2 | 1698 | `src/graphql/provider.tsx` | GraphQL provider |
| 52d4b3464e198ba9 | 1877 | `src/hooks/useDefenseData.ts` | useDefenseData hook |
| 1799659215fe2173 | 699 | `src/context/OrgContext.tsx` | Org context |

#### Lib
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| ffc2a4c5e661cbe8 | 3010 | `src/lib/flexcache-runtime.ts` | FlexCache runtime |
| 8ecf7b12cad65cbd | 7471 | `src/lib/glasswing-schemas.ts` | Glasswing schemas |
| c68fcff0dc63bce5 | 49575 | `src/lib/vertical-marketing-pdf.ts` | Vertical marketing PDF generator |

#### Pages (133 routes — all MISSING from live HF due to BUILD_ERROR)
| Hash | Size | File | Route |
|------|------|------|-------|
| ca84083a39615699 | 98854 | `pages/HomePage.tsx` | `/a11oy/` |
| 4798a7b88b4c2b79 | 23896 | `pages/NowBoard.tsx` | `/a11oy/now` |
| 570cbe70b12a3afe | 13612 | `pages/Recommendations.tsx` | `/a11oy/recommendations` |
| 1d477b5925bda429 | 15122 | `pages/ExecutiveBrief.tsx` | `/a11oy/brief` |
| 3ae723f8c6d47e5a | 31098 | `pages/CommandSurface.tsx` | `/a11oy/command` |
| 0f7377681a20df24 | 21952 | `pages/SignalMesh.tsx` | `/a11oy/signals` |
| 5783c84abde14142 | 7943 | `pages/ActionRail.tsx` | `/a11oy/actions` |
| 4c24b64548b6fc89 | 34585 | `pages/ProofLedger.tsx` | `/a11oy/proof` |
| 29aeccf6110c5ee5 | 11746 | `pages/Governance.tsx` | `/a11oy/governance` |
| f760a3c3229b6c40 | 40904 | `pages/Agents.tsx` | `/a11oy/agents` |
| d3fa964d174c5b40 | 13423 | `pages/WorkcellReplayDetail.tsx` | `/a11oy/workcells/:id/replay` |
| 813097d0e7c7b2fa | 28705 | `pages/WorkcellDetail.tsx` | `/a11oy/workcells/:id` |
| f21fedb48260e334 | 7261 | `pages/Workcells.tsx` | `/a11oy/workcells` |
| 5a97024c0cb9a5e3 | 32960 | `pages/MirrorEval.tsx` | `/a11oy/evals` |
| 07d102db3e614efd | 24688 | `pages/ConnectorFirewall.tsx` | `/a11oy/connectors` |
| f0ef8f577fa6d5a7 | 18605 | `pages/TwinFoundry.tsx` | `/a11oy/twins` |
| 79de50cb75e325ee | 33225 | `pages/ModelRouter.tsx` | `/a11oy/model-router` |
| e98a44dd2facd74f | 26038 | `pages/SkillsLibrary.tsx` | `/a11oy/skills` |
| bab25a7ab2fde554 | 25449 | `pages/SovereignReplayDetail.tsx` | `/a11oy/replay/:id` |
| af8c952db93871d9 | 9063 | `pages/WorkcellReplay.tsx` | `/a11oy/replay` |
| 06c9fd7ff0241878 | 22053 | `pages/TrustCenter.tsx` | `/a11oy/trust` |
| dc0e9be1861b40d8 | 16768 | `pages/Constitution.tsx` | `/a11oy/constitution` |
| 047dc8565a276861 | 16440 | `pages/SecurityCompliance.tsx` | `/a11oy/security-compliance` |
| c8f7a45925b0691d | 13727 | `pages/RightToAudit.tsx` | `/a11oy/right-to-audit` |
| d17b878c91578b09 | 12960 | `pages/Sovereign.tsx` | `/a11oy/sovereign` |
| 8f6a19ab6774c87b | 21832 | `pages/BoardroomMode.tsx` | `/a11oy/boardroom` |
| 892a00e1a4636b05 | 19916 | `pages/InvestorDemo.tsx` | `/a11oy/investor-demo` |
| 09164fbcf3b7ff32 | 15610 | `pages/FlexCacheRuntime.tsx` | `/a11oy/flexcache` |
| 9a0525dc5db582eb | 25927 | `pages/Terminal.tsx` | `/a11oy/terminal` |
| a2cf6190bcb5ae5c | 35701 | `pages/Praxis.tsx` | `/a11oy/nexus` |
| 4b8d290b13fc2b7c | 18857 | `pages/McpHub.tsx` | `/a11oy/mcp-hub` |
| fac255a8599bf305 | 19771 | `pages/AgenticRag.tsx` | `/a11oy/agentic-rag` |
| 57dd7144a900d16f | 13273 | `pages/fabric/VerticalsCommand.tsx` | `/a11oy/fabric/verticals` |
| 6dff4b50c1952fae | 12366 | `pages/fabric/DomainTwins.tsx` | `/a11oy/fabric/twins` |
| 926af80bc84d6984 | 13003 | `pages/fabric/SignalMesh.tsx` | `/a11oy/fabric/signals` |
| 4e22e76563595535 | 13346 | `pages/fabric/RiskMatrix.tsx` | `/a11oy/fabric/risks` |
| b124835d98d632a4 | 12885 | `pages/fabric/DecisionQueue.tsx` | `/a11oy/fabric/decisions` |
| 2fe5f4670a95e8f3 | 11985 | `pages/fabric/OutcomeMemory.tsx` | `/a11oy/fabric/outcomes` |
| 3e8f2f3d3073654f | 12064 | `pages/fabric/EvidenceLedger.tsx` | `/a11oy/fabric/evidence` |
| 571512496f5f6cd8 | 8888 | `pages/fabric/EcosystemRoadmap.tsx` | `/a11oy/fabric/roadmap` |
| 96caacf1166f0c30 | 16790 | `pages/fabric/FabricCockpit.tsx` | `/a11oy/fabric` |
| 03513c34a8913bd5 | 9137 | `pages/Verticals.tsx` | `/a11oy/verticals` |
| a1b50e51e64a1587 | 15689 | `pages/Outcomes.tsx` | `/a11oy/outcomes` |
| 7809c8c0189d34a2 | 29382 | `pages/Memory.tsx` | `/a11oy/memory` |
| 7e7976f3e9cf31be | 23911 | `pages/Tools.tsx` | `/a11oy/tools` |
| 58066b78eefc4366 | 12647 | `pages/Pce.tsx` | `/a11oy/pce` |
| 76cad4f878e2522f | 11329 | `pages/Demo.tsx` | `/a11oy/demo` |
| 4028aefd2a06d019 | 20951 | `pages/AgentOrchestration.tsx` | `/a11oy/orchestration` |
| e1f62b033f7c5882 | 17711 | `pages/AgentViz.tsx` | `/a11oy/agent-viz` |
| 36fef886f4b6af48 | 167792 | `pages/DevPlatform.tsx` | `/a11oy/sdk` — LARGEST PAGE |
| 5771d78082e16ce3 | 45987 | `pages/A11oyCode.tsx` | `/a11oy/a11oy-code` |
| bf14d1906b4f2ed0 | 37747 | `pages/AgentMesh.tsx` | `/a11oy/agent-mesh` |
| 9e27c982e2b7bb78 | 12956 | `pages/PluginHub.tsx` | `/a11oy/plugins` |
| ee323d8c60598601 | 29336 | `pages/DeepResearch.tsx` | `/a11oy/deep-research` |
| f1f4bf507984f002 | 31562 | `pages/CiAction.tsx` | `/a11oy/action` |
| 588ec8751b0333ea | 27669 | `pages/AgiConvergence.tsx` | `/a11oy/convergence` |
| abc9f3c72e04949b | 38204 | `pages/Solutions.tsx` | `/a11oy/solutions` |
| 1bfff2dce10d034b | 9048 | `pages/About.tsx` | `/a11oy/about` |
| 8c5a8c3bf346a50a | 14863 | `pages/OmniaAdoption.tsx` | `/a11oy/omnia-adoption` |
| 3704ce96a62f3d49 | 11539 | `pages/ApplicationsCatalog.tsx` | `/a11oy/applications` |
| 7f2727a1734549ca | 11918 | `pages/ConstellationGraph.tsx` | `/a11oy/constellation` |
| c81fda991802cb14 | 10524 | `pages/ArchitectureOverview.tsx` | `/a11oy/architecture` |
| 14b650100efc1108 | 13424 | `pages/ResourcesHub.tsx` | `/a11oy/resources` |
| f46ffbc48090914b | 14145 | `pages/ControlTower.tsx` | `/a11oy/control-tower` |
| a026f3f456ce56ef | 16269 | `pages/PipelineCanvas.tsx` | `/a11oy/pipeline` |
| c368eb1e56e94467 | 14927 | `pages/IntentRouter.tsx` | `/a11oy/intent-router` |
| 77c31e4dfef58505 | 18863 | `pages/PlannerCanvas.tsx` | `/a11oy/planner` |
| c49eb71ae55d49c1 | 17718 | `pages/OntologyGraph.tsx` | `/a11oy/ontology` |
| efeb79f3490b17d0 | 14498 | `pages/LearningLoop.tsx` | `/a11oy/learning` |
| 5e51a55019b11a0c | 19688 | `pages/Counterfactuals.tsx` | `/a11oy/counterfactuals` |
| ecb239672aeb865f | 29883 | `pages/AdversarialResilience.tsx` | `/a11oy/adversarial` |
| d3ff2e3a7d12b986 | 17646 | `pages/FrontierIntelligence.tsx` | `/a11oy/frontier` |
| 4a8f40557a7c5285 | 17475 | `pages/ApprovalQueue.tsx` | `/a11oy/approval-queue` |
| 5236f2b1337c7664 | 16969 | `pages/VerifierAgent.tsx` | `/a11oy/verifier` |
| beda28aefa5609b3 | 9773 | `pages/DoctrineOverview.tsx` | `/a11oy/doctrine` |
| cab3ad13280ccda8 | 4609 | `pages/RiskReports.tsx` | `/a11oy/risk-reports` |
| bc9aefdade2aded2 | 4607 | `pages/BehavioralAudit.tsx` | `/a11oy/behavioral-audit` |
| 823e70fd86fd5387 | 4692 | `pages/CovenantLift.tsx` | `/a11oy/covenant-lift` |
| f33c54d49104c606 | 3696 | `pages/CodeBehaviors.tsx` | `/a11oy/code-behaviors` |
| cd79f1b3bfa0939f | 4291 | `pages/RewardHacking.tsx` | `/a11oy/reward-hacking` |
| bb28ef8dd63bed8a | 5668 | `pages/AlignmentReview.tsx` | `/a11oy/alignment-review` |
| 7195049a43bd5224 | 4687 | `pages/SnapshotProvenance.tsx` | `/a11oy/snapshot-provenance` |
| 27dffdadb3483e44 | 4754 | `pages/AIUserTurn.tsx` | `/a11oy/ai-user-turn` |
| 8741cf93075db272 | 6303 | `pages/AgentWelfare.tsx` | `/a11oy/welfare` |
| c0a26a18a0074f6b | 4391 | `pages/RedTeam.tsx` | `/a11oy/red-team` |
| fb8aaa24bbc6fcd7 | 25237 | `pages/Glasswing.tsx` | `/a11oy/glasswing` |
| 5c2ebda6f55c297b | 18549 | `pages/ArgoForge.tsx` | `/a11oy/argo` |
| c30883bcb0d8f599 | 12336 | `pages/HatunLayer.tsx` | `/a11oy/hatun-layer` |
| ea0ae223699f2851 | 4846 | `pages/HatunSpec.tsx` | `/a11oy/hatun-spec` |
| 91ff6e7ef7c0ef91 | 14039 | `pages/AerialTwin.tsx` | `/a11oy/aerial-twin` |
| 22ba610bc74c9466 | 7575 | `pages/AerialTwinMilestone.tsx` | `/a11oy/aerial-twin/:milestone` |
| 2853e2f6c5dcbc12 | 16232 | `pages/SystemCard.tsx` | `/a11oy/system-card/:id` |
| 4363711994ee8b19 | 4759 | `pages/CapabilityTrajectory.tsx` | `/a11oy/capability-trajectory` |
| 7433bb58190d8d1a | 7919 | `pages/DarpaResilienceHub.tsx` | `/a11oy/resilience` |
| c4474ea265149743 | 8217 | `pages/GardRobustness.tsx` | `/a11oy/gard-robustness` |
| bfadde82412284ed | 6576 | `pages/FormalVerification.tsx` | `/a11oy/formal-verification` |
| 1e47cdf4d33689c3 | 25430 | `pages/SupplyChainAttestation.tsx` | `/a11oy/supply-chain` |
| 04d72b5a2e2b7e18 | 7957 | `pages/ExplainabilityEngine.tsx` | `/a11oy/explainability` |
| 6a3bc6eef463baab | 8060 | `pages/CapabilityCompartments.tsx` | `/a11oy/compartments` |
| 5dbdfb4f61c0af21 | 7352 | `pages/CyberResilience.tsx` | `/a11oy/cyber-resilience` |
| c44920f97971af24 | 7419 | `pages/SimGovernance.tsx` | `/a11oy/sim-governance` |
| a2b432bfefc3c32a | 11482 | `pages/GlasswingPartners.tsx` | `/a11oy/glasswing-partners` |
| 60dfa3123cf5c9b8 | 21861 | `pages/CAVD.tsx` | `/a11oy/cavd` |
| 0e65442cda60fb16 | 9797 | `pages/TransparencyReport.tsx` | `/a11oy/transparency-report` |
| 3bd09588d476532c | 7153 | `pages/PublicTrustPortal.tsx` | `/a11oy/trust-portal` |
| ebd7b0dc64157678 | 5664 | `pages/RobustnessWall.tsx` | `/a11oy/robustness-wall` |
| 85effb1c497b278f | 6869 | `pages/ConstitutionDSL.tsx` | `/a11oy/constitution-dsl` |
| 58b03b42662d0461 | 4345 | `pages/WelfarePlaybooks.tsx` | `/a11oy/welfare-playbooks` |
| 51686a4823550835 | 5037 | `pages/DefenderCredits.tsx` | `/a11oy/defender-credits` |
| 25de9bdaeb7f8085 | 23849 | `pages/Compass.tsx` | `/a11oy/compass` |
| ca6f399bbd93640a | 11801 | `pages/AgentBom.tsx` | `/a11oy/agent-bom` |
| 3c54511a3143124e | 10146 | `pages/DelegationChain.tsx` | `/a11oy/delegation-chain` |
| fe67b1d5c1679b30 | 11198 | `pages/TrustExchange.tsx` | `/a11oy/trust-exchange` |
| 408fbbb3a55f5aa0 | 14171 | `pages/CareEngine.tsx` | `/a11oy/care` |
| a0fbd9439b9696ac | 15265 | `pages/PrecisionAI.tsx` | `/a11oy/precision-ai` |
| e8ac9f58f39b3990 | 11785 | `pages/ObservabilityAsCode.tsx` | `/a11oy/observability-as-code` |
| e8898275e097391b | 14760 | `pages/WeaponizedIntel.tsx` | `/a11oy/weaponized-intel` |
| b0fdf616223d851d | 20070 | `pages/AgentZeroTrust.tsx` | `/a11oy/agent-zero-trust` |
| 2f5bdffbba6f9826 | 15884 | `pages/AtlasShield.tsx` | `/a11oy/atlas-shield` |
| 2a4b666b952406b9 | 21523 | `pages/SwarmOrchestrator.tsx` | `/a11oy/swarm-orchestrator` |
| 2b3f37ad92803067 | 19122 | `pages/PlaybookEngine.tsx` | `/a11oy/playbook-engine` |
| 5d18f13f9eac240f | 24162 | `pages/A2AInterop.tsx` | `/a11oy/a2a-interop` |
| e9c636ce104d2867 | 23441 | `pages/AgentIdentityRegistry.tsx` | `/a11oy/agent-identity` |
| b93a47116006f25a | 14177 | `pages/SelfOptimization.tsx` | `/a11oy/self-optimization` |
| b2e7014977b2e5ed | 14117 | `pages/GovernedSecurityAgents.tsx` | `/a11oy/security-agents` |
| 2500975440f5bace | 15678 | `pages/KarpathyEvolution.tsx` | `/a11oy/karpathy-evolution` |
| 7745a4e54f882e24 | 16942 | `pages/SubstrateCompute.tsx` | `/a11oy/substrate-compute` |
| e0bad48fe5fc20f3 | 13254 | `pages/TotoForecaster.tsx` | `/a11oy/toto-forecaster` |
| dc57965432345b6f | 12353 | `pages/CausalRCA.tsx` | `/a11oy/causal-rca` |
| 2e3670ba5f9b8fa6 | 13881 | `pages/SyntheticMetrics.tsx` | `/a11oy/synthetic-metrics` |
| 0c4ebe84d8f1a603 | 13431 | `pages/SelfHealingEngine.tsx` | `/a11oy/self-healing` |
| 07233048c59277ad | 12570 | `pages/AlertTriage.tsx` | `/a11oy/alert-triage` |
| 1686d8a6ebe50f2d | 12571 | `pages/CostAwareMonitoring.tsx` | `/a11oy/cost-monitoring` |
| da7eb98c95ebf1fc | 11711 | `pages/AtlasSection.tsx` | `/a11oy/atlas` |
| 8a5377e474ae9c6a | 12806 | `pages/TokensSection.tsx` | `/a11oy/tokens` |
| 4d4481e5519638fb | 7969 | `pages/VoiceSection.tsx` | `/a11oy/voice` |
| 2d4407cd18ec9c12 | 13853 | `pages/LibrarySection.tsx` | `/a11oy/library` |
| 91e1440916e5ef26 | 7609 | `pages/ReleasesSection.tsx` | `/a11oy/releases` |
| 6bd20329cd9dc7ca | 10685 | `pages/AuditSection.tsx` | `/a11oy/audit` |
| a1e03b6cc79b9887 | 630 | `pages/billing-account.tsx` | `/a11oy/account/billing` |

### Source: `round2/a11oy_replit_verbatim/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 93d9ef2da57ecebc | 7879 | `01_FILE_TREE_REPLIT_a11oy.txt` | File tree from szl-holdings/platform HEAD |
| 92f6728b92d2be64 | 20438 | `02_PAGE_ROUTE_MAP.csv` | 133-row page→route→description CSV |

---

## DESTINATION: SZLHOLDINGS/amaru (conduit)

### Source: `replit_landings/_live_amaru/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 25c7f45614934877 | 1231 | `_live_amaru/Dockerfile` | Amaru Dockerfile |
| 884cd8fd95a585c4 | 547 | `_live_amaru/README.md` | Amaru README |
| 251cc63dc7013d7a | 1284 | `_live_amaru/serve.py` | Python serve script |

### Source: `replit_landings/amaru/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 16b6a24df664675b | 3212 | `amaru/index.html` | Amaru landing (The Andean Ouroboros) |
| ebe351598b677594 | 9582 | `amaru/index_inline.html` | Self-contained inline version |
| 5be457ad968183a6 | 10214 | `amaru/index_inline_rosie.html` | Rosie widget embedded version |
| 410cae3024b275af | 6394 | `amaru/style.css` | Shared style |
| 5aa6611082b80711 | 1301859 | `amaru/assets/amaru_hero.png` | Hero image |
| 56e275c07da3f9e6 | 389929 | `amaru/preview_amaru.png` | Preview screenshot |
| dfde8dc4034a0ff6 | 26927 | `amaru/mined/conduit-landing.tsx` | Full conduit landing TSX — real React source |

### Source: `replit_landings/_post_cron/amaru/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 16b6a24df664675b | 3212 | `_post_cron/amaru/index.html` | Post-cron deploy version |
| ebe351598b677594 | 9582 | `_post_cron/amaru/index_selfcontained.html` | Self-contained version |
| 410cae3024b275af | 6394 | `_post_cron/amaru/style.css` | Stylesheet |

### Source: `repos/amaru/web/.replit-artifact/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| c267f5dd2ba66be2 | 762 | `.replit-artifact/artifact.toml` | paths=["/conduit/"], VITE_PORT=5300, id=artifacts/conduit |

---

## DESTINATION: SZLHOLDINGS/sentra-platform

### Source: `replit_landings/_live_sentra-platform/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| d1a240691d35da57 | 5155 | `_live_sentra-platform/README.md` | Sentra README |
| 140034052cfdeada | 18001 | `_live_sentra-platform/index.html` | Sentra landing |
| b1d4f8e4659cff96 | 18643 | `_live_sentra-platform/index_current.html` | Sentra current landing variant |
| ad6769180f445371 | 13688 | `_live_sentra-platform/style.css` | Sentra styles |

### Source: `replit_landings/sentra/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 9a3cf2964e978a27 | 3282 | `sentra/index.html` | Sentra landing |
| 45470654bfb1e338 | 3924 | `sentra/index_rosie.html` | Sentra + rosie widget version |
| 410cae3024b275af | 6394 | `sentra/style.css` | Shared style |
| a01b83b85d445240 | 1226996 | `sentra/assets/hero_sentra.png` | Hero image |
| a4b97e2ea54e0528 | 386297 | `sentra/preview_sentra.png` | Preview |
| 99b66d7ce625017f | 72 | `sentra/mined/sentra-landing.tsx` | Mined TSX stub (72 bytes — minimal) |

### Source: `replit_landings/_post_cron/sentra/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 9a3cf2964e978a27 | 3282 | `_post_cron/sentra/index.html` | Post-cron version |
| 410cae3024b275af | 6394 | `_post_cron/sentra/style.css` | Stylesheet |

### Source: `repos/sentra/web/.replit-artifact/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 28816a91217e974d | 789 | `.replit-artifact/artifact.toml` | paths=["/sentra/"], VITE_PORT=4099, title="Sentra — Cyber Resilience Command" |

---

## DESTINATION: SZLHOLDINGS/vessels-app / vessels-platform

### Source: `replit_landings/vessels/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| c0d1f225d5afea53 | 29606 | `vessels/mined/vessels-landing.tsx` | Full vessels landing TSX — maritime intelligence, sanctions, dark-vessel, AIS |

### Source: `repos/vessels/web/.replit-artifact/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| c946c21715a2d5cb | 715 | `.replit-artifact/artifact.toml` | paths=["/vessels/"], VITE_PORT=8099, title="Vessels — Maritime Intelligence" |

---

## DESTINATION: SZLHOLDINGS/rosie-platform

### Source: `replit_landings/rosie/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| e4386fed219c15fb | 4314 | `rosie/mined/index.html` | Rosie widget demo page — real src (Apache-2.0, "rosie-widget" Web Component) |

---

## DESTINATION: Thesis / Zenodo DOI chain

### Source: `replit_per_doi/`
| Hash | Size | File | DOI / Component |
|------|------|------|-----------------|
| ed90b5e6438baeca | 5206 | `MASTER_correlator.md` | Correlator doc |
| 0cd5434321ec1f07 | 1395 | `MASTER_v14.md` | v14 generated output |
| fe75d08992819236 | 1470 | `MASTER_v15.md` | v15 generated output |
| 24686c80a1013856 | 1846 | `MASTER_v16.md` | v16 generated output |
| 570f32aec5881b41 | 3538 | `MASTER_v17.md` | v17 generated output |
| 5bca87fe7eec7402 | 5985 | `README.md` | Per-DOI README |
| 9819d4e3d4bcd506 | 11480 | `RUN_ALL.py` | Unified runner |
| e5fdee09f77880c3 | 1573 | `RUN_ALL_REPORT.md` | Run report |
| 5769b12debd64109 | 14635 | `v14_lutar_calculus.py` | DOI 10.5281/zenodo.20424992 — Λ-gate, HUKLLA, DPI bound |
| ae871f46a3561ab3 | 14639 | `v15_knot_calculus.py` | DOI 10.5281/zenodo.20424995 — Catoni PAC-Bayes, Reidemeister |
| a01af29748346be7 | 13990 | `v16_feynman_gates.py` | DOI 10.5281/zenodo.20424996 — Feynman path integral, Gates Hamming |
| 65c45fbe185e435b | 37538 | `v17_wheeler_shannon_qec.py` | DOI 10.5281/zenodo.20431181 — Wheeler, Shannon, Shor QEC |

---

## DESTINATION: Multi-space / Ouroboros runtime

### Source: `replit_payload_final/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 589b541e34e47b7d | 6726 | `REPLIT_PART_00_MANIFEST.md` | 7-part manifest, 4,814,895 total chars |
| 347242b1577f31c3 | 746092 | `REPLIT_FINAL_PART_1.md` | Ouroboros Part 1 — includes Bekenstein, bekenstein_cascade real code |
| 548fa86528bfe9ba | 716941 | `REPLIT_FINAL_PART_2.md` | Ouroboros Part 2 |
| eb6538dd36201b0c | 949189 | `REPLIT_FINAL_PART_3.md` | Ouroboros Part 3 (largest) |
| 9e9c9c92c910eb04 | 798474 | `REPLIT_FINAL_PART_4.md` | Ouroboros Part 4 |
| 1f8326661edb4418 | 900759 | `REPLIT_FINAL_PART_5.md` | Ouroboros Part 5 |
| 86e306eb7bc1ee6b | 750977 | `REPLIT_FINAL_PART_6.md` | Ouroboros Part 6 |
| 9b266705a647d037 | 2912 | `REPLIT_README.md` | Payload README |
| 2863503c4625bf92 | 3554970 | `REPLIT_SZL_SINGLE.md` | Monolithic single MD dump |
| 6c9c5ac6f2c0f6fb | 3554620 | `REPLIT_SZL_SINGLE.py` | Monolithic single .py version |
| fb26f37e23520d61 | 42478 | `VALIDATION_LOG.txt` | Validation log |
| 2f6b3cdf67d29c19 | 3639 | `REPACK_VALIDATION.txt` | Repack validation (contains Mythos ref — REAL) |
| 18aee3e8dcdaf492 | 6981 | `build_part00.py` | Builder script |
| 5ae672f2db483805 | 7280 | `build_part03.py` | Builder script |
| 325589b03a41b62e | 3646 | `build_part04.py` | Builder script |
| c06d89cbc5e0a3b1 | 4314 | `build_part05_06.py` | Builder script |
| 6d0298ab344e871a | 3390 | `build_part07.py` | Builder script |
| a95539f0bbc10b6a | 5100 | `build_parts.py` | Builder script |
| 1041352947d3078c | 6938 | `build_single.py` | Builder script (contains "Mythos substrate" comment) |

---

## DESTINATION: Internal reports / no HF target

### Source: `reports/p1_replit_payload/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 2388efcc89a7e330 | 3315 | `PR.md` | PR brief |
| 746898fee1749860 | 5080 | `SUMMARY.md` | Payload summary |
| 71b01bb730e456b2 | 4686 | `imports_map.md` | Imports map |
| b752cf38953a3cba | 4883 | `payload_summary.md` | Section-by-section summary |
| b7ae0ca44a5b678a | 5263 | `smoke_test_evidence.md` | Smoke test evidence |

### Source: `round2/phd_replit_archaeology/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| cb41907f54979757 | 7228 | `00_LAST_REPLIT_PUSH.md` | Last push record |
| 3267a6a671a53e14 | 36667 | `01_REPLIT_ARTIFACT_DEEP_INVENTORY.md` | Deep inventory (133-page table) |
| a77f48a7f9c330cb | 15203 | `02_CURSOR_UPGRADE_LAYER.md` | Cursor upgrade analysis |
| 93ef1c98a851dced | 15013 | `03_REPLIT_VS_HF_GAP.md` | Gap analysis |
| 210c14aa24c09eaf | 10730 | `04_RECOMMENDED_SHIP_ORDER.md` | Ship order (17 ship tasks) |

---

## DESTINATION: Diligence bundle (Warhacker USB)

### Source: `warhacker/usb/replit-sources/`
| Hash | Size | File | Component / Type |
|------|------|------|-----------------|
| 0c73377b7dd5753c | 1808 | `README.md` | USB diligence bundle README — confirms a11oy (~196 files), sentra (~182), amaru (~92), vessels (~187) |
| 8d97b39ba67252a0 | 7950133 | `replit-sources.tar.gz` | Full app sources tarball (7.95MB) — a11oy, sentra, amaru, vessels web/ dirs |

---

## Source Key
- `replit_landings/` = cron-deployed static landing pages + mined TSX
- `replit_per_doi/` = executable thesis chain (v14–v17, Zenodo DOIs)
- `replit_payload_final/` = Ouroboros multi-part runtime payload
- `repos/*/web/.replit-artifact/` = Replit artifact.toml configs (ground truth for routing)
- `round2/a11oy_replit_coder/` = Full React SPA source (133 pages, verbatim from Replit)
- `round2/a11oy_replit_verbatim/` = File tree + route map from platform HEAD
- `round2/phd_replit_archaeology/` = Prior audit findings
- `warhacker/usb/replit-sources/` = Diligence tarball
