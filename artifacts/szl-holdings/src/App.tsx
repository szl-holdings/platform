import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Portfolio } from "@/components/Portfolio";
import { Leadership } from "@/components/Leadership";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { IncaAgentIndicator } from "@workspace/shared-ui/inca-agent-indicator";

const ObservabilityPage = lazy(() => import("@/pages/observability"));
const EcosystemViz = lazy(() => import("@/pages/ecosystem-viz"));
const MATracker = lazy(() => import("@/pages/ma-tracker"));
const PortfolioIntel = lazy(() => import("@/pages/portfolio-intel"));
const VenturesThesis = lazy(() => import("@/pages/ventures-thesis"));
const Newsroom = lazy(() => import("@/pages/newsroom"));
const InvestorRelations = lazy(() => import("@/pages/investor-relations"));
const SpectrumAnalytics = lazy(() => import("@/pages/spectrum-analytics"));
const Changelog = lazy(() => import("@/pages/changelog"));
const Roadmap = lazy(() => import("@/pages/roadmap"));
const InsightsPage = lazy(() => import("@/pages/insights"));
const InsightsArticlePage = lazy(() => import("@/pages/insights-article"));
const CommandCenter = lazy(() => import("@/pages/command-center"));
const AdminPage = lazy(() => import("@/pages/admin"));
const AnalyticsDashboard = lazy(() => import("@/pages/analytics"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false, staleTime: 5 * 60 * 1000 },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function CorporateSite() {
  useEffect(() => {
    const prev = document.title;
    document.title = "SZL Holdings | Corporate Overview – Technology Holding Company";
    return () => { document.title = prev; };
  }, []);
  return (
    <div className="min-h-screen bg-szl-bg">
      <Navbar />
      <Hero />
      <Portfolio />
      <Leadership />
      <Contact />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domMax} strict>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/">
              <Suspense fallback={<PageLoader />}><CommandCenter /></Suspense>
            </Route>
            <Route path="/corporate" component={CorporateSite} />
            <Route path="/admin">
              <Suspense fallback={<PageLoader />}><AdminPage /></Suspense>
            </Route>
            <Route path="/analytics">
              <Suspense fallback={<PageLoader />}><AnalyticsDashboard /></Suspense>
            </Route>
            <Route path="/spectrum">
              <Suspense fallback={<PageLoader />}><SpectrumAnalytics /></Suspense>
            </Route>
            <Route path="/changelog">
              <Suspense fallback={<PageLoader />}><Changelog /></Suspense>
            </Route>
            <Route path="/roadmap">
              <Suspense fallback={<PageLoader />}><Roadmap /></Suspense>
            </Route>
            <Route path="/observability">
              <Suspense fallback={<PageLoader />}><ObservabilityPage /></Suspense>
            </Route>
            <Route path="/ecosystem">
              <Suspense fallback={<PageLoader />}><EcosystemViz /></Suspense>
            </Route>
            <Route path="/ma-tracker">
              <Suspense fallback={<PageLoader />}><MATracker /></Suspense>
            </Route>
            <Route path="/portfolio">
              <Suspense fallback={<PageLoader />}><PortfolioIntel /></Suspense>
            </Route>
            <Route path="/thesis">
              <Suspense fallback={<PageLoader />}><VenturesThesis /></Suspense>
            </Route>
            <Route path="/newsroom">
              <Suspense fallback={<PageLoader />}><Newsroom /></Suspense>
            </Route>
            <Route path="/ir">
              <Suspense fallback={<PageLoader />}><InvestorRelations /></Suspense>
            </Route>
            <Route path="/insights/:slug">
              <Suspense fallback={<PageLoader />}><InsightsArticlePage /></Suspense>
            </Route>
            <Route path="/insights">
              <Suspense fallback={<PageLoader />}><InsightsPage /></Suspense>
            </Route>
            <Route>
              <Suspense fallback={<PageLoader />}><CommandCenter /></Suspense>
            </Route>
          </Switch>
        </WouterRouter>
        <IncaAgentIndicator agentName="Portfolio Analyst" systemType="mama-quilla" currentTask="Cross-correlating portfolio performance against macro indicators" confidence={0.90} />
      </LazyMotion>
    </QueryClientProvider>
  );
}

export default App;
