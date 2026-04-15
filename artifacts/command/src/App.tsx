import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router as WouterRouter, Switch, Route, useLocation } from "wouter";
import { Dashboard } from "./pages/dashboard";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { commandConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { MarketingHome } from "./pages/marketing";
import { MarketingAppPage } from "./pages/marketing/apps/[id]";
import { MarketingPricing } from "./pages/marketing/pricing";
import { MarketingSignup } from "./pages/marketing/signup";
import { MarketingOnboarding } from "./pages/marketing/onboarding";
import { MarketingStatus } from "./pages/marketing/status";
import { MarketingVerifyEmail } from "./pages/marketing/verify-email";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, staleTime: 30_000, retry: 1 },
  },
});

const BASE = import.meta.env.BASE_URL;

function AppShell() {
  const [location] = useLocation();
  const isMarketing = location.startsWith("/marketing");
  return (
    <>
      {!isMarketing && (
        <EcosystemNav currentAppId="command" currentAppName="Ecosystem Command" accentColor="#8b7ac8" />
      )}
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/marketing" component={MarketingHome} />
        <Route path="/marketing/apps/:id" component={MarketingAppPage} />
        <Route path="/marketing/pricing" component={MarketingPricing} />
        <Route path="/marketing/signup" component={MarketingSignup} />
        <Route path="/marketing/onboarding" component={MarketingOnboarding} />
        <Route path="/marketing/status" component={MarketingStatus} />
        <Route path="/marketing/verify-email" component={MarketingVerifyEmail} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={BASE.replace(/\/$/, "")}>
        <AppShell />
      </WouterRouter>
      <AgentCopilot config={commandConfig} />
    </QueryClientProvider>
  );
}

export default App;
