import { DemoModeProvider } from '@lyte/lib/demo-mode';
import { PrismBusProvider } from '@szl-holdings/prism-bus';
import { AnalyticsProvider } from '@szl-holdings/shared-ui/analytics-provider';
import { AppModeBanner, AppModeProvider } from '@szl-holdings/shared-ui/app-mode-banner';
import { Toaster } from '@szl-holdings/shared-ui/ui/sonner';
import { useSessionRevocationToast } from '@szl-holdings/shared-ui/use-session-revocation-toast';
import {
  type CommandItem,
  CommandPalette,
  createBaselineWebActions,
  getEcosystemSwitchCommands,
  useCommandPalette,
} from '@szl-holdings/shared-ui/command-palette';
import { AgentCopilot } from '@szl-holdings/shared-ui/copilot';
import { commandConfig } from '@szl-holdings/shared-ui/copilot-configs';
import {
  CortexVoice,
  CortexVoiceTrigger,
  useCortexVoice,
} from '@szl-holdings/shared-ui/cortex-voice';
import {
  DemoPersonaProvider,
  DemoPersonaSwitcher,
} from '@szl-holdings/shared-ui/demo-persona-switcher';
import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import { MultiplayerSessionBanner } from '@szl-holdings/shared-ui/multiplayer-session';
import { SandboxModeProvider } from '@szl-holdings/shared-ui/sandbox-mode';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect } from 'react';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { UnifiedLayout, type WorkspaceMode } from './components/unified-layout';
import { recordPageLoad } from './pages/cognitive/shared';

const BASE = import.meta.env.BASE_URL;
const CorrelationMapPage = lazy(() =>
  import('./pages/correlation-map').then((m) => ({ default: m.CorrelationMapPage })),
);
const SignalChainsPage = lazy(() =>
  import('./pages/signal-chains').then((m) => ({ default: m.SignalChainsPage })),
);
const EnterpriseStatePage = lazy(() => import('./pages/enterprise-state'));
const Entity360Page = lazy(() =>
  import('./pages/entity-360').then((m) => ({ default: m.Entity360Page })),
);

const CrossPlatformHubPage = lazy(() =>
  import('./pages/cross-platform/index').then((m) => ({ default: m.CrossPlatformHubPage })),
);
const SignalCorrelationPage = lazy(() =>
  import('./pages/cross-platform/signal-correlation').then((m) => ({
    default: m.SignalCorrelationPage,
  })),
);
const EvidenceRegistryPage = lazy(() =>
  import('./pages/cross-platform/evidence-registry').then((m) => ({
    default: m.EvidenceRegistryPage,
  })),
);
const RunHealthPage = lazy(() =>
  import('./pages/cross-platform/run-health').then((m) => ({ default: m.RunHealthPage })),
);
const PilotIntelligencePage = lazy(() =>
  import('./pages/cross-platform/pilot-intelligence').then((m) => ({
    default: m.PilotIntelligencePage,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

if (typeof window !== 'undefined') {
  persistQueryClient({
    queryClient,
    persister: createSyncStoragePersister({
      storage: window.localStorage,
      key: 'command-rq-cache',
    }),
    maxAge: 1000 * 60 * 60,
    buster: 'v1',
  });
}

function PageLoader() {
  return (
    <div
      className="flex items-center justify-center min-h-[300px]"
      style={{ background: '#080c14' }}
    >
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(139,122,200,0.25)', borderTopColor: '#8b7ac8' }}
      />
    </div>
  );
}

const Dashboard = lazy(() => import('./pages/dashboard').then((m) => ({ default: m.Dashboard })));
const SimulationPage = lazy(() => import('./pages/simulation'));
const BriefingHistoryPage = lazy(() => import('./pages/briefing-history'));
const DomainDetailPage = lazy(() =>
  import('./pages/domain-detail').then((m) => ({ default: m.DomainDetail })),
);
const ExecutiveBriefingPage = lazy(() =>
  import('./pages/executive-briefing').then((m) => ({ default: m.ExecutiveBriefing })),
);

const MarketingHome = lazy(() =>
  import('./pages/marketing').then((m) => ({ default: m.MarketingHome })),
);
const MarketingAppPage = lazy(() =>
  import('./pages/marketing/apps/[id]').then((m) => ({ default: m.MarketingAppPage })),
);
const MarketingOpsFeaturePage = lazy(() =>
  import('./pages/marketing/ops/[slug]').then((m) => ({ default: m.MarketingOpsFeaturePage })),
);
const MarketingPricing = lazy(() =>
  import('./pages/marketing/pricing').then((m) => ({ default: m.MarketingPricing })),
);
const CommandBillingPage = lazy(() => import('./operations/pages/billing-account'));
const MarketingSignup = lazy(() =>
  import('./pages/marketing/signup').then((m) => ({ default: m.MarketingSignup })),
);
const MarketingOnboarding = lazy(() =>
  import('./pages/marketing/onboarding').then((m) => ({ default: m.MarketingOnboarding })),
);
const MarketingStatus = lazy(() =>
  import('./pages/marketing/status').then((m) => ({ default: m.MarketingStatus })),
);
const MarketingVerifyEmail = lazy(() =>
  import('./pages/marketing/verify-email').then((m) => ({ default: m.MarketingVerifyEmail })),
);
const MarketingLeads = lazy(() =>
  import('./pages/marketing/leads').then((m) => ({ default: m.LeadQualificationView })),
);

const AtlasRuntimePage = lazy(() =>
  import('./pages/atlas-runtime').then((m) => ({ default: m.AtlasRuntimePage })),
);
const WorldlineRegistryPage = lazy(() => import('./pages/worldline-registry'));
const WhatChangedPage = lazy(() => import('./operations/pages/what-changed'));
const DeploymentsPage = lazy(() => import('./operations/pages/deployments'));
const BoardModePage = lazy(() => import('@lyte/pages/board-mode'));
const DemoLivePage = lazy(() => import('@lyte/pages/demo-live'));
const DecisionReceiptsPage = lazy(() => import('@lyte/pages/decision-receipts'));
const BottleneckHeatmapPage = lazy(() => import('@lyte/pages/bottleneck-heatmap'));
const MspCommandPage = lazy(() => import('@lyte/pages/msp-command'));
const DevFeedbackPage = lazy(() => import('@lyte/pages/dev-feedback'));
const ClientValuePage = lazy(() => import('@lyte/pages/client-value'));
const OpsSavingsPage = lazy(() => import('@lyte/pages/ops-savings'));
const OutcomeLoopPage = lazy(() => import('@lyte/pages/outcome-loop'));
const DeferLanePage = lazy(() => import('@lyte/pages/defer-lane'));
const ShadowModePage = lazy(() => import('@lyte/pages/shadow-mode'));
const GpuObservatoryPage = lazy(() => import('@lyte/pages/gpu-observatory'));
const FailureTimelinePage = lazy(() => import('@lyte/pages/failure-timeline'));
const ExecutiveSummaryPage = lazy(() => import('@lyte/pages/executive-summary'));
const ExplorerPage = lazy(() => import('@lyte/pages/explorer'));
const EscalationIntelligencePage = lazy(() => import('@lyte/pages/escalation-intelligence'));
const ExecutiveCommand = lazy(() => import('@lyte/pages/executive-command'));
const LytePulse = lazy(() => import('@lyte/pages/pulse'));
const PrismDashboard = lazy(() => import('@lyte/pages/prism-dashboard'));
const BlockerBoard = lazy(() => import('@lyte/pages/blocker-board'));
const DigestCenter = lazy(() => import('@lyte/pages/digest-center'));
const TrustAudit = lazy(() => import('@lyte/pages/trust-audit'));
const AlloyActionConsole = lazy(() => import('@lyte/pages/alloy-action-console'));
const DecisionCenterPage = lazy(() => import('./pages/decision-center'));
const EvidenceExplorerPage = lazy(() => import('./pages/intelligence/evidence-explorer'));
const AlloyWorkflowCanvas = lazy(() => import('@lyte/pages/alloy-workflow-canvas'));
const AlloyIntelligence = lazy(() => import('@lyte/pages/alloy-intelligence'));
const AlloyGovernance = lazy(() => import('@lyte/pages/alloy-governance'));
const AlloyWorkflowTemplates = lazy(() => import('@lyte/pages/alloy-workflow-templates'));
const AlloyWriteBack = lazy(() => import('@lyte/pages/alloy-write-back'));
const AlloyAgentMonitor = lazy(() => import('@lyte/pages/alloy-agent-monitor'));
const AlloyExecutionTraces = lazy(() => import('@lyte/pages/alloy-execution-traces'));
const AlloyReplayTimeline = lazy(() => import('@lyte/pages/alloy-replay-timeline'));
const AlloyPolicySim = lazy(() => import('@lyte/pages/alloy-policy-sim'));
const AlloyAgentHandoffs = lazy(() => import('@lyte/pages/alloy-agent-handoffs'));
const AlloyTrustReceipts = lazy(() => import('@lyte/pages/alloy-trust-receipts'));
const AlloyIntegrationHealth = lazy(() => import('@lyte/pages/alloy-integration-health'));
const AlloyGraphCompiler = lazy(() => import('@lyte/pages/alloy-graph-compiler'));
const AlloyPolicyCompiler = lazy(() => import('@lyte/pages/alloy-policy-compiler'));
const CognitiveCommandCenter = lazy(() => import('./pages/cognitive/index'));
const CognitiveLoopPage = lazy(() => import('./pages/cognitive/loop'));
const AlloyProofPage = lazy(() =>
  import('./pages/alloy-proof').then((m) => ({ default: m.AlloyProofPage })),
);
const GovernedCockpitPage = lazy(() => import('./pages/governed-cockpit'));
const DemoLaunchpadPage = lazy(() =>
  import('./pages/demo-launchpad').then((m) => ({ default: m.DemoLaunchpad })),
);
const GlobalFabricPage = lazy(() =>
  import('./pages/operations/fabric').then((m) => ({ default: m.GlobalFabricPage })),
);
const SelfModelConsole = lazy(() => import('./pages/cognitive/self-model'));
const WorldModelExplorer = lazy(() => import('./pages/cognitive/world-model'));
const ReplayLab = lazy(() => import('./pages/replay-lab'));
const EvalLab = lazy(() => import('./pages/eval-lab'));
const RunConsole = lazy(() =>
  import('./pages/run-console').then((m) => ({ default: m.RunConsole })),
);
const EvidenceExplorer = lazy(() => import('./pages/evidence-explorer'));
const EvalStudio = lazy(() => import('./pages/eval-studio'));
const EvalForge = lazy(() => import('./pages/eval-forge'));
const TrustConsole = lazy(() => import('./pages/trust-console'));
const CognitiveMemory = lazy(() => import('./pages/cognitive/memory'));
const CognitivePlanner = lazy(() => import('./pages/cognitive/planner'));
const CognitiveVerifier = lazy(() => import('./pages/cognitive/verifier'));
const CognitiveReflection = lazy(() => import('./pages/cognitive/reflection'));
const SubstrateCommandCenter = lazy(() =>
  import('./pages/substrate').then((m) => ({ default: m.SubstrateCommandCenter })),
);
const CognitiveConsolesOverview = lazy(() => import('./pages/cognitive/overview'));
const CognitiveTraces = lazy(() => import('./pages/cognitive/traces'));
const CognitiveEvals = lazy(() => import('./pages/cognitive/evals'));
const CognitivePolicies = lazy(() => import('./pages/cognitive/policies'));
const CognitivePolicySim = lazy(() => import('./pages/cognitive/policy-sim'));
const PolicyApprovalsPage = lazy(() => import('./pages/policy-approvals'));
const GuardianApprovalsPage = lazy(() => import('./pages/guardian-approvals'));
const PolicyManagerPage = lazy(() => import('./pages/policy-manager'));
const GovernanceTiersPage = lazy(() => import('./pages/governance-tiers'));
const GuardrailConfigsPage = lazy(() => import('./pages/guardrail-configs'));
const ApprovalsCenter = lazy(() => import('@lyte/pages/approvals-center'));
const CommandInbox = lazy(() => import('@lyte/pages/command-inbox'));
const OwnershipMap = lazy(() => import('@lyte/pages/ownership-map-new'));
const EscalationCenter = lazy(() => import('@lyte/pages/escalation-center'));
const ActionQueue = lazy(() => import('@lyte/pages/action-queue'));
const OperationalQueue = lazy(() => import('@lyte/pages/operational-queue'));
const MetricsExplorer = lazy(() => import('@lyte/pages/metrics-explorer'));
const ServiceTopology = lazy(() => import('@lyte/pages/service-topology'));
const LogExplorer = lazy(() => import('@lyte/pages/log-explorer'));
const AlertManagement = lazy(() => import('@lyte/pages/alert-management'));
const LiveSignals = lazy(() => import('@lyte/pages/signals'));
const LiveRecommendations = lazy(() => import('@lyte/pages/recommendations'));
const LiveReadiness = lazy(() => import('@lyte/pages/readiness'));
const AutonomousNOC = lazy(() => import('@lyte/pages/autonomous-noc'));
const DEXScoring = lazy(() => import('@lyte/pages/dex-scoring'));
const RunbookStudio = lazy(() => import('@lyte/pages/runbook-studio'));
const KnowledgeGraph = lazy(() => import('@lyte/pages/knowledge-graph'));
const SelfHealing = lazy(() => import('@lyte/pages/self-healing'));
const SLOManagement = lazy(() => import('@lyte/pages/slo-management'));
const FinOps = lazy(() => import('@lyte/pages/finops'));
const DistributedTracing = lazy(() => import('@lyte/pages/distributed-tracing'));
const OnCallCenter = lazy(() => import('@lyte/pages/oncall-center'));
const NoiseReduction = lazy(() => import('@lyte/pages/noise-reduction'));
const CapacityPlanning = lazy(() => import('@lyte/pages/capacity-planning'));
const ChangeManagement = lazy(() => import('@lyte/pages/change-management'));
const SyntheticMonitoring = lazy(() => import('@lyte/pages/synthetic-monitoring'));
const RevenueImpact = lazy(() => import('@lyte/pages/revenue-impact'));
const BusinessSignalsIntelligence = lazy(() => import('@lyte/pages/business-signals-intelligence'));
const LytePredictiveIntelligence = lazy(() => import('@lyte/pages/predictive-intelligence'));
const LivingTopology = lazy(() => import('@lyte/pages/living-topology'));
const GovernedDecisionLoop = lazy(() => import('@lyte/pages/governed-decision-loop'));
const CognitiveRuntime = lazy(() => import('@lyte/pages/cognitive-runtime'));
const AIQualityDashboard = lazy(() => import('@lyte/pages/ai-quality-dashboard'));
const CompetitiveAtlasPage = lazy(() =>
  import('./pages/competitive-atlas').then((m) => ({ default: m.CompetitiveAtlasPage })),
);

const PrismAtlasExecute = lazy(() => import('./operations/pages/atlas-execute'));
const ImperiumAtlasExecute = lazy(() => import('./infrastructure/pages/atlas-execute'));
const DataFabric = lazy(() => import('./infrastructure/pages/data-fabric'));

const LegatusConsole = lazy(() => import('@imp/pages/legatus-console'));
const ImperiumMap = lazy(() => import('@imp/pages/imperium-map'));
const PraetorianGuard = lazy(() => import('@imp/pages/praetorian-guard'));
const SenateChamber = lazy(() => import('@imp/pages/senate-chamber'));
const SupplyLines = lazy(() => import('@imp/pages/supply-lines'));
const CenturionAI = lazy(() => import('@imp/pages/centurion-ai'));
const IntelligenceBriefing = lazy(() => import('@imp/pages/intelligence-briefing'));
const GeospatialIntelligence = lazy(() => import('@imp/pages/geospatial'));
const DirectiveCascade = lazy(() => import('@imp/pages/directive-cascade'));
const Coalition = lazy(() => import('@imp/pages/coalition'));
const StrategicReserves = lazy(() => import('@imp/pages/strategic-reserves'));

const AdminOpsConsole = lazy(() => import('./operations/pages/admin/ops-console'));
const AdminOverview = lazy(() => import('./operations/pages/admin/overview'));
const AdminUsers = lazy(() => import('./operations/pages/admin/users'));
const AdminFlags = lazy(() => import('./operations/pages/admin/feature-flags'));
const AdminApps = lazy(() => import('./operations/pages/admin/apps-registry'));
const AdminRuns = lazy(() => import('./operations/pages/admin/run-viewer'));
const AdminApprovals = lazy(() => import('./operations/pages/admin/approval-queue'));
const AdminAudit = lazy(() => import('./operations/pages/admin/audit-log'));
const AdminExports = lazy(() => import('./operations/pages/admin/export-history'));
const AdminSeeder = lazy(() => import('./operations/pages/admin/seeder'));
const AdminJobs = lazy(() => import('./operations/pages/admin/jobs'));

function getMode(location: string): WorkspaceMode {
  if (location.startsWith('/operations') || location.startsWith('/cognitive')) return 'operations';
  if (location.startsWith('/infrastructure')) return 'infrastructure';
  return 'strategy';
}

function isSubstrateRoute(location: string): boolean {
  return location.startsWith('/substrate');
}

const _OPS_ROUTES = [
  '/alerts',
  '/team',
  '/costs',
  '/changelog',
  '/sla',
  '/governance',
  '/health',
  '/digest',
];

const COMMAND_NAV_ROUTES: Array<{ href: string; label: string; group: string }> = [
  { href: '/substrate', label: 'Substrate Command Center', group: 'Substrate' },
  { href: '/substrate/approvals', label: 'Substrate — Approval Queue', group: 'Substrate' },
  {
    href: '/substrate/counterfactual',
    label: 'Substrate — Counterfactual Diff',
    group: 'Substrate',
  },
  { href: '/strategy', label: 'Strategy Dashboard', group: 'Strategy' },
  { href: '/strategy/executive-briefing', label: 'Executive Briefing', group: 'Strategy' },
  { href: '/strategy/simulation', label: 'Simulation', group: 'Strategy' },
  { href: '/strategy/briefing', label: 'Briefing History', group: 'Strategy' },
  { href: '/strategy/correlation-map', label: 'Correlation Map', group: 'Strategy' },
  { href: '/strategy/signal-chains', label: 'Signal Chains', group: 'Strategy' },
  { href: '/strategy/enterprise-state', label: 'Enterprise State', group: 'Strategy' },
  { href: '/strategy/atlas-runtime', label: 'Atlas Runtime', group: 'Strategy' },
  { href: '/strategy/worldline-registry', label: 'Worldline Registry', group: 'Strategy' },
  { href: '/strategy/cross-platform/hub', label: 'Cross-Platform Hub', group: 'Strategy' },
  { href: '/strategy/cross-platform', label: 'Signal Correlation', group: 'Strategy' },
  { href: '/strategy/cross-platform/evidence', label: 'Evidence Registry', group: 'Strategy' },
  { href: '/strategy/cross-platform/run-health', label: 'Run Health', group: 'Strategy' },
  { href: '/strategy/cross-platform/pilots', label: 'Pilot Intelligence', group: 'Strategy' },
  { href: '/strategy/competitive-atlas', label: 'Competitive Atlas', group: 'Strategy' },
  { href: '/decisions', label: 'Decision Center', group: 'Strategy' },
  { href: '/intelligence/evidence', label: 'Evidence Explorer', group: 'Strategy' },
  { href: '/operations', label: 'Executive Command', group: 'Operations' },
  { href: '/operations/pulse', label: 'LUMINA', group: 'Operations' },
  { href: '/operations/prism', label: 'PRISM Dashboard', group: 'Operations' },
  { href: '/operations/prism/signals', label: 'Signals Feed', group: 'Operations' },
  { href: '/operations/prism/motion', label: 'Motion / Action Queue', group: 'Operations' },
  { href: '/operations/blocker-board', label: 'Blocker Board', group: 'Operations' },
  { href: '/operations/what-changed', label: 'What Changed', group: 'Operations' },
  { href: '/operations/deployments', label: 'Deployments', group: 'Operations' },
  { href: '/operations/digest', label: 'Digest Center', group: 'Operations' },
  { href: '/operations/trust-audit', label: 'Trust & Audit', group: 'Operations' },
  { href: '/operations/approvals', label: 'Approvals Center', group: 'Operations' },
  { href: '/operations/policy-approvals', label: 'Policy Approvals', group: 'Operations' },
  { href: '/operations/guardian/approvals', label: 'Guardian Console', group: 'Operations' },
  { href: '/operations/policy-manager', label: 'Policy Manager', group: 'Operations' },
  { href: '/operations/governance-tiers', label: 'Governance Tiers', group: 'Operations' },
  { href: '/operations/guardrail-configs', label: 'Guardrail Configs', group: 'Operations' },
  { href: '/operations/inbox', label: 'Command Inbox', group: 'Operations' },
  { href: '/operations/ownership', label: 'Ownership Map', group: 'Operations' },
  { href: '/operations/escalation', label: 'Escalation Center', group: 'Operations' },
  { href: '/operations/queue', label: 'Operational Queue', group: 'Operations' },
  { href: '/operations/action-queue', label: 'Action Queue', group: 'Operations' },
  { href: '/operations/signals', label: 'Live Signals', group: 'Operations' },
  { href: '/operations/alerts', label: 'Alert Management', group: 'Operations' },
  { href: '/operations/recommendations', label: 'Recommendations', group: 'Operations' },
  { href: '/operations/readiness', label: 'Readiness', group: 'Operations' },
  { href: '/operations/metrics', label: 'Metrics Explorer', group: 'Operations' },
  { href: '/operations/topology', label: 'Service Topology', group: 'Operations' },
  { href: '/operations/logs', label: 'Log Explorer', group: 'Operations' },
  { href: '/operations/autonomous-noc', label: 'Autonomous NOC', group: 'Operations' },
  { href: '/operations/dex', label: 'DEX Scoring', group: 'Operations' },
  { href: '/operations/runbook-studio', label: 'Runbook Studio', group: 'Operations' },
  { href: '/operations/knowledge-graph', label: 'Knowledge Graph', group: 'Operations' },
  { href: '/operations/self-healing', label: 'Self-Healing', group: 'Operations' },
  { href: '/operations/slo', label: 'SLO Management', group: 'Operations' },
  { href: '/operations/finops', label: 'FinOps', group: 'Operations' },
  { href: '/operations/tracing', label: 'Distributed Tracing', group: 'Operations' },
  { href: '/operations/on-call', label: 'On-Call Center', group: 'Operations' },
  { href: '/operations/noise-reduction', label: 'Noise Reduction', group: 'Operations' },
  { href: '/operations/capacity-planning', label: 'Capacity Planning', group: 'Operations' },
  { href: '/operations/change-management', label: 'Change Management', group: 'Operations' },
  { href: '/operations/synthetic', label: 'Synthetic Monitoring', group: 'Operations' },
  { href: '/operations/revenue-impact', label: 'Revenue Impact', group: 'Operations' },
  { href: '/operations/business-signals', label: 'Business Signals', group: 'Operations' },
  {
    href: '/operations/predictive-intelligence',
    label: 'Predictive Intelligence',
    group: 'Operations',
  },
  { href: '/operations/living-topology', label: 'Living Topology', group: 'Operations' },
  {
    href: '/operations/governed-decision-loop',
    label: 'Governed Decision Loop',
    group: 'Operations',
  },
  { href: '/operations/cognitive-runtime', label: 'Cognitive Runtime', group: 'Operations' },
  { href: '/operations/ai-ops', label: 'AI Quality Dashboard', group: 'Operations' },
  { href: '/operations/fabric', label: 'Global Fabric', group: 'Operations' },
  { href: '/operations/alloy/canvas', label: 'Alloy Workflow Canvas', group: 'FORGE' },
  { href: '/operations/alloy/actions', label: 'Alloy Action Console', group: 'FORGE' },
  { href: '/operations/alloy/templates', label: 'Alloy Templates', group: 'FORGE' },
  { href: '/operations/alloy/intelligence', label: 'Alloy Intelligence', group: 'FORGE' },
  { href: '/operations/alloy/governance', label: 'Alloy Governance', group: 'FORGE' },
  { href: '/operations/alloy/agents', label: 'Alloy Agent Monitor', group: 'FORGE' },
  { href: '/operations/alloy/traces', label: 'Alloy Execution Traces', group: 'FORGE' },
  { href: '/operations/alloy/replay', label: 'Alloy Replay Timeline', group: 'FORGE' },
  { href: '/operations/alloy/simulate', label: 'Alloy Policy Sim', group: 'FORGE' },
  { href: '/operations/alloy/handoffs', label: 'Alloy Agent Handoffs', group: 'FORGE' },
  { href: '/operations/alloy/receipts', label: 'Alloy Trust Receipts', group: 'FORGE' },
  { href: '/operations/alloy/integrations', label: 'Alloy Integration Health', group: 'FORGE' },
  { href: '/operations/alloy/compiler', label: 'Alloy Graph Compiler', group: 'FORGE' },
  { href: '/operations/alloy/policy-compiler', label: 'Alloy Policy Compiler', group: 'FORGE' },
  { href: '/operations/alloy/proof', label: 'Alloy Proof', group: 'FORGE' },
  { href: '/operations/runs', label: 'Run Console', group: 'Operations' },
  { href: '/operations/evidence-explorer', label: 'Evidence Explorer', group: 'Operations' },
  { href: '/operations/eval-studio', label: 'Eval Studio', group: 'Operations' },
  { href: '/eval-forge', label: 'Eval Forge', group: 'Operations' },
  { href: '/governed-cockpit', label: 'Governed Cockpit', group: 'Operations' },
  { href: '/demo', label: 'Demo Launchpad', group: 'Operations' },
  { href: '/cognitive', label: 'Cognitive Command Center', group: 'Cognitive' },
  { href: '/cognitive/loop', label: 'Live Cognitive Loop', group: 'Cognitive' },
  { href: '/cognitive/self-model', label: 'Self-Model Console', group: 'Cognitive' },
  { href: '/cognitive/world-model', label: 'World-Model Explorer', group: 'Cognitive' },
  { href: '/cognitive/memory', label: 'Memory', group: 'Cognitive' },
  { href: '/cognitive/planner', label: 'Planner', group: 'Cognitive' },
  { href: '/cognitive/verifier', label: 'Verifier', group: 'Cognitive' },
  { href: '/cognitive/reflection', label: 'Reflection', group: 'Cognitive' },
  { href: '/cognitive/overview', label: 'Cognitive Consoles Overview', group: 'Cognitive' },
  { href: '/cognitive/traces', label: 'Traces', group: 'Cognitive' },
  { href: '/cognitive/evals', label: 'Evals', group: 'Cognitive' },
  { href: '/cognitive/policies', label: 'Policies', group: 'Cognitive' },
  { href: '/cognitive/policy-sim', label: 'Policy Simulation', group: 'Cognitive' },
  { href: '/infrastructure', label: 'Legatus Console', group: 'Infrastructure' },
  { href: '/infrastructure/imperium-map', label: 'Imperium Map', group: 'Infrastructure' },
  { href: '/infrastructure/praetorian', label: 'Praetorian Guard', group: 'Infrastructure' },
  { href: '/infrastructure/senate', label: 'Senate Chamber', group: 'Infrastructure' },
  { href: '/infrastructure/supply-lines', label: 'Supply Lines', group: 'Infrastructure' },
  { href: '/infrastructure/centurion', label: 'Centurion AI', group: 'Infrastructure' },
  { href: '/infrastructure/intelligence', label: 'Intelligence Briefing', group: 'Infrastructure' },
  { href: '/infrastructure/geospatial', label: 'Geospatial Intelligence', group: 'Infrastructure' },
  { href: '/infrastructure/directives', label: 'Directive Cascade', group: 'Infrastructure' },
  { href: '/infrastructure/coalition', label: 'Coalition', group: 'Infrastructure' },
  { href: '/infrastructure/reserves', label: 'Strategic Reserves', group: 'Infrastructure' },
  { href: '/infrastructure/data-fabric', label: 'Data Fabric', group: 'Infrastructure' },
];

function AppShell() {
  const [location, navigate] = useLocation();
  const { open: cortexOpen, setOpen: setCortexOpen } = useCortexVoice();
  const isMarketing = location.startsWith('/marketing');

  const mode = getMode(location);

  const paletteCommands: CommandItem[] = [
    ...createBaselineWebActions(navigate),
    ...getEcosystemSwitchCommands('command'),
    ...COMMAND_NAV_ROUTES.map((r) => ({
      id: `nav-${r.href}`,
      label: r.label,
      group: r.group,
      action: () => navigate(r.href),
    })),
  ];
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette(paletteCommands);

  useEffect(() => {
    const start = performance.now();
    const raf = requestAnimationFrame(() => {
      recordPageLoad(location, performance.now() - start);
    });
    return () => cancelAnimationFrame(raf);
  }, [location]);

  if (isSubstrateRoute(location)) {
    return (
      <Suspense fallback={<PageLoader />}>
        <SubstrateCommandCenter />
      </Suspense>
    );
  }

  if (isMarketing) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/marketing" component={() => <MarketingHome />} />
          <Route path="/marketing/apps/:id" component={() => <MarketingAppPage />} />
          <Route path="/marketing/ops/:slug" component={() => <MarketingOpsFeaturePage />} />
          <Route path="/marketing/pricing" component={() => <MarketingPricing />} />
          <Route path="/account/billing" component={() => <CommandBillingPage />} />
          <Route path="/marketing/signup" component={() => <MarketingSignup />} />
          <Route path="/marketing/onboarding" component={() => <MarketingOnboarding />} />
          <Route path="/marketing/status" component={() => <MarketingStatus />} />
          <Route path="/marketing/verify-email" component={() => <MarketingVerifyEmail />} />
          <Route path="/marketing/leads" component={() => <MarketingLeads />} />
        </Switch>
      </Suspense>
    );
  }

  const accent = mode === 'strategy' ? '#8b7ac8' : mode === 'operations' ? '#d4a054' : '#c9a227';

  return (
    <>
      <MultiplayerSessionBanner
        sessionId="cmd-unified"
        currentUserName="You"
        accentColor={accent}
      />
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={accent} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={paletteCommands}
        appName="Command"
        accentColor={accent}
        placeholder="Search Command — pages, ops, infrastructure..."
      />
      <CortexVoice
        open={cortexOpen}
        onClose={() => setCortexOpen(false)}
        accentColor={accent}
        appName="Command"
      />
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9990 }}>
        <CortexVoiceTrigger accentColor={accent} onClick={() => setCortexOpen(true)} />
      </div>

      <div style={{ height: 'calc(100vh - 40px)', overflow: 'hidden' }}>
        <UnifiedLayout
          mode={mode}
          onModeChange={(m) => {
            if (m === 'strategy') navigate('/strategy');
            else if (m === 'operations') navigate('/operations');
            else navigate('/infrastructure');
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/">
                <Redirect to="/strategy" />
              </Route>

              <Route path="/strategy" component={() => <Dashboard />} />
              <Route path="/strategy/domain/:id" component={() => <DomainDetailPage />} />
              <Route
                path="/strategy/executive-briefing"
                component={() => <ExecutiveBriefingPage />}
              />
              <Route path="/strategy/simulation" component={() => <SimulationPage />} />
              <Route path="/decisions" component={() => <DecisionCenterPage />} />
              <Route path="/intelligence/evidence" component={() => <EvidenceExplorerPage />} />
              <Route
                path="/strategy/intelligence/evidence"
                component={() => <EvidenceExplorerPage />}
              />
              <Route path="/strategy/briefing" component={() => <BriefingHistoryPage />} />
              <Route path="/strategy/correlation-map" component={() => <CorrelationMapPage />} />
              <Route path="/strategy/signal-chains" component={() => <SignalChainsPage />} />
              <Route path="/strategy/enterprise-state" component={() => <EnterpriseStatePage />} />
              <Route path="/strategy/atlas-runtime" component={() => <AtlasRuntimePage />} />
              <Route path="/strategy/entity-360" component={() => <Entity360Page />} />
              <Route
                path="/strategy/worldline-registry"
                component={() => <WorldlineRegistryPage />}
              />

              <Route path="/strategy/cross-platform" component={() => <SignalCorrelationPage />} />
              <Route
                path="/strategy/cross-platform/hub"
                component={() => <CrossPlatformHubPage />}
              />
              <Route
                path="/strategy/cross-platform/evidence"
                component={() => <EvidenceRegistryPage />}
              />
              <Route
                path="/strategy/cross-platform/run-health"
                component={() => <RunHealthPage />}
              />
              <Route
                path="/strategy/cross-platform/pilots"
                component={() => <PilotIntelligencePage />}
              />

              <Route path="/cognitive" component={() => <CognitiveCommandCenter />} />
              <Route path="/cognitive/loop" component={() => <CognitiveLoopPage />} />
              <Route path="/cognitive/self-model" component={() => <SelfModelConsole />} />
              <Route path="/cognitive/world-model" component={() => <WorldModelExplorer />} />
              <Route path="/command/atlas-runtime" component={() => <AtlasRuntimePage />} />

              <Route path="/operations" component={() => <ExecutiveCommand />} />
              <Route path="/operations/pulse" component={() => <LytePulse />} />
              <Route path="/operations/prism" component={() => <PrismDashboard />} />
              <Route path="/operations/prism/pulse" component={() => <PrismDashboard />} />
              <Route path="/operations/prism/risk" component={() => <PrismDashboard />} />
              <Route path="/operations/prism/intelligence" component={() => <PrismDashboard />} />
              <Route path="/operations/prism/signals" component={() => <LiveSignals />} />
              <Route path="/operations/prism/motion" component={() => <ActionQueue />} />
              <Route
                path="/operations/prism/atlas-execute"
                component={() => <PrismAtlasExecute />}
              />
              <Route path="/operations/blocker-board" component={() => <BlockerBoard />} />
              <Route path="/operations/board-mode" component={() => <BoardModePage />} />
              <Route path="/operations/demo-live" component={() => <DemoLivePage />} />
              <Route path="/operations/decision-receipts" component={() => <DecisionReceiptsPage />} />
              <Route path="/operations/bottleneck-heatmap" component={() => <BottleneckHeatmapPage />} />
              <Route path="/operations/msp-command" component={() => <MspCommandPage />} />
              <Route path="/operations/dev-feedback" component={() => <DevFeedbackPage />} />
              <Route path="/operations/client-value" component={() => <ClientValuePage />} />
              <Route path="/operations/ops-savings" component={() => <OpsSavingsPage />} />
              <Route path="/operations/outcome-loop" component={() => <OutcomeLoopPage />} />
              <Route path="/operations/defer-lane" component={() => <DeferLanePage />} />
              <Route path="/operations/shadow-mode" component={() => <ShadowModePage />} />
              <Route path="/operations/gpu-observatory" component={() => <GpuObservatoryPage />} />
              <Route path="/operations/failure-timeline" component={() => <FailureTimelinePage />} />
              <Route path="/operations/executive-summary" component={() => <ExecutiveSummaryPage />} />
              <Route path="/operations/explorer" component={() => <ExplorerPage />} />
              <Route path="/operations/escalation-intelligence" component={() => <EscalationIntelligencePage />} />
              <Route path="/operations/what-changed" component={() => <WhatChangedPage />} />
              <Route path="/operations/deployments" component={() => <DeploymentsPage />} />
              <Route path="/lyte/what-changed" component={() => <WhatChangedPage />} />
              <Route path="/operations/digest" component={() => <DigestCenter />} />
              <Route path="/operations/trust-audit" component={() => <TrustAudit />} />
              <Route path="/operations/approvals" component={() => <ApprovalsCenter />} />
              <Route
                path="/operations/policy-approvals"
                component={() => <PolicyApprovalsPage />}
              />
              <Route
                path="/operations/guardian/approvals"
                component={() => <GuardianApprovalsPage />}
              />
              <Route path="/operations/guardian" component={() => <GuardianApprovalsPage />} />
              <Route path="/operations/policy-manager" component={() => <PolicyManagerPage />} />
              <Route
                path="/operations/governance-tiers"
                component={() => <GovernanceTiersPage />}
              />
              <Route
                path="/operations/guardrail-configs"
                component={() => <GuardrailConfigsPage />}
              />
              <Route path="/operations/inbox" component={() => <CommandInbox />} />
              <Route path="/operations/ownership" component={() => <OwnershipMap />} />
              <Route path="/operations/escalation" component={() => <EscalationCenter />} />
              <Route path="/operations/queue" component={() => <OperationalQueue />} />
              <Route path="/operations/action-queue" component={() => <ActionQueue />} />
              <Route path="/operations/signals" component={() => <LiveSignals />} />
              <Route path="/operations/alerts" component={() => <AlertManagement />} />
              <Route path="/operations/priorities" component={() => <ActionQueue />} />
              <Route path="/operations/workflows" component={() => <AlloyWorkflowCanvas />} />
              <Route path="/operations/recommendations" component={() => <LiveRecommendations />} />
              <Route path="/operations/audit" component={() => <TrustAudit />} />
              <Route path="/operations/exceptions" component={() => <EscalationCenter />} />
              <Route path="/operations/readiness" component={() => <LiveReadiness />} />
              <Route path="/operations/metrics" component={() => <MetricsExplorer />} />
              <Route path="/operations/topology" component={() => <ServiceTopology />} />
              <Route path="/operations/logs" component={() => <LogExplorer />} />
              <Route path="/operations/alert-management" component={() => <AlertManagement />} />
              <Route path="/operations/autonomous-noc" component={() => <AutonomousNOC />} />
              <Route path="/operations/dex" component={() => <DEXScoring />} />
              <Route path="/operations/runbook-studio" component={() => <RunbookStudio />} />
              <Route path="/operations/knowledge-graph" component={() => <KnowledgeGraph />} />
              <Route path="/operations/self-healing" component={() => <SelfHealing />} />
              <Route path="/operations/slo" component={() => <SLOManagement />} />
              <Route path="/operations/finops" component={() => <FinOps />} />
              <Route path="/operations/tracing" component={() => <DistributedTracing />} />
              <Route path="/operations/on-call" component={() => <OnCallCenter />} />
              <Route path="/operations/noise-reduction" component={() => <NoiseReduction />} />
              <Route path="/operations/capacity-planning" component={() => <CapacityPlanning />} />
              <Route path="/operations/change-management" component={() => <ChangeManagement />} />
              <Route path="/operations/synthetic" component={() => <SyntheticMonitoring />} />
              <Route path="/operations/revenue-impact" component={() => <RevenueImpact />} />
              <Route
                path="/operations/business-signals"
                component={() => <BusinessSignalsIntelligence />}
              />
              <Route
                path="/operations/predictive-intelligence"
                component={() => <LytePredictiveIntelligence />}
              />
              <Route path="/operations/living-topology" component={() => <LivingTopology />} />
              <Route
                path="/operations/governed-decision-loop"
                component={() => <GovernedDecisionLoop />}
              />
              <Route path="/operations/cognitive-runtime" component={() => <CognitiveRuntime />} />
              <Route path="/operations/ai-ops" component={() => <AIQualityDashboard />} />
              <Route path="/operations/fabric" component={() => <GlobalFabricPage />} />
              <Route path="/operations/alloy/canvas" component={() => <AlloyWorkflowCanvas />} />
              <Route path="/operations/alloy/actions" component={() => <AlloyActionConsole />} />
              <Route
                path="/operations/alloy/templates"
                component={() => <AlloyWorkflowTemplates />}
              />
              <Route path="/operations/alloy/gates" component={() => <AlloyWriteBack />} />
              <Route
                path="/operations/alloy/intelligence"
                component={() => <AlloyIntelligence />}
              />
              <Route path="/operations/alloy/governance" component={() => <AlloyGovernance />} />
              <Route path="/operations/alloy/agents" component={() => <AlloyAgentMonitor />} />
              <Route path="/operations/alloy/traces" component={() => <AlloyExecutionTraces />} />
              <Route path="/operations/alloy/replay" component={() => <AlloyReplayTimeline />} />
              <Route path="/operations/alloy/simulate" component={() => <AlloyPolicySim />} />
              <Route path="/operations/alloy/handoffs" component={() => <AlloyAgentHandoffs />} />
              <Route path="/operations/alloy/receipts" component={() => <AlloyTrustReceipts />} />
              <Route
                path="/operations/alloy/integrations"
                component={() => <AlloyIntegrationHealth />}
              />
              <Route path="/operations/alloy/compiler" component={() => <AlloyGraphCompiler />} />
              <Route
                path="/operations/alloy/policy-compiler"
                component={() => <AlloyPolicyCompiler />}
              />
              <Route path="/operations/alloy/replay-lab" component={() => <ReplayLab />} />
              <Route path="/operations/alloy/eval-lab" component={() => <EvalLab />} />
              <Route path="/operations/runs" component={() => <RunConsole />} />
              <Route path="/operations/evidence-explorer" component={() => <EvidenceExplorer />} />
              <Route path="/operations/eval-studio" component={() => <EvalStudio />} />
              <Route path="/eval-forge" component={() => <EvalForge />} />
              <Route path="/eval-forge/runs/:runId" component={() => <EvalForge />} />
              <Route path="/operations/alloy/trust-console" component={() => <TrustConsole />} />
              <Route path="/operations/alloy/proof" component={() => <AlloyProofPage />} />
              <Route path="/governed-cockpit" component={() => <GovernedCockpitPage />} />
              <Route path="/demo" component={() => <DemoLaunchpadPage />} />
              <Route path="/demo-launchpad" component={() => <DemoLaunchpadPage />} />
              <Route path="/competitive-atlas" component={() => <CompetitiveAtlasPage />} />
              <Route
                path="/strategy/competitive-atlas"
                component={() => <CompetitiveAtlasPage />}
              />

              <Route path="/cognitive/memory" component={() => <CognitiveMemory />} />
              <Route path="/cognitive/planner" component={() => <CognitivePlanner />} />
              <Route path="/cognitive/verifier" component={() => <CognitiveVerifier />} />
              <Route path="/cognitive/reflection" component={() => <CognitiveReflection />} />
              <Route path="/cognitive/overview" component={() => <CognitiveConsolesOverview />} />
              <Route path="/cognitive/traces" component={() => <CognitiveTraces />} />
              <Route path="/cognitive/evals" component={() => <CognitiveEvals />} />
              <Route path="/cognitive/policies" component={() => <CognitivePolicies />} />
              <Route path="/cognitive/policy-sim" component={() => <CognitivePolicySim />} />

              <Route path="/infrastructure" component={() => <LegatusConsole />} />
              <Route path="/infrastructure/legatus" component={() => <LegatusConsole />} />
              <Route path="/infrastructure/imperium-map" component={() => <ImperiumMap />} />
              <Route path="/infrastructure/praetorian" component={() => <PraetorianGuard />} />
              <Route path="/infrastructure/senate" component={() => <SenateChamber />} />
              <Route path="/infrastructure/supply-lines" component={() => <SupplyLines />} />
              <Route path="/infrastructure/centurion" component={() => <CenturionAI />} />
              <Route
                path="/infrastructure/intelligence"
                component={() => <IntelligenceBriefing />}
              />
              <Route
                path="/infrastructure/geospatial"
                component={() => <GeospatialIntelligence />}
              />
              <Route path="/infrastructure/directives" component={() => <DirectiveCascade />} />
              <Route path="/infrastructure/coalition" component={() => <Coalition />} />
              <Route path="/infrastructure/reserves" component={() => <StrategicReserves />} />
              <Route path="/infrastructure/data-fabric" component={() => <DataFabric />} />
              <Route
                path="/infrastructure/imperium/atlas-execute"
                component={() => <ImperiumAtlasExecute />}
              />

              <Route path="/operations/admin/ops" component={() => <AdminOpsConsole />} />
              <Route path="/operations/admin/overview" component={() => <AdminOverview />} />
              <Route path="/operations/admin/users" component={() => <AdminUsers />} />
              <Route path="/operations/admin/flags" component={() => <AdminFlags />} />
              <Route path="/operations/admin/apps" component={() => <AdminApps />} />
              <Route path="/operations/admin/runs" component={() => <AdminRuns />} />
              <Route path="/operations/admin/approvals" component={() => <AdminApprovals />} />
              <Route path="/operations/admin/audit" component={() => <AdminAudit />} />
              <Route path="/operations/admin/exports" component={() => <AdminExports />} />
              <Route path="/operations/admin/seeder" component={() => <AdminSeeder />} />
              <Route path="/operations/admin/jobs" component={() => <AdminJobs />} />

              <Route>
                <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
                  Page not found
                </div>
              </Route>
            </Switch>
          </Suspense>
        </UnifiedLayout>
      </div>

      <AgentCopilot config={commandConfig} />
    </>
  );
}

function App() {
  useSessionRevocationToast();
  return (
    <AppModeProvider>
      <AppModeBanner />
      <Toaster position="bottom-right" theme="dark" />
      <AnalyticsProvider appName="command">
        <PrismBusProvider domain="lyte">
          <SandboxModeProvider>
            <DemoModeProvider>
              <DemoPersonaProvider>
                <QueryClientProvider client={queryClient}>
                  <WouterRouter base={BASE.replace(/\/$/, '')}>
                    <AppShell />
                  </WouterRouter>
                </QueryClientProvider>
                <DemoPersonaSwitcher />
              </DemoPersonaProvider>
            </DemoModeProvider>
          </SandboxModeProvider>
        </PrismBusProvider>
      </AnalyticsProvider>
    </AppModeProvider>
  );
}

export default App;
