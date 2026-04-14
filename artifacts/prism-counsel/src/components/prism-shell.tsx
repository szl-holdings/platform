import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Scale, LayoutDashboard, FolderOpen, TrendingUp, Clock, FileText, Users,
  MessageSquare, Shield, Anchor, Settings, ChevronLeft, ChevronRight, Search, Bell,
  Sun, Eye, CheckSquare, Download, Brain, Globe, Activity, Layers, Link2,
  DollarSign, BarChart3, Zap, AlertTriangle, Building2, MapPin, Plug,
  Server, Radio, Gauge, Waves, Car, Move, ClipboardList, ClipboardCheck,
  ShieldAlert, XCircle, Archive, RefreshCw, Gavel, BookOpen, Star, Command,
  X, ArrowRight, ChevronDown, ChevronUp, Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRISM_GOLD = "#c8a96e";
const PRISM_BLUE = "#4a8ab0";
const PRISM_RED = "#b85a4a";

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
      { label: "Today", href: "/prism-counsel/today", icon: Sun },
      { label: "What Changed", href: "/prism-counsel/what-changed", icon: Activity },
      { label: "Morning Brief", href: "/prism-counsel/morning-brief", icon: Bell },
      { label: "Review", href: "/prism-counsel/review-before-send", icon: Eye },
      { label: "Sign-Off", href: "/prism-counsel/signoff-queue", icon: CheckSquare },
    ],
  },
  {
    label: "Matters",
    items: [
      { label: "Dashboard", href: "/prism-counsel", icon: LayoutDashboard },
      { label: "Matter Desk", href: "/prism-counsel/matters", icon: FolderOpen },
      { label: "Watchlist", href: "/prism-counsel/watchlist", icon: Eye },
      { label: "Deadlines", href: "/prism-counsel/deadlines", icon: Clock },
      { label: "Forecast", href: "/prism-counsel/forecast", icon: TrendingUp },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Approvals", href: "/prism-counsel/approvals", icon: Gavel },
      { label: "Discovery", href: "/prism-counsel/discovery", icon: FileText },
      { label: "Playbooks", href: "/prism-counsel/playbooks", icon: BookOpen },
      { label: "Parties", href: "/prism-counsel/parties", icon: Users },
      { label: "Word Export", href: "/prism-counsel/word-export", icon: Download },
    ],
  },
  {
    label: "Review Desk",
    items: [
      { label: "My Review", href: "/prism-counsel/review-desk/my-review", icon: ClipboardCheck },
      { label: "Review Queue", href: "/prism-counsel/review-desk", icon: ClipboardList },
      { label: "Metrics", href: "/prism-counsel/review-desk/metrics", icon: BarChart3 },
      { label: "Admin", href: "/prism-counsel/review-desk/admin", icon: Settings },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Copilot", href: "/prism-counsel/copilot", icon: MessageSquare },
      { label: "Workbench", href: "/prism-counsel/copilot-workbench", icon: Brain },
      { label: "Insurer Intel", href: "/prism-counsel/insurer-intel", icon: Building2 },
      { label: "Venue Intel", href: "/prism-counsel/venue-intel", icon: MapPin },
    ],
  },
  {
    label: "Predict",
    items: [
      { label: "Settlement Predictor", href: "/prism-counsel/predict/settlement", icon: TrendingUp },
      { label: "Judge Analytics", href: "/prism-counsel/predict/judge-analytics", icon: Gavel },
      { label: "Counsel Scouting", href: "/prism-counsel/predict/counsel-scouting", icon: Users },
      { label: "Litigation Cost", href: "/prism-counsel/predict/litigation-cost", icon: DollarSign },
      { label: "Case Strength", href: "/prism-counsel/predict/case-strength", icon: ShieldAlert },
      { label: "Insurance Optimizer", href: "/prism-counsel/predict/insurance-optimizer", icon: Star },
    ],
  },
  {
    label: "Marine Underwriting",
    items: [
      { label: "Underwriting Desk", href: "/prism-counsel/marine-underwriting", icon: Anchor },
      { label: "Policies", href: "/prism-counsel/marine-underwriting/policies", icon: Shield },
      { label: "Claims", href: "/prism-counsel/marine-underwriting/claims", icon: AlertTriangle },
      { label: "Portfolio", href: "/prism-counsel/marine-underwriting/portfolio", icon: BarChart3 },
    ],
  },
  {
    label: "Section 31",
    items: [
      { label: "Worldline", href: "/prism-counsel/worldline", icon: Globe },
      { label: "Pressure Graph", href: "/prism-counsel/pressure-graph", icon: Activity },
      { label: "Matter Twin", href: "/prism-counsel/matter-twin", icon: Layers },
      { label: "Proof Chain", href: "/prism-counsel/proof-chain", icon: Shield },
      { label: "Signal Forge", href: "/prism-counsel/signal-forge", icon: Radio },
      { label: "Forecast Diff", href: "/prism-counsel/forecast-diff", icon: TrendingUp },
      { label: "Data Products", href: "/prism-counsel/data-products", icon: BarChart3 },
    ],
  },
  {
    label: "New York",
    defaultCollapsed: true,
    items: [
      { label: "NY Command", href: "/prism-counsel/ny", icon: Scale },
      { label: "No-Fault", href: "/prism-counsel/ny/no-fault", icon: AlertTriangle },
      { label: "Watchlist", href: "/prism-counsel/ny/watchlist", icon: Eye },
      { label: "Deadlines", href: "/prism-counsel/ny/deadlines", icon: Clock },
      { label: "Coverage", href: "/prism-counsel/ny/coverage", icon: Shield },
      { label: "Mediation", href: "/prism-counsel/ny/mediation", icon: Activity },
      { label: "Insurer Intel", href: "/prism-counsel/ny/insurer-intel", icon: Building2 },
      { label: "Venue Intel", href: "/prism-counsel/ny/venue-intel", icon: MapPin },
      { label: "NY Forecast", href: "/prism-counsel/ny/forecast", icon: TrendingUp },
    ],
  },
  {
    label: "Portfolio",
    defaultCollapsed: true,
    items: [
      { label: "Partner View", href: "/prism-counsel/portfolio", icon: BarChart3 },
      { label: "Pressure Board", href: "/prism-counsel/portfolio/pressure-board", icon: Gauge },
      { label: "Friction Board", href: "/prism-counsel/portfolio/friction-board", icon: Waves },
      { label: "Review Backlog", href: "/prism-counsel/portfolio/review-backlog", icon: ClipboardList },
      { label: "Approval Bottleneck", href: "/prism-counsel/portfolio/approval-bottleneck", icon: CheckSquare },
      { label: "Recovery/Lien", href: "/prism-counsel/portfolio/recovery-lien", icon: DollarSign },
      { label: "Insurer Pressure", href: "/prism-counsel/portfolio/insurer-pressure", icon: Building2 },
      { label: "Team Throughput", href: "/prism-counsel/portfolio/throughput", icon: Users },
      { label: "Portfolio Forecast", href: "/prism-counsel/portfolio/forecast", icon: TrendingUp },
      { label: "Partner Life OS", href: "/prism-counsel/portfolio/partner-view", icon: Scale },
    ],
  },
  {
    label: "System",
    defaultCollapsed: true,
    items: [
      { label: "Recovery Ops", href: "/prism-counsel/recovery-ops", icon: ShieldAlert },
      { label: "Settlement Blockers", href: "/prism-counsel/settlement-blockers", icon: XCircle },
      { label: "Connectors", href: "/prism-counsel/connectors", icon: Plug },
      { label: "System Health", href: "/prism-counsel/admin/health", icon: Server },
      { label: "M365 Integration", href: "/prism-counsel/admin/m365", icon: Link2 },
      { label: "Purview Bridge", href: "/prism-counsel/admin/purview", icon: Shield },
      { label: "Quality Gates", href: "/prism-counsel/admin/quality", icon: BarChart3 },
      { label: "Model Costs", href: "/prism-counsel/admin/model-costs", icon: DollarSign },
      { label: "Ops Diagnostics", href: "/prism-counsel/admin/ops-diagnostics", icon: Activity },
      { label: "Replays", href: "/prism-counsel/admin/replays", icon: RefreshCw },
      { label: "Admin", href: "/prism-counsel/admin", icon: Settings },
    ],
  },
];

function NavSectionGroup({ section, collapsed, location }: { section: NavSection; collapsed: boolean; location: string }) {
  const [open, setOpen] = useState(!section.defaultCollapsed);

  const anyActive = section.items.some(item =>
    location === item.href || (item.href !== "/prism-counsel" && location.startsWith(item.href + "/"))
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
          (item.href !== "/prism-counsel" && location.startsWith(item.href + "/")) ||
          (item.href === "/prism-counsel" && (location === "/prism-counsel" || location === "/prism-counsel/"));
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
              <div className="text-[9px] text-[#c8a96e] leading-none mt-0.5 font-medium tracking-wide">MATTER COMMAND</div>
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
            <span className="text-slate-700">/</span>
            <span className="text-slate-400">{getBreadcrumb(location)}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
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
  if (location === "/prism-counsel" || location === "/prism-counsel/") return "Dashboard";
  const path = location.replace("/prism-counsel/", "");
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
