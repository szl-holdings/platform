import { lazy, Suspense, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { beaconConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { TerraLayout } from "@/components/terra-layout";
import { useAuth } from "@workspace/replit-auth-web";
import { Toaster } from "@workspace/shared-ui/ui/sonner";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60_000, retry: 1 } },
});

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
const PropertyMapPage = lazy(() => import("@/pages/property-map-page"));
const PropertyDetail = lazy(() => import("@/pages/property-detail"));
const PowerBiReport = lazy(() => import("@/pages/powerbi-report"));
const DocumentEngine = lazy(() => import("@/pages/document-engine"));
const InquiriesPage = lazy(() => import("@/pages/inquiries-command"));
const AgentsPage = lazy(() => import("@/pages/agents-command"));
const CaseStudyPage = lazy(() => import("@/pages/case-study"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "rgba(45,106,79,0.2)", borderTopColor: "#40856a" }} />
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
        <Route path="/investor-mode" component={InvestorMode} />
        <Route path="/pipeline" component={Pipeline} />
        <Route path="/property-map" component={PropertyMapPage} />
        <Route path="/property/:id" component={PropertyDetail} />
        <Route path="/powerbi" component={PowerBiReport} />
        <Route path="/document-engine" component={DocumentEngine} />
        <Route path="/document-engine/:sub" component={DocumentEngine} />
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
    <PowerUserProvider shortcuts={terraShortcuts} appName="Terra" accentColor="#40856a">
      <div className="flex flex-col h-screen" style={{ background: "#0a0c10" }}>
        <EcosystemNav currentAppId="terra" currentAppName="Terra — Property Intelligence" accentColor="#40856a" />
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
        accentColor="#40856a"
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
        <div style={{ width: 22, height: 22, border: "2px solid rgba(45,106,79,0.2)", borderTopColor: "#40856a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
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
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
        <AgentCopilot config={beaconConfig} />
        <Toaster />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
