import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Scale, LayoutDashboard, FolderOpen, TrendingUp, BookOpen,
  MessageSquare, Shield, Settings, ChevronLeft, ChevronRight,
  Gavel, Clock, FileText, Users, Eye, Building2, MapPin, AlertTriangle, Plug
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Command",
    items: [
      { label: "Dashboard", href: "/prism-counsel", icon: LayoutDashboard },
      { label: "Watchlist", href: "/prism-counsel/watchlist", icon: Eye },
      { label: "Matters", href: "/prism-counsel/matters", icon: FolderOpen },
      { label: "Forecast", href: "/prism-counsel/forecast", icon: TrendingUp },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Deadlines", href: "/prism-counsel/deadlines", icon: Clock },
      { label: "Discovery", href: "/prism-counsel/discovery", icon: FileText },
      { label: "Playbooks", href: "/prism-counsel/playbooks", icon: BookOpen },
      { label: "Approvals", href: "/prism-counsel/approvals", icon: Gavel },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "Copilot", href: "/prism-counsel/copilot", icon: MessageSquare },
      { label: "Insurer Intel", href: "/prism-counsel/insurer-intel", icon: Building2 },
      { label: "Venue Intel", href: "/prism-counsel/venue-intel", icon: MapPin },
      { label: "Parties", href: "/prism-counsel/parties", icon: Users },
    ],
  },
  {
    label: "New York",
    items: [
      { label: "NY Command", href: "/prism-counsel/ny", icon: Scale },
      { label: "No-Fault", href: "/prism-counsel/no-fault", icon: AlertTriangle },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Trust", href: "/prism-counsel/trust", icon: Shield },
      { label: "Connectors", href: "/prism-counsel/connectors", icon: Plug },
      { label: "Admin", href: "/prism-counsel/admin", icon: Settings },
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
                const isActive = location === item.href || (item.href !== "/prism-counsel" && location.startsWith(item.href));
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
