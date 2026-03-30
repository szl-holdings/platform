import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { DemoModeProvider } from "@workspace/shared-ui";
import { useAuth } from "@workspace/replit-auth-web";
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
const InsightsPage = lazy(() => import("@/pages/insights"));
const InsightsArticlePage = lazy(() => import("@/pages/insights-article"));
const Changelog = lazy(() => import("@/pages/changelog"));
const Roadmap = lazy(() => import("@/pages/roadmap"));
const PortfolioIntel = lazy(() => import("@/pages/portfolio-intel"));
const AdminPage = lazy(() => import("@/pages/admin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false, staleTime: 5 * 60 * 1000 },
  },
});

function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, login } = useAuth();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "2rem" }}>
          <h2 style={{ color: "hsl(0,0%,90%)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Authentication Required</h2>
          <p style={{ color: "hsl(0,0%,60%)", marginBottom: "1.5rem" }}>Sign in to access this section.</p>
          <button
            onClick={login}
            style={{
              padding: "0.625rem 1.5rem",
              background: "hsl(210,8%,18%)",
              color: "hsl(0,0%,90%)",
              border: "1px solid hsl(210,8%,25%)",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

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
              <RequireAuth><Suspense fallback={<PageLoader />}><KpiDashboardPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin">
              <RequireAuth><Suspense fallback={<PageLoader />}><AdminPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/:section">
              <RequireAuth><Suspense fallback={<PageLoader />}><AdminPage /></Suspense></RequireAuth>
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
