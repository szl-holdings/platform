import { lazy, Suspense, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { DemoModeProvider } from "@workspace/shared-ui";
import { useAuth } from "@workspace/replit-auth-web";

const HomePage = lazy(() => import("@/pages/home"));
const EcosystemPage = lazy(() => import("@/pages/ecosystem"));
const VenturesPage = lazy(() => import("@/pages/ventures"));
const FounderPage = lazy(() => import("@/pages/founder"));
const ContactPage = lazy(() => import("@/pages/contact"));
const KpiDashboardPage = lazy(() => import("@/pages/kpi-dashboard"));
const InsightsPage = lazy(() => import("@/pages/insights"));
const AdminPage = lazy(() => import("@/pages/admin"));
const CaseStudiesPage = lazy(() => import("@/pages/case-studies"));
const TerraPage = lazy(() => import("@/pages/terra"));
const TerraPlatformPage = lazy(() => import("@/pages/terra-platform"));
const TerraListingsPage = lazy(() => import("@/pages/terra-listings"));
const OwnershipOsPage = lazy(() => import("@/pages/ownership-os"));

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

function ExternalRedirect({ to }: { to: string }) {
  if (typeof window !== "undefined") {
    window.location.href = to;
  }
  return <PageLoader />;
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

function App() {
  return (
    <DemoModeProvider>
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domMax} strict>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/">
              <Suspense fallback={<PageLoader />}><HomePage /></Suspense>
            </Route>
            <Route path="/ecosystem">
              <Suspense fallback={<PageLoader />}><EcosystemPage /></Suspense>
            </Route>
            <Route path="/ventures">
              <Suspense fallback={<PageLoader />}><VenturesPage /></Suspense>
            </Route>
            <Route path="/alloy">
              <ExternalRedirect to="/alloy/" />
            </Route>
            <Route path="/alloy/architecture">
              <ExternalRedirect to="/alloy/architecture" />
            </Route>
            <Route path="/alloy/workflows">
              <ExternalRedirect to="/alloy/workflows" />
            </Route>
            <Route path="/lyte">
              <ExternalRedirect to="/lyte-command-center/" />
            </Route>
            <Route path="/lyte/use-cases">
              <ExternalRedirect to="/lyte-command-center/use-cases" />
            </Route>
            <Route path="/lyte/demo">
              <ExternalRedirect to="/lyte-command-center/demo" />
            </Route>
            <Route path="/vessels">
              <ExternalRedirect to="/vessels/" />
            </Route>
            <Route path="/vessels/platform">
              <ExternalRedirect to="/vessels/platform" />
            </Route>
            <Route path="/carlota-jo">
              <ExternalRedirect to="/carlota-jo/" />
            </Route>
            <Route path="/carlota-jo/services">
              <ExternalRedirect to="/carlota-jo/services" />
            </Route>
            <Route path="/founder">
              <Suspense fallback={<PageLoader />}><FounderPage /></Suspense>
            </Route>
            <Route path="/contact">
              <Suspense fallback={<PageLoader />}><ContactPage /></Suspense>
            </Route>
            <Route path="/case-studies">
              <Suspense fallback={<PageLoader />}><CaseStudiesPage /></Suspense>
            </Route>
            <Route path="/insights">
              <Suspense fallback={<PageLoader />}><InsightsPage /></Suspense>
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
            <Route path="/portfolio">
              <Redirect to="/ventures" />
            </Route>
            <Route path="/terra">
              <Suspense fallback={<PageLoader />}><TerraPage /></Suspense>
            </Route>
            <Route path="/terra/platform">
              <Suspense fallback={<PageLoader />}><TerraPlatformPage /></Suspense>
            </Route>
            <Route path="/terra/listings">
              <Suspense fallback={<PageLoader />}><TerraListingsPage /></Suspense>
            </Route>
            <Route path="/ownership">
              <RequireAuth><Suspense fallback={<PageLoader />}><OwnershipOsPage /></Suspense></RequireAuth>
            </Route>
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </WouterRouter>
      </LazyMotion>
    </QueryClientProvider>
    </DemoModeProvider>
  );
}

export default App;
