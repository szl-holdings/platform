import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Network, BarChart3, FileStack, Shield, Settings, Database,
  ChevronLeft, ChevronRight, Scale, Bell, Search, Menu, X
} from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useUserPreferences } from "@szl-holdings/shared-ui";
import { GettingStartedChecklist } from "@szl-holdings/shared-ui/onboarding";
import { PRISM_ONBOARDING_CONFIG } from "@/onboarding-config";

const ACCENT = "#a78bfa";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    id: "command",
    label: "Command",
    items: [
      { id: "matters", label: "Matter Board", icon: <LayoutDashboard className="w-3.5 h-3.5" />, href: "/matters", badge: "6" },
      { id: "obligation-graph", label: "Obligation Graph", icon: <Network className="w-3.5 h-3.5" />, href: "/obligation-graph" },
      { id: "deadline-heatmap", label: "Deadline Heatmap", icon: <BarChart3 className="w-3.5 h-3.5" />, href: "/deadline-heatmap" },
      { id: "proof-chain", label: "Proof Chain Export", icon: <FileStack className="w-3.5 h-3.5" />, href: "/proof-chain" },
      { id: "evidence", label: "Evidence", icon: <Database className="w-3.5 h-3.5" />, href: "/evidence" },
    ],
  },
  {
    id: "governance",
    label: "Governance",
    items: [
      { id: "privilege", label: "Privilege Controls", icon: <Shield className="w-3.5 h-3.5" />, href: "/privilege" },
      { id: "audit", label: "Audit Trail", icon: <Scale className="w-3.5 h-3.5" />, href: "/audit" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    items: [
      { id: "settings", label: "Settings", icon: <Settings className="w-3.5 h-3.5" />, href: "/settings" },
    ],
  },
];

export function PrismLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { prefs, setPreference, isLoaded } = useUserPreferences();
  const [collapsed, setCollapsed] = useState(() => prefs.sidebar_collapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const userOverriddenSidebarRef = useRef(false);

  useEffect(() => {
    if (isLoaded && !userOverriddenSidebarRef.current) {
      setCollapsed(prefs.sidebar_collapsed);
    }
  }, [isLoaded, prefs.sidebar_collapsed]);

  const toggle = useCallback(() => {
    userOverriddenSidebarRef.current = true;
    setCollapsed((v) => {
      const next = !v;
      setPreference("sidebar_collapsed", next);
      return next;
    });
  }, [setPreference]);

  const isActive = (href: string) => {
    const clean = location.replace(/\/$/, "") || "/";
    return clean === href || clean.startsWith(href + "/");
  };

  const SidebarContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className={cn("flex items-center gap-3 px-4 py-4 border-b border-white/5 shrink-0", collapsed && "justify-center px-2")}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)" }}>
          <Scale className="w-3.5 h-3.5" style={{ color: ACCENT }} />
        </div>
        {!collapsed && (
          <div>
            <p className="text-xs font-semibold tracking-wide font-display" style={{ color: ACCENT }}>PRISM</p>
            <p className="text-[10px] text-white/30 -mt-0.5">Legal Command</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            {!collapsed && (
              <p className="text-[9px] font-semibold uppercase tracking-widest text-white/20 px-2 mb-1">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    onClick={onItemClick}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all",
                      active
                        ? "text-white/90"
                        : "text-white/40 hover:text-white/70 hover:bg-white/5",
                      collapsed && "justify-center px-2"
                    )}
                    style={active ? { background: "rgba(167,139,250,0.12)", color: ACCENT } : {}}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={cn("shrink-0", active ? "" : "opacity-70")} style={active ? { color: ACCENT } : {}}>
                      {item.icon}
                    </span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.15)", color: ACCENT }}>
                        {item.badge}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && PRISM_ONBOARDING_CONFIG.checklist && (
        <div className="shrink-0 px-3 pt-2 pb-1 border-t border-white/5">
          <GettingStartedChecklist
            appId={PRISM_ONBOARDING_CONFIG.appId}
            appName={PRISM_ONBOARDING_CONFIG.appName}
            items={PRISM_ONBOARDING_CONFIG.checklist}
            accentColor={PRISM_ONBOARDING_CONFIG.accentColor}
            collapsed
          />
        </div>
      )}

      <div className="shrink-0 p-3 border-t border-white/5">
        <button
          onClick={toggle}
          className={cn("flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all", collapsed && "justify-center")}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <><ChevronLeft className="w-3.5 h-3.5" /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#080810" }}>
      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 border-r border-white/5 transition-all duration-200",
          collapsed ? "w-12" : "w-52"
        )}
        style={{ background: "#0a0a14" }}
      >
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 flex flex-col border-r border-white/5" style={{ background: "#0a0a14" }}>
            <div className="absolute top-3 right-3">
              <button onClick={() => setMobileOpen(false)} className="p-1 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <SidebarContent onItemClick={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 shrink-0" style={{ background: "#0a0a14" }}>
          <button
            className="md:hidden p-1.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center gap-2 max-w-xs">
            <div className="flex items-center gap-2 flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-white/30">
              <Search className="w-3 h-3 shrink-0" />
              <span>Search matters…</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="relative p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "#ef4444" }} />
            </button>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: "rgba(167,139,250,0.15)", color: ACCENT }}>P</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
