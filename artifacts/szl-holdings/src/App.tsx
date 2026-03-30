import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { IncaAgentIndicator } from "@workspace/shared-ui/inca-agent-indicator";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturedVentures } from "@/components/FeaturedVentures";
import { PortfolioStrip } from "@/components/PortfolioStrip";
import { AlloyStrip } from "@/components/AlloyStrip";
import { StrategicThesis } from "@/components/StrategicThesis";
import { Milestones } from "@/components/Milestones";
import { LatestDevelopments } from "@/components/LatestDevelopments";
import { TrustSection } from "@/components/TrustSection";
import { ContactCTA } from "@/components/ContactCTA";
import { Footer } from "@/components/Footer";

const PortfolioPage = lazy(() => import("@/pages/portfolio"));
const FounderPage = lazy(() => import("@/pages/founder"));
const VentureDetailPage = lazy(() => import("@/pages/venture-detail"));
const ContactPage = lazy(() => import("@/pages/contact"));
const InsightsPage = lazy(() => import("@/pages/insights"));
const InsightsArticlePage = lazy(() => import("@/pages/insights-article"));
const Changelog = lazy(() => import("@/pages/changelog"));
const Roadmap = lazy(() => import("@/pages/roadmap"));
const PortfolioIntel = lazy(() => import("@/pages/portfolio-intel"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false, staleTime: 5 * 60 * 1000 },
  },
});

function PageLoader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "hsl(210,12%,5%)",
      }}
    >
      <div style={{
        width: "24px",
        height: "24px",
        border: "2px solid hsla(0,0%,100%,0.10)",
        borderTopColor: "hsl(210,8%,72%)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
    </div>
  );
}

function HomePage() {
  useEffect(() => {
    document.title = "SZL Holdings — Strategic Technology Portfolio";
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />
      <Hero />
      <FeaturedVentures />
      <PortfolioStrip />
      <StrategicThesis />
      <AlloyStrip />
      <Milestones />
      <LatestDevelopments />
      <TrustSection />
      <ContactCTA />
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
              <Suspense fallback={<PageLoader />}><HomePage /></Suspense>
            </Route>
            <Route path="/portfolio">
              <Suspense fallback={<PageLoader />}><PortfolioPage /></Suspense>
            </Route>
            <Route path="/founder">
              <Suspense fallback={<PageLoader />}><FounderPage /></Suspense>
            </Route>
            <Route path="/ventures/:id">
              <Suspense fallback={<PageLoader />}><VentureDetailPage /></Suspense>
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
