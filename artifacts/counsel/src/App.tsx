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
import { useUserPreferences } from '@szl-holdings/shared-ui/use-user-preferences';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Bell,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle2,
  Clock,
  Database,
  FileSignature,
  FileText,
  LayoutDashboard,
  Menu,
  Network,
  Scale,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { LegalDisclaimerBanner } from './components/LegalDisclaimerBanner';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const COUNSEL_ACCENT = '#8b5cf6';

const DashboardPage = lazy(() => import('./pages/dashboard'));
const CounselLandingPage = lazy(() => import('./pages/counsel-landing'));
const CounselPricingPage = lazy(() => import('./pages/pricing'));
const CounselBillingPage = lazy(() => import('./pages/billing-account'));
const MatterOverviewPage = lazy(() => import('./pages/matter-overview'));
const ObligationTimelinePage = lazy(() => import('./pages/obligation-timeline'));
const DependencyGraphPage = lazy(() => import('./pages/dependency-graph'));
const CounselPerformancePage = lazy(() => import('./pages/counsel-performance'));
const RiskExposureDeskPage = lazy(() => import('./pages/risk-exposure-desk'));
const DecisionCenterPage = lazy(() => import('./pages/decision-center'));
const AlertsPage = lazy(() => import('./pages/alerts'));
const ApprovalsPage = lazy(() => import('./pages/approvals'));
const TrustProvenancePage = lazy(() => import('./pages/trust-provenance'));
const AefKnowledgeSearchPage = lazy(() => import('./pages/aef-knowledge-search'));
const ForecastPage = lazy(() => import('./pages/forecast'));
const MatterKnowledgePage = lazy(() => import('./pages/matter-knowledge'));
const EvidenceExplorerPage = lazy(() =>
  import('@szl-holdings/shared-ui/evidence-explorer').then((m) => ({
    default: () => <m.EvidenceExplorer domainFilter="legal" title="Counsel Evidence Explorer" />,
  })),
);
const EsignaturePage = lazy(() => import('./pages/esignature'));
const CourtFilingsPage = lazy(() => import('./pages/court-filings'));
const ClauseGenomePage = lazy(() => import('./pages/clause-genome'));
const DraftingAgentPage = lazy(() => import('./pages/drafting-agent'));
const RiskDiffPage = lazy(() => import('./pages/risk-diff'));
const LegalNlpPage = lazy(() => import('./pages/legal-nlp'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000 } },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="w-6 h-6 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
    </div>
  );
}

function CounselSidebarContent({
  expanded,
  onMobileClose,
  onToggleCollapse,
}: {
  expanded: boolean;
  onMobileClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  const [location, navigate] = useLocation();

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
          id: '/matters',
          label: 'Matter Overview',
          href: '/matters',
          icon: <Briefcase className="w-3.5 h-3.5" />,
        },
        {
          id: '/obligations',
          label: 'Obligation Timeline',
          href: '/obligations',
          icon: <Clock className="w-3.5 h-3.5" />,
        },
        {
          id: '/dependencies',
          label: 'Dependency Graph',
          href: '/dependencies',
          icon: <Network className="w-3.5 h-3.5" />,
        },
        {
          id: '/performance',
          label: 'Counsel Performance',
          href: '/performance',
          icon: <Scale className="w-3.5 h-3.5" />,
        },
        {
          id: '/risk',
          label: 'Risk & Exposure Desk',
          href: '/risk',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        { id: '/alerts', label: 'Alerts', href: '/alerts', icon: <Bell className="w-3.5 h-3.5" /> },
        {
          id: '/approvals',
          label: 'Approvals',
          href: '/approvals',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        },
        {
          id: '/trust',
          label: 'Trust & Provenance',
          href: '/trust',
          icon: <Shield className="w-3.5 h-3.5" />,
        },
        {
          id: '/esignature',
          label: 'E-Signature',
          href: '/esignature',
          icon: <FileSignature className="w-3.5 h-3.5" />,
        },
        {
          id: '/court-filings',
          label: 'Court Filings',
          href: '/court-filings',
          icon: <FileText className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'clause-intelligence',
      label: 'Clause Intelligence',
      items: [
        {
          id: '/clause-genome',
          label: 'Clause Genome',
          href: '/clause-genome',
          icon: <BookOpen className="w-3.5 h-3.5" />,
        },
        {
          id: '/drafting-agent',
          label: 'Drafting Agent',
          href: '/drafting-agent',
          icon: <Sparkles className="w-3.5 h-3.5" />,
        },
        {
          id: '/risk-diff',
          label: 'Risk Diff',
          href: '/risk-diff',
          icon: <Shield className="w-3.5 h-3.5" />,
        },
        {
          id: '/legal-nlp',
          label: 'Legal NLP (HF)',
          href: '/legal-nlp',
          icon: <Brain className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'intelligence',
      label: 'Intelligence',
      items: [
        {
          id: '/knowledge',
          label: 'Matter Knowledge',
          href: '/knowledge',
          icon: <Brain className="w-3.5 h-3.5" />,
        },
        {
          id: '/aef-search',
          label: 'AEF Knowledge Search',
          href: '/aef-search',
          icon: <Search className="w-3.5 h-3.5" />,
        },
        {
          id: '/evidence',
          label: 'Evidence Explorer',
          href: '/evidence',
          icon: <Database className="w-3.5 h-3.5" />,
        },
      ],
    },
  ];

  return (
    <SidebarNav
      sections={sections}
      currentPath={location}
      accentColor={COUNSEL_ACCENT}
      collapsed={!expanded}
      onNavigate={(item) => {
        if (item.href) navigate(item.href);
        onMobileClose?.();
      }}
      header={
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.12)',
            }}
          >
            <Scale className="w-4 h-4 text-violet-400" />
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-violet-50 truncate tracking-tight">
                Counsel
              </h1>
              <p className="text-[10px] truncate font-mono uppercase tracking-wider text-violet-400/40">
                Legal Matter Command
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
                background: 'rgba(139,92,246,0.04)',
                border: '1px solid rgba(139,92,246,0.08)',
              }}
            >
              <div className="text-[9px] uppercase tracking-widest font-medium mb-2 text-violet-400/50">
                Matter Status
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Active matters</span>
                  <span className="text-[9px] font-mono text-violet-400">4 matters</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Urgent deadlines</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[9px] font-mono text-amber-400">2 in 14 days</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/35">Exposure</span>
                  <span className="text-[9px] font-mono text-red-400">$6.4M at risk</span>
                </div>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-full py-1 text-[10px] rounded transition-colors hover:bg-white/5 text-violet-400/40"
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
            className="flex items-center justify-center w-7 h-7 mx-auto rounded transition-colors hover:bg-white/5 text-violet-400/40"
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
        <Route path="/matters" component={MatterOverviewPage} />
        <Route path="/obligations" component={ObligationTimelinePage} />
        <Route path="/dependencies" component={DependencyGraphPage} />
        <Route path="/performance" component={CounselPerformancePage} />
        <Route path="/risk" component={RiskExposureDeskPage} />
        <Route path="/decision-center" component={DecisionCenterPage} />
        <Route path="/alerts" component={AlertsPage} />
        <Route path="/approvals" component={ApprovalsPage} />
        <Route path="/trust" component={TrustProvenancePage} />
        <Route path="/knowledge" component={MatterKnowledgePage} />
        <Route path="/aef-search" component={AefKnowledgeSearchPage} />
        <Route path="/forecast" component={ForecastPage} />
        <Route path="/pricing" component={CounselPricingPage} />
        <Route path="/account/billing" component={CounselBillingPage} />
        <Route path="/evidence" component={EvidenceExplorerPage} />
        <Route path="/esignature" component={EsignaturePage} />
        <Route path="/court-filings" component={CourtFilingsPage} />
        <Route path="/clause-genome" component={ClauseGenomePage} />
        <Route path="/drafting-agent" component={DraftingAgentPage} />
        <Route path="/risk-diff" component={RiskDiffPage} />
        <Route path="/legal-nlp" component={LegalNlpPage} />
        <Route>
          <div className="flex items-center justify-center h-full">
            <p className="text-violet-400/40">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { prefs, setPreference, isLoaded } = useUserPreferences();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => prefs.sidebar_collapsed);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const userOverriddenSidebarRef = useRef(false);
  const [location, navigate] = useLocation();

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

  const sidebarExpanded = !sidebarCollapsed || sidebarHovered;

  const paletteCommands: CommandItem[] = [
    ...createBaselineWebActions(navigate),
    ...getEcosystemSwitchCommands('counsel'),
    {
      id: 'nav-dashboard',
      label: 'Dashboard',
      group: 'Navigate',
      action: () => navigate('/dashboard'),
    },
    {
      id: 'nav-matters',
      label: 'Matter Overview',
      group: 'Navigate',
      action: () => navigate('/matters'),
    },
    {
      id: 'nav-obligations',
      label: 'Obligation Timeline',
      group: 'Navigate',
      action: () => navigate('/obligations'),
    },
    {
      id: 'nav-dependencies',
      label: 'Dependency Graph',
      group: 'Navigate',
      action: () => navigate('/dependencies'),
    },
    {
      id: 'nav-performance',
      label: 'Counsel Performance',
      group: 'Navigate',
      action: () => navigate('/performance'),
    },
    {
      id: 'nav-risk',
      label: 'Risk Exposure Desk',
      group: 'Navigate',
      action: () => navigate('/risk'),
    },
    {
      id: 'nav-decisions',
      label: 'Decision Center',
      group: 'Navigate',
      action: () => navigate('/decision-center'),
    },
    { id: 'nav-alerts', label: 'Alerts', group: 'Navigate', action: () => navigate('/alerts') },
    {
      id: 'nav-approvals',
      label: 'Approvals',
      group: 'Navigate',
      action: () => navigate('/approvals'),
    },
    {
      id: 'nav-trust',
      label: 'Trust & Provenance',
      group: 'Navigate',
      action: () => navigate('/trust'),
    },
    {
      id: 'nav-knowledge',
      label: 'Matter Knowledge',
      group: 'Navigate',
      action: () => navigate('/knowledge'),
    },
    {
      id: 'nav-aef-search',
      label: 'AEF Knowledge Search',
      group: 'Navigate',
      action: () => navigate('/aef-search'),
    },
    {
      id: 'nav-clause-genome',
      label: 'Clause Genome',
      group: 'Navigate',
      action: () => navigate('/clause-genome'),
    },
    {
      id: 'nav-drafting-agent',
      label: 'Drafting Agent',
      group: 'Navigate',
      action: () => navigate('/drafting-agent'),
    },
    {
      id: 'nav-risk-diff',
      label: 'Risk Diff',
      group: 'Navigate',
      action: () => navigate('/risk-diff'),
    },
  ];
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette(paletteCommands);
  const { open: sentientOpen, show: sentientShow, hide: sentientHide } = useSentientLayer();

  const sentientUpdates: SentientUpdate[] = [
    {
      id: 'u1',
      headline: 'Greenfield v. Apex: 14-day trial deadline — brief not filed',
      surface: 'Counsel',
      severity: 'critical',
      timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
      href: '/obligations',
    },
    {
      id: 'u2',
      headline: 'Matter 2024-SEC-441: opposing counsel response received',
      surface: 'Counsel',
      severity: 'info',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      href: '/matters',
    },
    {
      id: 'u3',
      headline: 'Exposure increased: $6.4M at risk — Greenfield + TechCo cluster',
      surface: 'Counsel',
      severity: 'warning',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      href: '/risk',
    },
    {
      id: 'u4',
      headline: 'New dependency: Vessels sanctions matter linked to Apex case',
      surface: 'Counsel',
      severity: 'info',
      timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
      href: '/dependencies',
    },
  ];

  const sentientActions: SentientAction[] = [
    {
      id: 'a1',
      label: 'File Greenfield brief — 14-day deadline in 96 hours',
      description:
        'Agent has drafted briefing outline with case citations. Requires counsel review before filing.',
      confidence: 0.89,
      policyVerdict: 'requires_approval',
      href: '/matters',
    },
    {
      id: 'a2',
      label: 'Generate demand letter — TechCo IP matter',
      description:
        'Demand letter template ready with $2.1M exposure framing. Low risk, routine action.',
      confidence: 0.92,
      policyVerdict: 'allowed',
      href: '/decisions',
    },
    {
      id: 'a3',
      label: 'Escalate 2024-SEC-441 to senior partner',
      description:
        'SEC response received with accelerated discovery timeline. Recommend immediate escalation.',
      confidence: 0.87,
      policyVerdict: 'requires_approval',
      href: '/approvals',
    },
    {
      id: 'a4',
      label: 'Draft indemnification clause — Apex Acquisition',
      description:
        '7 precedent clauses found in corpus. Recommend mutual broad-form with 2x cap per firm playbook.',
      confidence: 0.91,
      policyVerdict: 'allowed',
      href: '/drafting-agent',
    },
  ];

  const sentientCrossLinks: SentientCrossLink[] = [
    {
      id: 'cl1',
      surface: 'Aegis',
      surfaceAccent: '#ef4444',
      label: 'Aegis: data breach incident linked to Greenfield',
      description:
        "Aegis's IC-2409 incident is the source event for the Greenfield data breach matter.",
      href: '/tenax/incident',
      preservedContext: { surface: 'counsel', matter: 'greenfield' },
    },
    {
      id: 'cl2',
      surface: 'Vessels',
      surfaceAccent: '#4d8fcc',
      label: 'Vessels: MV Atlantic Falcon sanctions linkage',
      description:
        'Vessels flagged Apex Group as beneficiary of a sanctioned vessel voyage — linked to 2024-SEC-441.',
      href: '/vessels/sanctions',
      preservedContext: { surface: 'counsel' },
    },
    {
      id: 'cl3',
      surface: 'Lyte',
      surfaceAccent: '#4d8fcc',
      label: 'Lyte: 2 legal decisions pending executive approval',
      description:
        "Lyte's Decision Center has 2 Counsel-sourced recommendations queued for executive sign-off.",
      href: '/lyte/decision-center',
      preservedContext: { surface: 'counsel' },
    },
  ];

  if (location === '/' || location === '') {
    return (
      <>
        <EcosystemNav
          currentAppId="counsel"
          currentAppName="Counsel Legal Matter Command"
          accentColor={COUNSEL_ACCENT}
        />
        <LegalDisclaimerBanner />
        <Suspense fallback={<div style={{ height: '100vh', background: '#0a0614' }} />}>
          <main id="main-content" tabIndex={-1}>
            <CounselLandingPage />
          </main>
        </Suspense>
        <Toaster position="bottom-right" theme="dark" />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: '#0a0614' }}>
      <EcosystemNav
        currentAppId="counsel"
        currentAppName="Counsel Legal Matter Command"
        accentColor={COUNSEL_ACCENT}
      />
      <LegalDisclaimerBanner />
      <SharedDashboardShell
        sidebar={
          <CounselSidebarContent
            expanded={sidebarExpanded}
            onMobileClose={() => setSidebarOpen(false)}
            onToggleCollapse={toggleCollapsed}
          />
        }
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        sidebarWidth={sidebarExpanded ? '13rem' : '3.5rem'}
        sidebarEvents={{
          onMouseEnter: () => setSidebarHovered(true),
          onMouseLeave: () => setSidebarHovered(false),
        }}
        theme={{ sidebarBg: '#0a0614', pageBg: '#0a0614', headerBg: 'rgba(10,6,20,0.92)' }}
        accentColor={COUNSEL_ACCENT}
        topbar={
          <div className="flex items-center gap-3 w-full md:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded transition-colors text-violet-400/50"
              aria-label="Toggle navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono uppercase tracking-wider text-violet-400/80">
              Counsel
            </span>
          </div>
        }
      >
        <div className="flex-1 overflow-auto h-full">
          <DashboardRouter />
        </div>
      </SharedDashboardShell>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={paletteCommands}
        appName="Counsel"
        accentColor={COUNSEL_ACCENT}
        placeholder="Search Counsel — matters, obligations, actions..."
      />
      <SentientLayer
        open={sentientOpen}
        onClose={sentientHide}
        onOpen={sentientShow}
        surfaceId="counsel"
        surfaceName="Counsel Legal Matter Command"
        accentColor={COUNSEL_ACCENT}
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
  return (
    <AppModeProvider>
      <AppModeBanner />
      <AnalyticsProvider appName="counsel">
        <QueryClientProvider client={queryClient}>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <AppShell />
          </WouterRouter>
        </QueryClientProvider>
      </AnalyticsProvider>
    </AppModeProvider>
  );
}
