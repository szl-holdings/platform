import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Route, Switch } from 'wouter';
import { AppShell } from './components/shell/AppShell';
import { DemoModeProvider } from './lib/operations/demo-mode';
import { FabricShellProvider } from './lib/fabric-shell-context';

function stripTrailingSlash(path: string) {
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

const base = stripTrailingSlash((import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '') || '/a11oy');

function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(255,255,255,0.08)', borderTopColor: '#c9b787' }}
      />
    </div>
  );
}

function WithShell({ children }: { children: ReactNode }) {
  return (
    <FabricShellProvider>
      <DemoModeProvider>
        <AppShell>{children}</AppShell>
      </DemoModeProvider>
    </FabricShellProvider>
  );
}

const AlloyHubLanding = lazy(() => import('./pages/AlloyHubLanding').then(m => ({ default: m.AlloyHubLanding })));
const AlloyFleet = lazy(() => import('./pages/AlloyFleet').then(m => ({ default: m.AlloyFleet })));
const AlloyFoundry = lazy(() => import('./pages/AlloyFoundry').then(m => ({ default: m.AlloyFoundry })));
const AlloyGovernance = lazy(() => import('./pages/AlloyGovernance').then(m => ({ default: m.AlloyGovernance })));
const AlloyPricing = lazy(() => import('./pages/AlloyPricing').then(m => ({ default: m.AlloyPricing })));
const LoopReasoner = lazy(() => import('./pages/LoopReasoner').then(m => ({ default: m.LoopReasoner })));
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const NowBoard = lazy(() => import('./pages/NowBoard').then(m => ({ default: m.NowBoard })));
const CommandSurface = lazy(() => import('./pages/CommandSurface').then(m => ({ default: m.CommandSurface })));
const SignalMesh = lazy(() => import('./pages/SignalMesh').then(m => ({ default: m.SignalMesh })));
const ActionRail = lazy(() => import('./pages/ActionRail').then(m => ({ default: m.ActionRail })));
const ProofLedger = lazy(() => import('./pages/ProofLedger').then(m => ({ default: m.ProofLedger })));
const CodexReceipts = lazy(() => import('./pages/CodexReceipts').then(m => ({ default: m.CodexReceipts })));
const PortfolioArchive = lazy(() => import('./pages/PortfolioArchive').then(m => ({ default: m.PortfolioArchive })));
const Governance = lazy(() => import('./pages/Governance').then(m => ({ default: m.Governance })));
const Agents = lazy(() => import('./pages/Agents').then(m => ({ default: m.Agents })));
const Workcells = lazy(() => import('./pages/Workcells').then(m => ({ default: m.Workcells })));
const WorkcellDetail = lazy(() => import('./pages/WorkcellDetail').then(m => ({ default: m.WorkcellDetail })));
const WorkcellReplayDetail = lazy(() => import('./pages/WorkcellReplayDetail').then(m => ({ default: m.WorkcellReplayDetail })));
const MirrorEval = lazy(() => import('./pages/MirrorEval').then(m => ({ default: m.MirrorEval })));
const ConnectorFirewall = lazy(() => import('./pages/ConnectorFirewall').then(m => ({ default: m.ConnectorFirewall })));
const TwinFoundry = lazy(() => import('./pages/TwinFoundry').then(m => ({ default: m.TwinFoundry })));
const TrustCenter = lazy(() => import('./pages/TrustCenter').then(m => ({ default: m.TrustCenter })));
const Constitution = lazy(() => import('./pages/Constitution').then(m => ({ default: m.Constitution })));
const SecurityCompliance = lazy(() => import('./pages/SecurityCompliance').then(m => ({ default: m.SecurityCompliance })));
const RightToAudit = lazy(() => import('./pages/RightToAudit').then(m => ({ default: m.RightToAudit })));
const ModelRouter = lazy(() => import('./pages/ModelRouter').then(m => ({ default: m.ModelRouter })));
const IntelligenceCommand = lazy(() => import('./pages/intelligence/IntelligenceCommand').then(m => ({ default: m.IntelligenceCommand })));
const SigilPage = lazy(() => import('./pages/Sigil').then(m => ({ default: m.Sigil })));
const IntelligenceDeepDive = lazy(() => import('./pages/intelligence/IntelligenceDeepDive').then(m => ({ default: m.IntelligenceDeepDive })));
const IntelligenceRoiLens = lazy(() => import('./pages/intelligence/IntelligenceRoiLens').then(m => ({ default: m.IntelligenceRoiLens })));
const Lab = lazy(() => import('./pages/lab/Lab').then(m => ({ default: m.Lab })));
const PatternAtlasNative = lazy(() => import('./pages/lab/PatternAtlasNative').then(m => ({ default: m.PatternAtlasNative })));
const PromptRegistryNative = lazy(() => import('./pages/lab/PromptRegistryNative').then(m => ({ default: m.PromptRegistryNative })));
const EvalConsoleNative = lazy(() => import('./pages/lab/EvalConsoleNative').then(m => ({ default: m.EvalConsoleNative })));
const AiGateway = lazy(() => import('./pages/AiGateway').then(m => ({ default: m.AiGateway })));
const SkillsLibrary = lazy(() => import('./pages/SkillsLibrary').then(m => ({ default: m.SkillsLibrary })));
const WorkcellReplay = lazy(() => import('./pages/WorkcellReplay').then(m => ({ default: m.WorkcellReplay })));
const SovereignReplayDetail = lazy(() => import('./pages/SovereignReplayDetail').then(m => ({ default: m.SovereignReplayDetail })));
const Sovereign = lazy(() => import('./pages/Sovereign').then(m => ({ default: m.Sovereign })));
const BoardroomMode = lazy(() => import('./pages/BoardroomMode').then(m => ({ default: m.BoardroomMode })));
const InvestorDemo = lazy(() => import('./pages/InvestorDemo').then(m => ({ default: m.InvestorDemo })));
const FlexCacheRuntime = lazy(() => import('./pages/FlexCacheRuntime').then(m => ({ default: m.FlexCacheRuntime })));
const Terminal = lazy(() => import('./pages/Terminal').then(m => ({ default: m.Terminal })));
const Fabric = lazy(() => import('./pages/Fabric').then(m => ({ default: m.Fabric })));
const FabricCockpit = lazy(() => import('./pages/fabric/FabricCockpit').then(m => ({ default: m.FabricCockpit })));
const FabricVerticalsCommand = lazy(() => import('./pages/fabric/VerticalsCommand').then(m => ({ default: m.VerticalsCommand })));
const FabricDomainTwins = lazy(() => import('./pages/fabric/DomainTwins').then(m => ({ default: m.DomainTwins })));
const FabricSignalMeshPage = lazy(() => import('./pages/fabric/SignalMesh').then(m => ({ default: m.FabricSignalMesh })));
const FabricRiskMatrix = lazy(() => import('./pages/fabric/RiskMatrix').then(m => ({ default: m.RiskMatrix })));
const FabricDecisionQueue = lazy(() => import('./pages/fabric/DecisionQueue').then(m => ({ default: m.DecisionQueue })));
const FabricOutcomeMemory = lazy(() => import('./pages/fabric/OutcomeMemory').then(m => ({ default: m.OutcomeMemory })));
const FabricEvidenceLedger = lazy(() => import('./pages/fabric/EvidenceLedger').then(m => ({ default: m.EvidenceLedger })));
const FabricEcosystemRoadmap = lazy(() => import('./pages/fabric/EcosystemRoadmap').then(m => ({ default: m.EcosystemRoadmap })));
const Verticals = lazy(() => import('./pages/Verticals').then(m => ({ default: m.Verticals })));
const Outcomes = lazy(() => import('./pages/Outcomes').then(m => ({ default: m.Outcomes })));
const Memory = lazy(() => import('./pages/Memory').then(m => ({ default: m.Memory })));
const Tools = lazy(() => import('./pages/Tools').then(m => ({ default: m.Tools })));
const Pce = lazy(() => import('./pages/Pce').then(m => ({ default: m.Pce })));
const Demo = lazy(() => import('./pages/Demo').then(m => ({ default: m.Demo })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Recommendations = lazy(() => import('./pages/Recommendations').then(m => ({ default: m.Recommendations })));
const ExecutiveBrief = lazy(() => import('./pages/ExecutiveBrief').then(m => ({ default: m.ExecutiveBrief })));
const AgentOrchestration = lazy(() => import('./pages/AgentOrchestration').then(m => ({ default: m.AgentOrchestration })));
const AgentViz = lazy(() => import('./pages/AgentViz').then(m => ({ default: m.AgentViz })));
const DevPlatform = lazy(() => import('./pages/DevPlatform').then(m => ({ default: m.DevPlatform })));
const A11oyCode = lazy(() => import('./pages/A11oyCode').then(m => ({ default: m.A11oyCode })));
const A11oyChat = lazy(() => import('./pages/A11oyChat').then(m => ({ default: m.A11oyChat })));
const AgentMesh = lazy(() => import('./pages/AgentMesh').then(m => ({ default: m.AgentMesh })));
const PluginHub = lazy(() => import('./pages/PluginHub').then(m => ({ default: m.PluginHub })));
const DeepResearch = lazy(() => import('./pages/DeepResearch').then(m => ({ default: m.DeepResearch })));
const CiAction = lazy(() => import('./pages/CiAction').then(m => ({ default: m.CiAction })));
const AgiConvergence = lazy(() => import('./pages/AgiConvergence').then(m => ({ default: m.AgiConvergence })));
const OmniaAdoptionPage = lazy(() => import('./pages/OmniaAdoption').then(m => ({ default: m.OmniaAdoption })));
const Solutions = lazy(() => import('./pages/Solutions').then(m => ({ default: m.Solutions })));
const ApplicationsCatalog = lazy(() => import('./pages/ApplicationsCatalog').then(m => ({ default: m.ApplicationsCatalog })));
const ConstellationGraph = lazy(() => import('./pages/ConstellationGraph').then(m => ({ default: m.ConstellationGraph })));
const ArchitectureOverview = lazy(() => import('./pages/ArchitectureOverview').then(m => ({ default: m.ArchitectureOverview })));
const ResourcesHub = lazy(() => import('./pages/ResourcesHub').then(m => ({ default: m.ResourcesHub })));
const ControlTower = lazy(() => import('./pages/ControlTower').then(m => ({ default: m.ControlTower })));
const PipelineCanvas = lazy(() => import('./pages/PipelineCanvas').then(m => ({ default: m.PipelineCanvas })));
const IntentRouter = lazy(() => import('./pages/IntentRouter').then(m => ({ default: m.IntentRouter })));
const PlannerCanvas = lazy(() => import('./pages/PlannerCanvas').then(m => ({ default: m.PlannerCanvas })));
const OntologyGraph = lazy(() => import('./pages/OntologyGraph').then(m => ({ default: m.OntologyGraph })));
const LearningLoop = lazy(() => import('./pages/LearningLoop').then(m => ({ default: m.LearningLoop })));
const Counterfactuals = lazy(() => import('./pages/Counterfactuals').then(m => ({ default: m.Counterfactuals })));
const AdversarialResilience = lazy(() => import('./pages/AdversarialResilience').then(m => ({ default: m.AdversarialResilience })));
const FrontierIntelligence = lazy(() => import('./pages/FrontierIntelligence').then(m => ({ default: m.FrontierIntelligence })));
const QuantumIntelligence = lazy(() => import('./pages/QuantumIntelligence').then(m => ({ default: m.QuantumIntelligence })));
const DarpaResilienceHub = lazy(() => import('./pages/DarpaResilienceHub').then(m => ({ default: m.DarpaResilienceHub })));
const GardRobustness = lazy(() => import('./pages/GardRobustness').then(m => ({ default: m.GardRobustness })));
const FormalVerification = lazy(() => import('./pages/FormalVerification').then(m => ({ default: m.FormalVerification })));
const SupplyChainAttestation = lazy(() => import('./pages/SupplyChainAttestation').then(m => ({ default: m.SupplyChainAttestation })));
const ExplainabilityEngine = lazy(() => import('./pages/ExplainabilityEngine').then(m => ({ default: m.ExplainabilityEngine })));
const CapabilityCompartments = lazy(() => import('./pages/CapabilityCompartments').then(m => ({ default: m.CapabilityCompartments })));
const CyberResilience = lazy(() => import('./pages/CyberResilience').then(m => ({ default: m.CyberResilience })));
const SimGovernance = lazy(() => import('./pages/SimGovernance').then(m => ({ default: m.SimGovernance })));
const ApprovalQueue = lazy(() => import('./pages/ApprovalQueue').then(m => ({ default: m.ApprovalQueue })));
const CognitiveReflexivity = lazy(() => import('./pages/CognitiveReflexivity'));
const Ouroboros = lazy(() => import('./pages/Ouroboros'));
const VerifierAgent = lazy(() => import('./pages/VerifierAgent').then(m => ({ default: m.VerifierAgent })));
const AtlasSection = lazy(() => import('./pages/AtlasSection').then(m => ({ default: m.AtlasSection })));
const TokensSection = lazy(() => import('./pages/TokensSection').then(m => ({ default: m.TokensSection })));
const VoiceSection = lazy(() => import('./pages/VoiceSection').then(m => ({ default: m.VoiceSection })));
const LibrarySection = lazy(() => import('./pages/LibrarySection').then(m => ({ default: m.LibrarySection })));
const ReleasesSection = lazy(() => import('./pages/ReleasesSection').then(m => ({ default: m.ReleasesSection })));
const AuditSection = lazy(() => import('./pages/AuditSection').then(m => ({ default: m.AuditSection })));
const DoctrineOverview = lazy(() => import('./pages/DoctrineOverview').then(m => ({ default: m.DoctrineOverview })));
const RiskReports = lazy(() => import('./pages/RiskReports').then(m => ({ default: m.RiskReports })));
const BehavioralAudit = lazy(() => import('./pages/BehavioralAudit').then(m => ({ default: m.BehavioralAudit })));
const CovenantLift = lazy(() => import('./pages/CovenantLift').then(m => ({ default: m.CovenantLift })));
const CodeBehaviors = lazy(() => import('./pages/CodeBehaviors').then(m => ({ default: m.CodeBehaviors })));
const RewardHacking = lazy(() => import('./pages/RewardHacking').then(m => ({ default: m.RewardHacking })));
const AlignmentReview = lazy(() => import('./pages/AlignmentReview').then(m => ({ default: m.AlignmentReview })));
const SnapshotProvenance = lazy(() => import('./pages/SnapshotProvenance').then(m => ({ default: m.SnapshotProvenance })));
const AIUserTurn = lazy(() => import('./pages/AIUserTurn').then(m => ({ default: m.AIUserTurn })));
const AgentWelfare = lazy(() => import('./pages/AgentWelfare').then(m => ({ default: m.AgentWelfare })));
const RedTeam = lazy(() => import('./pages/RedTeam').then(m => ({ default: m.RedTeam })));
const GlasswingPage = lazy(() => import('./pages/Glasswing').then(m => ({ default: m.Glasswing })));
const ArgoForgePage = lazy(() => import('./pages/ArgoForge').then(m => ({ default: m.ArgoForge })));
const MythosLayerPage = lazy(() => import('./pages/MythosLayer').then(m => ({ default: m.MythosLayer })));
const AerialTwinPage = lazy(() => import('./pages/AerialTwin').then(m => ({ default: m.AerialTwin })));
const AerialTwinMilestonePage = lazy(() => import('./pages/AerialTwinMilestone').then(m => ({ default: m.AerialTwinMilestone })));
const SystemCard = lazy(() => import('./pages/SystemCard').then(m => ({ default: m.SystemCard })));
const CapabilityTrajectory = lazy(() => import('./pages/CapabilityTrajectory').then(m => ({ default: m.CapabilityTrajectory })));
const MythosSpec = lazy(() => import('./pages/MythosSpec').then(m => ({ default: m.MythosSpec })));
const GlasswingPartners = lazy(() => import('./pages/GlasswingPartners').then(m => ({ default: m.GlasswingPartners })));
const CAVDPage = lazy(() => import('./pages/CAVD').then(m => ({ default: m.CAVD })));
const TransparencyReport = lazy(() => import('./pages/TransparencyReport').then(m => ({ default: m.TransparencyReport })));
const PublicTrustPortal = lazy(() => import('./pages/PublicTrustPortal').then(m => ({ default: m.PublicTrustPortal })));
const RobustnessWall = lazy(() => import('./pages/RobustnessWall').then(m => ({ default: m.RobustnessWall })));
const ConstitutionDSL = lazy(() => import('./pages/ConstitutionDSL').then(m => ({ default: m.ConstitutionDSL })));
const WelfarePlaybooks = lazy(() => import('./pages/WelfarePlaybooks').then(m => ({ default: m.WelfarePlaybooks })));
const DefenderCredits = lazy(() => import('./pages/DefenderCredits').then(m => ({ default: m.DefenderCredits })));
const Compass = lazy(() => import('./pages/Compass').then(m => ({ default: m.Compass })));
const AgentBom = lazy(() => import('./pages/AgentBom').then(m => ({ default: m.AgentBom })));
const DelegationChainPage = lazy(() => import('./pages/DelegationChain').then(m => ({ default: m.DelegationChain })));
const TrustExchange = lazy(() => import('./pages/TrustExchange').then(m => ({ default: m.TrustExchange })));
const CareEngine = lazy(() => import('./pages/CareEngine').then(m => ({ default: m.CareEngine })));
const PrecisionAI = lazy(() => import('./pages/PrecisionAI').then(m => ({ default: m.PrecisionAI })));
const WeaponizedIntel = lazy(() => import('./pages/WeaponizedIntel').then(m => ({ default: m.WeaponizedIntel })));
const AgentZeroTrust = lazy(() => import('./pages/AgentZeroTrust').then(m => ({ default: m.AgentZeroTrust })));
const AtlasShield = lazy(() => import('./pages/AtlasShield').then(m => ({ default: m.AtlasShield })));
const SwarmOrchestrator = lazy(() => import('./pages/SwarmOrchestrator').then(m => ({ default: m.SwarmOrchestrator })));
const PlaybookEngine = lazy(() => import('./pages/PlaybookEngine').then(m => ({ default: m.PlaybookEngine })));
const A2AInterop = lazy(() => import('./pages/A2AInterop').then(m => ({ default: m.A2AInterop })));
const AgentIdentityRegistry = lazy(() => import('./pages/AgentIdentityRegistry').then(m => ({ default: m.AgentIdentityRegistry })));
const SelfOptimization = lazy(() => import('./pages/SelfOptimization').then(m => ({ default: m.SelfOptimization })));
const GovernedSecurityAgents = lazy(() => import('./pages/GovernedSecurityAgents').then(m => ({ default: m.GovernedSecurityAgents })));
const A11oyBillingPage = lazy(() => import('./pages/billing-account'));
const KarpathyEvolution = lazy(() => import('./pages/KarpathyEvolution').then(m => ({ default: m.KarpathyEvolution })));
const Praxis = lazy(() => import('./pages/Praxis').then(m => ({ default: m.Praxis })));
const AtelierHub = lazy(() => import('./pages/atelier/AtelierHub').then(m => ({ default: m.AtelierHub })));
const AtelierDetail = lazy(() => import('./pages/atelier/AtelierDetail').then(m => ({ default: m.AtelierDetail })));
const AtelierNew = lazy(() => import('./pages/atelier/AtelierNew').then(m => ({ default: m.AtelierNew })));
const AtelierLeaderboards = lazy(() => import('./pages/atelier/AtelierLeaderboards').then(m => ({ default: m.AtelierLeaderboards })));
const AtelierManifesto = lazy(() => import('./pages/atelier/AtelierManifesto').then(m => ({ default: m.AtelierManifesto })));
const AtelierMySpaces = lazy(() => import('./pages/atelier/AtelierMySpaces').then(m => ({ default: m.AtelierMySpaces })));
const AtelierEmbedHost = lazy(() => import('./pages/atelier/AtelierEmbedHost').then(m => ({ default: m.AtelierEmbedHost })));
const McpHub = lazy(() => import('./pages/McpHub').then(m => ({ default: m.McpHub })));
const AgenticRag = lazy(() => import('./pages/AgenticRag').then(m => ({ default: m.AgenticRag })));
const SubstrateCompute = lazy(() => import('./pages/SubstrateCompute').then(m => ({ default: m.SubstrateCompute })));
const HfJobs = lazy(() => import('./pages/HfJobs'));
const HubOperations = lazy(() => import('./pages/HubOperations').then(m => ({ default: m.HubOperations })));
const TotoForecaster = lazy(() => import('./pages/TotoForecaster').then(m => ({ default: m.TotoForecaster })));
const CausalRCA = lazy(() => import('./pages/CausalRCA').then(m => ({ default: m.CausalRCA })));
const SyntheticMetrics = lazy(() => import('./pages/SyntheticMetrics').then(m => ({ default: m.SyntheticMetrics })));
const SelfHealingEngine = lazy(() => import('./pages/SelfHealingEngine').then(m => ({ default: m.SelfHealingEngine })));
const ObservabilityAsCode = lazy(() => import('./pages/ObservabilityAsCode').then(m => ({ default: m.ObservabilityAsCode })));
const AlertTriage = lazy(() => import('./pages/AlertTriage').then(m => ({ default: m.AlertTriage })));
const CostAwareMonitoring = lazy(() => import('./pages/CostAwareMonitoring').then(m => ({ default: m.CostAwareMonitoring })));
const AndeanOrchestration = lazy(() => import('./pages/AndeanOrchestration').then(m => ({ default: m.AndeanOrchestration })));
const RuntimeCommandCenter = lazy(() => import('./pages/RuntimeCommandCenter').then(m => ({ default: m.RuntimeCommandCenter })));
const VaultBrowser = lazy(() => import('./pages/reliquary/VaultBrowser').then(m => ({ default: m.VaultBrowser })));
const LineageGraph = lazy(() => import('./pages/reliquary/LineageGraph').then(m => ({ default: m.LineageGraph })));
const SnapshotReplay = lazy(() => import('./pages/reliquary/SnapshotReplay').then(m => ({ default: m.SnapshotReplay })));
const SovereignMode = lazy(() => import('./pages/reliquary/SovereignMode').then(m => ({ default: m.SovereignMode })));
const ReliquaryDoctrine = lazy(() => import('./pages/reliquary/ReliquaryDoctrine').then(m => ({ default: m.ReliquaryDoctrine })));
const ModelProvenance = lazy(() => import('./pages/ModelProvenance').then(m => ({ default: m.ModelProvenance })));

const StrategyDashboard = lazy(() => import('./pages/strategy/dashboard'));
const AtlasRuntime = lazy(() => import('./pages/strategy/atlas-runtime'));
const CorrelationMap = lazy(() => import('./pages/strategy/correlation-map').then(m => ({ default: m.CorrelationMapPage })));
const SignalChains = lazy(() => import('./pages/strategy/signal-chains').then(m => ({ default: m.SignalChainsPage })));
const EnterpriseState = lazy(() => import('./pages/strategy/enterprise-state'));
const WorldlineRegistry = lazy(() => import('./pages/strategy/worldline-registry'));
const Simulation = lazy(() => import('./pages/strategy/simulation'));
const StressDrill = lazy(() => import('./pages/strategy/stress-drill'));
const GameDay = lazy(() => import('./pages/strategy/game-day'));
const CompetitiveAtlas = lazy(() => import('./pages/strategy/competitive-atlas').then(m => ({ default: m.CompetitiveAtlasPage })));
const StrategyExecutiveBriefing = lazy(() => import('./pages/strategy/executive-briefing'));
const BriefingHistory = lazy(() => import('./pages/strategy/briefing-history'));
const StrategyAlerts = lazy(() => import('./pages/strategy/alerts'));
const AlloyProof = lazy(() => import('./pages/strategy/alloy-proof'));
const Automations = lazy(() => import('./pages/strategy/automations'));
const CarlotaPipeline = lazy(() => import('./pages/strategy/carlota-pipeline'));
const Changelog = lazy(() => import('./pages/strategy/changelog'));
const ContinuumProof = lazy(() => import('./pages/strategy/continuum-proof'));
const Costs = lazy(() => import('./pages/strategy/costs'));
const DecisionCenter = lazy(() => import('./pages/strategy/decision-center'));
const DemoLaunchpad = lazy(() => import('./pages/strategy/demo-launchpad'));
const Digest = lazy(() => import('./pages/strategy/digest'));
const DigitalTwinsManagement = lazy(() => import('./pages/strategy/digital-twins-management'));
const DomainDetail = lazy(() => import('./pages/strategy/domain-detail'));
const Entity360 = lazy(() => import('./pages/strategy/entity-360').then(m => ({ default: m.Entity360Page })));
const EvalForge = lazy(() => import('./pages/strategy/eval-forge'));
const EvalLab = lazy(() => import('./pages/strategy/eval-lab'));
const EvalStudio = lazy(() => import('./pages/strategy/eval-studio'));
const EvidenceExplorer = lazy(() => import('./pages/strategy/evidence-explorer'));
const GovernanceTiers = lazy(() => import('./pages/strategy/governance-tiers'));
const StrategyGovernance = lazy(() => import('./pages/strategy/governance'));
const GovernedCockpit = lazy(() => import('./pages/strategy/governed-cockpit'));
const GuardianApprovals = lazy(() => import('./pages/strategy/guardian-approvals'));
const GuardrailConfigs = lazy(() => import('./pages/strategy/guardrail-configs'));
const GuardrailHealth = lazy(() => import('./pages/strategy/guardrail-health'));
const HealthPage = lazy(() => import('./pages/strategy/health'));
const EnterpriseMcpAdmin = lazy(() => import('./pages/strategy/enterprise-mcp-admin'));
const OpenEvalHub = lazy(() => import('./pages/strategy/open-eval-hub'));
const OperatorPanel = lazy(() => import('./pages/strategy/operator-panel').then(m => ({ default: m.OperatorPanel })));
const PolicyApprovals = lazy(() => import('./pages/strategy/policy-approvals'));
const PolicyManager = lazy(() => import('./pages/strategy/policy-manager'));
const ReplayLab = lazy(() => import('./pages/strategy/replay-lab'));
const RetrievalProofChain = lazy(() => import('./pages/strategy/retrieval-proof-chain'));
const RunConsole = lazy(() => import('./pages/strategy/run-console').then(m => ({ default: m.RunConsole })));
const Sla = lazy(() => import('./pages/strategy/sla'));
const StructuredIntelligence = lazy(() => import('./pages/strategy/structured-intelligence'));
const Team = lazy(() => import('./pages/strategy/team'));
const TrustConsole = lazy(() => import('./pages/strategy/trust-console'));

const CrossPlatformHub = lazy(() => import('./pages/cross-platform/index').then(m => ({ default: m.CrossPlatformHubPage })));
const SignalCorrelation = lazy(() => import('./pages/cross-platform/signal-correlation').then(m => ({ default: m.SignalCorrelationPage })));
const EvidenceRegistry = lazy(() => import('./pages/cross-platform/evidence-registry').then(m => ({ default: m.EvidenceRegistryPage })));
const RunHealth = lazy(() => import('./pages/cross-platform/run-health').then(m => ({ default: m.RunHealthPage })));
const PilotIntelligence = lazy(() => import('./pages/cross-platform/pilot-intelligence').then(m => ({ default: m.PilotIntelligencePage })));

const CognitiveOverview = lazy(() => import('./pages/cognitive/overview'));
const CognitiveMemory = lazy(() => import('./pages/cognitive/memory'));
const CognitivePlanner = lazy(() => import('./pages/cognitive/planner'));
const CognitiveVerifier = lazy(() => import('./pages/cognitive/verifier'));
const CognitiveReflection = lazy(() => import('./pages/cognitive/reflection'));
const CognitiveTraces = lazy(() => import('./pages/cognitive/traces'));
const CognitiveEvals = lazy(() => import('./pages/cognitive/evals'));
const CognitivePolicies = lazy(() => import('./pages/cognitive/policies'));
const CognitivePolicySim = lazy(() => import('./pages/cognitive/policy-sim'));
const CognitiveSelfModel = lazy(() => import('./pages/cognitive/self-model'));
const CognitiveWorldModel = lazy(() => import('./pages/cognitive/world-model'));

const EcosystemCommandCenter = lazy(() => import('./pages/ecosystem/index').then(m => ({ default: m.EcosystemCommandCenter })));

const OmniaHub = lazy(() => import('./pages/omnia/index'));

const SubstrateCommandCenter = lazy(() => import('./pages/substrate/index').then(m => ({ default: m.SubstrateCommandCenter })));
const SubstrateCounterfactual = lazy(() => import('./pages/substrate/counterfactual'));
const SubstrateApprovalQueue = lazy(() => import('./pages/substrate/approval-queue'));

const PERRuntimeOverview = lazy(() => import('./pages/evolution/runtime-overview'));
const PEREvaluationConsole = lazy(() => import('./pages/evolution/evaluation-console'));
const PERGovernanceConsole = lazy(() => import('./pages/evolution/governance-console'));
const PERDiagnostics = lazy(() => import('./pages/evolution/diagnostics'));

const OpsAutonomousNOC = lazy(() => import('./pages/operations/autonomous-noc'));
const OpsSLOManagement = lazy(() => import('./pages/operations/slo-management'));
const OpsFinOps = lazy(() => import('./pages/operations/finops'));
const OpsDistributedTracing = lazy(() => import('./pages/operations/distributed-tracing'));
const OpsOnCallCenter = lazy(() => import('./pages/operations/oncall-center'));
const OpsNoiseReduction = lazy(() => import('./pages/operations/noise-reduction'));
const OpsCapacityPlanning = lazy(() => import('./pages/operations/capacity-planning'));
const OpsChangeManagement = lazy(() => import('./pages/operations/change-management'));
const OpsSyntheticMonitoring = lazy(() => import('./pages/operations/synthetic-monitoring'));
const OpsRevenueImpact = lazy(() => import('./pages/operations/revenue-impact'));
const OpsBusinessSignals = lazy(() => import('./pages/operations/business-signals-intelligence'));
const OpsPredictiveIntelligence = lazy(() => import('./pages/operations/predictive-intelligence'));
const OpsLivingTopology = lazy(() => import('./pages/operations/living-topology'));
const OpsGovernedDecisionLoop = lazy(() => import('./pages/operations/governed-decision-loop'));
const OpsCognitiveRuntime = lazy(() => import('./pages/operations/cognitive-runtime'));
const OpsAIQualityDashboard = lazy(() => import('./pages/operations/ai-quality-dashboard'));
const OpsRunbookStudio = lazy(() => import('./pages/operations/runbook-studio'));
const OpsKnowledgeGraph = lazy(() => import('./pages/operations/knowledge-graph'));
const OpsSelfHealing = lazy(() => import('./pages/operations/self-healing'));
const OpsDexScoring = lazy(() => import('./pages/operations/dex-scoring'));
const OpsApprovalsCenter = lazy(() => import('./pages/operations/approvals-center'));
const OpsCommandInbox = lazy(() => import('./pages/operations/command-inbox'));
const OpsOwnershipMap = lazy(() => import('./pages/operations/ownership-map-new'));
const OpsEscalationCenter = lazy(() => import('./pages/operations/escalation-center'));
const OpsActionQueue = lazy(() => import('./pages/operations/action-queue'));
const OpsOperationalQueue = lazy(() => import('./pages/operations/operational-queue'));
const OpsMetricsExplorer = lazy(() => import('./pages/operations/metrics-explorer'));
const OpsServiceTopology = lazy(() => import('./pages/operations/service-topology'));
const OpsLogExplorer = lazy(() => import('./pages/operations/log-explorer'));
const OpsAlertManagement = lazy(() => import('./pages/operations/alert-management'));
const OpsSignals = lazy(() => import('./pages/operations/signals'));
const OpsRecommendations = lazy(() => import('./pages/operations/recommendations'));
const OpsReadiness = lazy(() => import('./pages/operations/readiness'));
const OpsExecutiveCommand = lazy(() => import('./pages/operations/executive-command'));
const OpsPulse = lazy(() => import('./pages/operations/pulse'));
const OpsBlockerBoard = lazy(() => import('./pages/operations/blocker-board'));
const OpsWhatChanged = lazy(() => import('./pages/operations/what-changed'));
const OpsDeployments = lazy(() => import('./pages/operations/deployments'));
const OpsDigestCenter = lazy(() => import('./pages/operations/digest-center'));
const OpsTrustAudit = lazy(() => import('./pages/operations/trust-audit'));
const OpsAlloyWorkflowCanvas = lazy(() => import('./pages/operations/alloy-workflow-canvas'));
const OpsAlloyActionConsole = lazy(() => import('./pages/operations/alloy-action-console'));
const OpsAlloyWorkflowTemplates = lazy(() => import('./pages/operations/alloy-workflow-templates'));
const OpsAlloyIntelligence = lazy(() => import('./pages/operations/alloy-intelligence'));
const OpsAlloyGovernance = lazy(() => import('./pages/operations/alloy-governance'));
const OpsAlloyAgentMonitor = lazy(() => import('./pages/operations/alloy-agent-monitor'));
const OpsAlloyExecutionTraces = lazy(() => import('./pages/operations/alloy-execution-traces'));
const OpsAlloyReplayTimeline = lazy(() => import('./pages/operations/alloy-replay-timeline'));
const OpsAlloyPolicySim = lazy(() => import('./pages/operations/alloy-policy-sim'));
const OpsAlloyAgentHandoffs = lazy(() => import('./pages/operations/alloy-agent-handoffs'));
const OpsAlloyTrustReceipts = lazy(() => import('./pages/operations/alloy-trust-receipts'));
const OpsAlloyIntegrationHealth = lazy(() => import('./pages/operations/alloy-integration-health'));
const OpsAlloyGraphCompiler = lazy(() => import('./pages/operations/alloy-graph-compiler'));
const OpsAlloyWriteBack = lazy(() => import('./pages/operations/alloy-write-back'));
const OpsAtlasExecute = lazy(() => import('./pages/operations/atlas-execute'));
const OpsAlloyPolicyCompiler = lazy(() => import('./pages/operations/alloy-policy-compiler'));

const AdminOpsConsole = lazy(() => import('./pages/operations/admin/ops-console'));
const AdminOverview = lazy(() => import('./pages/operations/admin/overview'));
const AdminUsers = lazy(() => import('./pages/operations/admin/users'));
const AdminFlags = lazy(() => import('./pages/operations/admin/feature-flags'));
const AdminApps = lazy(() => import('./pages/operations/admin/apps-registry'));
const AdminRuns = lazy(() => import('./pages/operations/admin/run-viewer'));
const AdminApprovals = lazy(() => import('./pages/operations/admin/approval-queue'));
const AdminAudit = lazy(() => import('./pages/operations/admin/audit-log'));
const AdminExports = lazy(() => import('./pages/operations/admin/export-history'));
const AdminSeeder = lazy(() => import('./pages/operations/admin/seeder'));
const AdminJobs = lazy(() => import('./pages/operations/admin/jobs'));
const AdminKbArticles = lazy(() => import('./pages/operations/admin/kb-articles'));
const AdminSupportOps = lazy(() => import('./pages/operations/admin/support-ops'));
const AdminAnalytics = lazy(() => import('./pages/operations/admin/analytics-dashboard'));
const AdminExperiments = lazy(() => import('./pages/operations/admin/experiments'));

const InfraLegatusConsole = lazy(() => import('./pages/infrastructure/legatus-console'));
const InfraImperiumMap = lazy(() => import('./pages/infrastructure/imperium-map'));
const InfraImperiumForecast = lazy(() => import('./pages/infrastructure/imperium-forecast'));
const InfraPraetorianGuard = lazy(() => import('./pages/infrastructure/praetorian-guard'));
const InfraSenateChamber = lazy(() => import('./pages/infrastructure/senate-chamber'));
const InfraSupplyLines = lazy(() => import('./pages/infrastructure/supply-lines'));
const InfraCenturionAI = lazy(() => import('./pages/infrastructure/centurion-ai'));
const InfraIntelligenceBriefing = lazy(() => import('./pages/infrastructure/intelligence-briefing'));
const InfraGeospatial = lazy(() => import('./pages/infrastructure/geospatial'));
const InfraDirectiveCascade = lazy(() => import('./pages/infrastructure/directive-cascade'));
const InfraCoalition = lazy(() => import('./pages/infrastructure/coalition'));
const InfraStrategicReserves = lazy(() => import('./pages/infrastructure/strategic-reserves'));
const InfraSubstrateInference = lazy(() => import('./pages/infrastructure/substrate-inference'));
const InfraDataFabric = lazy(() => import('./pages/infrastructure/data-fabric'));
const InfraAtlasExecute = lazy(() => import('./pages/infrastructure/atlas-execute'));

const MarketingHome = lazy(() => import('./pages/marketing/index'));
const MarketingPricing = lazy(() => import('./pages/marketing/pricing'));
const MarketingSignup = lazy(() => import('./pages/marketing/signup'));
const MarketingOnboarding = lazy(() => import('./pages/marketing/onboarding'));
const MarketingStatus = lazy(() => import('./pages/marketing/status'));
const MarketingLeads = lazy(() => import('./pages/marketing/leads'));
const MarketingVerifyEmail = lazy(() => import('./pages/marketing/verify-email'));


export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Switch>
        <Route path={`${base}/`} component={HomePage} />
        <Route path={`${base}`} component={HomePage} />
        <Route path={`${base}/loop-reasoner`}>
          <WithShell><LoopReasoner /></WithShell>
        </Route>
        <Route path={`${base}/now`} component={NowBoard} />
        <Route path={`${base}/recommendations`} component={Recommendations} />
        <Route path={`${base}/brief`} component={ExecutiveBrief} />
        <Route path={`${base}/command`} component={CommandSurface} />
        <Route path={`${base}/signals`} component={SignalMesh} />
        <Route path={`${base}/actions`} component={ActionRail} />
        <Route path={`${base}/proof`} component={ProofLedger} />
        <Route path={`${base}/codex-receipts`}>
          <WithShell><CodexReceipts /></WithShell>
        </Route>
        <Route path={`${base}/portfolio-archive`}>
          <WithShell><PortfolioArchive /></WithShell>
        </Route>
        <Route path={`${base}/governance`} component={Governance} />
        <Route path={`${base}/agents`} component={Agents} />
        <Route path={`${base}/workcells/:id/replay`} component={WorkcellReplayDetail} />
        <Route path={`${base}/workcells/:id`} component={WorkcellDetail} />
        <Route path={`${base}/workcells`} component={Workcells} />
        <Route path={`${base}/evals`} component={MirrorEval} />
        <Route path={`${base}/connectors`} component={ConnectorFirewall} />
        <Route path={`${base}/twins`} component={TwinFoundry} />
        <Route path={`${base}/model-router`} component={ModelRouter} />
        <Route path={`${base}/ai-gateway`} component={AiGateway} />
        <Route path={`${base}/skills`} component={SkillsLibrary} />
        <Route path={`${base}/replay/:id`} component={SovereignReplayDetail} />
        <Route path={`${base}/replay`} component={WorkcellReplay} />
        <Route path={`${base}/trust`} component={TrustCenter} />
        <Route path={`${base}/constitution`} component={Constitution} />
        <Route path={`${base}/security-compliance`} component={SecurityCompliance} />
        <Route path={`${base}/right-to-audit`} component={RightToAudit} />
        <Route path={`${base}/sovereign`} component={Sovereign} />
        <Route path={`${base}/boardroom`} component={BoardroomMode} />
        <Route path={`${base}/investor-demo`} component={InvestorDemo} />
        <Route path={`${base}/flexcache`}>
          <WithShell><FlexCacheRuntime /></WithShell>
        </Route>
        <Route path={`${base}/terminal`} component={Terminal} />
        <Route path={`${base}/nexus`} component={Praxis} />
        <Route path={`${base}/mcp-hub`} component={McpHub} />
        <Route path={`${base}/agentic-rag`} component={AgenticRag} />
        <Route path={`${base}/fabric/verticals`} component={FabricVerticalsCommand} />
        <Route path={`${base}/fabric/twins`} component={FabricDomainTwins} />
        <Route path={`${base}/fabric/signals`} component={FabricSignalMeshPage} />
        <Route path={`${base}/fabric/risks`} component={FabricRiskMatrix} />
        <Route path={`${base}/fabric/decisions`} component={FabricDecisionQueue} />
        <Route path={`${base}/fabric/outcomes`} component={FabricOutcomeMemory} />
        <Route path={`${base}/fabric/evidence`} component={FabricEvidenceLedger} />
        <Route path={`${base}/fabric/roadmap`} component={FabricEcosystemRoadmap} />
        <Route path={`${base}/fabric`} component={FabricCockpit} />
        <Route path={`${base}/verticals`} component={Verticals} />
        <Route path={`${base}/outcomes`} component={Outcomes} />
        <Route path={`${base}/memory`} component={Memory} />
        <Route path={`${base}/tools`} component={Tools} />
        <Route path={`${base}/pce`} component={Pce} />
        <Route path={`${base}/demo`} component={Demo} />
        <Route path={`${base}/orchestration`} component={AgentOrchestration} />
        <Route path={`${base}/agent-viz`} component={AgentViz} />
        <Route path={`${base}/sdk`} component={DevPlatform} />
        <Route path={`${base}/a11oy-code`}>
          <WithShell><A11oyCode /></WithShell>
        </Route>
        <Route path={`${base}/chat`}>
          <WithShell><A11oyChat /></WithShell>
        </Route>
        <Route path={`${base}/agent-mesh`} component={AgentMesh} />
        <Route path={`${base}/plugins`}>
          <WithShell><PluginHub /></WithShell>
        </Route>
        <Route path={`${base}/deep-research`}>
          <WithShell><DeepResearch /></WithShell>
        </Route>
        <Route path={`${base}/action`}>
          <WithShell><CiAction /></WithShell>
        </Route>
        <Route path={`${base}/convergence`} component={AgiConvergence} />
        <Route path={`${base}/solutions`}>
          <WithShell><Solutions /></WithShell>
        </Route>
        <Route path={`${base}/about`} component={About} />
        <Route path={`${base}/omnia-adoption`} component={OmniaAdoptionPage} />
        <Route path={`${base}/applications`} component={ApplicationsCatalog} />
        <Route path={`${base}/constellation`} component={ConstellationGraph} />
        <Route path={`${base}/architecture`} component={ArchitectureOverview} />
        <Route path={`${base}/resources`} component={ResourcesHub} />
        <Route path={`${base}/control-tower`} component={ControlTower} />
        <Route path={`${base}/pipeline`} component={PipelineCanvas} />
        <Route path={`${base}/intent-router`} component={IntentRouter} />
        <Route path={`${base}/planner`} component={PlannerCanvas} />
        <Route path={`${base}/ontology`} component={OntologyGraph} />
        <Route path={`${base}/learning`} component={LearningLoop} />
        <Route path={`${base}/counterfactuals`} component={Counterfactuals} />
        <Route path={`${base}/adversarial`} component={AdversarialResilience} />
        <Route path={`${base}/frontier`} component={FrontierIntelligence} />
        <Route path={`${base}/quantum`} component={QuantumIntelligence} />
        <Route path={`${base}/approval-queue`} component={ApprovalQueue} />
        <Route path={`${base}/runtime`}>
          <WithShell><RuntimeCommandCenter /></WithShell>
        </Route>
        <Route path={`${base}/cognitive-reflexivity`} component={CognitiveReflexivity} />
        <Route path={`${base}/ouroboros`} component={Ouroboros} />
        <Route path={`${base}/verifier`} component={VerifierAgent} />
        <Route path={`${base}/doctrine`} component={DoctrineOverview} />
        <Route path={`${base}/risk-reports`} component={RiskReports} />
        <Route path={`${base}/behavioral-audit`} component={BehavioralAudit} />
        <Route path={`${base}/covenant-lift`} component={CovenantLift} />
        <Route path={`${base}/code-behaviors`} component={CodeBehaviors} />
        <Route path={`${base}/reward-hacking`} component={RewardHacking} />
        <Route path={`${base}/alignment-review`} component={AlignmentReview} />
        <Route path={`${base}/snapshot-provenance`} component={SnapshotProvenance} />
        <Route path={`${base}/ai-user-turn`} component={AIUserTurn} />
        <Route path={`${base}/welfare`} component={AgentWelfare} />
        <Route path={`${base}/red-team`} component={RedTeam} />
        <Route path={`${base}/glasswing`} component={GlasswingPage} />
        <Route path={`${base}/argo`} component={ArgoForgePage} />
        <Route path={`${base}/mythos-layer`} component={MythosLayerPage} />
        <Route path={`${base}/aerial-twin`} component={AerialTwinPage} />
        <Route path={`${base}/aerial-twin/:milestone`} component={AerialTwinMilestonePage} />
        <Route path={`${base}/system-card/:id`} component={SystemCard} />
        <Route path={`${base}/capability-trajectory`} component={CapabilityTrajectory} />
        <Route path={`${base}/resilience`} component={DarpaResilienceHub} />
        <Route path={`${base}/gard-robustness`} component={GardRobustness} />
        <Route path={`${base}/formal-verification`} component={FormalVerification} />
        <Route path={`${base}/supply-chain`} component={SupplyChainAttestation} />
        <Route path={`${base}/explainability`} component={ExplainabilityEngine} />
        <Route path={`${base}/compartments`} component={CapabilityCompartments} />
        <Route path={`${base}/cyber-resilience`} component={CyberResilience} />
        <Route path={`${base}/sim-governance`} component={SimGovernance} />
        <Route path={`${base}/mythos-spec`} component={MythosSpec} />
        <Route path={`${base}/glasswing-partners`} component={GlasswingPartners} />
        <Route path={`${base}/cavd`} component={CAVDPage} />
        <Route path={`${base}/transparency-report`} component={TransparencyReport} />
        <Route path={`${base}/trust-portal`} component={PublicTrustPortal} />
        <Route path={`${base}/robustness-wall`} component={RobustnessWall} />
        <Route path={`${base}/constitution-dsl`} component={ConstitutionDSL} />
        <Route path={`${base}/welfare-playbooks`} component={WelfarePlaybooks} />
        <Route path={`${base}/defender-credits`} component={DefenderCredits} />
        <Route path={`${base}/compass`} component={Compass} />
        <Route path={`${base}/agent-bom`} component={AgentBom} />
        <Route path={`${base}/delegation-chain`} component={DelegationChainPage} />
        <Route path={`${base}/trust-exchange`} component={TrustExchange} />
        <Route path={`${base}/care`} component={CareEngine} />
        <Route path={`${base}/precision-ai`} component={PrecisionAI} />
        <Route path={`${base}/weaponized-intel`} component={WeaponizedIntel} />
        <Route path={`${base}/agent-zero-trust`} component={AgentZeroTrust} />
        <Route path={`${base}/atlas-shield`} component={AtlasShield} />
        <Route path={`${base}/swarm-orchestrator`} component={SwarmOrchestrator} />
        <Route path={`${base}/playbook-engine`} component={PlaybookEngine} />
        <Route path={`${base}/a2a-interop`} component={A2AInterop} />
        <Route path={`${base}/agent-identity`} component={AgentIdentityRegistry} />
        <Route path={`${base}/model-provenance`} component={ModelProvenance} />
        <Route path={`${base}/self-optimization`} component={SelfOptimization} />
        <Route path={`${base}/security-agents`} component={GovernedSecurityAgents} />
        <Route path={`${base}/karpathy-evolution`}>
          <WithShell><KarpathyEvolution /></WithShell>
        </Route>
        <Route path={`${base}/substrate-compute`}>
          <WithShell><SubstrateCompute /></WithShell>
        </Route>
        <Route path={`${base}/hf-jobs`}>
          <WithShell><HfJobs /></WithShell>
        </Route>
        <Route path={`${base}/hub-operations`}>
          <WithShell><HubOperations /></WithShell>
        </Route>
        <Route path={`${base}/toto-forecaster`}>
          <WithShell><TotoForecaster /></WithShell>
        </Route>
        <Route path={`${base}/causal-rca`}>
          <WithShell><CausalRCA /></WithShell>
        </Route>
        <Route path={`${base}/synthetic-metrics`}>
          <WithShell><SyntheticMetrics /></WithShell>
        </Route>
        <Route path={`${base}/self-healing`}>
          <WithShell><SelfHealingEngine /></WithShell>
        </Route>
        <Route path={`${base}/observability-as-code`}>
          <WithShell><ObservabilityAsCode /></WithShell>
        </Route>
        <Route path={`${base}/alert-triage`}>
          <WithShell><AlertTriage /></WithShell>
        </Route>
        <Route path={`${base}/cost-monitoring`}>
          <WithShell><CostAwareMonitoring /></WithShell>
        </Route>
        <Route path={`${base}/andean-orchestration`}>
          <WithShell><AndeanOrchestration /></WithShell>
        </Route>

        <Route path={`${base}/reliquary/vault`}>
          <WithShell><VaultBrowser /></WithShell>
        </Route>
        <Route path={`${base}/reliquary/lineage`}>
          <WithShell><LineageGraph /></WithShell>
        </Route>
        <Route path={`${base}/reliquary/snapshots`}>
          <WithShell><SnapshotReplay /></WithShell>
        </Route>
        <Route path={`${base}/reliquary/sovereign`}>
          <WithShell><SovereignMode /></WithShell>
        </Route>
        <Route path={`${base}/reliquary/doctrine`}>
          <WithShell><ReliquaryDoctrine /></WithShell>
        </Route>

        <Route path={`${base}/atlas`}>
          <WithShell><AtlasSection /></WithShell>
        </Route>
        <Route path={`${base}/tokens`}>
          <WithShell><TokensSection /></WithShell>
        </Route>
        <Route path={`${base}/voice`}>
          <WithShell><VoiceSection /></WithShell>
        </Route>
        <Route path={`${base}/library`}>
          <WithShell><LibrarySection /></WithShell>
        </Route>
        <Route path={`${base}/releases`}>
          <WithShell><ReleasesSection /></WithShell>
        </Route>
        <Route path={`${base}/audit`}>
          <WithShell><AuditSection /></WithShell>
        </Route>
        <Route path={`${base}/account/billing`}>
          <WithShell><A11oyBillingPage /></WithShell>
        </Route>

        <Route path={`${base}/intelligence/deep-dive`}>
          <WithShell><IntelligenceDeepDive /></WithShell>
        </Route>
        <Route path={`${base}/intelligence/roi-lens`}>
          <WithShell><IntelligenceRoiLens /></WithShell>
        </Route>
        <Route path={`${base}/intelligence`}>
          <WithShell><IntelligenceCommand /></WithShell>
        </Route>
        <Route path={`${base}/sigil`}>
          <WithShell><SigilPage /></WithShell>
        </Route>
        <Route path={`${base}/lab/patterns`}>
          <WithShell><PatternAtlasNative /></WithShell>
        </Route>
        <Route path={`${base}/lab/prompts`}>
          <WithShell><PromptRegistryNative /></WithShell>
        </Route>
        <Route path={`${base}/lab/evals`}>
          <WithShell><EvalConsoleNative /></WithShell>
        </Route>
        <Route path={`${base}/lab`}>
          <WithShell><Lab /></WithShell>
        </Route>

        <Route path={`${base}/hub/fleet`}>
          <Suspense fallback={<Loader />}><AlloyFleet /></Suspense>
        </Route>
        <Route path={`${base}/hub/foundry`}>
          <Suspense fallback={<Loader />}><AlloyFoundry /></Suspense>
        </Route>
        <Route path={`${base}/hub/governance`}>
          <Suspense fallback={<Loader />}><AlloyGovernance /></Suspense>
        </Route>
        <Route path={`${base}/hub/pricing`}>
          <Suspense fallback={<Loader />}><AlloyPricing /></Suspense>
        </Route>
        <Route path={`${base}/hub`}>
          <Suspense fallback={<Loader />}><AlloyHubLanding /></Suspense>
        </Route>

        <Route path={`${base}/embed/:slug`}>
          <Suspense fallback={<Loader />}><AtelierEmbedHost /></Suspense>
        </Route>
        <Route path={`${base}/atelier/s/:slug`}>
          <Suspense fallback={<Loader />}><AtelierDetail /></Suspense>
        </Route>
        <Route path={`${base}/atelier/new`}>
          <Suspense fallback={<Loader />}><AtelierNew /></Suspense>
        </Route>
        <Route path={`${base}/atelier/leaderboards`}>
          <Suspense fallback={<Loader />}><AtelierLeaderboards /></Suspense>
        </Route>
        <Route path={`${base}/atelier/my-spaces`}>
          <Suspense fallback={<Loader />}><AtelierMySpaces /></Suspense>
        </Route>
        <Route path={`${base}/atelier/manifesto`}>
          <Suspense fallback={<Loader />}><AtelierManifesto /></Suspense>
        </Route>
        <Route path={`${base}/atelier`}>
          <Suspense fallback={<Loader />}><AtelierHub /></Suspense>
        </Route>

        {/* Strategy Workspace — migrated from Command */}
        <Route path={`${base}/strategy`}>
          <WithShell><StrategyDashboard /></WithShell>
        </Route>
        <Route path={`${base}/strategy/atlas-runtime`}>
          <WithShell><AtlasRuntime /></WithShell>
        </Route>
        <Route path={`${base}/strategy/executive-briefing`}>
          <WithShell><StrategyExecutiveBriefing /></WithShell>
        </Route>
        <Route path={`${base}/strategy/briefing`}>
          <WithShell><BriefingHistory /></WithShell>
        </Route>
        <Route path={`${base}/strategy/simulation`}>
          <WithShell><Simulation /></WithShell>
        </Route>
        <Route path={`${base}/strategy/stress-drill`}>
          <WithShell><StressDrill /></WithShell>
        </Route>
        <Route path={`${base}/strategy/game-day`}>
          <WithShell><GameDay /></WithShell>
        </Route>
        <Route path={`${base}/strategy/correlation-map`}>
          <WithShell><CorrelationMap /></WithShell>
        </Route>
        <Route path={`${base}/strategy/signal-chains`}>
          <WithShell><SignalChains /></WithShell>
        </Route>
        <Route path={`${base}/strategy/enterprise-state`}>
          <WithShell><EnterpriseState /></WithShell>
        </Route>
        <Route path={`${base}/strategy/worldline-registry`}>
          <WithShell><WorldlineRegistry /></WithShell>
        </Route>
        <Route path={`${base}/strategy/competitive-atlas`}>
          <WithShell><CompetitiveAtlas /></WithShell>
        </Route>
        <Route path={`${base}/strategy/cross-platform/hub`}>
          <WithShell><CrossPlatformHub /></WithShell>
        </Route>
        <Route path={`${base}/strategy/cross-platform/evidence`}>
          <WithShell><EvidenceRegistry /></WithShell>
        </Route>
        <Route path={`${base}/strategy/cross-platform/run-health`}>
          <WithShell><RunHealth /></WithShell>
        </Route>
        <Route path={`${base}/strategy/cross-platform/pilots`}>
          <WithShell><PilotIntelligence /></WithShell>
        </Route>
        <Route path={`${base}/strategy/cross-platform`}>
          <WithShell><SignalCorrelation /></WithShell>
        </Route>
        <Route path={`${base}/decisions`}>
          <WithShell><DecisionCenter /></WithShell>
        </Route>
        <Route path={`${base}/intelligence/evidence`}>
          <WithShell><EvidenceExplorer /></WithShell>
        </Route>
        <Route path={`${base}/entity-360`}>
          <WithShell><Entity360 /></WithShell>
        </Route>
        <Route path={`${base}/digital-twins`}>
          <WithShell><DigitalTwinsManagement /></WithShell>
        </Route>
        <Route path={`${base}/domain-detail`}>
          <WithShell><DomainDetail /></WithShell>
        </Route>

        {/* Operations Workspace — migrated from Command */}
        <Route path={`${base}/operations/autonomous-noc`}>
          <WithShell><OpsAutonomousNOC /></WithShell>
        </Route>
        <Route path={`${base}/operations/slo`}>
          <WithShell><OpsSLOManagement /></WithShell>
        </Route>
        <Route path={`${base}/operations/finops`}>
          <WithShell><OpsFinOps /></WithShell>
        </Route>
        <Route path={`${base}/operations/tracing`}>
          <WithShell><OpsDistributedTracing /></WithShell>
        </Route>
        <Route path={`${base}/operations/on-call`}>
          <WithShell><OpsOnCallCenter /></WithShell>
        </Route>
        <Route path={`${base}/operations/noise-reduction`}>
          <WithShell><OpsNoiseReduction /></WithShell>
        </Route>
        <Route path={`${base}/operations/capacity-planning`}>
          <WithShell><OpsCapacityPlanning /></WithShell>
        </Route>
        <Route path={`${base}/operations/change-management`}>
          <WithShell><OpsChangeManagement /></WithShell>
        </Route>
        <Route path={`${base}/operations/synthetic`}>
          <WithShell><OpsSyntheticMonitoring /></WithShell>
        </Route>
        <Route path={`${base}/operations/revenue-impact`}>
          <WithShell><OpsRevenueImpact /></WithShell>
        </Route>
        <Route path={`${base}/operations/business-signals`}>
          <WithShell><OpsBusinessSignals /></WithShell>
        </Route>
        <Route path={`${base}/operations/predictive-intelligence`}>
          <WithShell><OpsPredictiveIntelligence /></WithShell>
        </Route>
        <Route path={`${base}/operations/living-topology`}>
          <WithShell><OpsLivingTopology /></WithShell>
        </Route>
        <Route path={`${base}/operations/governed-decision-loop`}>
          <WithShell><OpsGovernedDecisionLoop /></WithShell>
        </Route>
        <Route path={`${base}/operations/cognitive-runtime`}>
          <WithShell><OpsCognitiveRuntime /></WithShell>
        </Route>
        <Route path={`${base}/operations/ai-ops`}>
          <WithShell><OpsAIQualityDashboard /></WithShell>
        </Route>
        <Route path={`${base}/operations/runbook-studio`}>
          <WithShell><OpsRunbookStudio /></WithShell>
        </Route>
        <Route path={`${base}/operations/knowledge-graph`}>
          <WithShell><OpsKnowledgeGraph /></WithShell>
        </Route>
        <Route path={`${base}/operations/self-healing`}>
          <WithShell><OpsSelfHealing /></WithShell>
        </Route>
        <Route path={`${base}/operations/dex`}>
          <WithShell><OpsDexScoring /></WithShell>
        </Route>
        <Route path={`${base}/operations/approvals`}>
          <WithShell><OpsApprovalsCenter /></WithShell>
        </Route>
        <Route path={`${base}/operations/inbox`}>
          <WithShell><OpsCommandInbox /></WithShell>
        </Route>
        <Route path={`${base}/operations/ownership`}>
          <WithShell><OpsOwnershipMap /></WithShell>
        </Route>
        <Route path={`${base}/operations/escalation`}>
          <WithShell><OpsEscalationCenter /></WithShell>
        </Route>
        <Route path={`${base}/operations/action-queue`}>
          <WithShell><OpsActionQueue /></WithShell>
        </Route>
        <Route path={`${base}/operations/queue`}>
          <WithShell><OpsOperationalQueue /></WithShell>
        </Route>
        <Route path={`${base}/operations/metrics`}>
          <WithShell><OpsMetricsExplorer /></WithShell>
        </Route>
        <Route path={`${base}/operations/topology`}>
          <WithShell><OpsServiceTopology /></WithShell>
        </Route>
        <Route path={`${base}/operations/logs`}>
          <WithShell><OpsLogExplorer /></WithShell>
        </Route>
        <Route path={`${base}/operations/alerts`}>
          <WithShell><OpsAlertManagement /></WithShell>
        </Route>
        <Route path={`${base}/operations/signals`}>
          <WithShell><OpsSignals /></WithShell>
        </Route>
        <Route path={`${base}/operations/recommendations`}>
          <WithShell><OpsRecommendations /></WithShell>
        </Route>
        <Route path={`${base}/operations/readiness`}>
          <WithShell><OpsReadiness /></WithShell>
        </Route>
        <Route path={`${base}/operations/pulse`}>
          <WithShell><OpsPulse /></WithShell>
        </Route>
        <Route path={`${base}/operations/blocker-board`}>
          <WithShell><OpsBlockerBoard /></WithShell>
        </Route>
        <Route path={`${base}/operations/what-changed`}>
          <WithShell><OpsWhatChanged /></WithShell>
        </Route>
        <Route path={`${base}/operations/deployments`}>
          <WithShell><OpsDeployments /></WithShell>
        </Route>
        <Route path={`${base}/operations/digest`}>
          <WithShell><OpsDigestCenter /></WithShell>
        </Route>
        <Route path={`${base}/operations/trust-audit`}>
          <WithShell><OpsTrustAudit /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/canvas`}>
          <WithShell><OpsAlloyWorkflowCanvas /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/actions`}>
          <WithShell><OpsAlloyActionConsole /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/templates`}>
          <WithShell><OpsAlloyWorkflowTemplates /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/intelligence`}>
          <WithShell><OpsAlloyIntelligence /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/governance`}>
          <WithShell><OpsAlloyGovernance /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/agents`}>
          <WithShell><OpsAlloyAgentMonitor /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/traces`}>
          <WithShell><OpsAlloyExecutionTraces /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/replay`}>
          <WithShell><OpsAlloyReplayTimeline /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/simulate`}>
          <WithShell><OpsAlloyPolicySim /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/handoffs`}>
          <WithShell><OpsAlloyAgentHandoffs /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/receipts`}>
          <WithShell><OpsAlloyTrustReceipts /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/integrations`}>
          <WithShell><OpsAlloyIntegrationHealth /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/compiler`}>
          <WithShell><OpsAlloyGraphCompiler /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/policy-compiler`}>
          <WithShell><OpsAlloyPolicyCompiler /></WithShell>
        </Route>
        <Route path={`${base}/operations/continuum/gates`}>
          <WithShell><OpsAlloyWriteBack /></WithShell>
        </Route>
        <Route path={`${base}/operations/atlas-execute`}>
          <WithShell><OpsAtlasExecute /></WithShell>
        </Route>
        <Route path={`${base}/operations/operator`}>
          <WithShell><OperatorPanel /></WithShell>
        </Route>
        <Route path={`${base}/operations/runs`}>
          <WithShell><RunConsole /></WithShell>
        </Route>
        <Route path={`${base}/operations/evidence-explorer`}>
          <WithShell><EvidenceExplorer /></WithShell>
        </Route>
        <Route path={`${base}/operations/eval-studio`}>
          <WithShell><EvalStudio /></WithShell>
        </Route>
        <Route path={`${base}/operations/forge`}>
          <WithShell><EvalForge /></WithShell>
        </Route>
        <Route path={`${base}/operations/structured-intelligence`}>
          <WithShell><StructuredIntelligence /></WithShell>
        </Route>
        <Route path={`${base}/operations/policy-approvals`}>
          <WithShell><PolicyApprovals /></WithShell>
        </Route>
        <Route path={`${base}/operations/guardian/approvals`}>
          <WithShell><GuardianApprovals /></WithShell>
        </Route>
        <Route path={`${base}/operations/policy-manager`}>
          <WithShell><PolicyManager /></WithShell>
        </Route>
        <Route path={`${base}/operations/governance-tiers`}>
          <WithShell><GovernanceTiers /></WithShell>
        </Route>
        <Route path={`${base}/operations/guardrail-configs`}>
          <WithShell><GuardrailConfigs /></WithShell>
        </Route>
        <Route path={`${base}/operations/guardrail-health`}>
          <WithShell><GuardrailHealth /></WithShell>
        </Route>
        <Route path={`${base}/operations`}>
          <WithShell><OpsExecutiveCommand /></WithShell>
        </Route>

        {/* Admin Console */}
        <Route path={`${base}/operations/admin/ops`}>
          <WithShell><AdminOpsConsole /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/overview`}>
          <WithShell><AdminOverview /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/users`}>
          <WithShell><AdminUsers /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/flags`}>
          <WithShell><AdminFlags /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/apps`}>
          <WithShell><AdminApps /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/runs`}>
          <WithShell><AdminRuns /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/approvals`}>
          <WithShell><AdminApprovals /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/audit`}>
          <WithShell><AdminAudit /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/exports`}>
          <WithShell><AdminExports /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/seeder`}>
          <WithShell><AdminSeeder /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/jobs`}>
          <WithShell><AdminJobs /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/kb`}>
          <WithShell><AdminKbArticles /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/support`}>
          <WithShell><AdminSupportOps /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/analytics`}>
          <WithShell><AdminAnalytics /></WithShell>
        </Route>
        <Route path={`${base}/operations/admin/experiments`}>
          <WithShell><AdminExperiments /></WithShell>
        </Route>

        {/* Cognitive Workspace — migrated from Command */}
        <Route path={`${base}/cognitive/overview`}>
          <WithShell><CognitiveOverview /></WithShell>
        </Route>
        <Route path={`${base}/cognitive/memory`}>
          <WithShell><CognitiveMemory /></WithShell>
        </Route>
        <Route path={`${base}/cognitive/planner`}>
          <WithShell><CognitivePlanner /></WithShell>
        </Route>
        <Route path={`${base}/cognitive/verifier`}>
          <WithShell><CognitiveVerifier /></WithShell>
        </Route>
        <Route path={`${base}/cognitive/reflection`}>
          <WithShell><CognitiveReflection /></WithShell>
        </Route>
        <Route path={`${base}/cognitive/traces`}>
          <WithShell><CognitiveTraces /></WithShell>
        </Route>
        <Route path={`${base}/cognitive/evals`}>
          <WithShell><CognitiveEvals /></WithShell>
        </Route>
        <Route path={`${base}/cognitive/policies`}>
          <WithShell><CognitivePolicies /></WithShell>
        </Route>
        <Route path={`${base}/cognitive/policy-sim`}>
          <WithShell><CognitivePolicySim /></WithShell>
        </Route>
        <Route path={`${base}/cognitive/self-model`}>
          <WithShell><CognitiveSelfModel /></WithShell>
        </Route>
        <Route path={`${base}/cognitive/world-model`}>
          <WithShell><CognitiveWorldModel /></WithShell>
        </Route>

        {/* Infrastructure Workspace — migrated from Command (IMPERIUM) */}
        <Route path={`${base}/infrastructure/legatus`}>
          <WithShell><InfraLegatusConsole /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/imperium-map`}>
          <WithShell><InfraImperiumMap /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/imperium/forecast`}>
          <WithShell><InfraImperiumForecast /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/praetorian`}>
          <WithShell><InfraPraetorianGuard /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/senate`}>
          <WithShell><InfraSenateChamber /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/supply-lines`}>
          <WithShell><InfraSupplyLines /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/centurion`}>
          <WithShell><InfraCenturionAI /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/intelligence`}>
          <WithShell><InfraIntelligenceBriefing /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/geospatial`}>
          <WithShell><InfraGeospatial /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/directives`}>
          <WithShell><InfraDirectiveCascade /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/coalition`}>
          <WithShell><InfraCoalition /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/reserves`}>
          <WithShell><InfraStrategicReserves /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/substrate`}>
          <WithShell><InfraSubstrateInference /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/data-fabric`}>
          <WithShell><InfraDataFabric /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure/imperium/atlas-execute`}>
          <WithShell><InfraAtlasExecute /></WithShell>
        </Route>
        <Route path={`${base}/infrastructure`}>
          <WithShell><InfraLegatusConsole /></WithShell>
        </Route>

        {/* Substrate Command Center */}
        <Route path={`${base}/substrate/approvals`}>
          <WithShell><SubstrateApprovalQueue /></WithShell>
        </Route>
        <Route path={`${base}/substrate/counterfactual`}>
          <WithShell><SubstrateCounterfactual /></WithShell>
        </Route>
        <Route path={`${base}/substrate`}>
          <WithShell><SubstrateCommandCenter /></WithShell>
        </Route>

        {/* Ecosystem / MCP */}
        <Route path={`${base}/ecosystem`}>
          <WithShell><EcosystemCommandCenter /></WithShell>
        </Route>

        {/* OMNIA Cognitive Hub */}
        <Route path={`${base}/omnia`}>
          <WithShell><OmniaHub /></WithShell>
        </Route>

        {/* Precision Evolution Runtime (PER) */}
        <Route path={`${base}/evolution/evaluation`}>
          <WithShell><PEREvaluationConsole /></WithShell>
        </Route>
        <Route path={`${base}/evolution/governance`}>
          <WithShell><PERGovernanceConsole /></WithShell>
        </Route>
        <Route path={`${base}/evolution/diagnostics`}>
          <WithShell><PERDiagnostics /></WithShell>
        </Route>
        <Route path={`${base}/evolution`}>
          <WithShell><PERRuntimeOverview /></WithShell>
        </Route>

        {/* Governance extras */}
        <Route path={`${base}/governed-cockpit`}>
          <WithShell><GovernedCockpit /></WithShell>
        </Route>
        <Route path={`${base}/eval-forge`}>
          <WithShell><EvalForge /></WithShell>
        </Route>
        <Route path={`${base}/open-eval-hub`}>
          <WithShell><OpenEvalHub /></WithShell>
        </Route>
        <Route path={`${base}/demo-launchpad`}>
          <WithShell><DemoLaunchpad /></WithShell>
        </Route>
        <Route path={`${base}/admin/enterprise-mcp`}>
          <WithShell><EnterpriseMcpAdmin /></WithShell>
        </Route>
        <Route path={`${base}/carlota/pipeline`}>
          <WithShell><CarlotaPipeline /></WithShell>
        </Route>
        <Route path={`${base}/sla`}>
          <WithShell><Sla /></WithShell>
        </Route>
        <Route path={`${base}/health`}>
          <WithShell><HealthPage /></WithShell>
        </Route>
        <Route path={`${base}/changelog`}>
          <WithShell><Changelog /></WithShell>
        </Route>
        <Route path={`${base}/team`}>
          <WithShell><Team /></WithShell>
        </Route>
        <Route path={`${base}/alloy-proof`}>
          <WithShell><AlloyProof /></WithShell>
        </Route>
        <Route path={`${base}/continuum-proof`}>
          <WithShell><ContinuumProof /></WithShell>
        </Route>
        <Route path={`${base}/automations`}>
          <WithShell><Automations /></WithShell>
        </Route>
        <Route path={`${base}/replay-lab`}>
          <WithShell><ReplayLab /></WithShell>
        </Route>
        <Route path={`${base}/eval-lab`}>
          <WithShell><EvalLab /></WithShell>
        </Route>
        <Route path={`${base}/trust-console`}>
          <WithShell><TrustConsole /></WithShell>
        </Route>
        <Route path={`${base}/retrieval/proof-chain`}>
          <WithShell><RetrievalProofChain /></WithShell>
        </Route>

        {/* Marketing pages */}
        <Route path={`${base}/marketing/pricing`}>
          <MarketingPricing />
        </Route>
        <Route path={`${base}/marketing/signup`}>
          <MarketingSignup />
        </Route>
        <Route path={`${base}/marketing/onboarding`}>
          <MarketingOnboarding />
        </Route>
        <Route path={`${base}/marketing/status`}>
          <MarketingStatus />
        </Route>
        <Route path={`${base}/marketing/leads`}>
          <MarketingLeads />
        </Route>
        <Route path={`${base}/marketing/verify-email`}>
          <MarketingVerifyEmail />
        </Route>
        <Route path={`${base}/marketing`}>
          <MarketingHome />
        </Route>

        <Route>
          <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-a11oy-navy)', color: 'var(--color-a11oy-text)' }}>
            <div className="text-center">
              <div className="text-6xl font-display font-bold mb-4" style={{ color: 'var(--color-a11oy-border)' }}>404</div>
              <div className="text-sm" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Page not found</div>
              <a href={`${base}/`} className="mt-4 inline-block text-sm" style={{ color: '#c9b787' }}>← Back to A11oy</a>
            </div>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}
