import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { DemoModeProvider } from "@workspace/shared-ui";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FeaturedPlatforms } from "@/components/FeaturedPlatforms";
import { EcosystemLogic } from "@/components/EcosystemLogic";
import { AlloyBackbone } from "@/components/AlloyBackbone";
import { FounderBlock } from "@/components/FounderBlock";
import { ProofGrid } from "@/components/ProofGrid";
import { WhatItSolves } from "@/components/WhatItSolves";
import { ContactSegments } from "@/components/ContactSegments";
import { Footer } from "@/components/Footer";

const EcosystemPage = lazy(() => import("@/pages/ecosystem"));
const VenturesPage = lazy(() => import("@/pages/ventures"));
const FounderPage = lazy(() => import("@/pages/founder"));
const ContactPage = lazy(() => import("@/pages/contact"));
const LegalPrivacy = lazy(() => import("@/pages/legal-privacy"));
const LegalTerms = lazy(() => import("@/pages/legal-terms"));
const TrustCenter = lazy(() => import("@/pages/trust-center"));
const InvestorStory = lazy(() => import("@/pages/investor-story"));
const KpiDashboardPage = lazy(() => import("@/pages/kpi-dashboard"));

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
    document.title = "SZL Holdings | Premium Command Systems";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", "SZL Holdings is the parent ecosystem behind Alloy, Lyte, Vessels, and high-trust operating brands built for observability, command, and modern execution.");
    }
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <Navbar />
      <Hero />
      <FeaturedPlatforms />
      <EcosystemLogic />
      <AlloyBackbone />
      <FounderBlock />
      <ProofGrid />
      <WhatItSolves />
      <ContactSegments />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <DemoModeProvider>
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domMax} strict>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/">
              <HomePage />
            </Route>
            <Route path="/ecosystem">
              <Suspense fallback={<PageLoader />}><EcosystemPage /></Suspense>
            </Route>
            <Route path="/ventures">
              <Suspense fallback={<PageLoader />}><VenturesPage /></Suspense>
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
            <Route path="/legal/privacy">
              <Suspense fallback={<PageLoader />}><LegalPrivacy /></Suspense>
            </Route>
            <Route path="/legal/terms">
              <Suspense fallback={<PageLoader />}><LegalTerms /></Suspense>
            </Route>
            <Route path="/trust">
              <Suspense fallback={<PageLoader />}><TrustCenter /></Suspense>
            </Route>
            <Route path="/investor">
              <Suspense fallback={<PageLoader />}><InvestorStory /></Suspense>
            </Route>
            <Route path="/kpis">
              <Suspense fallback={<PageLoader />}><KpiDashboardPage /></Suspense>
            </Route>
            <Route>
              <HomePage />
            </Route>
          </Switch>
        </WouterRouter>
      </LazyMotion>
    </QueryClientProvider>
    </DemoModeProvider>
  );
}

export default App;
