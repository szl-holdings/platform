import React, { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { LyteLayout } from "@/components/lyte-layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { beaconConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { useAuth } from "@workspace/replit-auth-web";

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
      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(212,160,84,0.25)", borderTopColor: "#d4a054" }} />
    </div>
  );
}

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
const SignalsPage = lazy(() => import("@/pages/signals-page"));
const ActionsPage = lazy(() => import("@/pages/actions-page"));
const ReadinessPage = lazy(() => import("@/pages/readiness-page"));
const LyteMarketingLanding = lazy(() => import("@/pages/marketing-landing"));
const PrismDashboard = lazy(() => import("@/pages/prism-dashboard"));
const MetricsExplorer = lazy(() => import("@/pages/metrics-explorer"));
const AlertConfig = lazy(() => import("@/pages/alert-config"));
const ServiceTopology = lazy(() => import("@/pages/service-topology"));
const EscalationWorkflow = lazy(() => import("@/pages/escalation-workflow"));
const CommandInboxLegacy = lazy(() => import("@/pages/action-queue"));
const PowerBiReport = lazy(() => import("@/pages/powerbi-report"));
const DashboardBuilder = lazy(() => import("@/pages/dashboard-builder"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const ApmInstrumentation = lazy(() => import("@/pages/apm-instrumentation"));

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
        <Route path="/" component={Dashboard} />
        <Route path="/inbox" component={CommandInbox} />
        <Route path="/signals" component={SignalsPage} />
        <Route path="/actions" component={ActionsPage} />
        <Route path="/readiness" component={ReadinessPage} />
        <Route path="/action-queue" component={ActionQueue} />
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
        <Route path="/prism/signals" component={SignalsPage} />
        <Route path="/prism/motion" component={ActionsPage} />
        <Route path="/explorer" component={SignalsPage} />
        <Route path="/workflows" component={EscalationWorkflow} />
        <Route path="/metrics" component={MetricsExplorer} />
        <Route path="/alerts" component={AlertConfig} />
        <Route path="/topology" component={ServiceTopology} />
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
        <Route>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Page not found</div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const lyteCommands: CommandItem[] = [
  { id: "nav-inbox", label: "Command Inbox", icon: "⚡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-signals", label: "Signals Feed", icon: "📡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/signals"); } },
  { id: "nav-actions", label: "Action Center", icon: "🎯", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/actions"); } },
  { id: "nav-readiness", label: "Readiness Module", icon: "🛡️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/readiness"); } },
  { id: "nav-approvals", label: "Approvals Center", icon: "✅", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/approvals"); } },
  { id: "nav-ownership", label: "Ownership Map", icon: "👥", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/ownership"); } },
  { id: "nav-escalation", label: "Escalation Center", icon: "🚨", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/escalation"); } },
  { id: "nav-intervention", label: "Intervention Workspace", icon: "🔧", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/intervention"); } },
  { id: "nav-powerbi", label: "Power BI Operational KPIs", icon: "📊", group: "Analytics", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/powerbi"); } },
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
    <PowerUserProvider shortcuts={lyteShortcuts} appName="Lyte" accentColor="#d4a054">
      <div className="flex flex-col h-screen bg-[#080c14]">
        <EcosystemNav currentAppId="lyte" currentAppName="Lyte" accentColor="#d4a054" />
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
        accentColor="#d4a054"
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
        <div style={{ width: 24, height: 24, border: "2px solid rgba(212,160,84,0.25)", borderTopColor: "#d4a054", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(lyteCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
        <AgentCopilot config={beaconConfig} />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
