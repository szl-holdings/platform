import { lazy, Suspense, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { SandboxModeProvider, SandboxModeBanner, AnalyticsProvider } from "@szl-holdings/shared-ui";
import { McpOverlay } from "@szl-holdings/mcp-client";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { beaconConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@szl-holdings/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@szl-holdings/shared-ui/keyboard-shortcuts";
import { TerraLayout } from "@/components/terra-layout";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";

const TERRA_ACCENT = LANE_ACCENT_HEX.terra.primary;

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60_000, retry: 1 } },
});

const TerraAtlasArtifactsPage = lazy(() => import("@/pages/atlas-artifacts"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const DistressEngine = lazy(() => import("@/pages/distress-engine"));
const Deals = lazy(() => import("@/pages/deals"));
const Listings = lazy(() => import("@/pages/listings"));
const Leads = lazy(() => import("@/pages/leads"));
const Team = lazy(() => import("@/pages/team"));
const Market = lazy(() => import("@/pages/market"));
const Transactions = lazy(() => import("@/pages/transactions"));
const Documents = lazy(() => import("@/pages/documents"));
const Offers = lazy(() => import("@/pages/offers"));
const Predictions = lazy(() => import("@/pages/predictions"));
const Automations = lazy(() => import("@/pages/automations"));
const BrokerOverview = lazy(() => import("@/pages/broker-overview"));
const Ingestion = lazy(() => import("@/pages/ingestion"));
const InvestorMode = lazy(() => import("@/pages/investor-mode"));
const Pipeline = lazy(() => import("@/pages/pipeline"));
const TerraMarketingLanding = lazy(() => import("@/pages/marketing-landing"));
const CommercialIntelligence = lazy(() => import("@/pages/commercial-intelligence"));
const MarketIntelligence = lazy(() => import("@/pages/market-intelligence"));
const MarketAnalytics = lazy(() => import("@/pages/market-analytics"));
const ComparableSales = lazy(() => import("@/pages/comparable-sales"));
const PortfolioDashboard = lazy(() => import("@/pages/portfolio-dashboard"));
const DistressPipeline = lazy(() => import("@/pages/distress-pipeline"));
const PropertyMapPage = lazy(() => import("@/pages/property-map-page"));
const PropertyDetail = lazy(() => import("@/pages/property-detail"));
const PowerBiReport = lazy(() => import("@/pages/powerbi-report"));
const DocumentEngine = lazy(() => import("@/pages/document-engine"));
const InquiriesPage = lazy(() => import("@/pages/inquiries-command"));
const AgentsPage = lazy(() => import("@/pages/agents-command"));
const CaseStudyPage = lazy(() => import("@/pages/case-study"));
const TerraPerricingPage = lazy(() => import("@/pages/pricing"));
const LenderReport = lazy(() => import("@/pages/lender-report"));
const PropertyDesk = lazy(() => import("@/pages/property-desk"));
const WhatChanged = lazy(() => import("@/pages/what-changed"));
const DiligencePrep = lazy(() => import("@/pages/diligence-prep"));
const ReadinessBoard = lazy(() => import("@/pages/readiness-board"));
const ApprovalReview = lazy(() => import("@/pages/approval-review"));
const ReadinessGraph = lazy(() => import("@/pages/readiness-graph"));
const VendorReliability = lazy(() => import("@/pages/vendor-reliability"));
const CountdownEngine = lazy(() => import("@/pages/countdown-engine"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(45,106,79,0.2)", borderTopColor: TERRA_ACCENT }} />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex items-center justify-center h-64 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
      Page not found
    </div>
  );
}

function PrivateRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/home" component={() => <Redirect to="/dashboard" />} />
        <Route path="/distress-engine" component={DistressEngine} />
        <Route path="/deals" component={Deals} />
        <Route path="/listings" component={Listings} />
        <Route path="/leads" component={Leads} />
        <Route path="/team" component={Team} />
        <Route path="/inquiries" component={InquiriesPage} />
        <Route path="/agents" component={AgentsPage} />
        <Route path="/case-study" component={CaseStudyPage} />
        <Route path="/market" component={Market} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/documents" component={Documents} />
        <Route path="/offers" component={Offers} />
        <Route path="/predictions" component={Predictions} />
        <Route path="/automations" component={Automations} />
        <Route path="/broker-overview" component={BrokerOverview} />
        <Route path="/ingestion" component={Ingestion} />
        <Route path="/commercial" component={CommercialIntelligence} />
        <Route path="/market-intelligence" component={MarketIntelligence} />
        <Route path="/market-analytics" component={MarketAnalytics} />
        <Route path="/comparable-sales" component={ComparableSales} />
        <Route path="/distress-pipeline" component={DistressPipeline} />
        <Route path="/portfolio-dashboard" component={PortfolioDashboard} />
        <Route path="/investor-mode" component={InvestorMode} />
        <Route path="/pipeline" component={Pipeline} />
        <Route path="/property-map" component={PropertyMapPage} />
        <Route path="/property/:id" component={PropertyDetail} />
        <Route path="/powerbi" component={PowerBiReport} />
        <Route path="/document-engine" component={DocumentEngine} />
        <Route path="/document-engine/:sub" component={DocumentEngine} />
        <Route path="/atlas-artifacts" component={TerraAtlasArtifactsPage} />
        <Route path="/pricing" component={TerraPerricingPage} />
        <Route path="/lender-report" component={LenderReport} />
        <Route path="/property-desk" component={PropertyDesk} />
        <Route path="/what-changed" component={WhatChanged} />
        <Route path="/diligence-prep" component={DiligencePrep} />
        <Route path="/readiness-board" component={ReadinessBoard} />
        <Route path="/approval-review" component={ApprovalReview} />
        <Route path="/readiness-graph" component={ReadinessGraph} />
        <Route path="/vendor-reliability" component={VendorReliability} />
        <Route path="/countdown-engine" component={CountdownEngine} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

const terraCommands: CommandItem[] = [
  { id: "nav-dashboard", label: "Overview", icon: "◼", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard"); } },
  { id: "nav-distress", label: "Watchlists", icon: "⚠", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/distress-engine"); } },
  { id: "nav-market", label: "Market", icon: "↑", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/market"); } },
  { id: "nav-pipeline", label: "Pipeline", icon: "◈", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/pipeline"); } },
  { id: "nav-investor", label: "Ownership", icon: "⊛", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/investor-mode"); } },
  { id: "nav-deals", label: "Deals", icon: "◈", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/deals"); } },
  { id: "nav-leads", label: "Brokers", icon: "◎", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/leads"); } },
  { id: "nav-listings", label: "Portfolio", icon: "□", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/listings"); } },
  { id: "nav-approvals", label: "Approvals", icon: "✓", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/transactions"); } },
  { id: "nav-admin", label: "Admin", icon: "⊙", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/broker-overview"); } },
];

const terraShortcuts: KeyboardShortcut[] = [
  { key: "D", description: "Watchlists", category: "Navigation" },
  { key: "P", description: "Pipeline", category: "Navigation" },
  { key: "M", description: "Market", category: "Navigation" },
  { key: "E", description: "Deals", category: "Navigation" },
];

function PrivateApp({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  return (
    <PowerUserProvider shortcuts={terraShortcuts} appName="Terra" accentColor={TERRA_ACCENT}>
      <div className="flex flex-col h-screen" style={{ background: "#0a0c10" }}>
        <EcosystemNav currentAppId="terra" currentAppName="Terra — Property Intelligence" accentColor={TERRA_ACCENT} />
        <SandboxModeBanner />
        <div className="flex-1 overflow-hidden">
          <TerraLayout>
            <PrivateRouter />
          </TerraLayout>
        </div>
      </div>
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={terraCommands}
        appName="Terra"
        accentColor={TERRA_ACCENT}
      />
    </PowerUserProvider>
  );
}

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const { isLoading, isAuthenticated, login } = useAuth();
  const [, navigate] = useLocation();
  const prevAuth = useRef(isAuthenticated);

  const params = new URLSearchParams(window.location.search);
  const demoMode = params.get("view") === "app" || params.get("demo") === "true";

  useEffect(() => {
    if (!prevAuth.current && isAuthenticated) {
      navigate("/dashboard");
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, navigate]);

  if (demoMode) {
    return <PrivateApp cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />;
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0c10" }}>
        <div style={{ width: 22, height: 22, border: "2px solid rgba(45,106,79,0.2)", borderTopColor: TERRA_ACCENT, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<div style={{ height: "100vh", background: "#0a0c10" }} />}>
        <TerraMarketingLanding onSignIn={login} />
      </Suspense>
    );
  }

  return <PrivateApp cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />;
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(terraCommands);

  return (
    <AnalyticsProvider appName="terra">
    <PrismBusProvider domain="terra">
    <SandboxModeProvider>
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
          <AgentCopilot config={beaconConfig} />
          <Toaster />
          <McpOverlay domain="terra" />
        </WouterRouter>
      </QueryClientProvider>
    </SandboxModeProvider>
    </PrismBusProvider>
    </AnalyticsProvider>
  );
}

export default App;
