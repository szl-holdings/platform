import { useState, useEffect, useCallback } from "react";
import type { Page, NexusStatus } from "../lib/types";
import { nexusApi } from "../lib/api";
import {
  Home,
  FlaskConical,
  Brain,
  Layers,
  GitBranch,
  Network,
  Workflow,
  Download,
  ChevronRight,
  Activity,
  Zap,
  Database,
  Cpu,
  Globe,
  Palette,
  BookOpen,
  BarChart2,
  Shield,
} from "lucide-react";

const NAV_ITEMS: Array<{
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  group?: string;
}> = [
  { id: "home", label: "NEXUS", icon: Home, description: "Home & Overview" },
  { id: "research", label: "Research", icon: FlaskConical, description: "Parallel Swarm" },
  { id: "memory", label: "Memory", icon: Brain, description: "Persistent Memory" },
  { id: "skills", label: "Skills", icon: Layers, description: "Skills Library" },
  { id: "patterns", label: "Patterns", icon: GitBranch, description: "Pattern Atlas" },
  { id: "bridge", label: "Bridge", icon: Network, description: "Protocol Bridge" },
  { id: "orchestrator", label: "Orchestrate", icon: Workflow, description: "Cross-App Orchestrator" },
  { id: "ingest", label: "Ingest", icon: Download, description: "Repo Ingest" },
  { id: "audit", label: "Audit", icon: Shield, description: "Agent Run Audit Trail" },
  { id: "design-system", label: "Design System", icon: Palette, description: "Governed-Intelligence Design Language" },
  { id: "ai-quality", label: "AI Quality", icon: Activity, description: "AI Control Plane & Feedback", group: "control" },
  { id: "prompt-registry", label: "Prompts", icon: BookOpen, description: "Prompt Registry", group: "control" },
  { id: "eval-console", label: "Evals", icon: BarChart2, description: "Eval Console", group: "control" },
];

const DEFAULT_STATUS: NexusStatus = {
  activeSwarms: 0,
  memoryItems: 0,
  enabledSkills: 0,
  registeredTools: 0,
  orchestrationsToday: 0,
};

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
  const [status, setStatus] = useState<NexusStatus>(DEFAULT_STATUS);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await nexusApi.getStatus();
      setStatus(s);
    } catch {
      // keep last known
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 10000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  return (
    <div className="flex h-screen bg-nexus-bg overflow-hidden">
      <nav
        className={`flex flex-col border-r border-nexus transition-all duration-200 ${
          expanded ? "w-52" : "w-14"
        } bg-nexus-surface shrink-0`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="flex items-center h-14 px-3 border-b border-nexus">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center shrink-0">
              <span className="text-nexus-cyan font-mono font-bold text-sm">N</span>
            </div>
            {expanded && (
              <div className="min-w-0 overflow-hidden">
                <div className="text-nexus-cyan font-mono font-bold text-sm tracking-widest">NEXUS</div>
                <div className="text-[10px] text-muted-foreground/70 tracking-wide">ONE OF ONE</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-0.5 py-3 px-1.5 overflow-hidden overflow-y-auto">
          {NAV_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const active = page === item.id;
            const prevItem = NAV_ITEMS[idx - 1];
            const showDivider = item.group === "control" && prevItem?.group !== "control";
            return (
              <div key={item.id}>
                {showDivider && (
                  <div className={`mt-2 mb-1 ${expanded ? "px-2" : "px-1"}`}>
                    <div className="border-t border-nexus/60" />
                    {expanded && (
                      <div className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mt-1.5 px-1 font-mono">
                        Control Plane
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => navigate(item.id)}
                  title={expanded ? undefined : item.description}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-all w-full group ${
                    active
                      ? "bg-[#00d4ff]/10 text-nexus-cyan"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#1a2535]/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? "text-nexus-cyan" : "group-hover:text-foreground"
                    }`}
                  />
                  {expanded && (
                    <span className="text-xs font-medium truncate">{item.label}</span>
                  )}
                  {active && !expanded && (
                    <div className="absolute left-0 w-0.5 h-6 bg-nexus-cyan rounded-r" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="p-1.5 border-t border-nexus">
          {expanded ? (
            <div className="px-2 py-2 space-y-1">
              <div className="text-[9px] text-muted-foreground/60 uppercase tracking-widest mb-1">System</div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Swarms</span>
                <span className={`font-mono ${status.activeSwarms > 0 ? "text-nexus-cyan" : "text-muted-foreground/50"}`}>
                  {status.activeSwarms}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-mono text-muted-foreground/80">{status.memoryItems}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Skills</span>
                <span className="font-mono text-nexus-green">{status.enabledSkills}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 py-1">
              <div
                className={`w-1.5 h-1.5 rounded-full pulse-dot ${
                  status.activeSwarms > 0 ? "bg-nexus-cyan" : "bg-muted-foreground/30"
                }`}
                title={`${status.activeSwarms} active swarms`}
              />
            </div>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
        <StatusStrip status={status} />
      </div>
    </div>
  );
}

function StatusStrip({ status }: { status: NexusStatus }) {
  return (
    <div className="h-7 bg-nexus-surface border-t border-nexus flex items-center px-4 gap-6 shrink-0">
      <StatusItem
        icon={<Activity className="w-3 h-3" />}
        label="Swarms"
        value={status.activeSwarms}
        active={status.activeSwarms > 0}
        color="cyan"
      />
      <StatusItem
        icon={<Database className="w-3 h-3" />}
        label="Memory"
        value={status.memoryItems}
        color="default"
      />
      <StatusItem
        icon={<Layers className="w-3 h-3" />}
        label="Skills"
        value={status.enabledSkills}
        color="green"
      />
      <StatusItem
        icon={<Globe className="w-3 h-3" />}
        label="Tools"
        value={status.registeredTools}
        color="default"
      />
      <StatusItem
        icon={<Workflow className="w-3 h-3" />}
        label="Orchestrations"
        value={status.orchestrationsToday}
        color="default"
      />

      <div className="ml-auto flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-nexus-green pulse-dot" />
        <span className="text-[10px] text-muted-foreground/60 font-mono">NEXUS ONLINE</span>
      </div>
    </div>
  );
}

function StatusItem({
  icon,
  label,
  value,
  active,
  color = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  active?: boolean;
  color?: "cyan" | "green" | "amber" | "default";
}) {
  const colorClass =
    color === "cyan"
      ? active
        ? "text-nexus-cyan"
        : "text-muted-foreground/40"
      : color === "green"
      ? "text-nexus-green/80"
      : color === "amber"
      ? "text-nexus-amber/80"
      : "text-muted-foreground/60";

  return (
    <div className={`flex items-center gap-1 text-[10px] font-mono ${colorClass}`}>
      {icon}
      <span className="text-muted-foreground/40">{label}</span>
      <span>{value}</span>
    </div>
  );
}
