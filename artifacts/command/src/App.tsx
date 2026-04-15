import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter, Switch, Route } from "wouter";
import { Dashboard } from "./pages/dashboard";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { commandConfig } from "@szl-holdings/shared-ui/copilot-configs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

const BASE = import.meta.env.BASE_URL;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={BASE.replace(/\/$/, "")}>
        <EcosystemNav currentAppId="command" currentAppName="Ecosystem Command" accentColor="#8b7ac8" />
        <Switch>
          <Route path="/" component={Dashboard} />
        </Switch>
      </WouterRouter>
      <AgentCopilot config={commandConfig} />
    </QueryClientProvider>
  );
}

export default App;
