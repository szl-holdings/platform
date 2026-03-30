import { Link, useLocation } from "wouter";
import { Building2, LayoutDashboard, TrendingUp, Handshake, BarChart3, AlertTriangle, Home, ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      { path: "/", label: "Home", icon: Home },
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/alerts", label: "Risk & Alerts", icon: AlertTriangle },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { path: "/market", label: "Market Intel", icon: TrendingUp },
      { path: "/analytics", label: "Analytics", icon: BarChart3 },
      { path: "/investment-analysis", label: "Investment Analysis", icon: DollarSign },
    ],
  },
  {
    title: "Operations",
    items: [
      { path: "/pipeline", label: "Deal Pipeline", icon: Handshake },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "bg-terra-bg-secondary border-r border-terra-border flex flex-col h-screen sticky top-0 transition-all duration-300",
      collapsed ? "w-16" : "w-60"
    )}>
      <div className="p-4 border-b border-terra-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terra-primary to-terra-accent flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-lg font-bold text-terra-text">Terra</h1>
              <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">Real Estate Intelligence</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[10px] text-terra-text-muted uppercase tracking-wider px-3 mb-1.5 font-medium">{section.title}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ path, label, icon: Icon }) => {
                const isActive = path === "/" ? location === "/" : location.startsWith(path);
                return (
                  <Link key={path} href={path}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative overflow-hidden",
                      collapsed && "justify-center px-2",
                      isActive
                        ? "bg-terra-primary/10 text-terra-primary"
                        : "text-terra-text-secondary hover:text-terra-text hover:bg-terra-surface"
                    )}>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-terra-primary rounded-r-full" />
                      )}
                      <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "scale-110")} />
                      {!collapsed && label}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-terra-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-terra-text-muted hover:text-terra-text-secondary hover:bg-terra-surface transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> Collapse</>}
        </button>
      </div>

      <div className="p-3 border-t border-terra-border">
        <div className="flex items-center gap-2 text-[10px] text-terra-text-muted">
          <Building2 className="w-3 h-3" />
          {!collapsed && <span>SZL Holdings Platform</span>}
        </div>
      </div>
    </aside>
  );
}
