import { lazy, Suspense, type ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { DemoModeProvider, SandboxModeProvider, CookieBanner, StatusBanner, type StatusBannerConfig } from "@workspace/shared-ui";
import { McpOverlay } from "@workspace/mcp-client";
import { useAuth } from "@workspace/replit-auth-web";
import { AlloyLayout } from "@/alloy/components/alloy-layout";
import { CounselLayout } from "@/prism-counsel/components/counsel-layout";
import { LawyerLifeOSShell } from "@/prism-counsel/components/lawyer-life-os-shell";
import { NyLayout } from "@/prism-counsel/pages/ny/ny-layout";
import { Toaster } from "@workspace/shared-ui/ui/sonner";
import { LANE_ACCENT_HEX } from "@workspace/shared-ui/lane-colors";

const SZL_ACCENT = LANE_ACCENT_HEX.szl.primary;

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
const TrustAIPage = lazy(() => import("@/pages/trust-ai"));
const TrustApprovalsPage = lazy(() => import("@/pages/trust-approvals"));
const TrustExportsPage = lazy(() => import("@/pages/trust-exports"));
const TrustOperationsPage = lazy(() => import("@/pages/trust-operations"));
const InvestorsHubPage = lazy(() => import("@/pages/investors-hub"));
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

const SolutionsPrismCounselPage = lazy(() => import("@/pages/solutions-prism-counsel"));
const SolutionsPrismCounselTrustPage = lazy(() => import("@/pages/solutions-prism-counsel-trust"));
const SolutionsTerraTrustPage = lazy(() => import("@/pages/solutions-terra-trust"));
const SolutionsVesselsTrustPage = lazy(() => import("@/pages/solutions-vessels-trust"));
const SolutionsAegisTrustPage = lazy(() => import("@/pages/solutions-aegis-trust"));
const SolutionsLyteTrustPage = lazy(() => import("@/pages/solutions-lyte-trust"));
const HowItWorksPage = lazy(() => import("@/pages/how-it-works"));

// Standalone premium public product pages
const PrismCounselPublicPage = lazy(() => import("@/pages/prism-counsel-public"));
const TerraPublicPage = lazy(() => import("@/pages/terra-public"));
const VesselsPublicPage = lazy(() => import("@/pages/vessels-public"));
const AegisPublicPage = lazy(() => import("@/pages/aegis-public"));
const CarlotaJoPublicPage = lazy(() => import("@/pages/carlota-jo-public"));

const PrismDashboard = lazy(() => import("@/prism-counsel/pages/dashboard"));
const PrismMattersList = lazy(() => import("@/prism-counsel/pages/matters-list"));
const PrismMatterDetail = lazy(() => import("@/prism-counsel/pages/matter-detail"));
const PrismForecast = lazy(() => import("@/prism-counsel/pages/forecast-page"));
const PrismDeadlines = lazy(() => import("@/prism-counsel/pages/deadlines-page"));
const PrismDiscovery = lazy(() => import("@/prism-counsel/pages/discovery-page"));
const PrismPlaybooks = lazy(() => import("@/prism-counsel/pages/playbooks-page"));
const PrismApprovals = lazy(() => import("@/prism-counsel/pages/approvals-page"));
const PrismCopilot = lazy(() => import("@/prism-counsel/pages/copilot-page"));
const PrismParties = lazy(() => import("@/prism-counsel/pages/parties-page"));
const PrismTrust = lazy(() => import("@/prism-counsel/pages/trust-page"));
const PrismAdmin = lazy(() => import("@/prism-counsel/pages/admin-page"));
const PrismWatchlist = lazy(() => import("@/prism-counsel/pages/watchlist-page"));
const PrismInsurerIntel = lazy(() => import("@/prism-counsel/pages/insurer-intel-page"));
const PrismVenueIntel = lazy(() => import("@/prism-counsel/pages/venue-intel-page"));
const PrismNoFault = lazy(() => import("@/prism-counsel/pages/no-fault-page"));
const PrismNYDashboard = lazy(() => import("@/prism-counsel/pages/ny-dashboard-page"));
const PrismConnectors = lazy(() => import("@/prism-counsel/pages/connectors-page"));
const PrismMatterTwin = lazy(() => import("@/prism-counsel/pages/matter-twin-page"));
const PrismPressureGraph = lazy(() => import("@/prism-counsel/pages/pressure-graph-page"));
const PrismProofChain = lazy(() => import("@/prism-counsel/pages/proof-chain-page"));
const PrismWorldline = lazy(() => import("@/prism-counsel/pages/worldline-page"));
const PrismCopilotWorkbench = lazy(() => import("@/prism-counsel/pages/copilot-workbench-page"));
const PrismAdminHealth = lazy(() => import("@/prism-counsel/pages/admin-health-page"));
const PrismSignalForge = lazy(() => import("@/prism-counsel/pages/signal-forge-page"));
const PrismForecastDiff = lazy(() => import("@/prism-counsel/pages/forecast-diff-page"));

const PilotToday = lazy(() => import("@/prism-counsel/pages/pilot/today-page"));
const PilotMatterDesk = lazy(() => import("@/prism-counsel/pages/pilot/matter-desk-page"));
const PilotWhatChanged = lazy(() => import("@/prism-counsel/pages/pilot/what-changed-page"));
const PilotReviewBeforeSend = lazy(() => import("@/prism-counsel/pages/pilot/review-before-send-page"));
const PilotSignoffQueue = lazy(() => import("@/prism-counsel/pages/pilot/signoff-queue-page"));
const PilotWordExport = lazy(() => import("@/prism-counsel/pages/pilot/word-export-page"));
const PilotAdmin = lazy(() => import("@/prism-counsel/pages/pilot/pilot-admin-page"));
const PilotOnePressureBoard = lazy(() => import("@/prism-counsel/pages/pilot/pressure-board-page"));
const PilotOneFrictionBoard = lazy(() => import("@/prism-counsel/pages/pilot/friction-board-page"));
const PilotOneCarrierWatch = lazy(() => import("@/prism-counsel/pages/pilot/carrier-watch-page"));
const PilotOneMovementBoard = lazy(() => import("@/prism-counsel/pages/pilot/movement-board-page"));
const PilotOneAdmin = lazy(() => import("@/prism-counsel/pages/pilot/pilot-one-admin-page"));

const RecoveryOpsPage = lazy(() => import("@/prism-counsel/pages/recovery-ops-page"));
const SettlementBlockersPage = lazy(() => import("@/prism-counsel/pages/settlement-blockers-page"));
const AdminRecoveryPage = lazy(() => import("@/prism-counsel/pages/admin-recovery-page"));
const S32SettlementBlockersView = lazy(() => import("@/prism-counsel/pages/s32/settlement-blockers-view"));
const S32RecoveryView = lazy(() => import("@/prism-counsel/pages/s32/recovery-view"));

const S31CopilotWorkbench = lazy(() => import("@/prism-counsel/pages/s31/copilot-workbench"));
const S31WorldlineDashboard = lazy(() => import("@/prism-counsel/pages/s31/worldline-dashboard"));
const S31PressureGraph = lazy(() => import("@/prism-counsel/pages/s31/pressure-graph-page"));
const S31MatterTwin = lazy(() => import("@/prism-counsel/pages/s31/matter-twin-page"));
const S31ProofChain = lazy(() => import("@/prism-counsel/pages/s31/proof-chain-page"));
const S31ModelMesh = lazy(() => import("@/prism-counsel/pages/s31/model-mesh-admin"));
const S31CostTracking = lazy(() => import("@/prism-counsel/pages/s31/cost-tracking-page"));
const S31ForecastDiff = lazy(() => import("@/prism-counsel/pages/s31/forecast-diff-page"));
const S31DataProducts = lazy(() => import("@/prism-counsel/pages/s31/data-products-page"));

const PrismReviewDesk = lazy(() => import("@/prism-counsel/pages/review-desk/review-desk-page"));
const PrismReviewMetrics = lazy(() => import("@/prism-counsel/pages/review-desk/review-metrics-page"));
const PrismReviewAdmin = lazy(() => import("@/prism-counsel/pages/review-desk/review-admin-page"));
const PrismMyReview = lazy(() => import("@/prism-counsel/pages/review-desk/my-review-page"));

const AdminPurviewPage = lazy(() => import("@/prism-counsel/pages/admin-purview-page"));
const AdminQualityPage = lazy(() => import("@/prism-counsel/pages/admin-quality-page"));
const AdminOpsDiagnosticsPage = lazy(() => import("@/prism-counsel/pages/admin-ops-diagnostics-page"));
const AdminReplaysEnhancedPage = lazy(() => import("@/prism-counsel/pages/admin-replays-enhanced-page"));
const AdminModelCostsEnhancedPage = lazy(() => import("@/prism-counsel/pages/admin-model-costs-enhanced-page"));
const AdminM365Page = lazy(() => import("@/prism-counsel/pages/admin-m365-page"));

const S32MorningBrief = lazy(() => import("@/prism-counsel/pages/s32/morning-brief-page"));
const S32PrepMode = lazy(() => import("@/prism-counsel/pages/s32/prep-mode-page"));
const S32QuietRisk = lazy(() => import("@/prism-counsel/pages/s32/quiet-risk-page"));
const S32OpsLite = lazy(() => import("@/prism-counsel/pages/s32/ops-lite-page"));
const S32NamedWorkflows = lazy(() => import("@/prism-counsel/pages/s32/named-workflows-page"));
const S32CopilotWorkbenchV2 = lazy(() => import("@/prism-counsel/pages/s32/copilot-workbench-v2"));
const S32PurviewBridge = lazy(() => import("@/prism-counsel/pages/s32/purview-bridge-page"));
const S32MatterDeskV2 = lazy(() => import("@/prism-counsel/pages/s32/matter-desk-v2"));

const NyOverview = lazy(() => import("@/prism-counsel/pages/ny/ny-overview"));
const NyDashboard = lazy(() => import("@/prism-counsel/pages/ny/ny-dashboard"));
const NyWatchlist = lazy(() => import("@/prism-counsel/pages/ny/ny-watchlist"));
const NyDeadlines = lazy(() => import("@/prism-counsel/pages/ny/ny-deadlines"));
const NyNoFault = lazy(() => import("@/prism-counsel/pages/ny/ny-no-fault"));
const NyCoverage = lazy(() => import("@/prism-counsel/pages/ny/ny-coverage"));
const NyMediation = lazy(() => import("@/prism-counsel/pages/ny/ny-mediation"));
const NyForecast = lazy(() => import("@/prism-counsel/pages/ny/ny-forecast"));
const NyInsurerIntel = lazy(() => import("@/prism-counsel/pages/ny/ny-insurer-intel"));
const NyVenueIntel = lazy(() => import("@/prism-counsel/pages/ny/ny-venue-intel"));
const NyCopilot = lazy(() => import("@/prism-counsel/pages/ny/ny-copilot"));
const NyTrust = lazy(() => import("@/prism-counsel/pages/ny/ny-trust"));
const NyPlaybooks = lazy(() => import("@/prism-counsel/pages/ny/ny-playbooks"));

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

function CounselAppPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen" style={{ background: "#080c14" }}>
      <div className="flex-1 overflow-hidden">
        <CounselLayout>{children}</CounselLayout>
      </div>
    </div>
  );
}

function LawyerOSAppPage({ children }: { children: ReactNode }) {
  return (
    <div style={{ height: "100vh", background: "#080c14" }}>
      <LawyerLifeOSShell>{children}</LawyerLifeOSShell>
    </div>
  );
}

function NyAppPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen" style={{ background: "#080c14" }}>
      <div className="flex-1 overflow-hidden">
        <NyLayout>{children}</NyLayout>
      </div>
    </div>
  );
}

function CounselMatterRoute({ params }: { params: { id: string } }) {
  const id = parseInt(params.id ?? "0");
  return <PrismMatterDetail id={id} />;
}

function S32MatterDeskV2RouteWrapper({ params }: { params: { id: string } }) {
  return <S32MatterDeskV2 />;
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
            <Route path="/design-partner">
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

            {/* ── Standalone premium public product pages ── */}
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

            {/* ── PRISM Counsel app routes ── */}
            <Route path="/prism-counsel">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismDashboard /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/matters">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismMattersList /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/matters/:id">
              {(params) => <Suspense fallback={<PageLoader />}><CounselAppPage><CounselMatterRoute params={params} /></CounselAppPage></Suspense>}
            </Route>
            <Route path="/prism-counsel/forecast">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismForecast /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/deadlines">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismDeadlines /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/discovery">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismDiscovery /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/playbooks">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismPlaybooks /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/approvals">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismApprovals /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/copilot">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismCopilot /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/parties">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismParties /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/trust">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismTrust /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/admin">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismAdmin /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/watchlist">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismWatchlist /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/insurer-intel">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismInsurerIntel /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/venue-intel">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismVenueIntel /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/no-fault">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismNoFault /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/connectors">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismConnectors /></CounselAppPage></Suspense>
            </Route>

            {/* ── PRISM Counsel Pilot Two — Managed Review Desk ── */}
            <Route path="/prism-counsel/review-desk">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismReviewDesk /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/review-desk/metrics">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismReviewMetrics /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/review-desk/admin">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismReviewAdmin /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/review-desk/my-review">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismMyReview /></CounselAppPage></Suspense>
            </Route>

            {/* ── PRISM Counsel Pilot Zero routes ── */}
            <Route path="/prism-counsel/today">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotToday /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/matter-desk/:id">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotMatterDesk /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/what-changed">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotWhatChanged /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/review-before-send">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotReviewBeforeSend /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/signoff-queue">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotSignoffQueue /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/word-export">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotWordExport /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/pilot-admin">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotAdmin /></CounselAppPage></Suspense>
            </Route>

            {/* ── PRISM Counsel Pilot One — Moat Layer Boards ── */}
            <Route path="/prism-counsel/pressure-board">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotOnePressureBoard /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/friction-board">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotOneFrictionBoard /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/carrier-watch">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotOneCarrierWatch /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/movement-board">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotOneMovementBoard /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/pilot-one-admin">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PilotOneAdmin /></CounselAppPage></Suspense>
            </Route>

            {/* ── PRISM Counsel Pilot Two — Recovery & Lien Ops ── */}
            <Route path="/prism-counsel/recovery-ops">
              <Suspense fallback={<PageLoader />}><CounselAppPage><RecoveryOpsPage /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/settlement-blockers">
              <Suspense fallback={<PageLoader />}><CounselAppPage><SettlementBlockersPage /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/admin/recovery">
              <Suspense fallback={<PageLoader />}><CounselAppPage><AdminRecoveryPage /></CounselAppPage></Suspense>
            </Route>

            {/* ── PRISM Counsel Pilot Two — Purview Bridge & M365 Admin ── */}
            <Route path="/prism-counsel/admin/purview">
              <Suspense fallback={<PageLoader />}><CounselAppPage><AdminPurviewPage /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/admin/quality">
              <Suspense fallback={<PageLoader />}><CounselAppPage><AdminQualityPage /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/admin/ops-diagnostics">
              <Suspense fallback={<PageLoader />}><CounselAppPage><AdminOpsDiagnosticsPage /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/admin/replays">
              <Suspense fallback={<PageLoader />}><CounselAppPage><AdminReplaysEnhancedPage /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/admin/model-costs">
              <Suspense fallback={<PageLoader />}><CounselAppPage><AdminModelCostsEnhancedPage /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/admin/m365">
              <Suspense fallback={<PageLoader />}><CounselAppPage><AdminM365Page /></CounselAppPage></Suspense>
            </Route>

            {/* ── PRISM Counsel Section 31 routes (flat paths) ── */}
            <Route path="/prism-counsel/pressure-graph">
              <Suspense fallback={<PageLoader />}><CounselAppPage><S31PressureGraph /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/matter-twin">
              <Suspense fallback={<PageLoader />}><CounselAppPage><S31MatterTwin /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/proof-chain">
              <Suspense fallback={<PageLoader />}><CounselAppPage><S31ProofChain /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/model-mesh">
              <Suspense fallback={<PageLoader />}><CounselAppPage><S31ModelMesh /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/costs">
              <Suspense fallback={<PageLoader />}><CounselAppPage><S31CostTracking /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/data-products">
              <Suspense fallback={<PageLoader />}><CounselAppPage><S31DataProducts /></CounselAppPage></Suspense>
            </Route>

            {/* ── PRISM Counsel Legal OS — expanded subsystem routes ── */}
            <Route path="/prism-counsel/matters/:id/twin">
              {(params) => <Suspense fallback={<PageLoader />}><CounselAppPage><PrismMatterTwin /></CounselAppPage></Suspense>}
            </Route>
            <Route path="/prism-counsel/matters/:id/pressure">
              {(params) => <Suspense fallback={<PageLoader />}><CounselAppPage><PrismPressureGraph /></CounselAppPage></Suspense>}
            </Route>
            <Route path="/prism-counsel/matters/:id/proof-chain">
              {(params) => <Suspense fallback={<PageLoader />}><CounselAppPage><PrismProofChain /></CounselAppPage></Suspense>}
            </Route>
            <Route path="/prism-counsel/worldline">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismWorldline /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/copilot-workbench">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismCopilotWorkbench /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/admin/health">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismAdminHealth /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/signal-forge">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismSignalForge /></CounselAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/forecast-diff">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismForecastDiff /></CounselAppPage></Suspense>
            </Route>

            {/* ── PRISM Counsel Section 32 — Lawyer Life OS routes ── */}
            <Route path="/prism-counsel/morning-brief">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32MorningBrief /></LawyerOSAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/prep">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32PrepMode /></LawyerOSAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/prep/:flow">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32PrepMode /></LawyerOSAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/quiet-risk">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32QuietRisk /></LawyerOSAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ops-lite">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32OpsLite /></LawyerOSAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/workflows">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32NamedWorkflows /></LawyerOSAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/workflows/:id">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32NamedWorkflows /></LawyerOSAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/copilot-workbench-v2">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32CopilotWorkbenchV2 /></LawyerOSAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/purview-bridge">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32PurviewBridge /></LawyerOSAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/matter-desk-v2/:id">
              {(params) => <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32MatterDeskV2RouteWrapper params={params} /></LawyerOSAppPage></Suspense>}
            </Route>

            {/* ── Pilot Two — Lawyer Life OS (S32) views ── */}
            <Route path="/prism-counsel/recovery-view">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32RecoveryView /></LawyerOSAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/settlement-blockers-view">
              <Suspense fallback={<PageLoader />}><LawyerOSAppPage><S32SettlementBlockersView /></LawyerOSAppPage></Suspense>
            </Route>

            <Route path="/prism-counsel/ny">
              <Suspense fallback={<PageLoader />}><CounselAppPage><PrismNYDashboard /></CounselAppPage></Suspense>
            </Route>

            {/* ── PRISM Counsel NY Insurance Observability routes ── */}
            <Route path="/prism-counsel/ny">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyOverview /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/dashboard">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyDashboard /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/watchlist">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyWatchlist /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/deadlines">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyDeadlines /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/no-fault">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyNoFault /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/coverage">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyCoverage /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/mediation">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyMediation /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/forecast">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyForecast /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/insurer-intel">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyInsurerIntel /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/venue-intel">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyVenueIntel /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/copilot">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyCopilot /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/trust">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyTrust /></NyAppPage></Suspense>
            </Route>
            <Route path="/prism-counsel/ny/playbooks">
              <Suspense fallback={<PageLoader />}><NyAppPage><NyPlaybooks /></NyAppPage></Suspense>
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
            <Route path="/alloy/mcp-store">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyMcpStore /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/mcp-tools">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyMcpToolCreator /></AlloyAppPage></Suspense>
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
              <Redirect to="/investors/overview" />
            </Route>
            <Route path="/ecosystem">
              <Redirect to="/" />
            </Route>
            <Route path="/founder">
              <Redirect to="/investors/founder" />
            </Route>
            <Route path="/case-studies">
              <Redirect to="/" />
            </Route>
            <Route path="/insights">
              <Redirect to="/" />
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
      <McpOverlay domain="szl-holdings" />
      <CookieBanner privacyUrl="/legal/privacy" accentColor={SZL_ACCENT} />
    </QueryClientProvider>
    </DemoModeProvider>
    </SandboxModeProvider>
  );
}

export default App;
