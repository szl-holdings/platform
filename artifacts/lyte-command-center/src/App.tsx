import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { LyteLayout } from "@/components/lyte-layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { beaconConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";
import { useAuth } from "@workspace/replit-auth-web";
import { Zap, Inbox, CheckSquare, Users, AlertOctagon, Activity, Shield } from "lucide-react";

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
      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
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
const SignalsPage = lazy(() => import("@/pages/signals-page"));
const ActionsPage = lazy(() => import("@/pages/actions-page"));
const ReadinessPage = lazy(() => import("@/pages/readiness-page"));
const LyteMarketingLanding = lazy(() => import("@/pages/marketing-landing"));

function PrivateRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={CommandInbox} />
        <Route path="/signals" component={SignalsPage} />
        <Route path="/actions" component={ActionsPage} />
        <Route path="/readiness" component={ReadinessPage} />
        <Route path="/action-queue" component={ActionQueue} />
        <Route path="/approvals" component={ApprovalsCenter} />
        <Route path="/ownership" component={OwnershipMap} />
        <Route path="/escalation" component={EscalationCenter} />
        <Route path="/intervention" component={InterventionWorkspace} />
        <Route path="/readiness-module" component={ReadinessModule} />
        <Route path="/admin/jobs" component={AdminJobsPage} />
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
    <PowerUserProvider shortcuts={lyteShortcuts} appName="Lyte" accentColor="#f59e0b">
      <div className="flex flex-col h-screen bg-[#080c14]">
        <EcosystemNav currentAppId="lyte" currentAppName="Lyte" accentColor="#f59e0b" />
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
        accentColor="#f59e0b"
      />
      <WelcomeOverlay
        appId="lyte"
        appName="Lyte"
        subtitle="Command & Orchestration"
        description="Lyte interprets what Beacon sees and routes accountability to the right owner. It is the execution layer for human decisions — approvals, escalations, and interventions."
        accentColor="#f59e0b"
        icon={Zap}
        features={[
          { icon: Inbox, title: "Command Inbox", description: "Prioritized actions, approvals, exceptions, and stalled workflow assignments" },
          { icon: Activity, title: "Signals Feed", description: "Live signal feed from all sources with state transitions and detail history" },
          { icon: CheckSquare, title: "Action Center", description: "Assigned actions with state transitions, role-based views, and optimistic updates" },
          { icon: Shield, title: "Readiness Module", description: "Operational readiness items with scores, owners, and completion tracking" },
          { icon: Users, title: "Ownership Map", description: "Who owns each step, missing ownership, broken handoffs, overloaded teams" },
          { icon: AlertOctagon, title: "Escalation Center", description: "What needs escalation, why, to whom, with Alloy rationale attached" },
        ]}
      />
    </PowerUserProvider>
  );
}

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#080c14" }}>
        <div style={{ width: 24, height: 24, border: "2px solid rgba(245,158,11,0.25)", borderTopColor: "#f59e0b", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
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
