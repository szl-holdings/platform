import { Link, useLocation } from "wouter";
import { cn } from "@workspace/shared-ui/utils";
import { ReactNode, useState } from "react";
import {
  Zap, Menu, X, ChevronDown, Bell, Settings, Users, Flag, FileText,
  Database, Play, Activity, CheckSquare, Shield, Network, Heart,
  AlertTriangle, Brain, Radio, Workflow, Inbox, Search, UserCheck,
  ChevronRight, Gauge, BarChart3, LayoutDashboard
} from "lucide-react";
import { useRealtimeChannel, RealtimeStatusIndicator } from "@workspace/shared-ui";

const PRISM_ITEMS = [
  { key: "P", label: "Pulse", color: "#d4a054", icon: Heart, href: "/prism/pulse" },
  { key: "R", label: "Risk", color: "#c45a4a", icon: AlertTriangle, href: "/prism/risk" },
  { key: "I", label: "Intelligence", color: "#8b7ac8", icon: Brain, href: "/prism/intelligence" },
  { key: "S", label: "Signals", color: "#c8953c", icon: Radio, href: "/prism/signals" },
  { key: "M", label: "Motion", color: "#4a90b8", icon: Workflow, href: "/prism/motion" },
];

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: "/", label: "Overview", icon: Gauge },
    ],
  },
  {
    label: "PRISM",
    items: [
      { href: "/prism/pulse", label: "Pulse", icon: Heart },
      { href: "/prism/risk", label: "Risk", icon: AlertTriangle },
      { href: "/prism/intelligence", label: "Intelligence", icon: Brain },
      { href: "/prism/signals", label: "Signals", icon: Radio },
      { href: "/prism/motion", label: "Motion", icon: Workflow },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/inbox", label: "Inbox", icon: Inbox },
      { href: "/explorer", label: "Explorer", icon: Search },
      { href: "/topology", label: "Topology", icon: Network },
      { href: "/ownership", label: "Ownership", icon: Users },
      { href: "/approvals", label: "Approvals", icon: CheckSquare },
      { href: "/workflows", label: "Workflows", icon: Workflow },
      { href: "/readiness", label: "Readiness", icon: Shield },
    ],
  },
];

const ADMIN_NAV = [
  { href: "/admin/overview", label: "System Overview", icon: Settings },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/flags", label: "Feature Flags", icon: Flag },
  { href: "/admin/runs", label: "Workflow Runs", icon: Play },
  { href: "/admin/approvals", label: "Approval Queue", icon: CheckSquare },
  { href: "/admin/audit", label: "Audit Log", icon: FileText },
  { href: "/admin/seeder", label: "Demo Data Seeder", icon: Database },
  { href: "/admin/jobs", label: "Job Status", icon: Activity },
];

const PRISM_COLORS: Record<string, string> = {
  "Pulse": "#d4a054",
  "Risk": "#c45a4a",
  "Intelligence": "#8b7ac8",
  "Signals": "#c8953c",
  "Motion": "#4a90b8",
};

function AdminNavSection({ location }: { location: string }) {
  const [open, setOpen] = useState(false);
  const isInAdmin = location.startsWith("/admin");
  if (!open && !isInAdmin) {
    return (
      <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 w-full text-slate-500 hover:text-white hover:bg-white/5"
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          <span>Admin</span>
          <ChevronDown className="w-3 h-3 ml-auto" />
        </button>
      </div>
    );
  }
  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
      <button
        onClick={() => setOpen(false)}
        className="flex items-center gap-2 px-3 pb-1.5 w-full"
      >
        <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: "rgba(255,255,255,0.25)" }}>Admin</span>
        <ChevronDown className="w-3 h-3 ml-auto rotate-180" style={{ color: "rgba(255,255,255,0.2)" }} />
      </button>
      {ADMIN_NAV.map((item) => {
        const isActive = location.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href} className={cn(
            "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 group relative",
            isActive ? "" : "text-slate-500 hover:text-white hover:bg-white/5"
          )} style={{ background: isActive ? "rgba(212,160,84,0.06)" : undefined, color: isActive ? "#d4a054" : undefined }}>
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: "#d4a054" }} />}
            <item.icon className={cn("w-3 h-3 shrink-0", isActive ? "" : "text-slate-600 group-hover:text-slate-400")} style={isActive ? { color: "#d4a054" } : {}} />
            <span className="text-[11px]">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function LyteLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { status: wsStatus } = useRealtimeChannel("lyte-metrics");

  return (
    <div className="flex h-full overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={cn(
        "border-r flex flex-col shrink-0 relative z-20 transition-transform duration-200",
        "fixed md:relative inset-y-0 left-0 w-56",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )} style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(8,12,20,0.95)" }}>
        <div className="h-14 flex items-center px-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(212,160,84,0.1)", border: "1px solid rgba(212,160,84,0.15)" }}>
              <Zap className="w-4 h-4" style={{ color: "#d4a054" }} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide text-white leading-none">LYTE</span>
              <span className="text-[9px] uppercase tracking-widest leading-none mt-0.5" style={{ color: "#d4a054" }}>Business Observability</span>
            </div>
          </div>
        </div>

        <div className="px-3 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
          <div className="text-[9px] uppercase tracking-widest mb-2 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>PRISM</div>
          <div className="grid grid-cols-5 gap-1">
            {PRISM_ITEMS.map((p) => {
              const isActive = location.startsWith(p.href);
              return (
                <Link key={p.key} href={p.href} className="flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-md transition-all hover:opacity-80" style={{
                  background: isActive ? `${p.color}15` : `${p.color}08`,
                  border: `1px solid ${isActive ? p.color + "40" : p.color + "15"}`,
                }}>
                  <span className="text-[10px] font-black" style={{ color: p.color }}>{p.key}</span>
                  <span className="text-[7px] uppercase tracking-wider" style={{ color: `${p.color}90` }}>{p.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <nav className="flex-1 min-h-0 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.label ?? gi} className={gi > 0 ? "mt-2 pt-2 border-t" : ""} style={gi > 0 ? { borderColor: "rgba(255,255,255,0.05)" } : {}}>
                {group.label && (
                  <div className="px-3 pb-1.5 text-[9px] font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)" }}>{group.label}</div>
                )}
                {group.items.map((item) => {
                  const isPrism = item.href.startsWith("/prism/");
                  const prismColor = isPrism ? PRISM_COLORS[item.label] : undefined;
                  const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 group relative",
                      isActive ? "" : "text-slate-400 hover:text-white hover:bg-white/5"
                    )} style={{
                      background: isActive ? (prismColor ? `${prismColor}12` : "rgba(212,160,84,0.06)") : undefined,
                      color: isActive && prismColor ? prismColor : undefined,
                    }}>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full" style={{ background: prismColor ?? "#d4a054" }} />}
                      <item.icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "" : "text-slate-500 group-hover:text-slate-300")} style={isActive && prismColor ? { color: prismColor } : {}} />
                      <span className="text-[11px]">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}

            <AdminNavSection location={location} />
          </nav>

          <div className="mt-auto shrink-0 px-3 py-3 mx-2 mb-2 rounded-lg" style={{ background: "rgba(212,160,84,0.03)", border: "1px solid rgba(212,160,84,0.06)" }}>
            <div className="text-[9px] uppercase tracking-widest font-medium mb-2" style={{ color: "rgba(212,160,84,0.35)" }}>System Pulse</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Urgent exposures</span>
                <span className="text-[9px] font-mono" style={{ color: "#c45a4a" }}>5 active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Ownership gaps</span>
                <span className="text-[9px] font-mono" style={{ color: "#c8953c" }}>8 open</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Decision latency</span>
                <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>34h avg</span>
              </div>
            </div>
            <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div className="h-full rounded-full" style={{ width: "38%", background: "linear-gradient(90deg, #c45a4a, #c8953c)" }} />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-[8px]" style={{ color: "rgba(255,255,255,0.2)" }}>Resolution rate</span>
              <span className="text-[8px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>38%</span>
            </div>
          </div>
        </div>

        <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            <Zap className="w-3 h-3" />
            <span>SZL Business OS</span>
          </div>
          <div className="flex gap-1 mt-2">
            <a href="/terra/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80" style={{ color: "#a07848", background: "rgba(160,120,72,0.1)", border: "1px solid rgba(160,120,72,0.2)" }}>TERRA</a>
            <a href="/alloy" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80" style={{ color: "#4B8BDB", background: "rgba(75,139,219,0.1)", border: "1px solid rgba(75,139,219,0.2)" }}>ALLOY</a>
            <a href="/vessels/" className="text-[9px] px-1.5 py-0.5 rounded font-medium hover:opacity-80" style={{ color: "#38bdf8", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>VESSELS</a>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:ml-0 ml-0">
        <header className="h-11 border-b flex items-center justify-between px-4 md:px-6 shrink-0 z-10" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(8,12,20,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-3 text-xs font-mono">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-white/5 transition-colors mr-2"
              style={{ color: "rgba(255,255,255,0.5)" }}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse hidden sm:block" style={{ background: "#c45a4a" }} />
            <span className="hidden sm:block" style={{ color: "#c45a4a" }}>5 Urgent</span>
            <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span style={{ color: "#c8953c" }}>8 Gaps</span>
            <span className="hidden sm:block" style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span className="hidden sm:block" style={{ color: "#d4a054" }}>$5.03M at risk</span>
          </div>
          <div className="flex items-center gap-3">
            <RealtimeStatusIndicator status={wsStatus} compact />
            <button className="relative p-1.5 rounded-lg hover:bg-white/5 transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            </button>
            <div className="h-5 w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-medium text-white">Stephen Lutar</div>
                <div className="text-[10px]" style={{ color: "rgba(212,160,84,0.6)" }}>SZL Holdings</div>
              </div>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border" style={{ background: "rgba(212,160,84,0.15)", borderColor: "rgba(212,160,84,0.2)", color: "#d4a054" }}>SL</div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto" style={{ background: "#080c14" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
