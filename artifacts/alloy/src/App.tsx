import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { AlloyLayout } from "@/components/alloy-layout";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { PrivateAppGuard } from "@workspace/shared-ui";
import { Zap, Activity, GitBranch, Network, Shield } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const ExecutionRuns = lazy(() => import("@/pages/execution-runs"));
const WorkflowOrchestration = lazy(() => import("@/pages/workflow-orchestration"));
const ConnectorMesh = lazy(() => import("@/pages/connector-mesh"));
const GovernanceAudit = lazy(() => import("@/pages/governance-audit"));
const AutomationAnalytics = lazy(() => import("@/pages/automation-analytics"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={ExecutionRuns} />
        <Route path="/workflows" component={WorkflowOrchestration} />
        <Route path="/connectors" component={ConnectorMesh} />
        <Route path="/governance" component={GovernanceAudit} />
        <Route path="/analytics" component={AutomationAnalytics} />
        <Route>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Page not found</div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const alloyCommands: CommandItem[] = [
  { id: "nav-runs", label: "Execution Runs", icon: "⚡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-workflows", label: "Workflow Orchestration", icon: "🔀", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/workflows"); } },
  { id: "nav-connectors", label: "Connector Mesh", icon: "🔌", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/connectors"); } },
  { id: "nav-governance", label: "Governance & Audit", icon: "🛡️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/governance"); } },
  { id: "nav-analytics", label: "Automation Analytics", icon: "📊", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/analytics"); } },
];

const alloyShortcuts: KeyboardShortcut[] = [
  { key: "W", description: "Workflow Orchestration", category: "Navigation" },
  { key: "C", description: "Connector Mesh", category: "Navigation" },
  { key: "G", description: "Governance & Audit", category: "Navigation" },
  { key: "A", description: "Automation Analytics", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(alloyCommands);

  return (
    <PrivateAppGuard appName="Alloy" accentColor="#00d4ff">
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={alloyShortcuts} appName="Alloy" accentColor="#00d4ff">
          <div className="flex flex-col h-screen bg-[#080c14]">
            <EcosystemNav currentAppId="alloy" currentAppName="Alloy" accentColor="#00d4ff" />
            <div className="flex-1 overflow-hidden">
              <AlloyLayout>
                <Router />
              </AlloyLayout>
            </div>
          </div>
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            commands={alloyCommands}
            appName="Alloy"
            accentColor="#00d4ff"
          />
        </PowerUserProvider>
      </WouterRouter>
    </QueryClientProvider>
    </PrivateAppGuard>
  );
}

export default App;
