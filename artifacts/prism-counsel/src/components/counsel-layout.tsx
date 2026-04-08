import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Scale, LayoutDashboard, FolderOpen, TrendingUp, BookOpen,
  MessageSquare, Shield, Settings, ChevronLeft, ChevronRight,
  Gavel, Clock, FileText, Users, Eye, Building2, MapPin, AlertTriangle, Plug,
  Brain, Globe, Activity, Layers, Link2, DollarSign, BarChart3, Zap,
  Sun, Inbox, Download, CheckSquare, Radio, Server, Gauge, Waves, Car, Move, ClipboardList, ClipboardCheck,
  ShieldAlert, XCircle, Archive, Lock, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Daily",
    items: [
      { label: "Today", href: "/today", icon: Sun },
      { label: "What Changed", href: "/what-changed", icon: Activity },
      { label: "Review", href: "/review-before-send", icon: Eye },
      { label: "Sign-Off", href: "/signoff-queue", icon: CheckSquare },
      { label: "Export", href: "/word-export", icon: Download },
    ],
  },
  {
    label: "Command",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Watchlist", href: "/watchlist", icon: Eye },
      { label: "Matters", href: "/matters", icon: FolderOpen },
      { label: "Forecast", href: "/forecast", icon: TrendingUp },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Deadlines", href: "/deadlines", icon: Clock },
      { label: "Discovery", href: "/discovery", icon: FileText },
      { label: "Playbooks", href: "/playbooks", icon: BookOpen },
      { label: "Approvals", href: "/approvals", icon: Gavel },
    ],
  },
  {
    label: "Review Desk",
    items: [
      { label: "My Review", href: "/review-desk/my-review", icon: ClipboardCheck },
      { label: "Review Desk", href: "/review-desk", icon: ClipboardList },
      { label: "Review Metrics", href: "/review-desk/metrics", icon: BarChart3 },
      { label: "Review Admin", href: "/review-desk/admin", icon: Settings },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Copilot", href: "/copilot", icon: MessageSquare },
      { label: "Copilot Workbench", href: "/copilot-workbench", icon: Brain },
      { label: "Insurer Intel", href: "/insurer-intel", icon: Building2 },
      { label: "Venue Intel", href: "/venue-intel", icon: MapPin },
      { label: "Parties", href: "/parties", icon: Users },
    ],
  },
  {
    label: "Legal OS",
    items: [
      { label: "Worldline", href: "/worldline", icon: Globe },
      { label: "Signal Forge", href: "/signal-forge", icon: Radio },
      { label: "Pressure Graph", href: "/pressure-graph", icon: Activity },
      { label: "Data Products", href: "/data-products", icon: BarChart3 },
      { label: "Matter Twin", href: "/matter-twin", icon: Layers },
      { label: "Proof Chain", href: "/proof-chain", icon: Link2 },
      { label: "Forecast Diff", href: "/forecast-diff", icon: TrendingUp },
    ],
  },
  {
    label: "Pilot One",
    items: [
      { label: "Pressure Board", href: "/pressure-board", icon: Gauge },
      { label: "Friction Board", href: "/friction-board", icon: Waves },
      { label: "Carrier Watch", href: "/carrier-watch", icon: Building2 },
      { label: "Movement Board", href: "/movement-board", icon: Move },
      { label: "Pilot One Ops", href: "/pilot-one-admin", icon: Server },
    ],
  },
  {
    label: "Pilot Two",
    items: [
      { label: "Recovery Ops", href: "/recovery-ops", icon: ShieldAlert },
      { label: "Settlement Blockers", href: "/settlement-blockers", icon: XCircle },
      { label: "Recovery Admin", href: "/admin/recovery", icon: Server },
      { label: "Purview Bridge", href: "/admin/purview", icon: Shield },
      { label: "Quality Gates", href: "/admin/quality", icon: BarChart3 },
      { label: "M365 Integration", href: "/admin/m365", icon: Link2 },
      { label: "Ops Diagnostics", href: "/admin/ops-diagnostics", icon: Activity },
      { label: "Replays", href: "/admin/replays", icon: RefreshCw },
      { label: "Model Costs", href: "/admin/model-costs", icon: DollarSign },
      { label: "Partner View", href: "/portfolio", icon: BarChart3 },
      { label: "Pressure Board", href: "/portfolio/pressure-board", icon: Gauge },
      { label: "Friction Board", href: "/portfolio/friction-board", icon: Waves },
      { label: "Review Backlog", href: "/portfolio/review-backlog", icon: ClipboardList },
      { label: "Approval Bottleneck", href: "/portfolio/approval-bottleneck", icon: CheckSquare },
      { label: "Recovery/Lien", href: "/portfolio/recovery-lien", icon: DollarSign },
      { label: "Insurer Pressure", href: "/portfolio/insurer-pressure", icon: Building2 },
      { label: "Movement Opps", href: "/portfolio/movement-opportunity", icon: Move },
      { label: "Quiet Risk", href: "/portfolio/quiet-risk", icon: Eye },
      { label: "Team Throughput", href: "/portfolio/throughput", icon: Users },
      { label: "Digests", href: "/portfolio/digests", icon: FileText },
      { label: "Portfolio Forecast", href: "/portfolio/forecast", icon: TrendingUp },
      { label: "Partner Life OS", href: "/portfolio/partner-view", icon: Scale },
      { label: "Portfolio Admin", href: "/portfolio/admin", icon: Server },
    ],
  },
  {
    label: "New York",
    items: [
      { label: "NY Command", href: "/ny", icon: Scale },
      { label: "No-Fault", href: "/no-fault", icon: AlertTriangle },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Trust", href: "/trust", icon: Shield },
      { label: "Connectors", href: "/connectors", icon: Plug },
      { label: "Model Mesh", href: "/model-mesh", icon: Zap },
      { label: "Costs", href: "/costs", icon: DollarSign },
      { label: "Admin", href: "/admin", icon: Settings },
      { label: "Pilot Ops", href: "/pilot-admin", icon: Server },
      { label: "Observability", href: "/admin/health", icon: Server },
    ],
  },
];

export function CounselLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen" style={{ background: "#080c14" }}>
      <aside
        className={cn(
          "flex flex-col border-r border-white/[0.06] transition-all duration-200",
          collapsed ? "w-[56px]" : "w-[220px]"
        )}
        style={{ background: "#0a0f18" }}
      >
        <div className="flex items-center gap-2 px-3 py-3 border-b border-white/[0.06]">
          <Link href="/">
            <span className="text-xs text-slate-500 hover:text-slate-400 cursor-pointer">&larr; SZL</span>
          </Link>
          {!collapsed && (
            <div className="flex items-center gap-2 ml-1">
              <Scale className="w-4 h-4 text-[#d4a054]" />
              <div>
                <div className="text-xs font-semibold text-slate-200 leading-none">PRISM COUNSEL</div>
                <div className="text-[10px] text-[#d4a054] leading-none mt-0.5">MATTER OBSERVABILITY</div>
              </div>
            </div>
          )}
          {collapsed && <Scale className="w-4 h-4 text-[#d4a054] mx-auto" />}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 space-y-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-3 py-1 text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  {section.label}
                </div>
              )}
              {section.items.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href + "/"));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 mx-1 rounded text-xs cursor-pointer transition-colors",
                        isActive
                          ? "bg-white/[0.08] text-slate-100"
                          : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
