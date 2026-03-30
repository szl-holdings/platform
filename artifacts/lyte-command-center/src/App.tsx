import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { beaconConfig } from "@workspace/shared-ui/copilot-configs";
import Dashboard from "@/pages/dashboard";
import Signals from "@/pages/signals";
import Recommendations from "@/pages/recommendations";
import Incidents from "@/pages/incidents";
import Playbooks from "@/pages/playbooks";
import Commerce from "@/pages/commerce";
import IntelligencePage from "@/pages/intelligence";
import AIOps from "@/pages/ai-ops";
import NotFound from "@/pages/not-found";
import ObservabilityPage from "@/pages/observability";
import PortfolioObservability from "@/pages/portfolio-observability";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function Router() {
  return (
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
      <Route component={NotFound} />
    </Switch>
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
