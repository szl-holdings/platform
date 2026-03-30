import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { beaconConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";
import { BeaconLayout } from "@/components/beacon-layout";
import { Eye, Activity, TrendingDown, Radar, GitBranch } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60_000, retry: 1 } },
});

const ExecutiveOverview = lazy(() => import("@/pages/executive-overview"));
const WorkflowHealth = lazy(() => import("@/pages/workflow-health"));
const ValueRecovery = lazy(() => import("@/pages/value-recovery"));
const DriftDetection = lazy(() => import("@/pages/drift-detection"));
const CausalDrilldown = lazy(() => import("@/pages/causal-drilldown"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={ExecutiveOverview} />
        <Route path="/workflow-health" component={WorkflowHealth} />
        <Route path="/value-recovery" component={ValueRecovery} />
        <Route path="/drift-detection" component={DriftDetection} />
        <Route path="/causal-drilldown" component={CausalDrilldown} />
        <Route>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Page not found</div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const beaconCommands: CommandItem[] = [
  { id: "nav-overview", label: "Executive Overview", icon: "📡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-workflow", label: "Workflow Health", icon: "⚙️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/workflow-health"); } },
  { id: "nav-recovery", label: "Value Recovery", icon: "💰", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/value-recovery"); } },
  { id: "nav-drift", label: "Drift Detection", icon: "🎯", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/drift-detection"); } },
  { id: "nav-causal", label: "Causal Drilldown", icon: "🔬", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/causal-drilldown"); } },
];

const beaconShortcuts: KeyboardShortcut[] = [
  { key: "W", description: "Workflow Health", category: "Navigation" },
  { key: "V", description: "Value Recovery", category: "Navigation" },
  { key: "D", description: "Drift Detection", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(beaconCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={beaconShortcuts} appName="Beacon" accentColor="#0ea5e9">
          <div className="flex flex-col h-screen bg-[#080c14]">
            <EcosystemNav currentAppId="beacon" currentAppName="Beacon" accentColor="#0ea5e9" />
            <div className="flex-1 overflow-hidden">
              <BeaconLayout>
                <Router />
              </BeaconLayout>
            </div>
          </div>
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            commands={beaconCommands}
            appName="Beacon"
            accentColor="#0ea5e9"
          />
        </PowerUserProvider>
        <WelcomeOverlay
          appId="beacon"
          appName="Beacon"
          subtitle="Business Observability Core"
          description="Beacon sees everything the business is doing — and everything going wrong. It surfaces workflow degradation, value leakage, ownership gaps, and drift before they become crises."
          accentColor="#0ea5e9"
          icon={Eye}
          features={[
            { icon: Activity, title: "Workflow Health", description: "Latency indicators, blocked steps, and ownership gaps across all workflows" },
            { icon: TrendingDown, title: "Value Recovery", description: "Risk estimation, intervention impact, and before/after recovery comparison" },
            { icon: Radar, title: "Drift Detection", description: "Unexpected changes, timing anomalies, and causal attribution" },
            { icon: GitBranch, title: "Causal Drilldown", description: "Root factors linked to Lyte actions, Alloy predictions, and Alloy runs" },
          ]}
        />
      </WouterRouter>
      <AgentCopilot config={beaconConfig} />
    </QueryClientProvider>
  );
}

export default App;
