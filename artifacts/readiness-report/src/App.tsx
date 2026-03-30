import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/toaster";
import { TooltipProvider } from "@workspace/shared-ui/ui/tooltip";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { compassConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";
import { BarChart3, ClipboardCheck, AlertTriangle, TrendingUp } from "lucide-react";

const Dashboard = lazy(() => import("@/pages/dashboard"));
const Scorecards = lazy(() => import("@/pages/scorecards"));
const Milestones = lazy(() => import("@/pages/milestones"));
const Risks = lazy(() => import("@/pages/risks"));
const Alerts = lazy(() => import("@/pages/alerts"));
const Trends = lazy(() => import("@/pages/trends"));
const Rollup = lazy(() => import("@/pages/rollup"));
const AIInsights = lazy(() => import("@/pages/ai-insights"));
const VitalSigns = lazy(() => import("@/pages/vital-signs"));
const NotFound = lazy(() => import("@/pages/not-found"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const VendorRisk = lazy(() => import("@/pages/vendor-risk"));
const RiskRegister = lazy(() => import("@/pages/risk-register"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  }
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
        <Route path="/scorecards" component={Scorecards} />
        <Route path="/milestones" component={Milestones} />
        <Route path="/risks" component={Risks} />
        <Route path="/alerts" component={Alerts} />
        <Route path="/trends" component={Trends} />
        <Route path="/rollup" component={Rollup} />
        <Route path="/ai-insights" component={AIInsights} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/vital-signs" component={VitalSigns} />
        <Route path="/vendor-risk" component={VendorRisk} />
        <Route path="/risk-register" component={RiskRegister} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

const readinessCommands: CommandItem[] = [
  { id: "nav-dashboard", label: "Readiness Dashboard", icon: "📊", group: "Navigation", keywords: ["home", "overview"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-scorecards", label: "Framework Scorecards", icon: "✅", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/scorecards"); } },
  { id: "nav-milestones", label: "Milestones", icon: "🏁", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/milestones"); } },
  { id: "nav-risks", label: "Risk Register", icon: "⚠️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/risks"); } },
  { id: "nav-alerts", label: "Alerts", icon: "🔔", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/alerts"); } },
  { id: "nav-trends", label: "Trends", icon: "📈", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/trends"); } },
  { id: "nav-ai-insights", label: "AI Insights", icon: "🤖", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/ai-insights"); } },
  { id: "nav-vendor-risk", label: "Vendor Risk", icon: "🏢", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/vendor-risk"); } },
  { id: "app-firestorm", label: "Switch to Firestorm", icon: "🔥", group: "Switch App", description: "Security Simulation", action: () => { window.location.href = "/firestorm/"; } },
  { id: "app-admin", label: "Switch to Admin Panel", icon: "⚙️", group: "Switch App", description: "Control Plane", action: () => { window.location.href = "/admin/"; } },
];

const readinessShortcuts: KeyboardShortcut[] = [
  { key: "S", description: "Go to Scorecards", category: "Navigation" },
  { key: "R", description: "Go to Risk Register", category: "Navigation" },
  { key: "T", description: "Go to Trends", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(readinessCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <PowerUserProvider shortcuts={readinessShortcuts} appName="Aegis" accentColor="#10b981">
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
              <EcosystemNav currentAppId="aegis" currentAppName="Aegis — Control Plane & Risk Register" accentColor="#10b981" />
              <div style={{ flex: 1 }}>
                <Router />
              </div>
            </div>
            <CommandPalette
              open={cmdOpen}
              onClose={() => setCmdOpen(false)}
              commands={readinessCommands}
              appName="Aegis"
              accentColor="#10b981"
            />
          </PowerUserProvider>
          <WelcomeOverlay
            appId="aegis"
            appName="Aegis"
            subtitle="Control Plane, Risk Register & Governance — DECIDE Layer"
            description="Enterprise control plane for risk register management, compliance scoring, remediation tracking, and governance automation across NIST CSF 2.0, FedRAMP, and CMMC frameworks."
            accentColor="#10b981"
            icon={ClipboardCheck}
            features={[
              { icon: BarChart3, title: "Gap Analysis", description: "Framework-level scoring with control-by-control breakdowns" },
              { icon: TrendingUp, title: "Milestones", description: "Track remediation tasks toward your next audit date" },
              { icon: AlertTriangle, title: "Risk Register", description: "Prioritized risk items with owner assignment" },
              { icon: ClipboardCheck, title: "Audit Reports", description: "Generate board-ready compliance status reports" },
            ]}
          />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      <AgentCopilot config={compassConfig} />
    </QueryClientProvider>
  );
}

export default App;
