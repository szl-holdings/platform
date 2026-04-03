import React, { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { SandboxModeProvider, SandboxModeBanner, CookieBanner, StatusBanner } from "@szl-holdings/shared-ui";
import { McpOverlay } from "@szl-holdings/mcp-client";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { LyteLayout } from "@/components/lyte-layout";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { beaconConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@szl-holdings/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@szl-holdings/shared-ui/keyboard-shortcuts";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { Shield } from "lucide-react";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { DemoModeProvider } from "@/lib/demo-mode";

const LYTE_ACCENT = LANE_ACCENT_HEX.lyte.primary;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,160,84,0.25)", borderTopColor: LYTE_ACCENT }} />
    </div>
  );
}

const ExecutiveCommand = lazy(() => import("@/pages/executive-command"));
const BlockerBoard = lazy(() => import("@/pages/blocker-board"));
const DigestCenter = lazy(() => import("@/pages/digest-center"));
const TrustAudit = lazy(() => import("@/pages/trust-audit"));
const AlloyActionConsole = lazy(() => import("@/pages/alloy-action-console"));
const AlloyWorkflowTemplates = lazy(() => import("@/pages/alloy-workflow-templates"));
const AlloyWriteBack = lazy(() => import("@/pages/alloy-write-back"));
const CommandInbox = lazy(() => import("@/pages/command-inbox"));
const ApprovalsCenter = lazy(() => import("@/pages/approvals-center"));
const OwnershipMap = lazy(() => import("@/pages/ownership-map-new"));
const EscalationCenter = lazy(() => import("@/pages/escalation-center"));
const InterventionWorkspace = lazy(() => import("@/pages/intervention-workspace"));
const ActionQueue = lazy(() => import("@/pages/action-queue"));
const ReadinessModule = lazy(() => import("@/pages/readiness-module"));
const AdminJobsPage = lazy(() => import("@/pages/admin/jobs"));
const AdminUsersPage = lazy(() => import("@/pages/admin/users"));
const AdminFlagsPage = lazy(() => import("@/pages/admin/feature-flags"));
const AdminAuditPage = lazy(() => import("@/pages/admin/audit-log"));
const AdminOverviewPage = lazy(() => import("@/pages/admin/overview"));
const AdminRunViewerPage = lazy(() => import("@/pages/admin/run-viewer"));
const AdminApprovalQueuePage = lazy(() => import("@/pages/admin/approval-queue"));
const AdminSeederPage = lazy(() => import("@/pages/admin/seeder"));
const AdminExportHistoryPage = lazy(() => import("@/pages/admin/export-history"));
const AdminDiagnosticsPage = lazy(() => import("@/pages/admin/diagnostics"));
const AdminBillingPage = lazy(() => import("@/pages/admin/billing-admin"));
const AdminOpsConsolePage = lazy(() => import("@/pages/admin/ops-console"));
const OperationalQueue = lazy(() => import("@/pages/operational-queue"));
const SignalsPage = lazy(() => import("@/pages/signals-page"));
const ActionsPage = lazy(() => import("@/pages/actions-page"));
const ReadinessPage = lazy(() => import("@/pages/readiness-page"));
const LyteMarketingLanding = lazy(() => import("@/pages/marketing-landing"));
const PrismDashboard = lazy(() => import("@/pages/prism-dashboard"));
const MetricsExplorer = lazy(() => import("@/pages/metrics-explorer"));

const ServiceTopology = lazy(() => import("@/pages/service-topology"));
const ErrorBudgetBurn = lazy(() => import("@/pages/error-budget-burn"));
const LogExplorer = lazy(() => import("@/pages/log-explorer"));
const AlertManagement = lazy(() => import("@/pages/alert-management"));
const ExecutiveSummary = lazy(() => import("@/pages/executive-summary"));
const AlloyWorkflowCanvas = lazy(() => import("@/pages/alloy-workflow-canvas"));
const AlloyIntelligence = lazy(() => import("@/pages/alloy-intelligence"));
const AlloyAgentMonitor = lazy(() => import("@/pages/alloy-agent-monitor"));
const AlloyExecutionTraces = lazy(() => import("@/pages/alloy-execution-traces"));
const AlloyGovernance = lazy(() => import("@/pages/alloy-governance"));
const AlloyIntegrationHealth = lazy(() => import("@/pages/alloy-integration-health"));
const EscalationWorkflow = lazy(() => import("@/pages/escalation-workflow"));
const CommandInboxLegacy = lazy(() => import("@/pages/action-queue"));
const PowerBiReport = lazy(() => import("@/pages/powerbi-report"));
const DashboardBuilder = lazy(() => import("@/pages/dashboard-builder"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const ApmInstrumentation = lazy(() => import("@/pages/apm-instrumentation"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const DemoDashboard = lazy(() => import("@/pages/demo-dashboard"));
const DemoSignals = lazy(() => import("@/pages/demo-signals"));
const DemoPriorities = lazy(() => import("@/pages/demo-priorities"));
const DemoWorkflows = lazy(() => import("@/pages/demo-workflows"));
const DemoRecommendations = lazy(() => import("@/pages/demo-recommendations"));
const DemoAudit = lazy(() => import("@/pages/demo-audit"));
const DemoExceptions = lazy(() => import("@/pages/demo-exceptions"));
const DemoReadiness = lazy(() => import("@/pages/demo-readiness"));
const DemoIntegrations = lazy(() => import("@/pages/demo-integrations"));
const DemoReports = lazy(() => import("@/pages/demo-reports"));
const DemoSettings = lazy(() => import("@/pages/demo-settings"));
const DemoAlerts = lazy(() => import("@/pages/demo-alerts"));
const DemoLive = lazy(() => import("@/pages/demo-live"));
const BottleneckHeatmap = lazy(() => import("@/pages/bottleneck-heatmap"));
const BoardMode = lazy(() => import("@/pages/board-mode"));
const DecisionReceipts = lazy(() => import("@/pages/decision-receipts"));
const OutcomeLoop = lazy(() => import("@/pages/outcome-loop"));
const DeferLane = lazy(() => import("@/pages/defer-lane"));
const ShadowMode = lazy(() => import("@/pages/shadow-mode"));

const ADMIN_ROLES = ["admin", "super_admin", "ops"];

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
        <Route path="/" component={ExecutiveCommand} />
        <Route path="/overview" component={Dashboard} />
        <Route path="/dashboard" component={DemoDashboard} />
        <Route path="/blocker-board" component={BlockerBoard} />
        <Route path="/digest" component={DigestCenter} />
        <Route path="/trust-audit" component={TrustAudit} />
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
        <Route path="/powerbi" component={PowerBiReport} />
        <Route path="/dashboards" component={DashboardBuilder} />
        <Route path="/apm" component={ApmInstrumentation} />
        <Route path="/admin/jobs">{() => <AdminRoute component={AdminJobsPage} />}</Route>
        <Route path="/admin/users">{() => <AdminRoute component={AdminUsersPage} />}</Route>
        <Route path="/admin/flags">{() => <AdminRoute component={AdminFlagsPage} />}</Route>
        <Route path="/admin/audit">{() => <AdminRoute component={AdminAuditPage} />}</Route>
        <Route path="/admin/overview">{() => <AdminRoute component={AdminOverviewPage} />}</Route>
        <Route path="/admin/runs">{() => <AdminRoute component={AdminRunViewerPage} />}</Route>
        <Route path="/admin/approvals">{() => <AdminRoute component={AdminApprovalQueuePage} />}</Route>
        <Route path="/admin/seeder">{() => <AdminRoute component={AdminSeederPage} />}</Route>
        <Route path="/admin/exports">{() => <AdminRoute component={AdminExportHistoryPage} />}</Route>
        <Route path="/admin/diagnostics">{() => <AdminRoute component={AdminDiagnosticsPage} />}</Route>
        <Route path="/admin/billing">{() => <AdminRoute component={AdminBillingPage} />}</Route>
        <Route path="/admin/ops">{() => <AdminRoute component={AdminOpsConsolePage} />}</Route>
        <Route path="/pricing" component={PricingPage} />
        <Route path="/demo-live" component={DemoLive} />
        <Route path="/bottleneck-heatmap" component={BottleneckHeatmap} />
        <Route path="/board-mode" component={BoardMode} />
        <Route path="/decision-receipts" component={DecisionReceipts} />
        <Route path="/outcome-loop" component={OutcomeLoop} />
        <Route path="/defer-lane" component={DeferLane} />
        <Route path="/shadow-mode" component={ShadowMode} />
        <Route>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Page not found</div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const lyteCommands: CommandItem[] = [
  { id: "nav-exec", label: "Executive Command", icon: "⚡", group: "Executive", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-blockers", label: "Blocker Board", icon: "🚫", group: "Executive", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/blocker-board"); } },
  { id: "nav-digest", label: "Digest Center", icon: "📄", group: "Executive", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/digest"); } },
  { id: "nav-approvals", label: "Approvals", icon: "✅", group: "Executive", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/approvals"); } },
  { id: "nav-trust", label: "Trust & Audit", icon: "🛡️", group: "Executive", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/trust-audit"); } },
  { id: "nav-inbox", label: "Command Inbox", icon: "📥", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/inbox"); } },
  { id: "nav-signals", label: "Signals Feed", icon: "📡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/signals"); } },
  { id: "nav-ownership", label: "Ownership Map", icon: "👥", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/ownership"); } },
  { id: "nav-alloy-actions", label: "Alloy Action Queue", icon: "⚙️", group: "Alloy", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/alloy/actions"); } },
  { id: "nav-alloy-templates", label: "Alloy Workflow Templates", icon: "🔄", group: "Alloy", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/alloy/templates"); } },
  { id: "nav-alloy-gates", label: "Write-Back Gates", icon: "🔒", group: "Alloy", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/alloy/gates"); } },
];

const lyteShortcuts: KeyboardShortcut[] = [
  { key: "S", description: "Signals Feed", category: "Navigation" },
  { key: "A", description: "Action Center", category: "Navigation" },
  { key: "R", description: "Readiness Module", category: "Navigation" },
  { key: "O", description: "Ownership Map", category: "Navigation" },
  { key: "E", description: "Escalation Center", category: "Navigation" },
  { key: "I", description: "Intervention Workspace", category: "Navigation" },
];

function PrivateApp({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  return (
    <PowerUserProvider shortcuts={lyteShortcuts} appName="Lyte" accentColor={LYTE_ACCENT}>
      <div className="flex flex-col h-screen bg-[#080c14]">
        <EcosystemNav currentAppId="lyte" currentAppName="Lyte" accentColor={LYTE_ACCENT} />
        <SandboxModeBanner />
        <div className="flex-1 overflow-hidden">
          <LyteLayout>
            <PrivateRouter />
          </LyteLayout>
        </div>
      </div>
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={lyteCommands}
        appName="Lyte"
        accentColor={LYTE_ACCENT}
      />
    </PowerUserProvider>
  );
}

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const forceWebsite = params.get("view") === "website";
  const forceApp = params.get("view") === "app" || params.get("demo") === "true";

  if (forceApp) {
    return <PrivateApp cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />;
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080c14" }}>
        <div style={{ width: 24, height: 24, border: "2px solid rgba(212,160,84,0.25)", borderTopColor: LYTE_ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!isAuthenticated || forceWebsite) {
    return (
      <Suspense fallback={<div style={{ height: "100vh", background: "#080c14" }} />}>
        <LyteMarketingLanding onSignIn={login} />
      </Suspense>
    );
  }

  return <PrivateApp cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />;
}

const LYTE_STATUS_CONFIG = {
  active: false,
  level: "maintenance" as const,
  message: "Scheduled maintenance in progress. Some features may be temporarily unavailable.",
  link: { label: "Status page", href: "https://szlholdings.com/status" },
};

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(lyteCommands);

  return (
    <PrismBusProvider domain="lyte">
    <SandboxModeProvider>
      <QueryClientProvider client={queryClient}>
        <DemoModeProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <StatusBanner config={LYTE_STATUS_CONFIG} />
            <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
            <AgentCopilot config={beaconConfig} />
            <McpOverlay domain="lyte" />
            <CookieBanner privacyUrl="https://szlholdings.com/legal/privacy" accentColor={LYTE_ACCENT} />
          </WouterRouter>
        </DemoModeProvider>
      </QueryClientProvider>
    </SandboxModeProvider>
    </PrismBusProvider>
  );
}

export default App;
