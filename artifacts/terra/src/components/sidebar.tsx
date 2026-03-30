import { Link, useLocation } from "wouter";
import { Building2, LayoutDashboard, AlertTriangle, Home, ChevronLeft, ChevronRight, Users, Brain, Zap, FileText, ClipboardList, DollarSign, Activity, List, UserCheck, ArrowLeftRight } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { useState } from "react";
import { UserButton } from "@workspace/shared-ui/UserButton";

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Command",
    items: [
      { path: "/", label: "Command Center", icon: LayoutDashboard },
    ],
  },
  {
    title: "Pipeline",
    items: [
      { path: "/listings", label: "Listings", icon: Home },
      { path: "/leads", label: "Leads + CRM", icon: UserCheck },
      { path: "/deals", label: "Deal Pipeline", icon: Activity },
      { path: "/offers", label: "Offers + Negotiation", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Operations",
    items: [
      { path: "/transactions", label: "Transactions", icon: ClipboardList },
      { path: "/documents", label: "Docs + Compliance", icon: FileText },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { path: "/team", label: "Team Performance", icon: Users },
      { path: "/predictions", label: "Nimbus Intelligence", icon: Brain },
    ],
  },
  {
    title: "Platform",
    items: [
      { path: "/automations", label: "AlloyScape", icon: Zap },
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
      <div className="p-5 border-b border-terra-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-terra-primary to-terra-accent flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-lg font-bold text-terra-text">Terra</h1>
              <p className="text-[10px] text-terra-text-muted uppercase tracking-wider">Brokerage OS</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[10px] text-terra-text-muted uppercase tracking-wider px-3 mb-1.5 font-medium">{section.title}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ path, label, icon: Icon, badge }) => {
                const isActive = path === "/" ? location === "/" : location.startsWith(path);
                return (
                  <Link key={path} href={path}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer relative overflow-hidden",
                      collapsed && "justify-center px-2",
                      isActive
                        ? "bg-terra-primary/10 text-terra-primary"
                        : "text-terra-text-secondary hover:text-terra-text hover:bg-terra-surface"
                    )}>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-terra-primary rounded-r-full" />
                      )}
                      <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "scale-110")} />
                      {!collapsed && (
                        <span className="ml-0.5 flex-1">{label}</span>
                      )}
                      {!collapsed && badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 flex-shrink-0">{badge}</span>
                      )}
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

      <div className="p-3 border-t border-terra-border space-y-2">
        <UserButton showName={!collapsed} className="w-full" />
        <div className="flex items-center gap-2 text-[10px] text-terra-text-muted">
          <Building2 className="w-3 h-3" />
          {!collapsed && <span>SZL Holdings Platform</span>}
        </div>
      </div>
    </aside>
  );
}
