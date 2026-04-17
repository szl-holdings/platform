import { useState, ReactNode } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Globe2, Activity, Zap, Shield, Network, Cpu, BookOpen,
  Radio, Brain, Heart, AlertTriangle, Workflow, Inbox, Settings, Users,
  Flag, FileText, Database, Play, CheckSquare, Download, GitBranch, Send,
  TrendingUp, DollarSign, RotateCcw, Calculator, Bot, Monitor, Building,
  BellOff, Code, Target, Phone, Calendar, Layers, Map, Crown, ChevronRight,
  Menu, X, BarChart3, Clapperboard, Power, Bell, Lock, GitCommit, Sigma,
  FlaskConical, ShieldCheck, Globe
} from "lucide-react";
import { MultiplayerSessionBanner, EcosystemNav, EnvironmentLabel, useDemoMode, MODE_LABELS, MODE_COLORS, MODE_ICONS } from "@szl-holdings/shared-ui";

export type WorkspaceMode = "strategy" | "operations" | "infrastructure";

const ACCENT: Record<WorkspaceMode, string> = {
  strategy: "#8b7ac8",
  operations: "#d4a054",
  infrastructure: "#c9a227",
};

const WORKSPACE_TABS: { mode: WorkspaceMode; label: string; icon: typeof LayoutDashboard; sublabel: string }[] = [
  { mode: "strategy", label: "Strategy", sublabel: "Governed Decision Loop", icon: Globe2 },
  { mode: "operations", label: "Operations", sublabel: "Lyte — AIOps", icon: Zap },
  { mode: "infrastructure", label: "Infrastructure", sublabel: "IMPERIUM", icon: Shield },
];

type NavGroup = { section: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] };

const STRATEGY_NAV: NavGroup[] = [
  {
    section: "ATLAS Spatial Runtime",
    items: [
      { href: "/strategy/atlas-runtime", label: "Cross-Domain Twin View", icon: Layers },
    ],
  },
  {
    section: "Command",
    items: [
      { href: "/strategy", label: "Governed Decision Loop", icon: LayoutDashboard },
      { href: "/strategy/executive-briefing", label: "Executive Briefing", icon: FileText },
      { href: "/strategy/briefing", label: "Briefing History", icon: BarChart3 },
    ],
  },
  {
    section: "Primitives",
    items: [
      { href: "/strategy/simulation", label: "Simulation", icon: Activity },
      { href: "/strategy/correlation-map", label: "Outcome Graph", icon: Network },
      { href: "/strategy/signal-chains", label: "Signal Chains", icon: GitCommit },
    ],
  },
  {
    section: "Cognitive Consoles",
    items: [
      { href: "/cognitive", label: "Command Center", icon: Brain },
      { href: "/cognitive/self-model", label: "Self Model", icon: Cpu },
      { href: "/cognitive/world-model", label: "World Model", icon: Globe },
    ],
  },
];

const OPERATIONS_NAV: NavGroup[] = [
  {
    section: "Governed Decision Loop",
    items: [
      { href: "/operations", label: "Executive Command", icon: LayoutDashboard },
      { href: "/operations/prism/pulse", label: "Pulse", icon: Heart },
      { href: "/operations/prism/signals", label: "Signal Feed", icon: Radio },
      { href: "/operations/blocker-board", label: "Blocker Board", icon: AlertTriangle },
      { href: "/operations/approvals", label: "Approvals", icon: CheckSquare },
      { href: "/operations/policy-approvals", label: "Policy Approvals", icon: ShieldCheck },
      { href: "/operations/trust-audit", label: "Proof Chain Audit", icon: Shield },
      { href: "/operations/inbox", label: "Command Inbox", icon: Inbox },
    ],
  },
  {
    section: "Alloy — Execution",
    items: [
      { href: "/operations/alloy/canvas", label: "Workflow Canvas", icon: Workflow },
      { href: "/operations/alloy/actions", label: "Action Queue", icon: Activity },
      { href: "/operations/alloy/governance", label: "Covenant Policy", icon: Lock },
      { href: "/operations/alloy/intelligence", label: "Intelligence", icon: Brain },
      { href: "/operations/alloy/traces", label: "Execution Traces", icon: GitBranch },
      { href: "/operations/ownership", label: "Ownership Map", icon: Users },
    ],
  },
  {
    section: "Observability",
    items: [
      { href: "/operations/autonomous-noc", label: "Autonomous NOC", icon: Bot },
      { href: "/operations/slo", label: "SLO Management", icon: Target },
      { href: "/operations/metrics", label: "Metrics", icon: BarChart3 },
      { href: "/operations/logs", label: "Log Analytics", icon: Database },
      { href: "/operations/tracing", label: "Distributed Tracing", icon: GitBranch },
      { href: "/operations/topology", label: "Service Topology", icon: Network },
      { href: "/operations/self-healing", label: "Self-Healing", icon: RotateCcw },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/operations/what-changed", label: "Twin State Changes", icon: Activity },
      { href: "/operations/digest", label: "Digest Center", icon: FileText },
      { href: "/operations/finops", label: "FinOps", icon: DollarSign },
      { href: "/operations/on-call", label: "On-Call", icon: Phone },
      { href: "/operations/runbook-studio", label: "Runbook Studio", icon: BookOpen },
      { href: "/operations/noise-reduction", label: "Noise Reduction", icon: BellOff },
    ],
  },
];

const INFRASTRUCTURE_NAV: NavGroup[] = [
  {
    section: "IMPERIUM Command",
    items: [
      { href: "/infrastructure", label: "Executive Console", icon: Crown },
      { href: "/infrastructure/intelligence", label: "Intelligence Briefing", icon: Radio },
      { href: "/infrastructure/imperium-map", label: "Resource Map", icon: Map },
    ],
  },
  {
    section: "Security & Governance",
    items: [
      { href: "/infrastructure/praetorian", label: "Security Perimeter", icon: Shield },
      { href: "/infrastructure/senate", label: "Governance Board", icon: BookOpen },
      { href: "/infrastructure/centurion", label: "AI Operations", icon: Cpu },
    ],
  },
  {
    section: "Network",
    items: [
      { href: "/infrastructure/supply-lines", label: "Network Topology", icon: Network },
    ],
  },
];

function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{
      padding: "0.5rem 0.625rem 0.25rem",
      fontSize: "7px",
      fontWeight: 700,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "rgba(255,255,255,0.2)",
      fontFamily: "monospace",
      marginTop: "0.5rem",
    }}>
      {label}
    </div>
  );
}

function NavItem({ href, label, icon: Icon, isActive, accent, badge }: {
  href: string; label: string; icon: typeof LayoutDashboard; isActive: boolean; accent: string; badge?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2.5 py-[5px] text-[10px] font-medium transition-all relative group rounded"
      style={{ color: isActive ? accent : "rgba(255,255,255,0.5)", background: isActive ? `${accent}12` : "transparent" }}
    >
      {isActive && <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r" style={{ background: accent }} />}
      <Icon className="w-3 h-3 shrink-0" style={{ color: isActive ? accent : "rgba(255,255,255,0.3)", opacity: isActive ? 1 : 0.7 }} />
      <span className="flex-1 truncate">{label}</span>
      {badge}
    </Link>
  );
}

function PendingApprovalsBadge({ accent }: { accent: string }) {
  const { data } = useQuery<{ data?: unknown[]; meta?: { total?: number } }>({
    queryKey: ["guardian", "actions-pending-count"],
    queryFn: () =>
      fetch("/api/guardian/actions?status=pending&limit=1", { credentials: "include" })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 0,
  });
  const count = data?.meta?.total ?? data?.data?.length ?? 0;
  if (!count) return null;
  return (
    <span
      className="text-[8px] font-mono font-bold px-1 rounded shrink-0"
      style={{
        color: accent,
        background: `${accent}1a`,
        border: `1px solid ${accent}40`,
        minWidth: 14,
        textAlign: "center",
        lineHeight: "13px",
      }}
      data-testid="policy-approvals-badge"
      title={`${count} pending policy approval${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </span>
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

type EnvKind = "live" | "pilot" | "demo" | "seeded" | "simulated";

function resolveEnvironment(): EnvKind {
  const override = (import.meta.env.VITE_DEPLOY_ENV as string | undefined)?.toLowerCase();
  if (override && ["live", "pilot", "demo", "seeded", "simulated"].includes(override)) {
    return override as EnvKind;
  }
  return import.meta.env.PROD ? "live" : "demo";
}

interface HealthSummary {
  summary?: { total?: number; liveConfigured?: number; mockedDemoMode?: number; manualRequired?: number };
}

function HeaderStatusPills() {
  const { mode: persona } = useDemoMode();
  const personaColors = MODE_COLORS[persona];
  const environment = resolveEnvironment();

  const { data: health, isError: healthError, isLoading: healthLoading } = useQuery<HealthSummary>({
    queryKey: ["unified-layout-svc-health"],
    queryFn: () =>
      fetch("/api/services/health/app/command")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  });

  const summary = health?.summary;
  const unhealthy = summary?.manualRequired ?? 0;
  const mocked = summary?.mockedDemoMode ?? 0;

  let svc: { color: string; bg: string; border: string; label: string; title: string };
  if (healthLoading) {
    svc = { color: "#7c8a9a", bg: "rgba(124,138,154,0.08)", border: "rgba(124,138,154,0.2)", label: "SVC …", title: "Checking command-plane health" };
  } else if (healthError) {
    svc = { color: "#7c8a9a", bg: "rgba(124,138,154,0.08)", border: "rgba(124,138,154,0.2)", label: "SVC ?", title: "Health endpoint unreachable" };
  } else if (unhealthy > 0) {
    svc = { color: "#c45a4a", bg: "rgba(196,90,74,0.08)", border: "rgba(196,90,74,0.22)", label: `SVC ${unhealthy}!`, title: `${unhealthy} service(s) require manual attention` };
  } else if (mocked > 0) {
    svc = { color: "#c8953c", bg: "rgba(200,149,60,0.08)", border: "rgba(200,149,60,0.22)", label: `SVC MOCK`, title: `${mocked} service(s) running in demo/mock mode` };
  } else {
    svc = { color: "#6b8f71", bg: "rgba(107,143,113,0.08)", border: "rgba(107,143,113,0.2)", label: "SVC OK", title: "All command-plane services healthy" };
  }

  return (
    <div className="hidden md:flex items-center gap-1.5" data-testid="header-status-pills">
      <EnvironmentLabel environment={environment} />
      <span
        className="flex items-center gap-1 text-[8px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded"
        style={{ color: personaColors.text, background: personaColors.bg, border: `1px solid ${personaColors.border}` }}
        title={`Persona view: ${MODE_LABELS[persona]}`}
        data-testid="header-persona-pill"
      >
        <span style={{ fontSize: "10px" }}>{MODE_ICONS[persona]}</span>
        {MODE_LABELS[persona].toUpperCase()}
      </span>
      <span
        className="flex items-center gap-1 text-[8px] font-mono font-semibold tracking-wider px-2 py-0.5 rounded"
        style={{ color: svc.color, background: svc.bg, border: `1px solid ${svc.border}` }}
        title={svc.title}
        data-testid="header-svc-pill"
      >
        <span className="w-1 h-1 rounded-full" style={{ background: svc.color }} />
        {svc.label}
      </span>
    </div>
  );
}

function DemoEnvironmentBanner({ environment }: { environment: string }) {
  const [dismissed, setDismissed] = useState(false);
  const isDemo = environment === "demo" || environment === "simulated";
  if (!isDemo || dismissed) return null;
  return (
    <div
      className="flex items-center justify-between gap-2 px-4 py-1.5 shrink-0"
      style={{
        background: "linear-gradient(90deg, rgba(212,160,84,0.08) 0%, rgba(212,160,84,0.04) 100%)",
        borderBottom: "1px solid rgba(212,160,84,0.14)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <FlaskConical className="w-3 h-3 shrink-0" style={{ color: "#d4a054" }} />
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color: "#d4a054" }}>
          Demo Mode
        </span>
        <span className="hidden sm:inline text-[9px] font-mono" style={{ color: "rgba(212,160,84,0.50)" }}>
          Synthetic data · No live systems connected · All actions are safe
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-[9px] font-mono hover:opacity-80 transition-opacity shrink-0"
        style={{ color: "rgba(212,160,84,0.4)" }}
        aria-label="Dismiss demo banner"
      >
        dismiss
      </button>
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

  const navGroups = mode === "strategy" ? STRATEGY_NAV
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
              <div className="text-[7px] uppercase tracking-[0.15em] mt-px" style={{ color: `${accent}70` }}>Unified Command</div>
            </div>
          </div>
        </div>

        <WorkspaceSwitcher mode={mode} onModeChange={(m) => { onModeChange(m); setSidebarOpen(false); }} />

        <nav className="flex-1 min-h-0 px-1.5 py-1 overflow-y-auto flex flex-col">
          {navGroups.map((group) => (
            <div key={group.section}>
              <SectionHeader label={group.section} />
              {group.items.map((item) => {
                const exactOnlyRoutes = ["/strategy", "/operations", "/infrastructure", "/cognitive"];
                const isActive = exactOnlyRoutes.includes(item.href)
                  ? location === item.href || (location === "/" && item.href === "/strategy")
                  : location.startsWith(item.href) && !exactOnlyRoutes.includes(item.href)
                    ? true
                    : location === item.href;
                const badge = item.href === "/operations/policy-approvals"
                  ? <PendingApprovalsBadge accent={accent} />
                  : undefined;
                return (
                  <NavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={isActive}
                    accent={accent}
                    badge={badge}
                  />
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-3 py-2 border-t" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="text-[7px] uppercase tracking-widest font-mono mb-1.5" style={{ color: "rgba(255,255,255,0.2)" }}>Domain Packs</div>
          <div className="flex gap-1 flex-wrap">
            {[
              { label: "AEGIS", href: "/aegis/", color: "#ef4444" },
              { label: "TERRA", href: "/terra/", color: "#22c55e" },
              { label: "VESSELS", href: "/vessels/", color: "#0ea5e9" },
              { label: "PRISM", href: "/prism-counsel/", color: "#8b7ac8" },
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
              {WORKSPACE_TABS.find((t) => t.mode === mode)?.label}
            </span>
            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
              · {WORKSPACE_TABS.find((t) => t.mode === mode)?.sublabel}
            </span>
            <div className="hidden md:block w-px h-3.5 mx-1" style={{ background: "rgba(255,255,255,0.06)" }} />
            <HeaderStatusPills />
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

        <DemoEnvironmentBanner environment={resolveEnvironment()} />

        <main className="flex-1 overflow-auto" style={{ background: "#080c14" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
