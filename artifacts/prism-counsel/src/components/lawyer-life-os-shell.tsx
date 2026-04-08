import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sun, FolderOpen, BookOpen, Eye, CheckSquare, Settings2,
  Scale, ChevronLeft, ChevronRight, AlertTriangle, Clock,
  MessageSquare, FileText, TrendingUp, Shield, Bell,
  Download, Briefcase, Brain, Layers, BarChart3, Zap,
  Activity, DollarSign, MapPin, Building2, Users, Globe,
  Server, Plug, Star, HelpCircle, ShieldAlert, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOP_MODES = [
  { key: "today", label: "Today", href: "/today", icon: Sun, accent: "#d4a054" },
  { key: "matter-desk", label: "Matter Desk", href: "/matters", icon: FolderOpen, accent: "#4a90b8" },
  { key: "prep", label: "Prep", href: "/prep", icon: BookOpen, accent: "#8b7ac8" },
  { key: "review", label: "Review", href: "/review-before-send", icon: Eye, accent: "#c45a4a" },
  { key: "signoff", label: "Sign-Off", href: "/signoff-queue", icon: CheckSquare, accent: "#4a90b8" },
  { key: "ops", label: "Ops", href: "/ops-lite", icon: Settings2, accent: "#6b7280" },
];

const LEFT_SECTIONS = [
  {
    label: "My Matters",
    items: [
      { label: "All Matters", href: "/matters", icon: FolderOpen },
      { label: "High Pressure", href: "/matters?filter=high-pressure", icon: AlertTriangle },
      { label: "Quiet Risk", href: "/quiet-risk", icon: Eye },
      { label: "Ready to Move", href: "/matters?filter=ready", icon: Zap },
      { label: "Needs Evidence", href: "/matters?filter=missing-evidence", icon: FileText },
    ],
  },
  {
    label: "Named Workflows",
    items: [
      { label: "Open My Day", href: "/workflows/open-my-day", icon: Sun },
      { label: "Prep a Demand", href: "/workflows/prep-demand", icon: BookOpen },
      { label: "Prep for Mediation", href: "/workflows/prep-mediation", icon: MessageSquare },
      { label: "Review Carrier Comms", href: "/workflows/review-carrier-comms", icon: Building2 },
      { label: "What's Blocking?", href: "/workflows/blocking", icon: AlertTriangle },
      { label: "Clear Review Queue", href: "/workflows/clear-review", icon: CheckSquare },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Workbench", href: "/copilot-workbench", icon: Brain },
      { label: "Insurer Intel", href: "/insurer-intel", icon: Building2 },
      { label: "Forecast", href: "/forecast", icon: TrendingUp },
      { label: "Deadlines", href: "/deadlines", icon: Clock },
    ],
  },
  {
    label: "Section 31",
    items: [
      { label: "Worldline", href: "/worldline", icon: Globe },
      { label: "Pressure Graph", href: "/pressure-graph", icon: Activity },
      { label: "Matter Twin", href: "/matter-twin", icon: Layers },
      { label: "Proof Chain", href: "/proof-chain", icon: Shield },
      { label: "Forecast Diff", href: "/forecast-diff", icon: BarChart3 },
    ],
  },
  {
    label: "Recovery & Liens",
    items: [
      { label: "Recovery View", href: "/recovery-view", icon: ShieldAlert },
      { label: "Settlement Blockers", href: "/settlement-blockers-view", icon: XCircle },
    ],
  },
  {
    label: "NY Practice",
    items: [
      { label: "NY Command", href: "/ny", icon: Scale },
      { label: "No-Fault", href: "/no-fault", icon: AlertTriangle },
    ],
  },
  {
    label: "Admin Only",
    adminOnly: true,
    items: [
      { label: "Connectors", href: "/connectors", icon: Plug },
      { label: "System Health", href: "/ops-lite", icon: Server },
      { label: "Purview Bridge", href: "/purview-bridge", icon: Shield },
      { label: "Model Mesh", href: "/model-mesh", icon: Zap },
      { label: "Admin", href: "/admin", icon: Settings2 },
    ],
  },
];

export function LawyerLifeOSShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  const activeMode = TOP_MODES.find(m =>
    location === m.href || location.startsWith(m.href.split("?")[0] + "/") ||
    (m.key === "matter-desk" && location.startsWith("/matter-desk")) ||
    (m.key === "today" && location === "/today") ||
    (m.key === "prep" && location.startsWith("/prep")) ||
    (m.key === "signoff" && location.startsWith("/signoff")) ||
    (m.key === "review" && location.startsWith("/review")) ||
    (m.key === "ops" && (location.startsWith("/ops") || location.startsWith("/connectors")))
  );

  return (
    <div className="flex flex-col h-screen" style={{ background: "#080c14" }}>
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/[0.06]" style={{ background: "#0a0f18", height: "44px" }}>
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="text-[10px] text-slate-600 hover:text-slate-400 cursor-pointer">&larr; SZL</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-[#d4a054]" />
            <span className="text-xs font-semibold text-slate-200">PRISM COUNSEL</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#d4a054]/10 text-[#d4a054] border border-[#d4a054]/20 font-medium">LAWYER LIFE OS</span>
          </div>

          <nav className="flex items-center gap-0.5">
            {TOP_MODES.map(mode => {
              const Icon = mode.icon;
              const isActive = activeMode?.key === mode.key;
              return (
                <Link key={mode.key} href={mode.href}>
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer",
                    isActive
                      ? "text-slate-100"
                      : "text-slate-500 hover:text-slate-300"
                  )} style={isActive ? { background: mode.accent + "20", color: mode.accent } : {}}>
                    <Icon className="w-3 h-3" />
                    {mode.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/morning-brief">
            <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] cursor-pointer transition-colors">
              <Bell className="w-3 h-3" />
              <span>Morning Brief</span>
            </div>
          </Link>
          <Link href="/word-export">
            <div className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] cursor-pointer transition-colors">
              <Download className="w-3 h-3" />
              <span>Exports</span>
            </div>
          </Link>
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
          >
            <HelpCircle className="w-3 h-3" />
          </button>
          <div className="text-[9px] text-slate-600 font-mono">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={cn(
            "flex-shrink-0 flex flex-col border-r border-white/[0.06] transition-all duration-200 overflow-y-auto",
            collapsed ? "w-[48px]" : "w-[196px]"
          )}
          style={{ background: "#0a0f18" }}
        >
          <nav className="flex-1 py-2 space-y-3">
            {LEFT_SECTIONS.map(section => (
              <div key={section.label}>
                {!collapsed && (
                  <div className={cn(
                    "px-3 py-1 text-[9px] font-semibold uppercase tracking-wider",
                    section.adminOnly ? "text-slate-600" : "text-slate-500"
                  )}>
                    {section.label}
                    {section.adminOnly && <span className="ml-1 text-[8px] text-slate-700">(admin)</span>}
                  </div>
                )}
                {section.items.map(item => {
                  const isActive = location === item.href || (item.href.split("?")[0] !== "/matters" && location.startsWith(item.href.split("?")[0]));
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className={cn(
                        "flex items-center gap-2 px-2 py-1 mx-1 rounded text-[11px] cursor-pointer transition-colors",
                        isActive
                          ? "bg-white/[0.07] text-slate-100"
                          : section.adminOnly
                          ? "text-slate-600 hover:text-slate-400 hover:bg-white/[0.03]"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      )}>
                        <Icon className="w-3 h-3 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="border-t border-white/[0.04] p-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center py-1 text-slate-600 hover:text-slate-400 transition-colors"
            >
              {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {showExplainer && (
            <div className="mb-4 rounded-lg border border-[#4a90b8]/20 p-4 flex items-start gap-3" style={{ background: "#0c1a2e" }}>
              <HelpCircle className="w-4 h-4 text-[#4a90b8] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-slate-200 mb-1">Lawyer Life OS — How it works</div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This is your operating desk — built around how you actually work, not the software underneath it. <strong className="text-slate-300">Today</strong> shows what changed and what's at risk. <strong className="text-slate-300">Matter Desk</strong> is your unified workspace for any matter. <strong className="text-slate-300">Prep</strong> auto-assembles everything you need before a demand, mediation, or deposition. <strong className="text-slate-300">Review</strong> verifies every claim before it goes out. <strong className="text-slate-300">Sign-Off</strong> is your approval surface — clear action, clear risk. <strong className="text-slate-300">Ops</strong> handles system health without the jargon.
                </p>
                <button onClick={() => setShowExplainer(false)} className="mt-2 text-[10px] text-[#4a90b8] hover:underline">Got it</button>
              </div>
            </div>
          )}
          {children}
        </main>

        <aside className="flex-shrink-0 w-[200px] border-l border-white/[0.06] overflow-y-auto p-3 space-y-4" style={{ background: "#0a0f18" }}>
          <RightRailSection title="What Changed" icon={<Activity className="w-3 h-3 text-[#4a90b8]" />} href="/what-changed">
            <div className="space-y-1.5">
              {[
                { matter: "Rodriguez v. Natl General", change: "Reserve increase received", time: "2h ago" },
                { matter: "Chen v. Allstate", change: "IME report uploaded", time: "4h ago" },
                { matter: "Vasquez v. GEICO", change: "Discovery deadline extended", time: "6h ago" },
              ].map((c, i) => (
                <div key={i} className="text-[10px]">
                  <div className="text-slate-300 truncate">{c.matter}</div>
                  <div className="text-slate-500 truncate">{c.change}</div>
                  <div className="text-slate-600">{c.time}</div>
                </div>
              ))}
            </div>
          </RightRailSection>

          <RightRailSection title="Deadlines at Risk" icon={<Clock className="w-3 h-3 text-[#c45a4a]" />} href="/deadlines">
            <div className="space-y-1.5">
              {[
                { title: "Interrogatories — Rodriguez", days: 2, level: "critical" },
                { title: "Motion to Compel — Vasquez", days: 3, level: "high" },
                { title: "Expert Disclosure — Chen", days: 14, level: "medium" },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 truncate flex-1 mr-1">{d.title}</span>
                  <span className={cn("font-mono flex-shrink-0", d.level === "critical" ? "text-[#c45a4a]" : d.level === "high" ? "text-[#d4a054]" : "text-slate-500")}>
                    {d.days}d
                  </span>
                </div>
              ))}
            </div>
          </RightRailSection>

          <RightRailSection title="Waiting on Others" icon={<Users className="w-3 h-3 text-[#8b7ac8]" />} href="/today">
            <div className="space-y-1.5">
              {[
                { who: "National General", what: "Demand response", days: 18 },
                { who: "Dr. Martinez office", what: "Records request", days: 7 },
              ].map((w, i) => (
                <div key={i} className="text-[10px]">
                  <div className="text-slate-300 truncate">{w.who}</div>
                  <div className="text-slate-500">{w.what} · {w.days}d waiting</div>
                </div>
              ))}
            </div>
          </RightRailSection>

          <RightRailSection title="Pending Approvals" icon={<CheckSquare className="w-3 h-3 text-[#d4a054]" />} href="/signoff-queue">
            <div className="space-y-1.5">
              {[
                { title: "Chronology export — Rodriguez", type: "Sign-Off" },
                { title: "Partner update memo", type: "Sign-Off" },
              ].map((a, i) => (
                <div key={i} className="text-[10px]">
                  <div className="text-slate-300 truncate">{a.title}</div>
                  <div className="text-[#d4a054]">{a.type} needed</div>
                </div>
              ))}
            </div>
          </RightRailSection>
        </aside>
      </div>
    </div>
  );
}

function RightRailSection({ title, icon, href, children }: { title: string; icon: React.ReactNode; href: string; children: React.ReactNode }) {
  return (
    <div>
      <Link href={href}>
        <div className="flex items-center gap-1.5 mb-2 cursor-pointer hover:opacity-80 transition-opacity">
          {icon}
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        </div>
      </Link>
      {children}
    </div>
  );
}
