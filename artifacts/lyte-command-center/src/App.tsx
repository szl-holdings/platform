import { AppModeBanner, AppModeProvider } from '@szl-holdings/shared-ui/app-mode-banner';
import {
  type CommandItem,
  CommandPalette,
  createBaselineWebActions,
  getEcosystemSwitchCommands,
  useCommandPalette,
} from '@szl-holdings/shared-ui/command-palette';
import {
  type SentientAction,
  type SentientCrossLink,
  SentientLayer,
  type SentientUpdate,
  useSentientLayer,
} from '@szl-holdings/shared-ui/sentient-layer';
import { useUserPreferences } from '@szl-holdings/shared-ui/use-user-preferences';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  Brain,
  ChevronDown,
  ChevronRight,
  Compass,
  FlaskConical,
  GitBranch,
  Layers,
  LayoutDashboard,
  Library,
  Lock,
  Menu,
  Network,
  Radio,
  Search,
  Shield,
  Terminal,
  Thermometer,
  TrendingUp,
  Users,
  Workflow,
  Zap,
  Waves,
} from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

// New 9 flagship surfaces + Decision Twin
const OverviewPage = lazy(() => import('@/pages/overview'));
const OnboardingPage = lazy(() => import('@/pages/onboarding'));
const SignalsConsolePage = lazy(() => import('@/pages/signals-console'));
const DecisionTwinPage = lazy(() => import('@/pages/decision-twin'));
const EntityGraphPage = lazy(() => import('@/pages/entity-graph'));
const DecisionCenterPage = lazy(() => import('@/pages/decision-center'));
const WorkflowHealthPage = lazy(() => import('@/pages/workflow-health'));
const RunConsolePage = lazy(() => import('@/pages/run-console'));
const EvidenceExplorerPage = lazy(() => import('@/pages/evidence-explorer'));
const PolicyCenterPage = lazy(() => import('@/pages/policy-center'));
const EvalStudioPage = lazy(() => import('@/pages/eval-studio'));

const BriefPage = lazy(() => import('@/pages/brief'));
const LyteBillingPage = lazy(() => import('@/pages/billing-account'));
const BriefingPage = lazy(() => import('@/pages/briefing'));

// Legacy surfaces (kept for historical nav)
const OwnershipDriftPage = lazy(() => import('@/pages/ownership-drift'));
const PressureMapPage = lazy(() => import('@/pages/pressure-map'));
const ActionDebtPage = lazy(() => import('@/pages/action-debt'));
const DecisionReplayPage = lazy(() => import('@/pages/decision-replay'));
const BoardViewPage = lazy(() => import('@/pages/board-view'));
const AefKnowledgeSearchPage = lazy(() => import('@/pages/aef-knowledge-search'));
const ForecastPage = lazy(() => import('@/pages/forecast'));
const ScenarioComposerPage = lazy(() => import('@/pages/scenario-composer'));
const CausalIntelligencePage = lazy(() => import('@/pages/causal-intelligence'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const BASE = import.meta.env.BASE_URL ?? '/lyte/';

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="w-5 h-5 border-2 border-amber-500/40 border-t-[#c9b787] rounded-full animate-spin" />
    </div>
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: 'red' | 'amber' | 'default';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Command',
    items: [
      {
        label: 'Get Started',
        href: '/onboarding',
        icon: <Compass className="w-3.5 h-3.5" />,
        badge: 'NEW',
        badgeColor: 'amber',
      },
      {
        label: 'Overview',
        href: '/overview',
        icon: <LayoutDashboard className="w-3.5 h-3.5" />,
        badge: '6 critical',
        badgeColor: 'red',
      },
      {
        label: 'Signals Console',
        href: '/signals',
        icon: <Radio className="w-3.5 h-3.5" />,
        badge: '47',
        badgeColor: 'red',
      },
      { label: 'Entity Graph', href: '/entities', icon: <Network className="w-3.5 h-3.5" /> },
      {
        label: 'Decision Center',
        href: '/decisions',
        icon: <Brain className="w-3.5 h-3.5" />,
        badge: '3 rec',
        badgeColor: 'amber',
      },
      {
        label: 'Decision Twin',
        href: '/decision-twin',
        icon: <GitBranch className="w-3.5 h-3.5" />,
        badge: 'NEW',
        badgeColor: 'amber',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Workflow Health',
        href: '/workflow-health',
        icon: <Workflow className="w-3.5 h-3.5" />,
        badge: '62%',
        badgeColor: 'amber',
      },
      { label: 'Run Console', href: '/runs', icon: <Terminal className="w-3.5 h-3.5" /> },
      { label: 'Evidence Explorer', href: '/evidence', icon: <Library className="w-3.5 h-3.5" /> },
      {
        label: 'AEF Knowledge Search',
        href: '/aef-search',
        icon: <Search className="w-3.5 h-3.5" />,
      },
    ],
  },
  {
    label: 'Governance',
    items: [
      { label: 'Policy Center', href: '/policies', icon: <Lock className="w-3.5 h-3.5" /> },
      { label: 'Eval Studio', href: '/eval', icon: <FlaskConical className="w-3.5 h-3.5" /> },
      { label: 'Forecast Fabric', href: '/forecast', icon: <TrendingUp className="w-3.5 h-3.5" /> },
      {
        label: 'Causal Intelligence',
        href: '/causal',
        icon: <Brain className="w-3.5 h-3.5" />,
        badge: 'NEW',
        badgeColor: 'amber' as const,
      },
      {
        label: 'Scenario Composer',
        href: '/scenarios',
        icon: <Waves className="w-3.5 h-3.5" />,
      },
    ],
  },
  {
    label: 'Legacy',
    items: [
      { label: 'Board View', href: '/board', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
      {
        label: 'Ownership Drift',
        href: '/ownership-drift',
        icon: <GitBranch className="w-3.5 h-3.5" />,
      },
      {
        label: 'Pressure Map',
        href: '/pressure-map',
        icon: <Thermometer className="w-3.5 h-3.5" />,
      },
      { label: 'Action Debt', href: '/action-debt', icon: <Layers className="w-3.5 h-3.5" /> },
      {
        label: 'Decision Replay',
        href: '/decision-replay',
        icon: <Activity className="w-3.5 h-3.5" />,
      },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function Sidebar({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const [location] = useLocation();

  const BADGE_COLOR_MAP = {
    red: 'text-red-400 bg-red-500/8 border-red-500/20',
    amber: 'text-[#c9b787] bg-white/[0.03] border-white/[0.08]',
    default: 'text-[#5e5e5e] bg-white/[0.03] border-white/[0.06]',
  };

  return (
    <aside
      className="flex flex-col h-full border-r border-white/[0.06] bg-[#0a0a0a] transition-all duration-300"
      style={{ width: expanded ? 220 : 56 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 h-14 border-b border-white/[0.06] shrink-0">
        <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-[#c9b787]" />
        </div>
        {expanded && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#f5f5f5] font-display tracking-tight">
              Lyte
            </p>
            <p className="text-[10px] text-[#8a8a8a] font-mono">Decision Intelligence</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto p-1 rounded hover:bg-white/[0.03] text-[#5e5e5e] hover:text-[#c9b787] transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          {expanded ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 rotate-90" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {expanded && (
              <p className="text-[9px] font-mono text-[#5e5e5e] uppercase tracking-widest px-2 py-1.5">
                {group.label}
              </p>
            )}
            {!expanded && <div className="h-1" />}
            {group.items.map((item) => {
              const active = location === item.href || location.startsWith(`${item.href}/`);
              const badgeClass = BADGE_COLOR_MAP[item.badgeColor ?? 'default'];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-xs transition-all group relative ${
                    active
                      ? 'bg-white/[0.04] text-[#c9b787] border border-white/[0.08]'
                      : 'text-[#8a8a8a] hover:text-[#e0e0e0] hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <span
                    className={
                      active ? 'text-[#c9b787]' : 'text-[#5e5e5e] group-hover:text-[#c9b787]'
                    }
                  >
                    {item.icon}
                  </span>
                  {expanded && (
                    <>
                      <span className="flex-1 truncate font-medium">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${badgeClass}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {!expanded && item.badge && item.badgeColor === 'red' && (
                    <span className="absolute right-0.5 top-0.5 w-1.5 h-1.5 rounded-full bg-red-400" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {expanded && (
        <div className="px-3 py-3 border-t border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <Users className="w-3 h-3 text-[#c9b787]" />
            </div>
            <div>
              <p className="text-[10px] text-[#8a8a8a]">Demo Mode</p>
              <p className="text-[9px] text-[#5e5e5e] font-mono">LYTE-SEED-v2</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

const LYTE_ACCENT = '#c9b787';

const SENTIENT_UPDATES: SentientUpdate[] = [
  {
    id: 'lu1',
    headline: 'Vantex approval chain still void at step 1 — 47 days stalled',
    surface: 'Lyte',
    entityLabel: 'Vantex Acquisition',
    severity: 'critical',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    href: '/decisions',
  },
  {
    id: 'lu2',
    headline: '$4.2M Q2 revenue at risk — close probability collapsed 84% → 31%',
    surface: 'Lyte',
    entityLabel: 'Vantex Acquisition',
    severity: 'critical',
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    href: '/overview',
  },
  {
    id: 'lu3',
    headline: '3 escalation attempts blocked by policy — manual override required',
    surface: 'Lyte',
    entityLabel: 'Procurement Approval Chain',
    severity: 'warning',
    timestamp: new Date(Date.now() - 47 * 60000).toISOString(),
    href: '/policies',
  },
  {
    id: 'lu4',
    headline: 'Stratford Partners shows identical pattern — $1.8M secondary risk',
    surface: 'Lyte',
    entityLabel: 'Stratford Expansion',
    severity: 'warning',
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    href: '/signals',
  },
  {
    id: 'lu5',
    headline: 'Buyer engagement decay — David Chen silent for 28 days',
    surface: 'Lyte',
    entityLabel: 'Vantex Acquisition',
    severity: 'info',
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
    href: '/signals',
  },
];

const SENTIENT_ACTIONS: SentientAction[] = [
  {
    id: 'la1',
    label: 'Invoke CFO override — reassign Vantex chain to Sarah Kim',
    description:
      'Voids the stalled approval chain, transfers ownership to VP BD, and restarts the deal. Reversible. Estimated ARR recovery: $4.2M.',
    confidence: 0.92,
    policyVerdict: 'requires_approval',
    href: '/decisions',
  },
  {
    id: 'la2',
    label: 'Trigger portfolio-wide approval-gap audit',
    description:
      'Lyte detected 3/14 portfolio companies showing similar void-owner patterns. Audit prevents an estimated $7.2M further crystallization in Q2.',
    confidence: 0.84,
    policyVerdict: 'requires_approval',
    href: '/decisions',
  },
  {
    id: 'la3',
    label: 'Re-engage David Chen via warm reactivation sequence',
    description:
      'Buyer last replied 28 days ago. Auto-drafted reactivation message ready for review. Low blast radius.',
    confidence: 0.79,
    policyVerdict: 'allowed',
    href: '/runs',
  },
];

const SENTIENT_CROSS_LINKS: SentientCrossLink[] = [
  {
    id: 'lcl1',
    surface: 'Counsel',
    surfaceAccent: '#8b5cf6',
    label: 'Vantex legal review package — blocked 30 days',
    description:
      'Counsel cannot advance the Vantex legal package until procurement clearance is restored.',
    href: '/counsel/dashboard',
    preservedContext: { surface: 'lyte', entity: 'lyte-del-legal-001' },
  },
  {
    id: 'lcl2',
    surface: 'Vessels',
    surfaceAccent: '#c9b787',
    label: 'MV Atlantic Falcon voyage tied to Vantex acquisition',
    description:
      'Vessels has an active voyage whose financing is contingent on the Vantex deal closing in Q2.',
    href: '/vessels/fleet',
    preservedContext: { surface: 'lyte', entity: 'lyte-opp-vantex-001' },
  },
  {
    id: 'lcl3',
    surface: 'Aegis',
    surfaceAccent: '#ef4444',
    label: 'Vantex endpoints flagged in CVE-2024-21412 sweep',
    description:
      'Aegis has 3 Vantex-linked assets in active threat scope — coordinate before re-engaging buyer.',
    href: '/tenax/threats',
    preservedContext: { surface: 'lyte', entity: 'lyte-opp-vantex-001' },
  },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const { prefs, setPreference, isLoaded } = useUserPreferences();
  const [sidebarExpanded, setSidebarExpanded] = useState(() => !prefs.sidebar_collapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, navigate] = useLocation();
  const userOverriddenSidebarRef = useRef(false);
  const { open: sentientOpen, show: sentientShow, hide: sentientHide } = useSentientLayer();

  const paletteCommands: CommandItem[] = [
    ...createBaselineWebActions(navigate),
    ...getEcosystemSwitchCommands('lyte'),
    ...ALL_NAV_ITEMS.map((item) => ({
      id: `nav-${item.href}`,
      label: item.label,
      group: 'Navigate',
      action: () => navigate(item.href),
    })),
  ];
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette(paletteCommands);

  useEffect(() => {
    if (isLoaded && !userOverriddenSidebarRef.current) {
      setSidebarExpanded(!prefs.sidebar_collapsed);
    }
  }, [isLoaded, prefs.sidebar_collapsed]);

  const toggleSidebar = useCallback(() => {
    userOverriddenSidebarRef.current = true;
    setSidebarExpanded((prev) => {
      const next = !prev;
      setPreference('sidebar_collapsed', !next);
      return next;
    });
  }, [setPreference]);

  const currentPage = ALL_NAV_ITEMS.find(
    (n) => location === n.href || location.startsWith(`${n.href}/`),
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar expanded={sidebarExpanded} onToggle={toggleSidebar} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex flex-col w-56">
            <Sidebar expanded onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-white/[0.06] flex items-center gap-3 px-4 shrink-0">
          <button
            className="md:hidden p-1.5 rounded text-[#8a8a8a] hover:text-[#c9b787] hover:bg-white/[0.03] transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-xs text-[#8a8a8a] font-mono">
            <span>Lyte</span>
            {currentPage && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-[#c9b787]">{currentPage.label}</span>
              </>
            )}
            {!currentPage && location === '/' && (
              <span className="text-[#c9b787]">Platform</span>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="proof-badge">
              <Shield className="w-2.5 h-2.5" />
              Lyte-PROOF
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-white/[0.06] bg-white/[0.03]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9b787] animate-pulse" />
              <span className="text-[10px] text-[#8a8a8a] font-mono">LIVE</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main
          className={`flex-1 overflow-y-auto ${location === '/entities' ? 'overflow-hidden flex flex-col' : ''}`}
        >
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </main>
      </div>

      <SentientLayer
        open={sentientOpen}
        onClose={sentientHide}
        onOpen={sentientShow}
        surfaceId="lyte"
        surfaceName="Lyte Decision Intelligence"
        accentColor={LYTE_ACCENT}
        entityType="Opportunity"
        entityLabel="Vantex Acquisition — Q2 Close"
        timeRange="Last 6h"
        updates={SENTIENT_UPDATES}
        actions={SENTIENT_ACTIONS}
        crossLinks={SENTIENT_CROSS_LINKS}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={paletteCommands}
        appName="Lyte"
        accentColor={LYTE_ACCENT}
        placeholder="Search Lyte — pages, decisions, actions..."
      />
    </div>
  );
}

function DashboardRoutes() {
  return (
    <AppShell>
      <Switch>
        {/* Onboarding wizard (FLOW-001) */}
        <Route path="/onboarding" component={OnboardingPage} />
        {/* 9 flagship surfaces */}
        <Route path="/overview" component={OverviewPage} />
        <Route path="/signals" component={SignalsConsolePage} />
        <Route path="/entities" component={EntityGraphPage} />
        <Route path="/decisions" component={DecisionCenterPage} />
        <Route path="/decision-twin" component={DecisionTwinPage} />
        <Route path="/workflow-health" component={WorkflowHealthPage} />
        <Route path="/runs" component={RunConsolePage} />
        <Route path="/evidence" component={EvidenceExplorerPage} />
        <Route path="/policies" component={PolicyCenterPage} />
        <Route path="/eval" component={EvalStudioPage} />
        <Route path="/brief" component={BriefPage} />
        <Route path="/account/billing" component={LyteBillingPage} />
        {/* Legacy surfaces */}
        <Route path="/board" component={BoardViewPage} />
        <Route path="/ownership-drift" component={OwnershipDriftPage} />
        <Route path="/pressure-map" component={PressureMapPage} />
        <Route path="/action-debt" component={ActionDebtPage} />
        <Route path="/decision-replay" component={DecisionReplayPage} />
        <Route path="/decision-replay/:id" component={DecisionReplayPage} />
        <Route path="/aef-search" component={AefKnowledgeSearchPage} />
        <Route path="/forecast" component={ForecastPage} />
        <Route path="/causal" component={CausalIntelligencePage} />
        <Route path="/scenarios" component={ScenarioComposerPage} />
        {/* Default: redirect to overview */}
        <Route component={OverviewPage} />
      </Switch>
    </AppShell>
  );
}

export default function App() {
  const base = BASE.replace(/\/$/, '');
  return (
    <AppModeProvider>
      <AppModeBanner />
      <QueryClientProvider client={queryClient}>
        <WouterRouter base={base}>
          <Switch>
            <Route path="/briefing/:id">
              <Suspense fallback={<PageLoader />}>
                <BriefingPage />
              </Suspense>
            </Route>
            <Route path="/*" component={DashboardRoutes} />
          </Switch>
        </WouterRouter>
      </QueryClientProvider>
    </AppModeProvider>
  );
}
