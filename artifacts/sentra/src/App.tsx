import { AnalyticsProvider } from '@szl-holdings/shared-ui/analytics-provider';
import { AppModeBanner, AppModeProvider } from '@szl-holdings/shared-ui/app-mode-banner';
import {
  type CommandItem,
  CommandPalette,
  createBaselineWebActions,
  getEcosystemSwitchCommands,
  useCommandPalette,
} from '@szl-holdings/shared-ui/command-palette';
import {
  DashboardShell as SharedDashboardShell,
  SidebarNav,
  type SidebarNavSection,
} from '@szl-holdings/shared-ui/design-system';
import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import {
  type SentientAction,
  type SentientCrossLink,
  SentientLayer,
  type SentientUpdate,
  useSentientLayer,
} from '@szl-holdings/shared-ui/sentient-layer';
import { Toaster } from '@szl-holdings/shared-ui/ui/sonner';
import { useSessionRevocationToast } from '@szl-holdings/shared-ui/use-session-revocation-toast';
import {
  useEffectiveAccent,
  useUserPreferences,
} from '@szl-holdings/shared-ui/use-user-preferences';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BookLock,
  Cpu,
  Eye,
  GitBranch,
  LayoutDashboard,
  Lock,
  Menu,
  Network,
  Plug,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const DashboardPage = lazy(() => import('@/pages/dashboard'));
const ResilienceScorecardPage = lazy(() => import('@/pages/resilience-scorecard'));
const ThreatOverviewPage = lazy(() => import('@/pages/threat-overview'));
const AssetRiskGraphPage = lazy(() => import('@/pages/asset-risk-graph'));
const RecoveryReadinessPage = lazy(() => import('@/pages/recovery-readiness'));
const IncidentCommanderPage = lazy(() => import('@/pages/incident-commander'));
const ExposureBoardPage = lazy(() => import('@/pages/exposure-board'));
const ControlDriftPage = lazy(() => import('@/pages/control-drift'));
const DecisionCenterPage = lazy(() => import('@/pages/decision-center'));
const TrustProvenancePage = lazy(() => import('@/pages/trust-provenance'));
const AlertsPage = lazy(() => import('@/pages/alerts'));
const ApprovalsPage = lazy(() => import('@/pages/approvals'));
const SentraLandingPage = lazy(() => import('@/pages/sentra-landing'));
const SentraPricingPage = lazy(() => import('@/pages/pricing'));
const SentraBillingPage = lazy(() => import('@/pages/billing-account'));
const MeshMapPage = lazy(() => import('@/pages/mesh-map'));
const MeshExposuresPage = lazy(() => import('@/pages/mesh-exposures'));
const ContainmentRulesPage = lazy(() => import('@/pages/containment-rules'));
const MeshDriftPage = lazy(() => import('@/pages/mesh-drift'));
const MeshConnectorsPage = lazy(() => import('@/pages/mesh-connectors'));
const CrisisArenaLeaderboardPage = lazy(() => import('@/pages/crisis-arena-leaderboard'));
const CrisisArenaEngagementsPage = lazy(() => import('@/pages/crisis-arena-engagements'));
const CrisisArenaArchitectPage = lazy(() => import('@/pages/crisis-arena-architect'));
const CrisisArenaArchitectProfilePage = lazy(() => import('@/pages/crisis-arena-architect-profile'));
const ForecastPage = lazy(() => import('@/pages/forecast'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

const SENTRA_BRAND_ACCENT = '#ef4444';

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-red-500/40 border-t-red-400 rounded-full animate-spin" />
    </div>
  );
}

function SentraSidebarContent({
  expanded,
  onMobileClose,
  onToggleCollapse,
}: {
  expanded: boolean;
  onMobileClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  const [location, navigate] = useLocation();
  const accent = useEffectiveAccent(SENTRA_BRAND_ACCENT);

  const sections: SidebarNavSection[] = [
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
      items: [
        {
          id: '/dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          icon: <LayoutDashboard className="w-3.5 h-3.5" />,
        },
        {
          id: '/threats',
          label: 'Threat Overview',
          href: '/threats',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
        },
        {
          id: '/assets',
          label: 'Asset Risk Graph',
          href: '/assets',
          icon: <Cpu className="w-3.5 h-3.5" />,
        },
        {
          id: '/recovery',
          label: 'Recovery Readiness',
          href: '/recovery',
          icon: <RotateCcw className="w-3.5 h-3.5" />,
        },
        {
          id: '/incident',
          label: 'Incident Commander',
          href: '/incident',
          icon: <Activity className="w-3.5 h-3.5" />,
        },
        {
          id: '/exposure',
          label: 'Exposure Board',
          href: '/exposure',
          icon: <BarChart3 className="w-3.5 h-3.5" />,
        },
        {
          id: '/controls',
          label: 'Control Drift',
          href: '/controls',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'agent-mesh',
      label: 'Agent Mesh',
      items: [
        {
          id: '/mesh/map',
          label: 'Mesh Map',
          href: '/mesh/map',
          icon: <Network className="w-3.5 h-3.5" />,
        },
        {
          id: '/mesh/exposures',
          label: 'Exposures',
          href: '/mesh/exposures',
          icon: <Eye className="w-3.5 h-3.5" />,
        },
        {
          id: '/mesh/containment',
          label: 'Containment Rules',
          href: '/mesh/containment',
          icon: <BookLock className="w-3.5 h-3.5" />,
        },
        {
          id: '/mesh/drift',
          label: 'Mesh Drift',
          href: '/mesh/drift',
          icon: <GitBranch className="w-3.5 h-3.5" />,
        },
        {
          id: '/mesh/connectors',
          label: 'Connectors',
          href: '/mesh/connectors',
          icon: <Plug className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        {
          id: '/alerts',
          label: 'Alerts',
          href: '/alerts',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        },
        {
          id: '/approvals',
          label: 'Approvals',
          href: '/approvals',
          icon: <Shield className="w-3.5 h-3.5" />,
        },
        {
          id: '/trust',
          label: 'Trust & Provenance',
          href: '/trust',
          icon: <Lock className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'crisis-arena',
      label: 'Adversarial Simulation',
      items: [
        {
          id: '/crisis-arena/leaderboard',
          label: 'Analyst Rankings',
          href: '/crisis-arena/leaderboard',
          icon: <Users className="w-3.5 h-3.5" />,
        },
        {
          id: '/crisis-arena/engagements',
          label: 'Engagements',
          href: '/crisis-arena/engagements',
          icon: <Activity className="w-3.5 h-3.5" />,
        },
        {
          id: '/crisis-arena/architect',
          label: 'Analyst Workspace',
          href: '/crisis-arena/architect',
          icon: <Zap className="w-3.5 h-3.5" />,
        },
      ],
    },
  ];

  return (
    <SidebarNav
      sections={sections}
      currentPath={location}
      accentColor={accent}
      collapsed={!expanded}
      onNavigate={(item) => {
        if (item.href) navigate(item.href);
        onMobileClose?.();
      }}
      header={
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}
          >
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-red-50 truncate tracking-tight">TENAX</h1>
              <p className="text-[10px] truncate font-mono uppercase tracking-wider text-red-400/40">
                Cyber Resilience
              </p>
            </div>
          )}
        </div>
      }
      footer={
        expanded ? (
          <div className="space-y-2">
            <div
              className="rounded-lg px-3 py-3"
              style={{
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.08)',
              }}
            >
              <div className="text-[9px] uppercase tracking-widest font-medium mb-2 text-red-400/50">
                Posture Status
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Recovery posture</span>
                  <span className="text-[9px] font-mono text-red-400">42% critical</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Active incidents</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-red-400">1 open</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Control drift</span>
                  <span className="text-[9px] font-mono text-amber-400">3 gaps</span>
                </div>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-full py-1 text-[10px] rounded transition-colors hover:bg-white/5 text-red-400/40"
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
            className="flex items-center justify-center w-7 h-7 mx-auto rounded transition-colors hover:bg-white/5 text-red-400/40"
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
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/resilience" component={ResilienceScorecardPage} />
        <Route path="/threats" component={ThreatOverviewPage} />
        <Route path="/assets" component={AssetRiskGraphPage} />
        <Route path="/recovery" component={RecoveryReadinessPage} />
        <Route path="/incident" component={IncidentCommanderPage} />
        <Route path="/exposure" component={ExposureBoardPage} />
        <Route path="/controls" component={ControlDriftPage} />
        <Route path="/decision-center" component={DecisionCenterPage} />
        <Route path="/trust" component={TrustProvenancePage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/approvals" component={ApprovalsPage} />
        <Route path="/mesh/map" component={MeshMapPage} />
        <Route path="/mesh/exposures" component={MeshExposuresPage} />
        <Route path="/mesh/containment" component={ContainmentRulesPage} />
        <Route path="/mesh/drift" component={MeshDriftPage} />
        <Route path="/mesh/connectors" component={MeshConnectorsPage} />
        <Route path="/crisis-arena/leaderboard" component={CrisisArenaLeaderboardPage} />
        <Route path="/crisis-arena/engagements" component={CrisisArenaEngagementsPage} />
        <Route path="/crisis-arena/architect/:id" component={CrisisArenaArchitectProfilePage} />
        <Route path="/crisis-arena/architect" component={CrisisArenaArchitectPage} />
        <Route path="/forecast" component={ForecastPage} />
        <Route path="/pricing" component={SentraPricingPage} />
        <Route path="/account/billing" component={SentraBillingPage} />
        <Route path="/" component={SentraLandingPage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-red-400/40">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

function AppShell({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  onToggleCollapse,
  sidebarHovered,
  setSidebarHovered,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  sidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  sidebarHovered: boolean;
  setSidebarHovered: (v: boolean) => void;
}) {
  const [location, navigate] = useLocation();
  const accent = useEffectiveAccent(SENTRA_BRAND_ACCENT);
  const sidebarExpanded = !sidebarCollapsed || sidebarHovered;

  const paletteCommands: CommandItem[] = [
    ...createBaselineWebActions(navigate),
    ...getEcosystemSwitchCommands('sentra'),
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      group: 'Navigate',
      action: () => navigate('/dashboard'),
    },
    {
      id: 'nav-threats',
      label: 'Threat Overview',
      group: 'Navigate',
      action: () => navigate('/threats'),
    },
    {
      id: 'nav-assets',
      label: 'Asset Risk Graph',
      group: 'Navigate',
      action: () => navigate('/assets'),
    },
    {
      id: 'nav-recovery',
      label: 'Recovery Readiness',
      group: 'Navigate',
      action: () => navigate('/recovery'),
    },
    {
      id: 'nav-incident',
      label: 'Incident Commander',
      group: 'Navigate',
      action: () => navigate('/incident'),
    },
    {
      id: 'nav-exposure',
      label: 'Exposure Board',
      group: 'Navigate',
      action: () => navigate('/exposure'),
    },
    {
      id: 'nav-controls',
      label: 'Control Drift',
      group: 'Navigate',
      action: () => navigate('/controls'),
    },
    {
      id: 'nav-decisions',
      label: 'Decision Center',
      group: 'Navigate',
      action: () => navigate('/decision-center'),
    },
    {
      id: 'nav-trust',
      label: 'Trust & Provenance',
      group: 'Navigate',
      action: () => navigate('/trust'),
    },
    { id: 'nav-alerts', label: 'Alerts', group: 'Navigate', action: () => navigate('/alerts') },
    {
      id: 'nav-approvals',
      label: 'Approvals',
      group: 'Navigate',
      action: () => navigate('/approvals'),
    },
    {
      id: 'nav-crisis-arena-leaderboard',
      label: 'Adversarial Simulation — Analyst Rankings',
      group: 'Adversarial Simulation',
      action: () => navigate('/crisis-arena/leaderboard'),
    },
    {
      id: 'nav-crisis-arena-engagements',
      label: 'Adversarial Simulation — Engagements',
      group: 'Adversarial Simulation',
      action: () => navigate('/crisis-arena/engagements'),
    },
    {
      id: 'nav-crisis-arena-architect',
      label: 'Adversarial Simulation — Analyst Workspace',
      group: 'Adversarial Simulation',
      action: () => navigate('/crisis-arena/architect'),
    },
  ];
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette(paletteCommands);
  const { open: sentientOpen, show: sentientShow, hide: sentientHide } = useSentientLayer();

  const sentientUpdates: SentientUpdate[] = [
    {
      id: 'u1',
      headline: 'CVE-2024-21412: Critical NTLM bypass — 3 assets exposed',
      surface: 'TENAX',
      severity: 'critical',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      href: '/threats',
    },
    {
      id: 'u2',
      headline: 'Control drift detected — MFA policy deviation on 4 endpoints',
      surface: 'TENAX',
      severity: 'warning',
      timestamp: new Date(Date.now() - 38 * 60000).toISOString(),
      href: '/controls',
    },
    {
      id: 'u3',
      headline: 'Resilience score improved: 73 → 81 after patch cycle',
      surface: 'TENAX',
      severity: 'info',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      href: '/dashboard',
    },
    {
      id: 'u4',
      headline: 'Incident IC-2409 escalated to P1 — awaiting CISO approval',
      surface: 'TENAX',
      severity: 'critical',
      timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
      href: '/incident',
    },
  ];

  const sentientActions: SentientAction[] = [
    {
      id: 'a1',
      label: 'Isolate affected endpoints (4 hosts)',
      description:
        'Agent recommends network isolation for CVE-2024-21412 exposure. Confidence: 94%. Reversible within 15 min.',
      confidence: 0.94,
      policyVerdict: 'requires_approval',
      href: '/approvals',
    },
    {
      id: 'a2',
      label: 'Trigger emergency MFA re-enrollment',
      description:
        'Policy drift on SAML MFA — re-enrollment for 4 accounts recommended. Low blast radius.',
      confidence: 0.88,
      policyVerdict: 'allowed',
      href: '/controls',
    },
    {
      id: 'a3',
      label: 'Escalate IC-2409 to executive stakeholders',
      description:
        'P1 incident open >45 min with no CISO acknowledgement — auto-escalation recommended.',
      confidence: 0.91,
      policyVerdict: 'requires_approval',
      href: '/incident',
    },
  ];

  const sentientCrossLinks: SentientCrossLink[] = [
    {
      id: 'cl1',
      surface: 'Counsel',
      surfaceAccent: '#8b5cf6',
      label: 'Active legal matter: data breach disclosure',
      description:
        'Counsel has a linked data-breach matter with a 72h regulatory disclosure deadline.',
      href: '/counsel/dashboard',
      preservedContext: { surface: 'sentra', domain: 'incident' },
    },
    {
      id: 'cl2',
      surface: 'Lyte',
      surfaceAccent: '#0ea5e9',
      label: '3 pending decisions in Decision Center',
      description:
        "Lyte's Decision Center has 3 TENAX-sourced recommendations queued for approval.",
      href: '/lyte/decision-center',
      preservedContext: { surface: 'sentra' },
    },
    {
      id: 'cl3',
      surface: 'Vessels',
      surfaceAccent: '#0ea5e9',
      label: 'Fleet asset under active threat — MV Atlantic Falcon',
      description:
        "Vessels flagged MV Atlantic Falcon's onboard systems for a related CVE exposure.",
      href: '/vessels/fleet',
      preservedContext: { surface: 'sentra' },
    },
  ];

  if (location.startsWith('/resilience')) {
    return (
      <Suspense fallback={<div style={{ height: '100vh', background: '#060e1a' }} />}>
        <ResilienceScorecardPage />
      </Suspense>
    );
  }

  if (location === '/' || location === '') {
    return (
      <>
        <EcosystemNav
          currentAppId="sentra"
          currentAppName="TENAX Cyber Resilience"
          accentColor={accent}
        />
        <Suspense fallback={<div style={{ height: '100vh', background: '#0a0606' }} />}>
          <SentraLandingPage />
        </Suspense>
        <Toaster position="bottom-right" theme="dark" />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: '#060e1a' }}>
      <EcosystemNav
        currentAppId="sentra"
        currentAppName="TENAX Cyber Resilience"
        accentColor={accent}
      />
      <SharedDashboardShell
        sidebar={
          <SentraSidebarContent
            expanded={sidebarExpanded}
            onMobileClose={() => setSidebarOpen(false)}
            onToggleCollapse={onToggleCollapse}
          />
        }
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        sidebarWidth={sidebarExpanded ? '13rem' : '3.5rem'}
        sidebarEvents={{
          onMouseEnter: () => setSidebarHovered(true),
          onMouseLeave: () => setSidebarHovered(false),
        }}
        theme={{ sidebarBg: '#060e1a', pageBg: '#060e1a', headerBg: 'rgba(6,14,26,0.92)' }}
        accentColor={accent}
        topbar={
          <div className="flex items-center gap-3 w-full md:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded transition-colors text-red-400/50"
              aria-label="Toggle navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-400/80">
              TENAX Cyber Resilience
            </span>
          </div>
        }
      >
        <main data-szl-shell-main className="flex-1 overflow-auto h-full">
          <DashboardRouter />
        </main>
      </SharedDashboardShell>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={paletteCommands}
        appName="TENAX"
        accentColor={accent}
        placeholder="Search TENAX — pages, entities, actions..."
      />
      <SentientLayer
        open={sentientOpen}
        onClose={sentientHide}
        onOpen={sentientShow}
        surfaceId="sentra"
        surfaceName="TENAX Cyber Resilience"
        accentColor={accent}
        updates={sentientUpdates}
        actions={sentientActions}
        crossLinks={sentientCrossLinks}
      />
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default function App() {
  useSessionRevocationToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { prefs, setPreference, isLoaded } = useUserPreferences();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => prefs.sidebar_collapsed);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const userOverriddenSidebarRef = useRef(false);

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

  return (
    <AppModeProvider>
      <AppModeBanner />
      <AnalyticsProvider appName="sentra">
        <QueryClientProvider client={queryClient}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AppShell
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              sidebarCollapsed={sidebarCollapsed}
              onToggleCollapse={toggleCollapsed}
              sidebarHovered={sidebarHovered}
              setSidebarHovered={setSidebarHovered}
            />
          </WouterRouter>
        </QueryClientProvider>
      </AnalyticsProvider>
    </AppModeProvider>
  );
}
