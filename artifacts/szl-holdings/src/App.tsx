import { lazy, Suspense, useCallback, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { DemoModeProvider, SandboxModeProvider, CookieBanner, StatusBanner, AnalyticsProvider, AdPixelProvider, useCookieConsent, fireConversionEvent, type StatusBannerConfig } from "@szl-holdings/shared-ui";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { McpOverlay } from "@szl-holdings/mcp-client";
import { PrismBusProvider } from "@szl-holdings/prism-bus/provider";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { AlloyLayout } from "@/alloy/components/alloy-layout";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";
import { AIChatWidget } from "@/components/AIChatWidget";
import { ExitIntentPopup } from "@/components/EmailCapture";

const SZL_ACCENT = LANE_ACCENT_HEX.szl.primary;

const HomePage = lazy(() => import("@/pages/landing"));
const PlatformPage = lazy(() => import("@/pages/platform"));
const DesignPartnersPage = lazy(() => import("@/pages/design-partners"));
const ContactPage = lazy(() => import("@/pages/contact"));
const TrustCenterPage = lazy(() => import("@/pages/trust-center"));
const InvestorRelationsPage = lazy(() => import("@/pages/investor-relations"));
const OperatingDoctrinePage = lazy(() => import("@/pages/operating-doctrine"));
const InvestorStoryPage = lazy(() => import("@/pages/investor-story"));
const VenturesPage = lazy(() => import("@/pages/ventures"));
const PortfolioPage = lazy(() => import("@/pages/portfolio"));
const TrustPage = lazy(() => import("@/pages/trust"));
const TrustSecurityPage = lazy(() => import("@/pages/trust-security"));
const TrustGovernancePage = lazy(() => import("@/pages/trust-governance"));
const TrustArchitecturePage = lazy(() => import("@/pages/trust-architecture"));
const TrustAIPage = lazy(() => import("@/pages/trust-ai"));
const TrustApprovalsPage = lazy(() => import("@/pages/trust-approvals"));
const TrustExportsPage = lazy(() => import("@/pages/trust-exports"));
const TrustOperationsPage = lazy(() => import("@/pages/trust-operations"));
const InvestorsHubPage = lazy(() => import("@/pages/investors-hub"));
const InvestorsDemoModePage = lazy(() => import("@/pages/investors-demo-mode"));
const InvestorsCompetitivePage = lazy(() => import("@/pages/investors-competitive"));
const InvestorsOverviewPage = lazy(() => import("@/pages/investors-overview-v2"));
const ArchitecturePage = lazy(() => import("@/pages/architecture-page"));
const InvestorsArchitecturePage = lazy(() => import("@/pages/investors-architecture"));
const InvestorsMoatPage = lazy(() => import("@/pages/investors-moat"));
const InvestorsRoadmapPage = lazy(() => import("@/pages/investors-roadmap"));
const InvestorsTrustPage = lazy(() => import("@/pages/investors-trust"));
const InvestorsDataRoomPage = lazy(() => import("@/pages/investors-data-room"));
const InvestorsFounderPage = lazy(() => import("@/pages/investors-founder-v2"));
const PilotPrismCounselPage = lazy(() => import("@/pages/pilot-prism-counsel"));
const PilotTerraPage = lazy(() => import("@/pages/pilot-terra"));
const PilotVesselsPage = lazy(() => import("@/pages/pilot-vessels"));
const PilotAegisPage = lazy(() => import("@/pages/pilot-aegis"));
const KpiDashboardPage = lazy(() => import("@/pages/kpi-dashboard"));
const AdminPage = lazy(() => import("@/pages/admin"));
const OpsPage = lazy(() => import("@/pages/ops"));
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
const HelmConsolePage = lazy(() => import("@/pages/helm-console"));
const CommercialPackagingPage = lazy(() => import("@/pages/commercial-packaging"));
const RoiCalculatorPage = lazy(() => import("@/pages/roi-calculator"));
const ReliefMessagingPage = lazy(() => import("@/pages/relief-messaging"));
const TrustRoutePage = lazy(() => import("@/pages/trust-route"));

// New platform-repositioning pages
const LytePage = lazy(() => import("@/pages/lyte-page"));
const AlloyPublicPage = lazy(() => import("@/pages/alloy-page"));
const SolutionsPage = lazy(() => import("@/pages/solutions"));
const SolutionsAegisPage = lazy(() => import("@/pages/solutions-aegis"));
const SolutionsVesselsPage = lazy(() => import("@/pages/solutions-vessels"));
const SolutionsTerraPage = lazy(() => import("@/pages/solutions-terra"));
const DocsPage = lazy(() => import("@/pages/docs"));
const DocsArchitecturePage = lazy(() => import("@/pages/docs-architecture"));
const DocsControlPlanePage = lazy(() => import("@/pages/docs-control-plane"));
const DocsWorldlinePage = lazy(() => import("@/pages/docs-worldline"));
const DocsProofChainPage = lazy(() => import("@/pages/docs-proof-chain"));
const DocsModelMeshPage = lazy(() => import("@/pages/docs-model-mesh"));
const DocsTrustPage = lazy(() => import("@/pages/docs-trust"));
const DocsGithubPage = lazy(() => import("@/pages/docs-github"));
const MCPServerPage = lazy(() => import("@/pages/mcp-server"));
const CognitiveFabricPage = lazy(() => import("@/pages/cognitive-fabric"));

const SolutionsPrismCounselPage = lazy(() => import("@/pages/solutions-prism-counsel"));
const SolutionsPrismCounselTrustPage = lazy(() => import("@/pages/solutions-prism-counsel-trust"));
const SolutionsTerraTrustPage = lazy(() => import("@/pages/solutions-terra-trust"));
const SolutionsVesselsTrustPage = lazy(() => import("@/pages/solutions-vessels-trust"));
const SolutionsAegisTrustPage = lazy(() => import("@/pages/solutions-aegis-trust"));
const SolutionsLyteTrustPage = lazy(() => import("@/pages/solutions-lyte-trust"));
const HowItWorksPage = lazy(() => import("@/pages/how-it-works"));
const CompanyPage = lazy(() => import("@/pages/company"));
const FounderPage = lazy(() => import("@/pages/founder"));
const NotFoundPage = lazy(() => import("@/pages/not-found"));
const EcosystemPage = lazy(() => import("@/pages/ecosystem"));
const CaseStudiesPage = lazy(() => import("@/pages/case-studies"));
const InsightsPage = lazy(() => import("@/pages/insights"));
const InsightsArticlePage = lazy(() => import("@/pages/insights-article"));
const CoreCommandPage = lazy(() => import("@/pages/core-command"));
const NerveCenterPage = lazy(() => import("@/pages/nerve-center"));
const ControlPlanePage = lazy(() => import("@/pages/control-plane"));
const PortfolioOpsPage = lazy(() => import("@/pages/portfolio-ops"));
const PortfolioCommandPage = lazy(() => import("@/pages/portfolio-command"));
const InvestorIntelligencePage = lazy(() => import("@/pages/investor-intelligence"));
const PitchModePage = lazy(() => import("@/pages/pitch-mode"));
const FlywheelVizPage = lazy(() => import("@/pages/flywheel-viz"));
const RevenueMetricsPage = lazy(() => import("@/pages/revenue-metrics"));
const IntelligenceMeshPage = lazy(() => import("@/pages/intelligence-mesh"));

// Public infrastructure pages (trust center, legal baseline, API, investor, press, brand, faq, roadmap)
const SecurityPage = lazy(() => import("@/pages/security"));
const LegalCookiesPage = lazy(() => import("@/pages/legal-cookies"));
const LegalAcceptableUsePage = lazy(() => import("@/pages/legal-acceptable-use"));
const LegalSecurityDisclosurePage = lazy(() => import("@/pages/legal-security-disclosure"));
const ApiPage = lazy(() => import("@/pages/api-page"));
const InvestorPage = lazy(() => import("@/pages/investor"));
const PressPage = lazy(() => import("@/pages/press"));
const BrandPage = lazy(() => import("@/pages/brand"));
const FaqPage = lazy(() => import("@/pages/faq"));
const PublicRoadmapPage = lazy(() => import("@/pages/public-roadmap"));

// Standalone premium public product pages
const PrismCounselPublicPage = lazy(() => import("@/pages/prism-counsel-public"));
const TerraPublicPage = lazy(() => import("@/pages/terra-public"));
const VesselsPublicPage = lazy(() => import("@/pages/vessels-public"));
const AegisPublicPage = lazy(() => import("@/pages/aegis-public"));
const CarlotaJoPublicPage = lazy(() => import("@/pages/carlota-jo-public"));


const LinkInBioPage = lazy(() => import("@/pages/link-in-bio"));
const NewsletterLandingPage = lazy(() => import("@/pages/newsletter-landing"));
const DistOsDashboard = lazy(() => import("@/pages/distribution-os/admin-dashboard"));
const DistOsArticles = lazy(() => import("@/pages/distribution-os/articles-cms"));
const DistOsNewsletters = lazy(() => import("@/pages/distribution-os/newsletters-cms"));
const DistOsCarouselLab = lazy(() => import("@/pages/distribution-os/carousel-lab"));
const DistOsXStudio = lazy(() => import("@/pages/distribution-os/x-studio"));
const DistOsLeads = lazy(() => import("@/pages/distribution-os/leads-page"));
const DistOsCampaigns = lazy(() => import("@/pages/distribution-os/campaigns-page"));
const DistOsCalendar = lazy(() => import("@/pages/distribution-os/content-calendar"));
const DistOsAnalytics = lazy(() => import("@/pages/distribution-os/analytics-dashboard"));
const DistOsEmailCampaigns = lazy(() => import("@/pages/distribution-os/campaign-builder"));
const DistOsDripSequences = lazy(() => import("@/pages/distribution-os/drip-sequences-page"));
const DistOsPrivacy = lazy(() => import("@/pages/distribution-os/privacy-command-center"));
const DistOsAnalyticsCommandCenter = lazy(() => import("@/pages/distribution-os/analytics-command-center"));
const DistOsSessionReplay = lazy(() => import("@/pages/distribution-os/session-replay"));
const DistOsSessionJourneys = lazy(() => import("@/pages/distribution-os/session-journeys"));
const DistOsConversionGoals = lazy(() => import("@/pages/distribution-os/conversion-goals"));
const DistOsAutomations = lazy(() => import("@/pages/distribution-os/automations-page"));
const DistOsSettings = lazy(() => import("@/pages/distribution-os/settings-page"));
const DistOsReports = lazy(() => import("@/pages/distribution-os/reports-page"));
const DistOsHeatmaps = lazy(() => import("@/pages/distribution-os/heatmap-viewer"));
const DistOsExperiments = lazy(() => import("@/pages/distribution-os/experiments"));

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
const AlloyMcpStore = lazy(() => import("@/alloy/pages/mcp-store"));
const AlloyMcpToolCreator = lazy(() => import("@/alloy/pages/mcp-tool-creator"));
const AlloyEvolutionPage = lazy(() => import("@/alloy/pages/evolution-radar").then(m => ({ default: m.AlloyEvolutionPage })));
const AcademyPage = lazy(() => import("@/pages/academy"));
const HelpPage = lazy(() => import("@/pages/help"));
const DemosPage = lazy(() => import("@/pages/demos"));
const PulsePage = lazy(() => import("@/pages/pulse"));
const AlloyPlatformApp = lazy(() => import("@/alloy-platform/AlloyPlatformApp"));

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

const PUBLIC_WIDGET_PATHS = [
  "/", "/pricing", "/platform", "/contact", "/demo", "/design-partners",
  "/design-partner", "/insights", "/solutions", "/company", "/founder",
  "/investors", "/ventures", "/how-it-works", "/lyte", "/alloy",
  "/faq", "/case-studies", "/ecosystem",
];

function PublicWidgets() {
  const [location] = useLocation();
  const isPublicPage = PUBLIC_WIDGET_PATHS.some(p =>
    p === "/" ? location === "/" || location === "" : location.startsWith(p)
  );
  const isAdminOrAuthPage =
    location.startsWith("/admin") ||
    location.startsWith("/alloy") ||
    location.startsWith("/trust") ||
    location.startsWith("/legal") ||
    location.startsWith("/status") ||
    location.startsWith("/helm") ||
    location.startsWith("/ops") ||
    location.startsWith("/kpi");
  if (!isPublicPage || isAdminOrAuthPage) return null;
  return (
    <>
      <AIChatWidget />
      <ExitIntentPopup />
    </>
  );
}

function App() {
  const { consent } = useCookieConsent();
  const googleAdsId = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined;
  const handleConversionEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    fireConversionEvent(eventName, googleAdsId, {
      value: properties?.value as number | undefined,
      currency: properties?.currency as string | undefined,
    });
  }, [googleAdsId]);
  return (
    <AnalyticsProvider appName="szl-holdings" onConversionEvent={handleConversionEvent}>
    <AdPixelProvider
      googleAdsId={import.meta.env.VITE_GOOGLE_ADS_ID}
      metaPixelId={import.meta.env.VITE_META_PIXEL_ID}
      respectDnt={true}
      consentGranted={consent === "accepted"}
    >
    <PrismBusProvider domain="szl-holdings">
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
            <Route path="/design-partner">
              <Suspense fallback={<PageLoader />}><DesignPartnersPage /></Suspense>
            </Route>
            <Route path="/contact">
              <Suspense fallback={<PageLoader />}><ContactPage /></Suspense>
            </Route>
            <Route path="/company">
              <Suspense fallback={<PageLoader />}><CompanyPage /></Suspense>
            </Route>
            <Route path="/about">
              <Suspense fallback={<PageLoader />}><CompanyPage /></Suspense>
            </Route>
            <Route path="/founder">
              <Suspense fallback={<PageLoader />}><FounderPage /></Suspense>
            </Route>

            {/* ── Product pages — Lyte and Alloy (public marketing) ── */}
            <Route path="/products/lyte">
              <Suspense fallback={<PageLoader />}><LytePage /></Suspense>
            </Route>
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
            <Route path="/platform/alloy">
              <Suspense fallback={<PageLoader />}><AlloyPublicPage /></Suspense>
            </Route>
            <Route path="/alloy-fabric">
              <Suspense fallback={<PageLoader />}><AlloyPublicPage /></Suspense>
            </Route>

            {/* ── Solutions hub and verticals ── */}
            <Route path="/solutions">
              <Suspense fallback={<PageLoader />}><SolutionsPage /></Suspense>
            </Route>
            <Route path="/solutions/prism-counsel/trust">
              <Suspense fallback={<PageLoader />}><SolutionsPrismCounselTrustPage /></Suspense>
            </Route>
            <Route path="/solutions/terra/trust">
              <Suspense fallback={<PageLoader />}><SolutionsTerraTrustPage /></Suspense>
            </Route>
            <Route path="/solutions/vessels/trust">
              <Suspense fallback={<PageLoader />}><SolutionsVesselsTrustPage /></Suspense>
            </Route>
            <Route path="/solutions/aegis/trust">
              <Suspense fallback={<PageLoader />}><SolutionsAegisTrustPage /></Suspense>
            </Route>
            <Route path="/solutions/lyte/trust">
              <Suspense fallback={<PageLoader />}><SolutionsLyteTrustPage /></Suspense>
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
            <Route path="/solutions/prism-counsel">
              <Suspense fallback={<PageLoader />}><SolutionsPrismCounselPage /></Suspense>
            </Route>

            {/* ── Standalone premium public product pages — canonical routes ── */}
            <Route path="/products/vessels">
              <Suspense fallback={<PageLoader />}><VesselsPublicPage /></Suspense>
            </Route>
            <Route path="/products/aegis">
              <Suspense fallback={<PageLoader />}><AegisPublicPage /></Suspense>
            </Route>
            <Route path="/products/terra">
              <Suspense fallback={<PageLoader />}><TerraPublicPage /></Suspense>
            </Route>
            <Route path="/services/carlota-jo">
              <Suspense fallback={<PageLoader />}><CarlotaJoPublicPage /></Suspense>
            </Route>

            {/* ── Standalone premium public product pages — legacy routes ── */}
            <Route path="/prism-counsel-public">
              <Suspense fallback={<PageLoader />}><PrismCounselPublicPage /></Suspense>
            </Route>
            <Route path="/terra-public">
              <Suspense fallback={<PageLoader />}><TerraPublicPage /></Suspense>
            </Route>
            <Route path="/vessels-public">
              <Suspense fallback={<PageLoader />}><VesselsPublicPage /></Suspense>
            </Route>
            <Route path="/aegis-public">
              <Suspense fallback={<PageLoader />}><AegisPublicPage /></Suspense>
            </Route>
            <Route path="/carlota-jo-public">
              <Suspense fallback={<PageLoader />}><CarlotaJoPublicPage /></Suspense>
            </Route>

            {/* ── PRISM Counsel — now a standalone artifact at /prism-counsel/ ── */}
            <Route path="/prism-counsel/:rest*">
              {() => { window.location.href = "/prism-counsel/"; return null; }}
            </Route>
            <Route path="/prism-counsel">
              {() => { window.location.href = "/prism-counsel/"; return null; }}
            </Route>

            {/* ── Trust Center ── */}
            <Route path="/trust-route">
              <Suspense fallback={<PageLoader />}><TrustRoutePage /></Suspense>
            </Route>
            <Route path="/trust/security">
              <Suspense fallback={<PageLoader />}><TrustSecurityPage /></Suspense>
            </Route>
            <Route path="/trust/governance">
              <Suspense fallback={<PageLoader />}><TrustGovernancePage /></Suspense>
            </Route>
            <Route path="/trust/architecture">
              <Suspense fallback={<PageLoader />}><TrustArchitecturePage /></Suspense>
            </Route>
            <Route path="/trust/ai">
              <Suspense fallback={<PageLoader />}><TrustAIPage /></Suspense>
            </Route>
            <Route path="/trust/approvals">
              <Suspense fallback={<PageLoader />}><TrustApprovalsPage /></Suspense>
            </Route>
            <Route path="/trust/exports">
              <Suspense fallback={<PageLoader />}><TrustExportsPage /></Suspense>
            </Route>
            <Route path="/trust/operations">
              <Suspense fallback={<PageLoader />}><TrustOperationsPage /></Suspense>
            </Route>
            <Route path="/trust">
              <Suspense fallback={<PageLoader />}><TrustPage /></Suspense>
            </Route>

            {/* ── Academy, Help, Demos ── */}
            <Route path="/academy">
              <Suspense fallback={<PageLoader />}><AcademyPage /></Suspense>
            </Route>
            <Route path="/help">
              <Suspense fallback={<PageLoader />}><HelpPage /></Suspense>
            </Route>
            <Route path="/demos">
              <Suspense fallback={<PageLoader />}><DemosPage /></Suspense>
            </Route>

            {/* ── Docs hub ── */}
            <Route path="/docs/architecture">
              <Suspense fallback={<PageLoader />}><DocsArchitecturePage /></Suspense>
            </Route>
            <Route path="/docs/control-plane">
              <Suspense fallback={<PageLoader />}><DocsControlPlanePage /></Suspense>
            </Route>
            <Route path="/docs/worldline">
              <Suspense fallback={<PageLoader />}><DocsWorldlinePage /></Suspense>
            </Route>
            <Route path="/docs/proof-chain">
              <Suspense fallback={<PageLoader />}><DocsProofChainPage /></Suspense>
            </Route>
            <Route path="/docs/model-mesh">
              <Suspense fallback={<PageLoader />}><DocsModelMeshPage /></Suspense>
            </Route>
            <Route path="/docs/trust">
              <Suspense fallback={<PageLoader />}><DocsTrustPage /></Suspense>
            </Route>
            <Route path="/docs/github">
              <Suspense fallback={<PageLoader />}><DocsGithubPage /></Suspense>
            </Route>
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
            <Route path="/operating-doctrine">
              <Suspense fallback={<PageLoader />}><OperatingDoctrinePage /></Suspense>
            </Route>
            <Route path="/investors/overview">
              <Suspense fallback={<PageLoader />}><InvestorsOverviewPage /></Suspense>
            </Route>
            <Route path="/investors/architecture">
              <Suspense fallback={<PageLoader />}><InvestorsArchitecturePage /></Suspense>
            </Route>
            <Route path="/investors/moat">
              <Suspense fallback={<PageLoader />}><InvestorsMoatPage /></Suspense>
            </Route>
            <Route path="/investors/roadmap">
              <Suspense fallback={<PageLoader />}><InvestorsRoadmapPage /></Suspense>
            </Route>
            <Route path="/investors/trust">
              <Suspense fallback={<PageLoader />}><InvestorsTrustPage /></Suspense>
            </Route>
            <Route path="/investors/data-room">
              <Suspense fallback={<PageLoader />}><InvestorsDataRoomPage /></Suspense>
            </Route>
            <Route path="/investors/demo">
              <Suspense fallback={<PageLoader />}><InvestorsDemoModePage /></Suspense>
            </Route>
            <Route path="/investors/competitive">
              <Suspense fallback={<PageLoader />}><InvestorsCompetitivePage /></Suspense>
            </Route>
            <Route path="/investors/founder">
              <Suspense fallback={<PageLoader />}><InvestorsFounderPage /></Suspense>
            </Route>
            <Route path="/investors">
              <Suspense fallback={<PageLoader />}><InvestorsHubPage /></Suspense>
            </Route>

            {/* ── Pilot landing pages ── */}
            <Route path="/pilot/prism-counsel">
              <Suspense fallback={<PageLoader />}><PilotPrismCounselPage /></Suspense>
            </Route>
            <Route path="/pilot/terra">
              <Suspense fallback={<PageLoader />}><PilotTerraPage /></Suspense>
            </Route>
            <Route path="/pilot/vessels">
              <Suspense fallback={<PageLoader />}><PilotVesselsPage /></Suspense>
            </Route>
            <Route path="/pilot/aegis">
              <Suspense fallback={<PageLoader />}><PilotAegisPage /></Suspense>
            </Route>

            <Route path="/ventures">
              <Suspense fallback={<PageLoader />}><VenturesPage /></Suspense>
            </Route>
            <Route path="/portfolio">
              <Suspense fallback={<PageLoader />}><PortfolioPage /></Suspense>
            </Route>

            {/* ── Investor Readiness & Platform Intelligence ── */}
            <Route path="/portfolio-command">
              <Suspense fallback={<PageLoader />}><PortfolioCommandPage /></Suspense>
            </Route>
            <Route path="/investor-intelligence">
              <Suspense fallback={<PageLoader />}><InvestorIntelligencePage /></Suspense>
            </Route>
            <Route path="/pitch-mode">
              <Suspense fallback={<PageLoader />}><PitchModePage /></Suspense>
            </Route>
            <Route path="/flywheel">
              <Suspense fallback={<PageLoader />}><FlywheelVizPage /></Suspense>
            </Route>
            <Route path="/revenue-metrics">
              <Suspense fallback={<PageLoader />}><RevenueMetricsPage /></Suspense>
            </Route>
            <Route path="/intelligence-mesh">
              <Suspense fallback={<PageLoader />}><IntelligenceMeshPage /></Suspense>
            </Route>
            <Route path="/nerve-center">
              <Suspense fallback={<PageLoader />}><NerveCenterPage /></Suspense>
            </Route>

            {/* ── Product pages — accessible but not in primary nav ── */}
            <Route path="/demo">
              <Suspense fallback={<PageLoader />}><DemoPage /></Suspense>
            </Route>
            <Route path="/pricing">
              <Suspense fallback={<PageLoader />}><PricingPage /></Suspense>
            </Route>

            {/* ── Alloy Platform — standalone product at /alloy-platform ── */}
            <Route path="/alloy-platform/:rest*">
              <Suspense fallback={<PageLoader />}><AlloyPlatformApp /></Suspense>
            </Route>
            <Route path="/alloy-platform">
              <Suspense fallback={<PageLoader />}><AlloyPlatformApp /></Suspense>
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
            <Route path="/alloy/mcp-store">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyMcpStore /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/mcp-tools">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyMcpToolCreator /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/evolution">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyEvolutionPage /></AlloyAppPage></Suspense>
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

            {/* ── Internal ops routes (INTERNAL — not publicly linked) ── */}
            <Route path="/ops">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/ops/:section">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/ops/:section/:sub">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsPage /></Suspense></RequireAuth>
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
            <Route path="/helm">
              <RequireAuth><Suspense fallback={<PageLoader />}><HelmConsolePage /></Suspense></RequireAuth>
            </Route>
            <Route path="/helm/:tab">
              <RequireAuth><Suspense fallback={<PageLoader />}><HelmConsolePage /></Suspense></RequireAuth>
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
            <Route path="/legal/cookies">
              <Suspense fallback={<PageLoader />}><LegalCookiesPage /></Suspense>
            </Route>
            <Route path="/legal/acceptable-use">
              <Suspense fallback={<PageLoader />}><LegalAcceptableUsePage /></Suspense>
            </Route>
            <Route path="/legal/security-disclosure">
              <Suspense fallback={<PageLoader />}><LegalSecurityDisclosurePage /></Suspense>
            </Route>
            <Route path="/accessibility">
              <Suspense fallback={<PageLoader />}><AccessibilityPage /></Suspense>
            </Route>

            {/* ── Cross-app / platform command pages ── */}
            <Route path="/helm">
              <Suspense fallback={<PageLoader />}><HelmConsolePage /></Suspense>
            </Route>
            <Route path="/packages">
              <Suspense fallback={<PageLoader />}><CommercialPackagingPage /></Suspense>
            </Route>
            <Route path="/roi">
              <Suspense fallback={<PageLoader />}><RoiCalculatorPage /></Suspense>
            </Route>
            <Route path="/relief">
              <Suspense fallback={<PageLoader />}><ReliefMessagingPage /></Suspense>
            </Route>

            {/* ── Public infrastructure pages ── */}
            <Route path="/security">
              <Suspense fallback={<PageLoader />}><SecurityPage /></Suspense>
            </Route>
            <Route path="/api">
              <Suspense fallback={<PageLoader />}><ApiPage /></Suspense>
            </Route>
            <Route path="/investor">
              <Suspense fallback={<PageLoader />}><InvestorPage /></Suspense>
            </Route>
            <Route path="/press">
              <Suspense fallback={<PageLoader />}><PressPage /></Suspense>
            </Route>
            <Route path="/brand">
              <Suspense fallback={<PageLoader />}><BrandPage /></Suspense>
            </Route>
            <Route path="/faq">
              <Suspense fallback={<PageLoader />}><FaqPage /></Suspense>
            </Route>
            <Route path="/roadmap">
              <Suspense fallback={<PageLoader />}><PublicRoadmapPage /></Suspense>
            </Route>

            {/* ── Redirects ── */}
            <Route path="/ir">
              <Redirect to="/investors/overview" />
            </Route>
            <Route path="/ecosystem">
              <Suspense fallback={<PageLoader />}><EcosystemPage /></Suspense>
            </Route>
            <Route path="/founder-legacy">
              <Redirect to="/investors/founder" />
            </Route>
            <Route path="/case-studies">
              <Suspense fallback={<PageLoader />}><CaseStudiesPage /></Suspense>
            </Route>
            <Route path="/insights/:slug">
              <Suspense fallback={<PageLoader />}><InsightsArticlePage /></Suspense>
            </Route>
            <Route path="/insights">
              <Suspense fallback={<PageLoader />}><InsightsPage /></Suspense>
            </Route>
            <Route path="/architecture">
              <Suspense fallback={<PageLoader />}><ArchitecturePage /></Suspense>
            </Route>
            <Route path="/how-it-works">
              <Suspense fallback={<PageLoader />}><HowItWorksPage /></Suspense>
            </Route>
            <Route path="/integrations">
              <Redirect to="/platform" />
            </Route>
            <Route path="/integrations/:sub">
              <Redirect to="/platform" />
            </Route>
            <Route path="/mcp-server">
              <Suspense fallback={<PageLoader />}><MCPServerPage /></Suspense>
            </Route>
            <Route path="/cognitive-fabric">
              <Suspense fallback={<PageLoader />}><CognitiveFabricPage /></Suspense>
            </Route>
            <Route path="/developers">
              <Redirect to="/docs" />
            </Route>
            <Route path="/developers/:section">
              <Redirect to="/docs" />
            </Route>
            <Route path="/pulse/brief/:id">
              <RequireAuth><Suspense fallback={<PageLoader />}><PulsePage /></Suspense></RequireAuth>
            </Route>
            <Route path="/pulse/:tab">
              <RequireAuth><Suspense fallback={<PageLoader />}><PulsePage /></Suspense></RequireAuth>
            </Route>
            <Route path="/pulse">
              <RequireAuth><Suspense fallback={<PageLoader />}><PulsePage /></Suspense></RequireAuth>
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
            <Route path="/terra/platform">
              <Redirect to="/platform" />
            </Route>
            <Route path="/terra/listings">
              <ExternalRedirect to="/terra/" />
            </Route>

            {/* ── Distribution OS: Public Pages ── */}
            <Route path="/link-in-bio">
              <Suspense fallback={<PageLoader />}><LinkInBioPage /></Suspense>
            </Route>
            <Route path="/newsletter">
              <Suspense fallback={<PageLoader />}><NewsletterLandingPage /></Suspense>
            </Route>

            {/* ── Distribution OS: Admin Panel ── */}
            <Route path="/admin/distribution/articles">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsArticles /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/newsletters">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsNewsletters /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/carousel-lab">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsCarouselLab /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/x-studio">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsXStudio /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/leads">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsLeads /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/campaigns">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsCampaigns /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/calendar">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsCalendar /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/analytics/command-center">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsAnalyticsCommandCenter /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/analytics/sessions">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsSessionJourneys /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/analytics/goals">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsConversionGoals /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/analytics">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsAnalytics /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/email-campaigns">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsEmailCampaigns /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/drip-sequences">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsDripSequences /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/privacy">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsPrivacy /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/automations">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsAutomations /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/settings">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsSettings /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/reports">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsReports /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/session-replay">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsSessionReplay /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/heatmaps">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsHeatmaps /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/experiments">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsExperiments /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsDashboard /></Suspense></RequireAuth>
            </Route>

            {/* Catch-all → 404 */}
            <Route>
              <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>
            </Route>
          </Switch>
          <PublicWidgets />
        </WouterRouter>
      </LazyMotion>
      <Toaster />
      <McpOverlay domain="szl-holdings" />
      <CookieConsentBanner />
    </QueryClientProvider>
    </DemoModeProvider>
    </SandboxModeProvider>
    </PrismBusProvider>
    </AdPixelProvider>
    </AnalyticsProvider>
  );
}

export default App;
