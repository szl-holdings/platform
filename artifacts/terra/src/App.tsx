import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { terraConfig } from "@workspace/shared-ui/copilot-configs";
import { IncaAgentIndicator } from "@workspace/shared-ui/inca-agent-indicator";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";
import { Building2, Activity, Users, Brain, Zap, FileText, ClipboardList, Home, UserCheck, ArrowLeftRight, Flame } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60_000, retry: 2 } },
});

const DashboardPage = lazy(() => import("@/pages/dashboard"));
const ListingsPage = lazy(() => import("@/pages/listings"));
const LeadsPage = lazy(() => import("@/pages/leads"));
const DealsPage = lazy(() => import("@/pages/deals"));
const OffersPage = lazy(() => import("@/pages/offers"));
const TransactionsPage = lazy(() => import("@/pages/transactions"));
const DocumentsPage = lazy(() => import("@/pages/documents"));
const TeamPage = lazy(() => import("@/pages/team"));
const PredictionsPage = lazy(() => import("@/pages/predictions"));
const AutomationsPage = lazy(() => import("@/pages/automations"));
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
const AgentInsightsPage = lazy(() => import("@/pages/agent-insights"));
const DistressEnginePage = lazy(() => import("@/pages/distress-engine"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-terra-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/listings" component={ListingsPage} />
        <Route path="/leads" component={LeadsPage} />
        <Route path="/deals" component={DealsPage} />
        <Route path="/offers" component={OffersPage} />
        <Route path="/transactions" component={TransactionsPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/team" component={TeamPage} />
        <Route path="/predictions" component={PredictionsPage} />
        <Route path="/automations" component={AutomationsPage} />
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
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route path="/distress-engine" component={DistressEnginePage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-terra-text-secondary">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

function navigate(path: string) {
  window.location.href = window.location.pathname.replace(/\/[^/]*$/, path);
}

const terraCommands: CommandItem[] = [
  { id: "nav-dashboard", label: "Command Center", icon: "🏢", group: "Navigation", keywords: ["home", "overview", "dashboard"], action: () => navigate("/") },
  { id: "nav-distress", label: "Distress Engine", icon: "🔥", group: "Deal Discovery", keywords: ["foreclosure", "auction", "reo", "lien", "distress", "nyc"], action: () => navigate("/distress-engine") },
  { id: "nav-listings", label: "Listings + Inventory", icon: "🏠", group: "Navigation", action: () => navigate("/listings") },
  { id: "nav-leads", label: "Leads + CRM", icon: "👤", group: "Navigation", action: () => navigate("/leads") },
  { id: "nav-deals", label: "Deal Pipeline", icon: "🔄", group: "Navigation", action: () => navigate("/deals") },
  { id: "nav-offers", label: "Offers + Negotiation", icon: "🤝", group: "Navigation", action: () => navigate("/offers") },
  { id: "nav-transactions", label: "Transactions", icon: "📋", group: "Navigation", action: () => navigate("/transactions") },
  { id: "nav-documents", label: "Documents + Compliance", icon: "📄", group: "Navigation", action: () => navigate("/documents") },
  { id: "nav-team", label: "Team Performance", icon: "👥", group: "Intelligence", action: () => navigate("/team") },
  { id: "nav-predictions", label: "Nimbus Intelligence", icon: "🧠", group: "Intelligence", action: () => navigate("/predictions") },
  { id: "nav-automations", label: "AlloyScape Automations", icon: "⚡", group: "Platform", action: () => navigate("/automations") },
  { id: "app-firestorm", label: "Switch to Firestorm", icon: "🔥", group: "Switch App", description: "Security Simulation", action: () => { window.location.href = "/firestorm/"; } },
  { id: "app-msp", label: "Switch to Evolve MSP", icon: "💻", group: "Switch App", description: "Managed Services", action: () => { window.location.href = "/msp/"; } },
];

const terraShortcuts: KeyboardShortcut[] = [
  { key: "L", description: "Go to Listings", category: "Navigation" },
  { key: "D", description: "Go to Deal Pipeline", category: "Navigation" },
  { key: "T", description: "Go to Team Performance", category: "Navigation" },
  { key: "N", description: "Go to Nimbus Intelligence", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(terraCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={terraShortcuts} appName="Terra" accentColor="#5e9a32">
          <div className="flex flex-col h-screen bg-terra-bg">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:text-sm focus:font-medium">
              Skip to main content
            </a>
            <EcosystemNav currentAppId="terra" currentAppName="Terra Brokerage OS" accentColor="#5e9a32" />
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
            accentColor="#5e9a32"
          />
          <IncaAgentIndicator
            agentName="Nimbus"
            systemType="mama-quilla"
            currentTask="Analyzing deal health signals and stall risk across active pipeline"
            confidence={0.89}
          />
        </PowerUserProvider>
        <WelcomeOverlay
          appId="terra"
          appName="Terra"
          subtitle="Brokerage Command Platform"
          description="A full brokerage operating system — listings, leads, 15-stage deal pipeline, offers, transactions, documents, team performance, Nimbus AI intelligence, and AlloyScape automation."
          accentColor="#5e9a32"
          icon={Building2}
          features={[
            { icon: Activity, title: "Deal Pipeline", description: "15-stage kanban with close probability and stall risk" },
            { icon: UserCheck, title: "Leads + CRM", description: "Conversion scoring, engagement tracking, and follow-up management" },
            { icon: Brain, title: "Nimbus Intelligence", description: "AI predictions with confidence, rationale, and next actions" },
            { icon: Zap, title: "AlloyScape", description: "Workflow automation with audit trail and retry queue" },
          ]}
        />
      </WouterRouter>
      <AgentCopilot config={terraConfig} />
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
