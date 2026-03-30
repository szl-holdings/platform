import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { Layout } from "@/components/layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { beaconConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";
import { Zap, Activity, AlertTriangle, BookOpen } from "lucide-react";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Signals = lazy(() => import("@/pages/signals"));
const Insights = lazy(() => import("@/pages/insights"));
const ActionCenter = lazy(() => import("@/pages/action-center"));
const WorkflowLatency = lazy(() => import("@/pages/workflow-latency"));
const OwnershipMap = lazy(() => import("@/pages/ownership-map"));
const ValueAtRisk = lazy(() => import("@/pages/value-at-risk"));
const UseCases = lazy(() => import("@/pages/use-cases"));
const Landing = lazy(() => import("@/pages/landing"));
const NotFound = lazy(() => import("@/pages/not-found"));

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
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/signals" component={Signals} />
        <Route path="/insights" component={Insights} />
        <Route path="/action-center" component={ActionCenter} />
        <Route path="/workflow-latency" component={WorkflowLatency} />
        <Route path="/ownership-map" component={OwnershipMap} />
        <Route path="/value-at-risk" component={ValueAtRisk} />
        <Route path="/use-cases" component={UseCases} />
        <Route path="/platform" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

const lyteCommands: CommandItem[] = [
  { id: "nav-dashboard", label: "Command Overview", icon: "⚡", group: "Navigation", keywords: ["home", "overview", "dashboard"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-signals", label: "Signal Feed", icon: "📡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/signals"); } },
  { id: "nav-insights", label: "Narrative Intelligence", icon: "🧠", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/insights"); } },
  { id: "nav-actions", label: "Action Center", icon: "⚡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/action-center"); } },
  { id: "nav-workflow", label: "Workflow Latency", icon: "⏱️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/workflow-latency"); } },
  { id: "nav-ownership", label: "Ownership Map", icon: "👥", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/ownership-map"); } },
  { id: "nav-var", label: "Value at Risk", icon: "💰", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/value-at-risk"); } },
  { id: "nav-usecases", label: "Use Cases", icon: "📋", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/use-cases"); } },
  { id: "nav-platform", label: "Platform Overview", icon: "🎯", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/platform"); } },
  { id: "app-firestorm", label: "Switch to Firestorm", icon: "🔥", group: "Switch App", description: "Security Simulation", action: () => { window.location.href = "/firestorm/"; } },
  { id: "app-vessels", label: "Switch to Vessels", icon: "🚢", group: "Switch App", description: "Maritime Intelligence", action: () => { window.location.href = "/vessels/"; } },
];

const lyteShortcuts: KeyboardShortcut[] = [
  { key: "S", description: "Signal Feed", category: "Navigation" },
  { key: "I", description: "Narrative Intelligence", category: "Navigation" },
  { key: "A", description: "Action Center", category: "Navigation" },
  { key: "W", description: "Workflow Latency", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(lyteCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={lyteShortcuts} appName="Lyte Command Center" accentColor="#06b6d4">
          <div className="flex flex-col h-screen">
            <EcosystemNav currentAppId="lyte" currentAppName="Lyte Command Center" accentColor="#06b6d4" />
            <div className="flex-1 overflow-hidden">
              <Layout>
                <Router />
              </Layout>
            </div>
          </div>
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            commands={lyteCommands}
            appName="Lyte"
            accentColor="#06b6d4"
          />
        </PowerUserProvider>
        <WelcomeOverlay
          appId="lyte"
          appName="Lyte"
          subtitle="Business Operations Command Center"
          description="Detect signals, manage incidents, and automate response across your entire business infrastructure — with AI-driven anomaly detection and runbook automation."
          accentColor="#f59e0b"
          icon={Zap}
          features={[
            { icon: Activity, title: "Signal Detection", description: "Correlate signals across infra, product, and revenue" },
            { icon: AlertTriangle, title: "Incident Management", description: "Priority-based incidents with blast radius analysis" },
            { icon: BookOpen, title: "Playbooks", description: "Automated runbooks for common incident patterns" },
            { icon: Zap, title: "AI Ops", description: "Intelligent noise reduction and root cause analysis" },
          ]}
        />
      </WouterRouter>
      <AgentCopilot config={beaconConfig} />
    </QueryClientProvider>
  );
}

export default App;
