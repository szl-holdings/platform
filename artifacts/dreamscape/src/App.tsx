import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { AlloyIntelligenceLayout } from "@/components/alloy-intelligence-layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { alloyPredictiveConfig } from "@workspace/shared-ui/copilot-configs";
import { CommandPalette, useCommandPalette, type CommandItem } from "@workspace/shared-ui/command-palette";
import { PowerUserProvider, type KeyboardShortcut } from "@workspace/shared-ui/keyboard-shortcuts";
import { Brain, TrendingUp } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 1000 * 60 * 5, retry: 1 },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const MarketingHomePage = lazy(() => import("@/pages/marketing-home"));
const PredictiveIntelligence = lazy(() => import("@/pages/predictive-intelligence"));
const RiskScenario = lazy(() => import("@/pages/risk-scenario"));
const ModelExplainability = lazy(() => import("@/pages/model-explainability"));
const OpportunityEngine = lazy(() => import("@/pages/opportunity-engine"));
const ForecastingCenter = lazy(() => import("@/pages/forecasting-center"));

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={PredictiveIntelligence} />
        <Route path="/risk" component={RiskScenario} />
        <Route path="/explainability" component={ModelExplainability} />
        <Route path="/opportunities" component={OpportunityEngine} />
        <Route path="/forecasting" component={ForecastingCenter} />
        <Route>
          <div className="flex items-center justify-center h-64 text-slate-400 text-sm">Page not found</div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const alloyPredictiveCommands: CommandItem[] = [
  { id: "nav-predictions", label: "Predictive Intelligence", icon: "🧠", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/"); } },
  { id: "nav-risk", label: "Risk Scenario Planning", icon: "⚠️", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/risk"); } },
  { id: "nav-explain", label: "Model Explainability", icon: "🔍", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/explainability"); } },
  { id: "nav-opp", label: "Opportunity Engine", icon: "🎯", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/opportunities"); } },
  { id: "nav-forecast", label: "Forecasting Center", icon: "📈", group: "Navigation", action: () => { window.location.href = window.location.pathname.replace(/\/[^/]*$/, "/forecasting"); } },
];

const alloyPredictiveShortcuts: KeyboardShortcut[] = [
  { key: "R", description: "Risk Scenario Planning", category: "Navigation" },
  { key: "E", description: "Model Explainability", category: "Navigation" },
  { key: "O", description: "Opportunity Engine", category: "Navigation" },
  { key: "F", description: "Forecasting Center", category: "Navigation" },
];

function AppContent({ cmdOpen, setCmdOpen }: { cmdOpen: boolean; setCmdOpen: (v: boolean) => void }) {
  const [location] = useLocation();
  const isDashboard = location !== "/" || location.startsWith("/risk") ||
    location.startsWith("/explainability") || location.startsWith("/opportunities") ||
    location.startsWith("/forecasting") || location.startsWith("/dashboard");

  if (location === "/") {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen bg-[#08060e]"><div className="w-6 h-6 border-2 border-purple-500/40 border-t-purple-400 rounded-full animate-spin" /></div>}>
        <MarketingHomePage />
      </Suspense>
    );
  }

  return (
    <PowerUserProvider shortcuts={alloyPredictiveShortcuts} appName="Alloy Predictive Intelligence" accentColor="#8b5cf6">
      <div className="flex flex-col h-screen bg-[#080c14]">
        <EcosystemNav currentAppId="alloy" currentAppName="Alloy — Predictive Intelligence" accentColor="#8b5cf6" />
        <div className="flex-1 overflow-hidden">
          <AlloyIntelligenceLayout>
            <Router />
          </AlloyIntelligenceLayout>
        </div>
      </div>
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={alloyPredictiveCommands}
        appName="Alloy Predictive Intelligence"
        accentColor="#8b5cf6"
      />
    </PowerUserProvider>
  );
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(alloyPredictiveCommands);

  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
      </WouterRouter>
      <AgentCopilot config={alloyPredictiveConfig} />
    </QueryClientProvider>
  );
}

export default App;
