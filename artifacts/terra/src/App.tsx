import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { terraConfig } from "@workspace/shared-ui/copilot-configs";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60_000, retry: 2 } },
});

const HomePage = lazy(() => import("@/pages/home"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const MarketPage = lazy(() => import("@/pages/market"));
const PipelinePage = lazy(() => import("@/pages/pipeline"));
const PropertyDetailPage = lazy(() => import("@/pages/property-detail"));
const AnalyticsPage = lazy(() => import("@/pages/analytics"));
const AlertsPage = lazy(() => import("@/pages/alerts-page"));
const InvestmentAnalysis = lazy(() => import("@/pages/investment-analysis"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const PortfolioPerformance = lazy(() => import("@/pages/portfolio-performance"));
const ClimateRisk = lazy(() => import("@/pages/climate-risk"));
const IRModule = lazy(() => import("@/pages/ir-module"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/market" component={MarketPage} />
        <Route path="/pipeline" component={PipelinePage} />
        <Route path="/property/:id" component={PropertyDetailPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/investment-analysis" component={InvestmentAnalysis} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/portfolio-performance" component={PortfolioPerformance} />
        <Route path="/climate-risk" component={ClimateRisk} />
        <Route path="/ir-module" component={IRModule} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-terra-text-secondary">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const terraCommands: CommandItem[] = [
  { id: "nav-dashboard", label: "Dashboard", icon: "🏢", group: "Navigation", keywords: ["home", "overview", "properties"], action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard"); } },
  { id: "nav-market", label: "Market Trends", icon: "📈", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/market"); } },
  { id: "nav-pipeline", label: "Deal Pipeline", icon: "🔄", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/pipeline"); } },
  { id: "nav-analytics", label: "Analytics", icon: "📊", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/analytics"); } },
  { id: "nav-alerts", label: "Alerts", icon: "🔔", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/alerts"); } },
  { id: "nav-investment", label: "Investment Analysis", icon: "💰", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/investment-analysis"); } },
  { id: "nav-portfolio", label: "Portfolio Performance", icon: "📁", group: "Intelligence", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/portfolio-performance"); } },
  { id: "nav-climate", label: "Climate Risk", icon: "🌡️", group: "Intelligence", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/climate-risk"); } },
  { id: "nav-ir", label: "Investor Relations", icon: "🤝", group: "Intelligence", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/ir-module"); } },
  { id: "app-firestorm", label: "Switch to Firestorm", icon: "🔥", group: "Switch App", description: "Security Simulation", action: () => { window.location.href = "/firestorm/"; } },
  { id: "app-msp", label: "Switch to Evolve MSP", icon: "💻", group: "Switch App", description: "Managed Services", action: () => { window.location.href = "/msp/"; } },
];

const terraShortcuts: KeyboardShortcut[] = [
  { key: "M", description: "Go to Market Trends", category: "Navigation" },
  { key: "P", description: "Go to Deal Pipeline", category: "Navigation" },
  { key: "A", description: "Go to Analytics", category: "Navigation" },
  { key: "I", description: "Go to Investment Analysis", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(terraCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={terraShortcuts} appName="Terra" accentColor="#10b981">
          <div className="flex flex-col h-screen bg-terra-bg">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:text-sm focus:font-medium">
              Skip to main content
            </a>
            <EcosystemNav currentAppId="terra" currentAppName="Terra Real Estate Intelligence" accentColor="#10b981" />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
                <AppRouter />
              </main>
            </div>
          </div>
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            commands={terraCommands}
            appName="Terra"
            accentColor="#10b981"
          />
        </PowerUserProvider>
      </WouterRouter>
      <AgentCopilot config={terraConfig} />
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
