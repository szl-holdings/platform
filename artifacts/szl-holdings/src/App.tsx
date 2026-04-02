import { lazy, Suspense, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { DemoModeProvider, SandboxModeProvider, CookieBanner, StatusBanner, type StatusBannerConfig } from "@workspace/shared-ui";
import { useAuth } from "@workspace/replit-auth-web";
import { AlloyLayout } from "@/alloy/components/alloy-layout";
import { Toaster } from "@workspace/shared-ui/ui/sonner";

const HomePage = lazy(() => import("@/pages/landing"));
const PlatformPage = lazy(() => import("@/pages/platform"));
const DesignPartnersPage = lazy(() => import("@/pages/design-partners"));
const ContactPage = lazy(() => import("@/pages/contact"));
const TrustCenterPage = lazy(() => import("@/pages/trust-center"));
const InvestorRelationsPage = lazy(() => import("@/pages/investor-relations"));
const InvestorStoryPage = lazy(() => import("@/pages/investor-story"));
const VenturesPage = lazy(() => import("@/pages/ventures"));
const PortfolioPage = lazy(() => import("@/pages/portfolio"));
const TrustPage = lazy(() => import("@/pages/trust"));
const TrustSecurityPage = lazy(() => import("@/pages/trust-security"));
const TrustGovernancePage = lazy(() => import("@/pages/trust-governance"));
const TrustArchitecturePage = lazy(() => import("@/pages/trust-architecture"));
const KpiDashboardPage = lazy(() => import("@/pages/kpi-dashboard"));
const AdminPage = lazy(() => import("@/pages/admin"));
const AzureTenantOnboardingPage = lazy(() => import("@/pages/azure-tenant-onboarding"));
const AzureTenantDashboardPage = lazy(() => import("@/pages/azure-tenant-dashboard"));
const TenantBrandingPage = lazy(() => import("@/pages/tenant-branding"));
const PowerBiConfigPage = lazy(() => import("@/pages/powerbi-config"));
const ScimProvisioningPage = lazy(() => import("@/pages/scim-provisioning"));
const CapitalArsenalPage = lazy(() => import("@/pages/capital-arsenal"));
const OwnershipOsPage = lazy(() => import("@/pages/ownership-os"));
const StatusPage = lazy(() => import("@/pages/status"));
const LegalPrivacyPage = lazy(() => import("@/pages/legal-privacy"));
const LegalTermsPage = lazy(() => import("@/pages/legal-terms"));
const AccessibilityPage = lazy(() => import("@/pages/accessibility"));
const DemoPage = lazy(() => import("@/pages/demo"));
const PricingPage = lazy(() => import("@/pages/pricing"));

// New platform-repositioning pages
const LytePage = lazy(() => import("@/pages/lyte-page"));
const AlloyPublicPage = lazy(() => import("@/pages/alloy-page"));
const SolutionsPage = lazy(() => import("@/pages/solutions"));
const SolutionsAegisPage = lazy(() => import("@/pages/solutions-aegis"));
const SolutionsVesselsPage = lazy(() => import("@/pages/solutions-vessels"));
const SolutionsTerraPage = lazy(() => import("@/pages/solutions-terra"));
const DocsPage = lazy(() => import("@/pages/docs"));

const VenturePortfolioPage = lazy(() => import("@/pages/venture-portfolio"));
const AlloyFactoryFloor = lazy(() => import("@/alloy/pages/factory-floor"));
const AlloyExecutionHistory = lazy(() => import("@/alloy/pages/execution-history"));
const AlloyRunDetail = lazy(() => import("@/alloy/pages/run-detail"));
const AlloySignalFeed = lazy(() => import("@/alloy/pages/signal-feed"));
const AlloyWorkflowOrchestration = lazy(() => import("@/alloy/pages/workflow-orchestration"));
const AlloyConnectorMesh = lazy(() => import("@/alloy/pages/connector-mesh"));
const AlloyGovernanceAudit = lazy(() => import("@/alloy/pages/governance-audit"));
const AlloyEnterpriseGovernance = lazy(() => import("@/alloy/pages/enterprise-governance"));
const AlloyAutomationAnalytics = lazy(() => import("@/alloy/pages/automation-analytics"));
const AlloyConsolePage = lazy(() => import("@/alloy/pages/ConsolePage"));
const AlloyDagView = lazy(() => import("@/alloy/pages/dag-view"));
const AlloyCampaignHub = lazy(() => import("@/alloy/pages/creative/campaign-hub").then(m => ({ default: m.CampaignHub })));
const AlloyCampaignDetail = lazy(() => import("@/alloy/pages/creative/campaign-detail").then(m => ({ default: m.CampaignDetail })));
const AlloyBrandVoice = lazy(() => import("@/alloy/pages/creative/brand-voice"));
const AlloyContentCalendar = lazy(() => import("@/alloy/pages/creative/content-calendar"));
const AlloyAIStudio = lazy(() => import("@/alloy/pages/creative/ai-studio"));
const AlloyDocumentEngine = lazy(() => import("@/alloy/pages/document-engine"));
const AlloyWorkspaceHome = lazy(() => import("@/alloy/pages/workspace-home"));
const AlloyDecisionObjects = lazy(() => import("@/alloy/pages/decision-objects"));
const AlloySkillRegistry = lazy(() => import("@/alloy/pages/skill-registry"));
const AlloyOperatorControl = lazy(() => import("@/alloy/pages/operator-control-center"));
const AlloyResearchMode = lazy(() => import("@/alloy/pages/research-mode"));
const AlloyArtifactStudio = lazy(() => import("@/alloy/pages/artifact-studio"));
const AlloyBrowserOperator = lazy(() => import("@/alloy/pages/browser-operator"));
const AlloyPolicyManager = lazy(() => import("@/alloy/pages/policy-manager"));
const AlloyAdminAnalytics = lazy(() => import("@/alloy/pages/admin-analytics"));
const AlloyUsageMetering = lazy(() => import("@/alloy/pages/usage-metering"));
const AlloyCanonicalDemos = lazy(() => import("@/alloy/pages/canonical-demos"));
const AlloyPilotOnboarding = lazy(() => import("@/alloy/pages/pilot-onboarding"));

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
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "2rem" }}>
          <h2 style={{ color: "hsl(38,8%,92%)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Authentication Required</h2>
          <p style={{ color: "hsl(214,7%,55%)", marginBottom: "1.5rem" }}>Sign in to access this section.</p>
          <button
            onClick={login}
            style={{
              padding: "0.625rem 1.5rem",
              background: "hsla(0,0%,100%,0.06)",
              color: "hsl(38,8%,90%)",
              border: "1px solid hsla(0,0%,100%,0.12)",
              borderRadius: "6px",
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

const SZL_STATUS_CONFIG = {
  active: false,
  level: "maintenance" as const,
  message: "Scheduled maintenance in progress. Some features may be temporarily unavailable.",
  link: { label: "Status page", href: "/status" },
};

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

function AlloyAppPage({ children }: { children: ReactNode }) {
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
        background: "hsl(214,16%,4%)",
      }}
    >
      <div style={{
        width: "24px",
        height: "24px",
        border: "2px solid hsla(0,0%,100%,0.08)",
        borderTopColor: "hsl(191,92%,44%)",
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
        <StatusBanner config={SZL_STATUS_CONFIG} dismissible />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            {/* ── Public marketing routes ── */}
            <Route path="/">
              <Suspense fallback={<PageLoader />}><HomePage /></Suspense>
            </Route>
            <Route path="/platform">
              <Suspense fallback={<PageLoader />}><PlatformPage /></Suspense>
            </Route>
            <Route path="/design-partners">
              <Suspense fallback={<PageLoader />}><DesignPartnersPage /></Suspense>
            </Route>
            <Route path="/contact">
              <Suspense fallback={<PageLoader />}><ContactPage /></Suspense>
            </Route>

            {/* ── Product pages — Lyte and Alloy (public marketing) ── */}
            <Route path="/lyte">
              <Suspense fallback={<PageLoader />}><LytePage /></Suspense>
            </Route>
            <Route path="/lyte/use-cases">
              <Suspense fallback={<PageLoader />}><LytePage /></Suspense>
            </Route>
            <Route path="/lyte/demo">
              <ExternalRedirect to="/lyte-command-center/?view=app" />
            </Route>
            <Route path="/lyte/app">
              <ExternalRedirect to="/lyte-command-center/" />
            </Route>
            <Route path="/alloy-fabric">
              <Suspense fallback={<PageLoader />}><AlloyPublicPage /></Suspense>
            </Route>

            {/* ── Solutions hub and verticals ── */}
            <Route path="/solutions">
              <Suspense fallback={<PageLoader />}><SolutionsPage /></Suspense>
            </Route>
            <Route path="/solutions/aegis">
              <Suspense fallback={<PageLoader />}><SolutionsAegisPage /></Suspense>
            </Route>
            <Route path="/solutions/vessels">
              <Suspense fallback={<PageLoader />}><SolutionsVesselsPage /></Suspense>
            </Route>
            <Route path="/solutions/terra">
              <Suspense fallback={<PageLoader />}><SolutionsTerraPage /></Suspense>
            </Route>

            {/* ── Trust Center ── */}
            <Route path="/trust/security">
              <Suspense fallback={<PageLoader />}><TrustSecurityPage /></Suspense>
            </Route>
            <Route path="/trust/governance">
              <Suspense fallback={<PageLoader />}><TrustGovernancePage /></Suspense>
            </Route>
            <Route path="/trust/architecture">
              <Suspense fallback={<PageLoader />}><TrustArchitecturePage /></Suspense>
            </Route>
            <Route path="/trust">
              <Suspense fallback={<PageLoader />}><TrustPage /></Suspense>
            </Route>

            {/* ── Docs hub ── */}
            <Route path="/docs">
              <Suspense fallback={<PageLoader />}><DocsPage /></Suspense>
            </Route>

            {/* ── Investor routes ── */}
            <Route path="/investor-story">
              <Suspense fallback={<PageLoader />}><InvestorStoryPage /></Suspense>
            </Route>
            <Route path="/investor-relations">
              <Suspense fallback={<PageLoader />}><InvestorRelationsPage /></Suspense>
            </Route>
            <Route path="/investors">
              <Suspense fallback={<PageLoader />}><InvestorRelationsPage /></Suspense>
            </Route>
            <Route path="/ventures">
              <Suspense fallback={<PageLoader />}><VenturesPage /></Suspense>
            </Route>
            <Route path="/portfolio">
              <Suspense fallback={<PageLoader />}><PortfolioPage /></Suspense>
            </Route>

            {/* ── Product pages — accessible but not in primary nav ── */}
            <Route path="/demo">
              <Suspense fallback={<PageLoader />}><DemoPage /></Suspense>
            </Route>
            <Route path="/pricing">
              <Suspense fallback={<PageLoader />}><PricingPage /></Suspense>
            </Route>

            {/* ── Alloy app routes (internal, not public nav) ── */}
            <Route path="/alloy">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyFactoryFloor /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/runs">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyExecutionHistory /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/runs/:id">
              {(params) => <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyRunDetailRoute params={params} /></AlloyAppPage></Suspense>}
            </Route>
            <Route path="/alloy/signals">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloySignalFeed /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/workflows">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyWorkflowOrchestration /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/connectors">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyConnectorMesh /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/governance">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyGovernanceAudit /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/enterprise-governance">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyEnterpriseGovernance /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/analytics">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyAutomationAnalytics /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/console">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyConsolePage /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/dag">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyDagView /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/creative">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyCampaignHub /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/creative/campaigns/:id">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyCampaignDetail /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/creative/brand-voice">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyBrandVoice /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/creative/content-calendar">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyContentCalendar /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/creative/ai-studio">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyAIStudio /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/documents">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyDocumentEngine /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/documents/:sub">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyDocumentEngine /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/home">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyWorkspaceHome /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/decisions">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyDecisionObjects /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/skills">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloySkillRegistry /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/operator">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyOperatorControl /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/research">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyResearchMode /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/artifacts">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyArtifactStudio /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/browser">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyBrowserOperator /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/policies">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyPolicyManager /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/admin-analytics">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyAdminAnalytics /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/usage">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyUsageMetering /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/demos">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyCanonicalDemos /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/pilot">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyPilotOnboarding /></AlloyAppPage></Suspense>
            </Route>

            {/* ── External platform redirects ── */}
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
            <Route path="/terra">
              <ExternalRedirect to="/terra/" />
            </Route>
            <Route path="/terra/demo">
              <ExternalRedirect to="/terra/dashboard?demo=true" />
            </Route>

            {/* ── Admin routes ── */}
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
            <Route path="/ownership">
              <RequireAuth><Suspense fallback={<PageLoader />}><OwnershipOsPage /></Suspense></RequireAuth>
            </Route>

            <Route path="/venture-portfolio">
              <Suspense fallback={<PageLoader />}><VenturePortfolioPage /></Suspense>
            </Route>

            {/* ── Legal / utility routes ── */}
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

            {/* ── Redirects ── */}
            <Route path="/ir">
              <Redirect to="/investor-relations" />
            </Route>
            <Route path="/ecosystem">
              <Redirect to="/" />
            </Route>
            <Route path="/founder">
              <Redirect to="/" />
            </Route>
            <Route path="/case-studies">
              <Redirect to="/" />
            </Route>
            <Route path="/insights">
              <Redirect to="/" />
            </Route>
            <Route path="/architecture">
              <Redirect to="/trust/architecture" />
            </Route>
            <Route path="/integrations">
              <Redirect to="/platform" />
            </Route>
            <Route path="/integrations/:sub">
              <Redirect to="/platform" />
            </Route>
            <Route path="/developers">
              <Redirect to="/docs" />
            </Route>
            <Route path="/developers/:section">
              <Redirect to="/docs" />
            </Route>
            <Route path="/core">
              <Redirect to="/" />
            </Route>
            <Route path="/control-plane">
              <Redirect to="/" />
            </Route>
            <Route path="/portfolio-ops">
              <Redirect to="/" />
            </Route>
            <Route path="/terra/platform">
              <Redirect to="/platform" />
            </Route>
            <Route path="/terra/listings">
              <ExternalRedirect to="/terra/" />
            </Route>

            {/* Catch-all */}
            <Route>
              <Redirect to="/" />
            </Route>
          </Switch>
        </WouterRouter>
      </LazyMotion>
      <Toaster />
      <CookieBanner privacyUrl="/legal/privacy" accentColor="#d4a054" />
    </QueryClientProvider>
    </DemoModeProvider>
    </SandboxModeProvider>
  );
}

export default App;
