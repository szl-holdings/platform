import { PrivateAppGuard } from '@szl-holdings/shared-ui';
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
  Activity,
  AlertTriangle,
  Antenna,
  Atom,
  Banknote,
  BarChart3,
  Beaker,
  BookOpen,
  Bot,
  Boxes,
  Brain,
  Briefcase,
  Bug,
  Building2,
  ClipboardList,
  Clock,
  Compass,
  Cpu,
  Crosshair,
  Database,
  DollarSign,
  Eye,
  FileCode,
  FileText,
  Filter,
  Fingerprint,
  FlaskConical,
  Gauge,
  GitBranch,
  GitMerge,
  Globe,
  Headphones,
  Heart,
  Hexagon,
  Home as HomeIcon,
  KeyRound,
  Landmark,
  Layers,
  Layers3,
  LifeBuoy,
  ListChecks,
  Lock,
  Map,
  Menu,
  MessageSquare,
  Microscope,
  Network,
  PieChart,
  Play,
  Presentation,
  Radio,
  Receipt,
  RotateCcw,
  Scale,
  Search,
  Server,
  Settings as SettingsIcon,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  Telescope,
  Terminal,
  Ticket,
  TrendingUp,
  Users,
  Workflow,
  Wrench,
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
const AEGIS_BRAND_ACCENT = '#ef4444';

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
    id: 'home',
    label: 'Home',
    items: [
      {
        path: '/home',
        label: 'Marketing Home',
        icon: HomeIcon,
        comp: L(() => import('./pages/aegis-home')),
      },
      {
        path: '/command-home',
        label: 'Command Home',
        icon: Compass,
        comp: L(() => import('./pages/command-home')),
      },
      {
        path: '/marketing-home',
        label: 'Marketing',
        icon: Sparkles,
        comp: L(() => import('./pages/marketing-home')),
      },
      {
        path: '/pricing',
        label: 'Pricing',
        icon: DollarSign,
        comp: L(() => import('./pages/aegis-pricing')),
      },
      {
        path: '/what-changed',
        label: 'What Changed',
        icon: TrendingUp,
        comp: L(() => import('./pages/aegis-what-changed')),
      },
      {
        path: '/enterprise-demo',
        label: 'Enterprise Demo',
        icon: Briefcase,
        comp: L(() => import('./pages/enterprise-demo')),
      },
      { path: '/pulse', label: 'Pulse', icon: Heart, comp: L(() => import('./pages/pulse')) },
    ],
  },
  {
    id: 'soc',
    label: 'SOC',
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
        icon: ListChecks,
        comp: L(() => import('./pages/findings-page')),
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
        path: '/mitre',
        label: 'MITRE ATT&CK',
        icon: Hexagon,
        comp: L(() => import('./pages/mitre-attack-page')),
      },
      {
        path: '/sentinel',
        label: 'Sentinel',
        icon: Eye,
        comp: L(() => import('./pages/sentinel-dashboard')),
      },
      {
        path: '/sentinel-behavioral',
        label: 'Sentinel Behavioral',
        icon: Activity,
        comp: L(() => import('./pages/sentinel-behavioral')),
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
      {
        path: '/soar/builder',
        label: 'SOAR Builder',
        icon: Workflow,
        comp: L(() => import('./pages/soar-builder')),
      },
      {
        path: '/soar/playbooks',
        label: 'SOAR Playbooks',
        icon: BookOpen,
        comp: L(() => import('./pages/soar-playbooks')),
      },
      {
        path: '/response',
        label: 'Response Orchestration',
        icon: Zap,
        comp: L(() => import('./pages/response-orchestration')),
      },
      {
        path: '/action-queue',
        label: 'Action Queue',
        icon: ListChecks,
        comp: L(() => import('./pages/action-queue')),
      },
      {
        path: '/watchlists',
        label: 'Watchlists',
        icon: Eye,
        comp: L(() => import('./pages/watchlists')),
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
        path: '/ot-ics',
        label: 'OT / ICS',
        icon: Cpu,
        comp: L(() => import('./pages/ot-ics-dashboard')),
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
    ],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    items: [
      {
        path: '/threat-intelligence',
        label: 'Threat Intelligence',
        icon: Brain,
        comp: L(() => import('./pages/threat-intelligence')),
      },
      {
        path: '/threat-intel',
        label: 'Threat Intel',
        icon: Brain,
        comp: L(() => import('./pages/threat-intel')),
      },
      {
        path: '/threat-intel-feed',
        label: 'Intel Feed',
        icon: Antenna,
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
        path: '/threat-desk',
        label: 'Threat Desk',
        icon: Headphones,
        comp: L(() => import('./pages/threat-desk')),
      },
      {
        path: '/threat-kill-chain',
        label: 'Kill Chain',
        icon: Swords,
        comp: L(() => import('./pages/threat-kill-chain')),
      },
      {
        path: '/threat-cost',
        label: 'Threat Cost',
        icon: DollarSign,
        comp: L(() => import('./pages/threat-cost-translator')),
      },
      {
        path: '/threat-sim-report',
        label: 'Sim Report',
        icon: FileText,
        comp: L(() => import('./pages/threat-sim-report')),
      },
      {
        path: '/predictive',
        label: 'Predictive Intelligence',
        icon: TrendingUp,
        comp: L(() => import('./pages/predictive-intelligence')),
      },
      {
        path: '/fusion',
        label: 'Fusion Grid',
        icon: Layers,
        comp: L(() => import('./pages/intelligence-fusion-grid')),
      },
      {
        path: '/business-signal',
        label: 'Business Signal',
        icon: Radio,
        comp: L(() => import('./pages/business-signal-intelligence')),
      },
      {
        path: '/stix-taxii',
        label: 'STIX/TAXII',
        icon: Database,
        comp: L(() => import('./pages/stix-taxii')),
      },
      {
        path: '/apt-emulation',
        label: 'APT Emulation',
        icon: Swords,
        comp: L(() => import('./pages/apt-emulation')),
      },
      {
        path: '/attack-path',
        label: 'Attack Paths',
        icon: GitBranch,
        comp: L(() => import('./pages/attack-path-viz')),
      },
      {
        path: '/cognitive-attack-path',
        label: 'Cognitive Attack Path',
        icon: Brain,
        comp: L(() => import('./pages/cognitive-attack-path')),
      },
      {
        path: '/adversary',
        label: 'Adversary Engine',
        icon: Crosshair,
        comp: L(() => import('./pages/adversary-engine')),
      },
      {
        path: '/adversary-narrative',
        label: 'Narrative Engine',
        icon: BookOpen,
        comp: L(() => import('./pages/adversary-narrative-engine')),
      },
      {
        path: '/autonomous-threat',
        label: 'Autonomous Threat',
        icon: Bot,
        comp: L(() => import('./pages/autonomous-threat-engine')),
      },
      {
        path: '/mtd',
        label: 'MTD Engine',
        icon: Atom,
        comp: L(() => import('./pages/mtd-engine')),
      },
      {
        path: '/tradecraft',
        label: 'Tradecraft Engine',
        icon: Wrench,
        comp: L(() => import('./pages/tradecraft-engine')),
      },
      {
        path: '/simulation',
        label: 'Simulation Panel',
        icon: FlaskConical,
        comp: L(() => import('./pages/simulation-panel')),
      },
      {
        path: '/simulation-runner',
        label: 'Simulation Runner',
        icon: Play,
        comp: L(() => import('./pages/simulation-runner')),
      },
      {
        path: '/scenario-library',
        label: 'Scenario Library',
        icon: BookOpen,
        comp: L(() => import('./pages/scenario-library')),
      },
      {
        path: '/decision-center',
        label: 'Decision Center',
        icon: Target,
        comp: L(() => import('./pages/decision-center')),
      },
      {
        path: '/decision-console',
        label: 'Decision Console',
        icon: Terminal,
        comp: L(() => import('./pages/decision-console')),
      },
      {
        path: '/breach-cost',
        label: 'Breach Cost',
        icon: DollarSign,
        comp: L(() => import('./pages/breach-cost-predictor')),
      },
      {
        path: '/business-impact',
        label: 'Business Impact',
        icon: Map,
        comp: L(() => import('./pages/business-impact-map')),
      },
      {
        path: '/cyber-insurance',
        label: 'Cyber Insurance Intel',
        icon: Banknote,
        comp: L(() => import('./pages/cyber-insurance-intel')),
      },
      {
        path: '/cyber-insurance-score',
        label: 'Insurance Score',
        icon: Gauge,
        comp: L(() => import('./pages/cyber-insurance-score')),
      },
    ],
  },
  {
    id: 'labs',
    label: 'Labs',
    items: [
      {
        path: '/intel/dashboard',
        label: 'Intel Dashboard',
        icon: Brain,
        comp: L(() => import('./pages/intel/dashboard')),
      },
      {
        path: '/intel/agent-autonomy',
        label: 'Agent Autonomy',
        icon: Bot,
        comp: L(() => import('./pages/intel/agent-autonomy')),
      },
      {
        path: '/intel/agent-spawner',
        label: 'Agent Spawner',
        icon: Sparkles,
        comp: L(() => import('./pages/intel/agent-spawner')),
      },
      {
        path: '/intel/ai-advisor',
        label: 'AI Advisor',
        icon: MessageSquare,
        comp: L(() => import('./pages/intel/ai-advisor')),
      },
      {
        path: '/intel/ai-command-center',
        label: 'AI Command Center',
        icon: Terminal,
        comp: L(() => import('./pages/intel/ai-command-center')),
      },
      {
        path: '/intel/alert-correlation',
        label: 'Alert Correlation',
        icon: GitMerge,
        comp: L(() => import('./pages/intel/alert-correlation')),
      },
      {
        path: '/intel/alerts-management',
        label: 'Alerts Management',
        icon: AlertTriangle,
        comp: L(() => import('./pages/intel/alerts-management')),
      },
      {
        path: '/intel/anomaly-timeline',
        label: 'Anomaly Timeline',
        icon: Activity,
        comp: L(() => import('./pages/intel/anomaly-timeline')),
      },
      {
        path: '/intel/benchmarking',
        label: 'Benchmarking',
        icon: BarChart3,
        comp: L(() => import('./pages/intel/benchmarking')),
      },
      {
        path: '/intel/confidence-histogram',
        label: 'Confidence Histogram',
        icon: BarChart3,
        comp: L(() => import('./pages/intel/confidence-histogram')),
      },
      {
        path: '/intel/correlation-analysis',
        label: 'Correlation Analysis',
        icon: GitMerge,
        comp: L(() => import('./pages/intel/correlation-analysis')),
      },
      {
        path: '/intel/dual-mind-monitor',
        label: 'Dual Mind Monitor',
        icon: Brain,
        comp: L(() => import('./pages/intel/dual-mind-monitor')),
      },
      {
        path: '/intel/ensemble-studio',
        label: 'Ensemble Studio',
        icon: Layers3,
        comp: L(() => import('./pages/intel/ensemble-studio')),
      },
      {
        path: '/intel/experiments',
        label: 'Experiments',
        icon: Beaker,
        comp: L(() => import('./pages/intel/experiments')),
      },
      {
        path: '/intel/gpu-monitoring',
        label: 'GPU Monitoring',
        icon: Cpu,
        comp: L(() => import('./pages/intel/gpu-monitoring')),
      },
      {
        path: '/intel/insights',
        label: 'Insights',
        icon: Sparkles,
        comp: L(() => import('./pages/intel/insights')),
      },
      {
        path: '/intel/observability',
        label: 'Intel Observability',
        icon: Telescope,
        comp: L(() => import('./pages/intel/intel-observability')),
      },
      {
        path: '/intel/llm-evaluation',
        label: 'LLM Evaluation',
        icon: ClipboardList,
        comp: L(() => import('./pages/intel/llm-evaluation')),
      },
      {
        path: '/intel/model-registry',
        label: 'Model Registry',
        icon: Database,
        comp: L(() => import('./pages/intel/model-registry')),
      },
      {
        path: '/intel/models',
        label: 'Models',
        icon: Boxes,
        comp: L(() => import('./pages/intel/models')),
      },
      {
        path: '/intel/neural-explorer',
        label: 'Neural Explorer',
        icon: Brain,
        comp: L(() => import('./pages/intel/neural-explorer')),
      },
      {
        path: '/intel/prediction-drift',
        label: 'Prediction Drift',
        icon: TrendingUp,
        comp: L(() => import('./pages/intel/prediction-drift')),
      },
      {
        path: '/intel/predictions',
        label: 'Predictions',
        icon: Target,
        comp: L(() => import('./pages/intel/predictions')),
      },
      {
        path: '/intel/projects',
        label: 'Projects',
        icon: Briefcase,
        comp: L(() => import('./pages/intel/projects')),
      },
      {
        path: '/intel/scenario-builder',
        label: 'Scenario Builder',
        icon: Workflow,
        comp: L(() => import('./pages/intel/scenario-builder')),
      },
      {
        path: '/intel/signal-relay',
        label: 'Signal Relay',
        icon: Radio,
        comp: L(() => import('./pages/intel/signal-relay')),
      },
      {
        path: '/agent-insights',
        label: 'Agent Insights',
        icon: Sparkles,
        comp: L(() => import('./pages/agent-insights')),
      },
      {
        path: '/agentops',
        label: 'AgentOps Explorer',
        icon: Bot,
        comp: L(() => import('./pages/agentops-explorer')),
      },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
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
        path: '/compliance/governance-review',
        label: 'Governance Review',
        icon: Scale,
        comp: L(() => import('./pages/governance-review')),
      },
      {
        path: '/compliance/hardening',
        label: 'Hardening Controls',
        icon: ShieldCheck,
        comp: L(() => import('./pages/hardening-controls')),
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
        icon: Boxes,
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
        path: '/compliance/ciso',
        label: 'CISO Dashboard',
        icon: Shield,
        comp: L(() => import('./pages/ciso-dashboard')),
      },
      {
        path: '/compliance/incident-readiness',
        label: 'Incident Readiness',
        icon: ListChecks,
        comp: L(() => import('./pages/incident-readiness-view')),
      },
      {
        path: '/compliance/incident-proof',
        label: 'Incident Proof',
        icon: Lock,
        comp: L(() => import('./pages/incident-proof-chain')),
      },
      {
        path: '/compliance/assessment',
        label: 'Assessment',
        icon: ClipboardList,
        comp: L(() => import('./pages/assessment-dashboard')),
      },
      {
        path: '/compliance/trust-provenance',
        label: 'Trust Provenance',
        icon: ShieldCheck,
        comp: L(() => import('./pages/trust-provenance')),
      },
      {
        path: '/compliance/risks',
        label: 'Compliance Risks',
        icon: AlertTriangle,
        comp: L(() => import('./pages/compliance/compliance-risks')),
      },
      {
        path: '/compliance/financial',
        label: 'Financial Compliance',
        icon: Receipt,
        comp: L(() => import('./pages/compliance/financial-compliance')),
      },
      {
        path: '/compliance/framework-scorecards',
        label: 'Framework Scorecards',
        icon: BarChart3,
        comp: L(() => import('./pages/compliance/framework-scorecards')),
      },
      {
        path: '/compliance/milestones',
        label: 'Milestones & Trends',
        icon: TrendingUp,
        comp: L(() => import('./pages/compliance/milestones-trends')),
      },
      {
        path: '/compliance/readiness-ai',
        label: 'Readiness AI Insights',
        icon: Sparkles,
        comp: L(() => import('./pages/compliance/readiness-ai-insights')),
      },
      {
        path: '/compliance/readiness',
        label: 'Readiness Dashboard',
        icon: Gauge,
        comp: L(() => import('./pages/compliance/readiness-dashboard')),
      },
      {
        path: '/compliance/vendor-risk',
        label: 'Vendor Risk',
        icon: Building2,
        comp: L(() => import('./pages/compliance/vendor-risk')),
      },
    ],
  },
  {
    id: 'ops',
    label: 'Operations (MSP)',
    items: [
      {
        path: '/ops/dashboard',
        label: 'Ops Dashboard',
        icon: Server,
        comp: L(() => import('./pages/msp/dashboard')),
      },
      {
        path: '/ops/clients',
        label: 'Clients',
        icon: Users,
        comp: L(() => import('./pages/msp/clients')),
      },
      {
        path: '/ops/contracts',
        label: 'Contracts',
        icon: FileText,
        comp: L(() => import('./pages/msp/contracts')),
      },
      {
        path: '/ops/devices',
        label: 'Devices',
        icon: Cpu,
        comp: L(() => import('./pages/msp/devices')),
      },
      {
        path: '/ops/dispatch',
        label: 'Dispatch',
        icon: Radio,
        comp: L(() => import('./pages/msp/dispatch')),
      },
      {
        path: '/ops/mrr',
        label: 'MRR Dashboard',
        icon: DollarSign,
        comp: L(() => import('./pages/msp/mrr-dashboard')),
      },
      { path: '/ops/noc', label: 'NOC', icon: Network, comp: L(() => import('./pages/msp/noc')) },
      {
        path: '/ops/observability',
        label: 'Ops Observability',
        icon: Telescope,
        comp: L(() => import('./pages/msp/ops-observability')),
      },
      {
        path: '/ops/provider-settings',
        label: 'Provider Settings',
        icon: SettingsIcon,
        comp: L(() => import('./pages/msp/provider-settings')),
      },
      {
        path: '/ops/revenue',
        label: 'Revenue',
        icon: PieChart,
        comp: L(() => import('./pages/msp/revenue')),
      },
      {
        path: '/ops/rmm',
        label: 'RMM Console',
        icon: Terminal,
        comp: L(() => import('./pages/msp/rmm-console')),
      },
      {
        path: '/ops/service-desk',
        label: 'Service Desk',
        icon: LifeBuoy,
        comp: L(() => import('./pages/msp/service-desk')),
      },
      {
        path: '/ops/technicians',
        label: 'Technicians',
        icon: Users,
        comp: L(() => import('./pages/msp/technicians')),
      },
      {
        path: '/ops/tickets',
        label: 'Tickets',
        icon: Ticket,
        comp: L(() => import('./pages/msp/tickets')),
      },
    ],
  },
  {
    id: 'nexus',
    label: 'Nexus',
    items: [
      {
        path: '/nexus/analyst-workspace',
        label: 'Analyst Workspace',
        icon: Terminal,
        comp: L(() => import('./pages/nexus/analyst-workspace')),
      },
      {
        path: '/nexus/cross-domain-correlation',
        label: 'Cross-Domain Correlation',
        icon: GitMerge,
        comp: L(() => import('./pages/nexus/cross-domain-correlation')),
      },
      {
        path: '/nexus/decision-support',
        label: 'Decision Support',
        icon: Target,
        comp: L(() => import('./pages/nexus/decision-support')),
      },
      {
        path: '/nexus/early-warning',
        label: 'Early Warning',
        icon: AlertTriangle,
        comp: L(() => import('./pages/nexus/early-warning')),
      },
      {
        path: '/nexus/executive-briefing',
        label: 'Executive Briefing',
        icon: FileText,
        comp: L(() => import('./pages/nexus/executive-briefing')),
      },
      {
        path: '/nexus/geopolitical-risk',
        label: 'Geopolitical Risk',
        icon: Globe,
        comp: L(() => import('./pages/nexus/geopolitical-risk-scoring')),
      },
      {
        path: '/nexus/historical-patterns',
        label: 'Historical Patterns',
        icon: BookOpen,
        comp: L(() => import('./pages/nexus/historical-patterns')),
      },
      {
        path: '/nexus/osint-pipeline',
        label: 'OSINT Pipeline',
        icon: Search,
        comp: L(() => import('./pages/nexus/osint-pipeline')),
      },
      {
        path: '/nexus/scenario-wargaming',
        label: 'Scenario Wargaming',
        icon: Swords,
        comp: L(() => import('./pages/nexus/scenario-wargaming')),
      },
      {
        path: '/nexus/threat-actor-profiling',
        label: 'Actor Profiling',
        icon: Users,
        comp: L(() => import('./pages/nexus/threat-actor-profiling')),
      },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    items: [
      {
        path: '/governance/agent-config',
        label: 'Agent Config',
        icon: SettingsIcon,
        comp: L(() => import('./pages/governance/agent-config')),
      },
      {
        path: '/governance/canonical-demo',
        label: 'Canonical Demo',
        icon: Play,
        comp: L(() => import('./pages/governance/canonical-demo')),
      },
      {
        path: '/governance/enterprise',
        label: 'Enterprise Governance',
        icon: Building2,
        comp: L(() => import('./pages/governance/enterprise-governance')),
      },
      {
        path: '/governance/executive-reports',
        label: 'Executive Reports',
        icon: FileText,
        comp: L(() => import('./pages/governance/executive-reports')),
      },
      {
        path: '/governance/incident-analytics',
        label: 'Incident Analytics',
        icon: BarChart3,
        comp: L(() => import('./pages/governance/incident-analytics')),
      },
      {
        path: '/governance/integration-hub',
        label: 'Integration Hub',
        icon: Boxes,
        comp: L(() => import('./pages/governance/integration-hub')),
      },
      {
        path: '/governance/operator-analytics',
        label: 'Operator Analytics',
        icon: BarChart3,
        comp: L(() => import('./pages/governance/operator-analytics')),
      },
      {
        path: '/governance/trust-analytics',
        label: 'Trust Analytics',
        icon: ShieldCheck,
        comp: L(() => import('./pages/governance/trust-analytics')),
      },
      {
        path: '/governance/trust-positioning',
        label: 'Trust Positioning',
        icon: Target,
        comp: L(() => import('./pages/governance/trust-positioning')),
      },
      {
        path: '/governed-cockpit',
        label: 'Governed Intelligence',
        icon: Shield,
        comp: L(() => import('./pages/governed-cockpit')),
      },
    ],
  },
  {
    id: 'atlas',
    label: 'ATLAS Spatial Runtime',
    items: [
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
        path: '/threat-twin-view',
        label: 'Threat Twin',
        icon: Shield,
        comp: L(() => import('./pages/threat-twin-view')),
      },
      {
        path: '/replay',
        label: 'Incident Replay',
        icon: RotateCcw,
        comp: L(() => import('./pages/replay')),
      },
      {
        path: '/scenario-branches',
        label: 'Scenario Branches',
        icon: GitBranch,
        comp: L(() => import('./pages/scenario-branches')),
      },
      {
        path: '/atlas-execute',
        label: 'ATLAS Execute',
        icon: Play,
        comp: L(() => import('./pages/atlas-execute')),
      },
      {
        path: '/atlas-artifacts',
        label: 'ATLAS Artifacts',
        icon: Boxes,
        comp: L(() => import('./pages/atlas-artifacts')),
      },
    ],
  },
  {
    id: 'exercises',
    label: 'Exercises & War Rooms',
    items: [
      {
        path: '/purple-team',
        label: 'Purple Team',
        icon: Swords,
        comp: L(() => import('./pages/purple-team')),
      },
      {
        path: '/phantom-purple',
        label: 'Phantom Purple',
        icon: Swords,
        comp: L(() => import('./pages/phantom-purple-exercise')),
      },
      {
        path: '/phantom-tabletop',
        label: 'Phantom Tabletop',
        icon: ClipboardList,
        comp: L(() => import('./pages/phantom-tabletop')),
      },
      {
        path: '/phantom-war-room',
        label: 'Phantom War Room',
        icon: Radio,
        comp: L(() => import('./pages/phantom-war-room')),
      },
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
        label: 'Citadel After Action',
        icon: FileText,
        comp: L(() => import('./pages/citadel-after-action')),
      },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced & Experimental',
    items: [
      {
        path: '/digital-twin',
        label: 'Digital Twin',
        icon: Layers3,
        comp: L(() => import('./pages/digital-twin')),
      },
      {
        path: '/consciousness',
        label: 'Consciousness',
        icon: Brain,
        comp: L(() => import('./pages/consciousness')),
      },
      {
        path: '/constellation',
        label: 'Constellation',
        icon: Sparkles,
        comp: L(() => import('./pages/constellation')),
      },
      {
        path: '/worldline',
        label: 'Worldline Registry',
        icon: Database,
        comp: L(() => import('./pages/worldline-registry')),
      },
      {
        path: '/adaptive-defense',
        label: 'Adaptive Defense Shield',
        icon: Shield,
        comp: L(() => import('./pages/adaptive-defense-shield')),
      },
      {
        path: '/observability',
        label: 'Observability',
        icon: Telescope,
        comp: L(() => import('./pages/observability')),
      },
      {
        path: '/reports',
        label: 'Reports',
        icon: FileText,
        comp: L(() => import('./pages/reports-page')),
      },
      {
        path: '/document-engine',
        label: 'Document Engine',
        icon: FileCode,
        comp: L(() => import('./pages/document-engine')),
      },
      {
        path: '/legal/overview',
        label: 'Legal Workspace',
        icon: Scale,
        comp: L(() => import('./pages/legal-workspace')),
      },
      {
        path: '/legal/matters',
        label: 'Legal · Matters',
        icon: FileText,
        comp: L(() => import('./pages/legal-workspace')),
      },
      {
        path: '/legal/deadlines',
        label: 'Legal · Deadlines',
        icon: Clock,
        comp: L(() => import('./pages/legal-workspace')),
      },
      {
        path: '/legal/ai',
        label: 'Legal · AI Recommendations',
        icon: Sparkles,
        comp: L(() => import('./pages/legal-workspace')),
      },
      {
        path: '/legal',
        label: 'Legal Workspace',
        icon: Scale,
        comp: L(() => import('./pages/legal-workspace')),
        hideFromSidebar: true,
      },
      {
        path: '/powerbi',
        label: 'PowerBI Report',
        icon: BarChart3,
        comp: L(() => import('./pages/powerbi-report')),
      },
      {
        path: '/settings',
        label: 'Settings',
        icon: SettingsIcon,
        comp: L(() => import('./pages/settings/unified-settings')),
      },
      {
        path: '/aef-search',
        label: 'AEF Knowledge Search',
        icon: Database,
        comp: L(() => import('./pages/aef-knowledge-search')),
      },
    ],
  },
];

const ALL_ROUTES: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

const SLIDES_NAV: NavItem = {
  path: '/slides',
  label: 'Investor Deck',
  icon: Presentation,
  comp: L(() => import('./pages/aegis-home')),
};

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <div className="w-5 h-5 border-2 border-red-500/40 border-t-red-400 rounded-full animate-spin" />
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
    ],
  };
  const sections: SidebarNavSection[] = NAV_SECTIONS.map((sec) => ({
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
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' }}
          >
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          {expanded && (
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-red-50 truncate tracking-tight">Aegis</h1>
              <p className="text-[10px] truncate font-mono uppercase tracking-wider text-red-400/40">
                SZL Holdings
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
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.08)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-red-400/70">
                  Aegis Runtime Live
                </span>
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

function DashboardRoutes() {
  return (
    <Switch>
      {ALL_ROUTES.map(({ path, comp: Comp }) => (
        <Route key={path} path={path}>
          <Suspense fallback={<PageLoader />}>
            <Comp />
          </Suspense>
        </Route>
      ))}
      <Route>
        <div className="flex flex-col items-center justify-center h-full p-10 text-center">
          <Shield className="w-10 h-10 text-red-400/50 mb-4" />
          <h1 className="text-xl font-bold text-red-100 mb-2">Page not found</h1>
          <p className="text-sm text-red-400/60 mb-6">That route isn't wired up yet.</p>
          <Link href="/" className="text-xs text-red-300 hover:text-red-200 underline">
            Return home
          </Link>
        </div>
      </Route>
    </Switch>
  );
}

function SlideDeck() {
  function getInitialSlide(): number {
    const match = window.location.pathname.match(/slide(?:s\/)?(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= 1 && n <= TOTAL) return n;
    }
    return 1;
  }

  const isEmbed =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('embed') === '1';

  const [current, setCurrent] = useState(getInitialSlide);
  const Slide = SLIDES[current - 1];
  const channelRef = useRef<BroadcastChannel | null>(null);

  const goTo = useCallback(
    (n: number) => {
      const clamped = Math.min(Math.max(n, 1), TOTAL);
      setCurrent(clamped);
      history.replaceState(null, '', `${BASE}/slides/${clamped}${isEmbed ? '?embed=1' : ''}`);
      channelRef.current?.postMessage({ type: 'audience:current', slide: clamped });
    },
    [isEmbed],
  );

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('aegis-deck-sync');
    channelRef.current = channel;
    channel.onmessage = (ev) => {
      const data = ev.data ?? {};
      if (data.type === 'presenter:goto' && typeof data.slide === 'number') {
        setCurrent((c) => {
          if (c === data.slide) return c;
          history.replaceState(
            null,
            '',
            `${BASE}/slides/${data.slide}${isEmbed ? '?embed=1' : ''}`,
          );
          return data.slide;
        });
      } else if (data.type === 'presenter:hello') {
        setCurrent((c) => {
          channel.postMessage({ type: 'audience:current', slide: c });
          return c;
        });
      }
    };
    channel.postMessage({ type: 'audience:current', slide: current });
    return () => {
      channel.close();
      channelRef.current = null;
    };
    // current intentionally excluded — channel is keyed once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmbed]);

  useEffect(() => {
    if (isEmbed) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        const url = `${BASE}/slides/presenter?slide=${current}`;
        window.open(url, 'aegis-presenter', 'width=1280,height=860,noopener');
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        setCurrent((c) => {
          const next = Math.min(c + 1, TOTAL);
          history.replaceState(null, '', `${BASE}/slides/${next}`);
          channelRef.current?.postMessage({ type: 'audience:current', slide: next });
          return next;
        });
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        setCurrent((c) => {
          const prev = Math.max(c - 1, 1);
          history.replaceState(null, '', `${BASE}/slides/${prev}`);
          channelRef.current?.postMessage({ type: 'audience:current', slide: prev });
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}
      onClick={() => {
        if (!isEmbed) goTo(current + 1);
      }}
    >
      {isEmbed ? (
        <Slide />
      ) : (
        <div
          key={current}
          className="szl-slide-anim"
          data-variant={
            (Slide as { displayName?: string; name?: string }).displayName?.includes('Divider') ||
            (Slide as { displayName?: string; name?: string }).name?.includes('Divider')
              ? 'dramatic'
              : 'default'
          }
        >
          <Slide />
        </div>
      )}
      {!isEmbed && (
        <div
          style={{
            position: 'fixed',
            bottom: '2.5vh',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '0.5vw',
            zIndex: 100,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i + 1)}
              style={{
                width: i + 1 === current ? '2.2vw' : '0.55vw',
                height: '0.35vh',
                minHeight: '3px',
                borderRadius: '2px',
                background: i + 1 === current ? '#0cc8d9' : 'rgba(255,255,255,0.18)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
      {!isEmbed && (
        <Link
          href="/"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: '2vh',
            left: '2vw',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            textDecoration: 'none',
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '6px',
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
              background: 'rgba(99,102,241,0.18)',
              border: '1px solid rgba(99,102,241,0.45)',
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

  const navCommands: CommandItem[] = ALL_ROUTES.map((item) => ({
    id: `nav-${item.path}`,
    label: item.label,
    group: 'Navigate',
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

  if (location === '/' || location === '') {
    return (
      <>
        <EcosystemNav currentAppId="aegis" currentAppName="Aegis" accentColor={accent} />
        <Suspense fallback={<div style={{ height: '100vh', background: '#080510' }} />}>
          <HomePage />
        </Suspense>
        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          commands={paletteCommands}
          appName="Aegis"
          accentColor={accent}
          placeholder="Search Aegis — pages, entities, actions..."
        />
      </>
    );
  }

  return (
    <PrivateAppGuard appName="Aegis" accentColor={AEGIS_BRAND_ACCENT}>
      <div className="flex flex-col h-screen" style={{ background: '#080510' }}>
        <EcosystemNav currentAppId="aegis" currentAppName="Aegis" accentColor={accent} />
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
                className="p-1.5 rounded transition-colors text-red-400/50"
                aria-label="Toggle navigation"
              >
                <Menu className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400/80">
                Aegis
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
          appName="Aegis"
          accentColor={accent}
          placeholder="Search Aegis — pages, entities, actions..."
        />
      </div>
    </PrivateAppGuard>
  );
}

export default function App() {
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
