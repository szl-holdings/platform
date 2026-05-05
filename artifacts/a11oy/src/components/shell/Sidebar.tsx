import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutGrid, Palette, Mic2, Component, Rocket, ShieldCheck, Infinity, Archive,
  Beaker, Sparkles, Sigma, MessageSquare, Search, DollarSign, Brain, Gauge,
  ChevronDown, ChevronRight,
  Globe, Crosshair, Activity, Radio, BarChart3, Map, Shield, Server,
  Cpu, Eye, Zap, Network, Settings, Users, Terminal, Layers,
  Briefcase, FileText, Target, GitBranch, Database, Lock,
  GitFork, History, BookOpen, SquareTerminal
} from 'lucide-react';
import { cn } from '@szl-holdings/design-system';

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface NavItem {
  id: string;
  name: string;
  icon: React.ElementType;
  path: string;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const orchestrationItems: NavItem[] = [
  { id: 'console', name: 'Console', icon: SquareTerminal, path: '/console' },
  { id: 'atlas', name: 'Atlas', icon: LayoutGrid, path: '/atlas' },
  { id: 'tokens', name: 'Tokens', icon: Palette, path: '/tokens' },
  { id: 'voice', name: 'Voice', icon: Mic2, path: '/voice' },
  { id: 'library', name: 'Library', icon: Component, path: '/library' },
  { id: 'releases', name: 'Releases', icon: Rocket, path: '/releases' },
  { id: 'audit', name: 'Audit', icon: ShieldCheck, path: '/audit' },
  { id: 'andean', name: 'Andean Loop', icon: Infinity, path: '/andean-orchestration' },
  { id: 'archive', name: 'Portfolio Archive', icon: Archive, path: '/portfolio-archive' },
];

const strategySections: NavSection[] = [
  {
    id: 'strategy-core',
    label: 'Strategy',
    defaultOpen: true,
    items: [
      { id: 'strat-dashboard', name: 'Strategy Dashboard', icon: Globe, path: '/strategy' },
      { id: 'strat-briefing', name: 'Executive Briefing', icon: Briefcase, path: '/strategy/executive-briefing' },
      { id: 'strat-atlas-runtime', name: 'Atlas Runtime', icon: Zap, path: '/strategy/atlas-runtime' },
      { id: 'strat-enterprise', name: 'Enterprise State', icon: Layers, path: '/strategy/enterprise-state' },
      { id: 'strat-simulation', name: 'Simulation', icon: GitBranch, path: '/strategy/simulation' },
      { id: 'strat-stress', name: 'Crisis Stress Drill', icon: Activity, path: '/strategy/stress-drill' },
      { id: 'strat-gameday', name: 'Game Day Engine', icon: Target, path: '/strategy/game-day' },
      { id: 'strat-correlation', name: 'Correlation Map', icon: Network, path: '/strategy/correlation-map' },
      { id: 'strat-signals', name: 'Signal Chains', icon: Radio, path: '/strategy/signal-chains' },
      { id: 'strat-worldline', name: 'Worldline Registry', icon: FileText, path: '/strategy/worldline-registry' },
      { id: 'strat-cross', name: 'Cross-Platform Hub', icon: Globe, path: '/strategy/cross-platform/hub' },
      { id: 'strat-competitive', name: 'Competitive Atlas', icon: Map, path: '/strategy/competitive-atlas' },
      { id: 'strat-decisions', name: 'Decision Center', icon: Crosshair, path: '/decisions' },
    ],
  },
];

const operationsSections: NavSection[] = [
  {
    id: 'ops-observability',
    label: 'Operations',
    defaultOpen: false,
    items: [
      { id: 'ops-exec', name: 'Executive Command', icon: Gauge, path: '/operations' },
      { id: 'ops-noc', name: 'Autonomous NOC', icon: Eye, path: '/operations/autonomous-noc' },
      { id: 'ops-slo', name: 'SLO Management', icon: Target, path: '/operations/slo' },
      { id: 'ops-topology', name: 'Service Topology', icon: Network, path: '/operations/topology' },
      { id: 'ops-metrics', name: 'Metrics Explorer', icon: BarChart3, path: '/operations/metrics' },
      { id: 'ops-tracing', name: 'Distributed Tracing', icon: GitBranch, path: '/operations/tracing' },
      { id: 'ops-logs', name: 'Log Explorer', icon: Terminal, path: '/operations/logs' },
      { id: 'ops-alerts', name: 'Alert Management', icon: Radio, path: '/operations/alerts' },
      { id: 'ops-self-heal', name: 'Self-Healing', icon: Zap, path: '/operations/self-healing' },
      { id: 'ops-finops', name: 'FinOps', icon: DollarSign, path: '/operations/finops' },
      { id: 'ops-oncall', name: 'On-Call Center', icon: Users, path: '/operations/on-call' },
      { id: 'ops-runbook', name: 'Runbook Studio', icon: FileText, path: '/operations/runbook-studio' },
      { id: 'ops-deployments', name: 'Deployments', icon: Rocket, path: '/operations/deployments' },
      { id: 'ops-ai-ops', name: 'AI Quality Dashboard', icon: Brain, path: '/operations/ai-ops' },
    ],
  },
  {
    id: 'ops-admin',
    label: 'Admin Console',
    defaultOpen: false,
    items: [
      { id: 'admin-overview', name: 'Admin Overview', icon: Settings, path: '/operations/admin/overview' },
      { id: 'admin-users', name: 'Users', icon: Users, path: '/operations/admin/users' },
      { id: 'admin-flags', name: 'Feature Flags', icon: ShieldCheck, path: '/operations/admin/flags' },
      { id: 'admin-apps', name: 'Apps Registry', icon: Component, path: '/operations/admin/apps' },
      { id: 'admin-jobs', name: 'Jobs', icon: Cpu, path: '/operations/admin/jobs' },
      { id: 'admin-audit', name: 'Audit Log', icon: FileText, path: '/operations/admin/audit' },
    ],
  },
];

const infrastructureSections: NavSection[] = [
  {
    id: 'infra-imperium',
    label: 'Infrastructure',
    defaultOpen: false,
    items: [
      { id: 'infra-legatus', name: 'IMPERIUM Console', icon: Server, path: '/infrastructure/legatus' },
      { id: 'infra-map', name: 'Imperium Map', icon: Map, path: '/infrastructure/imperium-map' },
      { id: 'infra-praetorian', name: 'Praetorian Guard', icon: Shield, path: '/infrastructure/praetorian' },
      { id: 'infra-senate', name: 'Senate Chamber', icon: Briefcase, path: '/infrastructure/senate' },
      { id: 'infra-supply', name: 'Supply Lines', icon: Network, path: '/infrastructure/supply-lines' },
      { id: 'infra-centurion', name: 'Centurion AI', icon: Cpu, path: '/infrastructure/centurion' },
      { id: 'infra-geospatial', name: 'Geospatial Intel', icon: Globe, path: '/infrastructure/geospatial' },
      { id: 'infra-data-fabric', name: 'Data Fabric', icon: Database, path: '/infrastructure/data-fabric' },
      { id: 'infra-coalition', name: 'Coalition', icon: Users, path: '/infrastructure/coalition' },
    ],
  },
];

const cognitiveSections: NavSection[] = [
  {
    id: 'cognitive-runtime',
    label: 'Cognitive Runtime',
    defaultOpen: false,
    items: [
      { id: 'cog-overview', name: 'Cognitive Overview', icon: Brain, path: '/cognitive/overview' },
      { id: 'cog-memory', name: 'Memory', icon: Database, path: '/cognitive/memory' },
      { id: 'cog-planner', name: 'Planner', icon: Target, path: '/cognitive/planner' },
      { id: 'cog-verifier', name: 'Verifier', icon: ShieldCheck, path: '/cognitive/verifier' },
      { id: 'cog-reflection', name: 'Reflection', icon: Eye, path: '/cognitive/reflection' },
      { id: 'cog-traces', name: 'Traces', icon: GitBranch, path: '/cognitive/traces' },
      { id: 'cog-self-model', name: 'Self Model', icon: Sparkles, path: '/cognitive/self-model' },
      { id: 'cog-world-model', name: 'World Model', icon: Globe, path: '/cognitive/world-model' },
    ],
  },
];

const decisionIntelligenceItems: NavItem[] = [
  { id: 'di-overview', name: 'Command Overview', icon: Gauge, path: '/intelligence' },
  { id: 'di-deep-dive', name: 'Entity Deep Dive', icon: Search, path: '/intelligence/deep-dive' },
  { id: 'di-roi-lens', name: 'ROI Lens', icon: DollarSign, path: '/intelligence/roi-lens' },
  { id: 'di-propeller', name: 'Propeller Drive', icon: Brain, path: '/fabric/decisions' },
];

const intelligenceItems: NavItem[] = [
  { id: 'chat', name: 'Chat', icon: MessageSquare, path: '/chat' },
  { id: 'sigil', name: 'SIGIL', icon: Sigma, path: '/sigil' },
  { id: 'lab', name: 'A11oy Lab', icon: Beaker, path: '/lab' },
];

const platformItems: NavItem[] = [
  { id: 'substrate', name: 'Substrate Command', icon: Cpu, path: '/substrate' },
  { id: 'ecosystem', name: 'MCP Ecosystem', icon: Network, path: '/ecosystem' },
  { id: 'omnia', name: 'OMNIA Hub', icon: Sparkles, path: '/omnia' },
  { id: 'evolution', name: 'Evolution Runtime', icon: Zap, path: '/evolution' },
  { id: 'trust-center', name: 'Trust Center', icon: Lock, path: '/trust' },
  { id: 'governance', name: 'Governance', icon: ShieldCheck, path: '/governance' },
  { id: 'hook-packs', name: 'Hook Packs', icon: Zap, path: '/governance/hook-packs' },
  { id: 'routing-weights', name: 'Routing Weights', icon: Sigma, path: '/routing-weights' },
  { id: 'codex', name: 'Codex', icon: Brain, path: '/codex' },
];

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-a11oy-text-ghost)] mt-7 mb-2 px-3 first:mt-0">
      {children}
    </div>
  );
}

const reliquaryItems: NavItem[] = [
  { id: 'reliquary-vault', name: 'Vault Browser', icon: Database, path: '/reliquary/vault' },
  { id: 'reliquary-lineage', name: 'Lineage Graph', icon: GitFork, path: '/reliquary/lineage' },
  { id: 'reliquary-snapshots', name: 'Snapshot Replay', icon: History, path: '/reliquary/snapshots' },
  { id: 'reliquary-sovereign', name: 'Sovereign Mode', icon: Lock, path: '/reliquary/sovereign' },
  { id: 'reliquary-doctrine', name: 'Doctrine', icon: BookOpen, path: '/reliquary/doctrine' },
];

function CollapsibleSection({ section }: { section: NavSection }) {
  const [isOpen, setIsOpen] = useState(section.defaultOpen ?? false);
  const [location] = useLocation();

  const hasActiveChild = section.items.some(item => {
    const fullPath = `${BASE}${item.path}`;
    return location === fullPath || location.startsWith(fullPath + '/');
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          "flex items-center gap-2 w-full text-left text-[11px] font-medium uppercase tracking-wider mt-5 mb-1 px-3 transition-colors cursor-pointer",
          hasActiveChild
            ? "text-[var(--color-a11oy-gold-dim)]"
            : "text-[var(--color-a11oy-text-ghost)] hover:text-[var(--color-a11oy-text-sub)]"
        )}
      >
        {isOpen ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
        {section.label}
      </button>
      {isOpen && (
        <nav className="flex flex-col gap-0.5">
          {section.items.map(item => (
            <NavLink key={item.id} item={item} />
          ))}
        </nav>
      )}
    </div>
  );
}

function NavLink({ item }: { item: NavItem }) {
  const [location] = useLocation();
  const fullPath = `${BASE}${item.path}`;
  const isActive = location === fullPath || location.startsWith(fullPath + '/');

  return (
    <Link
      href={fullPath}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors",
        isActive
          ? "bg-[var(--color-a11oy-gold-soft)] text-[var(--color-a11oy-gold-dim)] font-medium"
          : "text-[var(--color-a11oy-text-sub)] hover:bg-[var(--color-a11oy-overlay)] hover:text-[var(--color-a11oy-text)]"
      )}
    >
      <item.icon className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-50")} />
      {item.name}
    </Link>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  return (
    <aside className="w-60 border-r border-[var(--color-a11oy-border)] bg-[var(--color-a11oy-deep)] shrink-0 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 overflow-y-auto">
      <div className="px-3 py-4 flex-1">
        <SectionHeader>Orchestration</SectionHeader>
        <nav className="flex flex-col gap-0.5">
          {orchestrationItems.map(item => <NavLink key={item.id} item={item} />)}
        </nav>

        {strategySections.map(s => <CollapsibleSection key={s.id} section={s} />)}
        {operationsSections.map(s => <CollapsibleSection key={s.id} section={s} />)}
        {infrastructureSections.map(s => <CollapsibleSection key={s.id} section={s} />)}
        {cognitiveSections.map(s => <CollapsibleSection key={s.id} section={s} />)}

        <SectionHeader>Decision Intelligence</SectionHeader>
        <nav className="flex flex-col gap-0.5">
          {decisionIntelligenceItems.map(item => <NavLink key={item.id} item={item} />)}
        </nav>

        <SectionHeader>Intelligence</SectionHeader>
        <nav className="flex flex-col gap-0.5">
          {intelligenceItems.map(item => <NavLink key={item.id} item={item} />)}
        </nav>

        <SectionHeader>Platform</SectionHeader>
        <nav className="flex flex-col gap-0.5">
          {platformItems.map(item => <NavLink key={item.id} item={item} />)}
        </nav>

        <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-a11oy-text-ghost)] mt-6 mb-4 px-2" style={{ color: '#9a8456' }}>
          Reliquary
        </div>
        <nav className="flex flex-col gap-1">
          {reliquaryItems.map(item => {
            const fullPath = `${BASE}${item.path}`;
            const isActive = location === fullPath || location.startsWith(fullPath + '/');
            const isSovereign = item.id === 'reliquary-sovereign';

            return (
              <Link
                key={item.id}
                href={fullPath}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[var(--color-a11oy-surface)] font-medium"
                    : "text-[var(--color-a11oy-text-sub)] hover:bg-[var(--color-a11oy-surface)] hover:text-[var(--color-a11oy-text)]"
                )}
                style={isActive ? { color: '#c9b787' } : isSovereign ? { color: '#94a3b8' } : {}}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "opacity-100" : "opacity-60")} style={isSovereign && !isActive ? { color: '#64748b' } : {}} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="px-4 py-3 border-t border-[var(--color-a11oy-border-subtle)] text-xs text-[var(--color-a11oy-text-ghost)]">
        <div>v5.0.0</div>
        <div className="text-[var(--color-a11oy-success)]">System nominal</div>
      </div>
    </aside>
  );
}
