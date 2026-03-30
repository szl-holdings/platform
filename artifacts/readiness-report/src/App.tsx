import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { compassConfig } from "@workspace/shared-ui/copilot-configs";

// Pages
import Dashboard from "@/pages/dashboard";
import Scorecards from "@/pages/scorecards";
import Milestones from "@/pages/milestones";
import Risks from "@/pages/risks";
import Alerts from "@/pages/alerts";
import Trends from "@/pages/trends";
import Rollup from "@/pages/rollup";
import AIInsights from "@/pages/ai-insights";
import VitalSigns from "@/pages/vital-signs";
import NotFound from "@/pages/not-found";
import ObservabilityPage from "@/pages/observability";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    }
  }
});

function Router() {
  return (
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      <AgentCopilot config={compassConfig} />
    </QueryClientProvider>
  );
}

export default App;
