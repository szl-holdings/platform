import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { IncaAgentIndicator } from "@workspace/shared-ui/inca-agent-indicator";

const HomePage = lazy(() => import("@/pages/home"));
const PortfolioPage = lazy(() => import("@/pages/portfolio"));
const FounderPage = lazy(() => import("@/pages/founder"));
const VenturesPage = lazy(() => import("@/pages/ventures"));
const VentureDetailPage = lazy(() => import("@/pages/venture-detail"));
const ContactPage = lazy(() => import("@/pages/contact"));
const InsightsPage = lazy(() => import("@/pages/insights"));
const InsightsArticlePage = lazy(() => import("@/pages/insights-article"));
const Changelog = lazy(() => import("@/pages/changelog"));
const Roadmap = lazy(() => import("@/pages/roadmap"));
const PortfolioIntel = lazy(() => import("@/pages/portfolio-intel"));
const AboutPage = lazy(() => import("@/pages/about"));
const UpdatesPage = lazy(() => import("@/pages/updates"));
const LegalPrivacy = lazy(() => import("@/pages/legal-privacy"));
const LegalTerms = lazy(() => import("@/pages/legal-terms"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false, staleTime: 5 * 60 * 1000 },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-6 h-6 border-2 border-szl-border border-t-szl-primary rounded-full animate-spin" />
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
              <Suspense fallback={<PageLoader />}><HomePage /></Suspense>
            </Route>
            <Route path="/ventures">
              <Suspense fallback={<PageLoader />}><VenturesPage /></Suspense>
            </Route>
            <Route path="/ventures/:id">
              <Suspense fallback={<PageLoader />}><VentureDetailPage /></Suspense>
            </Route>
            <Route path="/about">
              <Suspense fallback={<PageLoader />}><AboutPage /></Suspense>
            </Route>
            <Route path="/updates">
              <Suspense fallback={<PageLoader />}><UpdatesPage /></Suspense>
            </Route>
            <Route path="/portfolio">
              <Redirect to="/ventures" />
            </Route>
            <Route path="/founder">
              <Suspense fallback={<PageLoader />}><FounderPage /></Suspense>
            </Route>
            <Route path="/contact">
              <Suspense fallback={<PageLoader />}><ContactPage /></Suspense>
            </Route>
            <Route path="/insights/:slug">
              <Suspense fallback={<PageLoader />}><InsightsArticlePage /></Suspense>
            </Route>
            <Route path="/insights">
              <Suspense fallback={<PageLoader />}><InsightsPage /></Suspense>
            </Route>
            <Route path="/changelog">
              <Suspense fallback={<PageLoader />}><Changelog /></Suspense>
            </Route>
            <Route path="/roadmap">
              <Suspense fallback={<PageLoader />}><Roadmap /></Suspense>
            </Route>
            <Route path="/portfolio-intel">
              <Suspense fallback={<PageLoader />}><PortfolioIntel /></Suspense>
            </Route>
            <Route path="/legal/privacy">
              <Suspense fallback={<PageLoader />}><LegalPrivacy /></Suspense>
            </Route>
            <Route path="/legal/terms">
              <Suspense fallback={<PageLoader />}><LegalTerms /></Suspense>
            </Route>
            <Route>
              <Suspense fallback={<PageLoader />}><HomePage /></Suspense>
            </Route>
          </Switch>
        </WouterRouter>
      </LazyMotion>
      <IncaAgentIndicator agentName="Portfolio Analyst" systemType="inti" currentTask="Monitoring portfolio performance metrics" confidence={0.88} />
    </QueryClientProvider>
  );
}

export default App;
