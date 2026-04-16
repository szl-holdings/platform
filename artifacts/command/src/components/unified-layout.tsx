import { useState, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, Globe2, Activity, Zap, Shield, Network, Cpu, BookOpen,
  Radio, Brain, Heart, AlertTriangle, Workflow, Inbox, Settings, Users,
  Flag, FileText, Database, Play, CheckSquare, Download, GitBranch, Send,
  TrendingUp, DollarSign, RotateCcw, Calculator, Bot, Monitor, Building,
  BellOff, Code, Target, Phone, Calendar, Layers, Map, Crown, ChevronRight,
  Menu, X, BarChart3, Clapperboard, Power, Bell
} from "lucide-react";
import { MultiplayerSessionBanner, EcosystemNav } from "@szl-holdings/shared-ui";

export type WorkspaceMode = "strategy" | "operations" | "infrastructure";

const ACCENT: Record<WorkspaceMode, string> = {
  strategy: "#8b7ac8",
  operations: "#d4a054",
  infrastructure: "#c9a227",
};

const WORKSPACE_TABS: { mode: WorkspaceMode; label: string; icon: typeof LayoutDashboard; sublabel: string }[] = [
  { mode: "strategy", label: "Strategy", sublabel: "Ecosystem Intelligence", icon: Globe2 },
  { mode: "operations", label: "Operations", sublabel: "AIOps & Observability", icon: Zap },
  { mode: "infrastructure", label: "Infrastructure", sublabel: "Cloud Sovereignty", icon: Shield },
];

const STRATEGY_NAV = [
  { href: "/strategy", label: "Dashboard", icon: LayoutDashboard },
  { href: "/strategy/simulation", label: "What-If Simulation", icon: Activity },
  { href: "/strategy/executive-briefing", label: "Executive Briefing", icon: FileText },
  { href: "/strategy/briefing", label: "Briefing History", icon: BarChart3 },
];

const OPERATIONS_NAV = [
  { href: "/operations", label: "Exec Command", icon: LayoutDashboard },
  { href: "/operations/prism/pulse", label: "Pulse", icon: Heart },
  { href: "/operations/prism/risk", label: "Risk", icon: AlertTriangle },
  { href: "/operations/prism/intelligence", label: "Intelligence", icon: Brain },
  { href: "/operations/prism/signals", label: "Signals Feed", icon: Radio },
  { href: "/operations/prism/motion", label: "Motion", icon: Workflow },
  { href: "/operations/blocker-board", label: "Blocker Board", icon: AlertTriangle },
  { href: "/operations/digest", label: "Digest Center", icon: FileText },
  { href: "/operations/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/operations/trust-audit", label: "Trust & Audit", icon: Shield },
  { href: "/operations/autonomous-noc", label: "Autonomous NOC", icon: Bot },
  { href: "/operations/runbook-studio", label: "Runbook Studio", icon: BookOpen },
  { href: "/operations/knowledge-graph", label: "Knowledge Graph", icon: Network },
  { href: "/operations/dex", label: "DEX Scoring", icon: Monitor },
  { href: "/operations/self-healing", label: "Self-Healing", icon: RotateCcw },
  { href: "/operations/alloy/canvas", label: "Alloy Workflow Canvas", icon: Workflow },
  { href: "/operations/alloy/actions", label: "Alloy Action Queue", icon: Activity },
  { href: "/operations/alloy/intelligence", label: "Alloy Intelligence", icon: Brain },
  { href: "/operations/alloy/governance", label: "Governance", icon: Shield },
  { href: "/operations/slo", label: "SLO / SLI Management", icon: Target },
  { href: "/operations/finops", label: "FinOps & Cloud Cost", icon: DollarSign },
  { href: "/operations/tracing", label: "Distributed Tracing", icon: GitBranch },
  { href: "/operations/logs", label: "Log Analytics", icon: Database },
  { href: "/operations/on-call", label: "On-Call Management", icon: Phone },
  { href: "/operations/inbox", label: "Inbox", icon: Inbox },
  { href: "/operations/ownership", label: "Ownership Map", icon: Users },
  { href: "/operations/noise-reduction", label: "Noise Reduction", icon: BellOff },
];

const INFRASTRUCTURE_NAV = [
  { href: "/infrastructure", label: "Executive Console", icon: Crown },
  { href: "/infrastructure/imperium-map", label: "Resource Map", icon: Map },
  { href: "/infrastructure/praetorian", label: "Security Perimeter", icon: Shield },
  { href: "/infrastructure/senate", label: "Governance Board", icon: BookOpen },
  { href: "/infrastructure/supply-lines", label: "Network Topology", icon: Network },
  { href: "/infrastructure/centurion", label: "AI Operations", icon: Cpu },
  { href: "/infrastructure/intelligence", label: "Intelligence Briefing", icon: Radio },
];

function NavItem({ href, label, icon: Icon, isActive, accent }: {
  href: string; label: string; icon: typeof LayoutDashboard; isActive: boolean; accent: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2.5 py-[5px] text-[10px] font-medium transition-all relative group rounded"
      style={{ color: isActive ? accent : "rgba(255,255,255,0.5)", background: isActive ? `${accent}12` : "transparent" }}
    >
      {isActive && <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r" style={{ background: accent }} />}
      <Icon className="w-3 h-3 shrink-0" style={{ color: isActive ? accent : "rgba(255,255,255,0.3)", opacity: isActive ? 1 : 0.7 }} />
      <span>{label}</span>
    </Link>
  );
}

function WorkspaceSwitcher({ mode, onModeChange }: { mode: WorkspaceMode; onModeChange: (m: WorkspaceMode) => void }) {
  return (
    <div className="px-2 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
      <div className="grid grid-cols-3 gap-0.5">
        {WORKSPACE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = mode === tab.mode;
          const accent = ACCENT[tab.mode];
          return (
            <button
              key={tab.mode}
              onClick={() => onModeChange(tab.mode)}
              className="flex flex-col items-center py-1.5 px-1 rounded transition-all"
              style={{
                background: isActive ? `${accent}12` : "transparent",
                border: `1px solid ${isActive ? accent + "30" : "transparent"}`,
              }}
            >
              <Icon className="w-3 h-3 mb-0.5" style={{ color: isActive ? accent : "rgba(255,255,255,0.3)" }} />
              <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: isActive ? accent : "rgba(255,255,255,0.3)" }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function UnifiedLayout({ children, mode, onModeChange }: {
  children: ReactNode;
  mode: WorkspaceMode;
  onModeChange: (m: WorkspaceMode) => void;
}) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const accent = ACCENT[mode];

  const navItems = mode === "strategy" ? STRATEGY_NAV
    : mode === "operations" ? OPERATIONS_NAV
    : INFRASTRUCTURE_NAV;

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#060a12" }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-10 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={[
          "flex flex-col shrink-0 relative z-20 transition-transform duration-200",
          "fixed md:relative inset-y-0 left-0 w-52",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
        style={{ background: "#060a12", borderRight: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div className="h-12 flex items-center px-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `${accent}12`, border: `1px solid ${accent}20` }}>
              <Globe2 className="w-3.5 h-3.5" style={{ color: accent }} />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wide leading-none" style={{ color: "rgba(255,255,255,0.9)" }}>COMMAND</div>
              <div className="text-[7px] uppercase tracking-[0.15em] mt-px" style={{ color: `${accent}70` }}>Unified Operations</div>
            </div>
          </div>
        </div>

        <WorkspaceSwitcher mode={mode} onModeChange={(m) => { onModeChange(m); setSidebarOpen(false); }} />

        <nav className="flex-1 min-h-0 px-1.5 py-2 overflow-y-auto flex flex-col gap-px">
          {navItems.map((item) => {
            const isActive = item.href === `/${mode}` || item.href === `/strategy`
              ? location === item.href || location === "/" && item.href === "/strategy"
              : location.startsWith(item.href);
            return (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={isActive}
                accent={accent}
              />
            );
          })}
        </nav>

        <div className="px-3 py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="text-[7px] uppercase tracking-widest font-mono mb-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>SZL Holdings</div>
          <div className="flex gap-1 flex-wrap">
            {[
              { label: "AEGIS", href: "/aegis/", color: "#ef4444" },
              { label: "TERRA", href: "/terra/", color: "#22c55e" },
              { label: "VESSELS", href: "/vessels/", color: "#0ea5e9" },
            ].map((p) => (
              <a key={p.label} href={p.href} className="text-[7px] px-1 py-px rounded font-mono hover:opacity-80" style={{ color: p.color, background: `${p.color}10`, border: `1px solid ${p.color}18` }}>
                {p.label}
              </a>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-10 flex items-center justify-between px-3 md:px-4 shrink-0 z-10 border-b" style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(6,10,18,0.9)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1 rounded hover:bg-white/5 mr-1"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            <span className="text-[11px] font-mono font-semibold" style={{ color: accent }}>
              {WORKSPACE_TABS.find((t) => t.mode === mode)?.label} Mode
            </span>
            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
              · {WORKSPACE_TABS.find((t) => t.mode === mode)?.sublabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-1 rounded hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}>
              <Bell className="w-3.5 h-3.5" />
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.85)" }}>Stephen Lutar</div>
              <div className="text-[8px] font-mono" style={{ color: `${accent}60` }}>SZL Holdings</div>
            </div>
            <div className="w-6 h-6 rounded flex items-center justify-center text-[9px] font-bold" style={{ background: `${accent}12`, border: `1px solid ${accent}20`, color: accent }}>SL</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto" style={{ background: "#080c14" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
