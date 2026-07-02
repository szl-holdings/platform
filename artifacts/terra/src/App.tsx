import { McpOverlay } from '@szl-holdings/mcp-client';
import {
  clearUser as clearSentryUser,
  identifyAnalyticsUser,
  resetAnalyticsUser,
  setUser as setSentryUser,
} from '@szl-holdings/observability/react';
import { PrismBusProvider } from '@szl-holdings/prism-bus';
import { useAuth } from '@szl-holdings/replit-auth-web';
import { AnalyticsProvider } from '@szl-holdings/shared-ui/analytics-provider';
import { AppModeBanner, AppModeProvider } from '@szl-holdings/shared-ui/app-mode-banner';
import {
  type CommandItem,
  CommandPalette,
  createBaselineWebActions,
  getEcosystemSwitchCommands,
  useCommandPalette,
} from '@szl-holdings/shared-ui/command-palette';
import { CookieBanner } from '@szl-holdings/shared-ui/cookie-banner';
import { AgentCopilot } from '@szl-holdings/shared-ui/copilot';
import { beaconConfig } from '@szl-holdings/shared-ui/copilot-configs';
import { DemoNarrativeSidebar } from '@szl-holdings/shared-ui/demo-narrative-sidebar';
import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import {
  type KeyboardShortcut,
  PowerUserProvider,
} from '@szl-holdings/shared-ui/keyboard-shortcuts';
import { LANE_ACCENT_HEX } from '@szl-holdings/shared-ui/lane-colors';
import {
  SandboxModeBanner,
  SandboxModeProvider,
  useSandboxMode,
} from '@szl-holdings/shared-ui/sandbox-mode';
import { StaleIndicator } from '@szl-holdings/shared-ui/stale-indicator';
import { Toaster } from '@szl-holdings/shared-ui/ui/sonner';
import { useSessionRevocationToast } from '@szl-holdings/shared-ui/use-session-revocation-toast';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense, useEffect } from 'react';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { TerraLayout } from '@/components/terra-layout';
import { TERRA_DEMO_NARRATIVE } from '@/data/demo-narrative';

const TERRA_ACCENT = LANE_ACCENT_HEX.terra.primary;

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60_000, retry: 1 } },
});

if (typeof window !== 'undefined') {
  persistQueryClient({
    queryClient: queryClient as unknown as Parameters<typeof persistQueryClient>[0]['queryClient'],
    persister: createSyncStoragePersister({
      storage: window.localStorage,
      key: 'terra-web-rq-cache',
    }),
    maxAge: 1000 * 60 * 60,
    buster: 'v1',
  });
}

const TerraPulse = lazy(() => import('@/pages/pulse'));
const AefKnowledgeSearchPage = lazy(() => import('@/pages/aef-knowledge-search'));
const ForecastPage = lazy(() => import('@/pages/forecast'));
const DecisionCenterPage = lazy(() => import('@/pages/decision-center'));
const TerraAtlasArtifactsPage = lazy(() => import('@/pages/atlas-artifacts'));
const TerraAtlasExecutePage = lazy(() => import('@/pages/atlas-execute'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const DistressEngine = lazy(() => import('@/pages/distress-engine'));
const Deals = lazy(() => import('@/pages/deals'));
const Listings = lazy(() => import('@/pages/listings'));
const Leads = lazy(() => import('@/pages/leads'));
const Team = lazy(() => import('@/pages/team'));
const Market = lazy(() => import('@/pages/market'));
const Transactions = lazy(() => import('@/pages/transactions'));
const Documents = lazy(() => import('@/pages/documents'));
const Offers = lazy(() => import('@/pages/offers'));
const Predictions = lazy(() => import('@/pages/predictions'));
const Automations = lazy(() => import('@/pages/automations'));
const BrokerOverview = lazy(() => import('@/pages/broker-overview'));
const Ingestion = lazy(() => import('@/pages/ingestion'));
const InvestorMode = lazy(() => import('@/pages/investor-mode'));
const TerraEvidencePage = lazy(() => import('@/pages/evidence'));
const Pipeline = lazy(() => import('@/pages/pipeline'));
const TerraMarketingLanding = lazy(() => import('@/pages/marketing-landing'));
const InvestmentReadinessPage = lazy(() => import('@/pages/investment-readiness'));
const CommercialIntelligence = lazy(() => import('@/pages/commercial-intelligence'));
const MarketIntelligence = lazy(() => import('@/pages/market-intelligence'));
const MarketAnalytics = lazy(() => import('@/pages/market-analytics'));
const ComparableSales = lazy(() => import('@/pages/comparable-sales'));
const PortfolioDashboard = lazy(() => import('@/pages/portfolio-dashboard'));
const DistressPipeline = lazy(() => import('@/pages/distress-pipeline'));
const GovernedCockpitPage = lazy(() => import('@/pages/governed-cockpit'));
const PropertyMapPage = lazy(() => import('@/pages/property-map-page'));
const PropertyDetail = lazy(() => import('@/pages/property-detail'));
const PropertyTwinView = lazy(() => import('@/pages/property-twin-view'));
const PowerBiReport = lazy(() => import('@/pages/powerbi-report'));
const DocumentEngine = lazy(() => import('@/pages/document-engine'));
const InquiriesPage = lazy(() => import('@/pages/inquiries-command'));
const AgentsPage = lazy(() => import('@/pages/agents-command'));
const CaseStudyPage = lazy(() => import('@/pages/case-study'));
const TerraPerricingPage = lazy(() => import('@/pages/pricing'));
const TerraBillingPage = lazy(() => import('@/pages/billing-account'));
const LenderReport = lazy(() => import('@/pages/lender-report'));
const PropertyDesk = lazy(() => import('@/pages/property-desk'));
const WhatChanged = lazy(() => import('@/pages/what-changed'));
const DiligencePrep = lazy(() => import('@/pages/diligence-prep'));
const ReadinessBoard = lazy(() => import('@/pages/readiness-board'));
const ApprovalReview = lazy(() => import('@/pages/approval-review'));
const TrustProvenancePage = lazy(() => import('@/pages/trust-provenance'));
const DistressRadar = lazy(() => import('@/pages/distress-radar'));
const NeighborhoodMomentum = lazy(() => import('@/pages/neighborhood-momentum'));
const SellerMotivation = lazy(() => import('@/pages/seller-motivation'));
const PortfolioScenario = lazy(() => import('@/pages/portfolio-scenario'));
const ClimateRiskEnhanced = lazy(() => import('@/pages/climate-risk-enhanced'));
const ComputerVision = lazy(() => import('@/pages/computer-vision'));
const ZoningIntelligence = lazy(() => import('@/pages/zoning-intelligence'));
const AvmEngine = lazy(() => import('@/pages/avm-engine'));
const PropertyValuationAi = lazy(() => import('@/pages/property-valuation-ai'));
const RentRoll = lazy(() => import('@/pages/rent-roll'));
const TitleIntelligence = lazy(() => import('@/pages/title-intelligence'));
const ConstructionCost = lazy(() => import('@/pages/construction-cost'));
const SpatialWalkthrough = lazy(() => import('@/pages/spatial-walkthrough'));
const LeaseAbstraction = lazy(() => import('@/pages/lease-abstraction'));
const ProForma = lazy(() => import('@/pages/pro-forma'));
const Exchange1031 = lazy(() => import('@/pages/exchange-1031'));
const TaxAppeal = lazy(() => import('@/pages/tax-appeal'));
const WaterfallCalculator = lazy(() => import('@/pages/waterfall-calculator'));
const ConstructionMonitor = lazy(() => import('@/pages/construction-monitor'));
const TenantScreening = lazy(() => import('@/pages/tenant-screening'));
const TerraAtlasRuntimePage = lazy(() => import('@/pages/atlas-runtime'));
const TerraReplayPage = lazy(() => import('@/pages/replay'));
const TerraScenarioBranchesPage = lazy(() => import('@/pages/scenario-branches'));
const TerraConstellationPage = lazy(() => import('@/pages/constellation'));
const OwnershipGraphPage = lazy(() => import('@/pages/ownership-graph'));
const LenderExposureMapPage = lazy(() => import('@/pages/lender-exposure-map'));
const CovenantMonitoringPage = lazy(() => import('@/pages/covenant-monitoring'));
const DistressForecastPage = lazy(() => import('@/pages/distress-forecast'));
const UnderwritingCopilotPage = lazy(() => import('@/pages/underwriting-copilot'));
const DiligenceRoomPage = lazy(() => import('@/pages/diligence-room'));
const RiskSimulationPage = lazy(() => import('@/pages/risk-simulation'));
const WhyThisPropertyNow = lazy(() => import('@/pages/why-this-property-now'));
const SourcingInbox = lazy(() => import('@/pages/sourcing-inbox'));
const CapRateModel = lazy(() => import('@/pages/cap-rate-model'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div
        className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{ borderColor: 'rgba(45,106,79,0.2)', borderTopColor: TERRA_ACCENT }}
      />
    </div>
  );
}

function NotFound() {
  return (
    <div
      className="flex items-center justify-center h-64 text-sm"
      style={{ color: 'rgba(255,255,255,0.3)' }}
    >
      Page not found
    </div>
  );
}

function PrivateRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/pulse" component={TerraPulse} />
        <Route path="/decision-center" component={DecisionCenterPage} />
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/home" component={() => <Redirect to="/dashboard" />} />
        <Route path="/distress-engine" component={DistressEngine} />
        <Route path="/deals" component={Deals} />
        <Route path="/listings" component={Listings} />
        <Route path="/leads" component={Leads} />
        <Route path="/team" component={Team} />
        <Route path="/inquiries" component={InquiriesPage} />
        <Route path="/agents" component={AgentsPage} />
        <Route path="/case-study" component={CaseStudyPage} />
        <Route path="/market" component={Market} />
        <Route path="/market-assessment" component={InvestmentReadinessPage} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/documents" component={Documents} />
        <Route path="/offers" component={Offers} />
        <Route path="/predictions" component={Predictions} />
        <Route path="/automations" component={Automations} />
        <Route path="/broker-overview" component={BrokerOverview} />
        <Route path="/ingestion" component={Ingestion} />
        <Route path="/commercial" component={CommercialIntelligence} />
        <Route path="/market-intelligence" component={MarketIntelligence} />
        <Route path="/market-analytics" component={MarketAnalytics} />
        <Route path="/comparable-sales" component={ComparableSales} />
        <Route path="/distress-pipeline" component={DistressPipeline} />
        <Route path="/portfolio-dashboard" component={PortfolioDashboard} />
        <Route path="/investor-mode" component={InvestorMode} />
        <Route path="/evidence" component={TerraEvidencePage} />
        <Route path="/pipeline" component={Pipeline} />
        <Route path="/property-map" component={PropertyMapPage} />
        <Route path="/property/:id" component={PropertyDetail} />
        <Route path="/property-twin-view" component={PropertyTwinView} />
        <Route path="/powerbi" component={PowerBiReport} />
        <Route path="/document-engine" component={DocumentEngine} />
        <Route path="/document-engine/:sub" component={DocumentEngine} />
        <Route path="/atlas-artifacts" component={TerraAtlasArtifactsPage} />
        <Route path="/pricing" component={TerraPerricingPage} />
        <Route path="/account/billing" component={TerraBillingPage} />
        <Route path="/lender-report" component={LenderReport} />
        <Route path="/property-desk" component={PropertyDesk} />
        <Route path="/what-changed" component={WhatChanged} />
        <Route path="/diligence-prep" component={DiligencePrep} />
        <Route path="/readiness-board" component={ReadinessBoard} />
        <Route path="/approval-review" component={ApprovalReview} />
        <Route path="/trust-provenance" component={TrustProvenancePage} />
        <Route path="/distress-radar" component={DistressRadar} />
        <Route path="/aef-search" component={AefKnowledgeSearchPage} />
        <Route path="/forecast" component={ForecastPage} />
        <Route path="/neighborhood-momentum/:propertyId" component={NeighborhoodMomentum} />
        <Route path="/neighborhood-momentum" component={NeighborhoodMomentum} />
        <Route path="/seller-motivation/:propertyId" component={SellerMotivation} />
        <Route path="/seller-motivation" component={SellerMotivation} />
        <Route path="/portfolio-scenario" component={PortfolioScenario} />
        <Route path="/climate-risk-enhanced/:propertyId" component={ClimateRiskEnhanced} />
        <Route path="/climate-risk-enhanced" component={ClimateRiskEnhanced} />
        <Route path="/computer-vision" component={ComputerVision} />
        <Route path="/zoning-intelligence/:propertyId" component={ZoningIntelligence} />
        <Route path="/zoning-intelligence" component={ZoningIntelligence} />
        <Route path="/avm-engine" component={AvmEngine} />
        <Route path="/property-valuation-ai" component={PropertyValuationAi} />
        <Route path="/rent-roll" component={RentRoll} />
        <Route path="/title-intelligence" component={TitleIntelligence} />
        <Route path="/construction-cost" component={ConstructionCost} />
        <Route path="/spatial-walkthrough/:propertyId" component={SpatialWalkthrough} />
        <Route path="/spatial-walkthrough" component={SpatialWalkthrough} />
        <Route path="/lease-abstraction" component={LeaseAbstraction} />
        <Route path="/pro-forma" component={ProForma} />
        <Route path="/exchange-1031" component={Exchange1031} />
        <Route path="/tax-appeal" component={TaxAppeal} />
        <Route path="/waterfall-calculator/:propertyId" component={WaterfallCalculator} />
        <Route path="/waterfall-calculator" component={WaterfallCalculator} />
        <Route path="/construction-monitor" component={ConstructionMonitor} />
        <Route path="/tenant-screening" component={TenantScreening} />
        <Route path="/atlas-runtime" component={TerraAtlasRuntimePage} />
        <Route path="/atlas-execute" component={TerraAtlasExecutePage} />
        <Route path="/replay" component={TerraReplayPage} />
        <Route path="/scenario-branches" component={TerraScenarioBranchesPage} />
        <Route path="/constellation" component={TerraConstellationPage} />
        <Route path="/ownership-graph" component={OwnershipGraphPage} />
        <Route path="/lender-exposure-map" component={LenderExposureMapPage} />
        <Route path="/covenant-monitoring" component={CovenantMonitoringPage} />
        <Route path="/distress-forecast" component={DistressForecastPage} />
        <Route path="/underwriting-copilot" component={UnderwritingCopilotPage} />
        <Route path="/diligence-room" component={DiligenceRoomPage} />
        <Route path="/governed-cockpit" component={GovernedCockpitPage} />
        <Route path="/risk-simulation" component={RiskSimulationPage} />
        <Route path="/why-this-property/:propertyId" component={WhyThisPropertyNow} />
        <Route path="/why-this-property" component={WhyThisPropertyNow} />
        <Route path="/sourcing-inbox" component={SourcingInbox} />
        <Route path="/cap-rate-model" component={CapRateModel} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

const terraCommands: CommandItem[] = [
  {
    id: 'nav-dashboard',
    label: 'Overview',
    icon: '◼',
    group: 'Navigation',
    shortcut: '⌥D',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/dashboard');
    },
  },
  {
    id: 'nav-distress',
    label: 'Watchlists',
    icon: '⚠',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/distress-engine');
    },
  },
  {
    id: 'nav-market',
    label: 'Market',
    icon: '↑',
    group: 'Navigation',
    shortcut: '⌥M',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/market');
    },
  },
  {
    id: 'nav-pipeline',
    label: 'Pipeline',
    icon: '◈',
    group: 'Navigation',
    shortcut: '⌥L',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/pipeline');
    },
  },
  {
    id: 'nav-investor',
    label: 'Ownership',
    icon: '⊛',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/investor-mode');
    },
  },
  {
    id: 'nav-deals',
    label: 'Deals',
    icon: '◈',
    group: 'Navigation',
    shortcut: '⌥E',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/deals');
    },
  },
  {
    id: 'nav-leads',
    label: 'Brokers',
    icon: '◎',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/leads');
    },
  },
  {
    id: 'nav-listings',
    label: 'Portfolio',
    icon: '□',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/listings');
    },
  },
  {
    id: 'nav-approvals',
    label: 'Approvals',
    icon: '✓',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/transactions');
    },
  },
  {
    id: 'nav-admin',
    label: 'Admin',
    icon: '⊙',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/broker-overview');
    },
  },
  {
    id: 'nav-cap-rate',
    label: 'Cap Rate Model',
    icon: '📊',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/cap-rate-model');
    },
  },
  {
    id: 'nav-property-valuation-ai',
    label: 'AI Property Valuation (HF)',
    icon: '◈',
    group: 'Navigation',
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/property-valuation-ai');
    },
  },
  ...createBaselineWebActions(
    (path) => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, path);
    },
    {
      helpUrl: 'https://szlholdings.com/docs',
      themeToggle: {
        label: 'Toggle Theme',
        action: () => {
          document.documentElement.classList.toggle('light');
        },
      },
    },
  ),
  ...getEcosystemSwitchCommands('terra'),
];

const terraShortcuts: KeyboardShortcut[] = [
  { key: 'D', description: 'Watchlists', category: 'Navigation' },
  { key: 'P', description: 'Pipeline', category: 'Navigation' },
  { key: 'M', description: 'Market', category: 'Navigation' },
  { key: 'E', description: 'Deals', category: 'Navigation' },
];

function TerraDemoNarrativeOverlay() {
  const { sandboxActive } = useSandboxMode();
  if (!sandboxActive) return null;
  return (
    <DemoNarrativeSidebar
      title={TERRA_DEMO_NARRATIVE.title}
      scenario={TERRA_DEMO_NARRATIVE.scenario}
      steps={TERRA_DEMO_NARRATIVE.steps}
      accentColor={TERRA_ACCENT}
      storageKey="terra-demo-narrative"
    />
  );
}

function PrivateApp({
  cmdOpen,
  setCmdOpen,
}: {
  cmdOpen: boolean;
  setCmdOpen: (v: boolean) => void;
}) {
  return (
    <PowerUserProvider shortcuts={terraShortcuts} appName="Terra" accentColor={TERRA_ACCENT}>
      <div className="flex flex-col h-screen" style={{ background: '#0a0c10' }}>
        <EcosystemNav
          currentAppId="terra"
          currentAppName="Terra — Property Intelligence"
          accentColor={TERRA_ACCENT}
        />
        <SandboxModeBanner />
        <div className="flex-1 overflow-hidden">
          <TerraLayout>
            <PrivateRouter />
          </TerraLayout>
        </div>
      </div>
      <TerraDemoNarrativeOverlay />
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={terraCommands}
        appName="Terra"
        accentColor={TERRA_ACCENT}
      />
    </PowerUserProvider>
  );
}

function AppContent({
  cmdOpen,
  setCmdOpen,
}: {
  cmdOpen: boolean;
  setCmdOpen: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const [location] = useLocation();
  const { sandboxActive, enableSandbox } = useSandboxMode();

  useEffect(() => {
    if (!sandboxActive) {
      enableSandbox();
    }
  }, [sandboxActive, enableSandbox]);

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

  const normalizedPath = location.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/') {
    return (
      <Suspense fallback={<div style={{ height: '100vh', background: '#080b0d' }} />}>
        <TerraMarketingLanding />
      </Suspense>
    );
  }

  if (normalizedPath === '/pulse') {
    return (
      <Suspense fallback={<div style={{ height: '100vh', background: '#0a0c10' }} />}>
        <TerraPulse />
      </Suspense>
    );
  }

  if (normalizedPath === '/market-assessment') {
    return (
      <Suspense fallback={<div style={{ height: '100vh', background: '#0a0c10' }} />}>
        <InvestmentReadinessPage />
      </Suspense>
    );
  }

  return <PrivateApp cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />;
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(terraCommands);
  useSessionRevocationToast();

  return (
    <AppModeProvider>
      <AppModeBanner />
      <AnalyticsProvider appName="terra">
        <PrismBusProvider domain="terra">
          <SandboxModeProvider>
            <QueryClientProvider client={queryClient}>
              <StaleIndicator accentColor={TERRA_ACCENT} />
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
                <AgentCopilot config={beaconConfig} />
                <Toaster />
                <McpOverlay domain="terra" />
              </WouterRouter>
            </QueryClientProvider>
          </SandboxModeProvider>
        </PrismBusProvider>
        <CookieBanner privacyUrl="/legal/privacy" />
      </AnalyticsProvider>
    </AppModeProvider>
  );
}

export default App;
