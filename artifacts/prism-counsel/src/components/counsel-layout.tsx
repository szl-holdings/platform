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
    label: "Core",
    items: [
      { label: "Dashboard", href: "/prism-counsel", icon: LayoutDashboard },
      { label: "Today", href: "/prism-counsel/today", icon: Sun },
      { label: "What Changed", href: "/prism-counsel/what-changed", icon: Activity },
      { label: "Watchlist", href: "/prism-counsel/watchlist", icon: Eye },
      { label: "Matters", href: "/prism-counsel/matters", icon: FolderOpen },
      { label: "Forecast", href: "/prism-counsel/forecast", icon: TrendingUp },
      { label: "Review", href: "/prism-counsel/review-before-send", icon: Eye },
      { label: "Sign-Off", href: "/prism-counsel/signoff-queue", icon: CheckSquare },
      { label: "Export", href: "/prism-counsel/word-export", icon: Download },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Copilot", href: "/prism-counsel/copilot", icon: MessageSquare },
      { label: "Copilot Workbench", href: "/prism-counsel/copilot-workbench", icon: Brain },
      { label: "Insurer Intel", href: "/prism-counsel/insurer-intel", icon: Building2 },
      { label: "Venue Intel", href: "/prism-counsel/venue-intel", icon: MapPin },
      { label: "Parties", href: "/prism-counsel/parties", icon: Users },
      { label: "Worldline", href: "/prism-counsel/worldline", icon: Globe },
      { label: "Signal Forge", href: "/prism-counsel/signal-forge", icon: Radio },
      { label: "Pressure Graph", href: "/prism-counsel/pressure-graph", icon: Activity },
      { label: "Data Products", href: "/prism-counsel/data-products", icon: BarChart3 },
      { label: "Matter Twin", href: "/prism-counsel/matter-twin", icon: Layers },
      { label: "Proof Chain", href: "/prism-counsel/proof-chain", icon: Link2 },
      { label: "Forecast Diff", href: "/prism-counsel/forecast-diff", icon: TrendingUp },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Deadlines", href: "/prism-counsel/deadlines", icon: Clock },
      { label: "Discovery", href: "/prism-counsel/discovery", icon: FileText },
      { label: "Playbooks", href: "/prism-counsel/playbooks", icon: BookOpen },
      { label: "Approvals", href: "/prism-counsel/approvals", icon: Gavel },
      { label: "My Review", href: "/prism-counsel/review-desk/my-review", icon: ClipboardCheck },
      { label: "Review Desk", href: "/prism-counsel/review-desk", icon: ClipboardList },
      { label: "Review Metrics", href: "/prism-counsel/review-desk/metrics", icon: BarChart3 },
      { label: "Review Admin", href: "/prism-counsel/review-desk/admin", icon: Settings },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Pressure Board", href: "/prism-counsel/pressure-board", icon: Gauge },
      { label: "Friction Board", href: "/prism-counsel/friction-board", icon: Waves },
      { label: "Carrier Watch", href: "/prism-counsel/carrier-watch", icon: Building2 },
      { label: "Movement Board", href: "/prism-counsel/movement-board", icon: Move },
      { label: "Pilot One Ops", href: "/prism-counsel/pilot-one-admin", icon: Server },
      { label: "Recovery Ops", href: "/prism-counsel/recovery-ops", icon: ShieldAlert },
      { label: "Settlement Blockers", href: "/prism-counsel/settlement-blockers", icon: XCircle },
      { label: "Partner View", href: "/prism-counsel/portfolio", icon: BarChart3 },
      { label: "Review Backlog", href: "/prism-counsel/portfolio/review-backlog", icon: ClipboardList },
      { label: "Approval Bottleneck", href: "/prism-counsel/portfolio/approval-bottleneck", icon: CheckSquare },
      { label: "Recovery/Lien", href: "/prism-counsel/portfolio/recovery-lien", icon: DollarSign },
      { label: "Insurer Pressure", href: "/prism-counsel/portfolio/insurer-pressure", icon: Building2 },
      { label: "Movement Opps", href: "/prism-counsel/portfolio/movement-opportunity", icon: Move },
      { label: "Quiet Risk", href: "/prism-counsel/portfolio/quiet-risk", icon: Eye },
      { label: "Team Throughput", href: "/prism-counsel/portfolio/throughput", icon: Users },
      { label: "Digests", href: "/prism-counsel/portfolio/digests", icon: FileText },
      { label: "Portfolio Forecast", href: "/prism-counsel/portfolio/forecast", icon: TrendingUp },
      { label: "Partner Life OS", href: "/prism-counsel/portfolio/partner-view", icon: Scale },
      { label: "NY Command", href: "/prism-counsel/ny", icon: Scale },
      { label: "No-Fault", href: "/prism-counsel/no-fault", icon: AlertTriangle },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Trust", href: "/prism-counsel/trust", icon: Shield },
      { label: "Connectors", href: "/prism-counsel/connectors", icon: Plug },
      { label: "Model Mesh", href: "/prism-counsel/model-mesh", icon: Zap },
      { label: "Costs", href: "/prism-counsel/costs", icon: DollarSign },
      { label: "Admin", href: "/prism-counsel/admin", icon: Settings },
      { label: "Pilot Ops", href: "/prism-counsel/pilot-admin", icon: Server },
      { label: "Observability", href: "/prism-counsel/admin/health", icon: Server },
      { label: "Recovery Admin", href: "/prism-counsel/admin/recovery", icon: Server },
      { label: "Purview Bridge", href: "/prism-counsel/admin/purview", icon: Shield },
      { label: "Quality Gates", href: "/prism-counsel/admin/quality", icon: BarChart3 },
      { label: "M365 Integration", href: "/prism-counsel/admin/m365", icon: Link2 },
      { label: "Ops Diagnostics", href: "/prism-counsel/admin/ops-diagnostics", icon: Activity },
      { label: "Replays", href: "/prism-counsel/admin/replays", icon: RefreshCw },
      { label: "Model Costs", href: "/prism-counsel/admin/model-costs", icon: DollarSign },
      { label: "Portfolio Admin", href: "/prism-counsel/portfolio/admin", icon: Server },
    ],
  },
];

const PRISM_COLLAPSE_KEY = "prism-counsel-sidebar-collapsed";

export function CounselLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(PRISM_COLLAPSE_KEY) === "true"; } catch { return false; }
  });

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
                const isActive = location === item.href || (item.href !== "/prism-counsel" && location.startsWith(item.href + "/"));
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
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              try { localStorage.setItem(PRISM_COLLAPSE_KEY, String(next)); } catch {}
            }}
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
