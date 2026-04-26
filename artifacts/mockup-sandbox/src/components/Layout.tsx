import {
  Activity,
  BarChart2,
  BookOpen,
  Brain,
  Database,
  Download,
  FlaskConical,
  GitBranch,
  Globe,
  Home,
  Layers,
  Network,
  Palette,
  Shield,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { useState } from 'react';
import type { Page } from '../lib/types';
import OrgSwitcher, { MOCK_ORGS, type MockOrg } from './OrgSwitcher';

const NAV_ITEMS: Array<{
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  group?: string;
}> = [
  { id: 'home', label: 'PRAXIS', icon: Home, description: 'Home & Overview' },
  { id: 'research', label: 'Research', icon: FlaskConical, description: 'Parallel Swarm' },
  { id: 'memory', label: 'Memory', icon: Brain, description: 'Persistent Memory' },
  { id: 'skills', label: 'Skills', icon: Layers, description: 'Skills Library' },
  { id: 'patterns', label: 'Patterns', icon: GitBranch, description: 'Pattern Atlas' },
  { id: 'bridge', label: 'Bridge', icon: Network, description: 'Protocol Bridge' },
  {
    id: 'orchestrator',
    label: 'Orchestrate',
    icon: Workflow,
    description: 'Cross-App Orchestrator',
  },
  { id: 'ingest', label: 'Ingest', icon: Download, description: 'Repo Ingest' },
  { id: 'audit', label: 'Audit', icon: Shield, description: 'Agent Run Audit Trail' },
  { id: 'marketplace', label: 'Marketplace', icon: ShieldCheck, description: 'MCP Trust Marketplace', group: 'marketplace' },
  {
    id: 'design-system',
    label: 'Design System',
    icon: Palette,
    description: 'Governed-Intelligence Design Language',
  },
  {
    id: 'tokens-governance',
    label: 'Tokens Governance',
    icon: Palette,
    description: '@workspace/tokens drift across artifacts',
  },
  {
    id: 'ai-quality',
    label: 'AI Quality',
    icon: Activity,
    description: 'AI Control Plane & Feedback',
    group: 'control',
  },
  {
    id: 'prompt-registry',
    label: 'Prompts',
    icon: BookOpen,
    description: 'Prompt Registry',
    group: 'control',
  },
  {
    id: 'eval-console',
    label: 'Evals',
    icon: BarChart2,
    description: 'Eval Console',
    group: 'control',
  },
];

export default function Layout({
  page,
  navigate,
  children,
}: {
  page: Page;
  navigate: (p: Page) => void;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const [org, setOrg] = useState<MockOrg>(MOCK_ORGS[0]);

  return (
    <div className="flex h-screen bg-praxis-bg overflow-hidden">
      <nav
        className={`flex flex-col border-r border-praxis transition-all duration-200 ${
          expanded ? 'w-52' : 'w-14'
        } bg-praxis-surface shrink-0`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="flex items-center h-14 px-2 border-b border-praxis gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded bg-praxis-cyan/10 border border-praxis-cyan/30 flex items-center justify-center shrink-0">
              <span className="text-praxis-cyan font-mono font-bold text-sm">N</span>
            </div>
            {expanded && (
              <div className="min-w-0 overflow-hidden">
                <div className="text-praxis-cyan font-mono font-bold text-sm tracking-widest">
                  PRAXIS
                </div>
                <div className="text-[10px] text-muted-foreground/70 tracking-wide">ONE OF ONE</div>
              </div>
            )}
          </div>
        </div>

        <div className="px-1.5 py-2 border-b border-praxis">
          <OrgSwitcher org={org} onChange={setOrg} expanded={expanded} />
        </div>

        <div className="flex-1 flex flex-col gap-0.5 py-3 px-1.5 overflow-hidden overflow-y-auto">
          {NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const active = page === item.id;
            const prevItem = NAV_ITEMS[idx - 1];
            const showDivider = (item.group === 'control' && prevItem?.group !== 'control') || (item.group === 'marketplace' && prevItem?.group !== 'marketplace');
            return (
              <div key={item.id}>
                {showDivider && (
                  <div className={`mt-2 mb-1 ${expanded ? 'px-2' : 'px-1'}`}>
                    <div className="border-t border-praxis/60" />
                    {expanded && item.group === 'control' && (
                      <div className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mt-1.5 px-1 font-mono">
                        Control Plane
                      </div>
                    )}
                    {expanded && item.group === 'marketplace' && (
                      <div className="text-[9px] text-nexus-cyan/40 uppercase tracking-widest mt-1.5 px-1 font-mono">
                        Trust Marketplace
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => navigate(item.id)}
                  title={expanded ? undefined : item.description}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-all w-full group ${
                    active
                      ? 'bg-praxis-cyan/10 text-praxis-cyan'
                      : 'text-muted-foreground hover:text-foreground hover:bg-[#1a2535]/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? 'text-praxis-cyan' : 'group-hover:text-foreground'
                    }`}
                  />
                  {expanded && <span className="text-xs font-medium truncate">{item.label}</span>}
                  {active && !expanded && (
                    <div className="absolute left-0 w-0.5 h-6 bg-praxis-cyan rounded-r" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-1.5 border-t border-praxis">
          {expanded ? (
            <div className="px-2 py-2 space-y-1">
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1">
                System
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Swarms</span>
                <span
                  className={`font-mono ${org.swarms > 0 ? 'text-praxis-cyan' : 'text-muted-foreground/50'}`}
                >
                  {org.swarms}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-mono text-muted-foreground/80">{org.memory.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Skills</span>
                <span className="font-mono text-praxis-green">{org.skills}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-1">
              <div
                className={`w-1.5 h-1.5 rounded-full pulse-dot ${
                  org.swarms > 0 ? 'bg-praxis-cyan' : 'bg-muted-foreground/30'
                }`}
                title={`${org.swarms} active swarms`}
              />
            </div>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
        <StatusStrip org={org} />
      </div>
    </div>
  );
}

function StatusStrip({ org }: { org: MockOrg }) {
  return (
    <div className="h-7 bg-praxis-surface border-t border-praxis flex items-center px-4 gap-6 shrink-0">
      <StatusItem
        icon={<Activity className="w-3 h-3" />}
        label="Swarms"
        value={org.swarms}
        active={org.swarms > 0}
        color="cyan"
      />
      <StatusItem
        icon={<Database className="w-3 h-3" />}
        label="Memory"
        value={org.memory}
        color="default"
      />
      <StatusItem
        icon={<Layers className="w-3 h-3" />}
        label="Skills"
        value={org.skills}
        color="green"
      />
      <StatusItem
        icon={<Globe className="w-3 h-3" />}
        label="Tools"
        value={org.tools}
        color="default"
      />
      <StatusItem
        icon={<Workflow className="w-3 h-3" />}
        label="Orchestrations"
        value={org.orchestrations}
        color="default"
      />

      <div className="ml-auto flex items-center gap-3">
        <div
          className="text-[10px] font-mono px-2 py-0.5 rounded border"
          style={{ color: org.color, borderColor: `${org.color}40`, backgroundColor: `${org.color}10` }}
        >
          {org.name}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-praxis-green pulse-dot" />
          <span className="text-[10px] text-muted-foreground/60 font-mono">PRAXIS ONLINE</span>
        </div>
      </div>
    </div>
  );
}

function StatusItem({
  icon,
  label,
  value,
  active,
  color = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  active?: boolean;
  color?: 'cyan' | 'green' | 'amber' | 'default';
}) {
  const colorClass =
    color === 'cyan'
      ? active
        ? 'text-praxis-cyan'
        : 'text-muted-foreground/40'
      : color === 'green'
        ? 'text-praxis-green/80'
        : color === 'amber'
          ? 'text-praxis-amber/80'
          : 'text-muted-foreground/60';

  return (
    <div className={`flex items-center gap-1 text-[10px] font-mono ${colorClass}`}>
      {icon}
      <span className="text-muted-foreground/40">{label}</span>
      <span>{value.toLocaleString()}</span>
    </div>
  );
}
