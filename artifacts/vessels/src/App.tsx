import { readEnvFeatureFlags } from '@szl-holdings/config';
import { UsageIndicator } from '@szl-holdings/shared-ui/billing';
import { PolicyModeBadge } from '@szl-holdings/design-system/proof/policy-mode-badge';

/**
 * `VITE_FEATURE_VESSELS_COMMERCIAL` gates the Insurance & P&I, Trading
 * Desk and marketing /platform routes — these are stub surfaces without a
 * backing data pipeline. Resolved once at module init.
 */
const { vesselsCommercial: VESSELS_COMMERCIAL_ENABLED } = readEnvFeatureFlags(
  import.meta.env as unknown as Record<string, unknown>,
);
const COMMERCIAL_GATED_NAV_IDS = new Set(['insurance-panel', 'trading-desk']);
import { McpOverlay } from '@szl-holdings/mcp-client';
import {
  clearUser as clearSentryUser,
  identifyAnalyticsUser,
  resetAnalyticsUser,
  setUser as setSentryUser,
} from '@szl-holdings/observability/react';
import { CommandQueue, ConflictResolver, IndexedDBAdapter } from '@szl-holdings/offline-engine';
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
import { helmsmanConfig } from '@szl-holdings/shared-ui/copilot-configs';
import { DemoModeProvider, useDemoMode } from '@szl-holdings/shared-ui/demo-mode';
import {
  DemoPersonaModeBridge,
  DemoPersonaProvider,
  DemoPersonaSwitcher,
} from '@szl-holdings/shared-ui/demo-persona-switcher';
import {
  DashboardShell as SharedDashboardShell,
  SidebarNav,
  type SidebarNavSection,
} from '@szl-holdings/shared-ui/design-system';
import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import {
  type KeyboardShortcut,
  PowerUserProvider,
} from '@szl-holdings/shared-ui/keyboard-shortcuts';
import { LANE_ACCENT_HEX } from '@szl-holdings/shared-ui/lane-colors';
import {
  GettingStartedChecklist,
  type OnboardingConfig,
  OnboardingWizard,
  useOnboardingAnalytics,
} from '@szl-holdings/shared-ui/onboarding';
import { PrivateAppGuard } from '@szl-holdings/shared-ui/PrivateAppGuard';
import { PackBanner } from '@szl-holdings/shared-ui/pack-banner';
import { RealtimeStatusIndicator } from '@szl-holdings/shared-ui/realtime-status-indicator';
import { SandboxModeBanner, SandboxModeProvider } from '@szl-holdings/shared-ui/sandbox-mode';
import { ServiceStatusRail } from '@szl-holdings/shared-ui/service-status-rail';
import { StaleIndicator } from '@szl-holdings/shared-ui/stale-indicator';
import { SyncStatusBadge } from '@szl-holdings/shared-ui/sync-status-badge';
import { UserButton } from '@szl-holdings/shared-ui/UserButton';
import { Toaster } from '@szl-holdings/shared-ui/ui/sonner';
import { useSessionRevocationToast } from '@szl-holdings/shared-ui/use-session-revocation-toast';
import { useRealtimeChannel } from '@szl-holdings/shared-ui/use-realtime-channel';
import {
  useEffectiveAccent,
  useUserPreferences,
} from '@szl-holdings/shared-ui/use-user-preferences';
import { useWebSyncStatus } from '@szl-holdings/shared-ui/use-web-sync-status';
import { cn, toAlpha } from '@szl-holdings/shared-ui/utils';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Anchor,
  BarChart3,
  Brain,
  Calculator,
  ChevronDown,
  Cpu,
  Database,
  DollarSign,
  FileText,
  Fuel,
  GitBranch,
  Globe,
  Layers,
  LayoutDashboard,
  Leaf,
  Link2,
  List,
  MapPin,
  Menu,
  Navigation,
  Network,
  Radio,
  RotateCcw,
  Search,
  Shield,
  ShieldAlert,
  Ship,
  TrendingUp,
  User,
  Users,
  Waves,
  WifiOff,
  Wrench,
  Zap,
} from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link, Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  AuthProvider,
  roleLabels,
  type UserRole,
  useAuth as useVesselsRoleAuth,
} from '@/contexts/auth-context';
import MarketingHomePage from '@/pages/marketing-home';

function pathToVesselsActionType(path: string): string | undefined {
  const seg = path.replace(/^\/+/, '').split('/')[0];
  if (!seg || seg === 'dashboard' || seg === 'marketing') return undefined;
  return seg;
}

const VESSELS_BRAND_ACCENT = LANE_ACCENT_HEX.vessels.primaryLight;

const _vesselsStorage = new IndexedDBAdapter({ dbName: 'szl-vessels-offline' });
const _vesselsConflictResolver = new ConflictResolver({ storage: _vesselsStorage });
const _vesselsQueue = new CommandQueue({
  storage: _vesselsStorage,
  conflictResolver: _vesselsConflictResolver,
});

const API_BASE_VESSELS = import.meta.env.VITE_API_URL ?? '/api';

export async function vesselsEnqueueMutation(params: {
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  type?: string;
  priority?: 'critical' | 'high' | 'normal' | 'low';
}): Promise<void> {
  await _vesselsQueue.enqueue({
    domain: 'vessels',
    type: params.type ?? 'mutation',
    method: params.method,
    url: `${API_BASE_VESSELS}${params.path}`,
    body: params.body,
    maxRetries: 5,
    priority: params.priority ?? 'normal',
  });
}

export async function vesselsReplayQueue(
  token: string | null,
): Promise<{ replayed: number; failed: number; conflicts: number }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return _vesselsQueue.replay(async () => headers, 'vessels');
}

const VESSELS_ONBOARDING_CONFIG: OnboardingConfig = {
  appId: 'vessels',
  appName: 'Vessels',
  accentColor: VESSELS_BRAND_ACCENT,
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Vessels',
      description:
        'Vessels is your maritime intelligence command — AIS fleet tracking (live feed or simulated), voyage economics, risk scoring, dark vessel detection, and sanctions screening for 1,200+ vessels.',
      placement: 'center',
      icon: Ship,
    },
    {
      id: 'fleet-map',
      title: 'Live Fleet Map',
      description:
        'The Fleet Map shows vessel positions from AIS feeds (live when connected, labeled-simulated otherwise). Click any vessel to drill into voyage details, fuel performance, ETAs, and flag risk indicators.',
      targetSelector: "a[href='/fleet']",
      placement: 'right',
      icon: Globe,
    },
    {
      id: 'command-overview',
      title: 'Command Overview',
      description:
        'Your command dashboard surfaces fleet KPIs — vessels in port, at sea, flagged for exceptions, and distress signals — all in one operational view.',
      targetSelector: "a[href='/dashboard']",
      placement: 'right',
      icon: LayoutDashboard,
    },
    {
      id: 'alerts',
      title: 'Alert Center',
      description:
        'The Alert Center consolidates all fleet alerts — geofence violations, AIS blackouts, sanctions exposure, and weather routing conflicts — with severity triage.',
      targetSelector: "a[href='/alerts']",
      placement: 'right',
      icon: AlertTriangle,
    },
    {
      id: 'intelligence',
      title: 'Maritime Intelligence',
      description:
        'Go deeper with maritime intelligence: dark vessel detection, sanctions screening, corridor risk analysis, and cyber threat assessment for your fleet.',
      placement: 'center',
      icon: Brain,
    },
  ],
  checklist: [
    {
      id: 'view-fleet-map',
      label: 'Explore the live fleet map',
      description: 'Check real-time vessel positions',
    },
    {
      id: 'review-dashboard',
      label: 'Review command overview',
      description: 'Check fleet KPIs and exception counts',
    },
    {
      id: 'check-alerts',
      label: 'Review active alerts',
      description: 'Triage geofence and AIS blackout alerts',
    },
    {
      id: 'view-voyage-economics',
      label: 'Check voyage economics',
      description: 'Review fuel costs and voyage P&L',
    },
    {
      id: 'check-risk-scoring',
      label: 'Review vessel risk scores',
      description: 'Check sanctions and compliance flags',
    },
  ],
};

// Marketing pages
const VesselsPulse = lazy(() => import('@/pages/pulse'));
const VesselsAtlasArtifactsPage = lazy(() => import('@/pages/atlas-artifacts'));
const AefKnowledgeSearchPage = lazy(() => import('@/pages/aef-knowledge-search'));
const ForecastPage = lazy(() => import('@/pages/forecast'));
const MarketingPlatformPage = lazy(() => import('@/pages/marketing-platform'));
const MarketingCapabilitiesPage = lazy(() => import('@/pages/marketing-capabilities'));
const MarketingUseCasesPage = lazy(() => import('@/pages/marketing-use-cases'));
const MarketingSecurityPage = lazy(() => import('@/pages/marketing-security'));
const MarketingPricingPage = lazy(() => import('@/pages/marketing-pricing'));
const MarketingDemoPage = lazy(() => import('@/pages/marketing-demo'));
const SignInPage = lazy(() => import('@/pages/marketing-sign-in'));
const FleetAssessmentPage = lazy(() => import('@/pages/fleet-assessment'));
const LegalPrivacyPage = lazy(() => import('@/pages/legal-privacy'));
const LegalTermsPage = lazy(() => import('@/pages/legal-terms'));

// Dashboard / product pages
const CommandOverviewPage = lazy(() => import('@/pages/command-overview'));
const FleetMapPage = lazy(() => import('@/pages/fleet-map'));
const VesselDetailEnhancedPage = lazy(() => import('@/pages/vessel-detail-enhanced'));
const VoyageEconomicsPage = lazy(() => import('@/pages/voyage-economics'));
const ExceptionsCenterPage = lazy(() => import('@/pages/exceptions-center'));
const MaintenanceReadinessPage = lazy(() => import('@/pages/maintenance-readiness'));
const CommandModePage = lazy(() => import('@/pages/command-mode'));
const PerformanceAnalyticsPage = lazy(() => import('@/pages/performance-analytics'));
const VesselsListPage = lazy(() => import('@/pages/vessels-list'));
const CorridorRoutesPage = lazy(() => import('@/pages/corridor-routes'));
const AlertCenterPage = lazy(() => import('@/pages/alert-center'));
const AgentInsightsPage = lazy(() => import('@/pages/agent-insights'));
const MaritimeIntelligence = lazy(() => import('@/pages/maritime-intelligence'));
const CommodityFlowIntelligence = lazy(() => import('@/pages/commodity-flow-intelligence'));
const WeatherPage = lazy(() => import('@/pages/weather-page'));
const PortAnalyticsPage = lazy(() => import('@/pages/port-analytics'));
const CO2EmissionsPage = lazy(() => import('@/pages/co2-emissions'));
const RiskScoringPage = lazy(() => import('@/pages/risk-scoring'));
const DarkVesselDetection = lazy(() => import('@/pages/dark-vessel-detection'));
const AisDecodePage = lazy(() => import('@/pages/ais-decode'));
const SatelliteRfIntelligence = lazy(() => import('@/pages/satellite-rf-intelligence'));
const SanctionsScreening = lazy(() => import('@/pages/sanctions-screening'));
const PortCongestion = lazy(() => import('@/pages/port-congestion'));
const CargoTracking = lazy(() => import('@/pages/cargo-tracking'));
const AisLiveTracking = lazy(() => import('@/pages/ais-live-tracking'));
const CyberThreatPanel = lazy(() => import('@/pages/cyber-threat-panel'));
const IncidentReporting = lazy(() => import('@/pages/incident-reporting'));
const CommandWorkflowsPage = lazy(() => import('@/pages/command-workflows'));
const DocumentEngine = lazy(() => import('@/pages/document-engine'));
const VoyageDeskPage = lazy(() => import('@/pages/voyage-desk'));
const FleetWhatChangedPage = lazy(() => import('@/pages/fleet-what-changed'));
const ExceptionQueuePage = lazy(() => import('@/pages/exception-queue'));
const RouteRiskPage = lazy(() => import('@/pages/route-risk'));
const ConstellationPage = lazy(() => import('@/pages/constellation'));
const VesselsApprovalReviewPage = lazy(() => import('@/pages/vessels-approval-review'));
const TrustProvenancePage = lazy(() => import('@/pages/trust-provenance'));
const VesselsEvidencePage = lazy(() => import('@/pages/evidence'));
const DisruptionForecastPage = lazy(() => import('@/pages/disruption-forecast'));
const DarkFleetEconomicsPage = lazy(() => import('@/pages/dark-fleet-economics'));
const VoyagePnLPage = lazy(() => import('@/pages/voyage-pnl'));
const TradeFlowHeatmapPage = lazy(() => import('@/pages/trade-flow-heatmap'));
const IntelligenceBriefsPage = lazy(() => import('@/pages/intelligence-briefs'));
const TradingDeskPage = lazy(() => import('@/pages/trading-desk'));
const DigitalTwinPage = lazy(() => import('@/pages/digital-twin'));
const AutonomousRoutingPage = lazy(() => import('@/pages/autonomous-routing'));
const PredictiveMaintenancePage = lazy(() => import('@/pages/predictive-maintenance'));
const BlockchainBoLPage = lazy(() => import('@/pages/blockchain-bol'));
const DecarbonizationPage = lazy(() => import('@/pages/decarbonization'));
const PortTwinPage = lazy(() => import('@/pages/port-twin'));
const PiracySanctionsPage = lazy(() => import('@/pages/piracy-sanctions'));
const WeatherRoutingPage = lazy(() => import('@/pages/weather-routing'));
const BunkeringPage = lazy(() => import('@/pages/bunkering'));
const VoyageCarbonPassport = lazy(() => import('@/pages/voyage-carbon-passport'));
const CharterPartyPage = lazy(() => import('@/pages/charter-party'));
const DemurragePage = lazy(() => import('@/pages/demurrage'));
const FreightRatesPage = lazy(() => import('@/pages/freight-rates'));
const StsDetectionPage = lazy(() => import('@/pages/sts-detection'));
const CrewTrackerPage = lazy(() => import('@/pages/crew-tracker'));
const BunkerOptimizerPage = lazy(() => import('@/pages/bunker-optimizer'));
const PscInspectorPage = lazy(() => import('@/pages/psc-inspector'));
const InsurancePanelPage = lazy(() => import('@/pages/insurance-panel'));
const VesselsSettingsPage = lazy(() => import('@/pages/settings'));
const VesselsBillingPanelPage = lazy(() => import('@/pages/billing-panel'));
const VesselsBillingAccountPage = lazy(() => import('@/pages/account-billing'));
const VesselsTeamPanelPage = lazy(() => import('@/pages/team-panel'));
const VesselsAuditLogPanelPage = lazy(() => import('@/pages/audit-log-panel'));
const DecisionCenterPage = lazy(() => import('@/pages/decision-center'));
const VesselsAtlasRuntimePage = lazy(() => import('@/pages/atlas-runtime'));
const VesselsAtlasExecutePage = lazy(() => import('@/pages/atlas-execute'));
const VesselsReplayPage = lazy(() => import('@/pages/replay'));
const VesselsScenarioBranchesPage = lazy(() => import('@/pages/scenario-branches'));
const OwnerCargoGraphPage = lazy(() => import('@/pages/owner-cargo-graph'));
const RouteAnomalyEnginePage = lazy(() => import('@/pages/route-anomaly-engine'));
const SanctionsChainExplorerPage = lazy(() => import('@/pages/sanctions-chain-explorer'));
const SanctionsHeatPage = lazy(() => import('@/pages/sanctions-heat'));
const CounterpartyRiskMapPage = lazy(() => import('@/pages/counterparty-risk-map'));
const VoyageTwinPage = lazy(() => import('@/pages/voyage-twin'));
const VoyageRiskTwinPage = lazy(() => import('@/pages/voyage-risk-twin'));
const GovernedCockpitPage = lazy(() => import('@/pages/governed-cockpit'));
const GeoDecisionCenterPage = lazy(() => import('@/pages/geo-decision-center'));
const RiskSimulationPage = lazy(() => import('@/pages/risk-simulation'));
const VoyageCalculatorPage = lazy(() => import('@/pages/voyage-calculator'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

if (typeof window !== 'undefined') {
  persistQueryClient({
    queryClient: queryClient as unknown as Parameters<typeof persistQueryClient>[0]['queryClient'],
    persister: createSyncStoragePersister({
      storage: window.localStorage,
      key: 'vessels-web-rq-cache',
    }),
    maxAge: 1000 * 60 * 60,
    buster: 'v1',
  });
}

const primaryNavItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/dashboard/fleet', label: 'Fleet', icon: MapPin },
  { path: '/dashboard/vessels', label: 'Vessels', icon: List },
  { path: '/dashboard/routes', label: 'Routes', icon: Navigation },
  { path: '/dashboard/alerts', label: 'Alerts', icon: AlertTriangle },
  { path: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { path: '/governed-cockpit', label: 'Governed Intelligence', icon: Shield },
  { path: '/dashboard/billing', label: 'Billing', icon: DollarSign },
  { path: '/dashboard/settings', label: 'Settings', icon: Wrench },
];

const adminNavItems = [
  { path: '/dashboard/team', label: 'Team', icon: Radio },
  { path: '/dashboard/audit-log', label: 'Audit Log', icon: Activity },
];

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
    </div>
  );
}

interface AppHealthSummary {
  services: { name: string; status: string }[];
  summary: {
    total: number;
    liveConfigured: number;
    mockedDemoMode: number;
    manualRequired: number;
  };
}

function DemoModeBanner() {
  const { data } = useQuery<AppHealthSummary>({
    queryKey: ['app-health-vessels'],
    queryFn: () => fetch('/api/services/health/app/vessels').then((r) => r.json()),
    refetchInterval: 60000,
  });

  if (!data?.summary) return null;
  const hasDemoMode = data.summary.mockedDemoMode > 0;
  const hasUnhealthy = data.summary.manualRequired > 0;
  if (!hasDemoMode && !hasUnhealthy) return null;

  if (hasUnhealthy) {
    return (
      <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-1.5 flex items-center gap-2 shrink-0">
        <WifiOff className="w-3 h-3 text-red-400" />
        <span className="text-[11px] text-red-400">
          {data.summary.manualRequired} integration(s) not configured
        </span>
      </div>
    );
  }

  return (
    <div className="border-b border-amber-500/10 px-4 py-1 flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-mono text-amber-400/60 px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/5">
        AIS
      </span>
      <span className="text-[10px] text-amber-400/50">
        Live AIS feed not connected — showing cached vessel positions · data may be up to 60 min old
      </span>
    </div>
  );
}

function RoleSelector({ expanded }: { expanded: boolean }) {
  const { user, setRole } = useVesselsRoleAuth();
  const [open, setOpen] = useState(false);
  const roles: UserRole[] = ['exec', 'ops', 'compliance', 'maintenance'];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-sky-500/5 transition-colors text-left"
        aria-label={`Current role: ${roleLabels[user.role]}`}
      >
        <div className="w-7 h-7 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
          <User className="w-3.5 h-3.5 text-sky-400" />
        </div>
        {expanded && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sky-100 truncate">{user.name}</p>
              <p className="text-[10px] text-sky-400/50">{roleLabels[user.role]}</p>
            </div>
            <ChevronDown
              className={cn(
                'w-3 h-3 text-sky-400/40 transition-transform shrink-0',
                open && 'rotate-180',
              )}
            />
          </>
        )}
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 right-0 mb-1 bg-[#0a1628] border border-sky-500/20 rounded-lg shadow-xl z-50 overflow-hidden"
          style={{ minWidth: 160 }}
        >
          <div className="p-2 border-b border-sky-500/10">
            <p className="text-[10px] text-sky-400/50 uppercase tracking-wider px-2">Switch Role</p>
          </div>
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r);
                setOpen(false);
              }}
              className={cn(
                'w-full text-left px-3 py-2 text-xs transition-colors',
                user.role === r
                  ? 'bg-sky-500/10 text-sky-400'
                  : 'text-sky-300/50 hover:text-sky-100 hover:bg-sky-500/5',
              )}
            >
              {roleLabels[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const _VESSELS_COLLAPSE_KEY = 'vessels-sidebar-collapsed';

function VesselsSidebarContent({
  expanded,
  onMobileClose,
  onToggleCollapse,
}: {
  expanded: boolean;
  onMobileClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  const [location, navigate] = useLocation();
  const accent = useEffectiveAccent(VESSELS_BRAND_ACCENT);

  const primarySectionsRaw: SidebarNavSection[] = [
    {
      id: 'os-layer',
      label: 'OS Layer',
      items: [
        {
          id: 'decision-center',
          label: 'Decision Center',
          href: '/decision-center',
          icon: <Zap className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'core',
      label: 'Core',
      items: primaryNavItems.map(({ path, label, icon: Icon }) => ({
        id: path,
        label,
        href: path,
        icon: <Icon className="w-3.5 h-3.5" />,
      })),
    },
    {
      id: 'atlas-runtime',
      label: 'ATLAS Spatial Runtime',
      items: [
        {
          id: 'atlas-execute',
          label: 'Run Workflow',
          href: '/atlas-execute',
          icon: <Zap className="w-3.5 h-3.5" />,
        },
        {
          id: 'geo-decision-center',
          label: 'Geo Decision Center',
          href: '/geo-decision-center',
          icon: <Navigation className="w-3.5 h-3.5" />,
        },
        {
          id: 'atlas-runtime',
          label: 'Route Memory Twin',
          href: '/atlas-runtime',
          icon: <Layers className="w-3.5 h-3.5" />,
        },
        {
          id: 'voyage-replay',
          label: 'Voyage Replay',
          href: '/replay',
          icon: <RotateCcw className="w-3.5 h-3.5" />,
        },
        {
          id: 'scenario-branches',
          label: 'Scenario Branches',
          href: '/scenario-branches',
          icon: <GitBranch className="w-3.5 h-3.5" />,
        },
        {
          id: 'constellation',
          label: 'Constellation',
          href: '/constellation',
          icon: <Layers className="w-3.5 h-3.5" />,
        },
        {
          id: 'owner-cargo-graph',
          label: 'Owner–Port–Cargo Graph',
          href: '/owner-cargo-graph',
          icon: <Network className="w-3.5 h-3.5" />,
        },
        {
          id: 'route-anomaly-engine',
          label: 'Route Anomaly Engine',
          href: '/route-anomaly-engine',
          icon: <Navigation className="w-3.5 h-3.5" />,
        },
        {
          id: 'sanctions-chain-explorer',
          label: 'Sanctions Chain Explorer',
          href: '/sanctions-chain-explorer',
          icon: <Link2 className="w-3.5 h-3.5" />,
        },
        {
          id: 'counterparty-risk-map',
          label: 'Counterparty Risk Map',
          href: '/counterparty-risk-map',
          icon: <Users className="w-3.5 h-3.5" />,
        },
        {
          id: 'voyage-risk-twin',
          label: 'Voyage Risk Twin ★',
          href: '/voyage-risk-twin',
          icon: <Layers className="w-3.5 h-3.5" />,
        },
        {
          id: 'voyage-twin',
          label: 'Voyage Twin',
          href: '/voyage-twin',
          icon: <Cpu className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'digital-twin-platform',
      label: 'Digital Twin Platform',
      items: [
        {
          id: 'digital-twin',
          label: 'Vessel Digital Twin',
          href: '/digital-twin',
          icon: <Cpu className="w-3.5 h-3.5" />,
        },
        {
          id: 'autonomous-routing',
          label: 'Autonomous Routing',
          href: '/autonomous-routing',
          icon: <Navigation className="w-3.5 h-3.5" />,
        },
        {
          id: 'predictive-maintenance-ml',
          label: 'Predictive Maintenance',
          href: '/predictive-maintenance-ml',
          icon: <Wrench className="w-3.5 h-3.5" />,
        },
        {
          id: 'blockchain-bol',
          label: 'Blockchain BoL',
          href: '/blockchain-bol',
          icon: <Shield className="w-3.5 h-3.5" />,
        },
        {
          id: 'decarbonization',
          label: 'Decarbonization',
          href: '/decarbonization',
          icon: <Leaf className="w-3.5 h-3.5" />,
        },
        {
          id: 'carbon-passport',
          label: 'Carbon Passport',
          href: '/voyage-carbon-passport',
          icon: <Leaf className="w-3.5 h-3.5" />,
        },
        {
          id: 'port-twin',
          label: 'Port Digital Twin',
          href: '/port-twin',
          icon: <Anchor className="w-3.5 h-3.5" />,
        },
        {
          id: 'piracy-sanctions',
          label: 'Piracy & Sanctions',
          href: '/piracy-sanctions',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
        },
        {
          id: 'weather-routing',
          label: 'Weather Routing',
          href: '/weather-routing',
          icon: <Waves className="w-3.5 h-3.5" />,
        },
        {
          id: 'bunkering',
          label: 'Bunkering Intelligence',
          href: '/bunkering',
          icon: <Fuel className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'commercial',
      label: 'Commercial',
      items: [
        {
          id: 'charter-party',
          label: 'Charter Party Manager',
          href: '/charter-party',
          icon: <FileText className="w-3.5 h-3.5" />,
        },
        {
          id: 'demurrage',
          label: 'Demurrage Calculator',
          href: '/demurrage',
          icon: <Calculator className="w-3.5 h-3.5" />,
        },
        {
          id: 'freight-rates',
          label: 'Freight Rate Benchmarking',
          href: '/freight-rates',
          icon: <BarChart3 className="w-3.5 h-3.5" />,
        },
        {
          id: 'bunker-optimizer',
          label: 'Bunker Optimizer',
          href: '/bunker-optimizer',
          icon: <Fuel className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance & Crew',
      items: [
        {
          id: 'crew-tracker',
          label: 'Crew & Certification',
          href: '/crew-tracker',
          icon: <User className="w-3.5 h-3.5" />,
        },
        {
          id: 'psc-inspector',
          label: 'PSC Inspector',
          href: '/psc-inspector',
          icon: <Shield className="w-3.5 h-3.5" />,
        },
        {
          id: 'sts-detection',
          label: 'STS Transfer Detection',
          href: '/sts-detection',
          icon: <Radio className="w-3.5 h-3.5" />,
        },
        {
          id: 'insurance-panel',
          label: 'Insurance & P&I',
          href: '/insurance-panel',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'intelligence',
      label: 'Intelligence',
      items: [
        {
          id: 'disruption-forecast',
          label: 'Disruption Forecast',
          href: '/disruption-forecast',
          icon: <Globe className="w-3.5 h-3.5" />,
        },
        {
          id: 'dark-fleet-economics',
          label: 'Dark Fleet Economics',
          href: '/dark-fleet-economics',
          icon: <Calculator className="w-3.5 h-3.5" />,
        },
        {
          id: 'sanctions-heat',
          label: 'Sanctions Heat',
          href: '/sanctions-heat',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
        },
        {
          id: 'voyage-pnl-pred',
          label: 'Voyage P&L Predictor',
          href: '/voyage-pnl',
          icon: <TrendingUp className="w-3.5 h-3.5" />,
        },
        {
          id: 'trade-flow-heatmap',
          label: 'Trade Flow Heatmap',
          href: '/trade-flow-heatmap',
          icon: <BarChart3 className="w-3.5 h-3.5" />,
        },
        {
          id: 'intelligence-briefs',
          label: 'Intelligence Briefs',
          href: '/intelligence-briefs',
          icon: <Zap className="w-3.5 h-3.5" />,
        },
        {
          id: 'satellite-rf-intelligence',
          label: 'Satellite RF Intelligence',
          href: '/satellite-rf-intelligence',
          icon: <Radio className="w-3.5 h-3.5" />,
        },
        {
          id: 'ais-decode',
          label: 'AIS Decode & ML',
          href: '/ais-decode',
          icon: <Brain className="w-3.5 h-3.5" />,
        },
        {
          id: 'aef-search',
          label: 'AEF Knowledge Search',
          href: '/aef-search',
          icon: <Search className="w-3.5 h-3.5" />,
        },
        {
          id: 'trading-desk',
          label: 'Trading Desk',
          href: '/trading-desk',
          icon: <TrendingUp className="w-3.5 h-3.5" />,
        },
        {
          id: 'risk-simulation',
          label: 'Risk Simulation',
          href: '/risk-simulation',
          icon: <Calculator className="w-3.5 h-3.5" />,
        },
        {
          id: 'voyage-calculator',
          label: 'Voyage Calculator',
          href: '/voyage-calculator',
          icon: <DollarSign className="w-3.5 h-3.5" />,
          badge: 'NEW',
        },
      ],
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        {
          id: 'voyage-desk',
          label: 'Voyage Desk',
          href: '/voyage-desk',
          icon: <Anchor className="w-3.5 h-3.5" />,
        },
        {
          id: 'what-changed',
          label: 'What Changed',
          href: '/what-changed',
          icon: <Radio className="w-3.5 h-3.5" />,
        },
        {
          id: 'exception-queue',
          label: 'Exceptions',
          href: '/exception-queue',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        },
        {
          id: 'route-risk',
          label: 'Route Risk',
          href: '/route-risk',
          icon: <Navigation className="w-3.5 h-3.5" />,
        },
        {
          id: 'approval-review',
          label: 'Review & Approval',
          href: '/approval-review',
          icon: <Shield className="w-3.5 h-3.5" />,
        },
        {
          id: 'trust-provenance',
          label: 'Trust & Provenance',
          href: '/trust-provenance',
          icon: <Shield className="w-3.5 h-3.5" />,
        },
        {
          id: 'evidence',
          label: 'Evidence',
          href: '/evidence',
          icon: <Database className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      items: adminNavItems.map(({ path, label, icon: Icon }) => ({
        id: path,
        label,
        href: path,
        icon: <Icon className="w-3.5 h-3.5" />,
      })),
    },
  ];

  const primarySections: SidebarNavSection[] = VESSELS_COMMERCIAL_ENABLED
    ? primarySectionsRaw
    : primarySectionsRaw.map((section) => ({
        ...section,
        items: section.items.filter((item) => !COMMERCIAL_GATED_NAV_IDS.has(item.id)),
      }));

  const fleetStatusFooter = expanded ? (
    <div className="space-y-3">
      <div
        className="rounded-lg px-3 py-3"
        style={{
          background: toAlpha(VESSELS_BRAND_ACCENT, 0.04),
          border: `1px solid ${toAlpha(VESSELS_BRAND_ACCENT, 0.08)}`,
        }}
      >
        <div
          className="text-[9px] uppercase tracking-widest font-medium mb-2"
          style={{ color: toAlpha(VESSELS_BRAND_ACCENT, 0.5) }}
        >
          Fleet Status
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Vessels tracked</span>
            <span className="text-[9px] font-mono" style={{ color: VESSELS_BRAND_ACCENT }}>
              1,247 tracked
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Distress signals</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[9px] font-mono text-red-400">2 active</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/35">Zones monitored</span>
            <span className="text-[9px] font-mono text-white/40">18 regions</span>
          </div>
        </div>
        <div className="mt-2 h-0.5 rounded-full overflow-hidden bg-white/6">
          <div
            className="h-full rounded-full"
            style={{
              width: '94%',
              background: `linear-gradient(90deg, ${VESSELS_BRAND_ACCENT}, ${toAlpha(VESSELS_BRAND_ACCENT, 0.6)})`,
            }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-white/20">AIS coverage</span>
          <span className="text-[8px] font-mono text-white/30">94%</span>
        </div>
      </div>
      {VESSELS_ONBOARDING_CONFIG.checklist && (
        <GettingStartedChecklist
          appId={VESSELS_ONBOARDING_CONFIG.appId}
          appName={VESSELS_ONBOARDING_CONFIG.appName}
          items={VESSELS_ONBOARDING_CONFIG.checklist}
          accentColor={VESSELS_ONBOARDING_CONFIG.accentColor}
          collapsed
        />
      )}
      <Link href="/platform">
        <div
          className="w-full text-xs font-medium text-center px-3 py-2 rounded-lg cursor-pointer transition-colors"
          style={{ background: toAlpha(VESSELS_BRAND_ACCENT, 0.1), color: VESSELS_BRAND_ACCENT }}
        >
          Request demo
        </div>
      </Link>
      <UserButton showName className="w-full" />
      <RoleSelector expanded={expanded} />
      <PackBanner
        vertical="Maritime Intelligence Pack"
        accentColor={VESSELS_BRAND_ACCENT}
        compact
      />
    </div>
  ) : (
    <div className="space-y-2">
      <UserButton className="w-full" />
      <RoleSelector expanded={false} />
    </div>
  );

  return (
    <SidebarNav
      sections={primarySections}
      currentPath={location}
      accentColor={accent}
      collapsed={!expanded}
      onNavigate={(item) => {
        if (item.href) navigate(item.href);
        onMobileClose?.();
      }}
      header={
        <Link href="/">
          <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
              style={{
                background: toAlpha(VESSELS_BRAND_ACCENT, 0.08),
                border: `1px solid ${toAlpha(VESSELS_BRAND_ACCENT, 0.12)}`,
              }}
            >
              <Ship className="w-4 h-4" style={{ color: VESSELS_BRAND_ACCENT }} />
            </div>
            {expanded && (
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-semibold text-sky-50 truncate tracking-tight">
                  Vessels
                </h1>
                <p
                  className="text-[10px] truncate font-mono uppercase tracking-wider"
                  style={{ color: toAlpha(VESSELS_BRAND_ACCENT, 0.4) }}
                >
                  Maritime Intelligence Pack
                </p>
              </div>
            )}
          </div>
        </Link>
      }
      footer={
        expanded ? (
          <div className="space-y-3">
            {fleetStatusFooter}
            <UsageIndicator
              featureKey="vessels_tracked"
              label="Vessel tracking"
              accentColor="#4d8fcc"
              billingHref={`${(import.meta.env.BASE_URL ?? '/vessels/').replace(/\/$/, '')}/account/billing`}
            />
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-full py-1 text-[10px] rounded transition-colors hover:bg-white/5"
              style={{ color: toAlpha(VESSELS_BRAND_ACCENT, 0.4) }}
              aria-label="Collapse sidebar"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path
                  d="M8 2L5 6l3 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-7 h-7 mx-auto rounded transition-colors hover:bg-white/5"
            style={{ color: toAlpha(VESSELS_BRAND_ACCENT, 0.4) }}
            aria-label="Expand sidebar"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M4 2l3 4-3 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )
      }
    />
  );
}

function DashboardRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/dashboard" component={CommandOverviewPage} />
        <Route path="/dashboard/fleet" component={FleetMapPage} />
        <Route path="/dashboard/vessels/:id" component={VesselDetailEnhancedPage} />
        <Route path="/dashboard/vessels" component={VesselsListPage} />
        <Route path="/dashboard/routes" component={CorridorRoutesPage} />
        <Route path="/dashboard/alerts" component={AlertCenterPage} />
        <Route path="/dashboard/reports" component={PerformanceAnalyticsPage} />
        <Route path="/dashboard/billing" component={VesselsBillingPanelPage} />
        <Route path="/account/billing" component={VesselsBillingAccountPage} />
        <Route path="/dashboard/settings" component={VesselsSettingsPage} />
        <Route path="/dashboard/team" component={VesselsTeamPanelPage} />
        <Route path="/dashboard/audit-log" component={VesselsAuditLogPanelPage} />
        {/* Legacy route redirects — kept for backward compatibility, redirect to /dashboard/* equivalents */}
        <Route path="/fleet">
          <Redirect to="/dashboard/fleet" />
        </Route>
        <Route path="/vessels-list">
          <Redirect to="/dashboard/vessels" />
        </Route>
        <Route path="/corridors">
          <Redirect to="/dashboard/routes" />
        </Route>
        <Route path="/routes">
          <Redirect to="/dashboard/routes" />
        </Route>
        <Route path="/alerts">
          <Redirect to="/dashboard/alerts" />
        </Route>
        <Route path="/analytics">
          <Redirect to="/dashboard/reports" />
        </Route>
        {/* Legacy routes preserved (no clean /dashboard/* equivalent) */}
        <Route path="/vessel/:id" component={VesselDetailEnhancedPage} />
        <Route path="/vessels/:id" component={VesselDetailEnhancedPage} />
        <Route path="/exceptions" component={ExceptionsCenterPage} />
        <Route path="/economics" component={VoyageEconomicsPage} />
        <Route path="/maintenance" component={MaintenanceReadinessPage} />
        <Route path="/command" component={CommandModePage} />
        <Route path="/intelligence" component={MaritimeIntelligence} />
        <Route path="/weather" component={WeatherPage} />
        <Route path="/port-analytics" component={PortAnalyticsPage} />
        <Route path="/co2-emissions" component={CO2EmissionsPage} />
        <Route path="/risk-scoring" component={RiskScoringPage} />
        <Route path="/dark-vessel-detection" component={DarkVesselDetection} />
        <Route path="/ais-decode" component={AisDecodePage} />
        <Route path="/satellite-rf-intelligence" component={SatelliteRfIntelligence} />
        <Route path="/sanctions-screening" component={SanctionsScreening} />
        <Route path="/port-congestion" component={PortCongestion} />
        <Route path="/cargo-tracking" component={CargoTracking} />
        <Route path="/ais-live" component={AisLiveTracking} />
        <Route path="/commodity-flow" component={CommodityFlowIntelligence} />
        <Route path="/cyber-threats" component={CyberThreatPanel} />
        <Route path="/incidents" component={IncidentReporting} />
        <Route path="/agent-insights" component={AgentInsightsPage} />
        <Route path="/command-workflows" component={CommandWorkflowsPage} />
        <Route path="/document-engine" component={DocumentEngine} />
        <Route path="/document-engine/:sub" component={DocumentEngine} />
        <Route path="/atlas-artifacts" component={VesselsAtlasArtifactsPage} />
        <Route path="/voyage-desk" component={VoyageDeskPage} />
        <Route path="/what-changed" component={FleetWhatChangedPage} />
        <Route path="/exception-queue" component={ExceptionQueuePage} />
        <Route path="/route-risk" component={RouteRiskPage} />
        <Route path="/constellation" component={ConstellationPage} />
        <Route path="/approval-review" component={VesselsApprovalReviewPage} />
        <Route path="/trust-provenance" component={TrustProvenancePage} />
        <Route path="/evidence" component={VesselsEvidencePage} />
        <Route path="/aef-search" component={AefKnowledgeSearchPage} />
        <Route path="/forecast" component={ForecastPage} />
        <Route path="/disruption-forecast" component={DisruptionForecastPage} />
        <Route path="/dark-fleet-economics" component={DarkFleetEconomicsPage} />
        <Route path="/sanctions-heat" component={SanctionsHeatPage} />
        <Route path="/voyage-pnl" component={VoyagePnLPage} />
        <Route path="/trade-flow-heatmap" component={TradeFlowHeatmapPage} />
        <Route path="/intelligence-briefs" component={IntelligenceBriefsPage} />
        {VESSELS_COMMERCIAL_ENABLED && (
          <Route path="/trading-desk" component={TradingDeskPage} />
        )}
        <Route path="/digital-twin" component={DigitalTwinPage} />
        <Route path="/autonomous-routing" component={AutonomousRoutingPage} />
        <Route path="/predictive-maintenance-ml" component={PredictiveMaintenancePage} />
        <Route path="/blockchain-bol" component={BlockchainBoLPage} />
        <Route path="/decarbonization" component={DecarbonizationPage} />
        <Route path="/voyage-carbon-passport" component={VoyageCarbonPassport} />
        <Route path="/port-twin" component={PortTwinPage} />
        <Route path="/piracy-sanctions" component={PiracySanctionsPage} />
        <Route path="/weather-routing" component={WeatherRoutingPage} />
        <Route path="/bunkering" component={BunkeringPage} />
        <Route path="/charter-party" component={CharterPartyPage} />
        <Route path="/demurrage" component={DemurragePage} />
        <Route path="/freight-rates" component={FreightRatesPage} />
        <Route path="/sts-detection" component={StsDetectionPage} />
        <Route path="/crew-tracker" component={CrewTrackerPage} />
        <Route path="/bunker-optimizer" component={BunkerOptimizerPage} />
        <Route path="/psc-inspector" component={PscInspectorPage} />
        {VESSELS_COMMERCIAL_ENABLED && (
          <Route path="/insurance-panel" component={InsurancePanelPage} />
        )}
        <Route path="/decision-center" component={DecisionCenterPage} />
        <Route path="/atlas-runtime" component={VesselsAtlasRuntimePage} />
        <Route path="/atlas-execute" component={VesselsAtlasExecutePage} />
        <Route path="/replay" component={VesselsReplayPage} />
        <Route path="/scenario-branches" component={VesselsScenarioBranchesPage} />
        <Route path="/owner-cargo-graph" component={OwnerCargoGraphPage} />
        <Route path="/route-anomaly-engine" component={RouteAnomalyEnginePage} />
        <Route path="/sanctions-chain-explorer" component={SanctionsChainExplorerPage} />
        <Route path="/counterparty-risk-map" component={CounterpartyRiskMapPage} />
        <Route path="/voyage-twin" component={VoyageTwinPage} />
        <Route path="/voyage-risk-twin" component={VoyageRiskTwinPage} />
        <Route path="/governed-cockpit" component={GovernedCockpitPage} />
        <Route path="/geo-decision-center" component={GeoDecisionCenterPage} />
        <Route path="/risk-simulation" component={RiskSimulationPage} />
        <Route path="/voyage-calculator" component={VoyageCalculatorPage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-sky-400/40">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

const vesselsCommands: CommandItem[] = [
  {
    id: 'nav-dashboard',
    label: 'Dashboard Overview',
    icon: '📊',
    group: 'Navigation',
    shortcut: '⌥D',
    keywords: ['dashboard', 'overview', 'kpi'],
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/dashboard');
    },
  },
  {
    id: 'nav-fleet',
    label: 'Fleet Map',
    icon: '🗺️',
    group: 'Navigation',
    shortcut: '⌥F',
    keywords: ['map', 'fleet', 'positions'],
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/dashboard/fleet');
    },
  },
  {
    id: 'nav-vessels',
    label: 'Vessel Roster',
    icon: '📋',
    group: 'Navigation',
    keywords: ['list', 'roster', 'vessels'],
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/dashboard/vessels');
    },
  },
  {
    id: 'nav-alerts',
    label: 'Alerts',
    icon: '⚠️',
    group: 'Navigation',
    shortcut: '⌥L',
    keywords: ['alerts', 'exceptions', 'issues'],
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/dashboard/alerts');
    },
  },
  {
    id: 'nav-economics',
    label: 'Voyage Economics',
    icon: '💰',
    group: 'Navigation',
    shortcut: '⌥E',
    keywords: ['economics', 'revenue', 'margin'],
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/economics');
    },
  },
  {
    id: 'nav-command',
    label: 'Command Mode',
    icon: '🎯',
    group: 'Navigation',
    keywords: ['command', 'operational', 'focused'],
    action: () => {
      window.location.href = window.location.pathname.replace(/\/[^/]*$/, '/command');
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
  ...getEcosystemSwitchCommands('vessels'),
];

const vesselsShortcuts: KeyboardShortcut[] = [
  { key: 'D', description: 'Go to Dashboard', category: 'Navigation' },
  { key: 'F', description: 'Go to Fleet Map', category: 'Navigation' },
  { key: 'A', description: 'Go to Alerts', category: 'Navigation' },
  { key: 'C', description: 'Go to Command Mode', category: 'Navigation' },
];

function VesselsDashboard({
  cmdOpen,
  setCmdOpen,
}: {
  cmdOpen: boolean;
  setCmdOpen: (v: boolean) => void;
}) {
  const { trackTourCompleted, trackTourSkipped } = useOnboardingAnalytics({
    platform: 'vessels',
    tourId: 'vessels-tour',
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const { prefs, setPreference, isLoaded } = useUserPreferences();
  const accent = useEffectiveAccent(VESSELS_BRAND_ACCENT);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => prefs.sidebar_collapsed);
  const userOverriddenSidebarRef = useRef(false);

  useEffect(() => {
    if (isLoaded && !userOverriddenSidebarRef.current) {
      setSidebarCollapsed(prefs.sidebar_collapsed);
    }
  }, [isLoaded, prefs.sidebar_collapsed]);

  const toggleSidebarCollapsed = () => {
    userOverriddenSidebarRef.current = true;
    setSidebarCollapsed((prev) => {
      const next = !prev;
      setPreference('sidebar_collapsed', next);
      return next;
    });
  };
  const sidebarExpanded = !sidebarCollapsed && (sidebarHovered || sidebarOpen);
  const [topbarLocation] = useLocation();
  const topbarActionType = pathToVesselsActionType(topbarLocation);
  const { status: wsStatus } = useRealtimeChannel('vessel-positions');
  const {
    syncState: vesselsSyncState,
    lastSyncedAt: vesselsLastSynced,
    pendingCount: vesselsPending,
    conflictCount: vesselsConflicts,
  } = useWebSyncStatus({
    domain: 'vessels',
    syncEndpoint: `${import.meta.env.BASE_URL}api/vessels/sync`,
    syncIntervalMs: 120_000,
    getPendingCount: () => _vesselsQueue.count('vessels'),
    getConflictCount: () => _vesselsConflictResolver.getConflictCount('vessels'),
  });
  return (
    <PowerUserProvider shortcuts={vesselsShortcuts} appName="Vessels" accentColor={accent}>
      <div className="flex flex-col h-screen" style={{ background: '#060e1a' }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
          style={{ background: accent, color: '#fff' }}
        >
          Skip to main content
        </a>
        <EcosystemNav
          currentAppId="vessels"
          currentAppName="Vessels Maritime Intelligence"
          accentColor={accent}
        />
        <SandboxModeBanner />
        <DemoModeBanner />
        <SharedDashboardShell
          sidebar={
            <VesselsSidebarContent
              expanded={sidebarExpanded}
              onMobileClose={() => setSidebarOpen(false)}
              onToggleCollapse={toggleSidebarCollapsed}
            />
          }
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          sidebarWidth={sidebarExpanded ? '13rem' : '3.5rem'}
          sidebarEvents={{
            onMouseEnter: () => setSidebarHovered(true),
            onMouseLeave: () => setSidebarHovered(false),
          }}
          theme={{ sidebarBg: '#060e1a', pageBg: '#060e1a', headerBg: toAlpha('#060e1a', 0.92) }}
          accentColor={accent}
          topbar={
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-1.5 rounded transition-colors"
                style={{ color: toAlpha(VESSELS_BRAND_ACCENT, 0.5) }}
                aria-label="Toggle navigation"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span
                className="md:hidden text-[10px] font-mono uppercase tracking-wider"
                style={{ color: toAlpha(VESSELS_BRAND_ACCENT, 0.8) }}
              >
                Vessels Maritime Intelligence
              </span>
              <div className="ml-auto pr-1 flex items-center gap-2">
                <PolicyModeBadge product="vessels" actionType={topbarActionType} />
                <span className="md:hidden flex items-center gap-2">
                  <SyncStatusBadge
                    syncState={vesselsSyncState}
                    lastSyncedAt={vesselsLastSynced}
                    pendingCount={vesselsPending}
                    conflictCount={vesselsConflicts}
                    size="xs"
                    showLabel={false}
                  />
                  <RealtimeStatusIndicator status={wsStatus} compact />
                </span>
              </div>
            </div>
          }
        >
          <div
            data-szl-shell-main
            className="flex-1 overflow-auto h-full"
          >
            <DashboardRouter />
          </div>
        </SharedDashboardShell>
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <ServiceStatusRail />
        </div>
      </div>
      <Toaster />
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        commands={vesselsCommands}
        appName="Vessels"
        accentColor={accent}
      />
      <OnboardingWizard
        config={VESSELS_ONBOARDING_CONFIG}
        onComplete={trackTourCompleted}
        onSkip={trackTourSkipped}
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
  const isDashboard =
    location.startsWith('/dashboard') ||
    location.startsWith('/fleet') ||
    location.startsWith('/vessel') ||
    location.startsWith('/exceptions') ||
    location.startsWith('/economics') ||
    location.startsWith('/maintenance') ||
    location.startsWith('/command') ||
    location.startsWith('/analytics') ||
    location.startsWith('/intelligence') ||
    location.startsWith('/corridors') ||
    location.startsWith('/alerts') ||
    location.startsWith('/weather') ||
    location.startsWith('/port-analytics') ||
    location.startsWith('/co2-emissions') ||
    location.startsWith('/risk-scoring') ||
    location.startsWith('/dark-vessel-detection') ||
    location.startsWith('/sanctions-screening') ||
    location.startsWith('/cyber-threats') ||
    location.startsWith('/incidents') ||
    location.startsWith('/agent-insights') ||
    location.startsWith('/vessels-list') ||
    location.startsWith('/routes') ||
    location.startsWith('/command-workflows') ||
    location.startsWith('/document-engine') ||
    location.startsWith('/voyage-desk') ||
    location.startsWith('/what-changed') ||
    location.startsWith('/exception-queue') ||
    location.startsWith('/route-risk') ||
    location.startsWith('/approval-review') ||
    location.startsWith('/disruption-forecast') ||
    location.startsWith('/dark-fleet-economics') ||
    location.startsWith('/sanctions-heat') ||
    location.startsWith('/voyage-pnl') ||
    location.startsWith('/trade-flow-heatmap') ||
    location.startsWith('/intelligence-briefs') ||
    location.startsWith('/digital-twin') ||
    location.startsWith('/autonomous-routing') ||
    location.startsWith('/predictive-maintenance-ml') ||
    location.startsWith('/blockchain-bol') ||
    location.startsWith('/decarbonization') ||
    location.startsWith('/port-twin') ||
    location.startsWith('/piracy-sanctions') ||
    location.startsWith('/weather-routing') ||
    location.startsWith('/bunkering') ||
    location.startsWith('/charter-party') ||
    location.startsWith('/demurrage') ||
    location.startsWith('/freight-rates') ||
    location.startsWith('/sts-detection') ||
    location.startsWith('/crew-tracker') ||
    location.startsWith('/bunker-optimizer') ||
    location.startsWith('/psc-inspector') ||
    location.startsWith('/insurance-panel') ||
    location.startsWith('/atlas-runtime') ||
    location.startsWith('/replay') ||
    location.startsWith('/scenario-branches') ||
    location.startsWith('/satellite-rf-intelligence');

  if (isDashboard) {
    return (
      <PrivateAppGuard appName="Vessels" accentColor={VESSELS_BRAND_ACCENT}>
        <VesselsDashboard cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
      </PrivateAppGuard>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-[#060e1a]">
          <div className="w-6 h-6 border-2 border-sky-500/40 border-t-sky-400 rounded-full animate-spin" />
        </div>
      }
    >
      <Switch>
        <Route path="/pulse" component={VesselsPulse} />
        <Route path="/" component={MarketingHomePage} />
        {VESSELS_COMMERCIAL_ENABLED && (
          <Route path="/platform" component={MarketingPlatformPage} />
        )}
        <Route path="/capabilities" component={MarketingCapabilitiesPage} />
        <Route path="/use-cases" component={MarketingUseCasesPage} />
        <Route path="/security" component={MarketingSecurityPage} />
        <Route path="/pricing" component={MarketingPricingPage} />
        <Route path="/demo" component={MarketingDemoPage} />
        <Route path="/sign-in" component={SignInPage} />
        <Route path="/fleet-assessment" component={FleetAssessmentPage} />
        <Route path="/legal/privacy" component={LegalPrivacyPage} />
        <Route path="/legal/terms" component={LegalTermsPage} />
        <Route component={MarketingHomePage} />
      </Switch>
    </Suspense>
  );
}

function DemoPersonaModeBridgeWired() {
  const { setMode } = useDemoMode();
  return <DemoPersonaModeBridge setMode={setMode} />;
}

function App() {
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette(vesselsCommands);
  useSessionRevocationToast();

  return (
    <AppModeProvider>
      <AppModeBanner />
      <Toaster />
      <AnalyticsProvider appName="vessels">
        <PrismBusProvider domain="vessels">
          <SandboxModeProvider>
            <DemoModeProvider>
              <DemoPersonaProvider>
                <DemoPersonaModeBridgeWired />
                <QueryClientProvider client={queryClient}>
                  <StaleIndicator accentColor={VESSELS_BRAND_ACCENT} />
                  <AuthProvider>
                    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                      <AppContent cmdOpen={cmdOpen} setCmdOpen={setCmdOpen} />
                    </WouterRouter>
                  </AuthProvider>
                  <AgentCopilot config={helmsmanConfig} />
                  <McpOverlay domain="vessels" />
                </QueryClientProvider>
                <DemoPersonaSwitcher />
              </DemoPersonaProvider>
            </DemoModeProvider>
          </SandboxModeProvider>
        </PrismBusProvider>
        <CookieBanner privacyUrl="/legal/privacy" />
      </AnalyticsProvider>
    </AppModeProvider>
  );
}

export default App;
