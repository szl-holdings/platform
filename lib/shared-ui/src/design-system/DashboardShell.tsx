import * as React from "react";
import { cn } from "../utils";

export interface DashboardShellProps {
  sidebar?: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sidebarWidth?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  accentColor?: string;
}

export function DashboardShell({
  sidebar,
  topbar,
  children,
  className,
  sidebarWidth = "240px",
  collapsible = false,
  defaultCollapsed = false,
  accentColor = "hsl(215 45% 32%)",
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

  return (
    <div
      className={cn(
        "flex h-screen overflow-hidden bg-neutral-950 text-white",
        className
      )}
    >
      {sidebar && (
        <aside
          className={cn(
            "shrink-0 flex flex-col border-r border-white/8 bg-neutral-900 overflow-y-auto transition-all duration-300",
            collapsed ? "w-16" : undefined
          )}
          style={{ width: collapsed ? "64px" : sidebarWidth }}
          aria-label="Sidebar navigation"
        >
          {collapsible && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="self-end m-2 p-1.5 rounded hover:bg-white/8 text-white/40 hover:text-white transition-colors"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? "→" : "←"}
            </button>
          )}
          {sidebar}
        </aside>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {topbar && (
          <div
            className="shrink-0 h-14 flex items-center px-6 border-b border-white/8 bg-neutral-900/80 backdrop-blur-md"
            role="banner"
          >
            {topbar}
          </div>
        )}
        <main className="flex-1 overflow-auto" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
