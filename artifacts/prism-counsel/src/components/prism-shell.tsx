import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { DOCTRINE_LAYER_COLORS } from "@szl-holdings/shared-ui";
import {
  Scale, LayoutDashboard, FolderOpen, TrendingUp, Clock, FileText, Users,
  MessageSquare, Shield, Settings, ChevronLeft, ChevronRight, Search, Bell,
  Sun, Eye, CheckSquare, Download, Brain, Globe, Activity, Layers, Link2,
  DollarSign, BarChart3, Zap, AlertTriangle, Building2, MapPin, Plug,
  Server, Radio, Gauge, Waves, Car, Move, ClipboardList, ClipboardCheck,
  ShieldAlert, XCircle, Archive, RefreshCw, Gavel, BookOpen, Star, Command,
  X, ArrowRight, ChevronDown, ChevronUp, Menu, LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

const ECOSYSTEM_PLATFORMS = [
  { name: "SZL Holdings", href: "/", accent: "#94a3b8", short: "SZL" },
  { name: "Lyte", href: "/lyte-command-center/", accent: "#e8b84b", short: "LY" },
  { name: "Vessels", href: "/vessels/", accent: "#38bdf8", short: "VS" },
  { name: "Aegis", href: "/firestorm/", accent: "#ef4444", short: "AE" },
  { name: "Terra", href: "/terra/", accent: "#4ade80", short: "TR" },
  { name: "Carlota Jo", href: "/carlota-jo/", accent: "#d4a27f", short: "CJ" },
  { name: "Stephen Lutar", href: "/stephen/", accent: "#94a3b8", short: "SL" },
];

function EcosystemSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.06]"
        title="Switch platform"
      >
        <LayoutGrid className="w-3 h-3" />
        <span className="hidden sm:inline text-[9px]">Ecosystem</span>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 rounded-lg py-1 z-50 shadow-xl"
          style={{ background: "#0d1524", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="px-3 py-1.5 text-[9px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            SZL Holdings Ecosystem
          </div>
          {ECOSYSTEM_PLATFORMS.map(p => (
            <a
              key={p.name}
              href={p.href}
              className="flex items-center gap-2.5 px-3 py-2 text-[11px] hover:bg-white/[0.04] transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
              onClick={() => setOpen(false)}
            >
              <span className="w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: `${p.accent}18`, color: p.accent }}>{p.short}</span>
              <span>{p.name}</span>
            </a>
          ))}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} className="mt-1 pt-1">
            <div className="flex items-center gap-2.5 px-3 py-1.5">
              <span className="w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center flex-shrink-0" style={{ background: `${PRISM_GOLD}18`, color: PRISM_GOLD }}>PC</span>
              <span className="text-[11px]" style={{ color: PRISM_GOLD }}>PRISM Counsel</span>
              <span className="ml-auto text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>current</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  label: string;
  icon?: React.ElementType;
  items: NavItem[];
  defaultCollapsed?: boolean;
}

const NAV: NavSection[] = [
  {
    label: "Daily",
    items: [
      { label: "Today", href: "/today", icon: Sun },
      { label: "What Changed", href: "/what-changed", icon: Activity },
      { label: "Morning Brief", href: "/morning-brief", icon: Bell },
      { label: "Review", href: "/review-before-send", icon: Eye },
      { label: "Sign-Off", href: "/signoff-queue", icon: CheckSquare },
    ],
  },
  {
    label: "Matters",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Matter Desk", href: "/matters", icon: FolderOpen },
      { label: "Watchlist", href: "/watchlist", icon: Eye },
      { label: "Deadlines", href: "/deadlines", icon: Clock },
      { label: "Forecast", href: "/forecast", icon: TrendingUp },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Approvals", href: "/approvals", icon: Gavel },
      { label: "Discovery", href: "/discovery", icon: FileText },
      { label: "Playbooks", href: "/playbooks", icon: BookOpen },
      { label: "Parties", href: "/parties", icon: Users },
      { label: "Word Export", href: "/word-export", icon: Download },
    ],
  },
  {
    label: "Review Desk",
    items: [
      { label: "My Review", href: "/review-desk/my-review", icon: ClipboardCheck },
      { label: "Review Queue", href: "/review-desk", icon: ClipboardList },
      { label: "Metrics", href: "/review-desk/metrics", icon: BarChart3 },
      { label: "Admin", href: "/review-desk/admin", icon: Settings },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Copilot", href: "/copilot", icon: MessageSquare },
      { label: "Workbench", href: "/copilot-workbench", icon: Brain },
      { label: "Insurer Intel", href: "/insurer-intel", icon: Building2 },
      { label: "Venue Intel", href: "/venue-intel", icon: MapPin },
    ],
  },
  {
    label: "Section 31",
    items: [
      { label: "Worldline", href: "/worldline", icon: Globe },
      { label: "Pressure Graph", href: "/pressure-graph", icon: Activity },
      { label: "Matter Twin", href: "/matter-twin", icon: Layers },
      { label: "Proof Chain", href: "/proof-chain", icon: Shield },
      { label: "Signal Forge", href: "/signal-forge", icon: Radio },
      { label: "Forecast Diff", href: "/forecast-diff", icon: TrendingUp },
      { label: "Data Products", href: "/data-products", icon: BarChart3 },
    ],
  },
  {
    label: "New York",
    defaultCollapsed: true,
    items: [
      { label: "NY Command", href: "/ny", icon: Scale },
      { label: "No-Fault", href: "/ny/no-fault", icon: AlertTriangle },
      { label: "Watchlist", href: "/ny/watchlist", icon: Eye },
      { label: "Deadlines", href: "/ny/deadlines", icon: Clock },
      { label: "Coverage", href: "/ny/coverage", icon: Shield },
      { label: "Mediation", href: "/ny/mediation", icon: Activity },
      { label: "Insurer Intel", href: "/ny/insurer-intel", icon: Building2 },
      { label: "Venue Intel", href: "/ny/venue-intel", icon: MapPin },
      { label: "NY Forecast", href: "/ny/forecast", icon: TrendingUp },
    ],
  },
  {
    label: "Portfolio",
    defaultCollapsed: true,
    items: [
      { label: "Partner View", href: "/portfolio", icon: BarChart3 },
      { label: "Pressure Board", href: "/portfolio/pressure-board", icon: Gauge },
      { label: "Friction Board", href: "/portfolio/friction-board", icon: Waves },
      { label: "Review Backlog", href: "/portfolio/review-backlog", icon: ClipboardList },
      { label: "Approval Bottleneck", href: "/portfolio/approval-bottleneck", icon: CheckSquare },
      { label: "Recovery/Lien", href: "/portfolio/recovery-lien", icon: DollarSign },
      { label: "Insurer Pressure", href: "/portfolio/insurer-pressure", icon: Building2 },
      { label: "Team Throughput", href: "/portfolio/throughput", icon: Users },
      { label: "Portfolio Forecast", href: "/portfolio/forecast", icon: TrendingUp },
      { label: "Partner Life OS", href: "/portfolio/partner-view", icon: Scale },
    ],
  },
  {
    label: "System",
    defaultCollapsed: true,
    items: [
      { label: "Recovery Ops", href: "/recovery-ops", icon: ShieldAlert },
      { label: "Settlement Blockers", href: "/settlement-blockers", icon: XCircle },
      { label: "Connectors", href: "/connectors", icon: Plug },
      { label: "System Health", href: "/admin/health", icon: Server },
      { label: "M365 Integration", href: "/admin/m365", icon: Link2 },
      { label: "Purview Bridge", href: "/admin/purview", icon: Shield },
      { label: "Quality Gates", href: "/admin/quality", icon: BarChart3 },
      { label: "Model Costs", href: "/admin/model-costs", icon: DollarSign },
      { label: "Ops Diagnostics", href: "/admin/ops-diagnostics", icon: Activity },
      { label: "Replays", href: "/admin/replays", icon: RefreshCw },
      { label: "Admin", href: "/admin", icon: Settings },
    ],
  },
];

function NavSectionGroup({ section, collapsed, location }: { section: NavSection; collapsed: boolean; location: string }) {
  const [open, setOpen] = useState(!section.defaultCollapsed);

  const anyActive = section.items.some(item =>
    location === item.href || (item.href !== "/" && location.startsWith(item.href + "/"))
  );

  useEffect(() => {
    if (anyActive) setOpen(true);
  }, [anyActive]);

  return (
    <div>
      {!collapsed && (
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-3 py-1 text-[9px] font-semibold text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors"
        >
          <span>{section.label}</span>
          {open ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
        </button>
      )}
      {(open || collapsed) && section.items.map((item) => {
        const isActive = location === item.href ||
          (item.href !== "/" && location.startsWith(item.href + "/")) ||
          (item.href === "/" && (location === "/" || location === "/"));
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "group flex items-center gap-2.5 px-2.5 py-[5px] mx-1.5 rounded-[5px] text-[11px] cursor-pointer transition-all",
                isActive
                  ? "bg-[#c8a96e]/10 text-[#c8a96e] border border-[#c8a96e]/15"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border border-transparent"
              )}
            >
              <Icon className={cn("flex-shrink-0 transition-colors", collapsed ? "w-4 h-4" : "w-3.5 h-3.5", isActive ? "text-[#c8a96e]" : "text-slate-600 group-hover:text-slate-400")} />
              {!collapsed && <span className="truncate font-medium">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded-full bg-[#b85a4a]/20 text-[#b85a4a] font-mono">{item.badge}</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

interface CommandBarResult {
  label: string;
  href: string;
  section: string;
}

function CommandBar({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const allItems = NAV.flatMap(s => s.items.map(i => ({ ...i, section: s.label })));
  const results: CommandBarResult[] = query.trim().length > 0
    ? allItems.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || i.section.toLowerCase().includes(query.toLowerCase()))
    : allItems.slice(0, 8);

  function go(href: string) {
    navigate(href);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-xl border border-white/[0.12] shadow-2xl overflow-hidden" style={{ background: "#0d1322" }}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-[#c8a96e]" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && results[0]) go(results[0].href); }}
            placeholder="Search Prism Counsel..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 outline-none"
          />
          <button onClick={onClose} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {results.map((r, i) => {
            const Icon = allItems.find(a => a.href === r.href)?.icon || ArrowRight;
            return (
              <button
                key={i}
                onClick={() => go(r.href)}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-white/[0.04] transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-sm text-slate-300 flex-1">{r.label}</span>
                <span className="text-[10px] text-slate-600">{r.section}</span>
              </button>
            );
          })}
        </div>
        <div className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-4">
          <span className="text-[10px] text-slate-600"><kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px] mr-1">↵</kbd> to select</span>
          <span className="text-[10px] text-slate-600"><kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px] mr-1">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}

export function PrismCounselShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#080c14", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {commandOpen && <CommandBar onClose={() => setCommandOpen(false)} />}

      <aside
        className={cn(
          "flex-shrink-0 flex flex-col border-r border-white/[0.05] transition-all duration-200",
          collapsed ? "w-[52px]" : "w-[212px]"
        )}
        style={{ background: "#09101c" }}
      >
        <div className="flex items-center gap-2.5 px-3 py-3 border-b border-white/[0.05]">
          <div className="w-6 h-6 rounded-[5px] flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #c8a96e22, #c8a96e08)", border: "1px solid #c8a96e30" }}>
            <Scale className="w-3.5 h-3.5 text-[#c8a96e]" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-slate-100 tracking-tight leading-none">PRISM COUNSEL</div>
              <a href="/szl-holdings/" className="text-[9px] text-[#c8a96e]/60 leading-none mt-0.5 font-medium tracking-wide hover:text-[#c8a96e] transition-colors block">SZL HOLDINGS ↗</a>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="px-2 py-2 border-b border-white/[0.04]">
            <button
              onClick={() => setCommandOpen(true)}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[10px] text-slate-600 hover:text-slate-400 transition-colors border border-white/[0.06] hover:border-white/[0.10] bg-white/[0.02]"
            >
              <Search className="w-3 h-3" />
              <span>Search...</span>
              <span className="ml-auto text-[9px] font-mono text-slate-700">⌘K</span>
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 space-y-1 scrollbar-none">
          {NAV.map((section) => (
            <NavSectionGroup
              key={section.label}
              section={section}
              collapsed={collapsed}
              location={location}
            />
          ))}
        </nav>

        <div className="border-t border-white/[0.04] px-2 py-2 space-y-1">
          {!collapsed && (
            <div className="px-2 py-1.5 rounded-[5px] flex items-center gap-2" style={{ background: "#0c1526" }}>
              <div className="w-5 h-5 rounded-full bg-[#c8a96e]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-[#c8a96e]">SC</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-slate-300 font-medium truncate">Sarah Chen</div>
                <div className="text-[9px] text-slate-600 truncate">Senior Associate</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-1 rounded text-slate-600 hover:text-slate-400 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 flex items-center gap-3 px-5 border-b border-white/[0.04]" style={{ height: "44px", background: "#09101c" }}>
          <div className="flex items-center gap-2 text-[10px] text-slate-600">
            <Scale className="w-3 h-3 text-[#c8a96e]/50" />
            <span>Prism Counsel</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
                padding: "1px 5px",
                borderRadius: "3px",
                background: "hsla(0 0% 100% / 0.04)",
                border: "1px solid hsla(0 0% 100% / 0.07)",
                marginLeft: "4px",
              }}
            >
              {(["OBSERVE", "UNDERSTAND", "DECIDE"] as const).map((layer, i) => (
                <span key={layer} style={{ display: "inline-flex", alignItems: "center", gap: "1px" }}>
                  {i > 0 && <span style={{ fontSize: "7px", color: "rgba(255,255,255,0.2)", margin: "0 1px" }}>+</span>}
                  <span style={{ fontSize: "8px", fontWeight: 700, letterSpacing: "0.06em", color: DOCTRINE_LAYER_COLORS[layer].color, fontFamily: "monospace", textTransform: "uppercase" }}>{layer}</span>
                </span>
              ))}
            </span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-400">{getBreadcrumb(location)}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <EcosystemSwitcher />

            <div className="w-px h-4 bg-white/[0.06]" />

            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.06]"
            >
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">Search</span>
              <span className="text-[9px] font-mono text-slate-700 hidden sm:inline">⌘K</span>
            </button>

            <div className="text-[9px] text-slate-700 font-mono hidden md:block">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>

            <div className="w-px h-4 bg-white/[0.06]" />

            <div className="w-6 h-6 rounded-full bg-[#c8a96e]/15 border border-[#c8a96e]/20 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <span className="text-[9px] font-bold text-[#c8a96e]">SC</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: "#080c14" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function getBreadcrumb(location: string): string {
  if (location === "/" || location === "/") return "Dashboard";
  const path = location.replace("/", "");
  const breadcrumbs: Record<string, string> = {
    today: "Today",
    matters: "Matters",
    forecast: "Forecast",
    deadlines: "Deadlines",
    approvals: "Approvals",
    copilot: "Copilot",
    "copilot-workbench": "Copilot Workbench",
    connectors: "Connectors",
    admin: "Admin",
    watchlist: "Watchlist",
    "insurer-intel": "Insurer Intel",
    "venue-intel": "Venue Intel",
    "no-fault": "No-Fault",
    ny: "New York Command",
    "matter-twin": "Matter Twin",
    "proof-chain": "Proof Chain",
    worldline: "Worldline",
    "signal-forge": "Signal Forge",
    "pressure-graph": "Pressure Graph",
    "review-before-send": "Review Before Send",
    "signoff-queue": "Sign-Off Queue",
    "word-export": "Word Export",
    "what-changed": "What Changed",
    "review-desk": "Review Desk",
    "recovery-ops": "Recovery Ops",
    "settlement-blockers": "Settlement Blockers",
    "morning-brief": "Morning Brief",
    portfolio: "Portfolio",
    parties: "Parties",
    discovery: "Discovery",
    playbooks: "Playbooks",
    "forecast-diff": "Forecast Diff",
    "data-products": "Data Products",
  };
  const base = path.split("/")[0];
  if (path.startsWith("matters/")) return "Matter Detail";
  if (path.startsWith("matter-desk/")) return "Matter Desk";
  if (path.startsWith("admin/health")) return "System Health";
  if (path.startsWith("admin/")) return "Admin";
  if (path.startsWith("review-desk/")) return "Review Desk";
  if (path.startsWith("portfolio/")) return "Portfolio";
  if (path.startsWith("ny/")) return "New York";
  return breadcrumbs[base] || base.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
