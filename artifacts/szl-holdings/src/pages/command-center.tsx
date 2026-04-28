import { useStandardQuery } from '@szl-holdings/api-client-react';
import { color } from '@szl-holdings/design-system';
import { HelpTip } from '@szl-holdings/shared-ui/onboarding';
import { m } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Building,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Database,
  Eye,
  FileText,
  GitBranch,
  Globe,
  Grid,
  Layers,
  List,
  Map,
  Minus,
  Palette,
  Radio,
  RefreshCw,
  Rocket,
  Search,
  Shield,
  Ship,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { HoldingsGraphQLPanel } from '@/components/graphql-data-panel';
import {
  RecommendationExplainer,
  SAMPLE_RECOMMENDATIONS,
} from '@/components/RecommendationExplainer';
import { cn } from '@/lib/utils';

const apps = [
  {
    id: 'aegis',
    name: 'Aegis',
    subtitle: 'Defense & Intelligence Command',
    category: 'security',
    status: 'live',
    icon: Shield,
    accent: '#6366f1',
    path: '/aegis/',
    obsSlug: 'aegis',
    description:
      'Unified platform consolidating Security Operations (SOC/XDR), Managed Services (MSP/NOC), and AI Intelligence (model registry, agentic cortex) under one command surface.',
    features: ['SOC Dashboard', 'MSP Operations', 'AI Intelligence', 'MITRE ATT&CK'],
    kpi: '$25M+ ARR',
    market: '$266B TAM',
  },
  {
    id: 'terra',
    name: 'Terra',
    subtitle: 'Property Intelligence — OBSERVE',
    category: 'intelligence',
    status: 'live',
    icon: Building,
    accent: '#4d7c0f',
    path: '/terra/',
    obsSlug: 'terra',
    description:
      'NYC real estate intelligence platform surfacing distressed properties, tracking ownership structures, managing deal pipelines, and delivering market intelligence for brokers, investors, and portfolio teams.',
    features: ['Distress Engine', 'Deal Pipeline', 'Market Intel', 'Property Map'],
    kpi: '$3.1M ARR',
    market: '$29B TAM',
  },
  {
    id: 'vessels',
    name: 'Vessels',
    subtitle: 'Maritime Intelligence',
    category: 'intelligence',
    status: 'live',
    icon: Ship,
    accent: '#3b82f6',
    path: '/vessels/',
    obsSlug: 'vessels',
    description:
      'Full-spectrum maritime domain awareness: AIS anomaly detection, dark vessel tracking, sanctions compliance, and route risk analytics.',
    features: ['Fleet Tracking', 'Port Analytics', 'Routes', 'Risk Assessment'],
    kpi: '$8.2M ARR',
    market: '$15.4B TAM',
  },
  {
    id: 'lyte',
    name: 'Lyte',
    subtitle: 'Business Observability',
    category: 'operations',
    status: 'live',
    icon: Zap,
    accent: '#f59e0b',
    path: '/command/operations/',
    obsSlug: 'lyte',
    description:
      'Centralized AIOps and MLOps platform for signal detection, incident orchestration, model governance, and autonomous remediation.',
    features: ['Signals', 'Incidents', 'Playbooks', 'Administration'],
    kpi: '$4.2M ARR',
    market: '$1.8T TAM',
  },
  {
    id: 'continuum-predictive',
    name: 'Counsel — Predictive',
    subtitle: 'Execution Fabric — ENGINE',
    category: 'ai',
    status: 'live',
    icon: Palette,
    accent: '#6366f1',
    path: '/continuum/creative',
    obsSlug: 'continuum',
    description:
      "Counsel's predictive intelligence layer — scenario modeling, confidence scoring, and decision intelligence powering the UNDERSTAND layer across the SZL ecosystem.",
    features: ['Scenario Modeling', 'Confidence Scoring', 'Prediction Studio', 'Risk Analysis'],
    kpi: '$5.1M ARR',
    market: '$14.8B TAM',
  },
  {
    id: 'carlota-jo',
    name: 'Carlota Jo',
    subtitle: 'Brand Intelligence',
    category: 'creative',
    status: 'beta',
    icon: Globe,
    accent: '#f472b6',
    path: '/carlota-jo/',
    obsSlug: 'carlota-jo',
    description:
      'AI-enhanced brand strategy engine synthesizing consumer sentiment, competitive landscape analysis, and cultural positioning intelligence.',
    features: ['Brand Strategy', 'Sentiment Analysis', 'Competitive Intel', 'Positioning'],
    kpi: 'Private Alpha',
    market: '$8.4B TAM',
  },
];

const categories = [
  { id: 'all', label: 'All' },
  { id: 'security', label: 'Security' },
  { id: 'intelligence', label: 'Intelligence' },
  { id: 'operations', label: 'Operations' },
  { id: 'ai', label: 'AI' },
  { id: 'creative', label: 'Creative' },
];

const kpiStrip = [
  { label: 'Portfolio ARR', value: '$35M+', trend: '+142% YoY', up: true },
  { label: 'Addressable Market', value: '$2.4B+', trend: '6 verticals', up: true },
  { label: 'Platforms Live', value: '7', trend: '1 beta', up: true },
  { label: 'Daily AI Inferences', value: '18M+', trend: 'Lyte AI fabric', up: true },
  { label: 'Deployed Capital', value: '$180M+', trend: 'Since 2021', up: true },
  { label: 'Continents Active', value: '3', trend: 'DC · London · Singapore', up: true },
];

const WATCHLIST_DELTAS = [
  {
    entity: 'MV Adriatic Star',
    domain: 'Vessels',
    change: 'AIS gap 6h20m',
    severity: 'high',
    dir: 'down',
    icon: Ship,
  },
  {
    entity: 'CVE-2025-1337',
    domain: 'Aegis',
    change: 'KEV exploitation confirmed',
    severity: 'critical',
    dir: 'down',
    icon: Shield,
  },
  {
    entity: 'NYC Portfolio Cluster A',
    domain: 'Terra',
    change: '+2 properties at distress threshold',
    severity: 'medium',
    dir: 'down',
    icon: Building,
  },
  {
    entity: 'Counsel Approval Queue',
    domain: 'Platform',
    change: '14 pending, 6 exceed 72h SLA',
    severity: 'high',
    dir: 'down',
    icon: Zap,
  },
  {
    entity: 'OFAC SDN List',
    domain: 'Compliance',
    change: 'Updated — 4 new designations',
    severity: 'info',
    dir: 'up',
    icon: CheckCircle2,
  },
];

const PENDING_ACTIONS = [
  {
    id: 'pa1',
    title: 'Isolate auth-svc, api-gw, reporting hosts',
    domain: 'Aegis',
    priority: 'critical',
    due: 'T+2h',
    owner: null,
  },
  {
    id: 'pa2',
    title: 'OFAC screening — MV Adriatic Star',
    domain: 'Vessels',
    priority: 'high',
    due: 'T+6h',
    owner: 'K. Vasile',
  },
  {
    id: 'pa3',
    title: 'File HC-2025-0487 — owner unassigned',
    domain: 'PRAXIS',
    priority: 'high',
    due: 'T+38h',
    owner: null,
  },
  {
    id: 'pa4',
    title: 'Remediate AWS egress rule sg-0xf823b1a',
    domain: 'IMPERIUM',
    priority: 'medium',
    due: 'T+24h',
    owner: null,
  },
];

const CROSS_DOMAIN_CORRELATIONS = [
  {
    from: 'Aegis',
    to: 'IMPERIUM',
    type: 'causal',
    label: 'KEV exploit → cloud drift vector',
    strength: 0.87,
  },
  {
    from: 'Vessels',
    to: 'Terra',
    type: 'temporal',
    label: 'Dark vessel ↔ portfolio exposure',
    strength: 0.54,
  },
  {
    from: 'Counsel',
    to: 'Aegis',
    type: 'causal',
    label: 'Approval stall → incident response lag',
    strength: 0.63,
  },
];

const STALE_SOURCES = [
  { source: 'CoStar Market Data', domain: 'Terra', staleFor: '5h', errorMsg: 'Auth token expired' },
  { source: 'NVD CVE Feed', domain: 'Aegis', staleFor: '3h', errorMsg: 'Rate limit exceeded' },
];

const POSTURE_TREND = [71, 74, 73, 76, 74, 72, 75, 76, 75, 78, 76, 78];

const AI_BRIEF_PARAGRAPHS = [
  'The SZL ecosystem is operating at a composite posture of 76/100 — moderately elevated risk across security and operational dimensions. Two critical items require executive attention within the next two hours.',
  'Aegis has confirmed active exploitation of CVE-2025-1337 across three internal hosts (auth-svc, api-gw, reporting). Correlated IMPERIUM drift confirms the attack vector was the unrestricted egress rule on sg-0xf823b1a. Isolation and remediation are the immediate priority.',
  "Vessels flags MV Adriatic Star with a 6h20m AIS dark gap last fixed at Strait of Messina. OFAC screening is in progress. The temporal correlation with Terra's NYC portfolio distress cluster warrants monitoring but does not indicate direct causation.",
  'Platform operations: 14 Counsel workflows are queued, six exceeding the 72-hour SLA threshold, which is compounding response latency in the Aegis incident stream. Escalation required.',
];

const SEV_COLORS: Record<string, string> = {
  critical: color.accent.red,
  high: color.accent.amber,
  medium: color.accent.amber,
  info: color.accent.blue,
};

function PosturePanel({ score, trend }: { score: number; trend: number[] }) {
  const prev = trend[trend.length - 2] ?? score;
  const delta = score - prev;
  const color = score >= 80 ? '#22c55e' : score >= 65 ? '#eab308' : '#ef4444';
  const label = score >= 80 ? 'Strong' : score >= 65 ? 'Moderate Risk' : 'Elevated Risk';

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" />
          Operational Posture
        </h3>
        <Link
          href="/command/health"
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          Details <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="4"
            />
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeDasharray={`${(score / 100) * 138.2} 138.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold font-mono" style={{ color }}>
              {score}
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color }}>
            {label}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            {delta > 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            ) : delta < 0 ? (
              <TrendingDown className="w-3 h-3 text-red-500" />
            ) : (
              <Minus className="w-3 h-3 text-muted-foreground" />
            )}
            <span
              className={cn(
                'text-[10px] font-mono',
                delta > 0
                  ? 'text-emerald-500'
                  : delta < 0
                    ? 'text-red-500'
                    : 'text-muted-foreground',
              )}
            >
              {delta > 0 ? '+' : ''}
              {delta} vs prior
            </span>
          </div>
          <div className="flex items-end gap-px h-6 mt-2">
            {trend.map((v, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${((v - 60) / 30) * 100}%`,
                  background: i === trend.length - 1 ? color : `${color}44`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function WatchlistPanel() {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-primary" />
          Watchlist Deltas
        </h3>
        <span className="text-[10px] text-muted-foreground">Session</span>
      </div>
      <div className="space-y-2">
        {WATCHLIST_DELTAS.map((delta, i) => {
          const Icon = delta.icon;
          const sevColor = SEV_COLORS[delta.severity] ?? '#38bdf8';
          return (
            <div key={i} className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: `${sevColor}15` }}
              >
                <Icon className="w-2.5 h-2.5" style={{ color: sevColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground leading-tight truncate">
                  {delta.entity}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{delta.change}</p>
              </div>
              <span
                className="text-[10px] font-mono font-bold shrink-0"
                style={{ color: sevColor }}
              >
                {delta.severity.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrossDomainChips() {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
        <GitBranch className="w-3.5 h-3.5 text-primary" />
        Cross-Domain Correlations
      </h3>
      <div className="space-y-2">
        {CROSS_DOMAIN_CORRELATIONS.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0"
          >
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-bold font-mono text-primary">{c.from}</span>
              <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[10px] font-bold font-mono text-muted-foreground">{c.to}</span>
            </div>
            <p className="text-[10px] text-muted-foreground flex-1 truncate">{c.label}</p>
            <span className="text-[10px] font-mono text-amber-500 shrink-0">
              {(c.strength * 100).toFixed(0)}%
            </span>
          </div>
        ))}
        <Link
          href="/lyte/signal-fusion"
          className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1"
        >
          Signal Fusion Panel <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
    </div>
  );
}

function AIBriefPanel() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          AI Executive Brief
        </h3>
        <span className="text-[10px] text-muted-foreground font-mono">Counsel · 4m ago</span>
      </div>
      <div className="space-y-2">
        {AI_BRIEF_PARAGRAPHS.slice(0, expanded ? undefined : 2).map((para, i) => (
          <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">
            {para}
          </p>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-[10px] text-primary hover:underline flex items-center gap-1"
        >
          {expanded ? 'Collapse' : 'Read full brief'}{' '}
          <ChevronDown className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} />
        </button>
        <Link
          href="/pulse/"
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 ml-auto"
        >
          Open Pulse <ArrowUpRight className="w-2.5 h-2.5" />
        </Link>
      </div>
      <div className="mt-3 pt-3 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground mb-1.5 font-mono uppercase tracking-wide">
          Evidence sources
        </p>
        <div className="flex flex-wrap gap-1">
          {['Aegis SOC', 'Vessels AIS', 'OFAC SDN', 'PRAXIS Calendar', 'IMPERIUM Drift'].map(
            (src) => (
              <span
                key={src}
                className="px-1.5 py-0.5 bg-muted/50 text-[9px] rounded font-mono text-muted-foreground border border-border/50"
              >
                {src}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function StaleSourcesWarning() {
  if (STALE_SOURCES.length === 0) return null;
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-xs font-semibold text-amber-500">
          {STALE_SOURCES.length} Stale Data Sources
        </span>
        <Link
          href="/lyte/health-freshness"
          className="text-[10px] text-amber-400 hover:underline ml-auto flex items-center gap-1"
        >
          Health & Freshness <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
      <div className="space-y-1.5">
        {STALE_SOURCES.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <Database className="w-3 h-3 text-amber-500/60 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground">{s.source}</p>
              <p className="text-[10px] text-muted-foreground">
                {s.domain} · stale {s.staleFor} · {s.errorMsg}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingActionsPanel() {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-primary" />
          Pending Actions
          <HelpTip
            tipId="szl.command-center.pending-actions"
            platform="szl"
            title="Pending Actions"
            content="Decisions waiting on a human approver. Each row shows the affected domain, due window, and severity. Unowned actions are highlighted so they don't sit in the queue."
            iconSize={12}
          />
        </h3>
        <span className="text-[10px] text-red-400 font-mono">
          {PENDING_ACTIONS.filter((a) => !a.owner).length} unowned
        </span>
      </div>
      <div className="space-y-2">
        {PENDING_ACTIONS.map((action) => {
          const sevColor = SEV_COLORS[action.priority] ?? '#38bdf8';
          return (
            <div
              key={action.id}
              className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0"
            >
              <div
                className="w-1 h-1 rounded-full mt-1.5 shrink-0"
                style={{ background: sevColor }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-foreground leading-tight">{action.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {action.domain}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: sevColor }}>
                    {action.due}
                  </span>
                  {!action.owner && <span className="text-[10px] text-red-400">Unassigned</span>}
                  {action.owner && (
                    <span className="text-[10px] text-muted-foreground">{action.owner}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TerraLeaseRow {
  id: string;
  tiAllowance: number;
  expirationDate: string;
}

interface TerraTaxAppealRow {
  id: string;
  appealStatus: 'eligible' | 'filed' | 'hearing' | 'won' | 'lost' | 'not-eligible';
  potentialSavings: number;
}

interface TerraConstructionRow {
  id: string;
  status: 'on-track' | 'behind' | 'at-risk' | 'complete';
  totalBudget: number;
  totalSpent: number;
}

interface TerraLeasesResponse {
  count: number;
  leases: TerraLeaseRow[];
  dataMode: string;
}

interface TerraTaxAppealsResponse {
  count: number;
  properties: TerraTaxAppealRow[];
  dataMode: string;
}

interface TerraConstructionResponse {
  count: number;
  projects: TerraConstructionRow[];
  dataMode: string;
}

function useTerraIntel() {
  const leases = useStandardQuery<TerraLeasesResponse>({
    queryKey: ['terra-portfolio-leases'],
    queryFn: async () => {
      const res = await fetch('/terra/leases');
      if (!res.ok) throw new Error('terra leases unavailable');
      return res.json();
    },
    refetchInterval: 60000,
    retry: 1,
  });
  const taxAppeals = useStandardQuery<TerraTaxAppealsResponse>({
    queryKey: ['terra-portfolio-tax-appeals'],
    queryFn: async () => {
      const res = await fetch('/terra/tax-appeals');
      if (!res.ok) throw new Error('terra tax appeals unavailable');
      return res.json();
    },
    refetchInterval: 60000,
    retry: 1,
  });
  const construction = useStandardQuery<TerraConstructionResponse>({
    queryKey: ['terra-portfolio-construction'],
    queryFn: async () => {
      const res = await fetch('/terra/construction-projects');
      if (!res.ok) throw new Error('terra construction unavailable');
      return res.json();
    },
    refetchInterval: 60000,
    retry: 1,
  });
  return { leases, taxAppeals, construction };
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function TerraIntelPanel() {
  const { leases, taxAppeals, construction } = useTerraIntel();
  const isLoading = leases.isLoading || taxAppeals.isLoading || construction.isLoading;

  const today = new Date();
  const leaseRows = leases.data?.leases ?? [];
  const activeLeases = leaseRows.filter(
    (l) => !l.expirationDate || new Date(l.expirationDate) >= today,
  );
  const leaseCount = activeLeases.length;
  const totalTI = activeLeases.reduce((s, l) => s + (l.tiAllowance || 0), 0);

  const appealRows = taxAppeals.data?.properties ?? [];
  const activeAppeals = appealRows.filter(
    (a) => a.appealStatus === 'filed' || a.appealStatus === 'hearing',
  ).length;
  const totalSavings = appealRows.reduce((s, a) => s + (a.potentialSavings || 0), 0);

  const projectRows = construction.data?.projects ?? [];
  const activeProjects = projectRows.filter((p) => p.status !== 'complete');
  const onTrackCount = activeProjects.filter((p) => p.status === 'on-track').length;
  const atRiskCount = activeProjects.filter(
    (p) => p.status === 'behind' || p.status === 'at-risk',
  ).length;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5" style={{ color: '#4d7c0f' }} />
          Terra Intel
        </h3>
        <a
          href="/terra/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
        >
          Terra <ArrowUpRight className="w-2.5 h-2.5" />
        </a>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5 py-2 border-b border-border/30">
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-lime-900/20">
              <FileText className="w-3.5 h-3.5 text-lime-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground leading-tight">
                Lease Abstraction
              </p>
              {leases.error ? (
                <p className="text-[10px] text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> unavailable
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  TI exposure: {leases.data ? fmtMoney(totalTI) : '—'}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold font-mono text-foreground">
                {leases.error ? '—' : leaseCount}
              </p>
              <p className="text-[10px] text-muted-foreground">active</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 py-2 border-b border-border/30">
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-emerald-900/20">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground leading-tight">Tax Appeals</p>
              {taxAppeals.error ? (
                <p className="text-[10px] text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> unavailable
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  Potential: {taxAppeals.data ? fmtMoney(totalSavings) : '—'}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold font-mono text-foreground">
                {taxAppeals.error ? '—' : activeAppeals}
              </p>
              <p className="text-[10px] text-muted-foreground">in progress</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 py-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-amber-900/20">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground leading-tight">Construction</p>
              {construction.error ? (
                <p className="text-[10px] text-amber-500 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> unavailable
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">
                  {construction.data ? (
                    <>
                      <span className="text-emerald-500">{onTrackCount} on-track</span>
                      {atRiskCount > 0 && (
                        <span className="text-amber-500"> · {atRiskCount} at risk</span>
                      )}
                    </>
                  ) : (
                    '—'
                  )}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold font-mono text-foreground">
                {construction.error ? '—' : activeProjects.length}
              </p>
              <p className="text-[10px] text-muted-foreground">active</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AppHealth {
  appSlug: string;
  overallScore: number;
  overallStatus: string;
  events?: Array<{ label: string; timestamp: string; level: string }>;
  postureScore?: number;
  velocityTrend?: number;
}

interface ObservabilityResponse {
  portfolioScore: number;
  portfolioStatus: string;
  apps: AppHealth[];
  timestamp: string;
}

function useEcosystemHealth() {
  return useStandardQuery<ObservabilityResponse>({
    queryKey: ['ecosystem-health'],
    queryFn: async () => {
      const res = await fetch('/api/observability');
      if (!res.ok) throw new Error('health unavailable');
      return res.json();
    },
    refetchInterval: 30000,
    retry: 2,
  });
}

function StatusDot({ status, size = 'sm' }: { status: string; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5';
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          sz,
          'rounded-full',
          status === 'live'
            ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
            : status === 'beta'
              ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
              : 'bg-muted-foreground',
        )}
      />
      <span
        className={cn(
          'font-medium uppercase tracking-wider',
          size === 'lg' ? 'text-[11px]' : 'text-[10px]',
          status === 'live'
            ? 'text-emerald-500'
            : status === 'beta'
              ? 'text-amber-500'
              : 'text-muted-foreground',
        )}
      >
        {status}
      </span>
    </div>
  );
}

function HealthIndicator({ score, status }: { score?: number; status?: string }) {
  if (!score) return null;
  const color = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500';
  return <span className={cn('text-[10px] font-mono font-bold', color)}>{score}</span>;
}

function KpiStrip() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % kpiStrip.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="border-b border-border/40 bg-card/20 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6">
        <div className="hidden sm:flex items-center divide-x divide-border/40 overflow-x-auto">
          {kpiStrip.map((k) => (
            <div key={k.label} className="px-5 py-2.5 flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-foreground">{k.value}</span>
              <span className="text-[10px] text-muted-foreground">{k.label}</span>
              <span
                className={cn(
                  'text-[10px] font-medium',
                  k.up ? 'text-emerald-500' : 'text-red-500',
                )}
              >
                {k.trend}
              </span>
            </div>
          ))}
        </div>
        <div className="sm:hidden py-2.5 px-1">
          <m.div
            key={idx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs font-bold text-foreground">{kpiStrip[idx].value}</span>
            <span className="text-[10px] text-muted-foreground">{kpiStrip[idx].label}</span>
            <span className="text-[10px] font-medium text-emerald-500">{kpiStrip[idx].trend}</span>
          </m.div>
        </div>
      </div>
    </div>
  );
}

function ActivityFeed({
  events,
}: {
  events: Array<{ label: string; timestamp: string; level: string; appSlug?: string }>;
}) {
  return (
    <div className="space-y-1.5">
      {events.slice(0, 8).map((event, i) => {
        const app = apps.find((a) => a.obsSlug === event.appSlug);
        return (
          <div key={i} className="flex items-start gap-2.5 py-1.5">
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                event.level === 'error'
                  ? 'bg-red-500'
                  : event.level === 'warn'
                    ? 'bg-amber-500'
                    : event.level === 'success'
                      ? 'bg-emerald-500'
                      : 'bg-blue-500',
              )}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground/80">{event.label}</p>
              {app && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {app.name} · {event.appSlug}
                </p>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {new Date(event.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function EcosystemStatus({ health }: { health?: ObservabilityResponse }) {
  const score = health?.portfolioScore ?? null;
  const status = health?.portfolioStatus ?? 'unknown';

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-border/50 bg-card/30 backdrop-blur-sm">
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          status === 'healthy'
            ? 'bg-emerald-500 animate-pulse'
            : status === 'degraded'
              ? 'bg-amber-500'
              : 'bg-muted-foreground',
        )}
      />
      <span className="text-xs font-medium text-foreground">
        {status === 'healthy'
          ? 'All Systems Operational'
          : status === 'degraded'
            ? 'Degraded Performance'
            : 'Checking Ecosystem Health'}
      </span>
      {score !== null && (
        <span
          className={cn(
            'text-[11px] font-bold font-mono',
            score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500',
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

export default function CommandCenter() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const { data: health, isLoading: healthLoading, error: healthError } = useEcosystemHealth();

  const filtered = useMemo(() => {
    return apps.filter(
      (a) =>
        (category === 'all' || a.category === category) &&
        (search === '' ||
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.subtitle.toLowerCase().includes(search.toLowerCase()) ||
          a.description.toLowerCase().includes(search.toLowerCase())),
    );
  }, [search, category]);

  const appHealthMap = useMemo(() => {
    if (!health?.apps) return {};
    return Object.fromEntries(health.apps.map((a) => [a.appSlug, a]));
  }, [health]);

  const allEvents = useMemo(() => {
    if (!health?.apps) return [];
    return health.apps
      .flatMap((a) => (a.events ?? []).map((e) => ({ ...e, appSlug: a.appSlug })))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 12);
  }, [health]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-sm shadow-primary/20">
                <span className="text-white font-bold text-xs font-display">SZL</span>
              </div>
              <div>
                <h1 className="text-base font-display font-bold text-foreground leading-none">
                  SZL Holdings
                </h1>
                <p className="text-[11px] text-muted-foreground mt-0.5">Ecosystem Command Center</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <EcosystemStatus health={health} />
              <Link
                href="/corporate"
                className="hidden sm:flex text-xs text-muted-foreground hover:text-foreground transition-colors items-center gap-1"
              >
                Corporate <ArrowUpRight className="w-3 h-3" />
              </Link>
              <Link
                href="/insights"
                className="hidden sm:flex text-xs text-muted-foreground hover:text-foreground transition-colors items-center gap-1"
              >
                Insights <ArrowUpRight className="w-3 h-3" />
              </Link>
              <Link
                href="/roadmap"
                className="hidden md:flex text-xs text-muted-foreground hover:text-foreground transition-colors items-center gap-1"
              >
                <Map className="w-3 h-3" /> Roadmap
              </Link>
              <Link
                href="/admin"
                className="hidden md:flex text-xs text-muted-foreground hover:text-foreground transition-colors items-center gap-1"
              >
                Admin
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search platforms..."
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex gap-0.5 sm:gap-1 overflow-x-auto">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={cn(
                    'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                    category === c.id
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-0.5 ml-auto border border-border rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'grid'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <KpiStrip />

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {filtered.length} {filtered.length === 1 ? 'platform' : 'platforms'}
                  {search && ` matching "${search}"`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/analytics"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Analytics
                </Link>
                <Link
                  href="/spectrum"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                >
                  <Layers className="w-3.5 h-3.5" /> Spectrum
                </Link>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((app, i) => {
                  const AppIcon = app.icon;
                  const appHealth = appHealthMap[app.obsSlug];
                  return (
                    <m.a
                      key={app.id}
                      href={app.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.04 }}
                      className="group bg-card border border-border rounded-xl p-5 hover:border-border/80 hover:shadow-lg hover:shadow-black/10 transition-all duration-200 block"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${app.accent}15` }}
                        >
                          <AppIcon className="w-5 h-5" style={{ color: app.accent }} />
                        </div>
                        <div className="flex items-center gap-2">
                          {appHealth && (
                            <HealthIndicator
                              score={appHealth.overallScore}
                              status={appHealth.overallStatus}
                            />
                          )}
                          <StatusDot status={app.status} />
                        </div>
                      </div>
                      <h3 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors">
                        {app.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-2">
                        {app.subtitle}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                        {app.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {app.features.slice(0, 2).map((f) => (
                            <span
                              key={f}
                              className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[10px]"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {app.kpi}
                        </span>
                      </div>
                    </m.a>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((app, i) => {
                  const AppIcon = app.icon;
                  const appHealth = appHealthMap[app.obsSlug];
                  return (
                    <m.a
                      key={app.id}
                      href={app.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      className="group flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 hover:border-border/80 transition-all duration-200"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${app.accent}15` }}
                      >
                        <AppIcon className="w-4.5 h-4.5" style={{ color: app.accent }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold group-hover:text-primary transition-colors">
                            {app.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {app.subtitle}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{app.description}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[10px] font-semibold text-muted-foreground hidden sm:block">
                          {app.kpi}
                        </span>
                        {appHealth && <HealthIndicator score={appHealth.overallScore} />}
                        <StatusDot status={app.status} />
                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </m.a>
                  );
                })}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No platforms match your search</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {[
                {
                  label: 'Live',
                  items: apps.filter((a) => a.status === 'live'),
                  color: 'emerald',
                  icon: CheckCircle2,
                },
                {
                  label: 'Beta',
                  items: apps.filter((a) => a.status === 'beta'),
                  color: 'amber',
                  icon: RadioIcon,
                },
                {
                  label: 'Planned',
                  items: apps.filter((a) => a.status === 'planned'),
                  color: 'blue',
                  icon: Rocket,
                },
              ].map(({ label, items, color, icon: Icon }) => (
                <div
                  key={label}
                  className={cn(
                    'rounded-xl border p-4',
                    color === 'emerald'
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : color === 'amber'
                        ? 'border-amber-500/20 bg-amber-500/5'
                        : 'border-blue-500/20 bg-blue-500/5',
                  )}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        color === 'emerald'
                          ? 'bg-emerald-500'
                          : color === 'amber'
                            ? 'bg-amber-500'
                            : 'bg-blue-500',
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs font-semibold uppercase tracking-wider',
                        color === 'emerald'
                          ? 'text-emerald-500'
                          : color === 'amber'
                            ? 'text-amber-500'
                            : 'text-blue-500',
                      )}
                    >
                      {label}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {items.length} platform{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {items.length > 0 ? (
                    <div className="space-y-1.5">
                      {items.map((a) => {
                        const AI = a.icon;
                        return (
                          <div key={a.id} className="flex items-center gap-2">
                            <AI className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-foreground">{a.name}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {a.kpi}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">None currently</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            {/* Recommendations with explainability */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-xs font-semibold">Recommendations</h3>
                <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                  Counsel v2.4.1
                </span>
              </div>
              <div className="space-y-2">
                {SAMPLE_RECOMMENDATIONS.map((rec) => (
                  <RecommendationExplainer key={rec.id} rec={rec} />
                ))}
              </div>
            </div>

            {/* Posture Score */}
            <PosturePanel score={health?.portfolioScore ?? 76} trend={POSTURE_TREND} />

            {/* AI Executive Brief */}
            <AIBriefPanel />

            {/* Stale source warnings */}
            <StaleSourcesWarning />

            {/* Terra Intel — live portfolio data from Terra */}
            <TerraIntelPanel />

            {/* Watchlist Deltas */}
            <WatchlistPanel />

            {/* Cross-Domain Correlations */}
            <CrossDomainChips />

            {/* Pending Actions */}
            <PendingActionsPanel />

            {/* Live event feed */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-primary" />
                  Live Feed
                </h3>
                {healthLoading && (
                  <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
                )}
                {!healthLoading && !healthError && (
                  <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
              {allEvents.length > 0 ? (
                <ActivityFeed events={allEvents} />
              ) : (
                <div className="text-center py-4">
                  {healthLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 bg-muted/50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No recent events</p>
                  )}
                </div>
              )}
            </div>

            {/* Platform health mini-bar */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  Platform Health
                </h3>
                <Link
                  href="/lyte/health-freshness"
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  Freshness <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="space-y-2">
                {apps.slice(0, 6).map((app) => {
                  const AppIcon = app.icon;
                  const appHealth = appHealthMap[app.obsSlug];
                  const score = appHealth?.overallScore;
                  return (
                    <div key={app.id} className="flex items-center gap-2.5">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${app.accent}15` }}
                      >
                        <AppIcon className="w-3.5 h-3.5" style={{ color: app.accent }} />
                      </div>
                      <span className="text-xs text-foreground flex-1 truncate">{app.name}</span>
                      {score !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                score >= 80
                                  ? 'bg-emerald-500'
                                  : score >= 60
                                    ? 'bg-amber-500'
                                    : 'bg-red-500',
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              'text-[10px] font-mono',
                              score >= 80
                                ? 'text-emerald-500'
                                : score >= 60
                                  ? 'text-amber-500'
                                  : 'text-red-500',
                            )}
                          >
                            {score}
                          </span>
                        </div>
                      ) : (
                        <div className="w-12 h-1.5 bg-muted/30 rounded-full animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                Quick Access
              </h3>
              <div className="space-y-1">
                {[
                  { label: 'Notifications', href: '/notifications', icon: Bell },
                  { label: 'Health & Freshness', href: '/lyte/health-freshness', icon: Database },
                  { label: 'Signal Fusion', href: '/lyte/signal-fusion', icon: Radio },
                  { label: 'Investor Relations', href: '/ir', icon: TrendingUp },
                  { label: 'Insights & Research', href: '/insights', icon: Eye },
                  { label: 'Roadmap', href: '/roadmap', icon: Map },
                  { label: 'Admin', href: '/admin', icon: Cpu },
                ].map(({ label, href, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                      {label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary ml-auto transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <div className="border-t border-border mt-8">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {[
              { value: '$2.4B+', label: 'Combined Addressable Market' },
              { value: '142%', label: 'YoY Revenue Growth' },
              { value: '91%', label: 'Talent Retention Rate' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="text-center py-3 px-4 rounded-xl bg-card/50 border border-border/40"
              >
                <p className="text-lg font-bold font-display text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              &copy; {new Date().getFullYear()} SZL Holdings. All rights reserved.
            </p>
            <p className="text-[10px] text-muted-foreground/50 hidden sm:block">
              ◎ Signal · $ Impact · ◈ Anticipation · ⬡ Topology · ◆ Posture · ▲ Velocity
            </p>
          </div>
        </div>
      </div>

      <HoldingsGraphQLPanel />
    </div>
  );
}

function RadioIcon({ className }: { className?: string }) {
  return <Radio className={className} />;
}
