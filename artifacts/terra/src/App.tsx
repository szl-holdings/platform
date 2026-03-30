import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { beaconConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { WelcomeOverlay } from "@workspace/shared-ui/WelcomeOverlay";
import { TerraLayout } from "@/components/terra-layout";
import { Building2, Activity, Flame, Home, UserCheck, Users } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60_000, retry: 1 } },
});

const HomePage = lazy(() => import("@/pages/home"));
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

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-terra-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/distress-engine" component={DistressEngine} />
        <Route path="/deals" component={Deals} />
        <Route path="/listings" component={Listings} />
        <Route path="/leads" component={Leads} />
        <Route path="/team" component={Team} />
        <Route path="/market" component={Market} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/documents" component={Documents} />
        <Route path="/offers" component={Offers} />
        <Route path="/predictions" component={Predictions} />
        <Route path="/automations" component={Automations} />
        <Route>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Page not found</div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const terraCommands: CommandItem[] = [
  { id: "nav-home", label: "Command Center", icon: "🏢", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-dashboard", label: "Dashboard", icon: "📊", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/dashboard"); } },
  { id: "nav-distress", label: "Distress Engine", icon: "🔥", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/distress-engine"); } },
  { id: "nav-deals", label: "Deal Pipeline", icon: "⚡", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/deals"); } },
  { id: "nav-listings", label: "Listings", icon: "🏠", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/listings"); } },
  { id: "nav-leads", label: "Leads + CRM", icon: "👤", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/leads"); } },
  { id: "nav-team", label: "Team Performance", icon: "👥", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/team"); } },
  { id: "nav-market", label: "Market Intelligence", icon: "📈", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/market"); } },
];

const terraShortcuts: KeyboardShortcut[] = [
  { key: "D", description: "Distress Engine", category: "Navigation" },
  { key: "L", description: "Listings", category: "Navigation" },
  { key: "T", description: "Team", category: "Navigation" },
];

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(terraCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <PowerUserProvider shortcuts={terraShortcuts} appName="Terra" accentColor="#a07848">
          <div className="flex flex-col h-screen bg-terra-bg">
            <EcosystemNav currentAppId="terra" currentAppName="Terra" accentColor="#a07848" />
            <div className="flex-1 overflow-hidden">
              <TerraLayout>
                <Router />
              </TerraLayout>
            </div>
          </div>
          <CommandPalette
            open={cmdOpen}
            onClose={() => setCmdOpen(false)}
            commands={terraCommands}
            appName="Terra"
            accentColor="#a07848"
          />
        </PowerUserProvider>
        <WelcomeOverlay
          appId="terra"
          appName="Terra"
          subtitle="Real Estate Broker Platform"
          description="Terra turns listings, broker workflow, and market visibility into command. Distress engine, deal pipeline, listing intelligence, and lead routing — all in one platform."
          accentColor="#a07848"
          icon={Building2}
          features={[
            { icon: Flame, title: "Distress Engine", description: "NYC pre-foreclosure tracking, auction intelligence, and opportunity scoring in real time" },
            { icon: Activity, title: "Deal Pipeline", description: "Track acquisitions and dispositions through every stage from sourcing to closing" },
            { icon: Home, title: "Listing Intelligence", description: "Active listings, market comps, and off-market deal discovery" },
            { icon: UserCheck, title: "Leads + CRM", description: "Broker and agent lead management, routing, and conversion tracking" },
          ]}
        />
      </WouterRouter>
      <AgentCopilot config={beaconConfig} />
    </QueryClientProvider>
  );
}

export default App;
