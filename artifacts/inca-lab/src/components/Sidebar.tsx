import { useState } from "react";
import { type Page } from "../App";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Telescope,
  Network,
  Zap,
  Server,
  BarChart3,
  FlaskConical,
  ChevronRight,
  Brain,
  Users,
  GitBranch,
  MessageSquare,
  Link2,
  Library,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Database,
  Activity,
  Store,
  Trophy,
  Eye,
  Shield,
  Package,
  TrendingUp,
  Blocks,
  Boxes,
  Beaker,
  ShoppingBag,
  Globe,
  Crown,
  Cpu,
} from "lucide-react";

interface NavItem {
  id: Page;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  defaultExpanded?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "core",
    label: "Core Platform",
    defaultExpanded: true,
    items: [
      { id: "dashboard", label: "Dashboard", sublabel: "System overview", icon: LayoutDashboard },
      { id: "intelligence", label: "Model Intelligence", sublabel: "HuggingFace + arXiv feed", icon: Telescope },
      { id: "gateway", label: "AI Gateway", sublabel: "Routing & telemetry", icon: Zap },
      { id: "deployment", label: "Deployment Runway", sublabel: "Self-hosted readiness", icon: Server },
      { id: "observatory", label: "LLMOps Observatory", sublabel: "Usage, compliance & traces", icon: BarChart3 },
      { id: "lab", label: "Model Lab", sublabel: "A/B testing & prompts", icon: FlaskConical },
      { id: "model-training", label: "Fine-Tuning Pipeline", sublabel: "Train & deploy custom models", icon: Cpu },
      { id: "security", label: "Security Posture", sublabel: "Trust scores & injection", icon: ShieldCheck },
      { id: "memory", label: "Agent Memory", sublabel: "Cross-session knowledge", icon: Database },
    ],
  },
  {
    id: "orchestration",
    label: "Multi-Agent Orchestration",
    defaultExpanded: true,
    items: [
      { id: "nuro-mesh", label: "Nuro Mesh", sublabel: "Live topology & crews", icon: Network },
      { id: "agent-library", label: "Agent Library", sublabel: "Domain agent catalog", icon: Library },
      { id: "crew-builder", label: "Crew Builder", sublabel: "Assemble agent crews", icon: Users },
      { id: "workflow-forge", label: "Workflow Forge", sublabel: "Visual graph designer", icon: GitBranch },
      { id: "consensus", label: "Consensus Chamber", sublabel: "Multi-agent deliberation", icon: MessageSquare },
      { id: "protocol-bridge", label: "Protocol Bridge", sublabel: "MCP + A2A connectivity", icon: Link2 },
      { id: "agent-console", label: "Agent Console", sublabel: "Health, cost & decisions", icon: Activity },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace & Economy",
    defaultExpanded: true,
    items: [
      { id: "agent-marketplace", label: "Agent Marketplace", sublabel: "Browse & deploy agents", icon: Store },
      { id: "champion-arena", label: "Champion Arena", sublabel: "Fusion intelligence & rankings", icon: Crown },
      { id: "performance-arena", label: "Performance Arena", sublabel: "Benchmarks & leaderboards", icon: Trophy },
      { id: "cognitive-visualizer", label: "Cognitive Visualizer", sublabel: "Real-time agent cognition", icon: Eye },
      { id: "sla-management", label: "SLA Management", sublabel: "Contracts & compliance", icon: Shield },
      { id: "white-label", label: "White-Label Packaging", sublabel: "Client branded deployments", icon: Package },
      { id: "revenue-roi", label: "Revenue & ROI", sublabel: "Cost, revenue & margins", icon: TrendingUp },
    ],
  },
  {
    id: "skills",
    label: "Skills Engine",
    defaultExpanded: true,
    items: [
      { id: "skill-playground", label: "Skill Playground", sublabel: "Test & explore skills live", icon: Blocks },
    ],
  },
  {
    id: "supply-chain",
    label: "AI Supply Chain",
    defaultExpanded: true,
    items: [
      { id: "package-registry", label: "Package Registry", sublabel: "AI capability bundles", icon: Package },
      { id: "alloy-forge", label: "Alloy Forge", sublabel: "Agent environment manager", icon: Boxes },
      { id: "training-studio", label: "Training Studio", sublabel: "Provider-routed fine-tuning", icon: Beaker },
      { id: "public-marketplace", label: "Public Marketplace", sublabel: "Public storefront & AIBOM", icon: Globe },
    ],
  },
];

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(id: string) {
    setCollapsed(c => ({ ...c, [id]: !c[id] }));
  }

  function isGroupOpen(group: NavGroup) {
    return collapsed[group.id] === undefined ? (group.defaultExpanded ?? true) : !collapsed[group.id];
  }

  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5 mb-0.5">
          <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-display font-semibold text-foreground leading-none">INCA Lab</div>
            <div className="text-xs text-muted-foreground mt-0.5 leading-none">Multi-Agent Orchestration</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {NAV_GROUPS.map((group) => {
          const open = isGroupOpen(group);
          return (
            <div key={group.id} className="mb-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-left"
              >
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.label}</div>
                {open ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </button>
              {open && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = currentPage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onNavigate(item.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150 group",
                          active
                            ? "bg-primary/8 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                        )}
                      >
                        <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        <div className="flex-1 min-w-0">
                          <div className={cn("text-xs font-medium leading-none", active ? "text-primary" : "")}>{item.label}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 leading-none truncate opacity-70">{item.sublabel}</div>
                        </div>
                        {active && <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot flex-shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">Nuro Mesh</div>
            <div className="text-xs font-medium text-foreground">8 agents · 3 crews active</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">SZL Holdings · v3.0.0</div>
      </div>
    </aside>
  );
}

function NavButton({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: (page: Page) => void }) {
  const Icon = item.icon;
  return (
    <button
      key={item.id}
      onClick={() => onNavigate(item.id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group",
        active
          ? "bg-primary/8 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      )}
    >
      <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm font-medium leading-none", active ? "text-primary" : "")}>{item.label}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-none truncate">{item.sublabel}</div>
      </div>
      {active && <ChevronRight className="w-3 h-3 text-primary flex-shrink-0" />}
    </button>
  );
}
