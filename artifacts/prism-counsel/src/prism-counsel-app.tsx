import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { DemoModeProvider } from "@szl-holdings/shared-ui";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { PrismCounselShell } from "./components/prism-shell";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false, staleTime: 5 * 60 * 1000 },
  },
});

function PageLoader() {
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080c14" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #c8a96e30", borderTopColor: "#c8a96e", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <PrismCounselShell>{children}</PrismCounselShell>;
}

const PrismDashboard = lazy(() => import("./pages/dashboard"));
const PrismMattersList = lazy(() => import("./pages/matters-list"));
const PrismMatterDetail = lazy(() => import("./pages/matter-detail"));
const PrismForecast = lazy(() => import("./pages/forecast-page"));
const PrismDeadlines = lazy(() => import("./pages/deadlines-page"));
const PrismDiscovery = lazy(() => import("./pages/discovery-page"));
const PrismPlaybooks = lazy(() => import("./pages/playbooks-page"));
const PrismApprovals = lazy(() => import("./pages/approvals-page"));
const PrismCopilot = lazy(() => import("./pages/copilot-page"));
const PrismParties = lazy(() => import("./pages/parties-page"));
const PrismTrust = lazy(() => import("./pages/trust-page"));
const PrismMarketingLanding = lazy(() => import("./pages/marketing-landing"));
const PrismAdmin = lazy(() => import("./pages/admin-page"));
const PrismWatchlist = lazy(() => import("./pages/watchlist-page"));
const PrismInsurerIntel = lazy(() => import("./pages/insurer-intel-page"));
const PrismVenueIntel = lazy(() => import("./pages/venue-intel-page"));
const PrismNoFault = lazy(() => import("./pages/no-fault-page"));
const PrismNYDashboard = lazy(() => import("./pages/ny-dashboard-page"));
const PrismConnectors = lazy(() => import("./pages/connectors-page"));
const PrismMatterTwin = lazy(() => import("./pages/matter-twin-page"));
const PrismPressureGraph = lazy(() => import("./pages/pressure-graph-page"));
const PrismProofChain = lazy(() => import("./pages/proof-chain-page"));
const PrismWorldline = lazy(() => import("./pages/worldline-page"));
const PrismCopilotWorkbench = lazy(() => import("./pages/copilot-workbench-page"));
const PrismAdminHealth = lazy(() => import("./pages/admin-health-page"));
const PrismSignalForge = lazy(() => import("./pages/signal-forge-page"));
const PrismForecastDiff = lazy(() => import("./pages/forecast-diff-page"));
const PrismReviewDesk = lazy(() => import("./pages/review-desk/review-desk-page"));
const PrismReviewMetrics = lazy(() => import("./pages/review-desk/review-metrics-page"));
const PrismReviewAdmin = lazy(() => import("./pages/review-desk/review-admin-page"));
const PrismMyReview = lazy(() => import("./pages/review-desk/my-review-page"));

const PilotToday = lazy(() => import("./pages/pilot/today-page"));
const PilotMatterDesk = lazy(() => import("./pages/pilot/matter-desk-page"));
const PilotWhatChanged = lazy(() => import("./pages/pilot/what-changed-page"));
const PilotReviewBeforeSend = lazy(() => import("./pages/pilot/review-before-send-page"));
const PilotSignoffQueue = lazy(() => import("./pages/pilot/signoff-queue-page"));
const PilotWordExport = lazy(() => import("./pages/pilot/word-export-page"));
const PilotAdmin = lazy(() => import("./pages/pilot/pilot-admin-page"));
const PilotOnePressureBoard = lazy(() => import("./pages/pilot/pressure-board-page"));
const PilotOneFrictionBoard = lazy(() => import("./pages/pilot/friction-board-page"));
const PilotOneCarrierWatch = lazy(() => import("./pages/pilot/carrier-watch-page"));
const PilotOneMovementBoard = lazy(() => import("./pages/pilot/movement-board-page"));
const PilotOneAdmin = lazy(() => import("./pages/pilot/pilot-one-admin-page"));

const RecoveryOpsPage = lazy(() => import("./pages/recovery-ops-page"));
const SettlementBlockersPage = lazy(() => import("./pages/settlement-blockers-page"));
const AdminRecoveryPage = lazy(() => import("./pages/admin-recovery-page"));
const S32SettlementBlockersView = lazy(() => import("./pages/s32/settlement-blockers-view"));
const S32RecoveryView = lazy(() => import("./pages/s32/recovery-view"));

const S31PressureGraph = lazy(() => import("./pages/s31/pressure-graph-page"));
const S31MatterTwin = lazy(() => import("./pages/s31/matter-twin-page"));
const S31ProofChain = lazy(() => import("./pages/s31/proof-chain-page"));
const S31ModelMesh = lazy(() => import("./pages/s31/model-mesh-admin"));
const S31CostTracking = lazy(() => import("./pages/s31/cost-tracking-page"));
const S31DataProducts = lazy(() => import("./pages/s31/data-products-page"));

const AdminPurviewPage = lazy(() => import("./pages/admin-purview-page"));
const AdminQualityPage = lazy(() => import("./pages/admin-quality-page"));
const AdminOpsDiagnosticsPage = lazy(() => import("./pages/admin-ops-diagnostics-page"));
const AdminReplaysEnhancedPage = lazy(() => import("./pages/admin-replays-enhanced-page"));
const AdminModelCostsEnhancedPage = lazy(() => import("./pages/admin-model-costs-enhanced-page"));
const AdminM365Page = lazy(() => import("./pages/admin-m365-page"));

const P2PortfolioOverview = lazy(() => import("./pages/p2/portfolio-overview-page"));
const P2PressureBoard = lazy(() => import("./pages/p2/pressure-board-page"));
const P2FrictionBoard = lazy(() => import("./pages/p2/friction-board-page"));
const P2ReviewBacklog = lazy(() => import("./pages/p2/review-backlog-board-page"));
const P2ApprovalBottleneck = lazy(() => import("./pages/p2/approval-bottleneck-board-page"));
const P2RecoveryLien = lazy(() => import("./pages/p2/recovery-lien-board-page"));
const P2InsurerPressure = lazy(() => import("./pages/p2/insurer-pressure-board-page"));
const P2MovementOpportunity = lazy(() => import("./pages/p2/movement-opportunity-board-page"));
const P2QuietRisk = lazy(() => import("./pages/p2/quiet-risk-board-page"));
const P2TeamThroughput = lazy(() => import("./pages/p2/team-throughput-board-page"));
const P2PortfolioDigests = lazy(() => import("./pages/p2/portfolio-digests-page"));
const P2PortfolioForecast = lazy(() => import("./pages/p2/portfolio-forecast-page"));
const P2PartnerLifeOs = lazy(() => import("./pages/p2/partner-life-os-page"));
const P2AdminPortfolio = lazy(() => import("./pages/p2/admin-portfolio-page"));

const S32MorningBrief = lazy(() => import("./pages/s32/morning-brief-page"));
const S32PrepMode = lazy(() => import("./pages/s32/prep-mode-page"));
const S32QuietRisk = lazy(() => import("./pages/s32/quiet-risk-page"));
const S32OpsLite = lazy(() => import("./pages/s32/ops-lite-page"));
const S32NamedWorkflows = lazy(() => import("./pages/s32/named-workflows-page"));
const S32CopilotWorkbenchV2 = lazy(() => import("./pages/s32/copilot-workbench-v2"));
const S32PurviewBridge = lazy(() => import("./pages/s32/purview-bridge-page"));
const S32MatterDeskV2 = lazy(() => import("./pages/s32/matter-desk-v2"));

const NyOverview = lazy(() => import("./pages/ny/ny-overview"));
const NyDashboard = lazy(() => import("./pages/ny/ny-dashboard"));
const NyWatchlist = lazy(() => import("./pages/ny/ny-watchlist"));
const NyDeadlines = lazy(() => import("./pages/ny/ny-deadlines"));
const NyNoFault = lazy(() => import("./pages/ny/ny-no-fault"));
const NyCoverage = lazy(() => import("./pages/ny/ny-coverage"));
const NyMediation = lazy(() => import("./pages/ny/ny-mediation"));
const NyForecast = lazy(() => import("./pages/ny/ny-forecast"));
const NyInsurerIntel = lazy(() => import("./pages/ny/ny-insurer-intel"));
const NyVenueIntel = lazy(() => import("./pages/ny/ny-venue-intel"));
const NyCopilot = lazy(() => import("./pages/ny/ny-copilot"));
const NyTrust = lazy(() => import("./pages/ny/ny-trust"));
const NyPlaybooks = lazy(() => import("./pages/ny/ny-playbooks"));

function MatterRoute({ params }: { params: { id: string } }) {
  const id = parseInt(params.id ?? "0");
  return <PrismMatterDetail id={id} />;
}

function MatterDeskV2Wrapper() {
  return <S32MatterDeskV2 />;
}

function PrismCounselRoutes() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <PrismMarketingLanding />
      </Suspense>
    );
  }

  return (
    <Switch>
      <Route path="/marketing">
        <Suspense fallback={<PageLoader />}><PrismMarketingLanding /></Suspense>
      </Route>

      <Route path="/overview">
        <Redirect to="/" />
      </Route>
      {/* /matters (canonical) */}
      <Route path="/matters">
        <Suspense fallback={<PageLoader />}><Wrap><PrismMattersList /></Wrap></Suspense>
      </Route>
      {/* /documents → discovery */}
      <Route path="/documents">
        <Redirect to="/discovery" />
      </Route>
      {/* /review → review-desk */}
      <Route path="/review">
        <Redirect to="/review-desk" />
      </Route>
      {/* /section-31 → worldline (Section 31 entry) */}
      <Route path="/section-31">
        <Redirect to="/worldline" />
      </Route>
      {/* /practice/ny → NY Command */}
      <Route path="/practice/ny">
        <Redirect to="/ny" />
      </Route>
      <Route path="/practice/ny/:sub">
        {(params) => <Redirect to={`/ny/${params.sub}`} />}
      </Route>
      {/* /search → open command bar alias (redirect to dashboard with search param) */}
      <Route path="/search">
        <Redirect to="/" />
      </Route>
      {/* /settings → admin */}
      <Route path="/settings">
        <Redirect to="/admin" />
      </Route>
      {/* /intelligence → copilot */}
      <Route path="/intelligence">
        <Redirect to="/copilot" />
      </Route>

      {/* ── Primary app route: dashboard ── */}
      <Route path="/">
        <Suspense fallback={<PageLoader />}><Wrap><PrismDashboard /></Wrap></Suspense>
      </Route>
      <Route path="/matters/:id/twin">
        {(params) => <Suspense fallback={<PageLoader />}><Wrap><PrismMatterTwin /></Wrap></Suspense>}
      </Route>
      <Route path="/matters/:id/pressure">
        {(params) => <Suspense fallback={<PageLoader />}><Wrap><PrismPressureGraph /></Wrap></Suspense>}
      </Route>
      <Route path="/matters/:id/proof-chain">
        {(params) => <Suspense fallback={<PageLoader />}><Wrap><PrismProofChain /></Wrap></Suspense>}
      </Route>
      <Route path="/matters/:id">
        {(params) => <Suspense fallback={<PageLoader />}><Wrap><MatterRoute params={params} /></Wrap></Suspense>}
      </Route>
      <Route path="/forecast">
        <Suspense fallback={<PageLoader />}><Wrap><PrismForecast /></Wrap></Suspense>
      </Route>
      <Route path="/deadlines">
        <Suspense fallback={<PageLoader />}><Wrap><PrismDeadlines /></Wrap></Suspense>
      </Route>
      <Route path="/discovery">
        <Suspense fallback={<PageLoader />}><Wrap><PrismDiscovery /></Wrap></Suspense>
      </Route>
      <Route path="/playbooks">
        <Suspense fallback={<PageLoader />}><Wrap><PrismPlaybooks /></Wrap></Suspense>
      </Route>
      <Route path="/approvals">
        <Suspense fallback={<PageLoader />}><Wrap><PrismApprovals /></Wrap></Suspense>
      </Route>
      <Route path="/copilot">
        <Suspense fallback={<PageLoader />}><Wrap><PrismCopilot /></Wrap></Suspense>
      </Route>
      <Route path="/parties">
        <Suspense fallback={<PageLoader />}><Wrap><PrismParties /></Wrap></Suspense>
      </Route>
      <Route path="/trust">
        <Suspense fallback={<PageLoader />}><Wrap><PrismTrust /></Wrap></Suspense>
      </Route>
      <Route path="/admin">
        <Suspense fallback={<PageLoader />}><Wrap><PrismAdmin /></Wrap></Suspense>
      </Route>
      <Route path="/watchlist">
        <Suspense fallback={<PageLoader />}><Wrap><PrismWatchlist /></Wrap></Suspense>
      </Route>
      <Route path="/insurer-intel">
        <Suspense fallback={<PageLoader />}><Wrap><PrismInsurerIntel /></Wrap></Suspense>
      </Route>
      <Route path="/venue-intel">
        <Suspense fallback={<PageLoader />}><Wrap><PrismVenueIntel /></Wrap></Suspense>
      </Route>
      <Route path="/no-fault">
        <Suspense fallback={<PageLoader />}><Wrap><PrismNoFault /></Wrap></Suspense>
      </Route>
      <Route path="/connectors">
        <Suspense fallback={<PageLoader />}><Wrap><PrismConnectors /></Wrap></Suspense>
      </Route>

      <Route path="/review-desk/metrics">
        <Suspense fallback={<PageLoader />}><Wrap><PrismReviewMetrics /></Wrap></Suspense>
      </Route>
      <Route path="/review-desk/admin">
        <Suspense fallback={<PageLoader />}><Wrap><PrismReviewAdmin /></Wrap></Suspense>
      </Route>
      <Route path="/review-desk/my-review">
        <Suspense fallback={<PageLoader />}><Wrap><PrismMyReview /></Wrap></Suspense>
      </Route>
      <Route path="/review-desk">
        <Suspense fallback={<PageLoader />}><Wrap><PrismReviewDesk /></Wrap></Suspense>
      </Route>

      <Route path="/today">
        <Suspense fallback={<PageLoader />}><Wrap><PilotToday /></Wrap></Suspense>
      </Route>
      <Route path="/matter-desk/:id">
        <Suspense fallback={<PageLoader />}><Wrap><PilotMatterDesk /></Wrap></Suspense>
      </Route>
      <Route path="/what-changed">
        <Suspense fallback={<PageLoader />}><Wrap><PilotWhatChanged /></Wrap></Suspense>
      </Route>
      <Route path="/review-before-send">
        <Suspense fallback={<PageLoader />}><Wrap><PilotReviewBeforeSend /></Wrap></Suspense>
      </Route>
      <Route path="/signoff-queue">
        <Suspense fallback={<PageLoader />}><Wrap><PilotSignoffQueue /></Wrap></Suspense>
      </Route>
      <Route path="/word-export">
        <Suspense fallback={<PageLoader />}><Wrap><PilotWordExport /></Wrap></Suspense>
      </Route>
      <Route path="/pilot-admin">
        <Suspense fallback={<PageLoader />}><Wrap><PilotAdmin /></Wrap></Suspense>
      </Route>
      <Route path="/pressure-board">
        <Suspense fallback={<PageLoader />}><Wrap><PilotOnePressureBoard /></Wrap></Suspense>
      </Route>
      <Route path="/friction-board">
        <Suspense fallback={<PageLoader />}><Wrap><PilotOneFrictionBoard /></Wrap></Suspense>
      </Route>
      <Route path="/carrier-watch">
        <Suspense fallback={<PageLoader />}><Wrap><PilotOneCarrierWatch /></Wrap></Suspense>
      </Route>
      <Route path="/movement-board">
        <Suspense fallback={<PageLoader />}><Wrap><PilotOneMovementBoard /></Wrap></Suspense>
      </Route>
      <Route path="/pilot-one-admin">
        <Suspense fallback={<PageLoader />}><Wrap><PilotOneAdmin /></Wrap></Suspense>
      </Route>

      <Route path="/recovery-ops">
        <Suspense fallback={<PageLoader />}><Wrap><RecoveryOpsPage /></Wrap></Suspense>
      </Route>
      <Route path="/settlement-blockers">
        <Suspense fallback={<PageLoader />}><Wrap><SettlementBlockersPage /></Wrap></Suspense>
      </Route>
      <Route path="/admin/recovery">
        <Suspense fallback={<PageLoader />}><Wrap><AdminRecoveryPage /></Wrap></Suspense>
      </Route>
      <Route path="/admin/purview">
        <Suspense fallback={<PageLoader />}><Wrap><AdminPurviewPage /></Wrap></Suspense>
      </Route>
      <Route path="/admin/quality">
        <Suspense fallback={<PageLoader />}><Wrap><AdminQualityPage /></Wrap></Suspense>
      </Route>
      <Route path="/admin/ops-diagnostics">
        <Suspense fallback={<PageLoader />}><Wrap><AdminOpsDiagnosticsPage /></Wrap></Suspense>
      </Route>
      <Route path="/admin/replays">
        <Suspense fallback={<PageLoader />}><Wrap><AdminReplaysEnhancedPage /></Wrap></Suspense>
      </Route>
      <Route path="/admin/model-costs">
        <Suspense fallback={<PageLoader />}><Wrap><AdminModelCostsEnhancedPage /></Wrap></Suspense>
      </Route>
      <Route path="/admin/m365">
        <Suspense fallback={<PageLoader />}><Wrap><AdminM365Page /></Wrap></Suspense>
      </Route>
      <Route path="/admin/health">
        <Suspense fallback={<PageLoader />}><Wrap><PrismAdminHealth /></Wrap></Suspense>
      </Route>

      <Route path="/pressure-graph">
        <Suspense fallback={<PageLoader />}><Wrap><S31PressureGraph /></Wrap></Suspense>
      </Route>
      <Route path="/matter-twin">
        <Suspense fallback={<PageLoader />}><Wrap><S31MatterTwin /></Wrap></Suspense>
      </Route>
      <Route path="/proof-chain">
        <Suspense fallback={<PageLoader />}><Wrap><S31ProofChain /></Wrap></Suspense>
      </Route>
      <Route path="/model-mesh">
        <Suspense fallback={<PageLoader />}><Wrap><S31ModelMesh /></Wrap></Suspense>
      </Route>
      <Route path="/costs">
        <Suspense fallback={<PageLoader />}><Wrap><S31CostTracking /></Wrap></Suspense>
      </Route>
      <Route path="/data-products">
        <Suspense fallback={<PageLoader />}><Wrap><S31DataProducts /></Wrap></Suspense>
      </Route>
      <Route path="/worldline">
        <Suspense fallback={<PageLoader />}><Wrap><PrismWorldline /></Wrap></Suspense>
      </Route>
      <Route path="/copilot-workbench">
        <Suspense fallback={<PageLoader />}><Wrap><PrismCopilotWorkbench /></Wrap></Suspense>
      </Route>
      <Route path="/signal-forge">
        <Suspense fallback={<PageLoader />}><Wrap><PrismSignalForge /></Wrap></Suspense>
      </Route>
      <Route path="/forecast-diff">
        <Suspense fallback={<PageLoader />}><Wrap><PrismForecastDiff /></Wrap></Suspense>
      </Route>

      <Route path="/portfolio/pressure-board">
        <Suspense fallback={<PageLoader />}><Wrap><P2PressureBoard /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/friction-board">
        <Suspense fallback={<PageLoader />}><Wrap><P2FrictionBoard /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/review-backlog">
        <Suspense fallback={<PageLoader />}><Wrap><P2ReviewBacklog /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/approval-bottleneck">
        <Suspense fallback={<PageLoader />}><Wrap><P2ApprovalBottleneck /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/recovery-lien">
        <Suspense fallback={<PageLoader />}><Wrap><P2RecoveryLien /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/insurer-pressure">
        <Suspense fallback={<PageLoader />}><Wrap><P2InsurerPressure /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/movement-opportunity">
        <Suspense fallback={<PageLoader />}><Wrap><P2MovementOpportunity /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/quiet-risk">
        <Suspense fallback={<PageLoader />}><Wrap><P2QuietRisk /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/throughput">
        <Suspense fallback={<PageLoader />}><Wrap><P2TeamThroughput /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/digests">
        <Suspense fallback={<PageLoader />}><Wrap><P2PortfolioDigests /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/forecast">
        <Suspense fallback={<PageLoader />}><Wrap><P2PortfolioForecast /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/partner-view">
        <Suspense fallback={<PageLoader />}><Wrap><P2PartnerLifeOs /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio/admin">
        <Suspense fallback={<PageLoader />}><Wrap><P2AdminPortfolio /></Wrap></Suspense>
      </Route>
      <Route path="/portfolio">
        <Suspense fallback={<PageLoader />}><Wrap><P2PortfolioOverview /></Wrap></Suspense>
      </Route>

      <Route path="/morning-brief">
        <Suspense fallback={<PageLoader />}><Wrap><S32MorningBrief /></Wrap></Suspense>
      </Route>
      <Route path="/prep/:flow">
        <Suspense fallback={<PageLoader />}><Wrap><S32PrepMode /></Wrap></Suspense>
      </Route>
      <Route path="/prep">
        <Suspense fallback={<PageLoader />}><Wrap><S32PrepMode /></Wrap></Suspense>
      </Route>
      <Route path="/quiet-risk">
        <Suspense fallback={<PageLoader />}><Wrap><S32QuietRisk /></Wrap></Suspense>
      </Route>
      <Route path="/ops-lite">
        <Suspense fallback={<PageLoader />}><Wrap><S32OpsLite /></Wrap></Suspense>
      </Route>
      <Route path="/workflows/:id">
        <Suspense fallback={<PageLoader />}><Wrap><S32NamedWorkflows /></Wrap></Suspense>
      </Route>
      <Route path="/workflows">
        <Suspense fallback={<PageLoader />}><Wrap><S32NamedWorkflows /></Wrap></Suspense>
      </Route>
      <Route path="/copilot-workbench-v2">
        <Suspense fallback={<PageLoader />}><Wrap><S32CopilotWorkbenchV2 /></Wrap></Suspense>
      </Route>
      <Route path="/purview-bridge">
        <Suspense fallback={<PageLoader />}><Wrap><S32PurviewBridge /></Wrap></Suspense>
      </Route>
      <Route path="/matter-desk-v2/:id">
        <Suspense fallback={<PageLoader />}><Wrap><MatterDeskV2Wrapper /></Wrap></Suspense>
      </Route>
      <Route path="/recovery-view">
        <Suspense fallback={<PageLoader />}><Wrap><S32RecoveryView /></Wrap></Suspense>
      </Route>
      <Route path="/settlement-blockers-view">
        <Suspense fallback={<PageLoader />}><Wrap><S32SettlementBlockersView /></Wrap></Suspense>
      </Route>

      <Route path="/ny/dashboard">
        <Suspense fallback={<PageLoader />}><Wrap><NyDashboard /></Wrap></Suspense>
      </Route>
      <Route path="/ny/watchlist">
        <Suspense fallback={<PageLoader />}><Wrap><NyWatchlist /></Wrap></Suspense>
      </Route>
      <Route path="/ny/deadlines">
        <Suspense fallback={<PageLoader />}><Wrap><NyDeadlines /></Wrap></Suspense>
      </Route>
      <Route path="/ny/no-fault">
        <Suspense fallback={<PageLoader />}><Wrap><NyNoFault /></Wrap></Suspense>
      </Route>
      <Route path="/ny/coverage">
        <Suspense fallback={<PageLoader />}><Wrap><NyCoverage /></Wrap></Suspense>
      </Route>
      <Route path="/ny/mediation">
        <Suspense fallback={<PageLoader />}><Wrap><NyMediation /></Wrap></Suspense>
      </Route>
      <Route path="/ny/forecast">
        <Suspense fallback={<PageLoader />}><Wrap><NyForecast /></Wrap></Suspense>
      </Route>
      <Route path="/ny/insurer-intel">
        <Suspense fallback={<PageLoader />}><Wrap><NyInsurerIntel /></Wrap></Suspense>
      </Route>
      <Route path="/ny/venue-intel">
        <Suspense fallback={<PageLoader />}><Wrap><NyVenueIntel /></Wrap></Suspense>
      </Route>
      <Route path="/ny/copilot">
        <Suspense fallback={<PageLoader />}><Wrap><NyCopilot /></Wrap></Suspense>
      </Route>
      <Route path="/ny/trust">
        <Suspense fallback={<PageLoader />}><Wrap><NyTrust /></Wrap></Suspense>
      </Route>
      <Route path="/ny/playbooks">
        <Suspense fallback={<PageLoader />}><Wrap><NyPlaybooks /></Wrap></Suspense>
      </Route>
      <Route path="/ny">
        <Suspense fallback={<PageLoader />}><Wrap><NyOverview /></Wrap></Suspense>
      </Route>

      <Route>
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#080c14", color: "#c8a96e", fontFamily: "Inter, system-ui, sans-serif" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>404</div>
            <div style={{ fontSize: "0.875rem", color: "#64748b" }}>Page not found in Prism Counsel</div>
          </div>
        </div>
      </Route>
    </Switch>
  );
}

export function PrismCounselApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <LazyMotion features={domMax}>
        <DemoModeProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <PrismCounselRoutes />
            <Toaster />
          </WouterRouter>
        </DemoModeProvider>
      </LazyMotion>
    </QueryClientProvider>
  );
}
