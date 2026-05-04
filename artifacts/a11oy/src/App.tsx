import { lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Route, Switch } from 'wouter';
import { GraphQLProvider } from './graphql';
import { AppShell } from './components/shell/AppShell';

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
  return <AppShell>{children}</AppShell>;
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


export default function App() {
  return (
    <GraphQLProvider>
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
    </GraphQLProvider>
  );
}
