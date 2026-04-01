import { lazy, Suspense, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { DemoModeProvider, SandboxModeProvider, OnboardingWizard, type OnboardingConfig } from "@workspace/shared-ui";
import { useAuth } from "@workspace/replit-auth-web";
import { AlloyLayout } from "@/alloy/components/alloy-layout";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { Building2, BarChart3, Globe, TrendingUp, Layers, Shield } from "lucide-react";

const SZL_ONBOARDING_CONFIG: OnboardingConfig = {
  appId: "szl-holdings",
  appName: "SZL Holdings",
  accentColor: "#6366f1",
  steps: [
    {
      id: "welcome",
      title: "Welcome to SZL Holdings",
      description: "SZL Holdings is the operating center for a portfolio of AI-native platforms — Terra (real estate), Aegis (security), Lyte (observability), Vessels (maritime), and Alloy (automation).",
      placement: "center",
      icon: Building2,
    },
    {
      id: "ecosystem",
      title: "The SZL Ecosystem",
      description: "Navigate the full platform ecosystem from this portal. Each platform is purpose-built and intelligence-native, sharing a common data and agent layer through Alloy.",
      placement: "center",
      icon: Globe,
    },
    {
      id: "ventures",
      title: "Portfolio & Ventures",
      description: "Explore SZL's venture portfolio, investment thesis, and the operating doctrine that guides how we build and operate companies.",
      placement: "center",
      icon: TrendingUp,
    },
    {
      id: "kpi-dashboard",
      title: "KPI Command",
      description: "The KPI dashboard gives you a real-time view of portfolio performance across all platforms — revenue, growth, adoption, and operational health.",
      placement: "center",
      icon: BarChart3,
    },
  ],
  checklist: [
    { id: "explore-ecosystem", label: "Explore the SZL ecosystem", description: "See all platforms and their connections" },
    { id: "view-ventures", label: "View the venture portfolio", description: "Review investment thesis and portfolio companies" },
    { id: "check-kpis", label: "Check portfolio KPIs", description: "Review real-time performance metrics" },
    { id: "explore-terra", label: "Visit Terra", description: "Real estate intelligence platform" },
    { id: "explore-aegis", label: "Visit Aegis", description: "Unified defense and intelligence command" },
  ],
};

const HomePage = lazy(() => import("@/pages/landing"));
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
const InvestorRelationsPage = lazy(() => import("@/pages/investor-relations"));
const CoreCommandPage = lazy(() => import("@/pages/core-command"));
const ControlPlanePage = lazy(() => import("@/pages/control-plane"));
const PortfolioOpsPage = lazy(() => import("@/pages/portfolio-ops"));
const TrustCenterPage = lazy(() => import("@/pages/trust-center"));
const StatusPage = lazy(() => import("@/pages/status"));
const LegalPrivacyPage = lazy(() => import("@/pages/legal-privacy"));
const LegalTermsPage = lazy(() => import("@/pages/legal-terms"));
const PlatformArchitecturePage = lazy(() => import("@/pages/platform-architecture"));
const IntegrationsMarketplacePage = lazy(() => import("@/pages/integrations-marketplace"));
const AzureTenantOnboardingPage = lazy(() => import("@/pages/azure-tenant-onboarding"));
const AzureTenantDashboardPage = lazy(() => import("@/pages/azure-tenant-dashboard"));
const TenantBrandingPage = lazy(() => import("@/pages/tenant-branding"));
const PowerBiConfigPage = lazy(() => import("@/pages/powerbi-config"));
const ScimProvisioningPage = lazy(() => import("@/pages/scim-provisioning"));
const DevelopersPage = lazy(() => import("@/pages/developers"));
const AccessibilityPage = lazy(() => import("@/pages/accessibility"));
const CapitalArsenalPage = lazy(() => import("@/pages/capital-arsenal"));

const AlloyFactoryFloor = lazy(() => import("@/alloy/pages/factory-floor"));
const AlloyExecutionHistory = lazy(() => import("@/alloy/pages/execution-history"));
const AlloyRunDetail = lazy(() => import("@/alloy/pages/run-detail"));
const AlloySignalFeed = lazy(() => import("@/alloy/pages/signal-feed"));
const AlloyWorkflowOrchestration = lazy(() => import("@/alloy/pages/workflow-orchestration"));
const AlloyConnectorMesh = lazy(() => import("@/alloy/pages/connector-mesh"));
const AlloyGovernanceAudit = lazy(() => import("@/alloy/pages/governance-audit"));
const AlloyAutomationAnalytics = lazy(() => import("@/alloy/pages/automation-analytics"));
const AlloyConsolePage = lazy(() => import("@/alloy/pages/ConsolePage"));
const AlloyDagView = lazy(() => import("@/alloy/pages/dag-view"));
const AlloyCampaignHub = lazy(() => import("@/alloy/pages/creative/campaign-hub").then(m => ({ default: m.CampaignHub })));
const AlloyCampaignDetail = lazy(() => import("@/alloy/pages/creative/campaign-detail").then(m => ({ default: m.CampaignDetail })));
const AlloyBrandVoice = lazy(() => import("@/alloy/pages/creative/brand-voice"));
const AlloyContentCalendar = lazy(() => import("@/alloy/pages/creative/content-calendar"));
const AlloyAIStudio = lazy(() => import("@/alloy/pages/creative/ai-studio"));
const AlloyDocumentEngine = lazy(() => import("@/alloy/pages/document-engine"));

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

function AlloyRunDetailRoute({ params }: { params: { id: string } }) {
  const id = parseInt(params.id ?? "0");
  return <AlloyRunDetail id={id} />;
}

function AlloyPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen" style={{ background: "#080c14" }}>
      <div className="flex-1 overflow-hidden">
        <AlloyLayout>{children}</AlloyLayout>
      </div>
    </div>
  );
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
    <SandboxModeProvider>
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
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyFactoryFloor /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/runs">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyExecutionHistory /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/runs/:id">
              {(params) => <Suspense fallback={<PageLoader />}><AlloyPage><AlloyRunDetailRoute params={params} /></AlloyPage></Suspense>}
            </Route>
            <Route path="/alloy/signals">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloySignalFeed /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/workflows">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyWorkflowOrchestration /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/connectors">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyConnectorMesh /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/governance">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyGovernanceAudit /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/analytics">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyAutomationAnalytics /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/console">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyConsolePage /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/dag">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyDagView /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/creative">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyCampaignHub /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/creative/campaigns/:id">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyCampaignDetail /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/creative/brand-voice">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyBrandVoice /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/creative/content-calendar">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyContentCalendar /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/creative/ai-studio">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyAIStudio /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/documents">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyDocumentEngine /></AlloyPage></Suspense>
            </Route>
            <Route path="/alloy/documents/:sub">
              <Suspense fallback={<PageLoader />}><AlloyPage><AlloyDocumentEngine /></AlloyPage></Suspense>
            </Route>
            <Route path="/lyte">
              <ExternalRedirect to="/lyte-command-center/" />
            </Route>
            <Route path="/lyte/use-cases">
              <ExternalRedirect to="/lyte-command-center/use-cases" />
            </Route>
            <Route path="/lyte/demo">
              <ExternalRedirect to="/lyte-command-center/?view=app" />
            </Route>
            <Route path="/vessels">
              <ExternalRedirect to="/vessels/" />
            </Route>
            <Route path="/vessels/demo">
              <ExternalRedirect to="/vessels/dashboard?demo=true" />
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
            <Route path="/firestorm">
              <ExternalRedirect to="/firestorm/" />
            </Route>
            <Route path="/inca">
              <ExternalRedirect to="/firestorm/intel/dashboard" />
            </Route>
            <Route path="/msp">
              <ExternalRedirect to="/firestorm/ops/dashboard" />
            </Route>
            <Route path="/stephen">
              <ExternalRedirect to="/stephen-site/" />
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
            <Route path="/admin/azure-onboarding">
              <RequireAuth><Suspense fallback={<PageLoader />}><AzureTenantOnboardingPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/azure-tenants">
              <RequireAuth><Suspense fallback={<PageLoader />}><AzureTenantDashboardPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/tenant-branding/:id">
              <RequireAuth><Suspense fallback={<PageLoader />}><TenantBrandingPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/powerbi">
              <RequireAuth><Suspense fallback={<PageLoader />}><PowerBiConfigPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/scim">
              <RequireAuth><Suspense fallback={<PageLoader />}><ScimProvisioningPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/capital-arsenal">
              <RequireAuth><Suspense fallback={<PageLoader />}><CapitalArsenalPage /></Suspense></RequireAuth>
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
            <Route path="/terra/demo">
              <ExternalRedirect to="/terra/dashboard?demo=true" />
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
            <Route path="/investor-relations">
              <Suspense fallback={<PageLoader />}><InvestorRelationsPage /></Suspense>
            </Route>
            <Route path="/ir">
              <Redirect to="/investor-relations" />
            </Route>
            <Route path="/core">
              <Suspense fallback={<PageLoader />}><CoreCommandPage /></Suspense>
            </Route>
            <Route path="/control-plane">
              <Suspense fallback={<PageLoader />}><ControlPlanePage /></Suspense>
            </Route>
            <Route path="/portfolio-ops">
              <Suspense fallback={<PageLoader />}><PortfolioOpsPage /></Suspense>
            </Route>
            <Route path="/trust">
              <Suspense fallback={<PageLoader />}><TrustCenterPage /></Suspense>
            </Route>
            <Route path="/status">
              <Suspense fallback={<PageLoader />}><StatusPage /></Suspense>
            </Route>
            <Route path="/legal/privacy">
              <Suspense fallback={<PageLoader />}><LegalPrivacyPage /></Suspense>
            </Route>
            <Route path="/legal/terms">
              <Suspense fallback={<PageLoader />}><LegalTermsPage /></Suspense>
            </Route>
            <Route path="/accessibility">
              <Suspense fallback={<PageLoader />}><AccessibilityPage /></Suspense>
            </Route>
            <Route path="/architecture">
              <Suspense fallback={<PageLoader />}><PlatformArchitecturePage /></Suspense>
            </Route>
            <Route path="/integrations">
              <Suspense fallback={<PageLoader />}><IntegrationsMarketplacePage /></Suspense>
            </Route>
            <Route path="/integrations/salesforce">
              <Suspense fallback={<PageLoader />}><IntegrationsMarketplacePage /></Suspense>
            </Route>
            <Route path="/integrations/jira">
              <Suspense fallback={<PageLoader />}><IntegrationsMarketplacePage /></Suspense>
            </Route>
            <Route path="/developers">
              <Suspense fallback={<PageLoader />}><DevelopersPage /></Suspense>
            </Route>
            <Route path="/developers/:section">
              <Suspense fallback={<PageLoader />}><DevelopersPage /></Suspense>
            </Route>
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </WouterRouter>
      </LazyMotion>
      <Toaster />
      <OnboardingWizard config={SZL_ONBOARDING_CONFIG} />
    </QueryClientProvider>
    </DemoModeProvider>
    </SandboxModeProvider>
  );
}

export default App;
