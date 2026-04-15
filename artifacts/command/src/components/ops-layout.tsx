import { useLocation } from "wouter";
import { Bell, Users, DollarSign, GitCommit, Target, Shield, BarChart2, Zap, ArrowLeft } from "lucide-react";

const NAV_ITEMS = [
  { path: "/alerts", label: "Alert Inbox", icon: Bell, badge: 7 },
  { path: "/team", label: "Team & Users", icon: Users },
  { path: "/costs", label: "Cost Analytics", icon: DollarSign },
  { path: "/changelog", label: "Release Feed", icon: GitCommit },
  { path: "/sla", label: "SLA Dashboard", icon: Target },
  { path: "/governance", label: "Governance", icon: Shield },
  { path: "/health", label: "Health Score", icon: BarChart2 },
  { path: "/digest", label: "Daily Digest", icon: Zap },
];

interface OpsLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function OpsLayout({ children, title }: OpsLayoutProps) {
  const [location, navigate] = useLocation();

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-fg-primary)" }}
    >
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{
          backgroundColor: "var(--color-bg-primary)",
          borderBottom: "1px solid var(--color-surface-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider"
            style={{ color: "var(--color-fg-muted)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <div className="h-4 w-px" style={{ backgroundColor: "var(--color-surface-border)" }} />
          <span className="text-sm font-bold tracking-[0.15em]" style={{ color: "var(--color-fg-primary)" }}>
            {title.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all"
                style={{
                  backgroundColor: active ? "var(--color-surface-base)" : "transparent",
                  border: active ? "1px solid var(--color-surface-border)" : "1px solid transparent",
                  color: active ? "var(--color-fg-primary)" : "var(--color-fg-muted)",
                }}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden lg:inline">{item.label}</span>
                {item.badge && (
                  <span
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: "var(--color-critical)", color: "#fff" }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
