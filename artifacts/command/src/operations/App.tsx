import { CommandLayout } from '@lyte/components/lyte-layout';
import { DemoModeProvider } from '@lyte/lib/demo-mode';
import { McpOverlay } from '@szl-holdings/mcp-client';
import {
  clearUser as clearSentryUser,
  identifyAnalyticsUser,
  resetAnalyticsUser,
  setUser as setSentryUser,
} from '@szl-holdings/observability/react';
import { PrismBusProvider } from '@szl-holdings/prism-bus';
import { Toaster } from '@szl-holdings/shared-ui/ui/sonner';
import { useSessionRevocationToast } from '@szl-holdings/shared-ui/use-session-revocation-toast';
import { useAuth } from '@szl-holdings/replit-auth-web';
import { AnalyticsProvider } from '@szl-holdings/shared-ui/analytics-provider';
import {
  type CommandItem,
  CommandPalette,
  createBaselineWebActions,
  getEcosystemSwitchCommands,
  useCommandPalette,
} from '@szl-holdings/shared-ui/command-palette';
import { CookieBanner } from '@szl-holdings/shared-ui/cookie-banner';
import { AgentCopilot } from '@szl-holdings/shared-ui/copilot';
import { beaconConfig } from '@szl-holdings/shared-ui/copilot-configs';
import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import {
  type KeyboardShortcut,
  PowerUserProvider,
} from '@szl-holdings/shared-ui/keyboard-shortcuts';
import { LANE_ACCENT_HEX } from '@szl-holdings/shared-ui/lane-colors';
import { SandboxModeBanner, SandboxModeProvider } from '@szl-holdings/shared-ui/sandbox-mode';
import { StaleIndicator } from '@szl-holdings/shared-ui/stale-indicator';
import { StatusBanner } from '@szl-holdings/shared-ui/status-banner';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import React, { lazy, Suspense, useEffect } from 'react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const COMMAND_ACCENT = LANE_ACCENT_HEX.lyte.primary;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

if (typeof window !== 'undefined') {
  persistQueryClient({
    queryClient,
    persister: createSyncStoragePersister({
      storage: window.localStorage,
      key: 'lyte-web-rq-cache',
    }),
    maxAge: 1000 * 60 * 60,
    buster: 'v1',
  });
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(212,160,84,0.25)', borderTopColor: COMMAND_ACCENT }}
      />
    </div>
  );
}

const CommandPulse = lazy(() => import('@/pages/pulse'));
const CommandAtlasArtifactsPage = lazy(() => import('@/pages/atlas-artifacts'));
const ExecutiveCommand = lazy(() => import('@/pages/executive-command'));
const BlockerBoard = lazy(() => import('@/pages/blocker-board'));
const DigestCenter = lazy(() => import('@/pages/digest-center'));
const TrustAudit = lazy(() => import('@/pages/trust-audit'));
const ProofChainAudit = lazy(() => import('@/pages/proof-chain-audit'));
const AlloyActionConsole = lazy(() => import('@/pages/alloy-action-console'));
const AlloyWorkflowTemplates = lazy(() => import('@/pages/alloy-workflow-templates'));
const AlloyWriteBack = lazy(() => import('@/pages/alloy-write-back'));
const CommandInbox = lazy(() => import('@/pages/command-inbox'));
const ApprovalsCenter = lazy(() => import('@/pages/approvals-center'));
const OwnershipMap = lazy(() => import('@/pages/ownership-map-new'));
const EscalationCenter = lazy(() => import('@/pages/escalation-center'));
const InterventionWorkspace = lazy(() => import('@/pages/intervention-workspace'));
const ActionQueue = lazy(() => import('@/pages/action-queue'));
const ReadinessModule = lazy(() => import('@/pages/readiness-module'));
const AdminJobsPage = lazy(() => import('@/pages/admin/jobs'));
const AdminUsersPage = lazy(() => import('@/pages/admin/users'));
const AdminFlagsPage = lazy(() => import('@/pages/admin/feature-flags'));
const AdminAuditPage = lazy(() => import('@/pages/admin/audit-log'));
const AdminOverviewPage = lazy(() => import('@/pages/admin/overview'));
const AdminRunViewerPage = lazy(() => import('@/pages/admin/run-viewer'));
const AdminApprovalQueuePage = lazy(() => import('@/pages/admin/approval-queue'));
const AdminSeederPage = lazy(() => import('@/pages/admin/seeder'));
const AdminExportHistoryPage = lazy(() => import('@/pages/admin/export-history'));
const AdminDiagnosticsPage = lazy(() => import('@/pages/admin/diagnostics'));
const AdminBillingPage = lazy(() => import('@/pages/admin/billing-admin'));
const AdminOpsConsolePage = lazy(() => import('@/pages/admin/ops-console'));
const AdminIntegrationManagerPage = lazy(() => import('@/pages/admin/integration-manager'));
const AdminAppsRegistryPage = lazy(() => import('@/pages/admin/apps-registry'));
const AdminKbArticlesPage = lazy(() => import('@/pages/admin/kb-articles'));
const OperationalQueue = lazy(() => import('@/pages/operational-queue'));
const _SignalsPage = lazy(() => import('@/pages/signals-page'));
const ActionsPage = lazy(() => import('@/pages/actions-page'));
const _ReadinessPage = lazy(() => import('@/pages/readiness-page'));
const CommandMarketingLanding = lazy(() => import('@/pages/marketing-landing'));
const PrismDashboard = lazy(() => import('@/pages/prism-dashboard'));
const MetricsExplorer = lazy(() => import('@/pages/metrics-explorer'));

const ServiceTopology = lazy(() => import('@/pages/service-topology'));
const ErrorBudgetBurn = lazy(() => import('@/pages/error-budget-burn'));
const LogExplorer = lazy(() => import('@/pages/log-explorer'));
const AlertManagement = lazy(() => import('@/pages/alert-management'));
const ExecutiveSummary = lazy(() => import('@/pages/executive-summary'));
const AlloyWorkflowCanvas = lazy(() => import('@/pages/alloy-workflow-canvas'));
const AlloyIntelligence = lazy(() => import('@/pages/alloy-intelligence'));
const AlloyAgentMonitor = lazy(() => import('@/pages/alloy-agent-monitor'));
const AlloyExecutionTraces = lazy(() => import('@/pages/alloy-execution-traces'));
const AlloyGovernance = lazy(() => import('@/pages/alloy-governance'));
const AlloyIntegrationHealth = lazy(() => import('@/pages/alloy-integration-health'));
const AlloyGraphCompiler = lazy(() => import('@/pages/alloy-graph-compiler'));
const AlloyReplayTimeline = lazy(() => import('@/pages/alloy-replay-timeline'));
const AlloyPolicySim = lazy(() => import('@/pages/alloy-policy-sim'));
const AlloyAgentHandoffs = lazy(() => import('@/pages/alloy-agent-handoffs'));
const AlloyTrustReceipts = lazy(() => import('@/pages/alloy-trust-receipts'));
const EscalationWorkflow = lazy(() => import('@/pages/escalation-workflow'));
const _CommandInboxLegacy = lazy(() => import('@/pages/action-queue'));
const PowerBiReport = lazy(() => import('@/pages/powerbi-report'));
const DashboardBuilder = lazy(() => import('@/pages/dashboard-builder'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const ApmInstrumentation = lazy(() => import('@/pages/apm-instrumentation'));
const PricingPage = lazy(() => import('@/pages/pricing'));
const DemoDashboard = lazy(() => import('@/pages/demo-dashboard'));
const DemoSignals = lazy(() => import('@/pages/demo-signals'));
const DemoPriorities = lazy(() => import('@/pages/demo-priorities'));
const DemoWorkflows = lazy(() => import('@/pages/demo-workflows'));
const DemoRecommendations = lazy(() => import('@/pages/demo-recommendations'));
const DemoAudit = lazy(() => import('@/pages/demo-audit'));
const DemoExceptions = lazy(() => import('@/pages/demo-exceptions'));
const DemoReadiness = lazy(() => import('@/pages/demo-readiness'));
const DemoIntegrations = lazy(() => import('@/pages/demo-integrations'));
const DemoReports = lazy(() => import('@/pages/demo-reports'));
const DemoSettings = lazy(() => import('@/pages/demo-settings'));
const DemoAlerts = lazy(() => import('@/pages/demo-alerts'));
const DemoLive = lazy(() => import('@/pages/demo-live'));
const BottleneckHeatmap = lazy(() => import('@/pages/bottleneck-heatmap'));
const BoardMode = lazy(() => import('@/pages/board-mode'));
const DecisionReceipts = lazy(() => import('@/pages/decision-receipts'));
const OutcomeLoop = lazy(() => import('@/pages/outcome-loop'));
const DeferLane = lazy(() => import('@/pages/defer-lane'));
const ShadowMode = lazy(() => import('@/pages/shadow-mode'));
const GovernedDecisionLoop = lazy(() => import('@/pages/governed-decision-loop'));
const DecisionEventLog = lazy(() => import('@/pages/developer/DecisionEventLog'));

// ─── Living Intelligence Platform (new) ──────────────────────────────────────
const LivingTopology = lazy(() => import('@/pages/living-topology'));
const GpuComputeObservatory = lazy(() => import('@/pages/gpu-compute-observatory'));
const BusinessSignalsIntelligence = lazy(() => import('@/pages/business-signals-intelligence'));
const CommandPredictiveIntelligence = lazy(() => import('@/pages/predictive-intelligence'));

// ─── Self-Healing Ops & Revenue Attribution (new) ─────────────────────────────
const RevenueImpact = lazy(() => import('@/pages/revenue-impact'));
const SelfHealing = lazy(() => import('@/pages/self-healing'));
const FailureTimeline = lazy(() => import('@/pages/failure-timeline'));
const ClientValue = lazy(() => import('@/pages/client-value'));
const OpsSavings = lazy(() => import('@/pages/ops-savings'));
const EscalationIntelligence = lazy(() => import('@/pages/escalation-intelligence'));

const AIQualityDashboard = lazy(() => import('@/pages/ai-quality-dashboard'));

// ─── Autonomous NOC & AIOps 2.0 ───────────────────────────────────────────────
const AutonomousNOC = lazy(() => import('@/pages/autonomous-noc'));
const DEXScoring = lazy(() => import('@/pages/dex-scoring'));
const MSPCommand = lazy(() => import('@/pages/msp-command'));
const RunbookStudio = lazy(() => import('@/pages/runbook-studio'));
const CapacityPlanning = lazy(() => import('@/pages/capacity-planning'));
const ChangeManagement = lazy(() => import('@/pages/change-management'));
const NoiseReduction = lazy(() => import('@/pages/noise-reduction'));
const SLOManagement = lazy(() => import('@/pages/slo-management'));
const FinOps = lazy(() => import('@/pages/finops'));
const DistributedTracing = lazy(() => import('@/pages/distributed-tracing'));
const OnCallCenter = lazy(() => import('@/pages/oncall-center'));
const SyntheticMonitoring = lazy(() => import('@/pages/synthetic-monitoring'));
const KnowledgeGraph = lazy(() => import('@/pages/knowledge-graph'));
const DevFeedback = lazy(() => import('@/pages/dev-feedback'));
const SelfHealingConfidence = lazy(() => import('@/pages/self-healing-confidence'));

const ADMIN_ROLES = ['admin', 'super_admin', 'ops'];

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  const userRoles: string[] = (user as { roles?: string[] })?.roles ?? [];
  const isAdmin = userRoles.some((r) => ADMIN_ROLES.includes(r));
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Shield className="w-8 h-8 text-amber-500/40" />
        <p className="text-sm text-slate-400">You do not have permission to access this page.</p>
      </div>
    );
  }
  return <Component />;
}

function PrivateRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/pulse" component={CommandPulse} />
        <Route path="/" component={ExecutiveCommand} />
        <Route path="/overview" component={Dashboard} />
        <Route path="/dashboard" component={DemoDashboard} />
        <Route path="/blocker-board" component={BlockerBoard} />
        <Route path="/digest" component={DigestCenter} />
        <Route path="/trust-audit" component={TrustAudit} />
        <Route path="/proof-chain-audit" component={ProofChainAudit} />
        <Route path="/alloy/actions" component={AlloyActionConsole} />
        <Route path="/alloy/templates" component={AlloyWorkflowTemplates} />
        <Route path="/alloy/gates" component={AlloyWriteBack} />
        <Route path="/signals" component={DemoSignals} />
        <Route path="/alerts" component={DemoAlerts} />
        <Route path="/priorities" component={DemoPriorities} />
        <Route path="/workflows" component={DemoWorkflows} />
        <Route path="/runs" component={DemoWorkflows} />
        <Route path="/recommendations" component={DemoRecommendations} />
        <Route path="/audit" component={DemoAudit} />
        <Route path="/exceptions" component={DemoExceptions} />
        <Route path="/readiness" component={DemoReadiness} />
        <Route path="/integrations" component={DemoIntegrations} />
        <Route path="/reports" component={DemoReports} />
        <Route path="/settings" component={DemoSettings} />
        <Route path="/inbox" component={CommandInbox} />
        <Route path="/actions" component={ActionsPage} />
        <Route path="/action-queue" component={ActionQueue} />
        <Route path="/queue" component={OperationalQueue} />
        <Route path="/approvals" component={ApprovalsCenter} />
        <Route path="/ownership" component={OwnershipMap} />
        <Route path="/escalation" component={EscalationCenter} />
        <Route path="/escalation-workflow" component={EscalationWorkflow} />
        <Route path="/intervention" component={InterventionWorkspace} />
        <Route path="/readiness-module" component={ReadinessModule} />
        <Route path="/prism" component={PrismDashboard} />
        <Route path="/prism/pulse" component={PrismDashboard} />
        <Route path="/prism/risk" component={PrismDashboard} />
        <Route path="/prism/intelligence" component={PrismDashboard} />
        <Route path="/prism/signals" component={DemoSignals} />
        <Route path="/prism/motion" component={ActionsPage} />
        <Route path="/explorer" component={DemoSignals} />
        <Route path="/metrics" component={MetricsExplorer} />
        <Route path="/topology" component={ServiceTopology} />
        <Route path="/error-budget" component={ErrorBudgetBurn} />
        <Route path="/logs" component={LogExplorer} />
        <Route path="/alert-management" component={AlertManagement} />
        <Route path="/executive-summary" component={ExecutiveSummary} />
        <Route path="/alloy/canvas" component={AlloyWorkflowCanvas} />
        <Route path="/alloy/runs" component={AlloyWorkflowCanvas} />
        <Route path="/alloy/intelligence" component={AlloyIntelligence} />
        <Route path="/alloy/ai" component={AlloyIntelligence} />
        <Route path="/alloy/agents" component={AlloyAgentMonitor} />
        <Route path="/alloy/traces" component={AlloyExecutionTraces} />
        <Route path="/alloy/governance" component={AlloyGovernance} />
        <Route path="/alloy/integrations" component={AlloyIntegrationHealth} />
        <Route path="/alloy/compiler" component={AlloyGraphCompiler} />
        <Route path="/alloy/replay" component={AlloyReplayTimeline} />
        <Route path="/alloy/simulate" component={AlloyPolicySim} />
        <Route path="/alloy/handoffs" component={AlloyAgentHandoffs} />
        <Route path="/alloy/receipts" component={AlloyTrustReceipts} />
        <Route path="/powerbi" component={PowerBiReport} />
        <Route path="/dashboards" component={DashboardBuilder} />
        <Route path="/apm" component={ApmInstrumentation} />
        <Route path="/admin/jobs">{() => <AdminRoute component={AdminJobsPage} />}</Route>
        <Route path="/admin/users">{() => <AdminRoute component={AdminUsersPage} />}</Route>
        <Route path="/admin/users/:id">{() => <AdminRoute component={AdminUsersPage} />}</Route>
        <Route path="/admin/flags">{() => <AdminRoute component={AdminFlagsPage} />}</Route>
        <Route path="/admin/audit">{() => <AdminRoute component={AdminAuditPage} />}</Route>
        <Route path="/admin/overview">{() => <AdminRoute component={AdminOverviewPage} />}</Route>
        <Route path="/admin/runs">{() => <AdminRoute component={AdminRunViewerPage} />}</Route>
        <Route path="/admin/approvals">
          {() => <AdminRoute component={AdminApprovalQueuePage} />}
        </Route>
        <Route path="/admin/seeder">{() => <AdminRoute component={AdminSeederPage} />}</Route>
        <Route path="/admin/exports">
          {() => <AdminRoute component={AdminExportHistoryPage} />}
        </Route>
        <Route path="/admin/diagnostics">
          {() => <AdminRoute component={AdminDiagnosticsPage} />}
        </Route>
        <Route path="/admin/billing">{() => <AdminRoute component={AdminBillingPage} />}</Route>
        <Route path="/admin/ops">{() => <AdminRoute component={AdminOpsConsolePage} />}</Route>
        <Route path="/admin/integrations">
          {() => <AdminRoute component={AdminIntegrationManagerPage} />}
        </Route>
        <Route path="/admin/apps">{() => <AdminRoute component={AdminAppsRegistryPage} />}</Route>
        <Route path="/admin/kb">{() => <AdminRoute component={AdminKbArticlesPage} />}</Route>
        <Route path="/pricing" component={PricingPage} />
        <Route path="/demo-live" component={DemoLive} />
        <Route path="/bottleneck-heatmap" component={BottleneckHeatmap} />
        <Route path="/board-mode" component={BoardMode} />
        <Route path="/decision-receipts" component={DecisionReceipts} />
        <Route path="/outcome-loop" component={OutcomeLoop} />
        <Route path="/governed-decision-loop" component={GovernedDecisionLoop} />
        <Route path="/developer/decision-events" component={DecisionEventLog} />
        <Route path="/defer-lane" component={DeferLane} />
        <Route path="/shadow-mode" component={ShadowMode} />
        <Route path="/atlas-artifacts" component={CommandAtlasArtifactsPage} />
        <Route path="/ai-ops" component={AIQualityDashboard} />
        {/* Living Intelligence Platform */}
        <Route path="/living-topology" component={LivingTopology} />
        <Route path="/gpu-observatory" component={GpuComputeObservatory} />
        <Route path="/business-signals" component={BusinessSignalsIntelligence} />
        <Route path="/predictive-intelligence" component={CommandPredictiveIntelligence} />
        {/* Self-Healing Ops & Revenue Attribution */}
        <Route path="/revenue-impact" component={RevenueImpact} />
        <Route path="/self-healing" component={SelfHealing} />
        <Route path="/failure-timeline" component={FailureTimeline} />
        <Route path="/client-value" component={ClientValue} />
        <Route path="/ops-savings" component={OpsSavings} />
        <Route path="/escalation-intelligence" component={EscalationIntelligence} />
        {/* Autonomous NOC & AIOps 2.0 */}
        <Route path="/autonomous-noc" component={AutonomousNOC} />
        <Route path="/dex" component={DEXScoring} />
        <Route path="/msp-command" component={MSPCommand} />
        <Route path="/runbook-studio" component={RunbookStudio} />
        <Route path="/capacity-planning" component={CapacityPlanning} />
        <Route path="/change-management" component={ChangeManagement} />
        <Route path="/noise-reduction" component={NoiseReduction} />
        <Route path="/knowledge-graph" component={KnowledgeGraph} />
        <Route path="/dev-feedback" component={DevFeedback} />
        <Route path="/self-healing-confidence" component={SelfHealingConfidence} />
        {/* Best-in-class AIOps & Observability */}
        <Route path="/slo" component={SLOManagement} />
        <Route path="/finops" component={FinOps} />
        <Route path="/tracing" component={DistributedTracing} />
        <Route path="/on-call" component={OnCallCenter} />
        <Route path="/synthetic" component={SyntheticMonitoring} />
        <Route>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
            Page not found
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const lyteCommands: CommandItem[] = [
  {
    id: 'nav-exec',
    label: 'Executive Command',
    icon: '⚡',
    group: 'Executive',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/');
    },
  },
  {
    id: 'nav-blockers',
    label: 'Blocker Board',
    icon: '🚫',
    group: 'Executive',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/blocker-board');
    },
  },
  {
    id: 'nav-digest',
    label: 'Digest Center',
    icon: '📄',
    group: 'Executive',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/digest');
    },
  },
  {
    id: 'nav-approvals',
    label: 'Approvals',
    icon: '✅',
    group: 'Executive',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/approvals');
    },
  },
  {
    id: 'nav-trust',
    label: 'Trust & Audit',
    icon: '🛡️',
    group: 'Executive',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/trust-audit');
    },
  },
  {
    id: 'nav-inbox',
    label: 'Command Inbox',
    icon: '📥',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/inbox');
    },
  },
  {
    id: 'nav-signals',
    label: 'Signals Feed',
    icon: '📡',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/signals');
    },
  },
  {
    id: 'nav-ownership',
    label: 'Ownership Map',
    icon: '👥',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/ownership');
    },
  },
  {
    id: 'nav-alloy-actions',
    label: 'Counsel Action Queue',
    icon: '⚙️',
    group: 'Counsel',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/alloy/actions');
    },
  },
  {
    id: 'nav-alloy-templates',
    label: 'Counsel Workflow Templates',
    icon: '🔄',
    group: 'Counsel',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/alloy/templates');
    },
  },
  {
    id: 'nav-alloy-gates',
    label: 'Write-Back Gates',
    icon: '🔒',
    group: 'Counsel',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/alloy/gates');
    },
  },
  {
    id: 'nav-alloy-compiler',
    label: 'Action Graph Compiler',
    icon: '🗂️',
    group: 'Counsel',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/alloy/compiler');
    },
  },
  {
    id: 'nav-alloy-replay',
    label: 'Execution Replay Timeline',
    icon: '▶️',
    group: 'Counsel',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/alloy/replay');
    },
  },
  {
    id: 'nav-alloy-simulate',
    label: 'Policy Simulation Console',
    icon: '🧪',
    group: 'Counsel',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/alloy/simulate');
    },
  },
  {
    id: 'nav-alloy-handoffs',
    label: 'Agent Handoffs (A2A)',
    icon: '🔗',
    group: 'Counsel',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/alloy/handoffs');
    },
  },
  {
    id: 'nav-alloy-receipts',
    label: 'Trust Receipts',
    icon: '🛡️',
    group: 'Counsel',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/alloy/receipts');
    },
  },
  {
    id: 'nav-ai-ops',
    label: 'AI Quality Dashboard',
    icon: '🧠',
    group: 'AI Ops',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/ai-ops');
    },
  },
  {
    id: 'nav-living-topology',
    label: 'Living Topology',
    icon: '🔗',
    group: 'Living Intelligence',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/living-topology');
    },
  },
  {
    id: 'nav-gpu-observatory',
    label: 'GPU & AI Observatory',
    icon: '🖥️',
    group: 'Living Intelligence',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/gpu-observatory');
    },
  },
  {
    id: 'nav-business-signals',
    label: 'Business Signal Intelligence',
    icon: '💰',
    group: 'Living Intelligence',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/business-signals');
    },
  },
  {
    id: 'nav-predictive-intel',
    label: 'Predictive Intelligence',
    icon: '🔮',
    group: 'Living Intelligence',
    action: () => {
      window.location.href = window.location.pathname.replace(
        /\/[^/]*$/,
        '/predictive-intelligence',
      );
    },
  },
  {
    id: 'nav-revenue-impact',
    label: 'Revenue Impact Engine',
    icon: '💵',
    group: 'Revenue & Self-Healing',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/revenue-impact');
    },
  },
  {
    id: 'nav-self-healing',
    label: 'Self-Healing Orchestrator',
    icon: '🔄',
    group: 'Revenue & Self-Healing',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/self-healing');
    },
  },
  {
    id: 'nav-failure-timeline',
    label: 'Predictive Failure Timeline',
    icon: '📈',
    group: 'Revenue & Self-Healing',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/failure-timeline');
    },
  },
  {
    id: 'nav-client-value',
    label: 'Client Value Dashboard',
    icon: '👥',
    group: 'Revenue & Self-Healing',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/client-value');
    },
  },
  {
    id: 'nav-ops-savings',
    label: 'Ops Savings Calculator',
    icon: '🧮',
    group: 'Revenue & Self-Healing',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/ops-savings');
    },
  },
  {
    id: 'nav-escalation-intel',
    label: 'Escalation Intelligence',
    icon: '🧠',
    group: 'Revenue & Self-Healing',
    action: () => {
      window.location.href = window.location.pathname.replace(
        /\/[^/]*$/,
        '/escalation-intelligence',
      );
    },
  },
  {
    id: 'nav-autonomous-noc',
    label: 'Autonomous NOC',
    icon: '🤖',
    group: 'Autonomous NOC',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/autonomous-noc');
    },
  },
  {
    id: 'nav-noise-reduction',
    label: 'Noise Reduction & Alert Correlation',
    icon: '🔕',
    group: 'Autonomous NOC',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/noise-reduction');
    },
  },
  {
    id: 'nav-knowledge-graph',
    label: 'Infrastructure Knowledge Graph',
    icon: '🕸️',
    group: 'Autonomous NOC',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/knowledge-graph');
    },
  },
  {
    id: 'nav-runbook-studio',
    label: 'Runbook Automation Studio',
    icon: '📋',
    group: 'Autonomous NOC',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/runbook-studio');
    },
  },
  {
    id: 'nav-change-management',
    label: 'Change Management Intelligence',
    icon: '📅',
    group: 'Autonomous NOC',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/change-management');
    },
  },
  {
    id: 'nav-capacity-planning',
    label: 'Capacity Planning & Cost Optimization',
    icon: '📊',
    group: 'Autonomous NOC',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/capacity-planning');
    },
  },
  {
    id: 'nav-dex',
    label: 'DEX Scoring',
    icon: '🖥️',
    group: 'Autonomous NOC',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/dex');
    },
  },
  {
    id: 'nav-msp-command',
    label: 'Multi-Tenant MSP Command',
    icon: '🏢',
    group: 'Autonomous NOC',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/msp-command');
    },
  },
  {
    id: 'nav-dev-feedback',
    label: 'Observability Dev Feedback',
    icon: '💻',
    group: 'Autonomous NOC',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/dev-feedback');
    },
  },
  {
    id: 'nav-self-healing-confidence',
    label: 'Self-Healing Confidence Index',
    icon: '🩺',
    group: 'Innovation Engine',
    action: () => {
      window.location.href = window.location.pathname.replace(
        /\/[^/]*$/,
        '/self-healing-confidence',
      );
    },
  },
  {
    id: 'nav-slo',
    label: 'SLO / SLI Management',
    icon: '🎯',
    group: 'Observability',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/slo');
    },
  },
  {
    id: 'nav-finops',
    label: 'FinOps & Cloud Cost Intelligence',
    icon: '💰',
    group: 'Observability',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/finops');
    },
  },
  {
    id: 'nav-tracing',
    label: 'Distributed Tracing Visualizer',
    icon: '🔍',
    group: 'Observability',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/tracing');
    },
  },
  {
    id: 'nav-on-call',
    label: 'On-Call Management',
    icon: '📟',
    group: 'Observability',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/on-call');
    },
  },
  {
    id: 'nav-synthetic',
    label: 'Synthetic Monitoring',
    icon: '🌐',
    group: 'Observability',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/synthetic');
    },
  },
  ...createBaselineWebActions(
    (path) => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, path);
    },
    {
      helpUrl: 'https://szlholdings.com/docs',
      themeToggle: {
        label: 'Toggle Theme',
        action: () => {
          document.documentElement.classList.toggle('light');
        },
      },
    },
  ),
  ...getEcosystemSwitchCommands('lyte'),
];

const lyteShortcuts: KeyboardShortcut[] = [
  { key: 'S', description: 'Signals Feed', category: 'Navigation' },
  { key: 'A', description: 'Action Center', category: 'Navigation' },
  { key: 'R', description: 'Readiness Module', category: 'Navigation' },
  { key: 'O', description: 'Ownership Map', category: 'Navigation' },
  { key: 'E', description: 'Escalation Center', category: 'Navigation' },
  { key: 'I', description: 'Intervention Workspace', category: 'Navigation' },
];

function PrivateApp({
  cmdOpen,
  setCmdOpen,
}: {
  cmdOpen: boolean;
  setCmdOpen: (v: boolean) => void;
}) {
  return (
    <PowerUserProvider shortcuts={lyteShortcuts} appName="Lyte" accentColor={COMMAND_ACCENT}>
      <div className="flex flex-col h-screen bg-[#080c14]">
        <EcosystemNav
          currentAppId="command"
          currentAppName="Unified Command"
          accentColor={COMMAND_ACCENT}
        />
        <SandboxModeBanner />
        <div className="flex-1 overflow-hidden">
          <CommandLayout>
            <PrivateRouter />
          </CommandLayout>
        </div>
      </div>
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={lyteCommands}
        appName="Lyte"
        accentColor={COMMAND_ACCENT}
      />
    </PowerUserProvider>
  );
}

function AppContent({
  cmdOpen,
  setCmdOpen,
}: {
  cmdOpen: boolean;
  setCmdOpen: (v: boolean) => void;
}) {
  const { user, isLoading, isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (user) {
      const userId = String(user.id);
      const email = user.email ?? undefined;
      const name = user.name ?? user.displayName ?? user.username ?? undefined;
      identifyAnalyticsUser({ id: userId, email, name });
      setSentryUser({ id: userId, email, username: name });
    } else {
      resetAnalyticsUser();
      clearSentryUser();
    }
  }, [user?.id]);
  const [location] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const forceWebsite = params.get('view') === 'website';
  const forceApp = params.get('view') === 'app' || params.get('demo') === 'true';

  const normalizedPath = location.replace(/\/+$/, '') || '/';
  if (normalizedPath === '/pulse') {
    return (
      <Suspense fallback={<div style={{ height: '100vh', background: '#080c14' }} />}>
        <CommandPulse />
      </Suspense>
    );
  }

  if (forceApp) {
    return <PrivateApp cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />;
  }

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#080c14',
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            border: '2px solid rgba(212,160,84,0.25)',
            borderTopColor: COMMAND_ACCENT,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated || forceWebsite) {
    return (
      <Suspense fallback={<div style={{ height: '100vh', background: '#080c14' }} />}>
        <CommandMarketingLanding onSignIn={login} />
      </Suspense>
    );
  }

  return <PrivateApp cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />;
}

const COMMAND_STATUS_CONFIG = {
  active: false,
  level: 'maintenance' as const,
  message: 'Scheduled maintenance in progress. Some features may be temporarily unavailable.',
  link: { label: 'Status page', href: 'https://szlholdings.com/status' },
};

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(lyteCommands);
  useSessionRevocationToast();

  return (
    <AnalyticsProvider appName="lyte">
      <PrismBusProvider domain="lyte">
        <SandboxModeProvider>
          <QueryClientProvider client={queryClient}>
            <StaleIndicator accentColor={COMMAND_ACCENT} />
            <Toaster position="bottom-right" theme="dark" />
            <DemoModeProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <StatusBanner config={COMMAND_STATUS_CONFIG} />
                <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
                <AgentCopilot config={beaconConfig} />
                <McpOverlay domain="lyte" />
                <CookieBanner
                  privacyUrl="https://szlholdings.com/legal/privacy"
                  accentColor={COMMAND_ACCENT}
                />
              </WouterRouter>
            </DemoModeProvider>
          </QueryClientProvider>
        </SandboxModeProvider>
      </PrismBusProvider>
    </AnalyticsProvider>
  );
}

export default App;
