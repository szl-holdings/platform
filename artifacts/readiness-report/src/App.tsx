import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { EcosystemNav } from "@workspace/shared-ui/ecosystem-nav";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/toaster";
import { TooltipProvider } from "@workspace/shared-ui/ui/tooltip";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { compassConfig } from "@workspace/shared-ui/copilot-configs";

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <EcosystemNav currentAppId="readiness-report" currentAppName="Readiness Report" accentColor="#84cc16" />
            <div style={{ flex: 1 }}>
              <Router />
            </div>
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      <AgentCopilot config={compassConfig} />
    </QueryClientProvider>
  );
}

export default App;
