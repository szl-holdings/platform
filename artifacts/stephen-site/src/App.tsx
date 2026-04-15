import { lazy, Suspense } from "react";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { stephenAIConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@szl-holdings/shared-ui/ui/toaster";
import { McpOverlay } from "@szl-holdings/mcp-client";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { AnalyticsProvider } from "@szl-holdings/shared-ui";
import { TooltipProvider } from "@szl-holdings/shared-ui/ui/tooltip";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";

const StephenPulse = lazy(() => import("@/pages/pulse"));
const Home = lazy(() => import("@/pages/Home").then(m => ({ default: m.Home })));
const Work = lazy(() => import("@/pages/Work").then(m => ({ default: m.Work })));
const WorkDetail = lazy(() => import("@/pages/WorkDetail").then(m => ({ default: m.WorkDetail })));
const Thesis = lazy(() => import("@/pages/Thesis").then(m => ({ default: m.Thesis })));
const Writing = lazy(() => import("@/pages/Writing").then(m => ({ default: m.Writing })));
const WritingDetail = lazy(() => import("@/pages/WritingDetail").then(m => ({ default: m.WritingDetail })));
const About = lazy(() => import("@/pages/About").then(m => ({ default: m.About })));
const Contact = lazy(() => import("@/pages/Contact").then(m => ({ default: m.Contact })));
const Downloads = lazy(() => import("@/pages/Downloads").then(m => ({ default: m.Downloads })));
const LegalPrivacy = lazy(() => import("@/pages/legal-privacy").then(m => ({ default: m.LegalPrivacy })));
const LegalTerms = lazy(() => import("@/pages/legal-terms").then(m => ({ default: m.LegalTerms })));

// Legacy pages
const NotFound = lazy(() => import("@/pages/not-found"));
const CheckoutSuccess = lazy(() => import("@/pages/checkout-success"));
const CheckoutCancel = lazy(() => import("@/pages/checkout-cancel"));
const ObservabilityPage = lazy(() => import("@/pages/observability"));
const OperatingPhilosophy = lazy(() => import("@/pages/operating-philosophy"));
const FinancialResearch = lazy(() => import("@/pages/financial-research"));
const HackajobProfile = lazy(() => import("@/pages/hackajob-profile"));
const CareerCommand = lazy(() => import("@/pages/career-command"));
const Speaking = lazy(() => import("@/pages/speaking"));
const ContentStudio = lazy(() => import("@/pages/content-studio"));
const AudienceIntelligence = lazy(() => import("@/pages/audience-intelligence"));
const AdvisoryPipeline = lazy(() => import("@/pages/advisory-pipeline"));
const ThesisTracker = lazy(() => import("@/pages/thesis-tracker"));
const InfluenceMetrics = lazy(() => import("@/pages/influence-metrics"));
const NetworkGraph = lazy(() => import("@/pages/network-graph"));

// Creator Economy OS
const MediaRelations = lazy(() => import("@/pages/media-relations"));
const RevenueIntelligence = lazy(() => import("@/pages/revenue-intelligence"));
const ContentCalendar = lazy(() => import("@/pages/content-calendar"));
const DigitalProducts = lazy(() => import("@/pages/digital-products"));
const BrandHealth = lazy(() => import("@/pages/brand-health"));
const MonetizationAI = lazy(() => import("@/pages/monetization-ai"));
const ThoughtResonanceEngine = lazy(() => import("@/pages/thought-resonance-engine"));

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
          <div className="absolute inset-0 flex items-center justify-center font-bold text-primary tracking-tighter text-xl">SL</div>
        </div>
        <div className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase animate-pulse">Loading</div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Primary nav routes */}
        <Route path="/pulse" component={StephenPulse} />
        <Route path="/" component={Home} />
        <Route path="/work/:slug" component={WorkDetail} />
        <Route path="/work" component={Work} />
        <Route path="/thesis" component={Thesis} />
        <Route path="/writing/:slug" component={WritingDetail} />
        <Route path="/writing" component={Writing} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/downloads" component={Downloads} />
        <Route path="/legal/privacy" component={LegalPrivacy} />
        <Route path="/legal/terms" component={LegalTerms} />

        {/* Legacy routes preserved */}
        <Route path="/career" component={CareerCommand} />
        <Route path="/financial-research" component={FinancialResearch} />
        <Route path="/hackajob" component={HackajobProfile} />
        <Route path="/checkout/success" component={CheckoutSuccess} />
        <Route path="/checkout/cancel" component={CheckoutCancel} />
        <Route path="/observability" component={ObservabilityPage} />
        <Route path="/philosophy" component={OperatingPhilosophy} />
        <Route path="/thought-leadership">
          <Redirect to="/writing" />
        </Route>
        <Route path="/speaking" component={Speaking} />
        <Route path="/content-studio" component={ContentStudio} />
        <Route path="/audience" component={AudienceIntelligence} />
        <Route path="/pipeline" component={AdvisoryPipeline} />
        <Route path="/thesis-tracker" component={ThesisTracker} />
        <Route path="/influence" component={InfluenceMetrics} />
        <Route path="/network" component={NetworkGraph} />

        {/* Creator Economy OS */}
        <Route path="/media" component={MediaRelations} />
        <Route path="/revenue" component={RevenueIntelligence} />
        <Route path="/content-calendar" component={ContentCalendar} />
        <Route path="/products" component={DigitalProducts} />
        <Route path="/brand-health" component={BrandHealth} />
        <Route path="/monetization" component={MonetizationAI} />
        <Route path="/thought-resonance" component={ThoughtResonanceEngine} />

        <Route path="/case-studies">
          <Redirect to="/work" />
        </Route>
        <Route path="/tech-stack">
          <Redirect to="/thesis" />
        </Route>
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
    <AnalyticsProvider appName="stephen">
    <PrismBusProvider domain="stephen">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <EcosystemNav currentAppId="stephen-site" currentAppName="Stephen Lutar" accentColor="#94a3b8" />
            <div style={{ flex: 1 }}>
              <Router />
            </div>
          </div>
        </WouterRouter>
        <Toaster />
        <McpOverlay domain="stephen" />
        <AgentCopilot config={stephenAIConfig} />
      </TooltipProvider>
    </QueryClientProvider>
    </PrismBusProvider>
    </AnalyticsProvider>
  );
}

export default App;
