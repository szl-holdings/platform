import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { Layout } from "@/components/layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { beaconConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Signals = lazy(() => import("@/pages/signals"));
const Recommendations = lazy(() => import("@/pages/recommendations"));
const Incidents = lazy(() => import("@/pages/incidents"));
const Playbooks = lazy(() => import("@/pages/playbooks"));
const Commerce = lazy(() => import("@/pages/commerce"));
const IntelligencePage = lazy(() => import("@/pages/intelligence"));
const AIOps = lazy(() => import("@/pages/ai-ops"));
const Topology = lazy(() => import("@/pages/topology"));
const MeridianAnalytics = lazy(() => import("@/pages/meridian-analytics"));
const NotFound = lazy(() => import("@/pages/not-found"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const PortfolioObservability = lazy(() => import("@/pages/portfolio-observability"));
const QhapaqNan = lazy(() => import("@/pages/qhapaq-nan"));
const AnomalyDetection = lazy(() => import("@/pages/anomaly-detection"));
const SLOTracking = lazy(() => import("@/pages/slo-tracking"));
const CloudCost = lazy(() => import("@/pages/cloud-cost"));
const OnCallManagement = lazy(() => import("@/pages/oncall-management"));

const AdminOverview = lazy(() => import("@/pages/admin/overview"));
const AdminUsers = lazy(() => import("@/pages/admin/users"));
const AuditLog = lazy(() => import("@/pages/admin/audit-log"));
const FeatureFlags = lazy(() => import("@/pages/admin/feature-flags"));
const Connectors = lazy(() => import("@/pages/admin/connectors"));
const WorkflowAutomation = lazy(() => import("@/pages/admin/workflows"));
const PlatformHealth = lazy(() => import("@/pages/admin/platform-health"));

const GettingStarted = lazy(() => import("@/pages/developer/GettingStarted"));
const ApiExplorer = lazy(() => import("@/pages/developer/ApiExplorer"));
const ApiKeys = lazy(() => import("@/pages/developer/ApiKeys"));
const Webhooks = lazy(() => import("@/pages/developer/Webhooks"));
const RateLimits = lazy(() => import("@/pages/developer/RateLimits"));
const SdkGuide = lazy(() => import("@/pages/developer/SdkGuide"));
const PluginDocs = lazy(() => import("@/pages/developer/PluginDocs"));

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
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/signals" component={Signals} />
        <Route path="/recommendations" component={Recommendations} />
        <Route path="/incidents" component={Incidents} />
        <Route path="/playbooks" component={Playbooks} />
        <Route path="/commerce" component={Commerce} />
        <Route path="/intelligence" component={IntelligencePage} />
        <Route path="/ai-ops" component={AIOps} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/portfolio-observability" component={PortfolioObservability} />
        <Route path="/topology" component={Topology} />
        <Route path="/qhapaq-nan" component={QhapaqNan} />
        <Route path="/meridian-analytics" component={MeridianAnalytics} />
        <Route path="/anomaly-detection" component={AnomalyDetection} />
        <Route path="/slo-tracking" component={SLOTracking} />
        <Route path="/cloud-cost" component={CloudCost} />
        <Route path="/oncall" component={OnCallManagement} />
        <Route path="/admin/overview" component={AdminOverview} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/audit-log" component={AuditLog} />
        <Route path="/admin/feature-flags" component={FeatureFlags} />
        <Route path="/admin/connectors" component={Connectors} />
        <Route path="/admin/workflows" component={WorkflowAutomation} />
        <Route path="/admin/platform-health" component={PlatformHealth} />
        <Route path="/developer/getting-started" component={GettingStarted} />
        <Route path="/developer/api-explorer" component={ApiExplorer} />
        <Route path="/developer/api-keys" component={ApiKeys} />
        <Route path="/developer/webhooks" component={Webhooks} />
        <Route path="/developer/rate-limits" component={RateLimits} />
        <Route path="/developer/sdk-guide" component={SdkGuide} />
        <Route path="/developer/plugins" component={PluginDocs} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

const lyteCommands: CommandItem[] = [
  { id: "nav-dashboard", label: "Dashboard", icon: "⚡", group: "Navigation", keywords: ["home", "overview"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-signals", label: "Signals", icon: "📡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/signals"); } },
  { id: "nav-incidents", label: "Incidents", icon: "🚨", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/incidents"); } },
  { id: "nav-playbooks", label: "Playbooks", icon: "📚", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/playbooks"); } },
  { id: "nav-intelligence", label: "Intelligence", icon: "🧠", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/intelligence"); } },
  { id: "nav-ai-ops", label: "AI Ops", icon: "🤖", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/ai-ops"); } },
  { id: "nav-topology", label: "Topology", icon: "🗺️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/topology"); } },
  { id: "nav-anomaly", label: "Anomaly Detection", icon: "⚠️", group: "Operations", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/anomaly-detection"); } },
  { id: "nav-slo", label: "SLO Tracking", icon: "📊", group: "Operations", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/slo-tracking"); } },
  { id: "nav-cloud-cost", label: "Cloud Cost", icon: "💰", group: "Operations", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/cloud-cost"); } },
  { id: "nav-oncall", label: "On-Call Management", icon: "📞", group: "Operations", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/oncall"); } },
  { id: "nav-admin", label: "Admin Overview", icon: "⚙️", group: "Admin", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/admin/overview"); } },
  { id: "app-firestorm", label: "Switch to Firestorm", icon: "🔥", group: "Switch App", description: "Security Simulation", action: () => { window.location.href = "/firestorm/"; } },
  { id: "app-vessels", label: "Switch to Vessels", icon: "🚢", group: "Switch App", description: "Maritime Intelligence", action: () => { window.location.href = "/vessels/"; } },
];

const lyteShortcuts: KeyboardShortcut[] = [
  { key: "S", description: "Go to Signals", category: "Navigation" },
  { key: "I", description: "Go to Incidents", category: "Navigation" },
  { key: "P", description: "Go to Playbooks", category: "Navigation" },
  { key: "A", description: "Go to AI Ops", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(lyteCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={lyteShortcuts} appName="Lyte Command Center" accentColor="#f59e0b">
          <div className="flex flex-col h-screen">
            <EcosystemNav currentAppId="lyte" currentAppName="Lyte Command Center" accentColor="#f59e0b" />
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
            accentColor="#f59e0b"
          />
        </PowerUserProvider>
      </WouterRouter>
      <AgentCopilot config={beaconConfig} />
    </QueryClientProvider>
  );
}

export default App;
