import { CookieBanner } from "@szl-holdings/shared-ui/cookie-banner";
import { StatusBanner, } from "@szl-holdings/shared-ui/status-banner";
import { useRole } from "@szl-holdings/shared-ui/use-role";
import { AppModeBanner, AppModeProvider } from "@szl-holdings/shared-ui/app-mode-banner";
import { ProductionConfirmProvider, useProductionConfirm } from "@szl-holdings/shared-ui/production-confirm";
import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { apiRequest, registerProductionConfirmFn } from "@/lib/api";
import { AgentCopilot } from "@szl-holdings/shared-ui/copilot";
import { navigatorConfig } from "@szl-holdings/shared-ui/copilot-configs";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { analytics as szlAnalytics, startMarketingSessionRecording, stopMarketingSessionRecording } from "@/lib/analytics";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion, domMax } from "framer-motion";
import { DemoModeProvider, useDemoMode } from "@szl-holdings/shared-ui/demo-mode";
import { DemoPersonaProvider, DemoPersonaSwitcher, DemoPersonaModeBridge } from "@szl-holdings/shared-ui/demo-persona-switcher";
import { SandboxModeProvider } from "@szl-holdings/shared-ui/sandbox-mode";
import { AnalyticsProvider } from "@szl-holdings/shared-ui/analytics-provider";
import { McpOverlay } from "@szl-holdings/mcp-client";
import { PrismBusProvider } from "@szl-holdings/prism-bus";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { identifyAnalyticsUser, resetAnalyticsUser, setUser as setSentryUser, clearUser as clearSentryUser } from "@szl-holdings/observability/react";
import { AlloyLayout } from "@/alloy/components/alloy-layout";
import { DesignSystemProvider } from "@szl-holdings/design-system";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";
import { Toaster } from "@szl-holdings/shared-ui/ui/sonner";
import { useSessionRevocationToast } from "@szl-holdings/shared-ui/use-session-revocation-toast";
import { LANE_ACCENT_HEX } from "@szl-holdings/shared-ui/lane-colors";

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
const DiligenceExecutivePage = lazy(() => import("@/pages/trust-diligence-executive"));
const DiligenceTechnicalPage = lazy(() => import("@/pages/trust-diligence-technical"));
const DiligenceSecurityPage = lazy(() => import("@/pages/trust-diligence-security"));
const DiligenceInvestorPage = lazy(() => import("@/pages/trust-diligence-investor"));
const InvestorsHubPage = lazy(() => import("@/pages/investors-hub"));
const InvestorsOverviewPage = lazy(() => import("@/pages/investors-overview-v2"));
const ArchitecturePage = lazy(() => import("@/pages/architecture-page"));
const InvestorsArchitecturePage = lazy(() => import("@/pages/investors-architecture"));
const InvestorsMoatPage = lazy(() => import("@/pages/investors-moat"));
const MoatAssessmentPage = lazy(() => import("@/pages/moat-assessment"));
const InvestorsRoadmapPage = lazy(() => import("@/pages/investors-roadmap"));
const InvestorsTrustPage = lazy(() => import("@/pages/investors-trust"));
const InvestorsDataRoomPage = lazy(() => import("@/pages/investors-data-room"));
const InvestorsFounderPage = lazy(() => import("@/pages/investors-founder-v2"));
const PilotPrismCounselPage = lazy(() => import("@/pages/pilot-prism-counsel"));
const PilotTerraPage = lazy(() => import("@/pages/pilot-terra"));
const PilotVesselsPage = lazy(() => import("@/pages/pilot-vessels"));
const PilotAegisPage = lazy(() => import("@/pages/pilot-aegis"));
const NexusCommandPage = lazy(() => import("@/pages/nexus-command"));
const NexusExplorerPage = lazy(() => import("@/pages/nexus-explorer"));
const DigitalTwinSimulatorPage = lazy(() => import("@/pages/digital-twin-simulator"));
const ControlTowerPage = lazy(() => import("@/pages/control-tower"));
const BusinessStatePage = lazy(() => import("@/pages/business-state"));
const IntelligenceFabricPage = lazy(() => import("@/pages/intelligence-fabric"));
const GovernedCockpitPage = lazy(() => import("@/pages/governed-cockpit"));
const CortexIntelligenceHubPage = lazy(() => import("@/pages/cortex-intelligence-hub"));
const AnalystWorkspacePage = lazy(() => import("@/pages/analyst-workspace"));
const OracleBriefingPage = lazy(() => import("@/pages/oracle-briefing"));
const KpiDashboardPage = lazy(() => import("@/pages/kpi-dashboard"));
const ReportsHubPage = lazy(() => import("@/pages/reports-hub"));
const ReportBuilderPage = lazy(() => import("@/pages/report-builder"));
const InvestorAnalyticsPage = lazy(() => import("@/pages/investor-analytics"));
const ExportBuilderPage = lazy(() => import("@/pages/export-builder"));
const ScheduledReportsPage = lazy(() => import("@/pages/scheduled-reports"));
const AICostAnalyticsPage = lazy(() => import("@/pages/ai-cost-analytics"));
const AdminPage = lazy(() => import("@/pages/admin"));
const TenantHealthScorecardsPage = lazy(() => import("@/pages/tenant-health-scorecards"));
const UnifiedSettingsPage = lazy(() => import("@/pages/unified-settings-page"));
const NotificationsInboxPage = lazy(() => import("@/pages/notifications-inbox"));
const AdminCommandCenterPage = lazy(() => import("@/pages/admin-command-center"));
const AdminDesignPartnersPage = lazy(() => import("@/pages/admin-design-partners"));
const PipelineCommandPage = lazy(() => import("@/pages/pipeline-command"));
const AdminGrowthCommandPage = lazy(() => import("@/pages/admin-growth-command"));
const OpsPage = lazy(() => import("@/pages/ops"));
const OpsWorkflowsPage = lazy(() => import("@/pages/ops-workflows"));
const AzureTenantOnboardingPage = lazy(() => import("@/pages/azure-tenant-onboarding"));
const AzureTenantDashboardPage = lazy(() => import("@/pages/azure-tenant-dashboard"));
const TenantBrandingPage = lazy(() => import("@/pages/tenant-branding"));
const PowerBiConfigPage = lazy(() => import("@/pages/powerbi-config"));
const ScimProvisioningPage = lazy(() => import("@/pages/scim-provisioning"));
const CapitalArsenalPage = lazy(() => import("@/pages/capital-arsenal"));
const OwnershipOsPage = lazy(() => import("@/pages/ownership-os"));
const FundOperationsPage = lazy(() => import("@/pages/fund-operations"));
const StatusPage = lazy(() => import("@/pages/status"));
const LegalPrivacyPage = lazy(() => import("@/pages/legal-privacy"));
const LegalTermsPage = lazy(() => import("@/pages/legal-terms"));
const AccessibilityPage = lazy(() => import("@/pages/accessibility"));
const DemoPage = lazy(() => import("@/pages/demo"));
const PricingPage = lazy(() => import("@/pages/pricing"));
const SZLBillingPage = lazy(() => import("@/pages/billing-account"));
const AdminBillingPage = lazy(() => import("@/pages/admin-billing"));
const StablecoinTreasuryPage = lazy(() => import("@/pages/treasury"));
const HelmConsolePage = lazy(() => import("@/pages/helm-console"));
const CommercialPackagingPage = lazy(() => import("@/pages/commercial-packaging"));
const RoiCalculatorPage = lazy(() => import("@/pages/roi-calculator"));
const ReliefMessagingPage = lazy(() => import("@/pages/relief-messaging"));

const CrmIntelligencePage = lazy(() => import("@/pages/crm-intelligence"));
const SupportPortalPage = lazy(() => import("@/pages/support-portal"));
const SupportSubmitPage = lazy(() => import("@/pages/support-submit"));
const SupportTicketsPage = lazy(() => import("@/pages/support-tickets"));
const SupportTicketDetailPage = lazy(() => import("@/pages/support-ticket-detail"));
const AdminDataRetentionPage = lazy(() => import("@/pages/admin-data-retention"));
const NexusMcpAdminPage = lazy(() => import("@/pages/nexus-mcp-admin"));

// New platform-repositioning pages
const DecisioningCommandPage = lazy(() => import("@/pages/decisioning-command"));
const DecisionTheaterPage = lazy(() => import("@/pages/decision-theater"));
const DecisionCenterPage = lazy(() => import("@/pages/decision-center"));
const LytePage = lazy(() => import("@/pages/lyte-page"));
const SignalFusionPage = lazy(() => import("@/pages/signal-fusion"));
const HealthFreshnessPage = lazy(() => import("@/pages/health-freshness"));
const DecisionSchemaLibraryPage = lazy(() => import("@/pages/decision-schema-library"));
const GovernancePosturePage = lazy(() => import("@/pages/governance-posture"));
const AlloyPublicPage = lazy(() => import("@/pages/alloy-page"));
const A11oyPhilosophyPage = lazy(() => import("@/pages/a11oy-philosophy"));
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
const DocsOutcomeGraphPage = lazy(() => import("@/pages/docs-outcome-graph"));
const DocsSimulationPage = lazy(() => import("@/pages/docs-simulation"));

const SolutionsPrismCounselPage = lazy(() => import("@/pages/solutions-prism-counsel"));
const SolutionsPrismCounselTrustPage = lazy(() => import("@/pages/solutions-prism-counsel-trust"));
const SolutionsTerraTrustPage = lazy(() => import("@/pages/solutions-terra-trust"));
const SolutionsVesselsTrustPage = lazy(() => import("@/pages/solutions-vessels-trust"));
const SolutionsAegisTrustPage = lazy(() => import("@/pages/solutions-aegis-trust"));
const SolutionsLyteTrustPage = lazy(() => import("@/pages/solutions-lyte-trust"));
const HowItWorksPage = lazy(() => import("@/pages/how-it-works"));
const CompanyPage = lazy(() => import("@/pages/company"));
const FounderHomePage = lazy(() => import("@/pages/founder/FounderHome"));
const FounderDoctrinePage = lazy(() => import("@/pages/founder/FounderDoctrine"));
const FounderEssaysPage = lazy(() => import("@/pages/founder/FounderEssays"));
const FounderEssayDetailPage = lazy(() => import("@/pages/founder/FounderEssayDetail"));
const FounderArchitecturePage = lazy(() => import("@/pages/founder/FounderArchitecture"));
const FounderCaseStudiesPage = lazy(() => import("@/pages/founder/FounderCaseStudies"));
const FounderDesignPartnerPage = lazy(() => import("@/pages/founder/FounderDesignPartner"));
const FounderPressPage = lazy(() => import("@/pages/founder/FounderPress"));
const FounderContactPage = lazy(() => import("@/pages/founder/FounderContact"));
const NotFoundPage = lazy(() => import("@/pages/not-found"));
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"));
const EcosystemPage = lazy(() => import("@/pages/ecosystem"));
const AutopilotPage = lazy(() => import("@/pages/autopilot"));
const CaseStudiesPage = lazy(() => import("@/pages/case-studies"));
const OnboardingPage = lazy(() => import("@/pages/onboarding"));
const OrgSettingsPage = lazy(() => import("@/pages/org-settings"));
const UsageDashboardPage = lazy(() => import("@/pages/usage-dashboard"));
const InsightsPage = lazy(() => import("@/pages/insights"));
const InsightsArticlePage = lazy(() => import("@/pages/insights-article"));
const CoreCommandPage = lazy(() => import("@/pages/core-command"));
const MeridianPage = lazy(() => import("@/pages/meridian"));
const MeridianIntelligencePage = lazy(() => import("@/pages/meridian-intelligence"));
const ControlPlanePage = lazy(() => import("@/pages/control-plane"));
const PortfolioOpsPage = lazy(() => import("@/pages/portfolio-ops"));
const OpsIncidentsPage = lazy(() => import("@/pages/ops-incidents"));
const OpsAlertsPage = lazy(() => import("@/pages/ops-alerts"));
const OpsRunbooksPage = lazy(() => import("@/pages/ops-runbooks"));
const OpsDependencyMapPage = lazy(() => import("@/pages/ops-dependency-map"));

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


const LeadershipPage = lazy(() => import("@/pages/leadership"));
const ForgeHomePage = lazy(() => import("@/pages/forge-home"));
const ForgeOverviewPage = lazy(() => import("@/pages/forge/overview"));
const ForgeRegistryPage = lazy(() => import("@/pages/forge/registry"));
const ForgeAgentDetailPage = lazy(() => import("@/pages/forge/agent-detail"));
const ForgeDriftPage = lazy(() => import("@/pages/forge/drift"));
const ForgePromotionsPage = lazy(() => import("@/pages/forge/promotions"));
const ForgeTelemetryPage = lazy(() => import("@/pages/forge/telemetry"));

const NuroForgeDashboard = lazy(() => import("@/pages/nuro-forge/index"));
const NuroForgeArena = lazy(() => import("@/pages/nuro-forge/arena"));
const NuroForgeComposition = lazy(() => import("@/pages/nuro-forge/composition"));
const NuroForgeGovernance = lazy(() => import("@/pages/nuro-forge/governance"));
const NuroForgeFineTuning = lazy(() => import("@/pages/nuro-forge/fine-tuning"));
const NuroForgeCost = lazy(() => import("@/pages/nuro-forge/cost"));
const NuroForgeMultimodal = lazy(() => import("@/pages/nuro-forge/multimodal"));
const NuroForgePrompts = lazy(() => import("@/pages/nuro-forge/prompts"));
const NuroForgeObservatory = lazy(() => import("@/pages/nuro-forge/observatory"));
const NuroForgeBlueprints = lazy(() => import("@/pages/nuro-forge/blueprints"));
const NuroForgeSelfHealing = lazy(() => import("@/pages/nuro-forge/self-healing"));
const PromptRegistryPage = lazy(() => import("@/pages/prompt-registry"));

const RevenueFusionPage = lazy(() => import("@/pages/revenue-fusion"));
const PulsePage = lazy(() => import("@/pages/pulse"));
const LinkInBioPage = lazy(() => import("@/pages/link-in-bio"));
const CarouselPreviewPage = lazy(() => import("@/pages/carousel-preview"));
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
const DistOsAutomations = lazy(() => import("@/pages/distribution-os/automations-page"));
const DistOsSettings = lazy(() => import("@/pages/distribution-os/settings-page"));
const DistOsReports = lazy(() => import("@/pages/distribution-os/reports-page"));
const DistOsPlatforms = lazy(() => import("@/pages/distribution-os/platform-connections"));
const DistOsAtomizer = lazy(() => import("@/pages/distribution-os/content-atomizer"));
const DistOsEmbeds = lazy(() => import("@/pages/distribution-os/embeds-feeds"));
const DistOsDeveloperApi = lazy(() => import("@/pages/distribution-os/developer-api"));
const DistOsCrossAnalytics = lazy(() => import("@/pages/distribution-os/cross-platform-analytics"));
const DistOsGrowth = lazy(() => import("@/pages/distribution-os/growth-engine"));
const DistOsVirality = lazy(() => import("@/pages/distribution-os/predictive-virality"));
const DistOsAudienceGenome = lazy(() => import("@/pages/distribution-os/audience-genome"));
const DistOsAbTesting = lazy(() => import("@/pages/distribution-os/ab-testing"));
const DistOsMonetization = lazy(() => import("@/pages/distribution-os/monetization-optimizer"));
const DistOsSeoIntelligence = lazy(() => import("@/pages/distribution-os/seo-intelligence"));
const DistOsTrendRadar = lazy(() => import("@/pages/distribution-os/trend-radar"));
const DistOsAttribution = lazy(() => import("@/pages/distribution-os/content-attribution"));
const DistOsSegments = lazy(() => import("@/pages/distribution-os/audience-segments"));
const DistOsLifecycle = lazy(() => import("@/pages/distribution-os/lifecycle-intelligence"));

const VenturePortfolioPage = lazy(() => import("@/pages/venture-portfolio"));

const FundIntelHubPage = lazy(() => import("@/pages/fund/index"));
const FundDealScoringPage = lazy(() => import("@/pages/fund/deal-scoring"));
const FundDealScoringSubmitPage = lazy(() => import("@/pages/fund/deal-scoring-submit"));
const FundLpReportsPage = lazy(() => import("@/pages/fund/lp-reports"));
const FundPortfolioIntelPage = lazy(() => import("@/pages/fund/portfolio-intelligence"));
const FundCapTablePage = lazy(() => import("@/pages/fund/cap-table"));
const FundExitModelingPage = lazy(() => import("@/pages/fund/exit-modeling"));
const FundTreasuryPage = lazy(() => import("@/pages/fund/treasury"));
const FundCompliancePage = lazy(() => import("@/pages/fund/compliance"));
const FundLpCrmPage = lazy(() => import("@/pages/fund/lp-crm"));
const FundBenchmarkingPage = lazy(() => import("@/pages/fund/benchmarking"));
const FundCoInvestPage = lazy(() => import("@/pages/fund/co-invest"));
const FundDataRoomPage = lazy(() => import("@/pages/fund/data-room"));
const FundBoardMeetingsPage = lazy(() => import("@/pages/fund/board-meetings"));
const FundEsgPage = lazy(() => import("@/pages/fund/esg"));
const FundSecondaryMarketPage = lazy(() => import("@/pages/fund/secondary-market"));
const FundNavDashboardPage = lazy(() => import("@/pages/fund/nav-dashboard"));
const FundLpPortalPage = lazy(() => import("@/pages/fund/lp-portal"));

const VentureIntelHubPage = lazy(() => import("@/pages/venture-intel-hub"));
const VentureIntelHealthRadarPage = lazy(() => import("@/pages/venture-intel/health-radar"));
const VentureIntelCapitalOptimizerPage = lazy(() => import("@/pages/venture-intel/capital-optimizer"));
const VentureIntelSynergyMapPage = lazy(() => import("@/pages/venture-intel/synergy-map"));
const VentureIntelLpPortalPage = lazy(() => import("@/pages/venture-intel/lp-portal"));
const VentureIntelMarketSignalsPage = lazy(() => import("@/pages/venture-intel/market-signals"));
const VentureIntelExitModelerPage = lazy(() => import("@/pages/venture-intel/exit-modeler"));
const AlloyFactoryFloor = lazy(() => import("@/alloy/pages/factory-floor"));
const AlloyExecutionHistory = lazy(() => import("@/alloy/pages/execution-history"));
const AlloyRunDetail = lazy(() => import("@/alloy/pages/run-detail"));
const AlloySignalFeed = lazy(() => import("@/alloy/pages/signal-feed"));
const AlloyWorkflowOrchestration = lazy(() => import("@/alloy/pages/workflow-orchestration"));
const AlloyConnectorMesh = lazy(() => import("@/alloy/pages/connector-mesh"));
const AlloyGovernanceAudit = lazy(() => import("@/alloy/pages/governance-audit"));
const AlloyEnterpriseGovernance = lazy(() => import("@/alloy/pages/enterprise-governance"));
const AlloyAtlasApprovals = lazy(() => import("@/alloy/pages/atlas-approvals"));
const AlloyOperatorApprovals = lazy(() => import("@/alloy/pages/operator-approvals"));
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
const AcademyPage = lazy(() => import("@/pages/academy"));
const HelpPage = lazy(() => import("@/pages/help"));
const DemosPage = lazy(() => import("@/pages/demos"));
const MobilePreviewPage = lazy(() => import("@/pages/mobile-preview"));
const ChangelogPage = lazy(() => import("@/pages/changelog"));
const ChangelogHighlightsPage = lazy(() => import("@/pages/changelog-highlights"));
const ProductReadinessPage = lazy(() => import("@/pages/product-readiness"));
const TrustStatusPage = lazy(() => import("@/pages/trust-status"));
const TechnicalProofPage = lazy(() => import("@/pages/technical-proof"));
const LPSentimentPulse = lazy(() => import("@/pages/lp-sentiment-pulse"));
const CommandNewsletterPage = lazy(() => import("@/pages/command-newsletter"));
const AeepCommandPage = lazy(() => import("@/pages/aeep-command"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false, staleTime: 5 * 60 * 1000 },
  },
});

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, login } = useAuth();

  useEffect(() => {
    if (user) {
      const userId = String(user.id);
      const email = user.email ?? undefined;
      const name = user.name ?? user.displayName ?? user.username ?? undefined;
      identifyAnalyticsUser({ id: userId, email, name });
      setSentryUser({ id: userId, email, username: name });
    } else {
      resetAnalyticsUser();
      clearSentryUser();
    }
  }, [user?.id]);
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

function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, roles, isLoading } = useRole();
  if (isLoading) return <PageLoader />;
  const hasAccess = isAdmin || roles.includes("super_admin");
  if (!hasAccess) {
    return (
      <div style={{ minHeight: "100vh", background: "hsl(214,16%,4%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "2rem" }}>
          <h2 style={{ color: "hsl(38,8%,92%)", fontSize: "1.5rem", marginBottom: "0.5rem" }}>Access Restricted</h2>
          <p style={{ color: "hsl(214,7%,55%)" }}>Admin or Super Admin role required to access this area.</p>
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
  const id = parseInt(params.id ?? "0", 10);
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

function ProductionConfirmRegistrar() {
  const { confirm } = useProductionConfirm();
  useEffect(() => {
    registerProductionConfirmFn(confirm);
    return () => { registerProductionConfirmFn(null); };
  }, [confirm]);
  return null;
}

function PageViewTracker() {
  const [location] = useLocation();
  useEffect(() => {
    const path = location || "/";
    szlAnalytics.pageView(path);
    // Enforce session-recording boundaries at the router level: only
    // marketing/funnel pages may be recorded. Navigating to anything else
    // (dashboards, admin, authenticated surfaces) explicitly stops capture.
    const MARKETING_PAGES = new Set(["/", "/landing", "/contact", "/pricing"]);
    if (MARKETING_PAGES.has(path)) {
      startMarketingSessionRecording(path);
    } else {
      stopMarketingSessionRecording();
    }
  }, [location]);
  return null;
}

async function handleDemoReset() {
  try {
    await apiRequest("POST", "/api/admin/seed/reset-demo");
    window.location.reload();
  } catch (_err) {
    alert("Demo reset failed. Please check your connection and try again.");
  }
}

function DemoPersonaModeBridgeWired() {
  const { setMode } = useDemoMode();
  return <DemoPersonaModeBridge setMode={setMode} />;
}

function App() {
  useSessionRevocationToast();
  return (
    <DesignSystemProvider defaultDensity="comfortable" defaultScreenMode="executive">
    <AppModeProvider>
    <AnalyticsProvider appName="szl-holdings">
    <PrismBusProvider domain="szl-holdings">
    <SandboxModeProvider>
    <DemoModeProvider>
    <DemoPersonaProvider>
    <DemoPersonaModeBridgeWired />
    <QueryClientProvider client={queryClient}>
      <ProductionConfirmProvider>
      <ProductionConfirmRegistrar />
      <LazyMotion features={domMax} strict>
        {/* F007 — Skip navigation link (WCAG 2.4.1, Level A) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          Skip to main content
        </a>
        <StatusBanner config={SZL_STATUS_CONFIG} dismissible />
        <AppModeBanner onResetDemo={handleDemoReset} />
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <PageViewTracker />
          <EcosystemNav currentAppId="szl-holdings" currentAppName="SZL Holdings" accentColor={SZL_ACCENT} />
          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
          <main id="main-content" tabIndex={-1} style={{ outline: 'none' }}>
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
              <Suspense fallback={<PageLoader />}><FounderHomePage /></Suspense>
            </Route>
            <Route path="/founder/doctrine">
              <Suspense fallback={<PageLoader />}><FounderDoctrinePage /></Suspense>
            </Route>
            <Route path="/founder/essays/:slug">
              <Suspense fallback={<PageLoader />}><FounderEssayDetailPage /></Suspense>
            </Route>
            <Route path="/founder/essays">
              <Suspense fallback={<PageLoader />}><FounderEssaysPage /></Suspense>
            </Route>
            <Route path="/founder/architecture">
              <Suspense fallback={<PageLoader />}><FounderArchitecturePage /></Suspense>
            </Route>
            <Route path="/founder/case-studies">
              <Suspense fallback={<PageLoader />}><FounderCaseStudiesPage /></Suspense>
            </Route>
            <Route path="/founder/design-partner">
              <Suspense fallback={<PageLoader />}><FounderDesignPartnerPage /></Suspense>
            </Route>
            <Route path="/founder/press">
              <Suspense fallback={<PageLoader />}><FounderPressPage /></Suspense>
            </Route>
            <Route path="/founder/contact">
              <Suspense fallback={<PageLoader />}><FounderContactPage /></Suspense>
            </Route>
            <Route path="/leadership">
              <Suspense fallback={<PageLoader />}><LeadershipPage /></Suspense>
            </Route>

            {/* ── Forge — Authenticated admin portal ── */}
            <Route path="/forge">
              <RequireAuth><Suspense fallback={<PageLoader />}><ForgeHomePage /></Suspense></RequireAuth>
            </Route>
            <Route path="/forge/overview">
              <RequireAuth><Suspense fallback={<PageLoader />}><ForgeOverviewPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/forge/registry">
              <RequireAuth><Suspense fallback={<PageLoader />}><ForgeRegistryPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/forge/agents/:id">
              <RequireAuth><Suspense fallback={<PageLoader />}><ForgeAgentDetailPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/forge/drift">
              <RequireAuth><Suspense fallback={<PageLoader />}><ForgeDriftPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/forge/promotions">
              <RequireAuth><Suspense fallback={<PageLoader />}><ForgePromotionsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/forge/telemetry">
              <RequireAuth><Suspense fallback={<PageLoader />}><ForgeTelemetryPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/forge/:rest*">
              <RequireAuth><Suspense fallback={<PageLoader />}><ForgeHomePage /></Suspense></RequireAuth>
            </Route>

            {/* ── Product pages — Lyte and Counsel (public marketing) ── */}
            <Route path="/products/lyte">
              <Suspense fallback={<PageLoader />}><LytePage /></Suspense>
            </Route>
            <Route path="/lyte">
              <Suspense fallback={<PageLoader />}><LytePage /></Suspense>
            </Route>
            <Route path="/lyte/decision-theater">
              <Suspense fallback={<PageLoader />}><DecisionTheaterPage /></Suspense>
            </Route>
            <Route path="/lyte/signal-fusion">
              <Suspense fallback={<PageLoader />}><SignalFusionPage /></Suspense>
            </Route>
            <Route path="/lyte/health-freshness">
              <Suspense fallback={<PageLoader />}><HealthFreshnessPage /></Suspense>
            </Route>
            <Route path="/lyte/decision-schemas">
              <Suspense fallback={<PageLoader />}><DecisionSchemaLibraryPage /></Suspense>
            </Route>
            <Route path="/lyte/governance-posture">
              <Suspense fallback={<PageLoader />}><GovernancePosturePage /></Suspense>
            </Route>
            <Route path="/lyte/use-cases">
              <Suspense fallback={<PageLoader />}><LytePage /></Suspense>
            </Route>
            <Route path="/lyte/demo">
              <ExternalRedirect to="/command/operations/?view=app" />
            </Route>
            <Route path="/lyte/app">
              <ExternalRedirect to="/command/operations/" />
            </Route>
            <Route path="/decisioning">
              <Suspense fallback={<PageLoader />}><DecisioningCommandPage /></Suspense>
            </Route>
            <Route path="/decision-center">
              <Suspense fallback={<PageLoader />}><DecisionCenterPage /></Suspense>
            </Route>
            <Route path="/a11oy">
              <Suspense fallback={<PageLoader />}><A11oyPhilosophyPage /></Suspense>
            </Route>
            <Route path="/a11oy-philosophy">
              <Suspense fallback={<PageLoader />}><A11oyPhilosophyPage /></Suspense>
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

            {/* ── Counsel — merged into Aegis Legal workspace ── */}
            <Route path="/prism-counsel/:rest*">
              {() => { window.location.href = "/aegis/legal"; return null; }}
            </Route>
            <Route path="/prism-counsel">
              {() => { window.location.href = "/aegis/legal"; return null; }}
            </Route>

            {/* ── Trust Center ── */}
            <Route path="/trust-center">
              <Suspense fallback={<PageLoader />}><TrustCenterPage /></Suspense>
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
            <Route path="/trust/diligence/executive">
              <Suspense fallback={<PageLoader />}><DiligenceExecutivePage /></Suspense>
            </Route>
            <Route path="/trust/diligence/technical">
              <Suspense fallback={<PageLoader />}><DiligenceTechnicalPage /></Suspense>
            </Route>
            <Route path="/trust/diligence/security">
              <Suspense fallback={<PageLoader />}><DiligenceSecurityPage /></Suspense>
            </Route>
            <Route path="/trust/diligence/investor">
              <Suspense fallback={<PageLoader />}><DiligenceInvestorPage /></Suspense>
            </Route>
            <Route path="/trust-center">
              <Suspense fallback={<PageLoader />}><TrustCenterPage /></Suspense>
            </Route>
            <Route path="/trust-center/status">
              <Suspense fallback={<PageLoader />}><TrustStatusPage /></Suspense>
            </Route>
            <Route path="/trust">
              <Suspense fallback={<PageLoader />}><TrustPage /></Suspense>
            </Route>
            <Route path="/product-readiness">
              <Suspense fallback={<PageLoader />}><ProductReadinessPage /></Suspense>
            </Route>
            <Route path="/technical-proof">
              <Suspense fallback={<PageLoader />}><TechnicalProofPage /></Suspense>
            </Route>
            <Route path="/changelog-highlights">
              <Suspense fallback={<PageLoader />}><ChangelogHighlightsPage /></Suspense>
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
            <Route path="/demos/mobile">
              <Suspense fallback={<PageLoader />}><MobilePreviewPage /></Suspense>
            </Route>
            <Route path="/mobile-preview">
              <Suspense fallback={<PageLoader />}><MobilePreviewPage /></Suspense>
            </Route>
            <Route path="/changelog">
              <Suspense fallback={<PageLoader />}><ChangelogPage /></Suspense>
            </Route>
            <Route path="/lp-sentiment-pulse">
              <Suspense fallback={<PageLoader />}><LPSentimentPulse /></Suspense>
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
            <Route path="/docs/outcome-graph">
              <Suspense fallback={<PageLoader />}><DocsOutcomeGraphPage /></Suspense>
            </Route>
            <Route path="/docs/simulation">
              <Suspense fallback={<PageLoader />}><DocsSimulationPage /></Suspense>
            </Route>
            <Route path="/docs/covenant-policy">
              <Suspense fallback={<PageLoader />}><DocsControlPlanePage /></Suspense>
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
            <Route path="/assessment">
              <Suspense fallback={<PageLoader />}><MoatAssessmentPage /></Suspense>
            </Route>
            <Route path="/investors/roadmap">
              <Suspense fallback={<PageLoader />}><InvestorsRoadmapPage /></Suspense>
            </Route>
            <Route path="/investors/trust">
              <Suspense fallback={<PageLoader />}><InvestorsTrustPage /></Suspense>
            </Route>
            <Route path="/investors/data-room">
              <RequireAuth><Suspense fallback={<PageLoader />}><InvestorsDataRoomPage /></Suspense></RequireAuth>
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
            <Route path="/financials">
              <Suspense fallback={<PageLoader />}><RevenueFusionPage /></Suspense>
            </Route>

            {/* ── Venture Intelligence Portal ── */}
            <Route path="/venture-intelligence/health-radar">
              <Suspense fallback={<PageLoader />}><VentureIntelHealthRadarPage /></Suspense>
            </Route>
            <Route path="/venture-intelligence/capital-optimizer">
              <Suspense fallback={<PageLoader />}><VentureIntelCapitalOptimizerPage /></Suspense>
            </Route>
            <Route path="/venture-intelligence/synergy-map">
              <Suspense fallback={<PageLoader />}><VentureIntelSynergyMapPage /></Suspense>
            </Route>
            <Route path="/venture-intelligence/lp-portal">
              <Suspense fallback={<PageLoader />}><VentureIntelLpPortalPage /></Suspense>
            </Route>
            <Route path="/venture-intelligence/market-signals">
              <Suspense fallback={<PageLoader />}><VentureIntelMarketSignalsPage /></Suspense>
            </Route>
            <Route path="/venture-intelligence/exit-modeler">
              <Suspense fallback={<PageLoader />}><VentureIntelExitModelerPage /></Suspense>
            </Route>
            <Route path="/venture-intelligence">
              <Suspense fallback={<PageLoader />}><VentureIntelHubPage /></Suspense>
            </Route>

            {/* ── Product pages — accessible but not in primary nav ── */}
            <Route path="/demo">
              <Suspense fallback={<PageLoader />}><DemoPage /></Suspense>
            </Route>
            <Route path="/pricing">
              <Suspense fallback={<PageLoader />}><PricingPage /></Suspense>
            </Route>
            <Route path="/account/billing">
              <Suspense fallback={<PageLoader />}><SZLBillingPage /></Suspense>
            </Route>
            <Route path="/admin/billing">
              <Suspense fallback={<PageLoader />}><AdminBillingPage /></Suspense>
            </Route>
            <Route path="/admin/treasury">
              <Suspense fallback={<PageLoader />}><StablecoinTreasuryPage /></Suspense>
            </Route>

            {/* ── Counsel app routes (internal, not public nav) ── */}
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
            <Route path="/alloy/atlas-approvals">
              <Suspense fallback={<PageLoader />}><AlloyAppPage><AlloyAtlasApprovals /></AlloyAppPage></Suspense>
            </Route>
            <Route path="/alloy/operator-approvals">
              <Suspense fallback={<PageLoader />}><RequireAuth><AlloyAppPage><AlloyOperatorApprovals /></AlloyAppPage></RequireAuth></Suspense>
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
            <Route path="/inca">
              <ExternalRedirect to="/aegis/intel/dashboard" />
            </Route>
            <Route path="/msp">
              <ExternalRedirect to="/aegis/ops/dashboard" />
            </Route>
            <Route path="/firestorm">
              <ExternalRedirect to="/aegis/" />
            </Route>
            <Route path="/lyte-command-center">
              <ExternalRedirect to="/command/" />
            </Route>
            <Route path="/imperium">
              <ExternalRedirect to="/command/" />
            </Route>
            <Route path="/prism-counsel">
              <ExternalRedirect to="/aegis/" />
            </Route>
            <Route path="/stephen">
              <ExternalRedirect to="/szl-holdings/leadership" />
            </Route>
            <Route path="/terra">
              <ExternalRedirect to="/terra/" />
            </Route>
            <Route path="/terra/demo">
              <ExternalRedirect to="/terra/dashboard?demo=true" />
            </Route>

            {/* ── Internal ops routes (INTERNAL — not publicly linked) ── */}
            <Route path="/ops/incidents">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsIncidentsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/ops/alerts">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsAlertsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/ops/runbooks">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsRunbooksPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/ops/dependency-map">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsDependencyMapPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/ops/workflows">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsWorkflowsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/ops">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/ops/:section">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/ops/:section/:sub">
              <RequireAuth><Suspense fallback={<PageLoader />}><OpsPage /></Suspense></RequireAuth>
            </Route>

            {/* ── Reports routes ── */}
            <Route path="/reports/builder">
              <RequireAuth><Suspense fallback={<PageLoader />}><ReportBuilderPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/reports/export-builder">
              <RequireAuth><Suspense fallback={<PageLoader />}><ExportBuilderPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/reports/scheduled">
              <RequireAuth><Suspense fallback={<PageLoader />}><ScheduledReportsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/reports">
              <RequireAuth><Suspense fallback={<PageLoader />}><ReportsHubPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/investor-analytics">
              <RequireAuth><Suspense fallback={<PageLoader />}><InvestorAnalyticsPage /></Suspense></RequireAuth>
            </Route>

            {/* ── Intelligence Fabric ── */}
            <Route path="/intelligence/cortex">
              <RequireAuth><Suspense fallback={<PageLoader />}><CortexIntelligenceHubPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/intelligence/fabric">
              <RequireAuth><Suspense fallback={<PageLoader />}><IntelligenceFabricPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/intelligence/analyst">
              <RequireAuth><Suspense fallback={<PageLoader />}><AnalystWorkspacePage /></Suspense></RequireAuth>
            </Route>

            {/* ── Admin routes ── */}
            <Route path="/nexus/explorer">
              <RequireAuth><Suspense fallback={<PageLoader />}><NexusExplorerPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/digital-twin">
              <RequireAuth><Suspense fallback={<PageLoader />}><DigitalTwinSimulatorPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/nexus/oracle">
              <RequireAuth><Suspense fallback={<PageLoader />}><OracleBriefingPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/nexus">
              <RequireAuth><Suspense fallback={<PageLoader />}><NexusCommandPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/control-tower">
              <RequireAuth><Suspense fallback={<PageLoader />}><ControlTowerPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/kpis">
              <RequireAuth><Suspense fallback={<PageLoader />}><KpiDashboardPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/ai-cost-analytics">
              <RequireAuth><Suspense fallback={<PageLoader />}><AICostAnalyticsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/prompt-registry">
              <RequireAuth><Suspense fallback={<PageLoader />}><PromptRegistryPage /></Suspense></RequireAuth>
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
            <Route path="/admin/tenant-health">
              <RequireAuth><Suspense fallback={<PageLoader />}><TenantHealthScorecardsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/platform-settings">
              <RequireAuth><Suspense fallback={<PageLoader />}><UnifiedSettingsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/data-retention">
              <RequireAuth><Suspense fallback={<PageLoader />}><AdminDataRetentionPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/nexus-mcp">
              <RequireAuth><RequireAdmin><Suspense fallback={<PageLoader />}><NexusMcpAdminPage /></Suspense></RequireAdmin></RequireAuth>
            </Route>
            <Route path="/admin/growth-command">
              <RequireAuth><RequireAdmin><Suspense fallback={<PageLoader />}><AdminGrowthCommandPage /></Suspense></RequireAdmin></RequireAuth>
            </Route>
            <Route path="/admin/command-center">
              <RequireAuth><RequireAdmin><Suspense fallback={<PageLoader />}><AdminCommandCenterPage /></Suspense></RequireAdmin></RequireAuth>
            </Route>
            <Route path="/admin/design-partners">
              <RequireAuth><RequireAdmin><Suspense fallback={<PageLoader />}><AdminDesignPartnersPage /></Suspense></RequireAdmin></RequireAuth>
            </Route>
            <Route path="/admin/pipeline-command">
              <RequireAuth><RequireAdmin><Suspense fallback={<PageLoader />}><PipelineCommandPage /></Suspense></RequireAdmin></RequireAuth>
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
            <Route path="/fund-operations">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundOperationsPage /></Suspense></RequireAuth>
            </Route>

            {/* ── Fund Intelligence Command ── */}
            <Route path="/fund">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundIntelHubPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/deal-scoring">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundDealScoringPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/deal-scoring/submit">
              <Suspense fallback={<PageLoader />}><FundDealScoringSubmitPage /></Suspense>
            </Route>
            <Route path="/fund/lp-reports">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundLpReportsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/portfolio-intelligence">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundPortfolioIntelPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/cap-table">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundCapTablePage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/exit-modeling">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundExitModelingPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/treasury">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundTreasuryPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/compliance">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundCompliancePage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/lp-crm">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundLpCrmPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/benchmarking">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundBenchmarkingPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/co-invest">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundCoInvestPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/data-room">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundDataRoomPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/board-meetings">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundBoardMeetingsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/esg">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundEsgPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/secondary-market">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundSecondaryMarketPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/nav-dashboard">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundNavDashboardPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/fund/lp-portal">
              <RequireAuth><Suspense fallback={<PageLoader />}><FundLpPortalPage /></Suspense></RequireAuth>
            </Route>

            <Route path="/venture-portfolio">
              <Suspense fallback={<PageLoader />}><VenturePortfolioPage /></Suspense>
            </Route>

            {/* ── Nuro Forge ── */}
            <Route path="/nuro-forge">
              <Suspense fallback={<PageLoader />}><NuroForgeDashboard /></Suspense>
            </Route>
            <Route path="/nuro-forge/arena">
              <Suspense fallback={<PageLoader />}><NuroForgeArena /></Suspense>
            </Route>
            <Route path="/nuro-forge/composition">
              <Suspense fallback={<PageLoader />}><NuroForgeComposition /></Suspense>
            </Route>
            <Route path="/nuro-forge/governance">
              <Suspense fallback={<PageLoader />}><NuroForgeGovernance /></Suspense>
            </Route>
            <Route path="/nuro-forge/fine-tuning">
              <Suspense fallback={<PageLoader />}><NuroForgeFineTuning /></Suspense>
            </Route>
            <Route path="/nuro-forge/cost">
              <Suspense fallback={<PageLoader />}><NuroForgeCost /></Suspense>
            </Route>
            <Route path="/nuro-forge/multimodal">
              <Suspense fallback={<PageLoader />}><NuroForgeMultimodal /></Suspense>
            </Route>
            <Route path="/nuro-forge/prompts">
              <Suspense fallback={<PageLoader />}><NuroForgePrompts /></Suspense>
            </Route>
            <Route path="/nuro-forge/observatory">
              <Suspense fallback={<PageLoader />}><NuroForgeObservatory /></Suspense>
            </Route>
            <Route path="/nuro-forge/blueprints">
              <Suspense fallback={<PageLoader />}><NuroForgeBlueprints /></Suspense>
            </Route>
            <Route path="/nuro-forge/self-healing">
              <Suspense fallback={<PageLoader />}><NuroForgeSelfHealing /></Suspense>
            </Route>

            {/* ── Support portal routes ── */}
            <Route path="/support/tickets/:id">
              <RequireAuth><Suspense fallback={<PageLoader />}><SupportTicketDetailPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/support/tickets">
              <RequireAuth><Suspense fallback={<PageLoader />}><SupportTicketsPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/support/submit">
              <RequireAuth><Suspense fallback={<PageLoader />}><SupportSubmitPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/support">
              <RequireAuth><Suspense fallback={<PageLoader />}><SupportPortalPage /></Suspense></RequireAuth>
            </Route>

            {/* ── Auth utility routes ── */}
            <Route path="/reset-password">
              <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>
            </Route>

            {/* ── Legal / utility routes ── */}
            <Route path="/status">
              <Suspense fallback={<PageLoader />}><StatusPage /></Suspense>
            </Route>
            <Route path="/pulse">
              <Suspense fallback={<PageLoader />}><PulsePage /></Suspense>
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
            <Route path="/investor/data-room">
              <Redirect to="/investors/data-room" />
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
            <Route path="/autopilot">
              <Suspense fallback={<PageLoader />}><AutopilotPage /></Suspense>
            </Route>
            <Route path="/business-state">
              <Suspense fallback={<PageLoader />}><BusinessStatePage /></Suspense>
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
            <Route path="/developers">
              <Redirect to="/docs" />
            </Route>
            <Route path="/developers/:section">
              <Redirect to="/docs" />
            </Route>
            <Route path="/core">
              <Suspense fallback={<PageLoader />}><CoreCommandPage /></Suspense>
            </Route>
            <Route path="/meridian">
              <Suspense fallback={<PageLoader />}><MeridianPage /></Suspense>
            </Route>
            <Route path="/meridian-intelligence">
              <Suspense fallback={<PageLoader />}><MeridianIntelligencePage /></Suspense>
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
            <Route path="/carousel">
              <Suspense fallback={<PageLoader />}><CarouselPreviewPage /></Suspense>
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
            <Route path="/admin/distribution/analytics">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsAnalytics /></Suspense></RequireAuth>
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
            <Route path="/admin/distribution/platforms">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsPlatforms /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/atomizer">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsAtomizer /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/embeds">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsEmbeds /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/developer-api">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsDeveloperApi /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/cross-analytics">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsCrossAnalytics /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/growth">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsGrowth /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/virality">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsVirality /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/audience-genome">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsAudienceGenome /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/ab-testing">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsAbTesting /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/monetization">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsMonetization /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/seo-intelligence">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsSeoIntelligence /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/trend-radar">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsTrendRadar /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/attribution">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsAttribution /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/segments">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsSegments /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution/lifecycle">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsLifecycle /></Suspense></RequireAuth>
            </Route>
            <Route path="/admin/distribution">
              <RequireAuth><Suspense fallback={<PageLoader />}><DistOsDashboard /></Suspense></RequireAuth>
            </Route>

            <Route path="/crm-intelligence">
              <Suspense fallback={<PageLoader />}><CrmIntelligencePage /></Suspense>
            </Route>

            <Route path="/onboarding/:orgSlug">
              {(params) => <Suspense fallback={<PageLoader />}><OnboardingPage orgSlug={params.orgSlug} /></Suspense>}
            </Route>
            <Route path="/notifications">
              <RequireAuth><Suspense fallback={<PageLoader />}><NotificationsInboxPage /></Suspense></RequireAuth>
            </Route>
            <Route path="/onboarding">
              <Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense>
            </Route>
            <Route path="/settings/:orgSlug">
              {() => <Suspense fallback={<PageLoader />}><OrgSettingsPage /></Suspense>}
            </Route>
            <Route path="/settings">
              <Suspense fallback={<PageLoader />}><OrgSettingsPage /></Suspense>
            </Route>
            <Route path="/usage/:orgSlug">
              {() => <Suspense fallback={<PageLoader />}><UsageDashboardPage /></Suspense>}
            </Route>
            <Route path="/usage">
              <Suspense fallback={<PageLoader />}><UsageDashboardPage /></Suspense>
            </Route>

            {/* ── Command — Newsletter Analytics ── */}
            <Route path="/command/newsletter">
              <Suspense fallback={<PageLoader />}><CommandNewsletterPage /></Suspense>
            </Route>

            {/* AEEP — Governed-Intelligence Command (design-system shell) */}
            <Route path="/aeep/:section*">
              <Suspense fallback={<PageLoader />}><AeepCommandPage /></Suspense>
            </Route>
            <Route path="/aeep">
              <Suspense fallback={<PageLoader />}><AeepCommandPage /></Suspense>
            </Route>

            {/* Governed Intelligence — Hero Proof Surface */}
            <Route path="/governed-cockpit">
              <Suspense fallback={<PageLoader />}><GovernedCockpitPage /></Suspense>
            </Route>

            {/* Catch-all → 404 */}
            <Route>
              <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>
            </Route>
          </Switch>
          </main>
        </WouterRouter>
      </LazyMotion>
      <Toaster />
      <McpOverlay domain="szl-holdings" />
      <AgentCopilot config={navigatorConfig} />
      <CookieBanner privacyUrl="/legal/privacy" accentColor={SZL_ACCENT} />
      </ProductionConfirmProvider>
    </QueryClientProvider>
    <DemoPersonaSwitcher />
    </DemoPersonaProvider>
    </DemoModeProvider>
    </SandboxModeProvider>
    </PrismBusProvider>
    </AnalyticsProvider>
    </AppModeProvider>
    </DesignSystemProvider>
  );
}

export default App;
