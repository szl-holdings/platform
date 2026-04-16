import { Link, useLocation } from "wouter";
import { cn } from "@szl-holdings/shared-ui/utils";
import { SectionErrorBoundary } from "@szl-holdings/shared-ui/error-boundary";
import { ReactNode, useState, useEffect } from "react";
import { Zap, Activity, GitBranch, Network, Shield, BarChart2, ChevronRight, Bell, Menu, X, Film, Mic, Calendar, Wand2, Radio, LayoutDashboard, ArrowLeft, FileText, Brain, Layers, Home, BookOpen, Globe, Lock, Play, Star, DollarSign, Store, Code2, Cpu, Scale, HeartPulse, BarChart3, Image, Package } from "lucide-react";
import { useRealtimeChannel, RealtimeStatusIndicator } from "@szl-holdings/shared-ui";
import { CommandPalette, useCommandPalette, getEcosystemSwitchCommands, createBaselineWebActions, useRegisterCommands, type CommandItem } from "@szl-holdings/shared-ui/command-palette";

const COMMAND_LOOP = [
  { phase: "DETECT", color: "#0ea5e9", active: false },
  { phase: "INTERPRET", color: "#f59e0b", active: false, link: "/command/operations/" },
  { phase: "DECIDE", color: "#8b5cf6", active: false },
  { phase: "EXECUTE", color: "#4B8BDB", active: true },
  { phase: "VERIFY", color: "#10b981", active: false },
];

const NAV = [
  { href: "/alloy/home", label: "Workspace Home", icon: Home, badge: "New" },
  { href: "/alloy", label: "Factory Floor", icon: LayoutDashboard, exact: true },
  { href: "/alloy/runs", label: "Execution History", icon: Activity },
  { href: "/alloy/signals", label: "Signal Feed", icon: Radio },
  { href: "/alloy/workflows", label: "Workflow Orchestration", icon: GitBranch },
  { href: "/alloy/connectors", label: "Connector Mesh", icon: Network },
  { href: "/alloy/governance", label: "Governance & Audit", icon: Shield },
  { href: "/alloy/enterprise-governance", label: "Enterprise Governance", icon: Lock },
  { href: "/alloy/analytics", label: "Automation Analytics", icon: BarChart2 },
];

const COMMAND_NAV = [
  { href: "/alloy/decisions", label: "Decision Objects", icon: Brain, badge: "New" },
  { href: "/alloy/skills", label: "Skill Registry", icon: Layers, badge: "New" },
  { href: "/alloy/operator", label: "Operator Control", icon: Shield, badge: "New" },
];

const CREATIVE_NAV = [
  { href: "/alloy/creative", label: "Campaign Hub", icon: Film },
  { href: "/alloy/creative/brand-voice", label: "Brand Voice", icon: Mic },
  { href: "/alloy/creative/content-calendar", label: "Content Calendar", icon: Calendar },
  { href: "/alloy/creative/ai-studio", label: "AI Studio", icon: Wand2 },
];

const DOCS_NAV = [
  { href: "/alloy/documents", label: "Document Engine", icon: FileText },
];

const INTELLIGENCE_NAV = [
  { href: "/alloy/research", label: "Research Mode", icon: BookOpen },
  { href: "/alloy/artifacts", label: "Artifact Studio", icon: Layers },
  { href: "/alloy/browser", label: "Browser Operator", icon: Globe },
];

const ENTERPRISE_NAV = [
  { href: "/alloy/policies", label: "Policy Manager", icon: Lock, badge: "New" },
  { href: "/alloy/admin-analytics", label: "Admin Analytics", icon: BarChart2, badge: "New" },
  { href: "/alloy/usage", label: "Usage Metering", icon: DollarSign, badge: "New" },
  { href: "/alloy/demos", label: "Canonical Demos", icon: Play, badge: "New" },
  { href: "/alloy/pilot", label: "Pilot Onboarding", icon: Star, badge: "New" },
];

const NURO_FORGE_NAV = [
  { href: "/nuro-forge", label: "Model Lab", icon: Cpu, badge: "New" },
  { href: "/nuro-forge/arena", label: "Model Benchmarks", icon: Zap },
  { href: "/nuro-forge/composition", label: "Model Composition", icon: GitBranch },
  { href: "/nuro-forge/governance", label: "Governance & Safety", icon: Shield },
  { href: "/nuro-forge/fine-tuning", label: "Fine-Tuning Engine", icon: Brain },
  { href: "/nuro-forge/cost", label: "Cost Intelligence", icon: DollarSign },
  { href: "/nuro-forge/multimodal", label: "Multimodal Hub", icon: Image },
  { href: "/nuro-forge/prompts", label: "Prompt Studio", icon: Wand2 },
  { href: "/nuro-forge/observatory", label: "Observatory", icon: BarChart3 },
  { href: "/nuro-forge/blueprints", label: "Blueprints", icon: Package },
  { href: "/nuro-forge/self-healing", label: "Self-Healing Infra", icon: HeartPulse },
];

const MCP_NAV = [
  { href: "/alloy/mcp-store", label: "MCP Marketplace", icon: Store, badge: "New" },
  { href: "/alloy/mcp-tools", label: "Custom Tool Creator", icon: Code2, badge: "New" },
];

function NavItem({ href, label, icon: Icon, exact, badge, onClick }: {
  href: string; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; exact?: boolean; badge?: string; onClick?: () => void;
}) {
  const [location] = useLocation();
  const isActive = exact ? (location === href || location === href + "/") : location.startsWith(href);
  return (
    <Link href={href} onClick={onClick} className={cn(
      "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group relative",
      isActive ? "" : "text-slate-400 hover:text-white hover:bg-white/5"
    )} style={{ background: isActive ? "rgba(75,139,219,0.08)" : undefined, color: isActive ? "#4B8BDB" : undefined }}>
      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: "#4B8BDB" }} />}
      <Icon className={cn("w-3.5 h-3.5 shrink-0", !isActive && "text-slate-500 group-hover:text-slate-300")} style={isActive ? { color: "#4B8BDB" } : undefined} />
      <span className="flex-1">{label}</span>
      {badge && !isActive && (
        <span className="text-[8px] font-bold uppercase tracking-widest px-1 py-0.5 rounded" style={{ color: "#4B8BDB", background: "rgba(75,139,219,0.12)" }}>{badge}</span>
      )}
    </Link>
  );
}

const ALL_NAV_SECTIONS = [
  { items: NAV, group: "Navigate" },
  { items: COMMAND_NAV, group: "Navigate" },
  { items: CREATIVE_NAV, group: "Navigate" },
  { items: DOCS_NAV, group: "Navigate" },
  { items: INTELLIGENCE_NAV, group: "Navigate" },
  { items: NURO_FORGE_NAV, group: "Navigate" },
  { items: ENTERPRISE_NAV, group: "Actions" },
  { items: MCP_NAV, group: "Actions" },
];

const ALLOY_SLASH_COMMANDS: CommandItem[] = [
  { id: "slash-workflow", label: "/workflow", description: "Open Workflow Orchestration", icon: "⬡", group: "Slash Commands", isSlashCommand: true, keywords: ["workflow", "orchestration"], action: () => {} },
  { id: "slash-approve", label: "/approve", description: "Open Approvals Queue", icon: "✓", group: "Slash Commands", isSlashCommand: true, keywords: ["approve", "governance", "review"], action: () => {} },
  { id: "slash-signals", label: "/signals", description: "Open Signal Feed", icon: "📡", group: "Slash Commands", isSlashCommand: true, keywords: ["signals", "feed", "events"], action: () => {} },
  { id: "slash-runs", label: "/runs", description: "Open Execution History", icon: "▶", group: "Slash Commands", isSlashCommand: true, keywords: ["runs", "history", "execution"], action: () => {} },
  { id: "slash-analytics", label: "/analytics", description: "Open Automation Analytics", icon: "📊", group: "Slash Commands", isSlashCommand: true, keywords: ["analytics", "metrics", "data"], action: () => {} },
  { id: "slash-decisions", label: "/decisions", description: "Open Decision Objects", icon: "🧠", group: "Slash Commands", isSlashCommand: true, keywords: ["decisions", "ai", "intelligence"], action: () => {} },
  { id: "slash-skills", label: "/skills", description: "Open Skill Registry", icon: "◈", group: "Slash Commands", isSlashCommand: true, keywords: ["skills", "registry", "capabilities"], action: () => {} },
  { id: "slash-operators", label: "/operators", description: "Open Operator Control Center", icon: "🛡", group: "Slash Commands", isSlashCommand: true, keywords: ["operator", "agents", "control"], action: () => {} },
  { id: "slash-connectors", label: "/connectors", description: "Open Connector Mesh", icon: "🔗", group: "Slash Commands", isSlashCommand: true, keywords: ["connectors", "integrations", "mesh"], action: () => {} },
  { id: "slash-docs", label: "/docs", description: "Open Document Engine", icon: "📄", group: "Slash Commands", isSlashCommand: true, keywords: ["docs", "documents", "files"], action: () => {} },
  { id: "slash-home", label: "/home", description: "Workspace Home & Priority Dashboard", icon: "⚡", group: "Slash Commands", isSlashCommand: true, keywords: ["home", "workspace", "priority"], action: () => {} },
];

const SLASH_TO_NAV: Record<string, string> = {
  "slash-workflow": "/alloy/workflows",
  "slash-approve": "/alloy/governance",
  "slash-signals": "/alloy/signals",
  "slash-runs": "/alloy/runs",
  "slash-analytics": "/alloy/analytics",
  "slash-decisions": "/alloy/decisions",
  "slash-skills": "/alloy/skills",
  "slash-operators": "/alloy/operator",
  "slash-connectors": "/alloy/connectors",
  "slash-docs": "/alloy/documents",
  "slash-home": "/alloy/home",
};

function buildAlloyCommands(navigate: (path: string) => void): CommandItem[] {
  const cmds: CommandItem[] = [];
  for (const { items, group } of ALL_NAV_SECTIONS) {
    for (const item of items) {
      cmds.push({
        id: `alloy-nav-${item.href}`,
        label: item.label,
        icon: undefined,
        group,
        keywords: ["alloy", item.label.toLowerCase()],
        action: () => navigate(item.href),
      });
    }
  }
  for (const slashCmd of ALLOY_SLASH_COMMANDS) {
    const path = SLASH_TO_NAV[slashCmd.id];
    cmds.push({ ...slashCmd, action: () => navigate(path) });
  }
  cmds.push(...getEcosystemSwitchCommands("alloy"));
  return cmds;
}

export function AlloyLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { status: wsStatus } = useRealtimeChannel("workflow-runs");
  const [, navigate] = useLocation();
  const [workflowCmds, setWorkflowCmds] = useState<CommandItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadWorkflows() {
      try {
        const res = await fetch("/api/alloy/workflows?limit=20");
        if (!res.ok) return;
        const json = await res.json();
        const list: Array<{ id: number; name: string; status: string }> =
          Array.isArray(json) ? json : (json?.data ?? []);
        if (!cancelled) {
          setWorkflowCmds(
            list.map((wf) => ({
              id: `wf-${wf.id}`,
              label: wf.name,
              description: `Workflow · ${wf.status}`,
              icon: "⬡",
              group: "Workflows",
              keywords: ["workflow", wf.name.toLowerCase(), wf.status],
              action: () => { navigate("/alloy/workflows"); },
            }))
          );
        }
      } catch {
      }
    }
    loadWorkflows();
    return () => { cancelled = true; };
  }, [navigate]);

  const alloyNavCmds = buildAlloyCommands(navigate);
  const alloyCommands = useRegisterCommands(
    [...alloyNavCmds, ...workflowCmds],
    createBaselineWebActions(navigate, {
      helpUrl: "https://szlholdings.com/docs",
      themeToggle: {
        label: "Toggle Theme",
        action: () => { document.documentElement.classList.toggle("light"); },
      },
    })
  );
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette(alloyCommands);

  return (
    <div className="flex h-full overflow-hidden">
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={alloyCommands}
        appName="Alloy"
        accentColor="#4B8BDB"
        placeholder="Navigate to any screen or / for slash commands..."
      />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={cn(
        "border-r flex flex-col shrink-0 z-20 transition-transform duration-200",
        "fixed md:relative inset-y-0 left-0 w-56",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )} style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,12,20,0.95)" }}>
        <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Link href="/" className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}>
            <ArrowLeft className="w-3 h-3" />
            <span>SZL Holdings</span>
          </Link>
          <div className="h-10 flex items-center px-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg shadow-lg" style={{ background: "linear-gradient(135deg, #4B8BDB, #0090cc)", boxShadow: "0 0 12px rgba(75,139,219,0.3)" }}>
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-wide text-white leading-none">ALLOY</span>
                <span className="text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: "#4B8BDB" }}>Execution Fabric</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="text-[9px] uppercase tracking-widest mb-2 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>Command Loop</div>
          <div className="flex items-center gap-1 flex-wrap">
            {COMMAND_LOOP.map((p, i) => (
              <div key={p.phase} className="flex items-center gap-1">
                {p.link ? (
                  <a href={p.link} className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded transition-all hover:opacity-80" style={{
                    color: p.active ? p.color : "rgba(255,255,255,0.25)",
                    background: p.active ? `${p.color}20` : "transparent",
                    border: `1px solid ${p.active ? p.color + "50" : "transparent"}`,
                  }}>{p.phase}</a>
                ) : (
                  <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{
                    color: p.active ? p.color : "rgba(255,255,255,0.25)",
                    background: p.active ? `${p.color}20` : "transparent",
                    border: `1px solid ${p.active ? p.color + "50" : "transparent"}`,
                  }}>{p.phase}</span>
                )}
                {i < COMMAND_LOOP.length - 1 && <ChevronRight className="w-2.5 h-2.5 shrink-0" style={{ color: "rgba(255,255,255,0.15)" }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <nav className="flex-1 min-h-0 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
            <div className="text-[9px] uppercase tracking-widest px-3 mb-1 font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Automation</div>
            {NAV.map(item => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}

            <div className="text-[9px] uppercase tracking-widest px-3 mb-1 mt-4 font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Intelligence</div>
            {COMMAND_NAV.map(item => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}

            <div className="text-[9px] uppercase tracking-widest px-3 mb-1 mt-4 font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Creative Workflows</div>
            {CREATIVE_NAV.map(item => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}

            <div className="text-[9px] uppercase tracking-widest px-3 mb-1 mt-4 font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Documents</div>
            {DOCS_NAV.map(item => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}

            <div className="text-[9px] uppercase tracking-widest px-3 mb-1 mt-4 font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Research & Creation</div>
            {INTELLIGENCE_NAV.map(item => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}

            <div className="text-[9px] uppercase tracking-widest px-3 mb-1 mt-4 font-medium" style={{ color: "rgba(212,160,84,0.6)" }}>Model Lab</div>
            {NURO_FORGE_NAV.map(item => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}

            <div className="text-[9px] uppercase tracking-widest px-3 mb-1 mt-4 font-medium" style={{ color: "rgba(139,92,246,0.6)" }}>Enterprise Governance</div>
            {ENTERPRISE_NAV.map(item => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}

            <div className="text-[9px] uppercase tracking-widest px-3 mb-1 mt-4 font-medium" style={{ color: "rgba(75,139,219,0.7)" }}>MCP Ecosystem</div>
            {MCP_NAV.map(item => (
              <NavItem key={item.href} {...item} onClick={() => setSidebarOpen(false)} />
            ))}
          </nav>

          <div className="mt-auto shrink-0 px-3 py-3 mx-2 mb-2 rounded-lg" style={{ background: "rgba(75,139,219,0.04)", border: "1px solid rgba(75,139,219,0.08)" }}>
            <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: "rgba(75,139,219,0.4)" }}>Runtime Health</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Connector Mesh</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[9px] font-mono" style={{ color: "#10b981" }}>All healthy</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Active runs</span>
                <span className="text-[9px] font-mono" style={{ color: "#4B8BDB" }}>14 running</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Queue depth</span>
                <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>8 pending</span>
              </div>
            </div>
            <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: "72%", background: "linear-gradient(90deg, #4B8BDB, #10b981)" }} />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>Capacity</span>
              <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>72%</span>
            </div>
          </div>
        </div>

        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Zap className="w-3 h-3" />
            <span>SZL Business OS</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            <a href="/terra/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80" style={{ color: "#4d7c0f", background: "rgba(77,124,15,0.1)", border: "1px solid rgba(77,124,15,0.2)" }}>TERRA</a>
            <a href="/command/operations/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>LYTE</a>
            <a href="/vessels/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80" style={{ color: "#38bdf8", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>VESSELS</a>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b flex items-center justify-between px-4 md:px-6 shrink-0" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(8,12,20,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3 text-xs font-mono">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors mr-2"
              style={{ color: "rgba(255,255,255,0.5)" }}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse hidden sm:block" style={{ background: "#4B8BDB" }} />
            <span className="hidden sm:block" style={{ color: "#4B8BDB" }}>14 Active Runs</span>
            <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span style={{ color: "#10b981" }}>8 Done</span>
            <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
            <span className="hidden sm:block" style={{ color: "#ef4444" }}>2 Failed</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg hover:bg-white/5 transition-colors text-[10px] font-mono"
              style={{ color: "rgba(255,255,255,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span>⌘K</span>
              <span className="hidden sm:block">Command</span>
            </button>
            <RealtimeStatusIndicator status={wsStatus} compact />
            <button className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Bell className="w-4 h-4" />
            </button>
            <div className="h-5 w-px hidden sm:block" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-medium text-white">Operator</div>
                <div className="text-[10px]" style={{ color: "rgba(75,139,219,0.7)" }}>SZL Holdings</div>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border" style={{ background: "linear-gradient(135deg, #4B8BDB, #0090cc)", borderColor: "rgba(255,255,255,0.1)" }}>OP</div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6" style={{ background: "#080c14" }}>
          <SectionErrorBoundary sectionName="Alloy">
            {children}
          </SectionErrorBoundary>
        </main>
      </div>
    </div>
  );
}
