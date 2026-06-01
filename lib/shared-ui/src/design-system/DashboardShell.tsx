import * as React from 'react';
import { colors, spacing } from '../tokens';
import { cn, toAlpha } from '../utils';

export interface DashboardShellTheme {
  accentColor?: string;
  accentMuted?: string;
  sidebarBg?: string;
  headerBg?: string;
  pageBg?: string;
}

export interface DashboardShellProps {
  sidebar?: React.ReactNode;
  topbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  sidebarWidth?: string;
  sidebarClassName?: string;
  sidebarEvents?: Pick<React.HTMLAttributes<HTMLElement>, 'onMouseEnter' | 'onMouseLeave'>;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  collapseStorageKey?: string;
  accentColor?: string;
  theme?: DashboardShellTheme;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DashboardShell({
  sidebar,
  topbar,
  children,
  className,
  sidebarWidth = spacing.layout.sidebarWidth,
  sidebarClassName,
  sidebarEvents,
  collapsible = false,
  defaultCollapsed = false,
  collapseStorageKey,
  theme,
  mobileOpen = false,
  onMobileClose,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = React.useState(() => {
    if (collapsible && collapseStorageKey) {
      try {
        const stored = localStorage.getItem(collapseStorageKey);
        if (stored !== null) return stored === 'true';
      } catch {}
    }
    return defaultCollapsed;
  });

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      if (collapsible && collapseStorageKey) {
        try {
          localStorage.setItem(collapseStorageKey, String(next));
        } catch {}
      }
      return next;
    });
  }, [collapsible, collapseStorageKey]);

  const sidebarBg = theme?.sidebarBg ?? '#0a0c10';
  const headerBg = theme?.headerBg ?? toAlpha('#0a0c10', 0.92);
  const pageBg = theme?.pageBg ?? '#070810';

  return (
    <div
      className={cn('flex h-screen overflow-hidden text-white', className)}
      style={{ background: pageBg }}
    >
      {sidebar && (
        <>
          {mobileOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-20 md:hidden"
              onClick={onMobileClose}
              aria-hidden="true"
            />
          )}
          <aside
            className={cn(
              'shrink-0 flex flex-col overflow-y-auto transition-all duration-300 z-30',
              'fixed md:relative inset-y-0 left-0 h-screen',
              mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
              sidebarClassName,
            )}
            style={{
              width: collapsed ? spacing.layout.sidebarWidthCollapsed : sidebarWidth,
              background: sidebarBg,
              borderRight: `1px solid ${colors.border.DEFAULT}`,
            }}
            aria-label="Sidebar navigation"
            {...sidebarEvents}
          >
            {collapsible && (
              <button
                onClick={toggleCollapsed}
                className="self-end m-2 p-1.5 rounded-lg transition-colors hover:bg-white/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsla(210_60%_58%_/_0.4)]"
                style={{ color: colors.text.muted }}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  {collapsed ? (
                    <path
                      d="M5 2l4 5-4 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <path
                      d="M9 2L5 7l4 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </button>
            )}
            {sidebar}
          </aside>
        </>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {topbar && (
          <div
            className="shrink-0 flex items-center px-6 backdrop-blur-md"
            role="banner"
            style={{
              height: spacing.layout.headerHeight,
              background: headerBg,
              borderBottom: `1px solid ${colors.border.DEFAULT}`,
            }}
          >
            {topbar}
          </div>
        )}
        <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
