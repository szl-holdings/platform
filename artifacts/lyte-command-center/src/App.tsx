import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { beaconConfig } from "@workspace/shared-ui/copilot-configs";

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
const AnomalyDetection = lazy(() => import("@/pages/anomaly-detection"));
const SLOTracking = lazy(() => import("@/pages/slo-tracking"));
const CloudCost = lazy(() => import("@/pages/cloud-cost"));
const OnCallManagement = lazy(() => import("@/pages/oncall-management"));

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
        <Route path="/meridian-analytics" component={MeridianAnalytics} />
        <Route path="/anomaly-detection" component={AnomalyDetection} />
        <Route path="/slo-tracking" component={SLOTracking} />
        <Route path="/cloud-cost" component={CloudCost} />
        <Route path="/oncall" component={OnCallManagement} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Layout>
          <Router />
        </Layout>
      </WouterRouter>
      <AgentCopilot config={beaconConfig} />
    </QueryClientProvider>
  );
}

export default App;
