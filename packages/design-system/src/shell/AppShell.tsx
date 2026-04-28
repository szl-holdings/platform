import { type ReactNode, useState } from 'react';
import { useDensity } from '../hooks/useDensity.js';
import { useScreenMode } from '../hooks/useScreenMode.js';
import { color } from '../tokens/index.js';
import { cn } from '../utils.js';

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
};

export const AEEP_NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', href: '/overview' },
  { id: 'operations', label: 'Operations', href: '/operations' },
  { id: 'search', label: 'Search', href: '/search' },
  { id: 'workflows', label: 'Workflows', href: '/workflows' },
  { id: 'evidence', label: 'Evidence', href: '/evidence' },
  { id: 'memory', label: 'Memory', href: '/memory' },
  { id: 'reports', label: 'Reports', href: '/reports' },
  { id: 'admin', label: 'Admin', href: '/admin' },
];

export interface AppShellProps {
  navItems?: NavItem[];
  activeNavItem?: string;
  nav?: ReactNode;
  topBarRight?: ReactNode;
  rightInspector?: ReactNode;
  children: ReactNode;
  tenantLabel?: string;
  defaultCollapsed?: boolean;
  className?: string;
}

export function AppShell({
  navItems = AEEP_NAV_ITEMS,
  activeNavItem,
  nav,
  topBarRight,
  rightInspector,
  children,
  tenantLabel,
  defaultCollapsed = false,
  className,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { mode: screenMode } = useScreenMode();
  const { pagePadding } = useDensity();
  const sideNavWidth = collapsed ? '56px' : '220px';

  return (
    <div
      className={cn('flex h-screen w-full overflow-hidden', className)}
      style={{ background: color.bg.base }}
    >
      <aside
        className="flex-shrink-0 flex flex-col border-r"
        style={{
          width: sideNavWidth,
          background: color.bg.surface,
          borderColor: color.border.subtle,
          transition: 'width 150ms cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        <div
          className="flex items-center gap-2 px-3 border-b"
          style={{ height: '48px', borderColor: color.border.subtle }}
        >
          <div
            className="flex-shrink-0 rounded"
            style={{ width: '24px', height: '24px', background: color.accent.blue }}
          />
          {!collapsed && (
            <span className="font-semibold text-sm" style={{ color: color.text.primary }}>
              SZL Holdings
            </span>
          )}
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          {nav ?? (
            <div className="flex flex-col gap-0.5 px-2">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-2 px-2 rounded text-sm transition-colors"
                  style={{
                    height: '34px',
                    background: activeNavItem === item.id ? color.bg.active : 'transparent',
                    color: activeNavItem === item.id ? color.text.primary : color.text.secondary,
                    textDecoration: 'none',
                  }}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge !== undefined && (
                    <span
                      className="ml-auto text-xs rounded-full px-1.5"
                      style={{
                        background: color.border.default,
                        color: color.text.secondary,
                        minWidth: '20px',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center border-t"
          style={{
            height: '40px',
            borderColor: color.border.subtle,
            color: color.text.muted,
            background: 'transparent',
            cursor: 'pointer',
          }}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          <span style={{ fontSize: '12px' }}>{collapsed ? '→' : '←'}</span>
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="flex-shrink-0 flex items-center gap-3 px-4 border-b"
          style={{ height: '48px', background: color.bg.surface, borderColor: color.border.subtle }}
        >
          {tenantLabel && (
            <div
              className="flex items-center gap-2 px-2 rounded text-xs"
              style={{
                background: color.bg.overlay,
                border: `1px solid ${color.border.default}`,
                color: color.text.secondary,
                height: '26px',
              }}
            >
              <span
                className="rounded-full"
                style={{ width: '6px', height: '6px', background: color.accent.green }}
              />
              {tenantLabel}
            </div>
          )}

          <div
            className="flex items-center gap-1 px-2 rounded text-xs capitalize"
            style={{
              background: color.bg.overlay,
              border: `1px solid ${color.border.default}`,
              color: color.text.secondary,
              height: '26px',
            }}
          >
            {screenMode}
          </div>

          <div className="flex-1" />

          <button
            type="button"
            aria-label="Search or run a command (⌘K)"
            aria-keyshortcuts="Meta+k"
            className="flex items-center gap-2 px-3 rounded text-xs"
            style={{
              background: color.bg.overlay,
              border: `1px solid ${color.border.default}`,
              color: color.text.secondary,
              height: '30px',
              cursor: 'pointer',
            }}
          >
            <span aria-hidden="true">Search or run command…</span>
            <kbd
              aria-hidden="true"
              className="rounded px-1"
              style={{
                background: color.border.subtle,
                color: color.text.muted,
                fontSize: '10px',
              }}
            >
              ⌘K
            </kbd>
          </button>

          {topBarRight}
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto"
            style={{ padding: pagePadding, background: color.bg.base }}
          >
            {children}
          </main>

          {rightInspector && (
            <aside
              className="flex-shrink-0 border-l overflow-y-auto"
              style={{
                width: '320px',
                background: color.bg.surface,
                borderColor: color.border.subtle,
              }}
            >
              {rightInspector}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
