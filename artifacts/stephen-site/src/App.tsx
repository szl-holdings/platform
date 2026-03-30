import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@workspace/shared-ui/ui/toaster";
import { TooltipProvider } from "@workspace/shared-ui/ui/tooltip";

const Home = lazy(() => import("@/pages/Home").then(m => ({ default: m.Home })));
const NotFound = lazy(() => import("@/pages/not-found"));
const CheckoutSuccess = lazy(() => import("@/pages/checkout-success"));
const CheckoutCancel = lazy(() => import("@/pages/checkout-cancel"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const FinancialResearch = lazy(() => import("@/pages/financial-research"));
const HackajobProfile = lazy(() => import("@/pages/hackajob-profile"));
const CareerCommand = lazy(() => import("@/pages/career-command"));
const ThoughtLeadership = lazy(() => import("@/pages/thought-leadership"));
const Speaking = lazy(() => import("@/pages/speaking"));
const CaseStudies = lazy(() => import("@/pages/case-studies"));
const TechStack = lazy(() => import("@/pages/tech-stack"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center font-bold text-primary tracking-tighter text-xl">
            SL
          </div>
        </div>
        <div className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase animate-pulse">
          Loading Experience
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/career" component={CareerCommand} />
        <Route path="/financial-research" component={FinancialResearch} />
        <Route path="/hackajob" component={HackajobProfile} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/thought-leadership" component={ThoughtLeadership} />
        <Route path="/speaking" component={Speaking} />
        <Route path="/case-studies" component={CaseStudies} />
        <Route path="/tech-stack" component={TechStack} />
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
          <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center animate-pulse">
                <span className="font-serif font-bold text-primary text-lg">SL</span>
              </div>
            </div>
          }>
            <Router />
          </Suspense>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
