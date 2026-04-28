import { readEnvFeatureFlags } from '@szl-holdings/config';
import { PrivateAppGuard, PowerUserProvider } from '@szl-holdings/shared-ui';
import { AnalyticsProvider } from '@szl-holdings/shared-ui/analytics-provider';
import { AppModeBanner, AppModeProvider } from '@szl-holdings/shared-ui/app-mode-banner';
import { Toaster } from '@szl-holdings/shared-ui/ui/sonner';
import { useSessionRevocationToast } from '@szl-holdings/shared-ui/use-session-revocation-toast';
import {
  type CommandItem,
  CommandPalette,
  createBaselineWebActions,
  getEcosystemSwitchCommands,
  useCommandPalette,
} from '@szl-holdings/shared-ui/command-palette';
import {
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
  useEffectiveAccent,
  useUserPreferences,
} from '@szl-holdings/shared-ui/use-user-preferences';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Bug,
  Camera,
  Cpu,
  Crosshair,
  Database,
  Eye,
  FileText,
  Filter,
  Fingerprint,
  FlaskConical,
  Gauge,
  GitBranch,
  GitMerge,
  Globe,
  Home as HomeIcon,
  KeyRound,
  Landmark,
  Layers,
  Lightbulb,
  Lock,
  Menu,
  Microscope,
  Network,
  Presentation,
  Radio,
  RotateCcw,
  Scale,
  Search,
  Server,
  Settings as SettingsIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Swords,
  Target,
  Terminal,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import {
  type ComponentType,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import AllSlides from './pages/slides/AllSlides';
import PresenterMode from './pages/slides/PresenterMode';
import InvestorDeckViewer from './pages/investor/InvestorDeckViewer';
import InvestorAdmin from './pages/investor/InvestorAdmin';
import InvestorShare from './pages/investor/InvestorShare';
import S01Cover from './pages/slides/S01Cover';
import S02SeriesProblem from './pages/slides/S02SeriesProblem';
import S03Category from './pages/slides/S03Category';
import S04Product from './pages/slides/S04Product';
import S05Demo from './pages/slides/S05Demo';
import S06Market from './pages/slides/S06Market';
import S07SeriesDomains from './pages/slides/S07SeriesDomains';
import S08BusinessModel from './pages/slides/S08BusinessModel';
import S08DividerMoat from './pages/slides/S08DividerMoat';
import S09Ask from './pages/slides/S09Ask';
import S13DividerVerdict from './pages/slides/S13DividerVerdict';

const SLIDES = [
  S01Cover,
  S02SeriesProblem,
  S03Category,
  S04Product,
  S05Demo,
  S08DividerMoat,
  S06Market,
  S07SeriesDomains,
  S13DividerVerdict,
  S08BusinessModel,
  S09Ask,
];
const TOTAL = SLIDES.length;

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000, retry: 1 } },
});

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const AEGIS_BRAND_ACCENT = '#f5f5f5';

type LazyComp = ReturnType<typeof lazy>;
type IconComp = ComponentType<{ className?: string }>;

type NavItem = {
  path: string;
  label: string;
  icon: IconComp;
  comp: LazyComp;
  hideFromSidebar?: boolean;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const L = (importer: () => Promise<{ default: ComponentType<unknown> }>): LazyComp =>
  lazy(importer);

const NAV_SECTIONS: NavSection[] = [
  {
    id: 'soc',
    label: 'SOC Operations',
    items: [
      {
        path: '/soc',
        label: 'SOC Dashboard',
        icon: Shield,
        comp: L(() => import('./pages/soc-dashboard')),
      },
      {
        path: '/agentic-soc',
        label: 'Agentic SOC',
        icon: Bot,
        comp: L(() => import('./pages/agentic-soc')),
      },
      {
        path: '/alerts',
        label: 'Alerts',
        icon: AlertTriangle,
        comp: L(() => import('./pages/alerts-page')),
      },
      {
        path: '/incidents',
        label: 'Incidents',
        icon: Bug,
        comp: L(() => import('./pages/incidents-page')),
      },
      {
        path: '/investigations',
        label: 'Investigations',
        icon: Search,
        comp: L(() => import('./pages/investigations-board')),
      },
      {
        path: '/cases',
        label: 'Cases',
        icon: Briefcase,
        comp: L(() => import('./pages/cases-page')),
      },
      {
        path: '/findings',
        label: 'Findings',
        icon: Target,
        comp: L(() => import('./pages/findings-page')),
      },
      {
        path: '/action-queue',
        label: 'Action Queue',
        icon: Zap,
        comp: L(() => import('./pages/action-queue')),
      },
      {
        path: '/forensics',
        label: 'Forensics Timeline',
        icon: Microscope,
        comp: L(() => import('./pages/forensics-timeline')),
      },
      {
        path: '/deception-grid',
        label: 'Deception Grid',
        icon: Filter,
        comp: L(() => import('./pages/deception-grid')),
      },
      {
        path: '/identity-threat',
        label: 'Identity Threat',
        icon: Fingerprint,
        comp: L(() => import('./pages/identity-threat')),
      },
      {
        path: '/identity-blast-radius',
        label: 'Identity Blast Radius',
        icon: ShieldAlert,
        comp: L(() => import('./pages/identity-blast-radius')),
      },
      {
        path: '/ot-ics',
        label: 'OT / ICS',
        icon: Cpu,
        comp: L(() => import('./pages/ot-ics-dashboard')),
      },
    ],
  },
  {
    id: 'intelligence',
    label: 'Threat Intelligence',
    items: [
      {
        path: '/threat-intelligence',
        label: 'Threat Intelligence',
        icon: Brain,
        comp: L(() => import('./pages/threat-intelligence')),
      },
      {
        path: '/threat-intel-feed',
        label: 'Intel Feed',
        icon: Radio,
        comp: L(() => import('./pages/threat-intel-feed')),
      },
      {
        path: '/threat-graph',
        label: 'Threat Graph',
        icon: GitMerge,
        comp: L(() => import('./pages/threat-graph')),
      },
      {
        path: '/threat-actor',
        label: 'Threat Actor Profiling',
        icon: Users,
        comp: L(() => import('./pages/threat-actor-profiling')),
      },
      {
        path: '/threat-kill-chain',
        label: 'Kill Chain',
        icon: Swords,
        comp: L(() => import('./pages/threat-kill-chain')),
      },
      {
        path: '/threat-hunting',
        label: 'Threat Hunting',
        icon: Crosshair,
        comp: L(() => import('./pages/threat-hunting')),
      },
      {
        path: '/hunt-agents',
        label: 'Hunt Agents',
        icon: Bot,
        comp: L(() => import('./pages/hunt-agents')),
      },
      {
        path: '/adversary',
        label: 'Adversary Engine',
        icon: Crosshair,
        comp: L(() => import('./pages/adversary-engine')),
      },
      {
        path: '/attack-path',
        label: 'Attack Paths',
        icon: GitBranch,
        comp: L(() => import('./pages/attack-path-viz')),
      },
      {
        path: '/mitre',
        label: 'MITRE ATT&CK',
        icon: Target,
        comp: L(() => import('./pages/mitre-attack-page')),
      },
      {
        path: '/predictive',
        label: 'Predictive Intelligence',
        icon: TrendingUp,
        comp: L(() => import('./pages/predictive-intelligence')),
      },
      {
        path: '/breach-cost',
        label: 'Breach Cost',
        icon: BarChart3,
        comp: L(() => import('./pages/breach-cost-predictor')),
      },
      {
        path: '/stix-taxii',
        label: 'STIX / TAXII',
        icon: Database,
        comp: L(() => import('./pages/stix-taxii')),
      },
      {
        path: '/aef-search',
        label: 'AEF Knowledge Search',
        icon: Search,
        comp: L(() => import('./pages/aef-knowledge-search')),
      },
    ],
  },
  {
    id: 'response',
    label: 'Response & Automation',
    items: [
      {
        path: '/soar/playbooks',
        label: 'SOAR Playbooks',
        icon: BookOpen,
        comp: L(() => import('./pages/soar-playbooks')),
      },
      {
        path: '/soar/builder',
        label: 'SOAR Builder',
        icon: Workflow,
        comp: L(() => import('./pages/soar-builder')),
      },
      {
        path: '/response',
        label: 'Response Orchestration',
        icon: Zap,
        comp: L(() => import('./pages/response-orchestration')),
      },
      {
        path: '/watchlists',
        label: 'Watchlists',
        icon: Eye,
        comp: L(() => import('./pages/watchlists')),
      },
      {
        path: '/xdr',
        label: 'XDR Console',
        icon: Network,
        comp: L(() => import('./pages/xdr-console')),
      },
      {
        path: '/xdr-workbench',
        label: 'XDR Workbench',
        icon: Terminal,
        comp: L(() => import('./pages/xdr-incident-workbench')),
      },
    ],
  },
  {
    id: 'war-room',
    label: 'War Room & Exercises',
    items: [
      {
        path: '/citadel-war-room',
        label: 'Citadel War Room',
        icon: Radio,
        comp: L(() => import('./pages/citadel-war-room')),
      },
      {
        path: '/citadel-playbooks',
        label: 'Citadel Playbooks',
        icon: BookOpen,
        comp: L(() => import('./pages/citadel-playbooks')),
      },
      {
        path: '/citadel-after-action',
        label: 'After-Action Report',
        icon: FileText,
        comp: L(() => import('./pages/citadel-after-action')),
      },
      {
        path: '/purple-team',
        label: 'Purple Team',
        icon: Swords,
        comp: L(() => import('./pages/purple-team')),
      },
      {
        path: '/scenario-library',
        label: 'Scenario Library',
        icon: BookOpen,
        comp: L(() => import('./pages/scenario-library')),
      },
      {
        path: '/chaos-drills',
        label: 'Chaos Engineering Drills',
        icon: Zap,
        comp: L(() => import('./pages/chaos-engineering-drills')),
      },
    ],
  },
  {
    id: 'digital-twin',
    label: 'Digital Twin & ATLAS',
    items: [
      {
        path: '/threat-twin-view',
        label: 'Threat Twin',
        icon: Shield,
        comp: L(() => import('./pages/threat-twin-view')),
      },
      {
        path: '/atlas-runtime',
        label: 'Threat Mesh',
        icon: Layers,
        comp: L(() => import('./pages/atlas-runtime')),
      },
      {
        path: '/atlas-runtime/correlation',
        label: 'Worldline Correlation',
        icon: Network,
        comp: L(() => import('./pages/atlas-correlation')),
      },
      {
        path: '/replay',
        label: 'Incident Replay',
        icon: RotateCcw,
        comp: L(() => import('./pages/replay')),
      },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance & Risk',
    items: [
      {
        path: '/compliance',
        label: 'Compliance',
        icon: ShieldCheck,
        comp: L(() => import('./pages/compliance-page')),
      },
      {
        path: '/compliance/evidence',
        label: 'Evidence',
        icon: FileText,
        comp: L(() => import('./pages/compliance-evidence')),
      },
      {
        path: '/compliance/control-graph',
        label: 'Control Graph',
        icon: GitMerge,
        comp: L(() => import('./pages/control-evidence-graph')),
      },
      {
        path: '/compliance/audit-chain',
        label: 'Audit Chain',
        icon: Lock,
        comp: L(() => import('./pages/audit-chain')),
      },
      {
        path: '/compliance/zero-trust',
        label: 'Zero Trust',
        icon: KeyRound,
        comp: L(() => import('./pages/zero-trust-scorecard')),
      },
      {
        path: '/compliance/vulnerabilities',
        label: 'Vulnerabilities',
        icon: Bug,
        comp: L(() => import('./pages/vulnerability-dashboard')),
      },
      {
        path: '/compliance/vuln-lifecycle',
        label: 'Vuln Lifecycle',
        icon: GitBranch,
        comp: L(() => import('./pages/vuln-lifecycle')),
      },
      {
        path: '/compliance/assets',
        label: 'Asset Inventory',
        icon: Server,
        comp: L(() => import('./pages/asset-inventory')),
      },
      {
        path: '/compliance/risk-scoring',
        label: 'Risk Scoring',
        icon: Gauge,
        comp: L(() => import('./pages/risk-scoring')),
      },
      {
        path: '/compliance/executive-risk',
        label: 'Executive Risk',
        icon: TrendingUp,
        comp: L(() => import('./pages/executive-risk')),
      },
      {
        path: '/compliance/board-view',
        label: 'Board View',
        icon: Landmark,
        comp: L(() => import('./pages/executive-board-view')),
      },
      {
        path: '/compliance/hardening',
        label: 'Hardening Controls',
        icon: ShieldCheck,
        comp: L(() => import('./pages/hardening-controls')),
      },
      {
        path: '/compliance/governance-review',
        label: 'Governance Review',
        icon: Scale,
        comp: L(() => import('./pages/governance-review')),
      },
    ],
  },
  {
    id: 'intel',
    label: 'Research Intelligence',
    items: [
      {
        path: '/intel/dashboard',
        label: 'Intel Dashboard',
        icon: Brain,
        comp: L(() => import('./pages/intel/dashboard')),
      },
      {
        path: '/intel/experiments',
        label: 'Experiments',
        icon: FlaskConical,
        comp: L(() => import('./pages/intel/experiments')),
      },
      {
        path: '/intel/models',
        label: 'Models',
        icon: Layers,
        comp: L(() => import('./pages/intel/models')),
      },
      {
        path: '/intel/projects',
        label: 'Projects',
        icon: GitBranch,
        comp: L(() => import('./pages/intel/projects')),
      },
      {
        path: '/intel/insights',
        label: 'Insights',
        icon: Lightbulb,
        comp: L(() => import('./pages/intel/insights')),
      },
      {
        path: '/intel/federated-learning',
        label: 'Federated Learning',
        icon: Lock,
        comp: L(() => import('./pages/federated-learning')),
      },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    items: [
      {
        path: '/governed-cockpit',
        label: 'Governed Intelligence',
        icon: Shield,
        comp: L(() => import('./pages/governed-cockpit')),
      },
      {
        path: '/governance/enterprise',
        label: 'Enterprise Governance',
        icon: Globe,
        comp: L(() => import('./pages/governance/enterprise-governance')),
      },
      {
        path: '/governance/executive-reports',
        label: 'Executive Reports',
        icon: FileText,
        comp: L(() => import('./pages/governance/executive-reports')),
      },
      {
        path: '/governance/trust-analytics',
        label: 'Trust Analytics',
        icon: ShieldCheck,
        comp: L(() => import('./pages/governance/trust-analytics')),
      },
      {
        path: '/governance/incident-analytics',
        label: 'Incident Analytics',
        icon: BarChart3,
        comp: L(() => import('./pages/governance/incident-analytics')),
      },
      {
        path: '/governance/agent-config',
        label: 'Agent Config',
        icon: SettingsIcon,
        comp: L(() => import('./pages/governance/agent-config')),
      },
      {
        path: '/multi-fund',
        label: 'Multi-Fund View',
        icon: Layers,
        comp: L(() => import('./pages/multi-fund-view')),
      },
      {
        path: '/reports',
        label: 'Reports',
        icon: FileText,
        comp: L(() => import('./pages/reports-page')),
      },
      {
        path: '/pdf-export',
        label: 'PDF Export',
        icon: Presentation,
        comp: L(() => import('./pages/aegis-pdf-export')),
      },
      {
        path: '/settings',
        label: 'Settings',
        icon: SettingsIcon,
        comp: L(() => import('./pages/settings/unified-settings')),
      },
    ],
  },
];

/**
 * PARAGON ships several "extended" modules (the entire Threat Intelligence
 * section and the Identity Blast Radius page) that depend on data
 * pipelines still under construction. Hide them — both from sidebar and
 * router — unless `VITE_FEATURE_AEGIS_EXTENDED_MODULES` is set.
 */
const { aegisExtendedModules: AEGIS_EXTENDED_MODULES_ENABLED } = readEnvFeatureFlags(
  import.meta.env as unknown as Record<string, unknown>,
);
const AEGIS_EXTENDED_SECTION_IDS = new Set(['intelligence']);
const AEGIS_EXTENDED_ITEM_PATHS = new Set(['/identity-blast-radius']);

function filterExtendedSections(sections: NavSection[]): NavSection[] {
  if (AEGIS_EXTENDED_MODULES_ENABLED) return sections;
  return sections
    .filter((sec) => !AEGIS_EXTENDED_SECTION_IDS.has(sec.id))
    .map((sec) => ({
      ...sec,
      items: sec.items.filter((item) => !AEGIS_EXTENDED_ITEM_PATHS.has(item.path)),
    }));
}

const VISIBLE_NAV_SECTIONS = filterExtendedSections(NAV_SECTIONS);
const ALL_ROUTES: NavItem[] = VISIBLE_NAV_SECTIONS.flatMap((s) => s.items);

const SLIDES_NAV: NavItem = {
  path: '/slides',
  label: 'Investor Deck',
  icon: Presentation,
  comp: L(() => import('./pages/aegis-home')),
};

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="w-5 h-5 border-2 border-white/20 border-t-[#c9b787] rounded-full animate-spin" />
    </div>
  );
}

function renderIcon(Icon: IconComp): ReactNode {
  return <Icon className="w-3.5 h-3.5" />;
}

function buildSidebarSections(): SidebarNavSection[] {
  const intro: SidebarNavSection = {
    id: 'intro',
    items: [
      { id: '/', label: 'Home', href: '/', icon: <HomeIcon className="w-3.5 h-3.5" /> },
      {
        id: SLIDES_NAV.path,
        label: SLIDES_NAV.label,
        href: SLIDES_NAV.path,
        icon: renderIcon(SLIDES_NAV.icon),
      },
      {
        id: '/investor',
        label: 'Live Investor Deck',
        href: '/investor',
        icon: <TrendingUp className="w-3.5 h-3.5" />,
      },
      {
        id: '/investor/admin',
        label: 'Deck Admin',
        href: '/investor/admin',
        icon: <Camera className="w-3.5 h-3.5" />,
      },
    ],
  };
  const sections: SidebarNavSection[] = VISIBLE_NAV_SECTIONS.map((sec) => ({
    id: sec.id,
    label: sec.label,
    items: sec.items
      .filter((item) => !item.hideFromSidebar)
      .map((item) => ({
        id: item.path,
        label: item.label,
        href: item.path,
        icon: renderIcon(item.icon),
      })),
  }));
  return [intro, ...sections];
}

function AegisSidebarContent({
  expanded,
  onMobileClose,
  onToggleCollapse,
}: {
  expanded: boolean;
  onMobileClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  const [location, navigate] = useLocation();
  const accent = useEffectiveAccent(AEGIS_BRAND_ACCENT);
  const sections = buildSidebarSections();

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
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
            style={{ background: 'rgba(245,245,245,0.08)', border: '1px solid rgba(245,245,245,0.12)' }}
          >
            <Shield className="w-4 h-4 text-[#f5f5f5]" />
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-[#f5f5f5] truncate tracking-tight">PARAGON</h1>
              <p className="text-[10px] truncate font-mono uppercase tracking-wider text-[#f5f5f5]/40">
                PARAGON
              </p>
            </div>
          )}
        </div>
      }
      footer={
        expanded ? (
          <div className="space-y-2">
            <div
              className="rounded-lg px-3 py-2"
              style={{
                background: 'rgba(245,245,245,0.04)',
                border: '1px solid rgba(245,245,245,0.08)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f5f5f5] animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#f5f5f5]/70">
                  PARAGON Runtime Live
                </span>
              </div>
            </div>
            <button
              onClick={onToggleCollapse}
              className="flex items-center justify-center w-full py-1 text-[10px] rounded transition-colors hover:bg-white/5 text-[#f5f5f5]/40"
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
            className="flex items-center justify-center w-8 h-8 rounded mx-auto transition-colors hover:bg-white/5 text-[#f5f5f5]/40"
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

function DashboardRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {ALL_ROUTES.map((route) => (
          <Route key={route.path} path={route.path} component={route.comp} />
        ))}
        <Route>
          <div className="flex items-center justify-center h-full text-[#f5f5f5]/40 font-mono text-xs uppercase tracking-widest">
            Select a module to begin
          </div>
        </Route>
      </Switch>
    </Suspense>
  );
}

function SlideDeck() {
  const [location, navigate] = useLocation();
  const slideMatch = location.match(/slide\/(\d+)/) || location.match(/slide=(\d+)/);
  const current = slideMatch ? Math.max(1, Math.min(TOTAL, parseInt(slideMatch[1], 10))) : 1;

  const isEmbed = location.includes('embed=1');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (current < TOTAL) navigate(`/slides/slide/${current + 1}`);
      }
      if (e.key === 'ArrowLeft') {
        if (current > 1) navigate(`/slides/slide/${current - 1}`);
      }
      if (e.key === 'p' || e.key === 'P') {
        const url = `${BASE}/slides/presenter?slide=${current}`;
        window.open(url, 'aegis-presenter', 'width=1280,height=860,noopener');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [current, navigate]);

  const CurrentSlide = SLIDES[current - 1];

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#080510',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <Suspense fallback={<PageLoader />}>
        <CurrentSlide />
      </Suspense>

      {!isEmbed && (
        <Link
          href="/"
          style={{
            position: 'fixed',
            bottom: '2.5vh',
            left: '2.5vw',
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(10px, 1.2vw, 14px)',
            color: 'rgba(255,255,255,0.3)',
            textDecoration: 'none',
            zIndex: 100,
          }}
        >
          ← Exit deck
        </Link>
      )}
      {!isEmbed && (
        <div
          style={{
            position: 'fixed',
            top: '2vh',
            right: '2vw',
            display: 'flex',
            gap: 8,
            zIndex: 100,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              const url = `${BASE}/slides/presenter?slide=${current}`;
              window.open(url, 'aegis-presenter', 'width=1280,height=860,noopener');
            }}
            title="Open presenter mode (P)"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.85)',
              padding: '6px 10px',
              background: 'rgba(138,138,138,0.18)',
              border: '1px solid rgba(138,138,138,0.45)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Presenter (P)
          </button>
          <button
            type="button"
            onClick={() => {
              window.open(`${BASE}/slides/print?print=1`, '_blank', 'noopener');
            }}
            title="Export deck as PDF"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              color: 'rgba(255,255,255,0.7)',
              padding: '6px 10px',
              background: 'rgba(12,200,217,0.12)',
              border: '1px solid rgba(12,200,217,0.35)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Export PDF
          </button>
        </div>
      )}
      {!isEmbed && (
        <div
          style={{
            position: 'fixed',
            bottom: '2.5vh',
            right: '2.5vw',
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(9px, 1vw, 13px)',
            color: 'rgba(255,255,255,0.18)',
            zIndex: 100,
          }}
        >
          {current} / {TOTAL}
        </div>
      )}
    </div>
  );
}

const HomePage = lazy(() => import('./pages/aegis-home'));
const AegisBillingPage = lazy(() => import('./pages/billing-account'));

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
  const accent = useEffectiveAccent(AEGIS_BRAND_ACCENT);
  const sidebarExpanded = !sidebarCollapsed || sidebarHovered;

  const AEGIS_NAV_SHORTCUTS: Record<string, string> = {
    '/soc': '⌥O',
    '/alerts': '⌥L',
    '/incidents': '⌥I',
  };

  const navCommands: CommandItem[] = ALL_ROUTES.map((item) => ({
    id: `nav-${item.path}`,
    label: item.label,
    group: 'Navigate',
    shortcut: AEGIS_NAV_SHORTCUTS[item.path],
    action: () => navigate(item.path),
  }));

  const paletteCommands: CommandItem[] = [
    ...createBaselineWebActions(navigate),
    ...getEcosystemSwitchCommands('aegis'),
    { id: 'nav-home', label: 'Home', group: 'Navigate', action: () => navigate('/') },
    {
      id: 'nav-slides',
      label: 'Investor Deck',
      group: 'Navigate',
      action: () => navigate('/slides'),
    },
    ...navCommands,
  ];
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette(paletteCommands);

  const isPrintAllSlides = location === '/slides/print' || location.startsWith('/slides/print');
  const isPresenter = location === '/slides/presenter' || location.startsWith('/slides/presenter');
  const isSlides = location.startsWith('/slides') || location.startsWith('/slide');

  if (isPrintAllSlides) {
    return <AllSlides />;
  }

  if (isPresenter) {
    return <PresenterMode />;
  }

  if (isSlides) {
    return <SlideDeck />;
  }

  if (location.startsWith('/share')) {
    return <InvestorShare />;
  }

  if (location === '/investor/admin' || location.startsWith('/investor/admin')) {
    return (
      <PrivateAppGuard appName="PARAGON" accentColor={AEGIS_BRAND_ACCENT}>
        <InvestorAdmin />
      </PrivateAppGuard>
    );
  }

  if (location === '/investor' || location.startsWith('/investor')) {
    return (
      <PrivateAppGuard appName="PARAGON" accentColor={AEGIS_BRAND_ACCENT}>
        <InvestorDeckViewer />
      </PrivateAppGuard>
    );
  }

  if (location === '/' || location === '') {
    return (
      <>
        <EcosystemNav currentAppId="aegis" currentAppName="PARAGON" accentColor={accent} />
        <Suspense fallback={<div style={{ height: '100vh', background: '#080510' }} />}>
          <HomePage />
        </Suspense>
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          commands={paletteCommands}
          appName="PARAGON"
          accentColor={accent}
          placeholder="Search PARAGON — pages, entities, actions..."
        />
      </>
    );
  }

  return (
    <PrivateAppGuard appName="PARAGON" accentColor={AEGIS_BRAND_ACCENT}>
      <PowerUserProvider commandItems={paletteCommands} appName="PARAGON" accentColor={accent}>
        <div className="flex flex-col h-screen" style={{ background: '#080510' }}>
          <EcosystemNav currentAppId="aegis" currentAppName="PARAGON" accentColor={accent} />
          <SharedDashboardShell
            sidebar={
              <AegisSidebarContent
                expanded={sidebarExpanded}
                onMobileClose={() => setSidebarOpen(false)}
                onToggleCollapse={onToggleCollapse}
              />
            }
            mobileOpen={sidebarOpen}
            onMobileClose={() => setSidebarOpen(false)}
            sidebarWidth={sidebarExpanded ? '14rem' : '3.5rem'}
            sidebarEvents={{
              onMouseEnter: () => setSidebarHovered(true),
              onMouseLeave: () => setSidebarHovered(false),
            }}
            theme={{ sidebarBg: '#09060e', pageBg: '#080510', headerBg: 'rgba(9,6,14,0.92)' }}
            accentColor={accent}
            topbar={
              <div className="flex items-center gap-3 w-full md:hidden">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 rounded transition-colors text-[#f5f5f5]/50"
                  aria-label="Toggle navigation"
                >
                  <Menu className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#f5f5f5]/80">
                  PARAGON
                </span>
              </div>
            }
          >
            <main data-szl-shell-main className="flex-1 overflow-auto h-full">
              <DashboardRoutes />
            </main>
          </SharedDashboardShell>
          <CommandPalette
            open={paletteOpen}
            onClose={() => setPaletteOpen(false)}
            commands={paletteCommands}
            appName="PARAGON"
            accentColor={accent}
            placeholder="Search PARAGON — pages, entities, actions..."
          />
        </div>
      </PowerUserProvider>
    </PrivateAppGuard>
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
      <Toaster position="bottom-right" theme="dark" />
      <AnalyticsProvider appName="aegis">
        <QueryClientProvider client={queryClient}>
          <DemoPersonaProvider>
            <WouterRouter base={BASE}>
              <AppShell
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                sidebarCollapsed={sidebarCollapsed}
                onToggleCollapse={toggleCollapsed}
                sidebarHovered={sidebarHovered}
                setSidebarHovered={setSidebarHovered}
              />
            </WouterRouter>
            <DemoPersonaSwitcher />
          </DemoPersonaProvider>
        </QueryClientProvider>
      </AnalyticsProvider>
    </AppModeProvider>
  );
}
