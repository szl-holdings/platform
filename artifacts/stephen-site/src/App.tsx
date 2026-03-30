import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/toaster";
import { TooltipProvider } from "@workspace/shared-ui/ui/tooltip";
import { AgentCopilot } from "@workspace/shared-ui/copilot";
import { stephenAIConfig } from "@workspace/shared-ui/copilot-configs";
import { Server, AlertTriangle } from "lucide-react";

const Home = lazy(() => import("@/pages/Home").then(m => ({ default: m.Home || m.default })));
const NotFound = lazy(() => import("@/pages/not-found"));
const CheckoutSuccess = lazy(() => import("@/pages/checkout-success"));
const CheckoutCancel = lazy(() => import("@/pages/checkout-cancel"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const FinancialResearch = lazy(() => import("@/pages/financial-research"));
const HackajobProfile = lazy(() => import("@/pages/hackajob-profile"));
const CareerCommand = lazy(() => import("@/pages/career-command"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

interface AppHealthSummary {
  services: { name: string; status: string }[];
  summary: { total: number; liveConfigured: number; mockedDemoMode: number; manualRequired: number };
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function DemoModeBanner() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ["app-health-stephen"],
    queryFn: () => fetch("/api/services/health/app/stephen-site").then((r) => r.json()),
    refetchInterval: 120000,
  });

  if (!data) return null;

  const hasDemoMode = data.summary.mockedDemoMode > 0;
  const hasUnhealthy = data.summary.manualRequired > 0;
  if (!hasDemoMode && !hasUnhealthy) return null;

  const demoNames = data.services.filter((s) => s.status === "MOCKED_DEMO_MODE").map((s) => s.name);

  if (hasUnhealthy) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/10 border-b border-red-500/30 px-4 py-2 flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-xs text-red-400 font-medium">{data.summary.manualRequired} integration(s) not configured</span>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/10 backdrop-blur-sm border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-2">
      <Server className="w-4 h-4 text-amber-400" />
      <span className="text-xs text-amber-400 font-medium">Demo Mode</span>
      <span className="text-xs text-amber-400/60">— {demoNames.join(", ")} using simulated data</span>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/financial-research" component={FinancialResearch} />
        <Route path="/hackajob" component={HackajobProfile} />
        <Route path="/career" component={CareerCommand} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  if (typeof document !== "undefined") {
    document.documentElement.classList.add("dark");
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <DemoModeBanner />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      <AgentCopilot config={stephenAIConfig} />
    </QueryClientProvider>
  );
}

export default App;
