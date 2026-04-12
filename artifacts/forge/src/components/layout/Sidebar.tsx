import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, TrendingUp, Scale, Anchor, FileText,
  MessageSquare, Settings, LogOut, Shield, ChevronRight,
  Hexagon
} from "lucide-react";
import { CLIENT } from "@/data/mock";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/portfolio", label: "Portfolio", icon: TrendingUp },
  { path: "/matters", label: "Matters", icon: Scale },
  { path: "/assets", label: "Assets", icon: Anchor },
  { path: "/documents", label: "Documents", icon: FileText },
  { path: "/messages", label: "Messages", icon: MessageSquare, badge: 2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "var(--color-forge-vessels)",
  terra: "var(--color-forge-terra)",
  legal: "var(--color-forge-legal)",
  security: "var(--color-forge-security)",
};

const DOMAIN_LABELS: Record<string, string> = {
  vessels: "Maritime",
  terra: "Real Estate",
  legal: "Legal",
  security: "Security",
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <aside className="forge-sidebar flex flex-col h-full w-64 min-w-[16rem]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b" style={{ borderColor: "var(--color-forge-border)" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--color-forge-primary)", boxShadow: "0 2px 8px var(--color-forge-primary-muted)" }}
        >
          <Hexagon className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-display font-700 text-[0.9375rem] leading-none" style={{ color: "var(--color-forge-text)" }}>Forge</div>
          <div className="forge-eyebrow mt-0.5 text-[0.6rem]">Client Portal</div>
        </div>
      </div>

      {/* Client info */}
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-forge-border)", background: "hsla(210, 20%, 94%, 0.6)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-700"
            style={{ background: "var(--color-forge-gold)" }}
          >
            {CLIENT.avatarInitials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-600 truncate" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>{CLIENT.name}</div>
            <div className="text-xs truncate" style={{ color: "var(--color-forge-text-muted)" }}>{CLIENT.companyName}</div>
          </div>
          <span className="forge-badge forge-badge-gold ml-auto flex-shrink-0 text-[0.6rem]">
            {CLIENT.tier}
          </span>
        </div>
        {/* Active domains */}
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          {CLIENT.domains.map(d => (
            <span
              key={d}
              className="text-[0.625rem] font-600 px-1.5 py-0.5 rounded-sm"
              style={{
                background: `color-mix(in srgb, ${DOMAIN_COLORS[d]} 12%, transparent)`,
                color: DOMAIN_COLORS[d],
                border: `1px solid color-mix(in srgb, ${DOMAIN_COLORS[d]} 22%, transparent)`,
              }}
            >
              {DOMAIN_LABELS[d]}
            </span>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, icon: Icon, badge }) => {
          const fullPath = base + path;
          const isActive = location === path || location.startsWith(path + "/");
          return (
            <Link
              key={path}
              href={path}
              onClick={onNavigate}
              className={cn("forge-nav-item w-full", isActive && "active")}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span
                  className="text-[0.6875rem] font-700 w-5 h-5 rounded-full flex items-center justify-center text-white"
                  style={{ background: "var(--color-forge-primary)" }}
                >
                  {badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-3 h-3 opacity-50 flex-shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: "var(--color-forge-border)" }}>
        <div className="flex items-center gap-2 px-3 py-2">
          <Shield className="w-3.5 h-3.5" style={{ color: "var(--color-forge-success)" }} />
          <span className="text-xs" style={{ color: "var(--color-forge-text-muted)" }}>Encrypted session · Audit logged</span>
        </div>
        <button className="forge-btn-ghost w-full justify-start text-xs" style={{ color: "var(--color-forge-text-muted)" }}>
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
