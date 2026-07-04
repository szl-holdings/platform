import { PolicyModeBadge } from '@szl-holdings/design-system/proof/policy-mode-badge';
import {
  DashboardShell as SharedDashboardShell,
  SidebarNav,
  type SidebarNavSection,
} from '@szl-holdings/shared-ui/design-system';
import { SectionErrorBoundary } from '@szl-holdings/shared-ui/error-boundary';
import { LANE_ACCENT_HEX } from '@szl-holdings/shared-ui/lane-colors';
import {
  GettingStartedChecklist,
  type OnboardingConfig,
  OnboardingWizard,
  useOnboardingAnalytics,
  useOnboardingState,
} from '@szl-holdings/shared-ui/onboarding';
import { RealtimeStatusIndicator } from '@szl-holdings/shared-ui/realtime-status-indicator';
import { ServiceStatusRail } from '@szl-holdings/shared-ui/service-status-rail';
import { colors, } from '@szl-holdings/shared-ui/tokens';
import { useRealtimeChannel } from '@szl-holdings/shared-ui/use-realtime-channel';
import {
  useEffectiveAccent,
  useUserPreferences,
} from '@szl-holdings/shared-ui/use-user-preferences';
import { toAlpha } from '@szl-holdings/shared-ui/utils';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Box,
  Brain,
  Briefcase,
  Building2,
  Calculator,
  Camera,
  CheckSquare,
  ClipboardList,
  DollarSign,
  Eye,
  FileSearch,
  FileText,
  GitBranch,
  Globe,
  Hammer,
  HardHat,
  Landmark,
  Layers,
  LayoutDashboard,
  MapPin,
  Menu,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Radio,
  RefreshCw,
  Scale,
  Search,
  Shield,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

function pathToTerraActionType(path: string): string | undefined {
  const seg = path.replace(/^\/+/, '').split('/')[0];
  if (!seg || seg === 'dashboard') return undefined;
  return seg;
}

const TERRA_BRAND_ACCENT = LANE_ACCENT_HEX.terra.primary;
const SIDEBAR_BG = '#080b0d';
const HEADER_BG = toAlpha('#080b0d', 0.92);

const TERRA_ONBOARDING_CONFIG: OnboardingConfig = {
  appId: 'terra',
  appName: 'Terra',
  accentColor: TERRA_BRAND_ACCENT,
  steps: [
    {
      id: 'welcome',
      title: 'Welcome to Terra',
      description:
        'Terra is your real estate intelligence platform — distress detection, deal pipeline, market analytics, and ownership intelligence for institutional-grade property operations.',
      placement: 'center',
      icon: Building2,
    },
    {
      id: 'dashboard',
      title: 'Portfolio Overview',
      description:
        'The Overview dashboard gives you a real-time snapshot of your portfolio — active deals, distress signals, market conditions, and KPI performance across all assets.',
      targetSelector: "a[href='/dashboard']",
      placement: 'right',
      icon: LayoutDashboard,
    },
    {
      id: 'distress-engine',
      title: 'Distress Engine & Watchlists',
      description:
        'The Distress Engine continuously scores assets for financial stress indicators — loan maturity risk, NOI compression, cap rate expansion — so you can act before distress becomes default.',
      targetSelector: "a[href='/distress-engine']",
      placement: 'right',
      icon: Eye,
    },
    {
      id: 'pipeline',
      title: 'Deal Pipeline',
      description:
        'Track deals from initial sourcing through closing. Manage offers, approvals, and transaction milestones with full team collaboration and audit trails.',
      targetSelector: "a[href='/pipeline']",
      placement: 'right',
      icon: Activity,
    },
    {
      id: 'market',
      title: 'Market Intelligence',
      description:
        'Benchmark your assets against real-time market data — cap rates, rent trends, transaction comps, and supply/demand signals across every submarket you operate in.',
      targetSelector: "a[href='/market']",
      placement: 'right',
      icon: BarChart3,
    },
  ],
  checklist: [
    {
      id: 'view-overview',
      label: 'Review your portfolio overview',
      description: 'Check active deals and distress signals',
    },
    {
      id: 'check-distress',
      label: 'Check the Distress Engine',
      description: 'Review assets flagged for financial stress',
    },
    {
      id: 'explore-pipeline',
      label: 'Explore the deal pipeline',
      description: 'Track deals from sourcing to closing',
    },
    {
      id: 'view-market',
      label: 'Check market conditions',
      description: 'Review cap rates and rent trends',
    },
    {
      id: 'review-listings',
      label: 'Review your portfolio listings',
      description: 'Browse and filter your asset portfolio',
    },
  ],
};

const NAV_SECTIONS: SidebarNavSection[] = [
  {
    id: 'core',
    label: 'Core',
    items: [
      {
        id: 'dashboard',
        href: '/dashboard',
        label: 'Overview',
        icon: <LayoutDashboard className="w-full h-full" />,
      },
      {
        id: 'distress-engine',
        href: '/distress-engine',
        label: 'Watchlists',
        icon: <Eye className="w-full h-full" />,
      },
      {
        id: 'market',
        href: '/market',
        label: 'Market',
        icon: <BarChart3 className="w-full h-full" />,
      },
    ],
  },
  {
    id: 'sourcing',
    label: 'Deal Sourcing',
    items: [
      {
        id: 'sourcing-inbox',
        href: '/sourcing-inbox',
        label: 'AI Sourcing Inbox',
        icon: <Sparkles className="w-full h-full" />,
      },
      {
        id: 'climate-risk-enhanced',
        href: '/climate-risk-enhanced',
        label: 'Climate Risk',
        icon: <Shield className="w-full h-full" />,
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      {
        id: 'pipeline',
        href: '/pipeline',
        label: 'Pipeline',
        icon: <Activity className="w-full h-full" />,
      },
      {
        id: 'investor-mode',
        href: '/investor-mode',
        label: 'Ownership',
        icon: <Globe className="w-full h-full" />,
      },
      {
        id: 'evidence',
        href: '/evidence',
        label: 'Evidence',
        icon: <FileSearch className="w-full h-full" />,
      },
      {
        id: 'aef-search',
        href: '/aef-search',
        label: 'AEF Knowledge Search',
        icon: <Search className="w-full h-full" />,
      },
    ],
  },
  {
    id: 'atlas-runtime',
    label: 'ATLAS Spatial Runtime',
    items: [
      {
        id: 'atlas-execute',
        href: '/atlas-execute',
        label: 'Run Workflow',
        icon: <Zap className="w-full h-full" />,
      },
      {
        id: 'property-twin-view',
        href: '/property-twin-view',
        label: 'Property Twin',
        icon: <Layers className="w-full h-full" />,
      },
      {
        id: 'atlas-runtime',
        href: '/atlas-runtime',
        label: 'Spatial Assets',
        icon: <MapPin className="w-full h-full" />,
      },
      {
        id: 'property-replay',
        href: '/replay',
        label: 'Property Replay',
        icon: <RefreshCw className="w-full h-full" />,
      },
      {
        id: 'scenario-branches',
        href: '/scenario-branches',
        label: 'Scenario Branches',
        icon: <GitBranch className="w-full h-full" />,
      },
      {
        id: 'risk-simulation',
        href: '/risk-simulation',
        label: 'Risk Simulation',
        icon: <Calculator className="w-full h-full" />,
      },
      {
        id: 'constellation',
        href: '/constellation',
        label: 'Constellation',
        icon: <Network className="w-full h-full" />,
      },
    ],
  },
  {
    id: 'spatial',
    label: 'Spatial Intelligence',
    items: [
      {
        id: 'computer-vision',
        href: '/computer-vision',
        label: 'Computer Vision',
        icon: <Camera className="w-full h-full" />,
      },
      {
        id: 'avm-engine',
        href: '/avm-engine',
        label: 'AVM Engine',
        icon: <DollarSign className="w-full h-full" />,
      },
      {
        id: 'zoning-intelligence',
        href: '/zoning-intelligence',
        label: 'Zoning Intel',
        icon: <Scale className="w-full h-full" />,
      },
      {
        id: 'title-intelligence',
        href: '/title-intelligence',
        label: 'Title & Lien',
        icon: <Shield className="w-full h-full" />,
      },
      {
        id: 'construction-cost',
        href: '/construction-cost',
        label: 'Construction Cost',
        icon: <Hammer className="w-full h-full" />,
      },
      {
        id: 'spatial-walkthrough',
        href: '/spatial-walkthrough',
        label: 'Spatial Walkthrough',
        icon: <Box className="w-full h-full" />,
      },
    ],
  },
  {
    id: 'operating-suite',
    label: 'Operating Suite',
    items: [
      {
        id: 'lease-abstraction',
        href: '/lease-abstraction',
        label: 'Lease Abstraction',
        icon: <ClipboardList className="w-full h-full" />,
      },
      {
        id: 'rent-roll',
        href: '/rent-roll',
        label: 'Rent Roll',
        icon: <FileSearch className="w-full h-full" />,
      },
      {
        id: 'pro-forma',
        href: '/pro-forma',
        label: 'Pro Forma Builder',
        icon: <Calculator className="w-full h-full" />,
      },
      {
        id: 'exchange-1031',
        href: '/exchange-1031',
        label: '1031 Exchange',
        icon: <RefreshCw className="w-full h-full" />,
      },
      {
        id: 'tax-appeal',
        href: '/tax-appeal',
        label: 'Tax Appeal',
        icon: <TrendingDown className="w-full h-full" />,
      },
      {
        id: 'waterfall-calculator',
        href: '/waterfall-calculator',
        label: 'Waterfall Calc',
        icon: <Layers className="w-full h-full" />,
      },
      {
        id: 'construction-monitor',
        href: '/construction-monitor',
        label: 'Construction Monitor',
        icon: <HardHat className="w-full h-full" />,
      },
      {
        id: 'tenant-screening',
        href: '/tenant-screening',
        label: 'Tenant Screening',
        icon: <UserCheck className="w-full h-full" />,
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      {
        id: 'deals',
        href: '/deals',
        label: 'Deals',
        icon: <TrendingUp className="w-full h-full" />,
      },
      { id: 'leads', href: '/leads', label: 'Brokers', icon: <Users className="w-full h-full" /> },
      {
        id: 'listings',
        href: '/listings',
        label: 'Portfolio',
        icon: <Briefcase className="w-full h-full" />,
      },
      {
        id: 'property-desk',
        href: '/property-desk',
        label: 'Property Desk',
        icon: <Layers className="w-full h-full" />,
      },
      {
        id: 'what-changed',
        href: '/what-changed',
        label: 'What Changed',
        icon: <Radio className="w-full h-full" />,
      },
      {
        id: 'diligence-prep',
        href: '/diligence-prep',
        label: 'Diligence Prep',
        icon: <Search className="w-full h-full" />,
      },
      {
        id: 'readiness-board',
        href: '/readiness-board',
        label: 'Readiness Board',
        icon: <BarChart3 className="w-full h-full" />,
      },
      {
        id: 'approval-review',
        href: '/approval-review',
        label: 'Review & Approval',
        icon: <Shield className="w-full h-full" />,
      },
    ],
  },
  {
    id: 'cognitive-runtime',
    label: 'Cognitive Runtime',
    items: [
      {
        id: 'ownership-graph',
        href: '/ownership-graph',
        label: 'Ownership Graph',
        icon: <GitBranch className="w-full h-full" />,
      },
      {
        id: 'lender-exposure-map',
        href: '/lender-exposure-map',
        label: 'Lender Exposure Map',
        icon: <Landmark className="w-full h-full" />,
      },
      {
        id: 'covenant-monitoring',
        href: '/covenant-monitoring',
        label: 'Covenant Monitor',
        icon: <Shield className="w-full h-full" />,
      },
      {
        id: 'distress-forecast',
        href: '/distress-forecast',
        label: 'Distress Forecast',
        icon: <AlertTriangle className="w-full h-full" />,
      },
      {
        id: 'underwriting-copilot',
        href: '/underwriting-copilot',
        label: 'Underwriting Copilot',
        icon: <Brain className="w-full h-full" />,
      },
      {
        id: 'diligence-room',
        href: '/diligence-room',
        label: 'Diligence Room',
        icon: <Layers className="w-full h-full" />,
      },
      {
        id: 'governed-cockpit',
        href: '/governed-cockpit',
        label: 'Governed Intelligence',
        icon: <Shield className="w-full h-full" />,
      },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      {
        id: 'market-analytics',
        href: '/market-analytics',
        label: 'Market Analytics',
        icon: <TrendingUp className="w-full h-full" />,
      },
      {
        id: 'comparable-sales',
        href: '/comparable-sales',
        label: 'Comparable Sales',
        icon: <BarChart3 className="w-full h-full" />,
      },
      {
        id: 'portfolio-dashboard',
        href: '/portfolio-dashboard',
        label: 'Portfolio Dashboard',
        icon: <PieChart className="w-full h-full" />,
      },
      {
        id: 'distress-pipeline',
        href: '/distress-pipeline',
        label: 'Distress Pipeline',
        icon: <Activity className="w-full h-full" />,
      },
      {
        id: 'lender-report',
        href: '/lender-report',
        label: 'Lender & LP Report',
        icon: <BookOpen className="w-full h-full" />,
      },
      {
        id: 'transactions',
        href: '/transactions',
        label: 'Approvals',
        icon: <CheckSquare className="w-full h-full" />,
      },
      {
        id: 'broker-overview',
        href: '/broker-overview',
        label: 'Admin',
        icon: <FileText className="w-full h-full" />,
      },
    ],
  },
];

const API = '/api';

export function TerraLayout({ children }: { children: ReactNode }) {
  const { trackTourCompleted, trackTourSkipped } = useOnboardingAnalytics({
    platform: 'terra',
    tourId: 'terra-tour',
  });
  const [location, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { prefs, setPreference, isLoaded } = useUserPreferences();
  // User-personalized accent for non-brand chrome (sidebar nav active state,
  // focus rings, top-bar live dot, skip link). Falls back to TERRA_BRAND_ACCENT
  // when the user has no preference set.
  const accent = useEffectiveAccent(TERRA_BRAND_ACCENT);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => prefs.sidebar_collapsed);
  const userOverriddenSidebarRef = useRef(false);
  const { status: wsStatus } = useRealtimeChannel('terra-signals');
  const { replay: replayOnboarding } = useOnboardingState('terra');
  const terraActionType = pathToTerraActionType(location);

  useEffect(() => {
    if (isLoaded && !userOverriddenSidebarRef.current) {
      setSidebarCollapsed(prefs.sidebar_collapsed);
    }
  }, [isLoaded, prefs.sidebar_collapsed]);

  const toggleCollapsed = useCallback(() => {
    userOverriddenSidebarRef.current = true;
    setSidebarCollapsed((prev) => {
      const next = !prev;
      setPreference('sidebar_collapsed', next);
      return next;
    });
  }, [setPreference]);

  const { data: apiHealth, isError: apiDown } = useQuery({
    queryKey: ['terra-api-health'],
    queryFn: () =>
      fetch(`${API}/terra/pipeline/deals?limit=1`)
        .then((r) => r.json())
        .then((d) => d.data ?? d),
    staleTime: 60000,
    retry: 1,
  });
  const sidebarDataMode = !apiDown && apiHealth?.dataMode === 'live' ? 'Live' : 'Demo';
  const sidebarModeColor = sidebarDataMode === 'Live' ? accent : colors.semantic.warning;

  const sidebarHeader = (
    <div className="h-14 flex items-center px-2">
      <div className="flex items-center gap-2.5">
        <div
          className="p-1.5 rounded-lg"
          style={{
            background: toAlpha(TERRA_BRAND_ACCENT, 0.12),
            border: `1px solid ${toAlpha(TERRA_BRAND_ACCENT, 0.22)}`,
          }}
        >
          <Building2 className="w-4 h-4" style={{ color: TERRA_BRAND_ACCENT }} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-tight text-white leading-none">Terra</span>
          <span
            className="text-[9px] uppercase tracking-widest leading-none mt-0.5"
            style={{ color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}
          >
            Property Intelligence
          </span>
        </div>
      </div>
    </div>
  );

  const sidebarFooter = (
    <div className="space-y-2">
      {TERRA_ONBOARDING_CONFIG.checklist && (
        <GettingStartedChecklist
          appId={TERRA_ONBOARDING_CONFIG.appId}
          appName={TERRA_ONBOARDING_CONFIG.appName}
          items={TERRA_ONBOARDING_CONFIG.checklist}
          accentColor={TERRA_BRAND_ACCENT}
          onReplayTour={replayOnboarding}
          collapsed
        />
      )}
      <div
        className="rounded-lg p-2.5 space-y-1.5"
        style={{
          background: toAlpha(TERRA_BRAND_ACCENT, 0.04),
          border: `1px solid ${toAlpha(TERRA_BRAND_ACCENT, 0.08)}`,
        }}
      >
        <div
          className="text-[9px] uppercase tracking-widest font-semibold"
          style={{ color: '#5aa588' }}
        >
          System State
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Data mode
          </span>
          <span className="text-[9px] font-mono font-semibold" style={{ color: sidebarModeColor }}>
            {sidebarDataMode}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Distress signals
          </span>
          <span
            className="text-[9px] font-mono font-semibold"
            style={{ color: colors.semantic.warning }}
          >
            3 flagged
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
        <Building2 className="w-3 h-3" />
        <span className="text-[9px]">SZL Holdings · Real Estate</span>
      </div>
    </div>
  );

  const terraTopbar = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: colors.text.muted }}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={sidebarOpen}
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
        <span
          className="w-1.5 h-1.5 rounded-full hidden sm:block"
          style={{ background: toAlpha(accent, 0.7) }}
          aria-hidden="true"
        />
        <span
          className="hidden sm:block font-mono text-[10px]"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          Terra · Property Intelligence
        </span>
      </div>
      <div className="flex items-center gap-3">
        <PolicyModeBadge product="terra" actionType={terraActionType} />
        <RealtimeStatusIndicator status={wsStatus} compact />
        <button
          className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: colors.text.muted }}
          aria-label="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: colors.semantic.warning }}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );

  const collapseButton = (
    <button
      onClick={toggleCollapsed}
      className="flex items-center justify-center p-1.5 rounded-lg transition-colors hover:bg-white/5"
      style={{ color: toAlpha(TERRA_BRAND_ACCENT, 0.5) }}
      aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      {sidebarCollapsed ? (
        <PanelLeftOpen className="w-4 h-4" />
      ) : (
        <PanelLeftClose className="w-4 h-4" />
      )}
    </button>
  );

  const terraSidebar = (
    <SidebarNav
      sections={NAV_SECTIONS}
      currentPath={location}
      accentColor={accent}
      collapsed={sidebarCollapsed}
      header={sidebarCollapsed ? collapseButton : sidebarHeader}
      footer={
        sidebarCollapsed ? undefined : (
          <div className="space-y-2">
            {collapseButton}
            {sidebarFooter}
          </div>
        )
      }
      onNavigate={(item) => {
        if (item.href) navigate(item.href);
        setSidebarOpen(false);
      }}
    />
  );

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
        style={{ background: accent, color: '#fff' }}
      >
        Skip to main content
      </a>
      <SharedDashboardShell
        sidebar={terraSidebar}
        topbar={terraTopbar}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        sidebarWidth={sidebarCollapsed ? '3.5rem' : '14rem'}
        theme={{ sidebarBg: SIDEBAR_BG, pageBg: colors.background.primary, headerBg: HEADER_BG }}
        accentColor={accent}
      >
        <main
          id="main-content"
          data-szl-shell-main
          className="flex-1 overflow-auto p-4 md:p-5"
          tabIndex={-1}
        >
          <SectionErrorBoundary sectionName="Terra">{children}</SectionErrorBoundary>
        </main>
      </SharedDashboardShell>
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <ServiceStatusRail />
      </div>
      <OnboardingWizard
        config={TERRA_ONBOARDING_CONFIG}
        onComplete={trackTourCompleted}
        onSkip={trackTourSkipped}
      />
    </>
  );
}
